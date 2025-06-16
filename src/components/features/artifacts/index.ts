// Simplified Artifacts System - Aligned with Vercel AI SDK
// 
// This module provides a simplified artifact system following official Vercel AI SDK patterns:
// - Uses useChat hook's `data` property for artifact streaming (official pattern)
// - Simple artifact display component
// - No complex custom providers or state management

// Core Types (keep these for compatibility)
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

// All artifact components have been removed as System B has been eliminated
// The application now uses the official Vercel AI SDK pattern exclusively

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
