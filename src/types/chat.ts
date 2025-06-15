import type { Message } from "ai"

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model: string
  isError?: boolean
  // AI SDK v4+ parts for advanced rendering
  parts?: Array<{
    type: 'text' | 'tool-invocation' | 'reasoning' | 'source' | 'step-start' | 'file'
    text?: string
    toolInvocation?: any
    reasoning?: string
    source?: any
    mimeType?: string
    data?: string
  }>
}

// AI SDK v4+ aligned types
export interface Chat {
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

// Backward compatibility alias - gradually migrate away from this
export type ChatSession = Chat

export type TimePeriod = 'today' | 'yesterday' | 'last-week' | 'last-month' | 'older'

export type GroupedChats = Partial<Record<TimePeriod, Chat[]>>
// Backward compatibility alias
export type GroupedChatSessions = GroupedChats

export interface ChatContextType {
  currentSession: Chat | null
  sessions: Chat[]
  createSession: (title: string) => Promise<Chat>
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<ChatMessage>
  getCurrentSession: () => Promise<Chat | null>
  clearHistory: () => Promise<void>
  switchToSession: (sessionId: string) => Promise<Chat | null>
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
    id: string
    name: string
    email: string
  }
  currentChatId: string | null
  onLogout: () => void
  onNewChat?: () => void
}
