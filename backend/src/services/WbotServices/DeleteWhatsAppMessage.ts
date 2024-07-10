// import AppError from "../../errors/AppError";
// import GetWbotMessage from "../../helpers/GetWbotMessage";
// import Message from "../../models/Message";
// import Ticket from "../../models/Ticket";
// import { StartWhatsAppSessionVerify } from "./StartWhatsAppSessionVerify";
// import { getIO } from "../../libs/socket";

// const DeleteWhatsAppMessage = async (
//   id: string,
//   messageId: string,
//   tenantId: string | number
// ): Promise<void> => {
//   if (!messageId || messageId === "null") {
//     await Message.update(
//       {
//         isDeleted: true,
//         status: "canceled"
//       },
//       { where: { id } }
//     );
//     const message = await Message.findByPk(id, {
//       include: [
//         {
//           model: Ticket,
//           as: "ticket",
//           include: ["contact"],
//           where: { tenantId }
//         }
//       ]
//     });
//     if (message) {
//       const io = getIO();
//       // .to(`tenant:${tenantId}:notification`)
//       io.to(`tenant:${tenantId}:${message.ticket.id}`).emit(
//         `tenant:${tenantId}:appMessage`,
//         {
//           action: "update",
//           message,
//           ticket: message.ticket,
//           contact: message.ticket.contact
//         }
//       );
//     }
//     return;
//   }
//   const message = await Message.findOne({
//     where: { messageId },
//     include: [
//       {
//         model: Ticket,
//         as: "ticket",
//         include: ["contact"],
//         where: { tenantId }
//       }
//     ]
//   });

//   if (!message) {
//     throw new AppError("No message found with this ID.");
//   }

//   const { ticket } = message;

//   const messageToDelete = await GetWbotMessage(ticket, messageId);

//   try {
//     if (!messageToDelete) {
//       throw new AppError("ERROR_NOT_FOUND_MESSAGE");
//     }
//     await messageToDelete.delete(true);
//   } catch (err) {
//     // StartWhatsAppSessionVerify(ticket.whatsappId, err);
//     throw new AppError("ERR_DELETE_WAPP_MSG");
//   }

//   await message.update({ isDeleted: true });

//   const io = getIO();
//   // .to(`tenant:${tenantId}:notification`)
//   io.to(`tenant:${tenantId}:${message.ticket.id}`).emit(
//     `tenant:${tenantId}:appMessage`,
//     {
//       action: "update",
//       message,
//       contact: ticket.contact
//     }
//   );
// };

// export default DeleteWhatsAppMessage;

import { proto, WASocket } from "@whiskeysockets/baileys";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import GetTicketWbot from "../../helpers/GetTicketWbotBaileys";
import GetWbotMessage from "../../helpers/GetWbotMessageBaileys";


const DeleteWhatsAppMessage = async (messageId: string): Promise<Message> => {

  const message = await Message.findOne({
    where: { id: messageId },
    include: [
      {
        model: Ticket,
        as: "ticket",
        include: ["contact"]
      }
    ]
  });

  if (!message) {
    throw new AppError("No message found with this ID.");
  }

  const { ticket } = message;

  const messageToDelete = await GetWbotMessage(ticket, messageId);

  try {
    const wbot = await GetTicketWbot(ticket);
    const menssageDelete = messageToDelete as Message;

    const jsonStringToParse = JSON.parse(menssageDelete.dataJson)

    await (wbot as WASocket).sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
      delete: jsonStringToParse.key
    })

  } catch (err) {
    console.log(err);
    throw new AppError("ERR_DELETE_WAPP_MSG");
  }
  await message.update({ isDeleted: true });

  return message;
};

export default DeleteWhatsAppMessage;