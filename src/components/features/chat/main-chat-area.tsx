"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { ArtifactWorkspace, EnhancedArtifactProvider, useEnhancedArtifacts } from "../artifacts"
import { SidebarHoverTrigger } from "../layout/sidebar-hover-trigger"
import { Button } from "@/components/ui/button"
import { X, Maximize2, Minimize2 } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { toast } from "sonner"
import { useResponsiveLayout, getAdaptiveLayoutClasses } from "@/hooks/shared/use-responsive-layout"
import type { MainChatAreaProps } from "@/types"
import type { Message } from "ai"

export function MainChatArea({ 
  user, 
  currentChatId, 
  onLogout, 
  onNewChat
}: MainChatAreaProps) {
  return (
    <EnhancedArtifactProvider initialMode="vercel">
      <MainChatAreaCore
        user={user}
        currentChatId={currentChatId}
        onLogout={onLogout}
        onNewChat={onNewChat}
      />
    </EnhancedArtifactProvider>
  )
}

function MainChatAreaCore({ 
  user, 
  currentChatId, 
  onLogout, 
  onNewChat
}: MainChatAreaProps) {
  // Simplified state - only UI state beyond AI SDK
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [isArtifactFullScreen, setIsArtifactFullScreen] = useState(false)
  
  // Enhanced responsive layout management
  const { dimensions, breakpoints } = useResponsiveLayout()
  
  // Use the enhanced artifacts context (Vercel system only)
  const {
    vercelArtifacts,
    activeArtifact,
    processMessageForArtifacts,
    clearArtifacts
  } = useEnhancedArtifacts()

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
      clearArtifacts()
      return []
    }

    try {
      const response = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(currentChatId)}`)
      if (!response.ok) {
        throw new Error('Failed to load messages')
      }
      const data = await response.json()
      const messages = data.messages || []
      
      // Process existing messages for artifacts
      clearArtifacts()
      messages.forEach((message: Message) => {
        if (message.role === 'assistant') {
          processMessageForArtifacts(message)
        }
      })
      
      return messages
    } catch (error) {
      console.error('Failed to load initial messages:', error)
      toast.error('Failed to load chat history')
      return []
    }
  }, [currentChatId, clearArtifacts, processMessageForArtifacts])

  // Extract artifacts and persist messages when finished
  const handleFinish = useCallback(async (message: Message) => {
    if (message.role === 'assistant') {
      // Process with enhanced artifacts context
      processMessageForArtifacts(message)

      // Persist the message via API (using sendExtraMessageFields pattern)
      if (currentChatId) {
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
    }
  }, [currentChatId, processMessageForArtifacts])

  // Use Vercel AI SDK's useChat hook - aligned with Chat SDK patterns
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
    reload
  } = useChat({
    id: currentChatId || undefined,
    api: '/api/chat',
    initialMessages: [], // Loaded async via setMessages
    sendExtraMessageFields: true, // AI SDK v4+ pattern for persistence
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

  // Transform messages for display - supporting both legacy content and AI SDK v4+ parts
  const displayMessages = useMemo(() => 
    messages.map(msg => {
      // Handle AI SDK v4+ message parts
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
        // Preserve parts for advanced rendering
        parts: msg.parts,
        // Preserve experimental attachments
        experimental_attachments: msg.experimental_attachments
      }
    }), [messages]
  )

  // Check if we're on the initial welcome screen
  const isInitialState = !currentChatId && messages.length === 0

  // Send message handler - simplified to use AI SDK patterns
  const handleSendMessage = useCallback(async (content: string, selectedHints: string[] = []) => {
    if (isLoading) {
      toast.warning('Please wait for the current message to complete')
      return
    }

    if (!content.trim()) {
      toast.warning('Please enter a message')
      return
    }

    const fullContent = selectedHints.length > 0 
      ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` 
      : content

    try {
      // Create a new chat if we don't have one
      if (!currentChatId && onNewChat) {
        onNewChat()
      }

      // Use AI SDK's append method
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
    clearArtifacts()
    onNewChat?.()
  }, [setMessages, clearArtifacts, onNewChat])

  // Toggle full-screen mode for artifacts
  const handleToggleFullScreen = useCallback(() => {
    setIsArtifactFullScreen(prev => !prev)
  }, [])

  // Reopen artifacts from a previous message
  const handleReopenArtifacts = useCallback((messageContent: string) => {
    const mockMessage: Message = {
      id: `reopen-${Date.now()}`,
      role: 'assistant',
      content: messageContent,
      createdAt: new Date()
    }
    
    processMessageForArtifacts(mockMessage)
    
    if (vercelArtifacts.length > 0) {
      toast.success(`Reopened ${vercelArtifacts.length} artifact${vercelArtifacts.length > 1 ? 's' : ''}`)
    } else {
      toast.warning('No artifacts found in this message')
    }
  }, [processMessageForArtifacts, vercelArtifacts.length])

  // Handle closing artifacts
  const handleCloseArtifacts = useCallback(() => {
    setIsArtifactFullScreen(false)
    clearArtifacts()
  }, [clearArtifacts])

  // Determine if we should show the artifact panel
  const showArtifactPanel = vercelArtifacts.length > 0

  // Viewport constraint check - force minimize chat if viewport is too narrow
  const shouldForceChatMinimize = useMemo(() => 
    showArtifactPanel && dimensions.width < 1000, 
    [showArtifactPanel, dimensions.width]
  )

  // Get adaptive layout classes
  const adaptiveLayoutClasses = useMemo(() => 
    getAdaptiveLayoutClasses(showArtifactPanel, breakpoints, dimensions.width), 
    [showArtifactPanel, breakpoints, dimensions.width]
  )

  // Debug information for layout (remove in production)
  const debugInfo = useMemo(() => {
    if (!showArtifactPanel || !adaptiveLayoutClasses.containerStyle) return null
    const chatPercentage = adaptiveLayoutClasses.containerStyle['--chat-percentage']
    const artifactPercentage = adaptiveLayoutClasses.containerStyle['--artifact-percentage']
    return { chatPercentage, artifactPercentage }
  }, [showArtifactPanel, adaptiveLayoutClasses])

  // Layout classes following Vercel Chat SDK patterns
  const chatContainerClass = showArtifactPanel 
    ? (isArtifactFullScreen
        ? 'hidden'
        : (isChatMinimized || shouldForceChatMinimize)
        ? 'w-80 min-w-80 max-w-80 flex-shrink-0' 
        : 'chat-area')
    : 'w-full'

  const artifactPanelClass = (isChatMinimized || shouldForceChatMinimize)
    ? 'flex-1 min-w-0 artifact-panel' 
    : isArtifactFullScreen
    ? 'fixed inset-0 z-50 w-screen h-screen artifact-panel bg-background'
    : 'artifact-panel'

  const containerStyles = showArtifactPanel && adaptiveLayoutClasses.containerStyle 
    ? adaptiveLayoutClasses.containerStyle 
    : undefined

  return (
    <SidebarInset className="flex flex-col relative chat-layout-container w-full h-full">
      <SidebarHoverTrigger />
      {!isArtifactFullScreen && (
        <ChatHeader 
          user={user} 
          onLogout={onLogout} 
          onNavigateHome={handleNavigateHome}
          artifactCount={vercelArtifacts.length}
        />
      )}

      <div 
        className={`flex-1 flex min-h-0 w-full overflow-hidden chat-flex-container ${
          showArtifactPanel ? 'has-artifacts' : ''
        } ${isArtifactFullScreen ? 'p-0' : ''}`}
        style={containerStyles}
      >
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

        {/* Artifact Panel - Vercel Chat SDK style */}
        {showArtifactPanel && activeArtifact && (
          <div className={`${isArtifactFullScreen ? '' : 'border-l border-border/50'} flex flex-col min-h-0 ${artifactPanelClass}`}>
            {/* Artifact Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">
                  {activeArtifact.title || 'Artifact'}
                </h3>
                {vercelArtifacts.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    +{vercelArtifacts.length - 1} more
                  </span>
                )}
                {/* Layout space indicator */}
                {showArtifactPanel && (
                  <span className="text-xs text-primary/60 font-mono bg-primary/5 px-2 py-1 rounded">
                    ~{Math.round(((dimensions.width - 350) / dimensions.width) * 100)}% space
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatMinimized(!isChatMinimized)}
                  className="h-8 w-8 p-0"
                >
                  {(isChatMinimized || shouldForceChatMinimize) ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFullScreen}
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseArtifacts}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Artifact Workspace - simplified to use AI SDK patterns */}
            <div className="flex-1 min-h-0">
              <ArtifactWorkspace
                artifact={activeArtifact}
                setArtifact={() => {}} // Managed by context
                chatId={currentChatId || 'main-chat'}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={isLoading ? 'loading' : 'idle'}
                stop={stop}
                attachments={[]}
                setAttachments={() => {}}
                messages={displayMessages}
                setMessages={setMessages}
                reload={reload}
                votes={undefined}
                append={append}
                isReadonly={false}
                selectedVisibilityType="private"
              />
            </div>
          </div>
        )}
      </div>
    </SidebarInset>
  )
}