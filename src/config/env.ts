/**
 * Environment variable validation and configuration
 */

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name]
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value || defaultValue!
}

function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  const value = process.env[name]
  return value || defaultValue || undefined
}

export const env = {
  // Azure AD Configuration - Optional in development for easier setup
  AZURE_CLIENT_ID: getOptionalEnvVar('AZURE_CLIENT_ID'),
  AZURE_CLIENT_SECRET: getOptionalEnvVar('AZURE_CLIENT_SECRET'),
  AZURE_TENANT_ID: getOptionalEnvVar('AZURE_TENANT_ID'),
  AZURE_REDIRECT_URI: getEnvVar('AZURE_REDIRECT_URI', 'http://localhost:3000'),
  AZURE_POST_LOGOUT_REDIRECT_URI: getEnvVar('AZURE_POST_LOGOUT_REDIRECT_URI', 'http://localhost:3000'),

  // Application Configuration
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  NEXTAUTH_URL: getEnvVar('NEXTAUTH_URL', 'http://localhost:3000'),

  // LLM Configuration - Only Azure OpenAI supported
  LLM_PROVIDER: getEnvVar('LLM_PROVIDER', 'azure'),
  
  // Azure OpenAI Configuration
  AZURE_OPENAI_ENDPOINT: getOptionalEnvVar('AZURE_OPENAI_ENDPOINT'),
  AZURE_OPENAI_API_KEY: getOptionalEnvVar('AZURE_OPENAI_API_KEY'),
  AZURE_OPENAI_API_VERSION: getEnvVar('AZURE_OPENAI_API_VERSION', '2024-02-15-preview'),
  AZURE_OPENAI_DEPLOYMENT_NAME: getOptionalEnvVar('AZURE_OPENAI_DEPLOYMENT_NAME'),

  // Database Configuration
  DATABASE_PATH: getEnvVar('DATABASE_PATH', './data/chat.db'),
  DATABASE_TIMEOUT: parseInt(getEnvVar('DATABASE_TIMEOUT', '30000')),
  DATABASE_VERBOSE: getEnvVar('DATABASE_VERBOSE', 'false') === 'true',

  // MCP Server Configuration
  MCP_DATABASE_SERVER_URL: getOptionalEnvVar('MCP_DATABASE_SERVER_URL'),

  // Feature Flags
  ENABLE_MCP: getEnvVar('ENABLE_MCP', 'true') === 'true',
  ENABLE_ANALYTICS: getEnvVar('ENABLE_ANALYTICS', 'false') === 'true',
} as const

export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

/**
 * Determines if Azure AD configuration is complete and valid
 */
export const hasValidAzureConfig = () => {
  return !!(
    env.AZURE_CLIENT_ID &&
    env.AZURE_TENANT_ID &&
    env.AZURE_REDIRECT_URI
  )
}
