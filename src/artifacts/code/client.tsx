import { Artifact } from '@/lib/artifacts/create-artifact';
import { ArtifactContent } from '@/lib/artifacts/types';
import { CodeEditor } from '@/components/ui/code-editor';
import {
  Play as PlayIcon,
  Copy as CopyIcon,
  MessageSquare as MessageIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FileText as LogsIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import {
  Console,
  type ConsoleOutput,
  type ConsoleOutputContent,
} from '@/components/ui/console';

// Basic output handlers for code execution
const OUTPUT_HANDLERS = {
  matplotlib: `
    import io
    import base64
    from matplotlib import pyplot as plt

    def setup_matplotlib_output():
        def custom_show():
            png_buf = io.BytesIO()
            plt.savefig(png_buf, format='png')
            png_buf.seek(0)
            png_base64 = base64.b64encode(png_buf.read()).decode('utf-8')
            print(f'data:image/png;base64,{png_base64}')
            png_buf.close()
            plt.clf()
            plt.close('all')
        plt.show = custom_show
  `,
  basic: `
    # Basic output capture setup
  `,
};

function detectRequiredHandlers(code: string): string[] {
  const handlers: string[] = [];
  if (code.includes('matplotlib') || code.includes('plt.')) {
    handlers.push('matplotlib');
  }
  return handlers;
}

interface CodeMetadata {
  outputs: Array<ConsoleOutput>;
}

// Define the content component separately, following Vercel pattern
function CodeArtifactContent(props: ArtifactContent<CodeMetadata>) {
  const { metadata, setMetadata, status, ...restProps } = props;
  
  return (
    <>
      <div className="px-1">
        <CodeEditor {...restProps} status={status === 'completed' ? 'idle' : status} />
      </div>

      {metadata?.outputs && (
        <Console
          consoleOutputs={metadata.outputs}
          setConsoleOutputs={() => {
            setMetadata({
              ...metadata,
              outputs: [],
            });
          }}
        />
      )}
    </>
  );
}

export const codeArtifact = new Artifact<'code', CodeMetadata>({
  kind: 'code',
  description: 'Useful for code generation; Code execution is available for supported languages.',
  
  initialize: async ({ setMetadata }) => {
    setMetadata({
      outputs: [],
    });
  },
  
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'code-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible:
          draftArtifact.status === 'streaming' &&
          draftArtifact.content.length > 300 &&
          draftArtifact.content.length < 310
            ? true
            : draftArtifact.isVisible,
        status: 'streaming',
      }));
    }
  },
  
  // Use the component reference, not an inline function
  content: CodeArtifactContent,
  
  actions: [
    {
      icon: <PlayIcon size={18} />,
      description: 'Execute code',
      onClick: async ({ content, setMetadata, callMCPTool }) => {
        const runId = generateUUID();
        const outputContent: Array<ConsoleOutputContent> = [];

        setMetadata((metadata) => ({
          ...metadata,
          outputs: [
            ...metadata.outputs,
            {
              id: runId,
              contents: [],
              status: 'in_progress',
            },
          ],
        }));

        try {
          // Try MCP code execution first
          const mcpResult = await callMCPTool('execute_code', {
            code: content,
            language: 'python', // Detect language
          });

          if (mcpResult?.success) {
            setMetadata((metadata) => ({
              ...metadata,
              outputs: [
                ...metadata.outputs.filter((output) => output.id !== runId),
                {
                  id: runId,
                  contents: mcpResult.data.outputs || [{ type: 'result', content: mcpResult.data.result }],
                  status: 'completed',
                },
              ],
            }));
            return;
          }
        } catch (error) {
          console.warn('MCP code execution failed, trying local execution:', error);
        }

        // Fallback to browser execution for supported languages
        try {
          if (content.includes('python') || content.includes('import ')) {
            // Basic Python execution simulation
            setMetadata((metadata) => ({
              ...metadata,
              outputs: [
                ...metadata.outputs.filter((output) => output.id !== runId),
                {
                  id: runId,
                  contents: [{ type: 'error', content: 'Python execution requires server-side support or MCP integration.' }],
                  status: 'completed',
                },
              ],
            }));
          } else {
            // JavaScript execution
            const result = eval(content);
            outputContent.push({
              type: 'result',
              content: String(result),
            });

            setMetadata((metadata) => ({
              ...metadata,
              outputs: [
                ...metadata.outputs.filter((output) => output.id !== runId),
                {
                  id: runId,
                  contents: outputContent,
                  status: 'completed',
                },
              ],
            }));
          }
        } catch (error: any) {
          setMetadata((metadata) => ({
            ...metadata,
            outputs: [
              ...metadata.outputs.filter((output) => output.id !== runId),
              {
                id: runId,
                contents: [{ type: 'error', content: error.message }],
                status: 'error',
              },
            ],
          }));
        }
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy code to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
  ],
  
  toolbar: [
    {
      icon: <MessageIcon />,
      description: 'Add comments',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Add comments to the code snippet for understanding',
        });
      },
    },
    {
      icon: <LogsIcon />,
      description: 'Add logs',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Add logs to the code snippet for debugging',
        });
      },
    },
  ],
});
