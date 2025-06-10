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

export const env = {
  // Azure AD Configuration
  AZURE_CLIENT_ID: getEnvVar('AZURE_CLIENT_ID'),
  AZURE_CLIENT_SECRET: getEnvVar('AZURE_CLIENT_SECRET'),
  AZURE_TENANT_ID: getEnvVar('AZURE_TENANT_ID'),
  AZURE_REDIRECT_URI: getEnvVar('AZURE_REDIRECT_URI', 'http://localhost:3000'),
  AZURE_POST_LOGOUT_REDIRECT_URI: getEnvVar('AZURE_POST_LOGOUT_REDIRECT_URI', 'http://localhost:3000'),

  // Application Configuration
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  NEXTAUTH_URL: getEnvVar('NEXTAUTH_URL', 'http://localhost:3000'),

  // Feature Flags
  ENABLE_MCP: getEnvVar('ENABLE_MCP', 'true') === 'true',
  ENABLE_ANALYTICS: getEnvVar('ENABLE_ANALYTICS', 'false') === 'true',
} as const

export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'
