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

/**
 * Get configured OpenAI model with API key
 * @deprecated Use getLLMModel from llm-provider.ts instead for unified provider support
 */
export const getOpenAIModel = (modelName: string = openaiConfig.model) => {
  console.warn('getOpenAIModel is deprecated. Use getLLMModel from llm-provider.ts for unified provider support.')
  
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required when using OpenAI provider')
  }
  
  // The API key is automatically read from process.env.OPENAI_API_KEY
  // by the AI SDK when no apiKey is explicitly provided
  return openai(modelName)
}
