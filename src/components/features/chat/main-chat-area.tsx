"use client"

import { useState, useEffect, useCallback } from "react"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { useChat } from "@ai-sdk/react"
import { toast } from "sonner"
import type { MainChatAreaProps } from "@/types"
import type { Message } from "ai"

/**
 * Main Chat Area using official Vercel AI SDK patterns
 * 
 * Key features:
 * - Uses full screen width without artifacts
 * - Integrates with chat persistence
 * - Full compatibility with official Vercel AI SDK
 */
export function MainChatArea({ 
  user, 
  currentChatId, 
  onLogout, 
  onNewChat,
  onChatCreated
}: MainChatAreaProps) {
  
  // Initialize user in chat service
  useEffect(() => {
    const initializeUser = async () => {
      if (user?.email) {
        try {
          await fetch('/api/chat/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.email,
              name: user.name,
              email: user.email
            })
          })
        } catch (error) {
          console.error('Failed to initialize user:', error)
        }
      }
    }
    
    initializeUser()
  }, [user?.email, user?.name])

  // Load initial messages for existing chats
  const loadInitialMessages = useCallback(async () => {
    if (!currentChatId) {
      return []
    }

    try {
      console.log(`[MAIN_CHAT] Loading messages for chat: ${currentChatId}`)
      const response = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(currentChatId)}`)
      if (!response.ok) {
        console.error(`[MAIN_CHAT] Failed to load messages: ${response.status} ${response.statusText}`)
        throw new Error('Failed to load messages')
      }
      const data = await response.json()
      const messages = data.messages || []
      console.log(`[MAIN_CHAT] Loaded ${messages.length} messages for chat: ${currentChatId}`)
      return messages
    } catch (error) {
      console.error('Failed to load initial messages:', error)
      toast.error('Failed to load chat history')
      return []
    }
  }, [currentChatId])

  // Simple message persistence
  const handleFinish = useCallback(async (message: Message) => {
    console.log(`[MAIN_CHAT] Message finished, chatId: ${currentChatId}, message:`, message)
    if (!currentChatId) return
    
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentChatId,
          message
        })
      })
      console.log(`[MAIN_CHAT] Message persisted successfully`)
    } catch (error) {
      console.error('Failed to persist message:', error)
    }
  }, [currentChatId])

  // Chat hook from Vercel AI SDK
  const {
    messages,
    setMessages,
    append,
    input,
    setInput,
    handleSubmit: originalHandleSubmit,
    stop,
    reload,
    isLoading
  } = useChat({
    id: currentChatId || undefined,
    api: '/api/chat',
    initialMessages: [],
    sendExtraMessageFields: true,
    body: {
      userId: user?.email,
      id: currentChatId || undefined
    },
    onFinish: handleFinish,
    onError: (error) => {
      console.error('[MAIN_CHAT] Chat error:', error)
      toast.error('Failed to send message. Please try again.')
    },
    onToolCall: ({ toolCall }) => {
      console.log('[MAIN_CHAT] Tool call initiated:', toolCall)
    }
  })

  // Handle chat creation when starting from welcome screen
  const handleStartChat = useCallback(async (message: string) => {
    console.log(`[MAIN_CHAT] Starting chat with message: "${message}", currentChatId: ${currentChatId}`)
    
    if (!currentChatId) {
      // When no current chat, we need to create one first
      try {
        console.log(`[MAIN_CHAT] Creating new chat for user: ${user.email}`)
        const response = await fetch('/api/chat/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.email,
            title: 'New Chat'
          })
        })
        
        if (response.ok) {
          const newChat = await response.json()
          console.log(`[MAIN_CHAT] Created new chat: ${newChat.id}`)
          
          // Notify parent component about the new chat immediately
          onChatCreated?.(newChat.id)
          
          // Directly append to the local messages instead of waiting for chat ID update
          // This ensures the message is sent immediately to the new chat
          const userMessage = { role: 'user' as const, content: message }
          
          // Use a small delay to ensure the state has updated
          setTimeout(() => {
            console.log(`[MAIN_CHAT] Appending message to new chat: ${newChat.id}`)
            append(userMessage)
          }, 100)
        } else {
          console.error(`[MAIN_CHAT] Failed to create chat: ${response.status} ${response.statusText}`)
          toast.error('Failed to create new chat')
        }
      } catch (error) {
        console.error('Failed to start chat:', error)
        toast.error('Failed to start chat. Please try again.')
      }
    } else {
      // If we already have a chat, just append the message
      console.log(`[MAIN_CHAT] Appending message to existing chat: ${currentChatId}`)
      append({ role: 'user', content: message })
    }
  }, [currentChatId, user.email, onChatCreated, append])

  // Load messages when chat ID changes
  useEffect(() => {
    console.log(`[MAIN_CHAT] Chat ID changed to: ${currentChatId}`)
    if (currentChatId) {
      loadInitialMessages().then(messages => {
        console.log(`[MAIN_CHAT] Setting ${messages.length} messages for chat: ${currentChatId}`)
        if (messages.length > 0) {
          setMessages(messages)
        } else {
          // Clear messages if no messages are found for this chat
          setMessages([])
        }
      })
    } else {
      // Clear messages when no chat is selected (going back to welcome screen)
      console.log(`[MAIN_CHAT] Clearing messages as no chat is selected`)
      setMessages([])
    }
  }, [currentChatId, loadInitialMessages, setMessages])

  // Effect to handle chat ID updates for the useChat hook
  useEffect(() => {
    console.log(`[MAIN_CHAT] useChat hook effect - currentChatId: ${currentChatId}`)
  }, [currentChatId])

  // Add debug logging for messages changes
  useEffect(() => {
    console.log(`[MAIN_CHAT] Messages updated:`, messages.length, messages)
  }, [messages])

  // Navigation handlers
  const handleNavigateHome = useCallback(() => {
    onNewChat?.()
  }, [onNewChat])

  // Check if we're on the initial welcome screen
  const isInitialScreen = !currentChatId || (messages.length === 0 && !isLoading)

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Header - Full width */}
      <div className="flex-shrink-0 w-full">
        <ChatHeader 
          user={user}
          onLogout={onLogout}
          onNavigateHome={handleNavigateHome}
          currentChatId={currentChatId}
          messageCount={messages.length}
        />
      </div>
      
      {/* Main Content Area - Full width and height */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        {isInitialScreen ? (
          <InitialWelcomeScreen 
            user={user}
            onStartChat={handleStartChat}
          />
        ) : (
          <div className="flex flex-col h-full">
            {/* Messages Area - Scrollable */}
            <div className="flex-1 overflow-hidden">
              <ChatMessages 
                messages={messages}
                user={user}
                isLoading={isLoading}
              />
            </div>
            
            {/* Input Area - Fixed at bottom */}
            <div className="flex-shrink-0">
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={originalHandleSubmit}
                onStop={stop}
                isLoading={isLoading}
                disabled={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
