"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { ArtifactPanel } from "../artifacts/artifact-panel"
import { StreamableArtifact } from "../artifacts/streamable-artifact"
import { SidebarHoverTrigger } from "../layout/sidebar-hover-trigger"
import { useSidebar } from "@/components/ui/sidebar"
import { extractArtifacts, hasArtifacts } from "@/services/artifacts/artifact-extractor"
import { useChat } from "@ai-sdk/react"
import { toast } from "sonner"
import type { MainChatAreaProps, Artifact } from "@/types"
import type { Message } from "ai"

interface EnhancedMainChatAreaProps extends MainChatAreaProps {
  // Enhanced functionality props
  enableSmootherStreaming?: boolean;
  enableThrottling?: boolean;
  maxRetries?: number;
}

export function MainChatArea({ 
  user, 
  currentChatId, 
  onLogout, 
  onNewChat,
  enableSmootherStreaming = true,
  enableThrottling = true,
  maxRetries = 3
}: EnhancedMainChatAreaProps) {
  const [currentArtifacts, setCurrentArtifacts] = useState<Artifact[]>([])
  const [isGeneratingArtifacts, setIsGeneratingArtifacts] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const { open: sidebarOpen } = useSidebar()
  
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

  // Enhanced error handling with retry logic
  const handleError = useCallback((error: Error) => {
    console.error('Chat error:', error)
    
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      toast.error(`Connection error. Retrying... (${retryCount + 1}/${maxRetries})`)
    } else {
      toast.error('Unable to connect to chat service. Please refresh the page.')
    }
  }, [retryCount, maxRetries])

  // Enhanced finish handler with better artifact processing
  const handleFinish = useCallback((message: Message) => {
    console.log('Message finished:', message.id, 'Content preview:', message.content.substring(0, 100))
    
    // Update artifacts from the completed message
    if (message.role === 'assistant') {
      try {
        // First check if the message has artifacts before doing expensive extraction
        if (hasArtifacts(message.content)) {
          console.log('Message has artifacts, extracting...')
          const artifacts = extractArtifacts(message.content)
          console.log('Extracted artifacts:', artifacts)
          
          if (artifacts.length > 0) {
            setIsGeneratingArtifacts(true)
            
            // Simulate artifact processing time for better UX
            setTimeout(() => {
              setCurrentArtifacts(artifacts)
              setIsGeneratingArtifacts(false)
              
              // Show success toast if artifacts were generated
              toast.success(`Generated ${artifacts.length} artifact${artifacts.length > 1 ? 's' : ''}`)
            }, 800)
          } else {
            console.log('hasArtifacts returned true but extractArtifacts found none')
            setCurrentArtifacts([])
            setIsGeneratingArtifacts(false)
          }
        } else {
          console.log('Message has no artifacts')
          // No artifacts found, clear any existing ones
          setCurrentArtifacts([])
          setIsGeneratingArtifacts(false)
        }
      } catch (error) {
        console.error('Failed to extract artifacts:', error)
        setIsGeneratingArtifacts(false)
        setCurrentArtifacts([])
        // Don't show user error for artifact extraction failures
      }
    }
  }, [])

  // Use Vercel AI SDK's useChat hook with enhanced configuration
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    error,
    setMessages,
    reload,
    setInput,
    append,
    status // Enhanced connection status tracking
  } = useChat({
    id: currentChatId || undefined,
    api: '/api/chat',
    body: {
      userId: user?.email,
      id: currentChatId || undefined,
      enableSmootherStreaming,
      enableThrottling
    },
    // Load initial messages for existing chats
    initialMessages: useMemo(() => {
      // This will be populated by the API route when currentChatId is provided
      return []
    }, [currentChatId]),
    onFinish: handleFinish,
    onError: handleError
  })

  // Check if we're on the initial welcome screen
  const isInitialState = !currentChatId && messages.length === 0

  // Enhanced message sending with better error handling
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
    setIsGeneratingArtifacts(false)

    const fullContent = selectedHints.length > 0 
      ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` 
      : content

    try {
      // If no current chat ID, this will be a new chat
      if (!currentChatId && onNewChat) {
        onNewChat()
      }

      // Use AI SDK's append function
      await append({
        role: 'user',
        content: fullContent
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message. Please try again.')
    }
  }, [isLoading, currentChatId, onNewChat, append])

  // Enhanced navigation with cleanup
  const handleNavigateHome = useCallback(() => {
    // Clear current state
    setMessages([])
    setCurrentArtifacts([])
    setRetryCount(0)
    
    // Navigate to welcome screen
    onNewChat?.()
  }, [setMessages, onNewChat])

  // Enhanced retry functionality
  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      toast.error('Maximum retries reached. Please refresh the page.')
      return
    }

    try {
      await reload()
    } catch (error) {
      console.error('Retry failed:', error)
      handleError(error as Error)
    }
  }, [retryCount, maxRetries, reload, handleError])

  // Determine if we should show the artifact panel
  const showArtifactPanel = currentArtifacts.length > 0 || isGeneratingArtifacts
  
  // Debug logging for artifact panel visibility
  useEffect(() => {
    console.log('Artifact panel state:', {
      showArtifactPanel,
      currentArtifactsCount: currentArtifacts.length,
      isGeneratingArtifacts,
      messagesCount: messages.length
    })
  }, [showArtifactPanel, currentArtifacts.length, isGeneratingArtifacts, messages.length])

  // Connection status indicator
  const connectionStatus = useMemo(() => {
    if (status === 'streaming') return 'Thinking...'
    if (error) return 'Connection error'
    if (status === 'ready') return 'Ready'
    return ''
  }, [status, error])

  return (
    <SidebarInset className="flex flex-col relative transition-all duration-300 ease-in-out">
      <SidebarHoverTrigger />
      <ChatHeader 
        user={user} 
        onLogout={onLogout} 
        onNavigateHome={handleNavigateHome}
        connectionStatus={connectionStatus}
        artifactCount={currentArtifacts.length}
      />

      <div className="flex-1 flex min-h-0 transition-all duration-500 ease-in-out">
        <div className="flex flex-col min-h-0 overflow-hidden flex-1">
          {isInitialState ? (
            <InitialWelcomeScreen user={user} onSendMessage={handleSendMessage} />
          ) : (
            <>
              <div className="flex-1 min-h-0">
                <ChatMessages 
                  messages={messages.map(msg => ({
                    id: msg.id,
                    role: msg.role as 'user' | 'assistant' | 'system',
                    content: msg.content,
                    timestamp: msg.createdAt || new Date(),
                    model: 'gpt-4',
                    isError: false
                  }))} 
                  isLoading={isLoading} 
                  user={user} 
                />
              </div>
              <div className="flex-shrink-0 p-4">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isLoading={isLoading}
                  placeholder={isGeneratingArtifacts ? "Generating artifacts..." : undefined}
                />
              </div>
            </>
          )}
        </div>

        {showArtifactPanel && (
          <div 
            className={`flex flex-col min-h-0 overflow-hidden transition-all duration-500 ease-in-out ${
              isChatMinimized 
                ? "w-[600px] xl:w-[700px] 2xl:w-[800px]" 
                : "w-[450px] xl:w-[550px] 2xl:w-[650px]"
            }`}
          >
            {isGeneratingArtifacts ? (
              <div className="flex-1 flex flex-col bg-gradient-to-b from-background/50 to-muted/5 animate-fade-in overflow-hidden">
                <div className="flex-shrink-0 border-b border-border/50 p-4 lg:p-6 shadow-soft bg-background">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary/60 border-t-primary rounded-full animate-spin" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Generating Artifacts</h2>
                      <p className="text-xs text-muted-foreground">
                        Creating interactive content...
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0 p-6">
                  <StreamableArtifact 
                    artifact={null} 
                    isStreaming={true}
                  />
                </div>
              </div>
            ) : (
              <ArtifactPanel 
                artifacts={currentArtifacts} 
                isChatMinimized={isChatMinimized}
                onToggleChatMinimized={() => setIsChatMinimized(!isChatMinimized)}
                onClose={() => {
                  setCurrentArtifacts([])
                  setIsGeneratingArtifacts(false)
                }}
              />
            )}
          </div>
        )}
      </div>
    </SidebarInset>
  )
}
