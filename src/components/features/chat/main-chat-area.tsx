"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { SidebarHoverTrigger } from "../layout/sidebar-hover-trigger"
import { useChat } from "@ai-sdk/react"
import { toast } from "sonner"
import { useResponsiveLayout } from "@/hooks/shared/use-responsive-layout"
import type { MainChatAreaProps } from "@/types"
import type { Message } from "ai"

/**
 * Main Chat Area using official Vercel AI SDK patterns
 * 
 * Key features:
 * - Uses chat interface without artifacts
 * - Integrates with chat persistence
 * - Full compatibility with official Vercel AI SDK
 */
export function MainChatArea({ 
  user, 
  currentChatId, 
  onLogout, 
  onNewChat
}: MainChatAreaProps) {
  
  // Responsive layout
  const { dimensions } = useResponsiveLayout()

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
      const response = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(currentChatId)}`)
      if (!response.ok) {
        throw new Error('Failed to load messages')
      }
      const data = await response.json()
      return data.messages || []
    } catch (error) {
      console.error('Failed to load initial messages:', error)
      toast.error('Failed to load chat history')
      return []
    }
  }, [currentChatId])

  // Simple message persistence
  const handleFinish = useCallback(async (message: Message) => {
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
      console.error('Chat error:', error)
      toast.error('Failed to send message. Please try again.')
    }
  })

  // Load messages when chat ID changes
  useEffect(() => {
    loadInitialMessages().then(messages => {
      if (messages.length > 0) {
        setMessages(messages)
      }
    })
  }, [currentChatId, loadInitialMessages, setMessages])

  // Navigation handlers
  const handleNavigateHome = useCallback(() => {
    onNewChat?.()
  }, [onNewChat])

  // Check if we're on the initial welcome screen
  const isInitialScreen = !currentChatId || messages.length === 0

  // Layout calculations
  const showChatPanel = true
  const shouldMinimizeChat = dimensions.width < 1200

  return (
    <div className="flex h-full">
      {/* Chat Panel */}
      <SidebarInset className={`
        flex flex-col 
        ${shouldMinimizeChat ? 'min-w-[350px] w-[350px]' : 'flex-1'}
        transition-all duration-300 ease-in-out
        border-r border-border/40
      `}>
        <SidebarHoverTrigger />
        
        <ChatHeader 
          user={user}
          onLogout={onLogout}
          onNavigateHome={handleNavigateHome}
          currentChatId={currentChatId}
          messageCount={messages.length}
        />
        
        <div className="flex-1 flex flex-col">
          {isInitialScreen ? (
            <InitialWelcomeScreen 
              user={user}
              onStartChat={(message: string) => {
                if (!currentChatId) {
                  onNewChat?.()
                }
                append({ role: 'user', content: message })
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col">
              <ChatMessages 
                messages={messages}
                user={user}
                isLoading={isLoading}
              />
              
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={originalHandleSubmit}
                onStop={stop}
                isLoading={isLoading}
                disabled={false}
              />
            </div>
          )}
        </div>
      </SidebarInset>
    </div>
  )
}
