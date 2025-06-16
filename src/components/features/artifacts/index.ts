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

// Simple artifact component following official Vercel AI SDK pattern
export { SimpleArtifact } from "./simple-artifact"

// Keep data stream handler for compatibility
export { DataStreamHandler } from "./data-stream-handler"

// Note: The following components have been removed in favor of the official Vercel AI SDK pattern:
// - EnhancedArtifactProvider (replaced by useChat hook's data property)
// - ArtifactWorkspace (replaced by SimpleArtifact)
// - useEnhancedArtifacts (no longer needed)
// 
// Migration guide:
// - Use useChat hook's `data` property instead of custom artifact context
// - Use SimpleArtifact component for artifact display
// - Artifacts are automatically streamed through the official Vercel AI SDK
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
