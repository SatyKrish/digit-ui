export type ArtifactKind = "text" | "code" | "chart" | "visualization" | "document"

export interface ArtifactMetadata {
  title: string
  description?: string
  language?: string
  version?: number
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  // Extended properties for specific artifact types
  lineCount?: number
  wordCount?: number
  chartType?: string
  [key: string]: any // Allow additional metadata properties
}

export interface StreamPart {
  type: "content-update" | "metadata-update" | "status-update" | "error"
  content?: string
  metadata?: Partial<ArtifactMetadata>
  status?: "streaming" | "completed" | "error"
  error?: string
}

export interface ArtifactDocument {
  id: string
  kind: ArtifactKind
  title: string
  content: string
  metadata: ArtifactMetadata
  status: "draft" | "streaming" | "completed" | "error"
  userId?: string
  versions?: ArtifactVersion[]
}

export interface ArtifactVersion {
  id: string
  content: string
  metadata: ArtifactMetadata
  createdAt: Date
}

export interface ArtifactActions {
  onSave?: (content: string) => void
  onShare?: (artifact: ArtifactDocument) => void
  onDownload?: (artifact: ArtifactDocument) => void
  onEdit?: (artifact: ArtifactDocument) => void
  onDelete?: (id: string) => void
}

export interface ArtifactToolbarAction {
  icon: React.ReactNode
  label: string
  description?: string
  onClick: (context: { 
    artifact: ArtifactDocument
    appendMessage?: (message: any) => void 
  }) => void
  disabled?: boolean
}

export interface CreateArtifactOptions {
  title: string
  kind: ArtifactKind
  initialContent?: string
  metadata?: Partial<ArtifactMetadata>
}
