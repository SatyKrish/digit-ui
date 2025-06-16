"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { X, Maximize2, Minimize2 } from "lucide-react"
import type { UseChatHelpers } from '@ai-sdk/react'

interface SimpleArtifactProps {
  data: any[] // The data stream from useChat
  isVisible: boolean
  onClose: () => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
}

/**
 * Simple artifact component following official Vercel AI SDK pattern
 * This replaces the complex custom artifact system with the official approach
 */
export function SimpleArtifact({ 
  data, 
  isVisible, 
  onClose, 
  onToggleFullScreen, 
  isFullScreen 
}: SimpleArtifactProps) {
  if (!isVisible || !data?.length) {
    return null
  }

  // Find the latest artifact in the data stream
  const latestArtifact = data
    .filter(item => {
      if (typeof item === 'object' && item !== null) {
        return 'type' in item || 'kind' in item || 'content' in item
      }
      return false
    })
    .pop()

  if (!latestArtifact) {
    return null
  }

  return (
    <div className={`${
      isFullScreen 
        ? 'fixed inset-0 z-50 bg-background' 
        : 'border-l border-border/50'
    } flex flex-col min-h-0`}>
      {/* Simple Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-medium text-sm">
          {latestArtifact.title || 'Artifact'}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullScreen}
            className="h-8 w-8 p-0"
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
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

      {/* Simple Content */}
      <div className="flex-1 p-4 overflow-auto">
        {latestArtifact.kind === 'text' && (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap">{latestArtifact.content}</pre>
          </div>
        )}
        {latestArtifact.kind === 'code' && (
          <div className="bg-muted rounded-lg p-4">
            <pre className="text-sm overflow-x-auto">
              <code>{latestArtifact.content}</code>
            </pre>
          </div>
        )}
        {latestArtifact.kind === 'chart' && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-muted-foreground">Chart visualization would go here</div>
          </div>
        )}
        {/* Add other artifact types as needed */}
      </div>
    </div>
  )
}
