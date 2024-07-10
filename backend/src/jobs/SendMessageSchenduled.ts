/* eslint-disable @typescript-eslint/no-explicit-any */
import SendMessagesSchenduleWbot from "../services/WbotServices/SendMessagesSchenduleWbot";
import { logger } from "../utils/logger";

export default {
  key: "SendMessageSchenduled",
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
  async handle() {
    try {
      logger.info("SendMessageSchenduled Initiated");
      await SendMessagesSchenduleWbot();
      logger.info("Finalized SendMessageSchenduled");
    } catch (error) {
      logger.error({ message: "Error send messages", error });
      throw new Error(error);
    }
  }
};
