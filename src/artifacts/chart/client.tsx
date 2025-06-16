import React from 'react';
import { Artifact } from '@/lib/artifacts/create-artifact';
import { ArtifactContent, ArtifactActionContext, ArtifactToolbarContext } from '@/lib/artifacts/types';
import { ChartArtifact } from '@/components/features/artifacts/visualizations/chart-artifact';
import { 
  Copy as CopyIcon,
  Download as DownloadIcon,
  MessageSquare as MessageIcon,
  BarChart3 as ChartIcon,
  RefreshCw as RefreshIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Simple utility to detect pie chart intent
function detectChartType(parsed: any, originalTitle?: string): ChartArtifactMetadata['chartType'] {
  // Use explicit chartType if provided
  if (parsed.chartType) {
    return parsed.chartType as ChartArtifactMetadata['chartType'];
  }
  
  // Check titles for pie chart keywords
  const titles = [parsed.title, originalTitle].filter(Boolean);
  const pieKeywords = ['pie', 'distribution', 'breakdown', 'composition', 'percentage', 'share'];
  
  for (const title of titles) {
    if (title && pieKeywords.some(keyword => title.toLowerCase().includes(keyword))) {
      return 'pie';
    }
  }
  
  // Simple data structure check: 2 fields + small dataset = likely pie chart
  if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0 && parsed.data.length <= 10) {
    const firstItem = parsed.data[0];
    const keys = Object.keys(firstItem || {});
    
    if (keys.length === 2) {
      const textKey = keys.find(key => typeof firstItem[key] !== 'number');
      if (textKey && ['country', 'category', 'region'].some(hint => textKey.toLowerCase().includes(hint))) {
        return 'pie';
      }
    }
  }
  
  // Default to bar chart
  return 'bar';
}

interface ChartData {
  [key: string]: any;
}

interface ChartMetadata {
  chartType: 'bar' | 'line' | 'pie' | 'area';
  title?: string;
  xKey?: string;
  yKey?: string;
  data: ChartData[];
}

interface ChartArtifactMetadata {
  chartType: 'bar' | 'line' | 'pie' | 'area';
  title?: string;
  xKey?: string;
  yKey?: string;
  data: ChartData[];
}

// Define the content component separately, following Vercel pattern
function ChartArtifactContent({ content, metadata }: ArtifactContent<ChartArtifactMetadata>) {
  // Priority 1: Use metadata if available (preferred for performance)
  if (metadata && metadata.data && Array.isArray(metadata.data) && metadata.data.length > 0) {
    return (
      <ChartArtifact
        data={metadata.data}
        chartType={metadata.chartType}
        title={metadata.title}
        xKey={metadata.xKey}
        yKey={metadata.yKey}
      />
    );
  }

  // Priority 2: Try to parse content as fallback
  let chartData: ChartArtifactMetadata | null = null;
  let parseError: string | null = null;
  
  if (content && content.trim()) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
        // Auto-detect chart type if missing - pass both parsed title and original metadata title
        let detectedChartType = detectChartType(parsed, metadata?.title);
        
        chartData = {
          chartType: detectedChartType,
          title: parsed.title || 'Chart',
          xKey: parsed.xKey || 'x',
          yKey: parsed.yKey || 'y',
          data: parsed.data,
        };
      } else {
        parseError = 'Invalid chart data structure: missing or empty data array';
      }
    } catch (error) {
      parseError = `Failed to parse chart configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Priority 3: Show parsed data if successful
  if (chartData) {
    return (
      <ChartArtifact
        data={chartData.data}
        chartType={chartData.chartType}
        title={chartData.title}
        xKey={chartData.xKey}
        yKey={chartData.yKey}
      />
    );
  }

  // Priority 4: Show error state if parsing failed and we have content
  if (parseError && content && content.trim()) {
    return (
      <div className="p-4 text-center space-y-2">
        <ChartIcon className="mx-auto h-8 w-8 mb-2 text-red-500" />
        <p className="text-red-600 font-medium">Chart Error</p>
        <p className="text-sm text-muted-foreground">{parseError}</p>
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer hover:text-foreground">Show raw content</summary>
          <pre className="mt-1 bg-muted p-2 rounded text-left max-h-32 overflow-auto">
            {content}
          </pre>
        </details>
      </div>
    );
  }

  // Priority 5: Show loading state when no content or data yet
  // This handles the initial loading state before any data arrives
  const hasEmptyMetadata = metadata && (!metadata.data || metadata.data.length === 0);
  const hasNoContent = !content || content.trim() === '';
  
  if (hasNoContent && hasEmptyMetadata) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <ChartIcon className="mx-auto h-8 w-8 mb-2 animate-pulse" />
        <p>Loading chart data...</p>
      </div>
    );
  }

  // Priority 6: Fallback - try to render empty chart with proper message
  return (
    <ChartArtifact
      data={[]}
      chartType="bar"
      title="Chart"
    />
  );
}

export const chartArtifact = new Artifact<'chart', ChartArtifactMetadata>({
  kind: 'chart',
  description: 'Useful for creating interactive charts and data visualizations.',
  
  initialize: async ({ documentId, setMetadata }) => {
    // Initialize with empty chart configuration - real data will be loaded via streaming
    setMetadata({
      chartType: 'bar',
      title: 'Chart',
      xKey: 'x',
      yKey: 'y',
      data: [],
    });
  },
  
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'text-delta') {
      setArtifact((prev) => ({
        ...prev,
        content: prev.content + (streamPart.content as string || ''),
      }));
      // Don't clear metadata.data unnecessarily - let the component handle parsing
      // This improves performance by reducing unnecessary re-renders
    }
    
    if (streamPart.type === 'chart-delta') {
      console.log('Chart delta received:', streamPart); // Debug log
      
      // Handle streaming chart data updates directly via metadata
      setMetadata((prev) => ({
        ...prev,
        data: streamPart.data || prev.data,
        chartType: (streamPart.chartType as ChartArtifactMetadata['chartType']) || 
                  // Use the same detection logic for streaming updates
                  detectChartType({
                    chartType: streamPart.chartType,
                    title: streamPart.title || prev.title,
                    data: streamPart.data || prev.data
                  }, prev.title), // Pass original title for better detection
        title: streamPart.title || prev.title,
        xKey: streamPart.xKey || prev.xKey,
        yKey: streamPart.yKey || prev.yKey,
      }));
      
      // Also update content if this is a content stream
      if (streamPart.content && !streamPart.data) {
        setArtifact((prev) => ({
          ...prev,
          content: prev.content + streamPart.content,
        }));
      }
    }
  },

  // Use the component reference, not an inline function
  content: ChartArtifactContent,

  actions: [
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy chart data to clipboard',
      onClick: async ({ content, metadata }: ArtifactActionContext<ChartArtifactMetadata>) => {
        try {
          const chartData = {
            chartType: metadata?.chartType || 'bar',
            title: metadata?.title || 'Chart',
            data: metadata?.data || [],
            xKey: metadata?.xKey,
            yKey: metadata?.yKey,
          };
          await navigator.clipboard.writeText(JSON.stringify(chartData, null, 2));
          toast.success('Chart data copied to clipboard');
        } catch (error) {
          toast.error('Failed to copy chart data');
        }
      },
    },
    {
      icon: <DownloadIcon size={18} />,
      description: 'Download as JSON',
      onClick: async ({ content, metadata }: ArtifactActionContext<ChartArtifactMetadata>) => {
        try {
          const chartData = {
            chartType: metadata?.chartType || 'bar',
            title: metadata?.title || 'Chart',
            data: metadata?.data || [],
            xKey: metadata?.xKey,
            yKey: metadata?.yKey,
          };
          
          const blob = new Blob([JSON.stringify(chartData, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${metadata?.title || 'chart'}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success('Chart data downloaded');
        } catch (error) {
          toast.error('Failed to download chart data');
        }
      },
    },
  ],
  
  toolbar: [
    {
      icon: <MessageIcon />,
      description: 'Ask about this chart',
      onClick: ({ appendMessage }: ArtifactActionContext<ChartArtifactMetadata> & ArtifactToolbarContext) => {
        appendMessage({
          role: 'user',
          content: 'Can you help me understand this chart and provide insights about the data?',
        });
      },
    },
  ],
});
