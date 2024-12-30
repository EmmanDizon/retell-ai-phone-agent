import { WebSocket, RawData } from "ws";
import { Request, Response } from "express";
import logger from "@common/logger";
import { FunctionCallingLlmClient } from "@service/llms/openai.service";
import {
  CustomLlmRequest,
  CustomLlmResponse,
} from "../interfaces/retell.types";
import { handleWebSocketMessage } from "@service/websocket.service";
import { webCall } from "@service/agent.service";
import { ICreateWebCall } from "@interfaces/agent.type";
import catchAsync from "@utils/catchAsync";

export const agentCallController = async (ws: WebSocket, req: Request) => {
  try {
    const callId = req.params.call_id;
    logger.info(`Handle llm ws for: ${callId}`);

    // Send config to Retell server
    const config: CustomLlmResponse = {
      response_type: "config",
      config: {
        auto_reconnect: true,
        call_details: true,
      },
    };
    ws.send(JSON.stringify(config));

    // Initialize LLM client
    const llmClient = new FunctionCallingLlmClient();

    ws.on("message", async (data: RawData, isBinary: boolean) => {
      if (isBinary) {
        logger.error("Got binary message instead of text in websocket.");
        ws.close(1007, "Cannot find corresponding Retell LLM.");
        return;
      }

      const request: CustomLlmRequest = JSON.parse(data.toString());
      handleWebSocketMessage(request, ws, llmClient);
    });

    ws.on("error", (err) => {
      logger.error("WebSocket error:", err);
    });

    ws.on("close", () => {
      logger.info(`Closing llm ws for: ${callId}`);
    });
  } catch (error) {
    logger.error("WebSocket controller error:", error);
    ws.close();
  }
};

export const createWebCall = catchAsync(async (req: Request, res: Response) => {
  try {
    const body = { ...req.body } as ICreateWebCall;
    const result = await webCall(body);

    logger.info(`Web call created successfully: ${JSON.stringify(result)}`);

    res.status(200).json({ access_token: result.access_token });
  } catch (error) {
    console.error("Error creating web call:", error);
  }
});
