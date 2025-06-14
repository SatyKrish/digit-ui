"use client"

import React, { useState, useCallback, useEffect } from "react"
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Edit3,
  RefreshCw,
  Copy,
  ExternalLink,
  MoreVertical,
  Maximize2,
  Minimize2
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import type { 
  ArtifactDocument, 
  ArtifactKind, 
  StreamPart, 
  ArtifactToolbarAction,
  CreateArtifactOptions 
} from "@/lib/artifacts/types"

interface ArtifactProps {
  kind: ArtifactKind
  title: string
  initialContent?: string
  mode?: "edit" | "view" | "diff"
  isCurrentVersion?: boolean
  onSaveContent?: (content: string) => void
  onCreateArtifact?: (options: CreateArtifactOptions) => Promise<ArtifactDocument>
  onUpdateArtifact?: (id: string, description: string) => Promise<void>
  actions?: ArtifactToolbarAction[]
  className?: string
}

interface ArtifactState {
  document: ArtifactDocument | null
  status: "idle" | "creating" | "updating" | "streaming" | "completed" | "error"
  progress: number
  error?: string
  isExpanded: boolean
  streamContent: string
}

export function Artifact({
  kind,
  title,
  initialContent = "",
  mode = "edit",
  isCurrentVersion = true,
  onSaveContent,
  onCreateArtifact,
  onUpdateArtifact,
  actions = [],
  className = ""
}: ArtifactProps) {
  const [state, setState] = useState<ArtifactState>({
    document: null,
    status: "idle",
    progress: 0,
    isExpanded: false,
    streamContent: ""
  })

  // Initialize artifact creation
  const createArtifact = useCallback(async () => {
    if (!onCreateArtifact) return

    setState(prev => ({
      ...prev,
      status: "creating",
      progress: 0,
      error: undefined,
      streamContent: ""
    }))

    try {
      const artifact = await onCreateArtifact({
        title,
        kind,
        initialContent,
        metadata: {
          title,
          description: `Generated ${kind} artifact`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      setState(prev => ({
        ...prev,
        document: artifact,
        status: "completed",
        progress: 100,
        streamContent: artifact.content
      }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Failed to create artifact"
      }))
    }
  }, [onCreateArtifact, title, kind, initialContent])

  // Update existing artifact
  const updateArtifact = useCallback(async (description: string) => {
    if (!state.document || !onUpdateArtifact) return

    setState(prev => ({
      ...prev,
      status: "updating",
      progress: 0,
      error: undefined
    }))

    try {
      await onUpdateArtifact(state.document.id, description)
      setState(prev => ({
        ...prev,
        status: "completed",
        progress: 100
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Failed to update artifact"
      }))
    }
  }, [state.document, onUpdateArtifact])

  // Handle stream updates
  const handleStreamPart = useCallback((streamPart: StreamPart) => {
    setState(prev => {
      const newState = { ...prev }

      switch (streamPart.type) {
        case "content-update":
          newState.streamContent = prev.streamContent + (streamPart.content || "")
          newState.status = "streaming"
          break

        case "metadata-update":
          if (newState.document && streamPart.metadata) {
            newState.document = {
              ...newState.document,
              metadata: { ...newState.document.metadata, ...streamPart.metadata }
            }
          }
          break

        case "status-update":
          newState.status = streamPart.status || prev.status
          if (streamPart.status === "completed") {
            newState.progress = 100
          }
          break

        case "error":
          newState.status = "error"
          newState.error = streamPart.error
          break
      }

      return newState
    })
  }, [])

  // Auto-create artifact on mount
  useEffect(() => {
    if (state.status === "idle" && title && !state.document) {
      createArtifact()
    }
  }, [createArtifact, title, state.status, state.document])

  // Handle escape key when expanded
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.isExpanded) {
        setState(prev => ({ ...prev, isExpanded: false }))
      }
    }

    if (state.isExpanded) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [state.isExpanded])

  // Built-in actions
  const builtInActions: ArtifactToolbarAction[] = [
    {
      icon: <Copy className="h-4 w-4" />,
      label: "Copy",
      description: "Copy content to clipboard",
      onClick: ({ artifact }) => {
        navigator.clipboard.writeText(artifact.content)
        toast.success("Content copied to clipboard")
      }
    },
    {
      icon: <Download className="h-4 w-4" />,
      label: "Download",
      description: "Download artifact",
      onClick: ({ artifact }) => {
        const blob = new Blob([artifact.content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${artifact.title}.${getFileExtension(artifact.kind)}`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Artifact downloaded")
      }
    }
  ]

  const allActions = [...builtInActions, ...actions]
  const currentContent = state.streamContent || initialContent
  const isLoading = ["creating", "updating", "streaming"].includes(state.status)

  return (
    <Card 
      className={`artifact-container transition-all duration-200 ${className}`}
      style={state.isExpanded ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        margin: 0,
        borderRadius: 0,
        maxHeight: '100vh',
        overflow: 'auto'
      } : {}}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ArtifactIcon kind={kind} />
              <div>
                <CardTitle className="text-base font-semibold">
                  {title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={state.status} />
                  {state.document?.metadata.language && (
                    <Badge variant="outline" className="text-xs">
                      {state.document.metadata.language}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Actions */}
            {currentContent && !isLoading && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(currentContent)
                    toast.success("Copied to clipboard")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
                >
                  {state.isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}

            {/* More Actions Menu */}
            {allActions.length > 0 && state.document && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {allActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => action.onClick({ artifact: state.document! })}
                      disabled={action.disabled}
                      className="flex items-center gap-2"
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <div className="space-y-2">
            <Progress value={state.progress} className="h-1" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {state.status === "creating" && "Creating artifact..."}
                {state.status === "updating" && "Updating artifact..."}
                {state.status === "streaming" && "Streaming content..."}
              </span>
              <span>{currentContent.length} characters</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {state.status === "error" && (
          <div className="text-center py-8 space-y-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-destructive">Error</h3>
              <p className="text-sm text-muted-foreground mt-1">{state.error}</p>
            </div>
            <Button onClick={createArtifact} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {state.status === "idle" && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse space-y-2">
              <ArtifactIcon kind={kind} className="h-8 w-8 mx-auto" />
              <p>Preparing to create {kind}...</p>
            </div>
          </div>
        )}

        {currentContent && state.status !== "error" && (
          <ArtifactContent
            kind={kind}
            content={currentContent}
            metadata={state.document?.metadata}
            isStreaming={state.status === "streaming"}
            mode={mode}
            isCurrentVersion={isCurrentVersion}
            onSaveContent={onSaveContent}
          />
        )}
      </CardContent>
    </Card>
  )
}

// Supporting Components

function ArtifactIcon({ 
  kind, 
  className = "h-5 w-5" 
}: { 
  kind: ArtifactKind
  className?: string 
}) {
  const icons = {
    text: "📝",
    code: "💻", 
    chart: "📊",
    visualization: "📈",
    document: "📄"
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {icons[kind]}
    </div>
  )
}

function StatusBadge({ status }: { status: ArtifactState["status"] }) {
  const variants = {
    idle: { variant: "secondary" as const, label: "Ready" },
    creating: { variant: "default" as const, label: "Creating" },
    updating: { variant: "default" as const, label: "Updating" },
    streaming: { variant: "default" as const, label: "Streaming" },
    completed: { variant: "secondary" as const, label: "Complete" },
    error: { variant: "destructive" as const, label: "Error" }
  }

  const { variant, label } = variants[status]

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  )
}

function ArtifactContent({
  kind,
  content,
  metadata,
  isStreaming,
  mode,
  isCurrentVersion,
  onSaveContent
}: {
  kind: ArtifactKind
  content: string
  metadata?: any
  isStreaming: boolean
  mode: "edit" | "view" | "diff"
  isCurrentVersion: boolean
  onSaveContent?: (content: string) => void
}) {
  return (
    <div className={`relative ${isStreaming ? 'animate-pulse' : ''}`}>
      {/* Content based on artifact type */}
      {kind === "code" && (
        <CodePreview 
          content={content} 
          language={metadata?.language} 
          isStreaming={isStreaming}
        />
      )}
      
      {kind === "text" && (
        <TextPreview 
          content={content} 
          isStreaming={isStreaming}
        />
      )}
      
      {kind === "document" && (
        <DocumentPreview 
          content={content} 
          metadata={metadata}
          isStreaming={isStreaming}
        />
      )}
      
      {(kind === "chart" || kind === "visualization") && (
        <ChartPreview 
          content={content} 
          kind={kind}
          isStreaming={isStreaming}
        />
      )}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs animate-pulse">
            Live
          </Badge>
        </div>
      )}
    </div>
  )
}

function CodePreview({ 
  content, 
  language, 
  isStreaming 
}: { 
  content: string
  language?: string
  isStreaming: boolean 
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
        <code className={`language-${language || 'text'}`}>
          {content}
        </code>
      </pre>
    </div>
  )
}

function TextPreview({ 
  content, 
  isStreaming 
}: { 
  content: string
  isStreaming: boolean 
}) {
  return (
    <div className="prose prose-sm max-w-none p-4 rounded-lg border bg-background/50">
      {content.split('\n').map((line, i) => (
        <p key={i} className="mb-2">{line}</p>
      ))}
    </div>
  )
}

function DocumentPreview({ 
  content, 
  metadata, 
  isStreaming 
}: { 
  content: string
  metadata?: any
  isStreaming: boolean 
}) {
  return (
    <div className="space-y-4">
      {metadata && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {metadata.wordCount && (
            <span>{metadata.wordCount} words</span>
          )}
          {metadata.readingTime && (
            <span>{metadata.readingTime} min read</span>
          )}
        </div>
      )}
      <div className="prose prose-sm max-w-none p-4 rounded-lg border bg-background/50">
        {content}
      </div>
    </div>
  )
}

function ChartPreview({ 
  content, 
  kind, 
  isStreaming 
}: { 
  content: string
  kind: "chart" | "visualization"
  isStreaming: boolean 
}) {
  return (
    <div className="space-y-4">
      <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center border">
        {isStreaming ? (
          <div className="text-center space-y-2">
            <div className="animate-spin">📊</div>
            <p className="text-sm text-muted-foreground">Generating {kind}...</p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-2xl">📊</div>
            <p className="text-sm text-muted-foreground">{kind} preview</p>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Workspace
            </Button>
          </div>
        )}
      </div>
      
      {/* Show raw content if it's JSON */}
      {content && (
        <details className="mt-4">
          <summary className="text-sm font-medium cursor-pointer">
            View Configuration
          </summary>
          <pre className="mt-2 text-xs bg-muted/20 p-3 rounded overflow-x-auto">
            {content}
          </pre>
        </details>
      )}
    </div>
  )
}

function getFileExtension(kind: ArtifactKind): string {
  const extensions = {
    text: "txt",
    code: "js", // Could be dynamic based on language
    chart: "json",
    visualization: "html",
    document: "md"
  }
  return extensions[kind]
}