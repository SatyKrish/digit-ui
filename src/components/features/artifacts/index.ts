// Chat SDK-inspired Artifacts System
// 
// This module provides a complete artifacts system following the Vercel Chat SDK patterns:
// - Streaming artifact generation with real-time updates
// - Workspace-like interface for artifact management  
// - Multiple artifact types (text, code, chart, visualization, document)
// - Server-side streaming with RSC support
// - Comprehensive artifact actions and toolbar

// Core Types
export type { 
  ArtifactKind,
  ArtifactMetadata,
  ArtifactDocument,
  ArtifactVersion,
  ArtifactActions,
  ArtifactToolbarAction,
  CreateArtifactOptions,
  StreamPart
} from "@/lib/artifacts/types"

// Server Components (removed - simplified architecture)
// Individual artifact servers are now imported directly in chat route
// export {
//   createDocumentHandler,
//   getDocumentHandler,
//   documentHandlersByArtifactKind,
//   artifactKinds,
//   textDocumentHandler,
//   codeDocumentHandler,
//   chartDocumentHandler,
//   visualizationDocumentHandler,
//   documentDocumentHandler
// } from "@/lib/artifacts/server"

// Client Components
export { ArtifactWorkspace } from "./artifact-workspace-vercel"

// Enhanced Artifact System
export { EnhancedArtifactProvider, useEnhancedArtifacts } from "./enhanced-artifact-provider"

// Demo Components
export { DemoArtifactWorkspace } from "./demo-workspace"

// Server Actions (RSC) - commented out temporarily for build fix
// export { 
//   createStreamingArtifact,
//   updateStreamingArtifact
// } from "@/app/actions/artifacts"
