'use server'

import { createStreamableUI } from 'ai/rsc'
import React from 'react'

// Server action for streaming artifacts (following AI SDK RSC patterns)
export async function streamArtifact(type: string, data: any) {
  const ui = createStreamableUI()
  
  // Start with loading state
  ui.update(
    React.createElement('div', { className: 'flex items-center justify-center p-8' },
      React.createElement('div', { className: 'flex items-center gap-3' },
        React.createElement('div', { 
          className: 'w-6 h-6 border-2 border-primary/60 border-t-primary rounded-full animate-spin' 
        }),
        React.createElement('span', { className: 'text-sm text-muted-foreground' }, 
          `Processing ${type}...`
        )
      )
    )
  )
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Update with actual content
  ui.done(
    React.createElement('div', { className: 'p-4 border rounded-lg bg-background' },
      React.createElement('h3', { className: 'font-semibold mb-2' }, 
        `Generated ${type}`
      ),
      React.createElement('pre', { className: 'text-sm bg-muted p-2 rounded overflow-auto' },
        JSON.stringify(data, null, 2)
      )
    )
  )
  
  return ui.value
}

// Server action for processing artifact data
export async function processArtifactData(artifactContent: string) {
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 500))
  
  try {
    // Parse and validate artifact content
    const parsed = JSON.parse(artifactContent)
    return { success: true, data: parsed }
  } catch (error) {
    return { success: false, error: 'Invalid artifact format' }
  }
}
