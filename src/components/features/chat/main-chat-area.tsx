"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { ArtifactPanel } from "../artifacts/artifact-panel"
import { SidebarHoverTrigger } from "../layout/sidebar-hover-trigger"
import { extractArtifacts } from "@/services/artifacts/artifact-extractor"
import { useChat } from "@ai-sdk/react"
import { toast } from "sonner"
import type { MainChatAreaProps, Artifact } from "@/types"
import type { Message } from "ai"

export function MainChatArea({ 
  user, 
  currentChatId, 
  onLogout, 
  onNewChat
}: MainChatAreaProps) {
  const [currentArtifacts, setCurrentArtifacts] = useState<Artifact[]>([])
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  
  // Initialize user in chat service via API
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

  // Extract artifacts when message is finished
  const handleFinish = useCallback((message: Message) => {
    if (message.role === 'assistant') {
      const artifacts = extractArtifacts(message.content)
      setCurrentArtifacts(artifacts)
    }
  }, [])

  // Use Vercel AI SDK's useChat hook
  const { 
    messages, 
    isLoading, 
    error,
    setMessages,
    append
  } = useChat({
    id: currentChatId || undefined,
    api: '/api/chat',
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

  // Transform messages for display
  const mappedMessages = useMemo(() => 
    messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.createdAt || new Date(),
      model: 'gpt-4',
      isError: false
    })), [messages]
  )

  // Check if we're on the initial welcome screen
  const isInitialState = !currentChatId && messages.length === 0

  // Send message handler
  const handleSendMessage = useCallback(async (content: string, selectedHints: string[] = []) => {
    if (isLoading) {
      toast.warning('Please wait for the current message to complete')
      return
    }

    if (!content.trim()) {
      toast.warning('Please enter a message')
      return
    }

    // Clear artifacts when starting a new message
    setCurrentArtifacts([])

    const fullContent = selectedHints.length > 0 
      ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` 
      : content

    try {
      // If no current chat ID, this will be a new chat
      if (!currentChatId && onNewChat) {
        onNewChat()
      }

      await append({
        role: 'user',
        content: fullContent
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message. Please try again.')
    }
  }, [isLoading, currentChatId, onNewChat, append])

  // Navigate to home/new chat
  const handleNavigateHome = useCallback(() => {
    setMessages([])
    setCurrentArtifacts([])
    onNewChat?.()
  }, [setMessages, onNewChat])

  // Reopen artifacts from a previous message
  const handleReopenArtifacts = useCallback((messageContent: string) => {
    const artifacts = extractArtifacts(messageContent)
    
    if (artifacts.length > 0) {
      setCurrentArtifacts(artifacts)
      toast.success(`Reopened ${artifacts.length} artifact${artifacts.length > 1 ? 's' : ''}`)
    } else {
      toast.warning('No artifacts found in this message')
    }
  }, [])

  // Determine if we should show the artifact panel
  const showArtifactPanel = currentArtifacts.length > 0

  // Responsive layout: ensure both chat and artifacts fit within viewport
  const chatContainerClass = showArtifactPanel 
    ? (isChatMinimized 
        ? 'w-80 min-w-80 max-w-80 flex-shrink-0' 
        : 'flex-1 min-w-0 chat-area')
    : 'w-full'

  const artifactPanelClass = isChatMinimized 
    ? 'flex-1 min-w-0 artifact-panel' 
    : 'w-96 min-w-96 max-w-[45vw] flex-shrink-0 artifact-panel'

  return (
    <SidebarInset className="flex flex-col relative chat-layout-container">
      <SidebarHoverTrigger />
      <ChatHeader 
        user={user} 
        onLogout={onLogout} 
        onNavigateHome={handleNavigateHome}
        artifactCount={currentArtifacts.length}
      />

      <div className="flex-1 flex min-h-0 max-w-full overflow-hidden chat-flex-container">
        {/* Chat Area */}
        <div className={`flex flex-col min-h-0 ${chatContainerClass}`}>
          {isInitialState ? (
            <InitialWelcomeScreen 
              user={user} 
              onSendMessage={handleSendMessage} 
            />
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatMessages 
                  messages={mappedMessages} 
                  isLoading={isLoading} 
                  user={user} 
                  onReopenArtifacts={handleReopenArtifacts}
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

        {/* Artifact Panel */}
        {showArtifactPanel && (
          <div className={`border-l border-border/50 flex flex-col min-h-0 ${artifactPanelClass}`}>
            <ArtifactPanel 
              artifacts={currentArtifacts} 
              isChatMinimized={isChatMinimized}
              onToggleChatMinimized={() => setIsChatMinimized(!isChatMinimized)}
              onClose={() => setCurrentArtifacts([])}
            />
          </div>
        )}
      </div>
    </SidebarInset>
  )
}
