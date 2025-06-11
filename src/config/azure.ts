/**
 * Azure AD configuration for MSAL
 * This configuration contains sensitive environment variables and should only be used server-side
 */
export const azureConfig = {
  clientId: process.env.AZURE_CLIENT_ID!,
  authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID!}`,
  redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3000',
  postLogoutRedirectUri: process.env.AZURE_POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000',
  scopes: {
    default: ["User.Read"],
    extended: ["User.Read", "email", "profile", "openid"]
  }
} as const

/**
 * MSAL cache configuration
 */
export const cacheConfig = {
  cacheLocation: "localStorage" as const,
  storeAuthStateInCookie: false
}

/**
 * MSAL system configuration
 */
export const systemConfig = {
  loggerOptions: {
    loggerCallback: (level: any, message: string, containsPii: boolean) => {
      if (containsPii) return
      
      switch (level) {
        case 0: // LogLevel.Error
          console.error(message)
          break
        case 1: // LogLevel.Warning
          console.warn(message)
          break
        case 2: // LogLevel.Info
          console.info(message)
          break
        case 3: // LogLevel.Verbose
          console.debug(message)
          break
      }
    },
    logLevel: (process.env.NODE_ENV || 'development') === 'development' ? 3 : 1, // Verbose in dev, Warning in prod
    piiLoggingEnabled: false
  }
}
