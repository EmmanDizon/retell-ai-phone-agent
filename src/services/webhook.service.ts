import logger from "@common/logger";

export const handleWebhookEvent = (content: any) => {
  switch (content.event) {
    case "call_started":
      logger.info("Call started event received", content.data.call_id);
      break;
    case "call_ended":
      logger.info("Call ended event received", content.data.call_id);
      break;
    case "call_analyzed":
      logger.info("Call analyzed event received", content.data.call_id);
      break;
    default:
      logger.info("Received an unknown event:", content.event);
  }
};
