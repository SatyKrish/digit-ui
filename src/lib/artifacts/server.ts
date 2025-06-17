// Legacy server.ts file - now redirects to modular artifacts
// This file maintains backward compatibility while the modular system is the source of truth

import { 
  getDocumentHandler as getModularHandler,
  artifactKinds as modularArtifactKinds,
  type DataStream,
  type DocumentHandler
} from "@/artifacts"

// Re-export types for compatibility
export type { DataStream, DocumentHandler }

// Re-export functions from modular system
export const getDocumentHandler = getModularHandler
export const artifactKinds = modularArtifactKinds

// Deprecated: This centralized system is being phased out
// Use the modular artifact system in /src/artifacts/ instead
