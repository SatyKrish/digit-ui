# Development Demo Routes

This directory contains demo pages and development-only tools that are not included in production builds.

## Available Demos

### `/demo` - Artifacts Demo
The artifacts demo showcases the capabilities of the Digit Chat SDK artifacts system, including:

- **Workspace View**: A complete workspace for managing artifacts (similar to ChatGPT Canvas)
- **Individual Artifacts**: Test creating specific artifact types with custom content
- **Streaming Demo**: Watch artifacts generate in real-time
- **Examples**: Pre-built examples of different artifact types

#### Features Demonstrated:
- Real-time streaming artifacts
- Multiple artifact types (text, code, documents, charts, visualizations)
- Interactive workspace interface
- Chat SDK integration patterns

#### Access:
- **Development**: Available at `/demo`
- **Production**: Shows "Demo page not available in production" message

## Environment Protection

All demo pages include environment protection to ensure they're only accessible during development:

```typescript
if (process.env.NODE_ENV === 'production') {
  return (
    <div className="container mx-auto py-8 text-center">
      <h1 className="text-2xl font-bold text-muted-foreground">
        Demo page not available in production
      </h1>
    </div>
  )
}
```

## Adding New Demos

To add a new demo page:

1. Create a new directory: `/src/app/demo/[demo-name]/`
2. Add a `page.tsx` file with environment protection
3. Include development-only badge: `<Badge variant="outline">Development Only</Badge>`
4. Update this README

## Purpose

These demos serve as:
- Development testing tools
- Feature showcases for stakeholders  
- Integration testing environments
- Documentation examples

They are automatically excluded from production builds while remaining available for development and testing purposes.
