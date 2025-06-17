import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistance } from 'date-fns';
import useSWR, { useSWRConfig } from 'swr';
import { useDebounceCallback, useWindowSize } from 'usehooks-ts';
import type { 
  ArtifactDocument, 
  UIArtifact, 
  StreamPart,
  ArtifactKind 
} from '@/lib/artifacts/types';
import { fetcher } from '@/lib/utils';

// Import artifact definitions following Vercel pattern
import { textArtifact } from '@/artifacts/text/client';
import { codeArtifact } from '@/artifacts/code/client';
import { imageArtifact } from '@/artifacts/image/client';
import { sheetArtifact } from '@/artifacts/sheet/client';
import { chartArtifact } from '@/artifacts/chart/client';
import { visualizationArtifact } from '@/artifacts/visualization/client';
import { documentArtifact } from '@/artifacts/document/client';

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
  chartArtifact,
  visualizationArtifact,
  documentArtifact,
];

export type ArtifactDefinition = typeof artifactDefinitions[number];

// Initial artifact data (following Vercel pattern)
export const initialArtifactData: UIArtifact = {
  documentId: 'init',
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};

interface ArtifactWorkspaceProps {
  artifact: UIArtifact;
  setArtifact: (updater: UIArtifact | ((current: UIArtifact) => UIArtifact)) => void;
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  status: 'idle' | 'loading' | 'streaming';
  stop: () => void;
  attachments: Array<any>;
  setAttachments: (attachments: Array<any>) => void;
  messages: Array<any>;
  setMessages: (messages: Array<any>) => void;
  reload: () => void;
  votes: Array<any> | undefined;
  append: (message: any) => void;
  isReadonly: boolean;
  selectedVisibilityType: 'public' | 'private';
}

export function ArtifactWorkspace({
  artifact,
  setArtifact,
  chatId,
  input,
  setInput,
  handleSubmit,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  reload,
  votes,
  append,
  isReadonly,
  selectedVisibilityType,
}: ArtifactWorkspaceProps) {
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const [metadata, setMetadata] = useState<any>({});
  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const [isContentDirty, setIsContentDirty] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [isMobile] = useState(false); // Detect mobile if needed

  // Document management following Vercel pattern
  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Array<ArtifactDocument>>(
    artifact.documentId !== 'init' && artifact.status !== 'streaming'
      ? `/api/document?id=${artifact.documentId}`
      : null,
    fetcher,
  );

  const [document, setDocument] = useState<ArtifactDocument | null>(null);
  const { mutate } = useSWRConfig();

  // Content change handler with debouncing
  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact) return;

      mutate<Array<ArtifactDocument>>(
        `/api/document?id=${artifact.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${artifact.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: artifact.title,
                content: updatedContent,
                kind: artifact.kind,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false },
      );
    },
    [artifact, mutate],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce?: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }
    // Add other version handling logic
  };

  // Initialize artifact when document changes
  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? '',
        }));
      }
    }
  }, [documents, setArtifact]);

  useEffect(() => {
    mutateDocuments();
  }, [artifact.status, mutateDocuments]);

  // Get artifact definition
  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    // Return a simple fallback display for unsupported artifact types
    console.warn(`Artifact definition not found for kind: ${artifact.kind}. Showing fallback display.`);
    return (
      <div className="p-8 text-center">
        <div className="mb-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <div className="mb-2 text-sm text-yellow-800">
            <strong>Unsupported artifact type:</strong> {artifact.kind}
          </div>
          <div className="text-xs text-yellow-600">
            This artifact type is not yet supported in the Vercel workspace.
          </div>
        </div>
        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold mb-2">{artifact.title}</h3>
          <div className="text-left bg-gray-50 p-4 rounded border overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap text-sm">{artifact.content}</pre>
          </div>
        </div>
      </div>
    );
  }

  // Initialize artifact
  useEffect(() => {
    if (artifact.documentId !== 'init') {
      if (artifactDefinition.initialize) {
        artifactDefinition.initialize({
          documentId: artifact.documentId,
          setMetadata,
        });
      }
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  const isCurrentVersion = currentVersionIndex === (documents?.length || 0) - 1;

  return (
    <AnimatePresence>
      {artifact.isVisible && (
        <motion.div
          data-testid="artifact"
          className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {/* Chat Area */}
          {!isMobile && (
            <motion.div
              className="fixed bg-background h-dvh"
              initial={{
                width: windowWidth ? Math.floor(windowWidth * 0.35) : 'calc(35dvw)', // Chat takes 35%
              }}
              animate={{
                width: windowWidth ? Math.floor(windowWidth * 0.35) : 'calc(35dvw)', // Chat takes 35%
              }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 30,
              }}
            >
              {/* Chat messages and input would go here */}
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Messages */}
                  {messages.map((message, index) => (
                    <div key={index} className="mb-4">
                      {/* Render message */}
                    </div>
                  ))}
                </div>
                
                {/* Input form */}
                <form onSubmit={handleSubmit} className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 p-2 border rounded"
                    />
                    <button type="submit" disabled={status === 'loading'}>
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Artifact Panel */}
          <motion.div
            className="fixed dark:bg-muted bg-background h-dvh flex flex-col overflow-y-scroll md:border-l dark:border-zinc-700 border-zinc-200"
            initial={
              isMobile
                ? {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
                : {
                    opacity: 1,
                    x: windowWidth ? Math.floor(windowWidth * 0.35) : 'calc(35dvw)', // Start at 35% (chat area)
                    y: 0,
                    height: windowHeight || '100dvh',
                    width: windowWidth ? Math.floor(windowWidth * 0.65) : 'calc(65dvw)', // Take 65% for artifacts
                    borderRadius: 0,
                  }
            }
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : 'calc(100dvw)',
                    borderRadius: 0,
                  }
                : {
                    opacity: 1,
                    x: windowWidth ? Math.floor(windowWidth * 0.35) : 'calc(35dvw)', // Position at 35% (after chat area)
                    y: 0,
                    height: windowHeight || '100dvh',
                    width: windowWidth ? Math.floor(windowWidth * 0.65) : 'calc(65dvw)', // Take 65% for artifacts
                    borderRadius: 0,
                  }
            }
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 30,
            }}
          >
            {/* Artifact Header */}
            <div className="flex-shrink-0 border-b dark:border-zinc-700 border-zinc-200 bg-background/95 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setArtifact((prev) => ({ ...prev, isVisible: false }))}
                    className="rounded-full p-2 hover:bg-muted"
                  >
                    ✕
                  </button>

                  <div className="flex flex-col">
                    <div className="font-medium">{artifact.title}</div>

                    {isContentDirty ? (
                      <div className="text-sm text-muted-foreground">
                        Saving changes...
                      </div>
                    ) : document ? (
                      <div className="text-sm text-muted-foreground">
                        {`Updated ${formatDistance(
                          new Date(document.metadata.createdAt),
                          new Date(),
                          {
                            addSuffix: true,
                          },
                        )}`}
                      </div>
                    ) : (
                      <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Artifact Actions */}
                <div className="flex items-center gap-2">
                  {artifactDefinition.actions?.map((action, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        action.onClick({
                          content: artifact.content,
                          handleVersionChange,
                          currentVersionIndex,
                          isCurrentVersion,
                          mode,
                          metadata,
                          setMetadata,
                          appendMessage: append,
                          callMCPTool: async (toolName: string, args: any) => {
                            // MCP tool integration
                            return { success: false };
                          },
                        })
                      }
                      disabled={action.isDisabled?.({
                        content: artifact.content,
                        handleVersionChange,
                        currentVersionIndex,
                        isCurrentVersion,
                        mode,
                        metadata,
                        setMetadata,
                      })}
                      className="p-2 rounded hover:bg-muted"
                      title={action.description}
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Artifact Content */}
            <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center">
              <artifactDefinition.content
                title={artifact.title}
                content={isCurrentVersion
                  ? artifact.content
                  : getDocumentContentById(currentVersionIndex)}
                mode={mode}
                status={artifact.status}
                currentVersionIndex={currentVersionIndex}
                suggestions={[]}
                onSaveContent={saveContent}
                isInline={false}
                isCurrentVersion={isCurrentVersion}
                getDocumentContentById={getDocumentContentById}
                isLoading={isDocumentsFetching && !artifact.content}
                metadata={metadata}
                setMetadata={setMetadata}
              />

              {/* Toolbar */}
              <AnimatePresence>
                {isCurrentVersion && artifactDefinition.toolbar && (
                  <div className="fixed bottom-4 right-4">
                    <div className="flex gap-2">
                      {artifactDefinition.toolbar.map((toolbarItem, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            toolbarItem.onClick({
                              // ArtifactActionContext properties
                              content: artifact.content,
                              handleVersionChange,
                              currentVersionIndex,
                              isCurrentVersion,
                              mode,
                              metadata,
                              setMetadata,
                              // ArtifactToolbarContext properties
                              appendMessage: append,
                              callMCPTool: async (toolName: string, args: any) => {
                                // MCP tool integration
                                return { success: false };
                              },
                            })
                          }
                          className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90"
                          title={toolbarItem.description}
                        >
                          {toolbarItem.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
