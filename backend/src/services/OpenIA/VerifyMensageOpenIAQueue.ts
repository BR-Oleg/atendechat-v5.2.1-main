import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import { sendMessageToIA } from "../../restClients/openIARestClient";
import queueValidation from "../../utils/queueValidation";
import CreateMessageSystemService from "../MessageServices/CreateMessageSystemService";
import { Message as WbotMessage } from "whatsapp-web.js";
import Whatsapp from "../../models/Whatsapp";
import UpdateQueueIATicket from "../TicketServices/UpdateQueueIATicket";
import Queue from "../../models/Queue";
import ContactWallet from "../../models/ContactWallet";

const VerifyMensageOpenIAQueue = async (
    ticket: Ticket,
    queue: Queue | any,
    firstMessage: boolean = false,
    isQueue: boolean = false,
    menssage?: any,
    msg?: WbotMessage | any,
): Promise<void> => {
    if (
        ticket.status === "pending" &&
        !ticket.isGroup &&
        !ticket.answered &&
        ticket.is_chat_ia &&
        queue.from_ia
    ) {

        if (msg && msg.fromMe) return

        const wallet = await ContactWallet.findOne({
            where: {
                contactId: ticket.contactId
            }
        })

        if (!!wallet) {
            await UpdateQueueIATicket(null, ticket, wallet.walletId)
            return;
        }

        try {
            const contact = await Contact.findByPk(ticket.contactId)
            const whatsapp = await Whatsapp.findByPk(ticket.whatsappId)

            let response;

            if (firstMessage) {
                response = await sendMessageToIA({
                    message: {
                        id: "primeira mensagem",
                        contact_name: contact!.name,
                        ticket_id: ticket.id,
                        body: "Olá",
                        sender_number: whatsapp!.number,
                        receiver_number: contact!.number
                    }
                })
            } else {
                response = await sendMessageToIA({
                    message: {
                        id: menssage.id,
                        contact_name: contact!.name,
                        ticket_id: ticket.id,
                        body: msg.body,
                        sender_number: whatsapp!.number,
                        receiver_number: contact!.number
                    }
                })
            }

            response = JSON.parse(response)
            // console.log('response', response)

            const messageData = {
                body: response.message.answer,
                fromMe: true,
                read: true,
                sendType: "bot"
            };

            await CreateMessageSystemService({
                msg: messageData,
                tenantId: ticket.tenantId,
                ticket,
                sendType: messageData.sendType,
                status: "pending"
            });

            queueValidation(ticket.whatsappId, ticket.tenantId);

            if (response.message.typeMessage == "Transfer") {
                const queue = isQueue ? ticket.queueId : whatsapp!.queue_transf
                await UpdateQueueIATicket(queue, ticket)
            }

        } catch (error) {
            console.log(error)
        }
    }

};

export default VerifyMensageOpenIAQueue;