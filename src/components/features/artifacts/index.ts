// Modular Artifacts System - Pure Modular Architecture
// 
// This module provides a modular artifact system with:
// - Individual artifact types in separate modules
// - Server-side handlers for each artifact type
// - Client-side components for each artifact type
// - Central registry for dynamic access

// Core Types (from types file)
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

// Re-export from modular system
export {
  artifactRegistry,
  serverHandlerRegistry,
  getDocumentHandler,
  artifactKinds,
  type ArtifactType,
  type DataStream,
  type DocumentHandler
} from "@/artifacts"

// Note: System B (Simple Streaming Pattern) has been completely removed
// All artifacts now use the official Vercel AI SDK pattern through ArtifactWorkspace
// 
// Migration guide:
// - Use useChat hook's `data` property instead of custom artifact context
// - Use SimpleArtifact component for artifact display
// - Artifacts are automatically streamed through the official Vercel AI SDK
export { ArtifactWorkspace } from "./artifact-workspace-vercel"

// Simple Artifact Component (Vercel AI SDK Pattern)
export { SimpleArtifact } from "./simple-artifact"

// Demo Components
export { DemoArtifactWorkspace } from "./demo-workspace"

// Data Stream Handler
export { DataStreamHandler } from "./data-stream-handler"

// Server Actions (RSC) - commented out temporarily for build fix
// export { 
//   createStreamingArtifact,
//   updateStreamingArtifact
// } from "@/app/actions/artifacts"
