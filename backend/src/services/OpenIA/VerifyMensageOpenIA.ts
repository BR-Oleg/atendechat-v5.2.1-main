import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import { sendMessageToIA } from "../../restClients/openIARestClient";
import queueValidation from "../../utils/queueValidation";
import CreateMessageSystemService from "../MessageServices/CreateMessageSystemService";
import { Message as WbotMessage } from "whatsapp-web.js";
import Whatsapp from "../../models/Whatsapp";
import UpdateQueueIATicket from "../TicketServices/UpdateQueueIATicket";

const VerifyMensageOpenIA = async (
    menssage: any,
    msg: WbotMessage | any,
    ticket: Ticket,
    whatsapp: any
): Promise<void> => {
    if (
        ticket.status === "pending" &&
        !msg.fromMe &&
        !ticket.isGroup &&
        !ticket.answered &&
        ticket.is_chat_ia
    ) {

        try {
            const contact = await Contact.findByPk(ticket.contactId)
            const whatsapp = await Whatsapp.findByPk(ticket.whatsappId)

            let response = await sendMessageToIA({
                message: {
                    id: menssage.id,
                    contact_name: contact!.name,
                    ticket_id: ticket.id,
                    body: msg.body,
                    sender_number: whatsapp!.number,
                    receiver_number: contact!.number
                }
            })

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
                await UpdateQueueIATicket(whatsapp!.queue_transf, ticket)
            }

        } catch (error) {
            console.log(error)
        }
    }

};

export default VerifyMensageOpenIA;