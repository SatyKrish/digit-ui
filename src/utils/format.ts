/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (!d || isNaN(d.getTime())) {
    return 'Invalid date'
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  })
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (!d || isNaN(d.getTime())) {
    return 'Unknown date'
  }
  
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return formatDate(d)
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Generate user initials from name
 */
export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Alias for backward compatibility
export const getInitials = generateInitials

/**
 * Time period for grouping chats
 */
export type TimePeriod = 'today' | 'yesterday' | 'last-week' | 'last-month' | 'older'

/**
 * Group chat sessions by time period
 */
export function getTimePeriod(date: string | Date): TimePeriod {
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (!d || isNaN(d.getTime())) {
    return 'older' // Default to 'older' for invalid dates
  }
  
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'today'
  if (diffInDays === 1) return 'yesterday'
  if (diffInDays <= 7) return 'last-week'
  if (diffInDays <= 30) return 'last-month'
  return 'older'
}

/**
 * Get display label for time period
 */
export function getTimePeriodLabel(period: TimePeriod): string {
  switch (period) {
    case 'today': return 'Today'
    case 'yesterday': return 'Yesterday'
    case 'last-week': return 'Last 7 days'
    case 'last-month': return 'Last 30 days'
    case 'older': return 'Older'
  }
}

/**
 * Generate a meaningful chat title from the first user message content
 */
export function generateChatTitle(content: string): string {
  // Clean the content
  const cleaned = content.trim()
  
  // If the content is too short, use a fallback
  if (cleaned.length < 5) {
    return `Chat ${new Date().toLocaleDateString()}`
  }
  
  // Extract the first sentence or meaningful part
  let title = cleaned.split(/[.!?]\s+/)[0]
  
  // If first sentence is too short, take more content
  if (title.length < 20 && cleaned.length > title.length) {
    title = cleaned.substring(0, 50).trim()
  }
  
  // Truncate if too long
  if (title.length > 50) {
    title = title.substring(0, 47).trim() + '...'
  }
  
  // Clean up and capitalize first letter
  title = title.replace(/^\s*[-•*]\s*/, '') // Remove bullet points
  title = title.charAt(0).toUpperCase() + title.slice(1)
  
  return title
}

/**
 * Extract topic keywords from content for better titles
 */
export function generateTopicBasedTitle(content: string): string {
  const cleaned = content.toLowerCase().trim()
  
  // Common patterns to identify topics
  const patterns = [
    { regex: /(?:how to|how do i|how can i|explain how)\s+(.{10,40})/i, prefix: 'How to ' },
    { regex: /(?:what is|what are|what's)\s+(.{5,40})/i, prefix: 'About ' },
    { regex: /(?:create|build|make|develop)\s+(.{5,40})/i, prefix: 'Creating ' },
    { regex: /(?:fix|solve|debug|troubleshoot)\s+(.{5,40})/i, prefix: 'Fixing ' },
    { regex: /(?:explain|tell me about|describe)\s+(.{5,40})/i, prefix: '' },
    { regex: /(?:help with|help me)\s+(.{5,40})/i, prefix: 'Help with ' },
    { regex: /(?:code|programming|script|function)\s+(.{5,40})/i, prefix: 'Code: ' },
  ]
  
  for (const pattern of patterns) {
    const match = content.match(pattern.regex)
    if (match && match[1]) {
      let topic = match[1].trim()
      // Clean up the topic
      topic = topic.replace(/[.!?].*$/, '') // Remove everything after punctuation
      topic = topic.split(' ').slice(0, 6).join(' ') // Take first 6 words max
      
      if (topic.length > 3) {
        return pattern.prefix + topic.charAt(0).toUpperCase() + topic.slice(1)
      }
    }
  }
  
  // Fallback to regular title generation
  return generateChatTitle(content)
}
