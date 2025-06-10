import type { Message } from "ai"

export interface ChatSession {
  id: string
  title: string
  timestamp: string
}

export interface ChatSidebarProps {
  currentChatId: string | null
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
}

export interface ChatMessagesProps {
  messages: Message[]
  isLoading?: boolean
  user?: {
    name: string
    avatar?: string
  }
}

export interface ChatInputProps {
  onSendMessage: (content: string, selectedHints?: string[]) => void
  isLoading?: boolean
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
}
