import { Configuration, PopupRequest, LogLevel } from "@azure/msal-browser";

// Interface for the server-provided configuration
interface ServerMsalConfig {
  msalConfig: Configuration;
  environment: string;
}

// Cache for the configuration to avoid repeated API calls
let configCache: Configuration | null = null;
let configPromise: Promise<Configuration> | null = null;

/**
 * Fetches MSAL configuration from server-side API
 * This approach keeps Azure AD configuration server-side for better security in containerized deployments
 */
export const getMsalConfig = async (): Promise<Configuration> => {
  // Return cached config if available
  if (configCache) {
    return configCache;
  }

  // Return existing promise if one is in flight
  if (configPromise) {
    return configPromise;
  }

  // Create new promise to fetch configuration
  configPromise = fetchConfigFromServer();
  
  try {
    const config = await configPromise;
    configCache = config; // Cache the result
    return config;
  } catch (error) {
    configPromise = null; // Reset promise on error so we can retry
    throw error;
  }
};

/**
 * Fetches configuration from the server API endpoint
 */
async function fetchConfigFromServer(): Promise<Configuration> {
  try {
    const response = await fetch('/api/auth/config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch auth config: ${response.status} ${response.statusText}`);
    }

    const { msalConfig, environment }: ServerMsalConfig = await response.json();

    // Add client-side logger configuration
    const configWithLogger: Configuration = {
      ...msalConfig,
      system: {
        ...msalConfig.system,
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) return;
            
            // Only log in development
            if (environment === 'development') {
              switch (level) {
                case LogLevel.Error:
                  console.error('MSAL Error:', message);
                  break;
                case LogLevel.Warning:
                  console.warn('MSAL Warning:', message);
                  break;
                case LogLevel.Info:
                  console.info('MSAL Info:', message);
                  break;
                case LogLevel.Verbose:
                  console.debug('MSAL Verbose:', message);
                  break;
              }
            }
          },
          piiLoggingEnabled: false
        }
      }
    };

    return configWithLogger;

  } catch (error) {
    console.error('Failed to fetch MSAL configuration from server:', error);
    throw new Error('MSAL configuration must be available from server-side API. Ensure /api/auth/config endpoint is accessible.');
  }
}

// Login request configuration (minimal scopes for basic authentication)
// Using only standard OpenID Connect scopes to avoid admin consent requirements
export const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "email"],
  prompt: "select_account"
};

// Clear cached configuration (useful for testing or environment changes)
export const clearConfigCache = () => {
  configCache = null;
  configPromise = null;
};
