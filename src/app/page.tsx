"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebar } from "@/components/features/chat/chat-sidebar"
import { MainChatArea } from "@/components/features/chat/main-chat-area"
import { AuthScreen } from "@/components/features/auth/auth-screen"
import { ClientOnly } from "@/components/shared/client-only"
import { useAuth } from "@/hooks/auth/use-auth"

export default function DigitChat() {
  const { isAuthenticated, user, signOut, isLoading } = useAuth()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const handleNewChat = () => {
    setCurrentChatId(null)
  }

  return (
    <ClientOnly fallback={
      <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      {isLoading ? (
        <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Completing authentication...</p>
          </div>
        </div>
      ) : !isAuthenticated || !user ? (
        <AuthScreen />
      ) : (
        <SidebarProvider defaultOpen={false}>
          <div className="flex h-screen w-full bg-background text-foreground">
            <ChatSidebar 
              currentChatId={currentChatId} 
              onChatSelect={setCurrentChatId} 
              onNewChat={handleNewChat}
              user={{ id: user.email, email: user.email, name: user.name }}
            />
            <MainChatArea user={user} currentChatId={currentChatId} onLogout={signOut} onNewChat={handleNewChat} />
          </div>
        </SidebarProvider>
      )}
    </ClientOnly>
  )
}
