import { Configuration, PopupRequest } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '', // Application (client) ID from Azure portal
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'common'}`, // Directory (tenant) ID or 'common'
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '/', // Must be registered as redirect URI in Azure portal
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI || '/',
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 'Error':
            console.error(message);
            return;
          case 'Info':
            console.info(message);
            return;
          case 'Verbose':
            console.debug(message);
            return;
          case 'Warning':
            console.warn(message);
            return;
          default:
            return;
        }
      }
    }
  }
};

// Scopes for Microsoft Graph API
export const loginRequest: PopupRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
  prompt: "select_account"
};

// Scopes for Microsoft Graph API (additional permissions)
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphMailEndpoint: "https://graph.microsoft.com/v1.0/me/messages"
};
