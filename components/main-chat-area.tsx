"use client"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "@/components/chat-header"
import { ChatMessages } from "@/components/chat-messages"
import { ChatInput } from "@/components/chat-input"
import { InitialWelcomeScreen } from "@/components/initial-welcome-screen"
import { ArtifactPanel } from "@/components/artifact-panel"
import { SidebarHoverTrigger } from "@/components/sidebar-hover-trigger"
import { useSidebar } from "@/components/ui/sidebar"

interface User {
  name: string
  email: string
  avatar: string
}

interface MainChatAreaProps {
  user: User
  currentChatId: string | null
  onLogout: () => void
  onNewChat?: () => void
}

interface Artifact {
  type: "markdown" | "code" | "mermaid" | "chart" | "table" | "visualization" | "heatmap" | "treemap" | "geospatial"
  content: string
  language?: string
  title?: string
  data?: any
  chartType?: "bar" | "line" | "pie" | "area"
  visualizationType?: "kpi" | "progress" | "custom"
  mapType?: "basic" | "satellite" | "dark"
}

// Enhanced function to extract artifacts from message content
function extractArtifacts(content: string): Artifact[] {
  const artifacts: Artifact[] = []

  // Extract code blocks
  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = codeRegex.exec(content)) !== null) {
    const language = match[1] || "text"
    const code = match[2].trim()

    if (language === "mermaid") {
      artifacts.push({
        type: "mermaid",
        content: code,
        title: "Diagram",
      })
    } else {
      artifacts.push({
        type: "code",
        content: code,
        language: language,
        title: `${language.toUpperCase()} Code`,
      })
    }
  }

  // Extract JSON data blocks for charts, tables, and visualizations
  const jsonRegex = /```json:(\w+)(?::(\w+))?\n([\s\S]*?)```/g
  while ((match = jsonRegex.exec(content)) !== null) {
    const artifactType = match[1] as "chart" | "table" | "visualization" | "heatmap" | "treemap" | "geospatial"
    const subType = match[2]
    const jsonContent = match[3].trim()

    try {
      const data = JSON.parse(jsonContent)

      switch (artifactType) {
        case "chart":
          artifacts.push({
            type: "chart",
            content: jsonContent,
            data: data.data || data,
            chartType: (subType as any) || data.chartType || "bar",
            title: data.title || "Chart",
          })
          break
        case "table":
          artifacts.push({
            type: "table",
            content: jsonContent,
            data: data.data || data,
            title: data.title || "Data Table",
          })
          break
        case "visualization":
          artifacts.push({
            type: "visualization",
            content: jsonContent,
            data: data.data || data,
            visualizationType: (subType as any) || data.type || "custom",
            title: data.title || "Visualization",
          })
          break
        case "heatmap":
          artifacts.push({
            type: "heatmap",
            content: jsonContent,
            data: data.data || data,
            title: data.title || "Heatmap",
          })
          break
        case "treemap":
          artifacts.push({
            type: "treemap",
            content: jsonContent,
            data: data.data || data,
            title: data.title || "Treemap",
          })
          break
        case "geospatial":
          artifacts.push({
            type: "geospatial",
            content: jsonContent,
            data: data.data || data,
            mapType: (subType as any) || data.mapType || "basic",
            title: data.title || "Geospatial Map",
          })
          break
      }
    } catch (error) {
      console.error("Error parsing JSON artifact:", error)
    }
  }

  return artifacts
}

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
