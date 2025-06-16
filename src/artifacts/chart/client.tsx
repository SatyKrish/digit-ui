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

// Simplified and more robust chart content component
function ChartArtifactContent({ content, metadata }: ArtifactContent<ChartArtifactMetadata>) {
  // Helper function to extract chart data from any source
  const extractChartData = (): ChartArtifactMetadata | null => {
    // Try metadata first (most reliable during streaming)
    if (metadata?.data && Array.isArray(metadata.data) && metadata.data.length > 0) {
      console.log('[CHART] Using metadata data:', metadata.data.length, 'items');
      return {
        chartType: metadata.chartType || 'bar',
        title: metadata.title || 'Chart',
        xKey: metadata.xKey,
        yKey: metadata.yKey,
        data: metadata.data
      };
    }

    // Try parsing content as fallback
    if (content?.trim()) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
          console.log('[CHART] Using parsed content data:', parsed.data.length, 'items');
          return {
            chartType: parsed.chartType || detectChartType(parsed, metadata?.title) || 'bar',
            title: parsed.title || metadata?.title || 'Chart',
            xKey: parsed.xKey,
            yKey: parsed.yKey,
            data: parsed.data
          };
        }
      } catch (error) {
        console.warn('[CHART] Failed to parse content:', error);
      }
    }

    return null;
  };

  const chartData = extractChartData();

  // Show chart if we have valid data
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

  // Show loading state
  return (
    <div className="p-8 text-center text-muted-foreground">
      <ChartIcon className="mx-auto h-12 w-12 mb-4 animate-pulse" />
      <p className="text-lg font-medium">Generating chart...</p>
      <p className="text-sm mt-2">Analyzing data and creating visualization</p>
    </div>
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
    // Handle text streaming (content updates)
    if (streamPart.type === 'text-delta') {
      setArtifact((prev) => {
        const newContent = prev.content + (streamPart.content as string || '');
        
        // Try to parse and update metadata if we have complete JSON
        const trimmedContent = newContent.trim();
        if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmedContent);
            if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
              // Update metadata with parsed data
              const validChartType = parsed.chartType === 'bar' || parsed.chartType === 'line' || 
                                     parsed.chartType === 'pie' || parsed.chartType === 'area' 
                                     ? parsed.chartType : 'bar';
              
              setMetadata({
                chartType: validChartType,
                title: parsed.title || 'Chart',
                xKey: parsed.xKey,
                yKey: parsed.yKey,
                data: parsed.data
              });
            }
          } catch {
            // Ignore parsing errors during streaming
          }
        }
        
        return {
          ...prev,
          content: newContent,
        };
      });
    }
    
    // Handle direct chart data streaming (preferred method)
    if (streamPart.type === 'chart-delta') {
      // Update metadata directly with streamed chart data
      const validChartType = streamPart.chartType === 'bar' || streamPart.chartType === 'line' || 
                             streamPart.chartType === 'pie' || streamPart.chartType === 'area' 
                             ? streamPart.chartType : 'bar';
      
      setMetadata({
        chartType: validChartType,
        title: streamPart.title || 'Chart',
        xKey: streamPart.xKey,
        yKey: streamPart.yKey,
        data: streamPart.data || []
      });
      
      // Also update content if provided
      if (streamPart.content) {
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
