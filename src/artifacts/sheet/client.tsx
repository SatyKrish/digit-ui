import { Artifact } from '@/lib/artifacts/create-artifact';
import {
  Copy as CopyIcon,
  TrendingUp as LineChartIcon,
  Redo as RedoIcon,
  Sparkles as SparklesIcon,
  Undo as UndoIcon,
} from 'lucide-react';
import { SpreadsheetEditor } from '@/components/ui/spreadsheet-editor';
import { parse, unparse } from 'papaparse';
import { toast } from 'sonner';

type SheetMetadata = any;

export const sheetArtifact = new Artifact<'sheet', SheetMetadata>({
  kind: 'sheet',
  description: 'Useful for working with spreadsheets and tabular data',
  
  initialize: async () => {},
  
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type === 'sheet-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  
  content: ({
    content,
    currentVersionIndex,
    isCurrentVersion,
    onSaveContent,
    status,
  }) => {
    return (
      <SpreadsheetEditor
        content={content}
        currentVersionIndex={currentVersionIndex}
        isCurrentVersion={isCurrentVersion}
        onSaveContent={onSaveContent}
        status={status}
      />
    );
  },
  
  actions: [
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
      icon: <CopyIcon />,
      description: 'Copy as .csv',
      onClick: ({ content }) => {
        const parsed = parse<string[]>(content, { skipEmptyLines: true });

        const nonEmptyRows = parsed.data.filter((row: any[]) =>
          row.some((cell: any) => cell.trim() !== ''),
        );

        const cleanedCsv = unparse(nonEmptyRows);

        navigator.clipboard.writeText(cleanedCsv);
        toast.success('Copied csv to clipboard!');
      },
    },
  ],
  
  toolbar: [
    {
      description: 'Format and clean data',
      icon: <SparklesIcon />,
      onClick: ({ appendMessage, callMCPTool }) => {
        // Try MCP tool first
        callMCPTool('format_spreadsheet', { data: '' })
          .then(result => {
            if (result?.success) {
              // Handle MCP result
            } else {
              appendMessage({
                role: 'user',
                content: 'Can you please format and clean the data?',
              });
            }
          })
          .catch(() => {
            appendMessage({
              role: 'user',
              content: 'Can you please format and clean the data?',
            });
          });
      },
    },
    {
      description: 'Analyze and visualize data',
      icon: <LineChartIcon />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content:
            'Can you please analyze and visualize the data by creating a new code artifact in python?',
        });
      },
    },
  ],
});
