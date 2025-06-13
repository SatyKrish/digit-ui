import type { Message } from "ai"

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model: string
  isError?: boolean
}

export interface ChatSession {
  id: string
  title: string
  timestamp: string
  messages?: ChatMessage[]
  isActive?: boolean
  updatedAt?: Date
  createdAt?: Date
  messageCount?: number
  lastMessageAt?: Date
}

export type TimePeriod = 'today' | 'yesterday' | 'last-week' | 'last-month' | 'older'

export type GroupedChatSessions = Partial<Record<TimePeriod, ChatSession[]>>

export interface ChatContextType {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  createSession: (title: string) => Promise<ChatSession>
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<ChatMessage>
  getCurrentSession: () => Promise<ChatSession | null>
  clearHistory: () => Promise<void>
  switchToSession: (sessionId: string) => Promise<ChatSession | null>
  deleteSession: (sessionId: string) => Promise<boolean>
}

export interface ChatSidebarProps {
  currentChatId: string | null
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
}

export interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading?: boolean
  user?: {
    name: string
    avatar?: string
  }
  onReopenArtifacts?: (messageContent: string) => void
}

export interface ChatInputProps {
  onSendMessage: (content: string, selectedHints?: string[]) => void
  isLoading?: boolean
  placeholder?: string
}

export interface MainChatAreaProps {
  user: {
    name: string
    email: string
    avatar: string
  }
  currentChatId: string | null
  onLogout: () => void
  onNewChat?: () => void
  // Enhanced functionality props (optional for backward compatibility)
  enableSmootherStreaming?: boolean;
  enableThrottling?: boolean;
  maxRetries?: number;
}
