import { streamText } from 'ai';
import { getAzureOpenAIModel } from '@/config/azure-openai';
import type { DataStreamWriter } from 'ai';

const TEXT_SYSTEM_PROMPT = `You are a professional writer and content creator. Create high-quality, well-structured text content based on the user's request.

**Instructions:**
1. Write clear, engaging, and well-organized content
2. Use proper grammar, spelling, and punctuation
3. Structure content with appropriate headings, paragraphs, and formatting
4. Adapt tone and style to match the content type and audience
5. Include relevant details and examples where appropriate

**Content Guidelines:**
- Start with a clear introduction or overview
- Use logical flow and smooth transitions between ideas
- Include specific details and concrete examples
- End with a strong conclusion or call-to-action when appropriate
- Maintain consistency in tone and style throughout

**Formatting:**
- Use markdown formatting for structure (headings, lists, emphasis)
- Break content into digestible paragraphs
- Use bullet points or numbered lists for clarity
- Include relevant links or references when applicable

Write only the requested content. Focus on clarity and readability.`;

export async function onCreateDocument({
  title,
  dataStream,
}: {
  title: string;
  dataStream: DataStreamWriter;
}) {
  let content = '';
  
  const { fullStream } = await streamText({
    model: getAzureOpenAIModel('gpt-4o'),
    system: TEXT_SYSTEM_PROMPT,
    prompt: `Create well-structured content for: "${title}". Use markdown formatting and ensure the content is engaging and informative.`,
  });

  for await (const delta of fullStream) {
    if (delta.type === 'text-delta') {
      content += delta.textDelta;
      dataStream.writeData({
        type: 'text-delta',
        content: delta.textDelta,
      });
    }
  }

  // Calculate content statistics
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute
  const paragraphCount = content.split('\n\n').filter(para => para.trim().length > 0).length;

  dataStream.writeData({
    type: 'metadata-update',
    metadata: {
      wordCount,
      readingTime,
      paragraphCount,
      characterCount: content.length,
    },
  });

  return content;
}

export async function onUpdateDocument({
  document,
  description,
  dataStream,
}: {
  document: { content: string };
  description: string;
  dataStream: DataStreamWriter;
}) {
  let content = '';
  
  const { fullStream } = await streamText({
    model: getAzureOpenAIModel('gpt-4o'),
    system: TEXT_SYSTEM_PROMPT,
    prompt: `Update this content: "${description}"\n\nCurrent content:\n${document.content}`,
  });

  for await (const delta of fullStream) {
    if (delta.type === 'text-delta') {
      content += delta.textDelta;
      dataStream.writeData({
        type: 'text-delta',
        content: delta.textDelta,
      });
    }
  }

  // Calculate updated statistics
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);
  const paragraphCount = content.split('\n\n').filter(para => para.trim().length > 0).length;

  dataStream.writeData({
    type: 'metadata-update',
    metadata: {
      wordCount,
      readingTime,
      paragraphCount,
      characterCount: content.length,
    },
  });

  return content;
}
