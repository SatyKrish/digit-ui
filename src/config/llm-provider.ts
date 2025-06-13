import { openai } from "@ai-sdk/openai"
import { env } from "./env"
import { getAzureOpenAIModel, validateAzureOpenAIConfig, azureOpenAIConfig } from "./azure-openai"
import { openaiConfig } from "./openai"

/**
 * LLM Provider types
 */
export type LLMProvider = 'openai' | 'azure'

/**
 * Unified LLM configuration that supports multiple providers
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
 */
export const getCurrentProvider = (): LLMProvider => {
  const provider = env.LLM_PROVIDER?.toLowerCase() as LLMProvider
  
  // Validate provider value
  if (provider !== 'openai' && provider !== 'azure') {
    console.warn(`Invalid LLM_PROVIDER: ${env.LLM_PROVIDER}. Defaulting to 'openai'`)
    return 'openai'
  }
  
  return provider
}

/**
 * Get unified LLM configuration based on current provider
 */
export const getLLMConfig = (): LLMConfig => {
  const provider = getCurrentProvider()
  
  if (provider === 'azure') {
    return {
      provider: 'azure',
      ...azureOpenAIConfig
    }
  }
  
  return {
    provider: 'openai',
    ...openaiConfig
  }
}

/**
 * Get configured LLM model based on current provider
 * This is the main function to use throughout the application
 */
export const getLLMModel = (modelName?: string) => {
  const provider = getCurrentProvider()
  const config = getLLMConfig()
  
  if (provider === 'azure') {
    // Validate Azure OpenAI configuration
    if (!validateAzureOpenAIConfig()) {
      throw new Error(
        'Azure OpenAI provider is selected but configuration is incomplete. ' +
        'Please ensure AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME are set.'
      )
    }
    
    return getAzureOpenAIModel(modelName || config.model)
  }
  
  // OpenAI provider
  if (!env.OPENAI_API_KEY) {
    throw new Error(
      'OpenAI provider is selected but OPENAI_API_KEY is not set. ' +
      'Please set OPENAI_API_KEY or switch to Azure OpenAI provider.'
    )
  }
  
  return openai(modelName || config.model)
}

/**
 * Validate current LLM provider configuration
 */
export const validateLLMConfig = (): { isValid: boolean; errors: string[] } => {
  const provider = getCurrentProvider()
  const errors: string[] = []
  
  if (provider === 'azure') {
    if (!env.AZURE_OPENAI_ENDPOINT) {
      errors.push('AZURE_OPENAI_ENDPOINT is required for Azure OpenAI provider')
    }
    if (!env.AZURE_OPENAI_API_KEY) {
      errors.push('AZURE_OPENAI_API_KEY is required for Azure OpenAI provider')
    }
    if (!env.AZURE_OPENAI_DEPLOYMENT_NAME) {
      errors.push('AZURE_OPENAI_DEPLOYMENT_NAME is required for Azure OpenAI provider')
    }
  } else {
    if (!env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required for OpenAI provider')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get LLM provider status for health checks and debugging
 */
export const getLLMProviderStatus = () => {
  const provider = getCurrentProvider()
  const config = getLLMConfig()
  const validation = validateLLMConfig()
  
  const baseStatus = {
    currentProvider: provider,
    model: config.model,
    configured: validation.isValid,
    errors: validation.errors,
  }
  
  if (provider === 'azure') {
    return {
      ...baseStatus,
      azure: {
        endpoint: env.AZURE_OPENAI_ENDPOINT ? '***configured***' : 'not set',
        apiKey: env.AZURE_OPENAI_API_KEY ? '***configured***' : 'not set',
        deploymentName: env.AZURE_OPENAI_DEPLOYMENT_NAME || 'not set',
                apiVersion: env.AZURE_OPENAI_API_VERSION,
      }
    }
  }
  
  return {
    ...baseStatus,
    openai: {
      apiKey: env.OPENAI_API_KEY ? '***configured***' : 'not set',
    }
  }
}
