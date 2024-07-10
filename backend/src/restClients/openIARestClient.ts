import axios from "axios";

interface MessageIAInterface {
    message: {
        id: string;
        contact_name: string;
        ticket_id: number;
        body: string;
        sender_number: string;
        receiver_number: string;
    }
}

export const sendMessageToIA = async (request: MessageIAInterface): Promise<any> => {
    try {
        const response = await axios.post(`${process.env.OPEN_IA_URL}/message_sisnetsul`, { ...request });
        return handleSucces(response);
    } catch (error) {
        return handleError(error);
    }
}


const handleError = (error) => {
    return error.response.data;
}

const handleSucces = (response) => {
    return response.data;
}
