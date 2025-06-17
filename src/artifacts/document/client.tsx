import { Artifact } from '@/lib/artifacts/create-artifact';
import type { ArtifactContent } from '@/lib/artifacts/types';

interface DocumentMetadata {
  type?: string;
  sections?: string[];
}

function DocumentContent(props: ArtifactContent<DocumentMetadata>) {
  const { content, status } = props;

  return (
    <div className="w-full h-full p-4">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-sm max-w-none">
          <div 
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: content.replace(/\n/g, '<br>') 
            }} 
          />
        </div>
      </div>
    </div>
  );
}

export const documentArtifact = new Artifact<'document', DocumentMetadata>({
  kind: 'document',
  description: 'Structured documentation and guides',
  content: DocumentContent,
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'document-delta') {
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
