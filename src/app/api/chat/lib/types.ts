// Chat API types and schemas
import { z } from "zod"

export const chatRequestSchema = z.object({
  id: z.string().uuid().optional(),
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string().max(50000),
    name: z.string().optional(),
    toolInvocations: z.array(z.any()).optional(),
    createdAt: z.union([z.date(), z.string().datetime()]).optional()
  })).min(1),
  userId: z.string().min(1).optional(),
  selectedVisibilityType: z.enum(['public', 'private']).optional().default('private')
})

export type ChatRequest = z.infer<typeof chatRequestSchema>

// Simplified error types
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class MCPError extends Error {
  constructor(message: string, public serverId?: string) {
    super(message)
    this.name = 'MCPError'
  }
}

export class ArtifactError extends Error {
  constructor(message: string, public artifactKind?: string) {
    super(message)
    this.name = 'ArtifactError'
  }
}
