
import Queue from '../libs/Queue';
import ShowWhatsAppService from '../services/WhatsappService/ShowWhatsAppService';
export default async function queueValidation(whatsappId: number | string, tenantId: number | string) {

    const whatsapp = await ShowWhatsAppService({ id: whatsappId })

    if (whatsapp.type === "whatsapp") {
        Queue.add("SendMessages", { sessionId: whatsappId, tenantId });
    }
}