import { env } from "./env"

/**
 * Azure AD configuration for MSAL
 */
export const azureConfig = {
  clientId: env.AZURE_CLIENT_ID,
  authority: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}`,
  redirectUri: env.AZURE_REDIRECT_URI,
  postLogoutRedirectUri: env.AZURE_POST_LOGOUT_REDIRECT_URI,
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
    logLevel: env.NODE_ENV === 'development' ? 3 : 1, // Verbose in dev, Warning in prod
    piiLoggingEnabled: false
  }
}
