"use client"

import { useState, useEffect } from "react"
import { MOCK_CHAT_HISTORY } from "@/constants/chat"
import type { ChatSession } from "@/types/chat"

/**
 * Hook for managing chat history
 */
export function useChatHistory() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(MOCK_CHAT_HISTORY)
  const [isLoading, setIsLoading] = useState(false)

  const addChat = (chat: Omit<ChatSession, 'id'>) => {
    const newChat: ChatSession = {
      ...chat,
      id: Date.now().toString(),
    }
    setChatHistory(prev => [newChat, ...prev])
    return newChat.id
  }

  const removeChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId))
  }

  const updateChat = (chatId: string, updates: Partial<ChatSession>) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId ? { ...chat, ...updates } : chat
      )
    )
  }

  const getChat = (chatId: string) => {
    return chatHistory.find(chat => chat.id === chatId)
  }

  return {
    chatHistory,
    isLoading,
    addChat,
    removeChat,
    updateChat,
    getChat,
  }
}
