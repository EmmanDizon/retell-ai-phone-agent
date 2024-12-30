export interface ICreateWebCall {
  agent_id: string;
  metadata?: Record<string, unknown>;
  retell_llm_dynamic_variables?: Record<string, unknown>;
}
