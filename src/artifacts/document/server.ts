import { streamText } from 'ai';
import { getAzureOpenAIModel } from '@/config/azure-openai';
import type { DataStreamWriter } from 'ai';

const DOCUMENT_SYSTEM_PROMPT = `You are a technical documentation expert. Create comprehensive, well-structured documentation.
- Use clear headings and organization
- Include examples where appropriate
- Follow documentation best practices
- Make content scannable and searchable
- Include relevant links and references

**Instructions:**
1. Create well-structured documentation
2. Use proper markdown formatting
3. Include table of contents for longer documents
4. Add code examples when relevant
5. Ensure clarity and readability

Generate professional documentation based on the user's request.`;

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
      system: DOCUMENT_SYSTEM_PROMPT,
      prompt: `Create documentation for: ${title}

${metadata?.description ? `Description: ${metadata.description}` : ''}

Generate comprehensive, well-structured documentation.`,
    });

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta;
        dataStream.writeData({
          type: "document-delta",
          content: delta.textDelta
        });
      }
    }

    return content;
  } catch (error) {
    console.error('Error creating document:', error);
    const fallbackContent = `# ${title}

*Documentation generation failed. Please try again.*

## Overview
This document would contain comprehensive information about your requested topic.

## Getting Started
- Step 1: [Description]
- Step 2: [Description]
- Step 3: [Description]

## Examples
\`\`\`
// Example code would go here
\`\`\`

## Additional Resources
- [Link 1]
- [Link 2]`;
    
    dataStream.writeData({
      type: "document-delta",
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
      system: DOCUMENT_SYSTEM_PROMPT,
      prompt: `Update this documentation based on the request: "${description}"

Current document:
${document.content}

Generate the updated documentation.`,
    });

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        updatedContent += delta.textDelta;
        dataStream.writeData({
          type: "document-delta",
          content: delta.textDelta
        });
      }
    }

    return updatedContent;
  } catch (error) {
    console.error('Error updating document:', error);
    return document.content; // Return original content on error
  }
}
