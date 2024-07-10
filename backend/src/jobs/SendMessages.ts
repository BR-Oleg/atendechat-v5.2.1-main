/* eslint-disable @typescript-eslint/no-explicit-any */
// import { v4 as uuid } from "uuid";
// import { getWbot } from "../libs/wbot";
import { getWbot } from "../libs/wbot-baileys";
import SendMessagesSystemWbotBaileys from "../services/WbotServices/SendMessagesSystemWbotBaileys";
// import SendMessagesSystemWbot from "../services/WbotServices/SendMessagesSystemWbot";
import { logger } from "../utils/logger";

const sending: any = {};

export default {
  key: "SendMessages",
  options: {
    delay: 500,
    attempts: 50,
    removeOnComplete: true,
    removeOnFail: false,
    backoff: {
      type: "fixed",
      delay: 5000 // 3 min
    }
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  // async handle({ data }: any) {
  //   try {
  //     logger.info(`Sending Tenant Initiated: ${data.tenantId}`);
  //     if (sending[data.tenantId]) return;
  //     const wbot = getWbot(data.sessionId);
  //     sending[data.tenantId] = true;
  //     await SendMessagesSystemWbot(wbot, data.tenantId);
  //     sending[data.tenantId] = false;
  //     logger.info(`Finalized Sending Tenant: ${data.tenantId}`);
  //   } catch (error) {
  //     logger.error({ message: "Error send messages", error });
  //     sending[data.tenantId] = false;
  //     throw new Error(error);
  //   }
  // }

  async handle({ data }: any) {
    try {
      logger.info(`Sending Tenant Initiated: ${data.tenantId}`);
      if (sending[data.tenantId]) return;
      const wbot = getWbot(data.sessionId);
      sending[data.tenantId] = true;
      await SendMessagesSystemWbotBaileys(wbot, data.tenantId);
      sending[data.tenantId] = false;
      logger.info(`Finalized Sending Tenant: ${data.tenantId}`);
    } catch (error) {
      logger.error({ message: "Error send messages", error });
      sending[data.tenantId] = false;
      throw new Error(error);
    }
  }
};
