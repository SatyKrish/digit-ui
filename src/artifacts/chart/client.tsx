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
function ChartArtifactContent(props: ArtifactContent<ChartArtifactMetadata>) {
  const { content, metadata, setMetadata } = props;
  
  // Use useEffect to avoid setState during render
  React.useEffect(() => {
    if (!metadata?.data || metadata.data.length === 0) {
      // Try to parse chart data from content if metadata is empty
      try {
        const parsed = JSON.parse(content);
        if (parsed.data && Array.isArray(parsed.data)) {
          const chartData: ChartArtifactMetadata = {
            chartType: (parsed.chartType as ChartArtifactMetadata['chartType']) || 'bar',
            title: parsed.title || 'Chart',
            xKey: parsed.xKey || 'x',
            yKey: parsed.yKey || 'y',
            data: parsed.data,
          };
          setMetadata(chartData);
        }
      } catch (error) {
        // If parsing fails, ignore and show empty state
        console.warn('Failed to parse chart data:', error);
      }
    }
  }, [content, metadata?.data, setMetadata]);

  if (!metadata?.data || metadata.data.length === 0) {
    // Show loading/empty state while metadata is being set
    return (
      <div className="p-4 text-center text-muted-foreground">
        <ChartIcon className="mx-auto h-8 w-8 mb-2" />
        <p>Loading chart data...</p>
      </div>
    );
  }

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

export const chartArtifact = new Artifact<'chart', ChartArtifactMetadata>({
  kind: 'chart',
  description: 'Useful for creating interactive charts and data visualizations.',
  
  initialize: async ({ documentId, setMetadata }) => {
    // Initialize with default chart configuration
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
        content: prev.content + streamPart.textDelta,
      }));
    }
    
    if (streamPart.type === 'chart-delta') {
      // Handle streaming chart data updates
      setMetadata((prev) => ({
        ...prev,
        data: streamPart.data || prev.data,
        chartType: (streamPart.chartType as ChartArtifactMetadata['chartType']) || prev.chartType,
        title: streamPart.title || prev.title,
        xKey: streamPart.xKey || prev.xKey,
        yKey: streamPart.yKey || prev.yKey,
      }));
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
