"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { ArtifactWorkspace, EnhancedArtifactProvider, useEnhancedArtifacts } from "../artifacts"
import { initialArtifactData } from "../artifacts/artifact-workspace-vercel"
import type { UIArtifact } from "@/lib/artifacts/types"
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
  const [currentUIArtifact, setCurrentUIArtifact] = useState<UIArtifact>(() => ({ ...initialArtifactData, isVisible: false }))
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [isArtifactFullScreen, setIsArtifactFullScreen] = useState(false)
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [input, setInput] = useState("")
  
  // Artifact workspace state
  const [artifactInput, setArtifactInput] = useState("")
  const [workspaceMessages, setWorkspaceMessages] = useState<any[]>([])
  
  // Enhanced responsive layout management
  const { dimensions, breakpoints } = useResponsiveLayout()
  
  // Use the enhanced artifacts context (Vercel system only)
  const {
    vercelArtifacts,
    activeArtifact,
    processMessageForArtifacts,
    clearArtifacts
  } = useEnhancedArtifacts()
  
  // Update current UI artifact when vercel artifacts change
  useEffect(() => {
    if (vercelArtifacts.length > 0 && activeArtifact) {
      setCurrentUIArtifact(activeArtifact)
    } else {
      setCurrentUIArtifact(prev => ({ ...prev, isVisible: false }))
    }
  }, [vercelArtifacts, activeArtifact])
  
  // Load initial messages when currentChatId changes
  useEffect(() => {
    async function loadMessages() {
      if (!currentChatId) {
        setInitialMessages([])
        clearArtifacts()
        return
      }

      setIsLoadingMessages(true)
      try {
        const response = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(currentChatId)}`)
        if (!response.ok) {
          throw new Error('Failed to load messages')
        }
        const data = await response.json()
        const messages = data.messages || []
        setInitialMessages(messages)
        
        // Process existing messages for artifacts
        clearArtifacts()
        messages.forEach((message: Message) => {
          processMessageForArtifacts(message)
        })
      } catch (error) {
        console.error('Failed to load initial messages:', error)
        toast.error('Failed to load chat history')
        setInitialMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [currentChatId, clearArtifacts, processMessageForArtifacts])
  
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
  const handleFinish = useCallback(async (message: Message) => {
    if (message.role === 'assistant') {
      // Process with enhanced artifacts context (Vercel system only)
      processMessageForArtifacts(message)

      // Persist the message if we have a chat ID - now via API
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
          // Don't show error to user as this is background operation
        }
      }
    }
  }, [currentChatId, processMessageForArtifacts])

  // Use Vercel AI SDK's useChat hook with proper initial messages
  const { 
    messages, 
    isLoading, 
    error,
    setMessages,
    append
  } = useChat({
    id: currentChatId || undefined,
    api: '/api/chat',
    initialMessages, // Use loaded initial messages
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
    messages.map(msg => {
      // Extract content from parts for AI SDK v4+ compatibility
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
        parts: msg.parts
      }
    }), [messages]
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

    const fullContent = selectedHints.length > 0 
      ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` 
      : content

    try {
      // Create a new chat if we don't have one
      if (!currentChatId && onNewChat) {
        onNewChat()
      }

      const userMessage = {
        role: 'user' as const,
        content: fullContent
      }

      // Persist user message immediately if we have a chat ID - now via API
      if (currentChatId) {
        try {
          await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: currentChatId,
              message: {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'user',
                content: fullContent,
                createdAt: new Date()
              }
            })
          })
        } catch (error) {
          console.error('Failed to persist user message:', error)
          // Don't show error to user as this is background operation
        }
      }

      await append(userMessage)
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
    // Create a mock message to process with the Vercel system
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

  // Artifact workspace callbacks
  const handleArtifactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!artifactInput.trim() || isLoading) return

    try {
      await handleSendMessage(artifactInput)
      setArtifactInput("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }, [artifactInput, handleSendMessage, isLoading])

  const handleArtifactStop = useCallback(() => {
    console.log("Stop streaming requested")
  }, [])

  const handleArtifactReload = useCallback(() => {
    console.log("Reload requested")
  }, [])

  const handleArtifactAppend = useCallback((message: any) => {
    setWorkspaceMessages(prev => [...prev, message])
  }, [])

  // Sync workspace messages with main chat messages
  useEffect(() => {
    setWorkspaceMessages(mappedMessages)
  }, [mappedMessages])

  // Determine if we should show the artifact panel
  const showArtifactPanel = vercelArtifacts.length > 0

  // Viewport constraint check - force minimize chat if viewport is too narrow
  const shouldForceChatMinimize = useMemo(() => 
    showArtifactPanel && dimensions.width < 1000, 
    [showArtifactPanel, dimensions.width]
  )

  // Handle closing artifacts (also exits full-screen)
  const handleCloseArtifacts = useCallback(() => {
    setIsArtifactFullScreen(false)
    clearArtifacts()
  }, [clearArtifacts])

  // Get adaptive layout classes based on current breakpoint and state
  const adaptiveLayoutClasses = useMemo(() => 
    getAdaptiveLayoutClasses(showArtifactPanel, breakpoints, dimensions.width), 
    [showArtifactPanel, breakpoints, dimensions.width]
  )

  // Vercel-inspired layout: container-based constraints that prevent horizontal overflow
  const chatContainerClass = showArtifactPanel 
    ? (isArtifactFullScreen
        ? 'hidden'
        : (isChatMinimized || shouldForceChatMinimize)
        ? 'w-80 min-w-80 max-w-80 flex-shrink-0' 
        : 'chat-area') // Use simple class, width controlled by CSS custom properties
    : 'w-full'

  const artifactPanelClass = (isChatMinimized || shouldForceChatMinimize)
    ? 'flex-1 min-w-0 artifact-panel' 
    : isArtifactFullScreen
    ? 'fixed inset-0 z-50 w-screen h-screen artifact-panel bg-background'
    : 'artifact-panel' // Use simple class, width controlled by CSS custom properties

  // Container styles for CSS custom properties
  const containerStyles = showArtifactPanel && adaptiveLayoutClasses.containerStyle 
    ? adaptiveLayoutClasses.containerStyle 
    : undefined

  // Debug info (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.debug('Vercel-inspired Layout Debug:', {
      showArtifactPanel,
      dimensions,
      breakpoints,
      shouldForceChatMinimize,
      chatContainerClass,
      artifactPanelClass,
      containerStyles,
      totalMinWidth: 850,
      hasHorizontalSpace: dimensions.width >= 850
    })
  }

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

        {/* Enhanced Artifact Panel */}
        {showArtifactPanel && (
          <div className={`${isArtifactFullScreen ? '' : 'border-l border-border/50'} flex flex-col min-h-0 ${artifactPanelClass}`}>
            {/* Artifact Header with controls */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">
                  {currentUIArtifact.title}
                </h3>
                {vercelArtifacts.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    +{vercelArtifacts.length - 1} more
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

            {/* Vercel Workspace */}
            <div className="flex-1 min-h-0">
              <ArtifactWorkspace
                artifact={currentUIArtifact}
                setArtifact={setCurrentUIArtifact}
                chatId={currentChatId || 'main-chat'}
                input={artifactInput}
                setInput={setArtifactInput}
                handleSubmit={handleArtifactSubmit}
                status={isLoading ? 'loading' : 'idle'}
                stop={handleArtifactStop}
                attachments={[]}
                setAttachments={() => {}}
                messages={workspaceMessages}
                setMessages={setWorkspaceMessages}
                reload={handleArtifactReload}
                votes={undefined}
                append={handleArtifactAppend}
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
