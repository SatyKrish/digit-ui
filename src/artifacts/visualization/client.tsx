import { Artifact } from '@/lib/artifacts/create-artifact';
import type { ArtifactContent } from '@/lib/artifacts/types';

interface VisualizationMetadata {
  type?: string;
  interactive?: boolean;
}

function VisualizationContent(props: ArtifactContent<VisualizationMetadata>) {
  const { content, status } = props;

  return (
    <div className="w-full h-full min-h-[400px] p-4">
      <div className="border rounded-lg p-4 bg-muted/5">
        <h3 className="font-semibold mb-2">Visualization</h3>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm">{content}</pre>
        </div>
      </div>
    </div>
  );
}

export const visualizationArtifact = new Artifact<'visualization', VisualizationMetadata>({
  kind: 'visualization',
  description: 'Interactive data visualizations',
  content: VisualizationContent,
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'visualization-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        status: 'streaming',
      }));
    } else if (streamPart.type === 'status-update' && streamPart.status === 'completed') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        status: 'completed',
      }));
    }
  },
});
