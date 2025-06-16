// Simplified artifact tools
import { tool } from "ai"
import { z } from "zod"
import { generateUUID } from "@/lib/utils"
import type { ArtifactKind } from "@/lib/artifacts/types"
import { ArtifactError } from "./types"

const artifactKinds = ["text", "code", "chart", "visualization", "document", "image", "sheet"] as const

/**
 * Simple chart type detection from title
 */
function detectChartType(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('pie') || lowerTitle.includes('distribution') || lowerTitle.includes('share')) {
    return 'pie'
  }
  if (lowerTitle.includes('line') || lowerTitle.includes('trend') || lowerTitle.includes('over time')) {
    return 'line'
  }
  if (lowerTitle.includes('area')) {
    return 'area'
  }
  
  return 'bar'
}

/**
 * Create minimal placeholder content
 */
function createPlaceholder(kind: ArtifactKind, title: string): string {
  switch (kind) {
    case 'chart':
      return JSON.stringify({
        title,
        chartType: detectChartType(title),
        data: [],
        xKey: 'x',
        yKey: 'y'
      })
    case 'code':
      return `// ${title}\n// Generated code will appear here`
    case 'text':
      return `# ${title}\n\nContent will be generated here.`
    default:
      return `# ${title}\n\nContent will be generated here.`
  }
}

/**
 * Simple chart content processing
 */
function processChartContent(content: string, title: string): string {
  if (!content?.trim()) {
    throw new Error('Empty chart content')
  }
  
  try {
    const parsed = JSON.parse(content)
    
    // Auto-detect chart type if missing
    if (!parsed.chartType) {
      parsed.chartType = detectChartType(title)
    }
    
    // Ensure basic structure
    if (!parsed.data) parsed.data = []
    if (!parsed.xKey) parsed.xKey = 'x'
    if (!parsed.yKey) parsed.yKey = 'y'
    
    return JSON.stringify(parsed)
  } catch (error) {
    throw new Error(`Invalid chart JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create document tool - simplified
 */
export function createDocumentTool() {
  return tool({
    description: 'Create a new document, code file, chart, or other content.',
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
        let resultContent = content || createPlaceholder(kind, title)
        
        // Process chart content
        if (kind === 'chart') {
          resultContent = processChartContent(resultContent, title)
        }
        
        return {
          id: artifactId,
          kind,
          title,
          content: resultContent,
          language,
          success: true,
          message: `Created ${kind}: ${title}`
        }
      } catch (error) {
        console.error(`[ARTIFACT] Error creating ${kind}:`, error)
        throw new ArtifactError(error instanceof Error ? error.message : 'Unknown error', kind)
      }
    }
  })
}

/**
 * Update document tool - simplified
 */
export function createUpdateDocumentTool() {
  return tool({
    description: 'Update an existing document or artifact.',
    parameters: z.object({
      artifactId: z.string().uuid(),
      content: z.string().max(100000),
      title: z.string().optional()
    }),
    execute: async ({ artifactId, content, title }) => {
      console.log(`[ARTIFACT] Updating: ${artifactId}`)
      
      return {
        id: artifactId,
        content,
        title,
        success: true,
        message: `Updated artifact`
      }
    }
  })
}
