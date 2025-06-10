"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ChatSidebar } from "@/components/chat-sidebar"
import { MainChatArea } from "@/components/main-chat-area"
import { AuthScreen } from "@/components/auth-screen"
import { ClientOnly } from "@/components/client-only"

interface User {
  name: string
  email: string
  avatar: string
}

// Mock authentication state - in real app this would come from your auth provider
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const login = () => {
    setIsAuthenticated(true)
    setUser({ name: "John Doe", email: "john.doe@company.com", avatar: "/placeholder.svg?height=32&width=32" })
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  return { isAuthenticated, user, login, logout }
}

export default function DigitChat() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const handleNewChat = () => {
    setCurrentChatId(null)
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ClientOnly fallback={
        <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      }>
        {!isAuthenticated || !user ? (
          <AuthScreen onLogin={login} />
        ) : (
          <SidebarProvider defaultOpen={false}>
            <div className="flex h-screen w-full bg-background text-foreground">
              <ChatSidebar currentChatId={currentChatId} onChatSelect={setCurrentChatId} onNewChat={handleNewChat} />
              <MainChatArea user={user} currentChatId={currentChatId} onLogout={logout} onNewChat={handleNewChat} />
            </div>
          </SidebarProvider>
        )}
      </ClientOnly>
    </ThemeProvider>
  )
}
