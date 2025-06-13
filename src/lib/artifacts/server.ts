import { streamText } from "ai"
import { getAzureOpenAIModel } from "@/config/azure-openai"
import type { ArtifactKind, ArtifactDocument, StreamPart, CreateArtifactOptions } from "./types"

export interface DataStream {
  writeData: (data: StreamPart) => void
  close: () => void
}

export interface DocumentHandler<K extends ArtifactKind = ArtifactKind> {
  kind: K
  onCreateDocument: (options: {
    title: string
    dataStream: DataStream
    metadata?: any
  }) => Promise<string>
  onUpdateDocument: (options: {
    document: ArtifactDocument
    description: string
    dataStream: DataStream
  }) => Promise<string>
}

// System prompts for different artifact types
const SYSTEM_PROMPTS = {
  text: "You are an expert writer. Create clear, well-structured text content based on the user's request. Focus on clarity, organization, and engaging writing.",
  
  code: `You are an expert programmer. Generate clean, well-commented, production-ready code.
- Follow best practices for the language
- Include proper error handling
- Add helpful comments
- Make code readable and maintainable
- Consider security and performance`,
  
  chart: `You are a data visualization expert. Create chart configurations and data.
- Use appropriate chart types for the data
- Ensure data is properly formatted
- Include clear labels and legends
- Consider accessibility and readability
- Provide sample data if none is given`,
  
  visualization: `You are a data visualization specialist. Create interactive visualizations.
- Design for user interaction and exploration
- Use appropriate visual encodings
- Ensure accessibility compliance
- Include proper legends and annotations
- Consider responsive design`,
  
  document: `You are a technical documentation expert. Create comprehensive, well-structured documentation.
- Use clear headings and organization
- Include examples where appropriate
- Follow documentation best practices
- Make content scannable and searchable
- Include relevant links and references`
} as const

// Create document handlers for each artifact type
export const createDocumentHandler = <K extends ArtifactKind>(
  config: DocumentHandler<K>
): DocumentHandler<K> => config

export const textDocumentHandler = createDocumentHandler({
  kind: "text" as const,
  
  onCreateDocument: async ({ title, dataStream }) => {
    let content = ""
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.text,
      prompt: `Create a well-structured text document with the title: "${title}". Make it engaging and informative.`
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    dataStream.writeData({
      type: "status-update",
      status: "completed"
    })

    return content
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let updatedContent = ""
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.text,
      prompt: `Update the following text document based on this request: "${description}"\n\nCurrent content:\n${document.content}`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    return updatedContent
  }
})

export const codeDocumentHandler = createDocumentHandler({
  kind: "code" as const,
  
  onCreateDocument: async ({ title, dataStream, metadata }) => {
    let content = ""
    const language = metadata?.language || "javascript"
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.code,
      prompt: `Create ${language} code for: "${title}". Include proper documentation and examples.`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    // Extract metadata from generated code
    const detectedLanguage = detectLanguage(content)
    dataStream.writeData({
      type: "metadata-update",
      metadata: {
        language: detectedLanguage,
        lineCount: content.split('\n').length
      }
    })

    return content
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let updatedContent = ""
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.code,
      prompt: `Update this ${document.metadata.language || 'code'}: "${description}"\n\nCurrent code:\n${document.content}`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    return updatedContent
  }
})

export const chartDocumentHandler = createDocumentHandler({
  kind: "chart" as const,
  
  onCreateDocument: async ({ title, dataStream }) => {
    let content = ""
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.chart,
      prompt: `Create a chart configuration and sample data for: "${title}". Return valid JSON configuration for Chart.js or similar libraries.`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    // Validate and parse chart data
    try {
      const chartData = JSON.parse(content)
      dataStream.writeData({
        type: "metadata-update",
        metadata: {
          chartType: chartData.type || 'unknown',
          dataPoints: chartData.data?.datasets?.[0]?.data?.length || 0
        }
      })
    } catch (error) {
      dataStream.writeData({
        type: "error",
        error: "Invalid chart data format"
      })
    }

    return content
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let updatedContent = ""
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.chart,
      prompt: `Update this chart configuration: "${description}"\n\nCurrent config:\n${document.content}`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    return updatedContent
  }
})

export const visualizationDocumentHandler = createDocumentHandler({
  kind: "visualization" as const,
  
  onCreateDocument: async ({ title, dataStream }) => {
    let content = ""
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.visualization,
      prompt: `Create an interactive data visualization for: "${title}". Include HTML, CSS, and JavaScript for a complete visualization.`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    return content
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let updatedContent = ""
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.visualization,
      prompt: `Update this visualization: "${description}"\n\nCurrent code:\n${document.content}`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    return updatedContent
  }
})

export const documentDocumentHandler = createDocumentHandler({
  kind: "document" as const,
  
  onCreateDocument: async ({ title, dataStream }) => {
    let content = ""
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.document,
      prompt: `Create comprehensive documentation for: "${title}". Use markdown formatting and include proper structure.`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    // Extract document metadata
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200) // Assuming 200 words per minute
    
    dataStream.writeData({
      type: "metadata-update",
      metadata: {
        wordCount,
        readingTime
      }
    })

    return content
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let updatedContent = ""
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.document,
      prompt: `Update this documentation: "${description}"\n\nCurrent documentation:\n${document.content}`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    return updatedContent
  }
})

// Registry of all document handlers
export const documentHandlersByArtifactKind: DocumentHandler[] = [
  textDocumentHandler,
  codeDocumentHandler,
  chartDocumentHandler,
  visualizationDocumentHandler,
  documentDocumentHandler
]

export const artifactKinds = ["text", "code", "chart", "visualization", "document"] as const

// Helper functions
function detectLanguage(code: string): string {
  if (code.includes('def ') || code.includes('import ')) return "python"
  if (code.includes('function ') || code.includes('const ') || code.includes('import ')) return "javascript"
  if (code.includes('public class ') || code.includes('import java')) return "java"
  if (code.includes('<script') || code.includes('<html')) return "html"
  if (code.includes('SELECT ') || code.includes('INSERT ')) return "sql"
  return "text"
}

export function getDocumentHandler(kind: ArtifactKind): DocumentHandler | undefined {
  return documentHandlersByArtifactKind.find(handler => handler.kind === kind)
}
