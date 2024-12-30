import OpenAI from "openai";
import { WebSocket } from "ws";
import {
  CustomLlmResponse,
  FunctionCall,
  ReminderRequiredRequest,
  ResponseRequiredRequest,
  Utterance,
} from "@interfaces/retell.types";

const beginSentence = `Hi, thank you for calling The Color Bar Salon, How may I assist you today?`;

const task = `
You are a professional receptionist for The Color Bar Salon, a premier hair salon in the Philippines. 
Your responsibilities include:
- Answering questions about our services, pricing, locations, and operating hours
- Helping customers book appointments
- Providing excellent customer service with a friendly, professional demeanor

Key Information:
1. Services & Pricing:
   - Haircut (Short: ₱500, Medium: ₱600, Long: ₱700)
   - Hair Color (Short: ₱2500, Medium: ₱3000, Long: ₱3500)
   - Treatment (Short: ₱1500, Medium: ₱2000, Long: ₱2500)

2. Locations:
   - BGC Branch: Unit 106 C2 Building, 7th Avenue, Bonifacio Global City, Taguig
   - Makati Branch: G/F Le Grand Condominium 2, 130 Valero St., Salcedo Village, Makati

3. Operating Hours:
   - Monday to Sunday: 10:00 AM - 7:00 PM
   - Last booking accepted: 5:30 PM

For appointments, collect:
- Full Name
- Contact Number
- Email Address
- Preferred Service
- Preferred Date and Time
- Branch Location
`;

const conversationalStyle = `
- Be warm and professional
- Keep responses concise and clear
- Use Filipino-English conversational style when appropriate
- Always confirm appointment details before finalizing
- If unsure about specific details, politely ask for clarification
`;

const personality = `
- Be friendly but professional
- Show enthusiasm for helping customers
- Be patient when collecting appointment details
- Demonstrate knowledge about hair services
- Be clear about pricing and policies
`;

const agentPrompt = `
Task:
${task}

Conversational Style:
${conversationalStyle}

Personality:
${personality}
`;

const objective = `
##Objective
You are a voice AI agent for The Color Bar Salon, engaging in natural conversation with customers.
You will respond based on the salon's information and requirements while maintaining a professional yet friendly tone.
`;

const styleGuardrails = `
## Style Guardrails
- [Be concise] Keep responses brief and to the point. Address one topic at a time.
- [Stay natural] Use conversational Filipino-English when appropriate.
- [Be proactive] Guide the conversation towards collecting necessary booking information.
- [Confirm details] Always verify appointment details before proceeding.
- [Handle uncertainty] If unsure about specific details, ask for clarification politely.
`;

const responseGuideline = `
## Response Guideline
- [Handle unclear audio] If you can't understand the customer, politely ask for clarification.
- [Stay on topic] Keep focus on salon services and appointments.
- [Be helpful] Provide relevant information about services, pricing, and locations.
- [Guide booking] Walk customers through the appointment booking process step by step.
`;

const systemPrompt = `
${objective}
${styleGuardrails}
${responseGuideline}
## Role
${agentPrompt}
`;

export class FunctionCallingLlmClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_APIKEY,
    });
  }

  BeginMessage(ws: WebSocket) {
    const res: CustomLlmResponse = {
      response_type: "response",
      response_id: 0,
      content: beginSentence,
      content_complete: true,
      end_call: false,
    };
    ws.send(JSON.stringify(res));
  }

  private ConversationToChatRequestMessages(conversation: Utterance[]) {
    const result: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    for (const turn of conversation) {
      result.push({
        role: turn.role === "agent" ? "assistant" : "user",
        content: turn.content,
      });
    }
    return result;
  }

  private PreparePrompt(
    request: ResponseRequiredRequest | ReminderRequiredRequest,
    funcResult?: FunctionCall
  ) {
    const transcript = this.ConversationToChatRequestMessages(
      request.transcript
    );
    const requestMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

    for (const message of transcript) {
      requestMessages.push(message);
    }

    if (funcResult) {
      requestMessages.push({
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: funcResult.id,
            type: "function",
            function: {
              name: funcResult.funcName,
              arguments: JSON.stringify(funcResult.arguments),
            },
          },
        ],
      });
      requestMessages.push({
        role: "tool",
        tool_call_id: funcResult.id,
        content: funcResult.result || "",
      });
    }

    if (request.interaction_type === "reminder_required") {
      requestMessages.push({
        role: "user",
        content: "(The customer hasn't responded in a while, you would say:)",
      });
    }
    return requestMessages;
  }

  async DraftResponse(
    request: ResponseRequiredRequest | ReminderRequiredRequest,
    ws: WebSocket,
    funcResult?: FunctionCall
  ) {
    const requestMessages = this.PreparePrompt(request, funcResult);
    let funcCall: FunctionCall | undefined;
    let funcArguments = "";

    try {
      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "function",
          function: {
            name: "end_call",
            description:
              "End the call only when user explicitly requests it or after successful appointment booking.",
            parameters: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description:
                    "The farewell message to say before ending the call.",
                },
              },
              required: ["message"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "book_appointment",
            description: "Book an appointment at The Color Bar Salon.",
            parameters: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description:
                    "Confirmation message to say while booking the appointment",
                },
                customer_name: {
                  type: "string",
                  description: "Customer's full name",
                },
                contact_number: {
                  type: "string",
                  description: "Customer's contact number",
                },
                email: {
                  type: "string",
                  description: "Customer's email address",
                },
                service: {
                  type: "string",
                  description: "Requested service (haircut/color/treatment)",
                },
                date: {
                  type: "string",
                  description: "Appointment date (YYYY-MM-DD)",
                },
                time: {
                  type: "string",
                  description: "Appointment time (HH:MM)",
                },
                branch: {
                  type: "string",
                  description: "Selected branch (BGC/Makati)",
                },
              },
              required: [
                "message",
                "customer_name",
                "contact_number",
                "service",
                "date",
                "time",
                "branch",
              ],
            },
          },
        },
      ];

      const events = await this.client.chat.completions.create({
        model: process.env.OPENAI_LLM_MODEL || "gpt-4o-mini",
        messages: requestMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 200,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        tools: tools,
      });

      for await (const event of events) {
        if (event.choices.length >= 1) {
          const delta = event.choices[0].delta;
          if (!delta) continue;

          if (delta.tool_calls && delta.tool_calls.length >= 1) {
            const toolCall = delta.tool_calls[0];
            if (toolCall.id) {
              if (funcCall) {
                break;
              } else {
                funcCall = {
                  id: toolCall.id,
                  funcName: toolCall.function?.name || "",
                  arguments: {},
                };
              }
            } else {
              funcArguments += toolCall.function?.arguments || "";
            }
          } else if (delta.content) {
            const res: CustomLlmResponse = {
              response_type: "response",
              response_id: request.response_id,
              content: delta.content,
              content_complete: false,
              end_call: false,
            };
            ws.send(JSON.stringify(res));
          }
        }
      }
    } catch (err) {
      console.error("Error in gpt stream: ", err);
    } finally {
      if (funcCall != null) {
        if (funcCall.funcName === "end_call") {
          funcCall.arguments = JSON.parse(funcArguments);
          const res: CustomLlmResponse = {
            response_type: "response",
            response_id: request.response_id,
            content: funcCall.arguments.message,
            content_complete: true,
            end_call: true,
          };
          ws.send(JSON.stringify(res));
        }

        if (funcCall.funcName === "book_appointment") {
          funcCall.arguments = JSON.parse(funcArguments);
          const res: CustomLlmResponse = {
            response_type: "response",
            response_id: request.response_id,
            content: funcCall.arguments.message,
            content_complete: false,
            end_call: false,
          };
          ws.send(JSON.stringify(res));

          const functionInvocationResponse: CustomLlmResponse = {
            response_type: "tool_call_invocation",
            tool_call_id: funcCall.id,
            name: funcCall.funcName,
            arguments: JSON.stringify(funcCall.arguments),
          };
          ws.send(JSON.stringify(functionInvocationResponse));

          // Simulate booking delay
          await new Promise((r) => setTimeout(r, 2000));
          funcCall.result = "Appointment booked successfully";

          const functionResult: CustomLlmResponse = {
            response_type: "tool_call_result",
            tool_call_id: funcCall.id,
            content: "Appointment booked successfully",
          };
          ws.send(JSON.stringify(functionResult));

          this.DraftResponse(request, ws, funcCall);
        }
      } else {
        const res: CustomLlmResponse = {
          response_type: "response",
          response_id: request.response_id,
          content: "",
          content_complete: true,
          end_call: false,
        };
        ws.send(JSON.stringify(res));
      }
    }
  }
}
