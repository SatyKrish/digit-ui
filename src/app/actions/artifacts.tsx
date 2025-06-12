"use server"

import React from "react"
import { createStreamableUI, createStreamableValue } from "ai/rsc"
import { 
  getDocumentHandler, 
  type DataStream,
  type DocumentHandler 
} from "@/lib/artifacts/server"
import type { 
  ArtifactKind, 
  ArtifactDocument, 
  CreateArtifactOptions,
  StreamPart 
} from "@/lib/artifacts/types"

// Helper function to get emoji for artifact types
function getArtifactEmoji(kind: ArtifactKind): string {
  switch (kind) {
    case "text": return "📝"
    case "code": return "💻"
    case "chart": return "📊"
    case "visualization": return "📈"
    case "document": return "📄"
    default: return "📄"
  }
}

// UI Components for streaming states
function StreamingArtifactUI({
  kind,
  title,
  content,
  progress,
  status,
  description
}: {
  kind: ArtifactKind
  title: string
  content: string
  progress: number
  status: "streaming" | "completed" | "updating"
  description?: string
}) {
  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {getArtifactEmoji(kind)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {status === "streaming" && `Creating ${kind}...`}
              {status === "updating" && `Updating: ${description}`}
              {status === "completed" && `${kind} ready`}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {progress}%
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="p-4">
        <ArtifactContentPreview
          kind={kind}
          content={content}
          isStreaming={status !== "completed"}
        />
      </div>
    </div>
  )
}

function CompletedArtifactUI({
  kind,
  title,
  content
}: {
  kind: ArtifactKind
  title: string
  content: string
}) {
  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-green-50">
        <div className="flex items-center gap-3">
          <div className="text-2xl">✅</div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-800">{title}</h3>
            <p className="text-sm text-green-600">
              {kind.charAt(0).toUpperCase() + kind.slice(1)} completed successfully
            </p>
          </div>
        </div>
      </div>

      {/* Final Content */}
      <div className="p-4">
        <ArtifactContentPreview
          kind={kind}
          content={content}
          isStreaming={false}
        />
      </div>

      {/* Actions */}
      <div className="p-4 border-t bg-muted/10">
        <div className="flex items-center gap-2 text-sm">
          <button className="text-blue-600 hover:underline">
            📋 Copy to clipboard
          </button>
          <span className="text-muted-foreground">•</span>
          <button className="text-blue-600 hover:underline">
            📄 Open in workspace
          </button>
          <span className="text-muted-foreground">•</span>
          <button className="text-blue-600 hover:underline">
            🔗 Share
          </button>
        </div>
      </div>
    </div>
  )
}

function ArtifactContentPreview({
  kind,
  content,
  isStreaming
}: {
  kind: ArtifactKind
  content: string
  isStreaming: boolean
}) {
  const previewContent = content.slice(0, isStreaming ? content.length : 500)

  return (
    <div className={`relative ${isStreaming ? 'animate-pulse' : ''}`}>
      {kind === "code" && (
        <pre className="text-xs bg-muted/20 p-3 rounded overflow-x-auto border">
          <code>{previewContent}</code>
        </pre>
      )}
      
      {kind === "text" && (
        <div className="text-sm bg-muted/20 p-3 rounded border">
          {previewContent.split('\n').map((line, i) => (
            <p key={i} className="mb-1">{line}</p>
          ))}
        </div>
      )}
      
      {kind === "document" && (
        <div className="prose prose-sm max-w-none bg-muted/20 p-3 rounded border">
          {previewContent}
        </div>
      )}
      
      {(kind === "chart" || kind === "visualization") && (
        <div className="bg-muted/20 p-6 rounded border text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm text-muted-foreground">
            {isStreaming ? "Generating visualization..." : "Visualization ready"}
          </p>
          {!isStreaming && (
            <button className="mt-2 text-xs text-blue-600 hover:underline">
              View full visualization →
            </button>
          )}
        </div>
      )}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="absolute top-2 right-2">
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded animate-pulse">
            Live
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Server action to create streaming artifacts
 * Following Chat SDK patterns for RSC streaming
 */
export async function createStreamingArtifact(options: CreateArtifactOptions) {
  const ui = createStreamableUI(null)
  const streamValue = createStreamableValue<StreamPart>()

  // Get the appropriate handler for this artifact type
  const handler = getDocumentHandler(options.kind)
  if (!handler) {
    ui.done(
      <div className="text-red-600 p-4 border border-red-200 rounded-lg">
        ❌ Error: No handler found for artifact type &quot;{options.kind}&quot;
      </div>
    )
    return ui.value
  }

  // Show initial loading UI
  ui.update(
    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20 animate-pulse">
      <div className="text-2xl">
        {getArtifactEmoji(options.kind)}
      </div>
      <div>
        <h3 className="font-semibold">Creating {options.kind}...</h3>
        <p className="text-sm text-muted-foreground">
          Initializing {options.title}
        </p>
      </div>
    </div>
  )

  try {
    let accumulatedContent = ""
    let progress = 0

    // Create the data stream handler
    const dataStream: DataStream = {
      writeData: (data: StreamPart) => {
        streamValue.update(data)
        
        // Update UI based on stream type
        switch (data.type) {
          case "content-update":
            accumulatedContent += data.content || ""
            progress = Math.min(progress + 5, 95)
            
            ui.update(
              <StreamingArtifactUI
                kind={options.kind}
                title={options.title}
                content={accumulatedContent}
                progress={progress}
                status="streaming"
              />
            )
            break
            
          case "status-update":
            if (data.status === "completed") {
              progress = 100
              ui.update(
                <StreamingArtifactUI
                  kind={options.kind}
                  title={options.title}
                  content={accumulatedContent}
                  progress={progress}
                  status="completed"
                />
              )
            }
            break
            
          case "error":
            ui.update(
              <div className="text-red-600 p-4 border border-red-200 rounded-lg">
                ❌ Error: {data.error}
              </div>
            )
            break
        }
      },
      close: () => {
        streamValue.done()
        ui.done(
          <CompletedArtifactUI
            kind={options.kind}
            title={options.title}
            content={accumulatedContent}
          />
        )
      }
    }

    // Start the artifact creation process
    const finalContent = await handler.onCreateDocument({
      title: options.title,
      dataStream,
      metadata: options.metadata
    })

    // Complete the stream
    dataStream.close()

  } catch (error) {
    console.error("Error creating streaming artifact:", error)
    ui.done(
      <div className="text-red-600 p-4 border border-red-200 rounded-lg space-y-2">
        <div className="text-4xl">⚠️</div>
        <div>
          <h3 className="font-semibold">Creation Failed</h3>
          <p className="text-sm">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    )
  }

  return ui.value
}

/**
 * Server action to update streaming artifacts
 */
export async function updateStreamingArtifact(
  documentId: string,
  description: string,
  document: ArtifactDocument
) {
  const ui = createStreamableUI(null)
  const streamValue = createStreamableValue<StreamPart>()

  // Get the appropriate handler for this artifact type
  const handler = getDocumentHandler(document.kind)
  if (!handler) {
    ui.done(
      <div className="text-red-600 p-4 border border-red-200 rounded-lg">
        ❌ Error: No handler found for artifact type &quot;{document.kind}&quot;
      </div>
    )
    return ui.value
  }

  // Show initial loading UI
  ui.update(
    <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 animate-pulse">
      <div className="text-2xl">🔄</div>
      <div>
        <h3 className="font-semibold">Updating {document.kind}...</h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )

  try {
    let updatedContent = ""
    let progress = 0

    // Create the data stream handler
    const dataStream: DataStream = {
      writeData: (data: StreamPart) => {
        streamValue.update(data)
        
        switch (data.type) {
          case "content-update":
            updatedContent = data.content || ""
            progress = Math.min(progress + 5, 95)
            
            ui.update(
              <StreamingArtifactUI
                kind={document.kind}
                title={document.title}
                content={updatedContent}
                progress={progress}
                status="updating"
                description={description}
              />
            )
            break
            
          case "status-update":
            if (data.status === "completed") {
              progress = 100
              ui.update(
                <StreamingArtifactUI
                  kind={document.kind}
                  title={document.title}
                  content={updatedContent}
                  progress={progress}
                  status="completed"
                />
              )
            }
            break
            
          case "error":
            ui.update(
              <div className="text-red-600 p-4 border border-red-200 rounded-lg">
                ❌ Update Error: {data.error}
              </div>
            )
            break
        }
      },
      close: () => {
        streamValue.done()
        ui.done(
          <CompletedArtifactUI
            kind={document.kind}
            title={document.title}
            content={updatedContent}
          />
        )
      }
    }

    // Start the update process
    const finalContent = await handler.onUpdateDocument({
      document,
      description,
      dataStream
    })

    dataStream.close()

  } catch (error) {
    console.error("Error updating streaming artifact:", error)
    ui.done(
      <div className="text-red-600 p-4 border border-red-200 rounded-lg space-y-2">
        <div className="text-4xl">⚠️</div>
        <div>
          <h3 className="font-semibold">Update Failed</h3>
          <p className="text-sm">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    )
  }

  return ui.value
}
