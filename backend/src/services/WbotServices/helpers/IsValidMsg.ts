import { WAMessage, proto } from "@whiskeysockets/baileys";
import { Message as WbotMessage } from "whatsapp-web.js";

const isValidMsg = (msg: WbotMessage): boolean => {
  if (msg.from === "status@broadcast") return false;
  if (
    msg.type === "chat" ||
    msg.type === "audio" ||
    msg.type === "ptt" ||
    msg.type === "video" ||
    msg.type === "image" ||
    msg.type === "document" ||
    msg.type === "vcard" ||
    msg.type === "sticker"
  )
    return true;
  return false;
};

export const isValidBaileys = (msg: WAMessage): boolean => {
  if (msg.message?.protocolMessage) return false;
  if (msg.broadcast) return false;
  if (
    msg.message?.extendedTextMessage ||
    msg.message?.conversation ||
    msg.message?.audioMessage ||
    msg.message?.videoMessage ||
    msg.message?.imageMessage ||
    msg.message?.documentMessage ||
    msg.message?.contactMessage ||
    msg.message?.stickerMessage
  )
    return true;
  return false;

};

export default isValidMsg;
