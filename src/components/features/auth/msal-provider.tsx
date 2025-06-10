"use client"

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { ReactNode, useEffect, useState } from "react";
import { getMsalConfig } from "@/config/msal-config";

interface MsalAuthProviderProps {
  children: ReactNode;
}

export function MsalAuthProvider({ children }: MsalAuthProviderProps) {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        // Fetch configuration from server (with fallback to client-side)
        const config = await getMsalConfig();
        
        // Create MSAL instance with configuration
        const instance = new PublicClientApplication(config);
        
        // Initialize the instance
        await instance.initialize();
        
        setMsalInstance(instance);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize MSAL:', err);
        setError('Failed to initialize authentication system');
      } finally {
        setLoading(false);
      }
    };

    initializeMsal();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !msalInstance) {
    return (
      <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-lg">⚠️</div>
          <h2 className="text-lg font-semibold">Authentication Error</h2>
          <p className="text-sm text-muted-foreground">
            {error || 'Failed to initialize authentication system'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}
