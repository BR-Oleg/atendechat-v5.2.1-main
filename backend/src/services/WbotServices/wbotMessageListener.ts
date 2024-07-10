import { Client } from "whatsapp-web.js";

import HandleMessage from "./helpers/HandleMessage";
import HandleMsgAck from "./helpers/HandleMsgAck";
import VerifyCall from "./VerifyCall";
import { MessageUpsertType, proto, WAMessage, WAMessageStubType, WAMessageUpdate, WASocket } from "@whiskeysockets/baileys";
import Message from "../../models/Message";
import * as Sentry from "@sentry/node";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";
import Campaign from "../../models/Campaign";
import Ticket from "../../models/Ticket";
import { isValidBaileys } from "./helpers/IsValidMsg";
import whatsapp from './../../../../frontend/src/store/modules/whatsapp';
import Whatsapp from "../../models/Whatsapp";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import Setting from "../../models/Setting";
import Contact from './../../models/Contact';
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import VerifyMessage from "./helpers/VerifyMessage";
import { VerifyContactBaileys, VerifyMessageBaileys, VerifyMediaMessageBaileys, getBodyMessage } from "./helpers/VerifyContactBaileys";
import Queue from "../../libs/Queue";
import verifyBusinessHours from "./helpers/VerifyBusinessHours";
import VerifyStepsChatFlowTicket from "../ChatFlowServices/VerifyStepsChatFlowTicket";
import socketEmit from "../../helpers/socketEmit";

interface Session extends Client {
  id: number;
}

// Baileys
type SessionWA = WASocket & {
  id?: number;
};

interface ImessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
}

const wbotMessageListener = (wbot: Session): void => {
  // const queue = `whatsapp::${wbot.id}`;
  wbot.on("message_create", async msg => {
    // desconsiderar atualização de status
    if (msg.isStatus) {
      return;
    }
    HandleMessage(msg, wbot);
  });

  wbot.on("media_uploaded", async msg => {
    HandleMessage(msg, wbot);
  });

  wbot.on("message_ack", async (msg, ack) => {
    HandleMsgAck(msg, ack);
  });

  wbot.on("call", async call => {
    VerifyCall(call, wbot);
  });
};


// Naileys

const filterMessages = (msg: WAMessage): boolean => {
  if (msg.message?.protocolMessage) return false;
  if (
    [
      WAMessageStubType.REVOKE,
      WAMessageStubType.E2E_DEVICE_CHANGED,
      WAMessageStubType.E2E_IDENTITY_CHANGED,
      WAMessageStubType.CIPHERTEXT
    ].includes(msg.messageStubType as WAMessageStubType)
  )
    return false;

  return true;
};

const wbotMessageListenerBaileys = (wbot: SessionWA, whatsapp: Whatsapp): void => {
  try {
    wbot.ev.on("messages.upsert", async (messageUpsert: ImessageUpsert) => {

      const messages = messageUpsert.messages
        .filter(filterMessages)
        .map(msg => msg);

      if (!messages) return;

      messages.forEach(async (message: WAMessage) => {

        const messageType = Object.keys(message.message as proto.IMessage)[0]

        await handleMessageBaileys(wbot, message, whatsapp.id)

        const messageExists = await Message.count({
          where: { messageId: message.key.id!, tenantId: whatsapp.tenantId }
        });

        if (!messageExists) {

          const body = await getBodyMessage(message);
          const isCampaign = /\u200c/.test(body!);

          if (!isCampaign) {
            await handleMessageBaileys(wbot, message, whatsapp.id);
          }

        }
      });
    });

    wbot.ev.on("messages.update", (messageUpdate: WAMessageUpdate[]) => {
      if (messageUpdate.length === 0) return;
      messageUpdate.forEach(async (message: WAMessageUpdate) => {

        let ack: any;
        if (message.update.status === 3 && message?.key?.fromMe) {
          ack = 2;
        } else {
          ack = message.update.status;
        }

        handleMsgAckBaileys(message, ack);
      });
    });


    wbot.ev.on('message-receipt.update', (events: any) => {
      events.forEach(async (msg: any) => {
        const ack = msg?.receipt?.receiptTimestamp ? 3 :
          msg?.receipt?.readTimestamp ? 4 : 0;
        if (!ack) return;
        await handleMsgAckBaileys(msg, ack);
      });
    })


  } catch (error) {
    Sentry.captureException(error);
    logger.error(`Error handling wbot message listener. Err: ${error}`);
  }
};


const handleMsgAckBaileys = async (
  msg: WAMessage,
  chat: number | null | undefined
) => {
  await new Promise((r) => setTimeout(r, 500));

  try {
    const messageToUpdate = await Message.findOne({
      where: {
        messageId: String(msg.key.id),
      },
      include: [
        "contact",
        {
          model: Ticket,
          as: "ticket",
          attributes: ["id", "tenantId", "apiConfig"]
        },
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"],
        },
      ],
    });
    if (!messageToUpdate) return;
    await messageToUpdate.update({ ack: chat });
    socketEmit({
      tenantId: messageToUpdate.tenantId,
      type: "chat:ack",
      payload: messageToUpdate
    });

  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack. Err: ${err}`);
  }
};

const handleMessageBaileys = async (wbot: SessionWA, msg: WAMessage, whatsAppId: number) => {

  if (!isValidBaileys(msg)) {
    return;
  }

  const whatsapp = await ShowWhatsAppService({ id: whatsAppId });

  const { tenantId, isDeleted } = whatsapp;

  // valida se o whatsapp está deletado
  if (isDeleted) {
    return;
  }

  // const chat = await msg.getChat();
  // IGNORAR MENSAGENS DE GRUPO
  const Settingdb = await Setting.findOne({
    where: { key: "ignoreGroupMsg", tenantId }
  });

  if (
    Settingdb?.value === "enabled" &&
    (isGroup(msg) || msg.broadcast)
  ) {
    return;
  }
  // IGNORAR MENSAGENS DE GRUPO

  try {

    let groupContact: Contact | undefined;

    const ppUrl = await wbot.profilePictureUrl(msg.key.remoteJid!)

    if (isGroup(msg)) {
      groupContact = await VerifyContactBaileys(msg, tenantId, ppUrl!, true);
    }

    const unreadMessages = msg.key.fromMe ? 0 : 1;

    const contact = await VerifyContactBaileys(msg, tenantId, ppUrl!);

    const ticket = await FindOrCreateTicketService({
      contact,
      whatsappId: whatsAppId,
      unreadMessages,
      tenantId,
      groupContact,
      msg,
      channel: "whatsapp"
    });

    if (ticket?.isCampaignMessage) {
      return;
    }

    if (ticket?.isFarewellMessage) {
      return;
    }

    if (msg.message?.imageMessage ||
      msg.message?.audioMessage ||
      msg.message?.videoMessage ||
      msg.message?.stickerMessage ||
      msg.message?.documentMessage ||
      msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage) {
      await VerifyMediaMessageBaileys(msg, ticket, contact);
    } else {
      await VerifyMessageBaileys(msg, msg.key.fromMe!, ticket, contact);
    }

    const isBusinessHours = await verifyBusinessHours(msg, ticket);

    if (isBusinessHours) await VerifyStepsChatFlowTicket(msg, ticket);

    const apiConfig: any = ticket.apiConfig || {};
    if (
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !ticket.answered &&
      apiConfig?.externalKey &&
      apiConfig?.urlMessageStatus
    ) {
      const payload = {
        timestamp: Date.now(),
        msg,
        messageId: msg.key.id,
        ticketId: ticket.id,
        externalKey: apiConfig?.externalKey,
        authToken: apiConfig?.authToken,
        type: "hookMessage"
      };
      Queue.add("WebHooksAPI", {
        url: apiConfig.urlMessageStatus,
        type: payload.type,
        payload
      });
    }
  } catch (err) {
    logger.error(err);
  }
}

const isGroup = (msg: WAMessage): boolean => {
  return msg.key.remoteJid?.indexOf("@g.us")! > 0
}

export { wbotMessageListener, HandleMessage, wbotMessageListenerBaileys };
