import { streamText } from 'ai';
import { getAzureOpenAIModel } from '@/config/azure-openai';
import { createArtifact } from '@/lib/artifacts/create-artifact';
import type { DataStreamWriter } from 'ai';

const CHART_SYSTEM_PROMPT = `You are a data visualization specialist. Create interactive chart configurations in JSON format.

**Instructions:**
1. Analyze the user's request to determine the most appropriate chart type
2. Generate realistic, relevant sample data if none is provided
3. Choose appropriate field names for chart axes and data points
4. Return ONLY valid JSON in this exact format:

{
  "chartType": "bar" | "line" | "pie" | "area",
  "title": "Descriptive Chart Title",
  "xKey": "field_name_for_x_axis",
  "yKey": "field_name_for_y_axis", 
  "data": [
    {"field_name": "value1", "another_field": 100},
    {"field_name": "value2", "another_field": 150}
  ]
}

**Chart Type Guidelines:**
- Use "pie" for market share, distributions, or percentages
- Use "bar" for comparisons between categories
- Use "line" for trends over time
- Use "area" for cumulative data over time

**Data Requirements:**
- Generate 5-10 realistic data points
- Use meaningful field names (not generic like "x", "y")
- Ensure data values are appropriate for the chart type
- For pie charts, values should represent parts of a whole

Return ONLY the JSON object. No explanations or markdown formatting.`;

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
    system: CHART_SYSTEM_PROMPT,
    prompt: `Create chart data for: "${title}". Return only valid JSON with chartType, title, appropriate keys, and data array.`,
  });

  for await (const delta of fullStream) {
    if (delta.type === 'text-delta') {
      content += delta.textDelta;
      dataStream.writeData({
        type: 'chart-delta',
        content: delta.textDelta,
      });
    }
  }

  // Parse and validate chart data
  try {
    const chartData = JSON.parse(content);
    
    if (chartData.data && Array.isArray(chartData.data)) {
      // Send the complete chart data as metadata
      dataStream.writeData({
        type: 'chart-delta',
        data: chartData.data,
        chartType: chartData.chartType,
        title: chartData.title || title,
        xKey: chartData.xKey,
        yKey: chartData.yKey,
      });
    }
  } catch (error) {
    console.error('Failed to parse chart data:', error);
    // Create fallback chart data
    const fallbackData = {
      chartType: 'bar',
      title,
      xKey: 'category',
      yKey: 'value',
      data: [
        { category: 'Sample A', value: 100 },
        { category: 'Sample B', value: 150 },
        { category: 'Sample C', value: 120 },
      ],
    };
    
    dataStream.writeData({
      type: 'chart-delta',
      data: fallbackData.data,
      chartType: fallbackData.chartType,
      title: fallbackData.title,
      xKey: fallbackData.xKey,
      yKey: fallbackData.yKey,
    });
    
    content = JSON.stringify(fallbackData);
  }

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
    system: CHART_SYSTEM_PROMPT,
    prompt: `Update this chart configuration: "${description}"\n\nCurrent config:\n${document.content}`,
  });

  for await (const delta of fullStream) {
    if (delta.type === 'text-delta') {
      content += delta.textDelta;
      dataStream.writeData({
        type: 'chart-delta',
        content: delta.textDelta,
      });
    }
  }

  // Parse and send updated chart data
  try {
    const chartData = JSON.parse(content);
    
    if (chartData.data && Array.isArray(chartData.data)) {
      dataStream.writeData({
        type: 'chart-delta',
        data: chartData.data,
        chartType: chartData.chartType,
        title: chartData.title,
        xKey: chartData.xKey,
        yKey: chartData.yKey,
      });
    }
  } catch (error) {
    console.error('Failed to parse updated chart data:', error);
  }

  return content;
}
