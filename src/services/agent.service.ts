import { ICreateWebCall } from "@interfaces/agent.type";
import Retell from "retell-sdk";

const client = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export const webCall = async ({
  agent_id,
  metadata,
  retell_llm_dynamic_variables,
}: ICreateWebCall) => {
  const response = await client.call.createWebCall({
    agent_id,
    metadata,
    retell_llm_dynamic_variables,
  });

  return response;
};
