# Enhanced Artifacts System

## Overview

The enhanced artifacts system provides a modern, visually appealing interface for displaying interactive content generated from AI conversations. Built following Vercel AI SDK best practices, it features smooth animations, progressive loading states, and an intuitive user experience.

## Features

### 🎨 Visual Enhancements
- **Modern Design**: Gradient backgrounds, soft shadows, and smooth animations
- **Theme Support**: Full light/dark theme compatibility with enhanced color schemes
- **Responsive Layout**: Optimized for different screen sizes and sidebar states
- **Interactive Elements**: Hover effects, tooltips, and micro-interactions

### 🚀 Performance & UX
- **Progressive Loading**: Smooth streaming with skeleton states following AI SDK patterns
- **Error Handling**: Comprehensive error states with retry mechanisms
- **Export Functionality**: CSV/JSON export for tables and charts
- **Search & Filter**: Advanced filtering capabilities for table data

### 📊 Visualization Types
- **Charts**: Enhanced with statistics, custom color palettes, and export options
- **Tables**: Advanced search, pagination, and formatting options
- **Heatmaps**: Multiple color schemes and intensity controls
- **KPI Dashboards**: Progress trackers and trend indicators
- **Custom Visualizations**: Extensible component system

## Components

### ArtifactPanel
Main container for displaying artifacts with enhanced features:

```tsx
<ArtifactPanel 
  artifacts={artifacts}
  isPinned={false}
  isExpanded={false}
  onPin={(pinned) => setPinned(pinned)}
  onExpand={(expanded) => setExpanded(expanded)}
/>
```

**Features:**
- Expandable/pinnable interface
- Tab navigation for multiple artifacts
- Enhanced empty state with particles
- Smooth animations and transitions

### ArtifactRenderer
Core rendering component with theme-aware styling:

```tsx
<ArtifactRenderer 
  artifact={artifact}
  theme={theme}
  onError={(error) => handleError(error)}
/>
```

**Features:**
- Loading states with skeleton UI
- Error boundaries with retry functionality
- Enhanced headers with icons and descriptions
- Tooltip support for interactive elements

### StreamableArtifact
Vercel AI SDK compatible streaming component:

```tsx
<StreamableArtifact 
  artifact={artifact}
  isStreaming={true}
  onComplete={(artifact) => setArtifact(artifact)}
/>
```

**Features:**
- Progressive loading with streaming support
- Smooth transitions between loading and content states
- Error handling with retry mechanisms
- Compatible with `createStreamableUI`

## Usage Examples

### Basic Implementation

```tsx
import { ArtifactPanel } from '@/components/features/artifacts/artifact-panel'
import { extractArtifacts } from '@/services/artifacts/artifact-extractor'

function ChatArea() {
  const [artifacts, setArtifacts] = useState([])
  
  const handleMessageComplete = (message) => {
    const extracted = extractArtifacts(message.content)
    setArtifacts(extracted)
  }
  
  return (
    <div className="flex">
      <div className="flex-1">
        {/* Chat content */}
      </div>
      {artifacts.length > 0 && (
        <ArtifactPanel artifacts={artifacts} />
      )}
    </div>
  )
}
```

### With Vercel AI SDK

```tsx
import { useChat } from '@ai-sdk/react'
import { StreamableArtifact } from '@/components/features/artifacts/streamable-artifact'

function EnhancedChat() {
  const [currentArtifacts, setCurrentArtifacts] = useState([])
  const [isGeneratingArtifacts, setIsGeneratingArtifacts] = useState(false)
  
  const { messages, isLoading } = useChat({
    onFinish: (message) => {
      setIsGeneratingArtifacts(true)
      
      // Simulate processing time for better UX
      setTimeout(() => {
        const artifacts = extractArtifacts(message.content)
        setCurrentArtifacts(artifacts)
        setIsGeneratingArtifacts(false)
      }, 800)
    }
  })
  
  return (
    <div className="flex">
      <div className="flex-1">
        {/* Chat messages */}
      </div>
      
      {(currentArtifacts.length > 0 || isGeneratingArtifacts) && (
        <div className="w-96">
          {isGeneratingArtifacts ? (
            <StreamableArtifact artifact={null} isStreaming={true} />
          ) : (
            <ArtifactPanel artifacts={currentArtifacts} />
          )}
        </div>
      )}
    </div>
  )
}
```

### Custom Visualization

```tsx
import { ArtifactRenderer } from '@/components/features/artifacts/artifact-renderer'

function CustomChart({ data }) {
  const artifact = {
    id: 'custom-chart',
    type: 'chart',
    title: 'Sales Performance',
    content: {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Monthly Sales' }
        }
      }
    }
  }
  
  return (
    <ArtifactRenderer 
      artifact={artifact}
      theme="light"
      showStats={true}
      exportable={true}
    />
  )
}
```

## Styling & Theming

### CSS Variables
The system uses CSS custom properties for consistent theming:

```css
:root {
  --artifact-bg: hsl(var(--background));
  --artifact-border: hsl(var(--border));
  --artifact-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --artifact-radius: 12px;
}

.dark {
  --artifact-shadow: 0 4px 6px -1px rgb(255 255 255 / 0.1);
}
```

### Animation Classes
Pre-defined animations for smooth transitions:

```css
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-scale-in { animation: scaleIn 0.3s ease-out; }
.animate-slide-in-up { animation: slideInUp 0.4s ease-out; }
.animate-stagger-1 { animation-delay: 0.1s; }
.animate-stagger-2 { animation-delay: 0.2s; }
```

## Best Practices

### 1. Progressive Enhancement
Always provide loading states and graceful fallbacks:

```tsx
{isGeneratingArtifacts ? (
  <StreamableArtifact artifact={null} isStreaming={true} />
) : artifacts.length > 0 ? (
  <ArtifactPanel artifacts={artifacts} />
) : (
  <EmptyState />
)}
```

### 2. Error Handling
Implement comprehensive error boundaries:

```tsx
<ArtifactRenderer 
  artifact={artifact}
  onError={(error) => {
    console.error('Artifact error:', error)
    toast.error('Failed to render artifact')
  }}
/>
```

### 3. Performance Optimization
Use memo and lazy loading for complex visualizations:

```tsx
const LazyChartArtifact = lazy(() => import('./chart-artifact'))

const MemoizedArtifact = memo(({ artifact }) => (
  <Suspense fallback={<SkeletonLoader />}>
    <LazyChartArtifact artifact={artifact} />
  </Suspense>
))
```

### 4. Accessibility
Ensure proper ARIA labels and keyboard navigation:

```tsx
<div 
  role="region" 
  aria-label={`Artifact: ${artifact.title}`}
  tabIndex={0}
>
  <ArtifactRenderer artifact={artifact} />
</div>
```

## API Reference

### Artifact Type Definition

```typescript
interface Artifact {
  id: string
  type: 'chart' | 'table' | 'visualization' | 'heatmap' | 'custom'
  title: string
  description?: string
  content: any
  metadata?: {
    createdAt: Date
    updatedAt: Date
    version: string
  }
}
```

### ArtifactPanel Props

```typescript
interface ArtifactPanelProps {
  artifacts: Artifact[]
  isPinned?: boolean
  isExpanded?: boolean
  onPin?: (pinned: boolean) => void
  onExpand?: (expanded: boolean) => void
  className?: string
}
```

### ArtifactRenderer Props

```typescript
interface ArtifactRendererProps {
  artifact: Artifact
  theme?: 'light' | 'dark'
  showStats?: boolean
  exportable?: boolean
  onError?: (error: Error) => void
  className?: string
}
```

## Migration Guide

### From Basic to Enhanced

1. **Update imports:**
```tsx
// Before
import { ArtifactPanel } from './artifact-panel'

// After
import { ArtifactPanel } from '@/components/features/artifacts/artifact-panel'
```

2. **Add enhanced props:**
```tsx
// Before
<ArtifactPanel artifacts={artifacts} />

// After
<ArtifactPanel 
  artifacts={artifacts}
  isPinned={isPinned}
  isExpanded={isExpanded}
  onPin={setIsPinned}
  onExpand={setIsExpanded}
/>
```

3. **Implement streaming states:**
```tsx
// Add loading states for better UX
{isGeneratingArtifacts && (
  <StreamableArtifact artifact={null} isStreaming={true} />
)}
```

### Breaking Changes

- `ArtifactPanel` now requires explicit pin/expand state management
- `ArtifactRenderer` theme prop is now optional (auto-detects)
- Export functionality requires additional chart.js plugins

## Troubleshooting

### Common Issues

1. **Artifacts not rendering:**
   - Check artifact type is supported
   - Verify content structure matches expected format
   - Ensure proper error handling is implemented

2. **Animations not working:**
   - Verify CSS animations are loaded in globals.css
   - Check for conflicting CSS that might override animations
   - Ensure components have proper className structure

3. **Export functionality failing:**
   - Install required dependencies: `chart.js`, `chartjs-adapter-date-fns`
   - Check browser support for download APIs
   - Verify data format is compatible with export functions

### Debug Mode

Enable debug mode for detailed logging:

```tsx
<ArtifactRenderer 
  artifact={artifact}
  debug={process.env.NODE_ENV === 'development'}
/>
```

## Contributing

When adding new artifact types:

1. Create component in `src/components/features/artifacts/visualizations/`
2. Add type definition to `src/types/artifacts.ts`
3. Update `ArtifactRenderer` switch statement
4. Add tests in `__tests__/artifacts/`
5. Update documentation

## Support

For issues and feature requests, please use the project's issue tracker.
