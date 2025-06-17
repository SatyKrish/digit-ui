// Central registry for all artifact types
import { textArtifact } from './text/client'
import { codeArtifact } from './code/client'
import { chartArtifact } from './chart/client'
import { imageArtifact } from './image/client'
import { sheetArtifact } from './sheet/client'
import { visualizationArtifact } from './visualization/client'
import { documentArtifact } from './document/client'

// Export individual artifacts
export { textArtifact } from './text/client'
export { codeArtifact } from './code/client'
export { chartArtifact } from './chart/client'
export { imageArtifact } from './image/client'
export { sheetArtifact } from './sheet/client'
export { visualizationArtifact } from './visualization/client'
export { documentArtifact } from './document/client'

// Export server handlers
export { onCreateDocument as createTextDocument, onUpdateDocument as updateTextDocument } from './text/server'
export { onCreateDocument as createCodeDocument, onUpdateDocument as updateCodeDocument } from './code/server'
export { onCreateDocument as createChartDocument, onUpdateDocument as updateChartDocument } from './chart/server'
export { onCreateDocument as createImageDocument, onUpdateDocument as updateImageDocument } from './image/server'
export { onCreateDocument as createSheetDocument, onUpdateDocument as updateSheetDocument } from './sheet/server'
export { onCreateDocument as createVisualizationDocument, onUpdateDocument as updateVisualizationDocument } from './visualization/server'
export { onCreateDocument as createDocumentDocument, onUpdateDocument as updateDocumentDocument } from './document/server'

// Artifact registry for dynamic access
export const artifactRegistry = {
  text: textArtifact,
  code: codeArtifact,
  chart: chartArtifact,
  image: imageArtifact,
  sheet: sheetArtifact,
  visualization: visualizationArtifact,
  document: documentArtifact,
} as const

// Server handler registry
export const serverHandlerRegistry = {
  text: {
    onCreateDocument: async (options: any) => (await import('./text/server')).onCreateDocument(options),
    onUpdateDocument: async (options: any) => (await import('./text/server')).onUpdateDocument(options),
  },
  code: {
    onCreateDocument: async (options: any) => (await import('./code/server')).onCreateDocument(options),
    onUpdateDocument: async (options: any) => (await import('./code/server')).onUpdateDocument(options),
  },
  chart: {
    onCreateDocument: async (options: any) => (await import('./chart/server')).onCreateDocument(options),
    onUpdateDocument: async (options: any) => (await import('./chart/server')).onUpdateDocument(options),
  },
  image: {
    onCreateDocument: async (options: any) => (await import('./image/server')).onCreateDocument(options),
    onUpdateDocument: async (options: any) => (await import('./image/server')).onUpdateDocument(options),
  },
  sheet: {
    onCreateDocument: async (options: any) => (await import('./sheet/server')).onCreateDocument(options),
    onUpdateDocument: async (options: any) => (await import('./sheet/server')).onUpdateDocument(options),
  },
  visualization: {
    onCreateDocument: async (options: any) => (await import('./visualization/server')).onCreateDocument(options),
    onUpdateDocument: async (options: any) => (await import('./visualization/server')).onUpdateDocument(options),
  },
  document: {
    onCreateDocument: async (options: any) => (await import('./document/server')).onCreateDocument(options),
    onUpdateDocument: async (options: any) => (await import('./document/server')).onUpdateDocument(options),
  },
} as const

export type ArtifactType = keyof typeof artifactRegistry

// Types
export interface DataStream {
  writeData: (data: any) => void
  close: () => void
}

export interface DocumentHandler {
  onCreateDocument: (options: {
    title: string
    dataStream: DataStream
    metadata?: any
  }) => Promise<string>
  onUpdateDocument: (options: {
    document: any
    description: string
    dataStream: DataStream
  }) => Promise<string>
}

// Helper function to get document handler (replaces centralized system)
export function getDocumentHandler(kind: ArtifactType): DocumentHandler | undefined {
  const handler = serverHandlerRegistry[kind]
  if (!handler) {
    console.warn(`No handler found for artifact type: ${kind}`)
    return undefined
  }
  
  return {
    onCreateDocument: handler.onCreateDocument,
    onUpdateDocument: handler.onUpdateDocument,
  }
}

// Supported artifact kinds
export const artifactKinds = ["text", "code", "chart", "visualization", "document", "image", "sheet"] as const
