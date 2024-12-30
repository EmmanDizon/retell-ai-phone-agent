import { Request, Response, RequestHandler } from "express";
import { Retell } from "retell-sdk";
import logger from "@common/logger";
import { handleWebhookEvent } from "@service/webhook.service";

export const webhookController: RequestHandler = (
  req: Request,
  res: Response
) => {
  if (
    !Retell.verify(
      JSON.stringify(req.body),
      process.env.RETELL_API_KEY as string,
      req.headers["x-retell-signature"] as string
    )
  ) {
    logger.error("Invalid signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const content = req.body;
  handleWebhookEvent(content);
  res.json({ received: true });
};
