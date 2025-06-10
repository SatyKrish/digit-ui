"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ChatSidebar } from "@/components/chat-sidebar"
import { MainChatArea } from "@/components/main-chat-area"
import { AuthScreen } from "@/components/auth-screen"

// Mock authentication state - in real app this would come from your auth provider
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

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

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthScreen onLogin={login} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-screen w-full bg-background text-foreground">
          <ChatSidebar currentChatId={currentChatId} onChatSelect={setCurrentChatId} onNewChat={handleNewChat} />
          <MainChatArea user={user} currentChatId={currentChatId} onLogout={logout} onNewChat={handleNewChat} />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
