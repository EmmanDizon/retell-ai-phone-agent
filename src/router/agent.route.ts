import { Router } from "express";
import { Application } from "express-ws";
import {
  agentCallController,
  createWebCall,
} from "@controller/agent-call.controller";
import { webhookController } from "@controller/webhook.controller";
import validate from "@middleware/validate";
import { createWebCallSchema } from "@validations/agent.validation";

const router = Router();

// Regular HTTP routes
router.post("/webhook", webhookController);
router.post("/create-web-call", validate(createWebCallSchema), createWebCall);

// WebSocket routes
export const setupAgentRoutes = (app: Application) => {
  app.ws("/llm-websocket/:call_id", agentCallController);
};

export default router;
