import { streamText } from 'ai';
import { getAzureOpenAIModel } from '@/config/azure-openai';
import type { DataStreamWriter } from 'ai';

const VISUALIZATION_SYSTEM_PROMPT = `You are a data visualization specialist. Create interactive visualizations.
- Design for user interaction and exploration
- Use appropriate visual encodings
- Ensure accessibility compliance
- Include proper legends and annotations
- Consider responsive design

**Instructions:**
1. Create engaging and informative visualizations
2. Use appropriate chart types for the data
3. Include interactive elements when possible
4. Ensure good color contrast and accessibility
5. Provide clear labels and legends

Generate visualization configurations or code as requested.`;

export async function onCreateDocument({
  title,
  dataStream,
  metadata,
}: {
  title: string;
  dataStream: DataStreamWriter;
  metadata?: any;
}): Promise<string> {
  let content = '';

  try {
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel(),
      system: VISUALIZATION_SYSTEM_PROMPT,
      prompt: `Create a visualization for: ${title}

${metadata?.description ? `Description: ${metadata.description}` : ''}

Generate a comprehensive visualization configuration or implementation.`,
    });

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta;
        dataStream.writeData({
          type: "visualization-delta",
          content: delta.textDelta
        });
      }
    }

    return content;
  } catch (error) {
    console.error('Error creating visualization:', error);
    const fallbackContent = `# ${title}

*Visualization generation failed. Please try again.*

## Visualization Placeholder
This would contain an interactive visualization based on your request.`;
    
    dataStream.writeData({
      type: "visualization-delta",
      content: fallbackContent
    });
    
    return fallbackContent;
  }
}

export async function onUpdateDocument({
  document,
  description,
  dataStream,
}: {
  document: any;
  description: string;
  dataStream: DataStreamWriter;
}): Promise<string> {
  let updatedContent = '';

  try {
    const { fullStream } = await streamText({
      model: getAzureOpenAIModel(),
      system: VISUALIZATION_SYSTEM_PROMPT,
      prompt: `Update this visualization based on the request: "${description}"

Current visualization:
${document.content}

Generate the updated visualization.`,
    });

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta;
        dataStream.writeData({
          type: "visualization-delta",
          content: delta.textDelta
        });
      }
    }

    return updatedContent;
  } catch (error) {
    console.error('Error updating visualization:', error);
    return document.content; // Return original content on error
  }
}
