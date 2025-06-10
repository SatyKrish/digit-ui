/**
 * Chat application configuration
 */

export const chatConfig = {
  // Message limits
  maxMessageLength: 4000,
  maxMessagesPerChat: 100,
  
  // UI Configuration
  typingIndicatorDelay: 1000,
  messageAnimationDuration: 300,
  
  // Artifact settings
  maxArtifactsPerMessage: 10,
  supportedArtifactTypes: [
    'markdown',
    'code', 
    'mermaid',
    'chart',
    'table',
    'visualization',
    'heatmap',
    'treemap',
    'geospatial'
  ] as const,

  // Auto-save settings
  autoSaveInterval: 30000, // 30 seconds
  
  // Rate limiting
  messagesPerMinute: 30,
  
  // Features
  enableArtifactPanel: true,
  enableDomainHints: true,
  enableChatHistory: true,
} as const
