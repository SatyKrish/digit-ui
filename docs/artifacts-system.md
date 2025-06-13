# Chat SDK-Inspired Artifacts System

A complete artifacts system inspired by the Vercel Chat SDK, providing workspace-like interfaces for creating, streaming, and managing different types of content artifacts.

## 🚀 Features

### Core Features
- **Real-time Streaming**: Watch artifacts generate in real-time with live updates
- **Multiple Artifact Types**: Support for text, code, charts, visualizations, and documents
- **Workspace Interface**: Canvas-like workspace for managing multiple artifacts
- **Server-Side Streaming**: Built with React Server Components (RSC) and streaming APIs
- **Generative UI**: Dynamic UI components that adapt to content and context

### Artifact Types
1. **Text Artifacts**: Formatted text content with live editing
2. **Code Artifacts**: Syntax-highlighted code with language detection
3. **Chart Artifacts**: Data visualizations with interactive charts
4. **Visualization Artifacts**: Complex interactive visual components
5. **Document Artifacts**: Structured documentation with markdown support

### Chat SDK Patterns Implemented
- **Streaming UI**: Real-time content generation with progress indicators
- **Artifact Persistence**: Version management and content history
- **Toolbar Actions**: Contextual actions for each artifact type
- **Workspace Management**: Grid/list views with filtering and search
- **Error Handling**: Graceful error states with retry mechanisms

## 📁 Architecture

```
src/
├── lib/artifacts/
│   ├── types.ts           # Core TypeScript types and interfaces
│   └── server.ts          # Server-side document handlers and streaming logic
├── components/features/artifacts/
│   ├── artifact.tsx       # Individual artifact component
│   ├── artifact-provider.tsx  # Context provider for artifact management
│   ├── artifact-workspace.tsx # Workspace interface (Canvas-like)
│   └── index.ts          # Module exports
└── app/
    ├── api/artifacts/streaming/route.ts  # RSC streaming server actions
    └── artifacts-demo/page.tsx          # Demo page showcasing features
```

## 🛠 Usage

### Basic Artifact Creation

```tsx
import { Artifact, ArtifactProvider } from '@/components/features/artifacts'

function MyApp() {
  return (
    <ArtifactProvider>
      <Artifact
        kind="code"
        title="React Component"
        initialContent="// Generated code will appear here"
        onSaveContent={(content) => console.log('Saved:', content)}
      />
    </ArtifactProvider>
  )
}
```

### Workspace Interface

```tsx
import { ArtifactWorkspace, ArtifactProvider } from '@/components/features/artifacts'

function WorkspaceApp() {
  return (
    <ArtifactProvider>
      <div className="h-screen">
        <ArtifactWorkspace />
      </div>
    </ArtifactProvider>
  )
}
```

### Creating Custom Artifacts

```tsx
import { useArtifact } from '@/components/features/artifacts'

function CreateArtifactButton() {
  const { createArtifact } = useArtifact()
  
  const handleCreate = async () => {
    const artifact = await createArtifact({
      title: "My Custom Code",
      kind: "code",
      metadata: {
        language: "typescript",
        description: "Custom TypeScript component"
      }
    })
    
    console.log('Created:', artifact)
  }
  
  return (
    <button onClick={handleCreate}>
      Create Artifact
    </button>
  )
}
```

### Server-Side Streaming (RSC)

```tsx
import { createStreamingArtifact } from '@/app/api/artifacts/streaming/route'

// In a Server Component or Server Action
export async function generateArtifact(prompt: string) {
  const streamingUI = await createStreamingArtifact({
    title: "Generated Content",
    kind: "text",
    metadata: { prompt }
  })
  
  return streamingUI
}
```

## 🎨 Customization

### Custom Artifact Types

Create new artifact types by extending the document handler system:

```typescript
// lib/artifacts/server.ts
export const customDocumentHandler = createDocumentHandler({
  kind: "custom" as const,
  
  onCreateDocument: async ({ title, dataStream }) => {
    // Custom generation logic
    let content = ""
    
    const { fullStream } = await streamText({
      model: getLLMModel("gpt-4"),
      system: "Custom system prompt",
      prompt: title,
    })

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        content += delta.textDelta
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta
        })
      }
    }

    return content
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    // Custom update logic
  }
})
```

### Custom UI Components

Override default rendering with custom components:

```tsx
// Custom artifact preview component
function CustomArtifactPreview({ content, metadata }) {
  return (
    <div className="custom-preview">
      {/* Your custom rendering logic */}
    </div>
  )
}

// Use in Artifact component
<Artifact
  kind="custom"
  title="Custom Artifact"
  renderPreview={CustomArtifactPreview}
/>
```

### Toolbar Actions

Add custom actions to artifact toolbars:

```tsx
const customActions: ArtifactToolbarAction[] = [
  {
    icon: <CustomIcon />,
    label: "Custom Action",
    description: "Perform custom operation",
    onClick: ({ artifact, appendMessage }) => {
      // Custom action logic
      appendMessage({
        role: "user",
        content: `Process artifact: ${artifact.title}`
      })
    }
  }
]

<Artifact
  kind="code"
  title="My Code"
  actions={customActions}
/>
```

## 🎯 Best Practices

### Performance
- Use streaming for large content generation
- Implement progressive loading for workspace views
- Debounce search and filter operations
- Lazy load artifact previews

### User Experience
- Provide clear loading states during streaming
- Show progress indicators for long operations
- Implement error boundaries with retry mechanisms
- Use optimistic updates for immediate feedback

### Accessibility
- Ensure keyboard navigation support
- Provide screen reader friendly content
- Use semantic HTML elements
- Implement proper ARIA labels

### Security
- Validate all user inputs
- Sanitize generated content
- Implement proper authentication checks
- Use secure streaming endpoints

## 🔧 Configuration

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Artifact Storage (optional)
DATABASE_URL=your_database_url

# Streaming Configuration
STREAMING_TIMEOUT=30000
MAX_CONTENT_LENGTH=50000
```

### TypeScript Configuration

The system is fully typed with TypeScript. Key types include:

```typescript
// Core artifact types
type ArtifactKind = "text" | "code" | "chart" | "visualization" | "document"

interface ArtifactDocument {
  id: string
  kind: ArtifactKind
  title: string
  content: string
  metadata: ArtifactMetadata
  status: "draft" | "streaming" | "completed" | "error"
}

// Streaming types
interface StreamPart {
  type: "content-update" | "metadata-update" | "status-update" | "error"
  content?: string
  metadata?: Partial<ArtifactMetadata>
  status?: "streaming" | "completed" | "error"
}
```

## 📦 Dependencies

Key dependencies used by the artifacts system:

```json
{
  "ai": "^3.0.0",
  "@radix-ui/react-*": "^1.0.0",
  "lucide-react": "^0.400.0",
  "sonner": "^1.0.0"
}
```

## 🚀 Demo

Visit `/artifacts-demo` to see the complete system in action:

- **Workspace View**: Full Canvas-like interface
- **Individual Artifacts**: Create and manage single artifacts
- **Streaming Demo**: Watch real-time generation
- **Examples**: Pre-built artifact samples

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes following the existing patterns
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

## 🔗 Related Documentation

- [Vercel Chat SDK](https://chat-sdk.dev/docs)
- [AI SDK Documentation](https://sdk.vercel.ai)
- [React Server Components](https://react.dev/reference/react/use-server)
- [Streaming UI Patterns](https://sdk.vercel.ai/docs/concepts/streaming)

Built with ❤️ following the Vercel Chat SDK patterns and modern React best practices.
