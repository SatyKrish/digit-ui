"use client"

import { useState, useEffect } from "react"
import { ChatSidebar } from "@/components/features/chat/chat-sidebar"
import { MainChatArea } from "@/components/features/chat/main-chat-area"
import { AuthScreen } from "@/components/features/auth/auth-screen"
import { ClientOnly } from "@/components/shared/client-only"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/auth/use-auth"

export default function DigitChat() {
  const { isAuthenticated, user, signOut, isLoading } = useAuth()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isDevelopment, setIsDevelopment] = useState<boolean | null>(null)

  // Fetch environment info from server
  useEffect(() => {
    const fetchEnvironment = async () => {
      try {
        const response = await fetch('/api/auth/config')
        const config = await response.json()
        setIsDevelopment(config.environment?.isDevelopment || false)
        console.log('Environment:', config.environment?.nodeEnv, 'isDevelopment:', config.environment?.isDevelopment)
      } catch (error) {
        console.error('Failed to fetch environment config:', error)
        // Default to production mode (require authentication) if fetch fails
        setIsDevelopment(false)
      }
    }

    fetchEnvironment()
  }, [])

  // Mock user for development mode
  const mockUser = {
    id: "dev-user",
    name: "Dev User", 
    email: "dev@localhost"
  }

  // Simple logic: bypass auth only in development, enforce SSO in production
  const shouldBypassAuth = isDevelopment === true
  const effectiveIsAuthenticated = shouldBypassAuth || isAuthenticated
  const effectiveUser = shouldBypassAuth ? mockUser : user
  const effectiveIsLoading = isDevelopment === null || (shouldBypassAuth ? false : isLoading)

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
