"use client"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { ArtifactPanel } from "../artifacts/artifact-panel"
import { SidebarHoverTrigger } from "../layout/sidebar-hover-trigger"
import { useSidebar } from "@/components/ui/sidebar"
import { extractArtifacts } from "@/services/artifacts/artifact-extractor"
import type { MainChatAreaProps, Artifact } from "@/types"

export function MainChatArea({ user, currentChatId, onLogout, onNewChat }: MainChatAreaProps) {
  const [isInitialState, setIsInitialState] = useState(!currentChatId)
  const [currentArtifacts, setCurrentArtifacts] = useState<Artifact[]>([])
  const { open: sidebarOpen } = useSidebar()

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      // Extract artifacts from the assistant's response
      const artifacts = extractArtifacts(message.content)
      setCurrentArtifacts(artifacts)
    },
  })

  // Handle sending message with domain context
  const handleSendMessage = async (content: string, selectedHints: string[] = []) => {
    const fullContent = selectedHints.length > 0 ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` : content

    setIsInitialState(false)

    await append({
      role: "user",
      content: fullContent,
    })
  }

  const handleNewChat = () => {
    setMessages([])
    setIsInitialState(true)
    setCurrentArtifacts([])
    onNewChat?.()
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
