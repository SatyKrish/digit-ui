import { streamText, smoothStream } from "ai"
import { getAzureOpenAIModel } from "@/config/azure-openai"
import type { ArtifactKind, ArtifactDocument, StreamPart, CreateArtifactOptions } from "./types"

// MCP client integration for server-side operations
let mcpClient: any = null;

const getMCPClient = async () => {
  if (!mcpClient && typeof window === 'undefined') {
    try {
      const { mcpClient: client } = await import('@/client/mcp-client');
      await client.initialize();
      return client;
    } catch (error) {
      console.warn('MCP client not available:', error);
      return null;
    }
  }
  return mcpClient;
};

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
  
  chart: `You are a data visualization expert. Generate realistic chart data and configuration.

CHART TYPE RULES:
- Use "pie" for: pie charts, distribution, breakdown, composition, share, percentage, proportion
- Use "bar" for: comparisons, rankings, categorical data
- Use "line" for: trends over time, continuous data
- Use "area" for: cumulative data, filled trends

REQUIRED JSON FORMAT:
{"chartType": "pie|bar|line|area", "title": "Chart Title", "xKey": "field1", "yKey": "field2", "data": [...]}

CRITICAL REQUIREMENTS:
- ALWAYS include chartType as the FIRST field - this is MANDATORY
- Use meaningful field names (country, category, value, etc.)
- Generate realistic data for the requested topic
- Keep data concise (≤10 items for pie charts)
- Ensure JSON is valid and complete`,
  
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
    
    // Try MCP integration first
    const mcp = await getMCPClient();
    if (mcp) {
      try {
        const mcpResult = await mcp.callTool('create_text_document', { title });
        if (mcpResult.success && mcpResult.data) {
          content = mcpResult.data.content;
          dataStream.writeData({
            type: "content-update",
            content: content
          });
          dataStream.writeData({
            type: "status-update",
            status: "completed"
          });
          return content;
        }
      } catch (error) {
        console.warn('MCP text creation failed, falling back to AI generation:', error);
      }
    }
    
    // Fallback to AI generation with streaming
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.text,
      prompt: `Create a well-structured text document with the title: "${title}". Make it engaging and informative.`,
      experimental_transform: smoothStream({ chunking: 'word' })
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "text-delta",
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
    
    // Try MCP integration first
    const mcp = await getMCPClient();
    if (mcp) {
      try {
        const mcpResult = await mcp.callTool('update_text_document', { 
          documentId: document.id,
          content: document.content,
          description 
        });
        if (mcpResult.success && mcpResult.data) {
          updatedContent = mcpResult.data.content;
          dataStream.writeData({
            type: "content-update",
            content: updatedContent
          });
          return updatedContent;
        }
      } catch (error) {
        console.warn('MCP text update failed, falling back to AI generation:', error);
      }
    }
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.text,
      prompt: `Update the following text document based on this request: "${description}"\n\nCurrent content:\n${document.content}`,
      experimental_transform: smoothStream({ chunking: 'word' })
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta
        dataStream.writeData({
          type: "text-delta",
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
    
    // Try MCP integration first
    const mcp = await getMCPClient();
    if (mcp) {
      try {
        const mcpResult = await mcp.callTool('create_code_document', { 
          title, 
          language,
          requirements: metadata?.requirements 
        });
        if (mcpResult.success && mcpResult.data) {
          content = mcpResult.data.content;
          dataStream.writeData({
            type: "code-delta",
            content: content
          });
          
          // Extract metadata
          const detectedLanguage = detectLanguage(content);
          dataStream.writeData({
            type: "metadata-update",
            metadata: {
              language: detectedLanguage,
              lineCount: content.split('\n').length
            }
          });
          
          return content;
        }
      } catch (error) {
        console.warn('MCP code creation failed, falling back to AI generation:', error);
      }
    }
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.code,
      prompt: `Create ${language} code for: "${title}". Include proper documentation and examples.`,
      experimental_transform: smoothStream({ chunking: 'word' })
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "code-delta",
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
    
    // Try MCP integration first
    const mcp = await getMCPClient();
    if (mcp) {
      try {
        const mcpResult = await mcp.callTool('update_code_document', { 
          documentId: document.id,
          content: document.content,
          language: document.metadata.language,
          description 
        });
        if (mcpResult.success && mcpResult.data) {
          updatedContent = mcpResult.data.content;
          dataStream.writeData({
            type: "code-delta",
            content: updatedContent
          });
          return updatedContent;
        }
      } catch (error) {
        console.warn('MCP code update failed, falling back to AI generation:', error);
      }
    }
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.code,
      prompt: `Update this ${document.metadata.language || 'code'}: "${description}"\n\nCurrent code:\n${document.content}`,
      experimental_transform: smoothStream({ chunking: 'word' })
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta
        dataStream.writeData({
          type: "code-delta",
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
    
    console.log('[CHART DEBUG] Title:', title);
    
    // First, use LLM to determine the optimal chart configuration
    const configResult = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: `You are a data visualization expert. Analyze the given request and determine the optimal chart configuration.

CHART TYPE SELECTION:
- "pie": For parts of a whole, percentages, distributions, market share
- "bar": For comparisons, rankings, categorical data, top N lists
- "line": For trends over time, continuous data, time series
- "area": For cumulative data, stacked trends, filled line charts

FIELD NAMING:
- Choose meaningful field names based on the data type
- For geographic data: use "country", "region", "city" 
- For financial data: use "revenue", "profit", "value", "amount"
- For rankings: use "rank", "score", "rating"
- For time data: use "date", "year", "month", "time"

Return ONLY a JSON object with this structure:
{
  "chartType": "pie|bar|line|area",
  "xKey": "appropriate_field_name",
  "yKey": "appropriate_field_name", 
  "dataStructure": "brief description of what data should look like"
}`,
      prompt: `Analyze this chart request and determine the optimal configuration: "${title}"`
    });
    
    const chartConfig = await configResult.text;
    
    let chartMeta;
    try {
      chartMeta = JSON.parse(chartConfig);
      console.log('[CHART DEBUG] LLM determined chart config:', chartMeta);
    } catch (error) {
      console.warn('[CHART DEBUG] Failed to parse chart config, using defaults:', error);
      chartMeta = {
        chartType: 'bar',
        xKey: 'name',
        yKey: 'value',
        dataStructure: 'Array of objects with name and value fields'
      };
    }
    
    // Now generate the actual chart data using the determined configuration
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.chart,
      prompt: `Create chart data for: "${title}"

REQUIRED CONFIGURATION:
- Chart Type: ${chartMeta.chartType}
- X-axis field: ${chartMeta.xKey}  
- Y-axis field: ${chartMeta.yKey}
- Data Structure: ${chartMeta.dataStructure}

Return ONLY valid JSON in this exact format:
{
  "chartType": "${chartMeta.chartType}",
  "title": "${title}",
  "xKey": "${chartMeta.xKey}",
  "yKey": "${chartMeta.yKey}",
  "data": [...]
}

Generate realistic, relevant data for the topic. Keep data concise (≤10 items for pie charts, ≤15 for others).`,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "chart-delta",
          content: delta.textDelta
        })
      }
    }

    console.log('[CHART DEBUG] Raw AI response:', content);

    // Validate and parse chart data for metadata
    try {
      const chartData = JSON.parse(content)
      console.log('[CHART DEBUG] Parsed chart data:', chartData);
      
      // Track if we need to update the content
      let needsUpdate = false;
      
      // Ensure chartType is always present (fallback to LLM determined type)
      if (!chartData.chartType) {
        chartData.chartType = chartMeta.chartType;
        needsUpdate = true;
        console.log('[CHART DEBUG] Added missing chartType:', chartData.chartType);
      }
      
      // Ensure required fields are present (fallback to LLM determined fields)
      if (!chartData.xKey && chartData.data && chartData.data.length > 0) {
        chartData.xKey = chartMeta.xKey || Object.keys(chartData.data[0])[0];
        needsUpdate = true;
        console.log('[CHART DEBUG] Added missing xKey:', chartData.xKey);
      }
      
      if (!chartData.yKey && chartData.data && chartData.data.length > 0) {
        chartData.yKey = chartMeta.yKey || Object.keys(chartData.data[0])[1] || Object.keys(chartData.data[0])[0];
        needsUpdate = true;
        console.log('[CHART DEBUG] Added missing yKey:', chartData.yKey);
      }
      
      // Update content with corrected data only if we made changes
      if (needsUpdate) {
        content = JSON.stringify(chartData);
        console.log('[CHART DEBUG] Updated content with missing fields');
      }
      console.log('[CHART DEBUG] Final chart content:', content);
      
      if (chartData.data && Array.isArray(chartData.data)) {
        dataStream.writeData({
          type: "chart-delta",
          data: chartData.data,
          chartType: chartData.chartType,
          title: chartData.title || title,
          xKey: chartData.xKey,
          yKey: chartData.yKey
        })
      }
      dataStream.writeData({
        type: "metadata-update",
        metadata: {
          chartType: chartData.chartType,
          dataPoints: chartData.data?.length || 0
        }
      })
    } catch (error) {
      console.error('[CHART DEBUG] JSON parse error:', error);
      console.error('[CHART DEBUG] Content that failed to parse:', content);
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

// Add new artifact handlers for image and sheet
export const imageDocumentHandler = createDocumentHandler({
  kind: "image" as const,
  
  onCreateDocument: async ({ title, dataStream }) => {
    let content = ""
    
    // Try MCP integration first
    const mcp = await getMCPClient();
    if (mcp) {
      try {
        const mcpResult = await mcp.callTool('generate_image', { 
          prompt: title,
          size: '1024x1024',
          quality: 'standard'
        });
        if (mcpResult.success && mcpResult.data) {
          content = mcpResult.data.base64 || mcpResult.data.url;
          dataStream.writeData({
            type: "image-delta",
            content: content
          });
          return content;
        }
      } catch (error) {
        console.warn('MCP image generation failed, using placeholder:', error);
      }
    }
    
    // Fallback to placeholder or AI image generation
    content = `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f3f4f6"/>
        <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#6b7280">
          Generated Image: ${title}
        </text>
      </svg>
    `).toString('base64')}`;
    
    dataStream.writeData({
      type: "image-delta",
      content: content
    });

    return content;
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let updatedContent = ""
    
    // Try MCP integration first
    const mcp = await getMCPClient();
    if (mcp) {
      try {
        const mcpResult = await mcp.callTool('modify_image', { 
          imageData: document.content,
          modification: description
        });
        if (mcpResult.success && mcpResult.data) {
          updatedContent = mcpResult.data.base64 || mcpResult.data.url;
          dataStream.writeData({
            type: "image-delta",
            content: updatedContent
          });
          return updatedContent;
        }
      } catch (error) {
        console.warn('MCP image modification failed:', error);
      }
    }
    
    // Fallback - return original content
    return document.content;
  }
})

export const sheetDocumentHandler = createDocumentHandler({
  kind: "sheet" as const,
  
  onCreateDocument: async ({ title, dataStream, metadata }) => {
    let content = ""
    
    // Try MCP integration first  
    const mcp = await getMCPClient();
    if (mcp) {
      try {
        const mcpResult = await mcp.callTool('create_spreadsheet', { 
          title,
          structure: metadata?.structure || 'basic',
          sampleData: metadata?.sampleData !== false
        });
        if (mcpResult.success && mcpResult.data) {
          content = mcpResult.data.csv || mcpResult.data.content;
          dataStream.writeData({
            type: "sheet-delta",
            content: content
          });
          return content;
        }
      } catch (error) {
        console.warn('MCP sheet creation failed, falling back to AI generation:', error);
      }
    }
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.chart,
      prompt: `Create CSV data for a spreadsheet titled: "${title}". Include headers and sample data.`,
      experimental_transform: smoothStream({ chunking: 'word' })
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "sheet-delta", 
          content: delta.textDelta
        })
      }
    }

    return content;
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let updatedContent = ""
    
    // Try MCP integration first
    const mcp = await getMCPClient();
    if (mcp) {
      try {
        const mcpResult = await mcp.callTool('update_spreadsheet', { 
          csvData: document.content,
          modification: description
        });
        if (mcpResult.success && mcpResult.data) {
          updatedContent = mcpResult.data.csv || mcpResult.data.content;
          dataStream.writeData({
            type: "sheet-delta",
            content: updatedContent
          });
          return updatedContent;
        }
      } catch (error) {
        console.warn('MCP sheet update failed, falling back to AI generation:', error);
      }
    }
    
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel("gpt-4o"),
      system: SYSTEM_PROMPTS.chart,
      prompt: `Update this CSV data: "${description}"\n\nCurrent data:\n${document.content}`,
      experimental_transform: smoothStream({ chunking: 'word' })
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta
        dataStream.writeData({
          type: "sheet-delta",
          content: delta.textDelta
        })
      }
    }

    return updatedContent;
  }
})

// Registry of all document handlers
export const documentHandlersByArtifactKind: DocumentHandler[] = [
  textDocumentHandler,
  codeDocumentHandler,
  chartDocumentHandler,
  visualizationDocumentHandler,
  documentDocumentHandler,
  imageDocumentHandler,
  sheetDocumentHandler
]

export const artifactKinds = ["text", "code", "chart", "visualization", "document", "image", "sheet"] as const

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
