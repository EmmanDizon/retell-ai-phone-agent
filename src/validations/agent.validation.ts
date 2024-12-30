const Joi = require("joi");

export const createWebCallSchema = {
  body: Joi.object({
    agent_id: Joi.string().required(),
    metadata: Joi.string().optional(),
    retell_llm_dynamic_variables: Joi.string().optional(),
  }),
};
