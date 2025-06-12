"use client"

import { useState, useEffect } from "react"
import { ArtifactRenderer } from "./artifact-renderer"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import type { Artifact } from "@/types/artifacts"

interface StreamableArtifactProps {
  artifact: Artifact | null
  isStreaming?: boolean
  onRetry?: () => void
  streamId?: string
}

// Loading component for streaming artifacts
function ArtifactStreamingLoader({ type }: { type?: string }) {
  return (
    <div className="space-y-4 p-6 bg-card rounded-xl border border-border">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-lg" />
        </div>
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Badge variant="outline" className="animate-pulse">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Generating
        </Badge>
      </div>
      
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      <div className="flex justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-200" />
          <span className="ml-2">Creating {type || "artifact"}...</span>
        </div>
      </div>
    </div>
  )
}

// Error state component
function ArtifactStreamingError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="space-y-4 p-6 bg-card rounded-xl border border-destructive/20">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
          <span className="text-xl">⚠️</span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Failed to Generate Artifact</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Something went wrong while creating the artifact.
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

// Progressive loading states for different artifact types
function getLoadingMessage(type?: string) {
  const messages = {
    chart: "Analyzing data and creating visualization...",
    table: "Processing data rows and columns...",
    code: "Formatting and highlighting code...",
    mermaid: "Generating interactive diagram...",
    heatmap: "Calculating heat intensity values...",
    treemap: "Building hierarchical layout...",
    geospatial: "Loading geographic data...",
    visualization: "Creating custom visualization...",
  }
  return messages[type as keyof typeof messages] || "Processing content..."
}

export function StreamableArtifact({ 
  artifact, 
  isStreaming = false, 
  onRetry,
  streamId 
}: StreamableArtifactProps) {
  const [showContent, setShowContent] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState(0)

  // Simulate progressive loading phases
  useEffect(() => {
    if (isStreaming) {
      const phases = [
        "Initializing...",
        artifact?.type ? getLoadingMessage(artifact.type) : "Processing...",
        "Finalizing...",
      ]
      
      const interval = setInterval(() => {
        setLoadingPhase(prev => {
          if (prev < phases.length - 1) {
            return prev + 1
          }
          return prev
        })
      }, 1500)

      return () => clearInterval(interval)
    }
  }, [isStreaming, artifact?.type])

  // Show content with smooth transition when streaming completes
  useEffect(() => {
    if (!isStreaming && artifact) {
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 200)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isStreaming, artifact])

  // Handle error state
  if (!isStreaming && !artifact) {
    return <ArtifactStreamingError onRetry={onRetry} />
  }

  // Handle streaming state
  if (isStreaming) {
    return (
      <div className="space-y-4">
        <ArtifactStreamingLoader type={artifact?.type} />
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-full">
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {artifact?.type ? getLoadingMessage(artifact.type) : "Processing..."}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Handle completed state with smooth transition
  if (artifact && showContent) {
    return (
      <div className="animate-fade-in">
        <ArtifactRenderer artifact={artifact} />
      </div>
    )
  }

  // Transition state
  return (
    <div className="opacity-50 transition-opacity duration-300">
      <ArtifactStreamingLoader type={artifact?.type} />
    </div>
  )
}
