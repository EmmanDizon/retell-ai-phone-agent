import { WebSocket } from "ws";
import { FunctionCallingLlmClient } from "@service/llms/openai.service";
import {
  CustomLlmRequest,
  CustomLlmResponse,
} from "../interfaces/retell.types";
import logger from "@common/logger";

export const handleWebSocketMessage = async (
  request: CustomLlmRequest,
  ws: WebSocket,
  llmClient: FunctionCallingLlmClient
) => {
  switch (request.interaction_type) {
    case "call_details":
      logger.info(`call details: ${JSON.stringify(request.call)}`);
      llmClient.BeginMessage(ws);
      break;

    case "reminder_required":
    case "response_required":
      logger.info(`req: ${JSON.stringify(request)}`);
      llmClient.DraftResponse(request, ws);
      break;

    case "ping_pong":
      const pingpongResponse: CustomLlmResponse = {
        response_type: "ping_pong",
        timestamp: request.timestamp,
      };
      ws.send(JSON.stringify(pingpongResponse));
      break;

    case "update_only":
      // process live transcript update if needed
      break;
  }
};
