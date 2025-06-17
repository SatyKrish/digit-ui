import { NextResponse } from 'next/server';
import { hasValidAzureConfig, isDevelopment, isProduction } from '@/config/env';

// Server-side authentication configuration
// This keeps all Azure AD configuration server-side for security
export async function GET() {
  try {
    // Validate that required environment variables are present
    const clientId = process.env.AZURE_CLIENT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    const redirectUri = process.env.AZURE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`;
    const postLogoutRedirectUri = process.env.AZURE_POST_LOGOUT_REDIRECT_URI || redirectUri;

    if (!clientId || !tenantId) {
      console.error('Missing required Azure AD configuration');
      return NextResponse.json(
        { 
          error: 'Authentication configuration not available',
          environment: {
            nodeEnv: process.env.NODE_ENV,
            isDevelopment,
            isProduction,
            hasAzureConfig: hasValidAzureConfig()
          }
        },
        { status: 500 }
      );
    }

    // Return only the public configuration needed for client-side MSAL
    const msalConfig = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri,
        postLogoutRedirectUri,
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
      },
      system: {
        loggerOptions: {
          loggerCallback: null, // Will be set client-side
          piiLoggingEnabled: false
        }
      }
    };

    // Return configuration with proper caching headers
    const response = NextResponse.json({ 
      msalConfig,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isDevelopment,
        isProduction,
        hasAzureConfig: hasValidAzureConfig()
      },
      timestamp: new Date().toISOString()
    });

    // Cache for 5 minutes in production, no cache in development
    const cacheControl = process.env.NODE_ENV === 'production' 
      ? 'public, max-age=300, s-maxage=300' 
      : 'no-cache, no-store, must-revalidate';
    
    response.headers.set('Cache-Control', cacheControl);
    
    return response;

  } catch (error) {
    console.error('Error providing auth configuration:', error);
    return NextResponse.json(
      { error: 'Failed to load authentication configuration' },
      { status: 500 }
    );
  }
}
