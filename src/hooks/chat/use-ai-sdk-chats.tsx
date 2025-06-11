'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { aiSdkChatService } from '@/services/chat/ai-sdk-chat-service'
import { Chat } from '@/database/types-ai-sdk'
import { toast } from 'sonner'
import type { Message } from 'ai'

interface UseAiSdkChatsProps {
  userId: string
}

interface UseAiSdkChatsReturn {
  // Chat management
  chats: Chat[]
  currentChatId: string | null
  isLoading: boolean
  error: string | null
  
  // Chat operations
  createNewChat: () => Promise<string>
  selectChat: (chatId: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  updateChatTitle: (chatId: string, title: string) => Promise<void>
  
  // Utility functions
  searchChats: (query: string) => Chat[]
  getChatById: (chatId: string) => Chat | undefined
  refreshChats: () => Promise<void>
  
  // Statistics
  totalChats: number
  totalMessages: number
}

/**
 * Simplified chat management hook aligned with AI SDK patterns
 * Removes complex session management and focuses on chat-level operations
 */
export function useAiSdkChats({ userId }: UseAiSdkChatsProps): UseAiSdkChatsReturn {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user chats on mount
  useEffect(() => {
    if (userId) {
      loadChats()
    }
  }, [userId])

  // Load chats from database
  const loadChats = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const userChats = await aiSdkChatService.getUserChats(userId)
      setChats(userChats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chats'
      setError(errorMessage)
      console.error('Failed to load chats:', err)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Create a new chat
  const createNewChat = useCallback(async (): Promise<string> => {
    if (!userId) throw new Error('User ID is required')

    setIsLoading(true)
    setError(null)

    try {
      const newChat = await aiSdkChatService.createChat(userId, 'New Chat')
      
      // Update local state
      setChats(prevChats => [newChat, ...prevChats])
      setCurrentChatId(newChat.id)
      
      return newChat.id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chat'
      setError(errorMessage)
      console.error('Failed to create chat:', err)
      toast.error('Failed to create new chat')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Select an existing chat
  const selectChat = useCallback(async (chatId: string): Promise<void> => {
    if (!chatId) return

    setIsLoading(true)
    setError(null)

    try {
      const chat = await aiSdkChatService.getChat(chatId)
      if (!chat) {
        throw new Error('Chat not found')
      }

      setCurrentChatId(chatId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select chat'
      setError(errorMessage)
      console.error('Failed to select chat:', err)
      toast.error('Failed to load chat')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Delete a chat
  const deleteChat = useCallback(async (chatId: string): Promise<void> => {
    if (!chatId) return

    setIsLoading(true)
    setError(null)

    try {
      await aiSdkChatService.deleteChat(chatId)
      
      // Update local state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId))
      
      // If deleted chat was current, clear selection
      if (currentChatId === chatId) {
        setCurrentChatId(null)
      }
      
      toast.success('Chat deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete chat'
      setError(errorMessage)
      console.error('Failed to delete chat:', err)
      toast.error('Failed to delete chat')
    } finally {
      setIsLoading(false)
    }
  }, [currentChatId])

  // Update chat title
  const updateChatTitle = useCallback(async (chatId: string, title: string): Promise<void> => {
    if (!chatId || !title.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      await aiSdkChatService.updateChatTitle(chatId, title.trim())
      
      // Update local state
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: title.trim(), updatedAt: new Date() }
            : chat
        )
      )
      
      toast.success('Chat title updated')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update chat title'
      setError(errorMessage)
      console.error('Failed to update chat title:', err)
      toast.error('Failed to update chat title')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Search chats by title
  const searchChats = useCallback((query: string): Chat[] => {
    if (!query.trim()) return chats

    const searchTerm = query.toLowerCase().trim()
    return chats.filter(chat => 
      chat.title?.toLowerCase().includes(searchTerm)
    )
  }, [chats])

  // Get chat by ID
  const getChatById = useCallback((chatId: string): Chat | undefined => {
    return chats.find(chat => chat.id === chatId)
  }, [chats])

  // Refresh chats from database
  const refreshChats = useCallback(async (): Promise<void> => {
    await loadChats()
  }, [loadChats])

  // Computed statistics
  const totalChats = useMemo(() => chats.length, [chats])
  
  const totalMessages = useMemo(() => {
    // This would require a separate query in a real implementation
    // For now, return 0 as it's not critical
    return 0
  }, [])

  return {
    // Chat management
    chats,
    currentChatId,
    isLoading,
    error,
    
    // Chat operations
    createNewChat,
    selectChat,
    deleteChat,
    updateChatTitle,
    
    // Utility functions
    searchChats,
    getChatById,
    refreshChats,
    
    // Statistics
    totalChats,
    totalMessages
  }
}

/**
 * Hook for managing individual chat conversations with AI SDK
 * This replaces the complex useChat implementations
 */
export function useAiSdkChat(chatId: string | null, userId: string) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
    reload,
    append,
    status
  } = useChat({
    id: chatId || undefined,
    api: '/api/chat/ai-sdk-route',
    body: {
      userId,
      id: chatId || undefined
    },
    onFinish: async (message) => {
      // Auto-save is handled in the API route
      console.log('Message finished:', message.id)
    },
    onError: (error) => {
      console.error('Chat error:', error)
      toast.error('Failed to send message')
    }
  })

  // Enhanced message sending
  const sendMessage = useCallback(async (content: string, hints: string[] = []) => {
    if (!content.trim() || isLoading) return

    const fullContent = hints.length > 0 
      ? `${content}\n\nContext: ${hints.join(', ')}`
      : content

    try {
      await append({
        role: 'user',
        content: fullContent
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    }
  }, [append, isLoading])

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [setMessages])

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    status,
    sendMessage,
    clearMessages,
    reload
  }
}
