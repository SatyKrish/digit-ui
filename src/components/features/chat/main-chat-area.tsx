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
import { useChat } from "@ai-sdk/react"
import type { MainChatAreaProps, Artifact } from "@/types"
import type { Message } from "ai"

export function MainChatArea({ user, currentChatId, onLogout, onNewChat }: MainChatAreaProps) {
  const [currentArtifacts, setCurrentArtifacts] = useState<Artifact[]>([])
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

  // Use Vercel AI SDK's useChat hook - this handles everything!
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
    append
  } = useChat({
    id: currentChatId || undefined, // Let AI SDK handle session creation when undefined
    api: '/api/chat',
    body: {
      userId: user?.email,
      id: currentChatId || undefined
    },
    onFinish: (message) => {
      // Session and message saving is handled automatically in the API route
      console.log('Message finished:', message.id)
      
      // Update artifacts from the completed message
      if (message.role === 'assistant') {
        const artifacts = extractArtifacts(message.content)
        setCurrentArtifacts(artifacts)
      }
    },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  // Check if we're on the initial welcome screen
  const isInitialState = !currentChatId && messages.length === 0

  // Handle sending message with domain hints
  const handleSendMessage = async (content: string, selectedHints: string[] = []) => {
    if (isLoading) return

    const fullContent = selectedHints.length > 0 
      ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` 
      : content

    // If no current chat ID, this will be a new chat - AI SDK will handle the session creation
    if (!currentChatId && onNewChat) {
      // Notify parent that we're starting a new chat
      onNewChat()
    }

    // Use AI SDK's append function - much simpler!
    await append({
      role: 'user',
      content: fullContent
    })
  }

  const handleNavigateHome = () => {
    // Navigate to welcome screen by clearing messages and artifacts
    setMessages([])
    setCurrentArtifacts([])
    // Call onNewChat to update the parent's currentChatId to null
    onNewChat?.()
  }

  // Update artifacts when messages change (for existing messages loaded from history)
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
      <ChatHeader user={user} onLogout={onLogout} onNavigateHome={handleNavigateHome} />

      <div className="flex-1 flex min-h-0 transition-all duration-300 ease-in-out">
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
            showArtifactPanel ? "mr-2" : ""
          }`}
        >
          {isInitialState ? (
            <InitialWelcomeScreen user={user} onSendMessage={handleSendMessage} />
          ) : (
            <>
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
              <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </>
          )}
        </div>

        {showArtifactPanel && (
          <div
            className={`transition-all duration-300 ease-in-out ${
              sidebarOpen ? "w-96" : "w-[28rem]"
            }`}
          >
            <ArtifactPanel artifacts={currentArtifacts} />
          </div>
        )}
      </div>
    </SidebarInset>
  )
}
