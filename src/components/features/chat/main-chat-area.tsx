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
import type { MainChatAreaProps, Artifact, ChatMessage } from "@/types"

export function MainChatArea({ user, currentChatId, onLogout, onNewChat }: MainChatAreaProps) {
  const [isInitialState, setIsInitialState] = useState(!currentChatId)
  const [currentArtifacts, setCurrentArtifacts] = useState<Artifact[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const { open: sidebarOpen } = useSidebar()
  
  // Use our API-based session and messaging hooks
  const userData = { id: user.email, email: user.email, name: user.name }
  const { currentSession, switchToSession, createSession } = useChatSessions(userData)
  const { sendMessage, getSessionMessages, isTyping: isLoading, error: messageError } = useChatMessages()

  // Load messages for current session
  useEffect(() => {
    const loadMessages = async () => {
      if (currentSession) {
        try {
          const sessionMessages = await getSessionMessages(currentSession.id, user.email)
          setMessages(sessionMessages)
          setIsInitialState(sessionMessages.length === 0)
        } catch (error) {
          console.error('Failed to load messages:', error)
          setMessages([])
        }
      } else {
        setMessages([])
        setIsInitialState(true)
      }
    }

    loadMessages()
  }, [currentSession, getSessionMessages, user.email])

  // Handle session switching from parent
  useEffect(() => {
    if (currentChatId && currentSession?.id !== currentChatId) {
      switchToSession(currentChatId)
    }
  }, [currentChatId, currentSession?.id, switchToSession])

  // Handle sending message with domain context
  const handleSendMessage = async (content: string, selectedHints: string[] = []) => {
    if (isLoading) return

    const fullContent = selectedHints.length > 0 ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` : content

    setIsInitialState(false)

    try {
      // Send message through API
      await sendMessage(fullContent, user.email)
      
      // Reload messages to get the latest
      if (currentSession) {
        const sessionMessages = await getSessionMessages(currentSession.id, user.email)
        setMessages(sessionMessages)
        
        // Extract artifacts from the last assistant message
        const lastAssistantMessage = sessionMessages.filter((m: ChatMessage) => m.role === "assistant").pop()
        if (lastAssistantMessage) {
          const artifacts = extractArtifacts(lastAssistantMessage.content)
          setCurrentArtifacts(artifacts)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Reload messages in case there was a partial update
      if (currentSession) {
        const sessionMessages = await getSessionMessages(currentSession.id, user.email)
        setMessages(sessionMessages)
      }
    }
  }

  const handleNewChat = async () => {
    try {
      await createSession()
      setMessages([])
      setIsInitialState(true)
      setCurrentArtifacts([])
      onNewChat?.()
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }

  // Update artifacts when messages change
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
              <ChatMessages messages={messages} isLoading={isLoading} user={user} />
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
