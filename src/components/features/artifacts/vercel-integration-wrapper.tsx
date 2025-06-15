"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { ArtifactWorkspace, initialArtifactData } from "./artifact-workspace-vercel"
import { extractArtifacts } from "@/services/artifacts/artifact-extractor"
import { Button } from "@/components/ui/button"
import { X, Maximize2, Minimize2 } from "lucide-react"
import type { UIArtifact } from "@/lib/artifacts/types"
import type { Artifact } from "@/types/artifacts"

interface VercelIntegrationWrapperProps {
  // Legacy artifact data from current system
  artifacts: Artifact[]
  
  // Chat integration props
  chatId?: string
  messages: any[]
  onClose: () => void
  
  // Layout props
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
  isChatMinimized?: boolean
  onToggleChatMinimized?: () => void
  
  // Chat interaction props
  onSendMessage?: (message: string) => Promise<void>
  isLoading?: boolean
}

/**
 * Integration wrapper that bridges the current Digit artifact system 
 * with the new Vercel artifacts workspace
 */
export function VercelIntegrationWrapper({
  artifacts,
  chatId = "main-chat",
  messages,
  onClose,
  isFullScreen = false,
  onToggleFullScreen,
  isChatMinimized = false,
  onToggleChatMinimized,
  onSendMessage,
  isLoading = false
}: VercelIntegrationWrapperProps) {
  // Convert legacy artifacts to Vercel UIArtifact format
  const [currentArtifact, setCurrentArtifact] = useState<UIArtifact>(() => {
    if (artifacts.length > 0) {
      const firstArtifact = artifacts[0]
      return {
        documentId: `artifact-${Date.now()}`,
        content: firstArtifact.content,
        kind: mapLegacyTypeToVercelKind(firstArtifact.type),
        title: firstArtifact.title || "Untitled Artifact",
        status: 'completed',
        isVisible: true,
        boundingBox: {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
        },
      }
    }
    return { ...initialArtifactData, isVisible: false }
  })

  // Update artifact when props change
  useEffect(() => {
    if (artifacts.length > 0) {
      const firstArtifact = artifacts[0]
      setCurrentArtifact(prev => ({
        ...prev,
        documentId: `artifact-${Date.now()}`,
        content: firstArtifact.content,
        kind: mapLegacyTypeToVercelKind(firstArtifact.type),
        title: firstArtifact.title || "Untitled Artifact",
        status: 'completed',
        isVisible: true,
      }))
    } else {
      setCurrentArtifact(prev => ({ ...prev, isVisible: false }))
    }
  }, [artifacts])

  // Chat integration state
  const [input, setInput] = useState("")
  const [workspaceMessages, setWorkspaceMessages] = useState(messages)

  // Sync messages with parent
  useEffect(() => {
    setWorkspaceMessages(messages)
  }, [messages])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      await onSendMessage?.(input)
      setInput("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }, [input, onSendMessage, isLoading])

  // Stop function for streaming
  const stop = useCallback(() => {
    // Implementation depends on your streaming setup
    console.log("Stop streaming requested")
  }, [])

  // Reload function
  const reload = useCallback(() => {
    // Implement reload logic if needed
    console.log("Reload requested")
  }, [])

  // Append message function
  const append = useCallback((message: any) => {
    setWorkspaceMessages(prev => [...prev, message])
  }, [])

  // Don't render if no artifacts
  if (!currentArtifact.isVisible || artifacts.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">
            {currentArtifact.title}
          </h3>
          {artifacts.length > 1 && (
            <span className="text-xs text-muted-foreground">
              +{artifacts.length - 1} more
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {onToggleChatMinimized && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleChatMinimized}
              className="h-8 w-8 p-0"
            >
              {isChatMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {onToggleFullScreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullScreen}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Vercel Workspace */}
      <div className="flex-1 min-h-0">
        <ArtifactWorkspace
          artifact={currentArtifact}
          setArtifact={setCurrentArtifact}
          chatId={chatId}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={isLoading ? 'loading' : 'idle'}
          stop={stop}
          attachments={[]}
          setAttachments={() => {}}
          messages={workspaceMessages}
          setMessages={setWorkspaceMessages}
          reload={reload}
          votes={undefined}
          append={append}
          isReadonly={false}
          selectedVisibilityType="private"
        />
      </div>
    </div>
  )
}

/**
 * Map legacy artifact types to Vercel artifact kinds
 */
function mapLegacyTypeToVercelKind(legacyType: string): UIArtifact['kind'] {
  switch (legacyType) {
    case 'code':
      return 'code'
    case 'chart':
    case 'visualization':
    case 'table':
    case 'heatmap':
    case 'treemap':
    case 'geospatial':
      return 'chart'
    case 'mermaid':
      return 'visualization'
    case 'image':
      return 'image'
    case 'sheet':
      return 'sheet'
    case 'text':
    default:
      return 'text'
  }
}
