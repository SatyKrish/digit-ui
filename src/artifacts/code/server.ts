import { streamText } from 'ai';
import { getAzureOpenAIModel } from '@/config/azure-openai';
import type { DataStreamWriter } from 'ai';

const CODE_SYSTEM_PROMPT = `You are an expert software developer. Create clean, well-structured code based on the user's request.

**Instructions:**
1. Write clean, readable code with proper indentation and organization
2. Include appropriate comments and documentation
3. Follow language-specific best practices and conventions
4. Ensure the code is functional and handles edge cases
5. Use modern syntax and patterns for the target language
6. Include error handling where appropriate

**Code Quality Guidelines:**
- Use meaningful variable and function names
- Add inline comments for complex logic
- Follow consistent formatting and style
- Include necessary imports and dependencies
- Provide example usage when relevant

Return only the requested code. Do not include explanatory text outside of code comments.`;

function detectLanguage(title: string, content?: string): string {
  const titleLower = title.toLowerCase();
  const contentLower = content?.toLowerCase() || '';
  
  if (titleLower.includes('python') || contentLower.includes('import ') || contentLower.includes('def ')) {
    return 'python';
  }
  if (titleLower.includes('javascript') || titleLower.includes('js') || contentLower.includes('function ') || contentLower.includes('const ')) {
    return 'javascript';
  }
  if (titleLower.includes('typescript') || titleLower.includes('ts') || contentLower.includes('interface ') || contentLower.includes('type ')) {
    return 'typescript';
  }
  if (titleLower.includes('react') || contentLower.includes('jsx') || contentLower.includes('usestate')) {
    return 'tsx';
  }
  if (titleLower.includes('sql') || contentLower.includes('select ') || contentLower.includes('from ')) {
    return 'sql';
  }
  if (titleLower.includes('bash') || titleLower.includes('shell') || contentLower.includes('#!/bin/bash')) {
    return 'bash';
  }
  
  // Default to JavaScript for web-focused environment
  return 'javascript';
}

export async function onCreateDocument({
  title,
  dataStream,
  metadata,
}: {
  title: string;
  dataStream: DataStreamWriter;
  metadata?: { language?: string };
}) {
  let content = '';
  const language = metadata?.language || detectLanguage(title);
  
  const { fullStream } = await streamText({
    model: getAzureOpenAIModel('gpt-4o'),
    system: CODE_SYSTEM_PROMPT,
    prompt: `Create ${language} code for: "${title}". Include proper comments and follow best practices.`,
  });

  for await (const delta of fullStream) {
    if (delta.type === 'text-delta') {
      content += delta.textDelta;
      dataStream.writeData({
        type: 'code-delta',
        content: delta.textDelta,
      });
    }
  }

  // Send metadata about the code
  dataStream.writeData({
    type: 'metadata-update',
    metadata: {
      language,
      lineCount: content.split('\n').length,
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
  const language = detectLanguage(description, document.content);
  
  const { fullStream } = await streamText({
    model: getAzureOpenAIModel('gpt-4o'),
    system: CODE_SYSTEM_PROMPT,
    prompt: `Update this ${language} code: "${description}"\n\nCurrent code:\n${document.content}`,
  });

  for await (const delta of fullStream) {
    if (delta.type === 'text-delta') {
      content += delta.textDelta;
      dataStream.writeData({
        type: 'code-delta',
        content: delta.textDelta,
      });
    }
  }

  // Send updated metadata
  dataStream.writeData({
    type: 'metadata-update',
    metadata: {
      language,
      lineCount: content.split('\n').length,
      characterCount: content.length,
    },
  });

  return content;
}
