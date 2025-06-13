import { env } from "./env"
import { getAzureOpenAIModel, validateAzureOpenAIConfig, azureOpenAIConfig } from "./azure-openai"

/**
 * LLM Provider type - Only Azure OpenAI supported
 */
export type LLMProvider = 'azure'

/**
 * Unified LLM configuration that supports Azure OpenAI
 * Following Azure best practices for provider selection and configuration
 */
export interface LLMConfig {
  provider: LLMProvider
  model: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

/**
 * Get the current LLM provider from environment
 * Always returns 'azure' as it's the only supported provider
 */
export const getCurrentProvider = (): LLMProvider => {
  const provider = env.LLM_PROVIDER?.toLowerCase() as LLMProvider
  
  // Validate provider value - only 'azure' is supported
  if (provider !== 'azure') {
    console.warn(`Invalid LLM_PROVIDER: ${env.LLM_PROVIDER}. Only 'azure' is supported. Defaulting to 'azure'`)
    return 'azure'
  }
  
  return provider
}

/**
 * Get unified LLM configuration based on current provider
 * Only supports Azure OpenAI
 */
export const getLLMConfig = (): LLMConfig => {
  return {
    provider: 'azure',
    ...azureOpenAIConfig
  }
}

/**
 * Get configured LLM model based on Azure OpenAI provider
 * This is the main function to use throughout the application
 */
export const getLLMModel = (modelName?: string) => {
  const config = getLLMConfig()
  
  // Validate Azure OpenAI configuration
  if (!validateAzureOpenAIConfig()) {
    throw new Error(
      'Azure OpenAI provider configuration is incomplete. ' +
      'Please ensure AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME are set.'
    )
  }
  
  return getAzureOpenAIModel(modelName || config.model)
}

/**
 * Validate Azure OpenAI provider configuration
 */
export const validateLLMConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!env.AZURE_OPENAI_ENDPOINT) {
    errors.push('AZURE_OPENAI_ENDPOINT is required for Azure OpenAI provider')
  }
  if (!env.AZURE_OPENAI_API_KEY) {
    errors.push('AZURE_OPENAI_API_KEY is required for Azure OpenAI provider')
  }
  if (!env.AZURE_OPENAI_DEPLOYMENT_NAME) {
    errors.push('AZURE_OPENAI_DEPLOYMENT_NAME is required for Azure OpenAI provider')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get LLM provider status for health checks and debugging
 * Only supports Azure OpenAI
 */
export const getLLMProviderStatus = () => {
  const provider = getCurrentProvider()
  const config = getLLMConfig()
  const validation = validateLLMConfig()
  
  return {
    currentProvider: provider,
    model: config.model,
    configured: validation.isValid,
    errors: validation.errors,
    azure: {
      endpoint: env.AZURE_OPENAI_ENDPOINT ? '***configured***' : 'not set',
      apiKey: env.AZURE_OPENAI_API_KEY ? '***configured***' : 'not set',
      deploymentName: env.AZURE_OPENAI_DEPLOYMENT_NAME || 'not set',
      apiVersion: env.AZURE_OPENAI_API_VERSION,
    }
  }
}
