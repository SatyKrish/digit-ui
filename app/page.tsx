"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebar } from "@/components/chat-sidebar"
import { MainChatArea } from "@/components/main-chat-area"
import { AuthScreen } from "@/components/auth-screen"
import { ClientOnly } from "@/components/client-only"
import { useAuth } from "@/hooks/use-auth"

export default function DigitChat() {
  const { isAuthenticated, user, logout } = useAuth()
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
      {!isAuthenticated || !user ? (
        <AuthScreen />
      ) : (
        <SidebarProvider defaultOpen={false}>
          <div className="flex h-screen w-full bg-background text-foreground">
            <ChatSidebar currentChatId={currentChatId} onChatSelect={setCurrentChatId} onNewChat={handleNewChat} />
            <MainChatArea user={user} currentChatId={currentChatId} onLogout={logout} onNewChat={handleNewChat} />
          </div>
        </SidebarProvider>
      )}
    </ClientOnly>
  )
}
