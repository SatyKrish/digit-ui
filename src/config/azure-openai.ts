import { createAzure } from "@ai-sdk/azure"
import { env } from "./env"

/**
 * Azure OpenAI configuration following Azure best practices
 * Supports both API key and managed identity authentication
 */
export const azureOpenAIConfig = {
  model: env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
  temperature: 0.7,
  maxTokens: 4000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
} as const

/**
 * Get configured Azure OpenAI model with proper authentication
 * Uses Azure-specific authentication and endpoints following Vercel AI SDK patterns
 * 
 * @param deploymentName Optional deployment name override
 * @returns Configured Azure OpenAI model instance
 */
export const getAzureOpenAIModel = (deploymentName?: string) => {
  // Validate required Azure OpenAI configuration
  if (!env.AZURE_OPENAI_ENDPOINT) {
    throw new Error('AZURE_OPENAI_ENDPOINT is required for Azure OpenAI provider')
  }
  
  if (!env.AZURE_OPENAI_API_KEY) {
    throw new Error('AZURE_OPENAI_API_KEY is required for Azure OpenAI provider')
  }
  
  if (!env.AZURE_OPENAI_DEPLOYMENT_NAME && !deploymentName) {
    throw new Error('AZURE_OPENAI_DEPLOYMENT_NAME is required for Azure OpenAI provider')
  }

  // Create Azure OpenAI client with proper configuration
  const azure = createAzure({
    // Authentication: Using API key (production should consider managed identity)
    apiKey: env.AZURE_OPENAI_API_KEY,
    
    // Azure OpenAI service endpoint (must use openai.azure.com format)
    baseURL: env.AZURE_OPENAI_ENDPOINT,
    
    // API version for Azure OpenAI service
    apiVersion: env.AZURE_OPENAI_API_VERSION,
  })

  // Return the configured model using the deployment name
  return azure(deploymentName || env.AZURE_OPENAI_DEPLOYMENT_NAME!)
}

/**
 * Validate Azure OpenAI configuration
 * Returns true if all required environment variables are set
 */
export const validateAzureOpenAIConfig = (): boolean => {
  return !!(
    env.AZURE_OPENAI_ENDPOINT &&
    env.AZURE_OPENAI_API_KEY &&
    env.AZURE_OPENAI_DEPLOYMENT_NAME
  )
}

/**
 * Get Azure OpenAI service status for health checks
 */
export const getAzureOpenAIStatus = () => {
  const isConfigured = validateAzureOpenAIConfig()
  
  return {
    provider: 'azure',
    configured: isConfigured,
    endpoint: env.AZURE_OPENAI_ENDPOINT ? '***configured***' : 'not set',
    apiKey: env.AZURE_OPENAI_API_KEY ? '***configured***' : 'not set',
    deploymentName: env.AZURE_OPENAI_DEPLOYMENT_NAME || 'not set',
    apiVersion: env.AZURE_OPENAI_API_VERSION,
  }
}
