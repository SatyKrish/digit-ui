import { openai } from "@ai-sdk/openai"
import { env } from "./env"

/**
 * Default OpenAI configuration
 */
export const openaiConfig = {
  model: "gpt-4o",
  temperature: 0.7,
  maxTokens: 4000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
} as const


