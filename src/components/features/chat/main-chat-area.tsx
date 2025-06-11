"use client"

import { useState, useEffect } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { ArtifactPanel } from "../artifacts/artifact-panel"
import { SidebarHoverTrigger } from "../layout/sidebar-hover-trigger"
import { useSidebar } from "@/components/ui/sidebar"
import { extractArtifacts } from "@/services/artifacts/artifact-extractor"
import { useChatSessions, useChatMessages } from "@/hooks/chat"
import { useAutoSave } from "@/hooks/chat/use-auto-save"
import type { MainChatAreaProps, Artifact, ChatMessage } from "@/types"

export function MainChatArea({ user, currentChatId, onLogout, onNewChat }: MainChatAreaProps) {
  // Always start with welcome screen when no specific chat is selected
  const [isInitialState, setIsInitialState] = useState(true)
  const [currentArtifacts, setCurrentArtifacts] = useState<Artifact[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([])
  const { open: sidebarOpen } = useSidebar()
  
  // Use our API-based session and messaging hooks
  const userData = { id: user.email, email: user.email, name: user.name }
  const { currentSession, switchToSession, createSession } = useChatSessions(userData)
  const { sendMessage, getSessionMessages, isTyping: isLoading, error: messageError } = useChatMessages()

  // Auto-save functionality
  const { saveNow } = useAutoSave({
    sessionId: currentSession?.id || null,
    userId: user.email,
    onSave: async () => {
      // Auto-save is handled by touching the session timestamp
      // This could be extended to save draft messages, session state, etc.
      if (currentSession?.id) {
        await fetch('/api/chat/sessions/touch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSession.id, userId: user.email })
        });
      }
    },
    enabled: !!currentSession?.id && !isInitialState
  });

  // Load messages for current session (only when session changes)
  useEffect(() => {
    let isMounted = true;
    
    const loadMessages = async () => {
      if (currentSession && currentChatId && isMounted) {
        try {
          const sessionMessages = await getSessionMessages(currentSession.id, user.email)
          if (isMounted) {
            setMessages(sessionMessages)
            setIsInitialState(false) // Hide welcome screen when viewing a specific chat (even if empty)
            setPendingMessages([]) // Clear any pending messages when switching sessions
          }
        } catch (error) {
          console.error('Failed to load messages:', error)
          if (isMounted) {
            setMessages([])
            setIsInitialState(false) // Still show chat interface for the selected session, even on error
          }
        }
      } else if (!currentChatId && isMounted) {
        // No chat ID selected - always show welcome screen
        setMessages([])
        setIsInitialState(true)
        setPendingMessages([])
      }
    }

    loadMessages()
    return () => {
      isMounted = false;
    }
  }, [currentSession?.id, currentChatId, getSessionMessages, user.email]) // Key dependency on currentChatId

  // Handle session switching from parent
  useEffect(() => {
    if (currentChatId && currentSession?.id !== currentChatId) {
      switchToSession(currentChatId)
    }
    // Note: When currentChatId is null, we let the component naturally show welcome screen
  }, [currentChatId, currentSession?.id, switchToSession])

  // Handle sending message with optimistic updates
  const handleSendMessage = async (content: string, selectedHints: string[] = []) => {
    if (isLoading) return

    const fullContent = selectedHints.length > 0 ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` : content

    // Create optimistic user message
    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: fullContent,
      timestamp: new Date(),
      model: 'gpt-4'
    }

    // Optimistically update UI
    setIsInitialState(false)
    setPendingMessages(prev => [...prev, optimisticUserMessage])

    try {
      // Send message through API
      const result = await sendMessage(fullContent, user.email) as any // Temporary type assertion
      
      if (result) {
        // Remove optimistic message and add real messages
        setPendingMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id))
        
        // Add both user and assistant messages if they were returned
        if (result.userMessage && result.assistantMessage) {
          setMessages(prev => [...prev, result.userMessage, result.assistantMessage])
        } else if (result.message) {
          // Fallback for backward compatibility
          setMessages(prev => [...prev, result.message])
        }
        
        // Save session after successful message
        await saveNow()
      } else {
        // Remove failed optimistic message
        setPendingMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove failed optimistic message
      setPendingMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id))
    }
  }

  const handleNewChat = async () => {
    try {
      const newSession = await createSession()
      setMessages([])
      setPendingMessages([])
      setIsInitialState(true)
      setCurrentArtifacts([])
      onNewChat?.()
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }

  // Update artifacts when messages change (debounced)
  useEffect(() => {
    const allMessages = [...messages, ...pendingMessages]
    const lastAssistantMessage = allMessages.filter((m: ChatMessage) => m.role === "assistant").pop()
    if (lastAssistantMessage) {
      const artifacts = extractArtifacts(lastAssistantMessage.content)
      setCurrentArtifacts(artifacts)
    }
  }, [messages, pendingMessages])

  // Combine real and pending messages for display
  const displayMessages = [...messages, ...pendingMessages]
  useEffect(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === "assistant").pop()

    if (lastAssistantMessage) {
      const artifacts = extractArtifacts(lastAssistantMessage.content)
      setCurrentArtifacts(artifacts)
    }
  }, [messages])

  // Determine if we should show the artifact panel
  const showArtifactPanel = currentArtifacts && currentArtifacts.length > 0

  return (
    <SidebarInset className="flex flex-col relative transition-all duration-300 ease-in-out">
      <SidebarHoverTrigger />
      <ChatHeader user={user} onLogout={onLogout} />

      <div className="flex-1 flex min-h-0 transition-all duration-300 ease-in-out">
        {/* Chat Area - takes full width when no artifacts, 1/3 when artifacts are present */}
        <div
          className={`
            flex flex-col min-h-0 transition-all duration-300 ease-in-out
            ${showArtifactPanel ? "w-1/3 border-r" : "w-full"}
            ${sidebarOpen ? "opacity-95" : "opacity-100"}
          `}
        >
          {isInitialState ? (
            <InitialWelcomeScreen user={user} onSendMessage={handleSendMessage} />
          ) : (
            <>
              <ChatMessages messages={displayMessages} isLoading={isLoading} user={user} />
              <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </>
          )}
        </div>

        {/* Artifact Panel - only shown when artifacts are present */}
        {showArtifactPanel && (
          <div className="w-2/3 flex flex-col min-h-0 animate-in slide-in-from-right-1/2 duration-300">
            <ArtifactPanel artifacts={currentArtifacts} />
          </div>
        )}
      </div>
    </SidebarInset>
  )
}
