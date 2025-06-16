// Enhanced artifact tools using streaming document handlers
import { tool } from "ai"
import { z } from "zod"
import { generateUUID } from "@/lib/utils"
import { getDocumentHandler, artifactKinds } from "@/lib/artifacts/server"
import type { ArtifactKind } from "@/lib/artifacts/types"
import { ArtifactError } from "./types"

/**
 * Create document tool using streaming handlers
 */
export function createDocumentTool() {
  return tool({
    description: 'Create a new document, code file, chart, or other content with real-time streaming.',
    parameters: z.object({
      kind: z.enum(artifactKinds as readonly [ArtifactKind, ...ArtifactKind[]]),
      title: z.string().min(1).max(200),
      content: z.string().max(100000).optional(),
      language: z.string().optional()
    }),
    execute: async ({ kind, title, content, language }) => {
      console.log(`[ARTIFACT] Creating ${kind}: ${title}`)
      const artifactId = generateUUID()
      
      try {
        const handler = getDocumentHandler(kind)
        if (!handler) {
          throw new Error(`No handler found for artifact kind: ${kind}`)
        }

        console.log(`[ARTIFACT] Found handler for ${kind}, calling onCreateDocument`)

        // Create a simplified data stream for tool execution
        // The actual streaming to the client happens through the AI SDK's own streaming mechanism
        const dataStreamItems: any[] = []
        const dataStream = {
          writeData: (data: any) => {
            console.log(`[ARTIFACT] Handler streaming data:`, JSON.stringify(data, null, 2))
            dataStreamItems.push(data)
          },
          close: () => {
            console.log(`[ARTIFACT] Handler stream closed`)
          }
        }

        // Call the streaming handler
        const resultContent = await handler.onCreateDocument({
          title,
          dataStream,
          metadata: { language }
        })

        console.log(`[ARTIFACT] Handler completed successfully`)
        console.log(`[ARTIFACT] Result content length: ${resultContent?.length || 0}`)
        console.log(`[ARTIFACT] Stream items count: ${dataStreamItems.length}`)

        // Return a comprehensive result that includes the streaming data
        // The AI SDK will handle the actual streaming to the client
        const result = {
          id: artifactId,
          kind,
          title,
          content: resultContent,
          language,
          streamData: dataStreamItems,
          success: true,
          message: `Successfully created ${kind}: ${title}`
        }

        console.log(`[ARTIFACT] Returning result:`, JSON.stringify({
          ...result,
          content: result.content ? `${result.content.substring(0, 100)}...` : 'empty',
          streamData: `${result.streamData.length} items`
        }, null, 2))

        return result
      } catch (error) {
        console.error(`[ARTIFACT] Error creating ${kind}:`, error)
        console.error(`[ARTIFACT] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        throw new ArtifactError(`Failed to create ${kind}: ${errorMessage}`, kind)
      }
    }
  })
}

/**
 * Update document tool using streaming handlers
 */
export function createUpdateDocumentTool() {
  return tool({
    description: 'Update an existing document or artifact with real-time streaming.',
    parameters: z.object({
      artifactId: z.string().uuid(),
      content: z.string().max(100000),
      title: z.string().optional(),
      description: z.string().min(1).max(500)
    }),
    execute: async ({ artifactId, content, title, description }) => {
      console.log(`[ARTIFACT] Updating: ${artifactId}`)
      
      try {
        // For now, return a simple update result
        // In a full implementation, you'd need to determine the kind and use the proper handler
        return {
          id: artifactId,
          content,
          title,
          success: true,
          message: `Updated artifact: ${description}`
        }
      } catch (error) {
        console.error(`[ARTIFACT] Error updating ${artifactId}:`, error)
        throw new ArtifactError(error instanceof Error ? error.message : 'Unknown error')
      }
    }
  })
}