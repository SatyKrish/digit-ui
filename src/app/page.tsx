"use client"

import { useState } from "react"
import { ChatSidebar } from "@/components/features/chat/chat-sidebar"
import { MainChatArea } from "@/components/features/chat/main-chat-area"
import { AuthScreen } from "@/components/features/auth/auth-screen"
import { ClientOnly } from "@/components/shared/client-only"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/auth/use-auth"
import { env, isDevelopment } from "@/config/env"

export default function DigitChat() {
  const { isAuthenticated, user, signOut, isLoading } = useAuth()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  // Create a mock user for development mode when SSO is disabled
  const mockUser = {
    id: "dev-user",
    name: "Dev User", 
    email: "dev@localhost"
  }

  // Override auth state if we're in development mode with SSO disabled
  const shouldBypassAuth = isDevelopment
  const effectiveIsAuthenticated = shouldBypassAuth || isAuthenticated
  const effectiveUser = shouldBypassAuth ? mockUser : user
  const effectiveIsLoading = shouldBypassAuth ? false : isLoading

  const handleNewChat = () => {
    setCurrentChatId(null)
  }

  const handleChatCreated = (newChatId: string) => {
    setCurrentChatId(newChatId)
  }

  return (
    <ClientOnly fallback={
      <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      {effectiveIsLoading ? (
        <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Completing authentication...</p>
          </div>
        </div>
      ) : !effectiveIsAuthenticated || !effectiveUser ? (
        <AuthScreen />
      ) : (
        <SidebarProvider defaultOpen={false}>
          <div className="flex h-screen w-full bg-background text-foreground">
            <ChatSidebar 
              currentChatId={currentChatId} 
              onChatSelect={setCurrentChatId} 
              onNewChat={handleNewChat}
              user={{ id: effectiveUser.email, email: effectiveUser.email, name: effectiveUser.name }}
            />
            <MainChatArea 
              user={effectiveUser} 
              currentChatId={currentChatId} 
              onLogout={signOut} 
              onNewChat={handleNewChat}
              onChatCreated={handleChatCreated}
            />
          </div>
        </SidebarProvider>
      )}
    </ClientOnly>
  )
}
