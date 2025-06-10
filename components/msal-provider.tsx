"use client"

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/lib/msal-config";
import { ReactNode } from "react";

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

interface MsalAuthProviderProps {
  children: ReactNode;
}

export function MsalAuthProvider({ children }: MsalAuthProviderProps) {
  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}
