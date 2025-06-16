// Simplified artifact tools
import { tool } from "ai"
import { z } from "zod"
import { generateUUID } from "@/lib/utils"
import type { ArtifactKind } from "@/lib/artifacts/types"
import { ArtifactError } from "./types"

const artifactKinds = ["text", "code", "chart", "visualization", "document", "image", "sheet"] as const

interface ChartData {
  chartType: 'bar' | 'line' | 'pie' | 'area'
  title: string
  xKey: string
  yKey: string
  data: Array<Record<string, any>>
}

/**
 * Detect chart type from title
 */
function detectChartType(title: string): ChartData['chartType'] {
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
 * Create fallback chart data
 */
function createFallbackChart(title: string): ChartData {
  return {
    chartType: detectChartType(title),
    title,
    xKey: 'category',
    yKey: 'value',
    data: [
      { category: 'Item A', value: 30 },
      { category: 'Item B', value: 45 },
      { category: 'Item C', value: 25 }
    ]
  }
}

/**
 * Extract JSON from mixed content
 */
function extractJSON(content: string): string | null {
  // Remove markdown code blocks
  let cleaned = content.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }
  
  // Find JSON object in content
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }
  
  return null
}

/**
 * Validate and normalize chart data
 */
function validateChartData(data: any, title: string): ChartData {
  // Ensure required fields exist
  const normalized: ChartData = {
    chartType: data.chartType || detectChartType(title),
    title: data.title || title,
    xKey: data.xKey || 'category',
    yKey: data.yKey || 'value',
    data: Array.isArray(data.data) ? data.data : []
  }
  
  return normalized
}

/**
 * Process chart content with clean error handling
 */
function processChartContent(content: string, title: string): string {
  if (!content?.trim()) {
    console.warn('[CHART] Empty content, using fallback')
    return JSON.stringify(createFallbackChart(title))
  }
  
  // Try to extract JSON from content
  const jsonString = extractJSON(content)
  if (!jsonString) {
    console.warn('[CHART] No JSON found in content, using fallback')
    return JSON.stringify(createFallbackChart(title))
  }
  
  // Try to parse and validate
  try {
    const parsed = JSON.parse(jsonString)
    const validated = validateChartData(parsed, title)
    return JSON.stringify(validated)
  } catch (error) {
    console.warn('[CHART] JSON parse failed, using fallback:', error)
    return JSON.stringify(createFallbackChart(title))
  }
}

/**
 * Create placeholder content
 */
function createPlaceholder(kind: ArtifactKind, title: string): string {
  switch (kind) {
    case 'chart':
      return JSON.stringify(createFallbackChart(title))
    case 'code':
      return `// ${title}\n// Generated code will appear here`
    case 'text':
      return `# ${title}\n\nContent will be generated here.`
    default:
      return `# ${title}\n\nContent will be generated here.`
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
