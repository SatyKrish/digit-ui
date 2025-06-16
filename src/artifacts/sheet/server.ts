import { streamText } from 'ai';
import { getAzureOpenAIModel } from '@/config/azure-openai';
import type { DataStreamWriter } from 'ai';

const SHEET_SYSTEM_PROMPT = `You are a data analyst and spreadsheet expert. Create well-structured tabular data in CSV format based on the user's request.

**Instructions:**
1. Generate realistic, relevant data that matches the user's request
2. Create appropriate column headers that are descriptive and clear
3. Include 10-20 rows of sample data unless specified otherwise
4. Use proper CSV formatting with headers in the first row
5. Ensure data types are consistent within each column
6. Include a mix of text, numbers, and dates where appropriate

**Data Quality Guidelines:**
- Use realistic values that make sense for the context
- Ensure data relationships are logical (e.g., dates in chronological order)
- Include some variation in data to make it interesting
- Use proper formatting for dates (YYYY-MM-DD), numbers, and text
- Avoid special characters that might break CSV parsing

**CSV Format:**
- First row must contain column headers
- Use commas as delimiters
- Quote fields that contain commas or special characters
- No extra spaces around commas
- Consistent data types within columns

Return only the CSV data. No explanations or markdown formatting.`;

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
    system: SHEET_SYSTEM_PROMPT,
    prompt: `Create CSV data for: "${title}". Include appropriate headers and 10-15 rows of realistic sample data.`,
  });

  for await (const delta of fullStream) {
    if (delta.type === 'text-delta') {
      content += delta.textDelta;
      dataStream.writeData({
        type: 'sheet-delta',
        content: delta.textDelta,
      });
    }
  }

  // Parse CSV to get statistics
  const lines = content.trim().split('\n');
  const headers = lines[0]?.split(',') || [];
  const dataRows = lines.slice(1);
  
  dataStream.writeData({
    type: 'metadata-update',
    metadata: {
      rows: dataRows.length,
      columns: headers.length,
      headers: headers.map(h => h.replace(/"/g, '').trim()),
      size: content.length,
      lastUpdated: new Date().toISOString(),
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
    system: SHEET_SYSTEM_PROMPT,
    prompt: `Update this CSV data: "${description}"\n\nCurrent data:\n${document.content}`,
  });

  for await (const delta of fullStream) {
    if (delta.type === 'text-delta') {
      content += delta.textDelta;
      dataStream.writeData({
        type: 'sheet-delta',
        content: delta.textDelta,
      });
    }
  }

  // Parse updated CSV to get new statistics
  const lines = content.trim().split('\n');
  const headers = lines[0]?.split(',') || [];
  const dataRows = lines.slice(1);
  
  dataStream.writeData({
    type: 'metadata-update',
    metadata: {
      rows: dataRows.length,
      columns: headers.length,
      headers: headers.map(h => h.replace(/"/g, '').trim()),
      size: content.length,
      lastUpdated: new Date().toISOString(),
    },
  });

  return content;
}
