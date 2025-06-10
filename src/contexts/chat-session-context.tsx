import React, { createContext, useContext, ReactNode } from 'react'
import { useChatSessions as useBaseChatSessions } from '@/hooks/chat'
import type { ChatSession } from '@/types/chat'

interface ChatSessionContextType {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  isLoading: boolean
  createSession: (title?: string) => Promise<ChatSession>
  switchToSession: (sessionId: string) => Promise<ChatSession | null>
  deleteSession: (sessionId: string) => Promise<boolean>
  updateSessionTitle: (sessionId: string, title: string) => Promise<boolean>
  clearAllSessions: () => Promise<void>
  refreshSessions: () => Promise<void>
}

const ChatSessionContext = createContext<ChatSessionContextType | null>(null)

interface ChatSessionProviderProps {
  children: ReactNode
  user?: { id: string; email: string; name: string }
}

export function ChatSessionProvider({ children, user }: ChatSessionProviderProps) {
  const chatSessions = useBaseChatSessions(user)
  
  return (
    <ChatSessionContext.Provider value={chatSessions}>
      {children}
    </ChatSessionContext.Provider>
  )
}

export function useChatSessions() {
  const context = useContext(ChatSessionContext)
  if (!context) {
    throw new Error('useChatSessions must be used within a ChatSessionProvider')
  }
  return context
}
