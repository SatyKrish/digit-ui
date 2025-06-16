export type ArtifactKind = "text" | "code" | "chart" | "visualization" | "document" | "image" | "sheet"

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
  suggestions?: Array<Suggestion>
  [key: string]: any // Allow additional metadata properties
}

export interface Suggestion {
  id: string
  title: string
  description: string
  content: string
  originalText?: string
  suggestedText?: string
}

export interface StreamPart {
  type: 
    | "content-update" 
    | "metadata-update" 
    | "status-update" 
    | "error"
    | "text-delta"
    | "code-delta" 
    | "sheet-delta"
    | "image-delta"
    | "chart-delta"
    | "title"
    | "id"
    | "suggestion"
    | "clear"
    | "finish"
    | "kind"
  content?: string | Suggestion
  metadata?: Partial<ArtifactMetadata>
  status?: "streaming" | "completed" | "error" | "idle"
  error?: string
  // Chart-specific properties
  textDelta?: string
  data?: any
  chartType?: "bar" | "line" | "pie" | "area" | string
  title?: string
  xKey?: string
  yKey?: string
}

export interface ArtifactDocument {
  id: string
  kind: ArtifactKind
  title: string
  content: string
  metadata: ArtifactMetadata
  status: "draft" | "streaming" | "completed" | "error" | "idle"
  userId?: string
  versions?: ArtifactVersion[]
  // UI Artifact properties for workspace positioning
  isVisible?: boolean
  boundingBox?: {
    top: number
    left: number
    width: number
    height: number
  }
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
  label?: string
  description: string
  onClick: (context: ArtifactActionContext & ArtifactToolbarContext) => Promise<void> | void
  disabled?: boolean
  isDisabled?: (context: ArtifactActionContext) => boolean
}

export interface CreateArtifactOptions {
  title: string
  kind: ArtifactKind
  initialContent?: string
  metadata?: Partial<ArtifactMetadata>
}

// UI Artifact interface for workspace management (following Vercel pattern)
export interface UIArtifact {
  title: string
  documentId: string
  kind: ArtifactKind
  content: string
  isVisible: boolean
  status: 'streaming' | 'idle' | 'completed'
  boundingBox: {
    top: number
    left: number
    width: number
    height: number
  }
}

// Artifact component content props (following Vercel pattern)
export interface ArtifactContent<M = any> {
  title: string
  content: string
  mode: 'edit' | 'diff'
  status: 'streaming' | 'idle' | 'completed'
  currentVersionIndex: number
  suggestions: Array<Suggestion>
  onSaveContent: (content: string, debounce?: boolean) => void
  isInline: boolean
  isCurrentVersion: boolean
  getDocumentContentById: (index: number) => string
  isLoading: boolean
  metadata: M
  setMetadata: React.Dispatch<React.SetStateAction<M>>
}

// Artifact action context (following Vercel pattern)
export interface ArtifactActionContext<M = any> {
  content: string
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void
  currentVersionIndex: number
  isCurrentVersion: boolean
  mode: 'edit' | 'diff'
  metadata: M
  setMetadata: React.Dispatch<React.SetStateAction<M>>
  artifact?: ArtifactDocument
}

// Artifact toolbar context for MCP integration
export interface ArtifactToolbarContext {
  appendMessage: (message: any) => void
  callMCPTool: (toolName: string, args: any) => Promise<any>
}
