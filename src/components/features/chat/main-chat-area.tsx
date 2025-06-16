"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { SimpleArtifact } from "../artifacts/simple-artifact"
import { SidebarHoverTrigger } from "../layout/sidebar-hover-trigger"
import { useChat } from "@ai-sdk/react"
import { toast } from "sonner"
import { useResponsiveLayout } from "@/hooks/shared/use-responsive-layout"
import type { MainChatAreaProps } from "@/types"
import type { Message } from "ai"

/**
 * Main Chat Area aligned with official Vercel AI SDK patterns
 * 
 * Key changes from the custom implementation:
 * - Uses useChat hook's `data` property for artifacts (official pattern)
 * - Removes complex custom artifact providers and state management
 * - Simplifies layout management
 * - Follows the same pattern as digit-chat reference implementation
 */
export function MainChatArea({ 
  user, 
  currentChatId, 
  onLogout, 
  onNewChat
}: MainChatAreaProps) {
  // Simple UI state - no complex artifact context needed
  const [isArtifactVisible, setIsArtifactVisible] = useState(false)
  const [isArtifactFullScreen, setIsArtifactFullScreen] = useState(false)
  
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
    if (message.role === 'assistant' && currentChatId) {
      try {
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: currentChatId,
            message: message
          })
        })
      } catch (error) {
        console.error('Failed to persist message:', error)
      }
    }
  }, [currentChatId])

  // Official Vercel AI SDK useChat hook with data property for artifacts
  const { 
    messages, 
    isLoading, 
    error,
    setMessages,
    append,
    input,
    setInput,
    handleSubmit,
    stop,
    reload,
    data  // This is the key - artifacts come through the data property (official pattern)
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

  // Transform messages for display
  const displayMessages = useMemo(() => 
    messages.map(msg => {
      const content = msg.parts
        ?.filter(part => part.type === 'text')
        .map(part => part.text)
        .join('\n') || msg.content || ''
      
      return {
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content,
        timestamp: msg.createdAt || new Date(),
        model: 'gpt-4',
        isError: false,
        parts: msg.parts,
        experimental_attachments: msg.experimental_attachments
      }
    }), [messages]
  )

  // Check if we're on the initial welcome screen
  const isInitialState = !currentChatId && messages.length === 0

  // Send message handler
  const handleSendMessage = useCallback(async (content: string, selectedHints: string[] = []) => {
    if (!content.trim()) return

    try {
      const fullContent = selectedHints.length > 0 
        ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` 
        : content

      await append({
        role: 'user',
        content: fullContent.trim()
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message. Please try again.')
    }
  }, [append])

  // Navigation handlers
  const handleNavigateHome = useCallback(() => {
    setMessages([])
    setIsArtifactVisible(false)
    setIsArtifactFullScreen(false)
    if (onNewChat) {
      onNewChat()
    }
  }, [setMessages, onNewChat])

  // Check if we have artifacts in the data stream (official Vercel pattern)
  const hasArtifacts = useMemo(() => {
    if (!data || data.length === 0) return false
    
    return data.some(item => {
      if (typeof item === 'object' && item !== null) {
        return 'type' in item || 'kind' in item || 'content' in item || 'data' in item
      }
      return false
    })
  }, [data])

  // Show artifact panel when artifacts are available
  useEffect(() => {
    if (hasArtifacts && !isArtifactVisible) {
      setIsArtifactVisible(true)
    }
  }, [hasArtifacts, isArtifactVisible])

  // Simple layout calculations (no complex adaptive layout classes needed)
  const showArtifactPanel = isArtifactVisible && hasArtifacts
  const shouldMinimizeChat = showArtifactPanel && dimensions.width < 1000
  
  const chatContainerClass = showArtifactPanel 
    ? (isArtifactFullScreen
        ? 'hidden'
        : shouldMinimizeChat
        ? 'w-80 min-w-80 max-w-80 flex-shrink-0' 
        : 'flex-1')
    : 'w-full'

  const artifactContainerClass = showArtifactPanel 
    ? (isArtifactFullScreen
        ? 'w-full h-full'
        : shouldMinimizeChat
        ? 'flex-1 min-w-0'
        : 'w-96 min-w-96 max-w-96 flex-shrink-0')
    : 'hidden'

  return (
    <SidebarInset className="flex flex-col relative w-full h-full">
      <SidebarHoverTrigger />
      
      {!isArtifactFullScreen && (
        <ChatHeader 
          user={user} 
          onLogout={onLogout} 
          onNavigateHome={handleNavigateHome}
          artifactCount={hasArtifacts ? 1 : 0}
        />
      )}

      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Chat Area */}
        <div className={`flex flex-col min-h-0 overflow-hidden ${chatContainerClass}`}>
          {isInitialState ? (
            <InitialWelcomeScreen 
              user={user} 
              onSendMessage={handleSendMessage} 
            />
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatMessages 
                  messages={displayMessages} 
                  isLoading={isLoading} 
                  user={user} 
                />
              </div>
              <div className="flex-shrink-0 p-4">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </div>

        {/* Simple Artifact Panel - Official Vercel AI SDK Pattern */}
        <div className={artifactContainerClass}>
          <SimpleArtifact
            data={data || []}
            isVisible={showArtifactPanel}
            onClose={() => {
              setIsArtifactVisible(false)
              setIsArtifactFullScreen(false)
            }}
            onToggleFullScreen={() => setIsArtifactFullScreen(!isArtifactFullScreen)}
            isFullScreen={isArtifactFullScreen}
          />
        </div>
      </div>
    </SidebarInset>
  )
}