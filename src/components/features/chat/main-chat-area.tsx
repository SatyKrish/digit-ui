"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { ArtifactWorkspace, initialArtifactData } from "../artifacts/artifact-workspace-vercel"
import { SidebarHoverTrigger } from "../layout/sidebar-hover-trigger"
import { useChat } from "@ai-sdk/react"
import { toast } from "sonner"
import { useResponsiveLayout } from "@/hooks/shared/use-responsive-layout"
import type { MainChatAreaProps } from "@/types"
import type { Message } from "ai"
import type { UIArtifact } from "@/lib/artifacts/types"

/**
 * Main Chat Area using official Vercel AI SDK patterns
 * 
 * Key features:
 * - Uses official ArtifactWorkspace component with full client.tsx definitions
 * - Integrates artifacts through data stream processing
 * - Eliminates custom bridge components (System B)
 * - Full compatibility with official Vercel AI SDK artifact system
 */
export function MainChatArea({ 
  user, 
  currentChatId, 
  onLogout, 
  onNewChat
}: MainChatAreaProps) {
  // Official Vercel AI SDK artifact state
  const [artifact, setArtifact] = useState<UIArtifact>(initialArtifactData)
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
    handleSubmit: originalHandleSubmit,
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

  // Process data stream for artifacts (official Vercel pattern)
  useEffect(() => {
    if (!data || data.length === 0) return

    console.log('[MainChatArea] Processing data stream for artifacts:', data)

    // Look for artifact creation signals in the data stream
    for (const item of data) {
      if (typeof item === 'object' && item !== null) {
        // Check for artifact creation data
        if ('type' in item && 'kind' in item && 'content' in item) {
          console.log('[MainChatArea] Found artifact data:', item)
          
          // Create or update artifact using official Vercel pattern
          setArtifact((prev) => ({
            ...prev,
            documentId: (item as any).id || `artifact-${Date.now()}`,
            content: (item as any).content || '',
            kind: (item as any).kind || 'text',
            title: (item as any).title || 'Artifact',
            status: (item as any).status || 'completed',
            isVisible: true,
            boundingBox: {
              top: 100,
              left: 100,
              width: 800,
              height: 600,
            }
          }))
          break
        }
        
        // Check for chart-specific data
        if ('data' in item && Array.isArray((item as any).data) && (item as any).data.length > 0) {
          console.log('[MainChatArea] Found chart data:', item)
          
          setArtifact((prev) => ({
            ...prev,
            documentId: `chart-${Date.now()}`,
            content: JSON.stringify(item),
            kind: 'chart',
            title: (item as any).title || 'Data Chart',
            status: 'completed',
            isVisible: true,
            boundingBox: {
              top: 100,
              left: 100,
              width: 800,
              height: 600,
            }
          }))
          break
        }
      }
    }
  }, [data])

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
    setArtifact(initialArtifactData)
    setIsArtifactFullScreen(false)
    if (onNewChat) {
      onNewChat()
    }
  }, [setMessages, onNewChat])

  // Official Vercel handleSubmit wrapper
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      handleSendMessage(input.trim())
      setInput('')
    }
  }, [input, handleSendMessage, setInput])

  // Check if we're on the initial welcome screen
  const isInitialState = !currentChatId && messages.length === 0

  // Check if we have artifacts visible
  const showArtifactPanel = artifact.isVisible && artifact.documentId !== 'init'
  const shouldMinimizeChat = showArtifactPanel && dimensions.width < 1200
  
  // Dynamic layout classes for official Vercel pattern
  const chatContainerClass = showArtifactPanel 
    ? (isArtifactFullScreen
        ? 'hidden'
        : shouldMinimizeChat
        ? 'w-80 min-w-80 max-w-80 flex-shrink-0' 
        : 'flex-1')
    : 'w-full'

  return (
    <SidebarInset className="flex flex-col relative w-full h-full">
      <SidebarHoverTrigger />
      
      {!isArtifactFullScreen && (
        <ChatHeader 
          user={user} 
          onLogout={onLogout} 
          onNavigateHome={handleNavigateHome}
          artifactCount={showArtifactPanel ? 1 : 0}
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

        {/* Official Vercel AI SDK Artifact Workspace */}
        {showArtifactPanel && (
          <ArtifactWorkspace
            artifact={artifact}
            setArtifact={setArtifact}
            chatId={currentChatId || 'default'}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={isLoading ? 'loading' : 'idle'}
            stop={stop}
            attachments={[]}
            setAttachments={() => {}}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            votes={undefined}
            append={append}
            isReadonly={false}
            selectedVisibilityType="public"
          />
        )}
      </div>
    </SidebarInset>
  )
}
