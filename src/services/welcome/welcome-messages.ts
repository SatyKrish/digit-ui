/**
 * Enterprise welcome message service
 * Provides curated, professional welcome messages with contextual variation
 */

export interface WelcomeMessage {
  title: string
  subtitle: string
  context: 'analytics' | 'exploration' | 'business' | 'insights' | 'productivity'
  timeContext?: 'morning' | 'afternoon' | 'evening' | 'any'
  tone: 'professional' | 'friendly' | 'energetic'
}

export interface WelcomeContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening'
  dayOfWeek: 'weekday' | 'weekend'
  userRole?: string
  lastActivity?: Date
}

/**
 * Curated collection of enterprise-appropriate welcome messages
 */
const welcomeMessages: WelcomeMessage[] = [
  // Analytics focused
  {
    title: "Good to see you, {firstName}!",
    subtitle: "Ready to unlock insights from your enterprise data?",
    context: 'analytics',
    timeContext: 'any',
    tone: 'professional'
  },
  {
    title: "Welcome back, {firstName}!",
    subtitle: "What data story would you like to explore today?",
    context: 'exploration',
    timeContext: 'any',
    tone: 'friendly'
  },
  {
    title: "Hello {firstName}!",
    subtitle: "I'm here to help you analyze your business metrics and trends.",
    context: 'business',
    timeContext: 'any',
    tone: 'professional'
  },

  // Time-specific messages
  {
    title: "Good morning, {firstName}!",
    subtitle: "Let's start the day with powerful data insights.",
    context: 'productivity',
    timeContext: 'morning',
    tone: 'energetic'
  },
  {
    title: "Good afternoon, {firstName}!",
    subtitle: "How can I assist with your data analysis this afternoon?",
    context: 'business',
    timeContext: 'afternoon',
    tone: 'professional'
  },
  {
    title: "Good evening, {firstName}!",
    subtitle: "Working late? I'm here to help with your data queries.",
    context: 'productivity',
    timeContext: 'evening',
    tone: 'friendly'
  },

  // Insights focused
  {
    title: "Welcome, {firstName}!",
    subtitle: "Discover actionable insights from your enterprise data ecosystem.",
    context: 'insights',
    timeContext: 'any',
    tone: 'professional'
  },
  {
    title: "Hi {firstName}!",
    subtitle: "Transform your data into strategic business intelligence.",
    context: 'business',
    timeContext: 'any',
    tone: 'professional'
  },
  {
    title: "Great to see you, {firstName}!",
    subtitle: "Let's dive into your data and uncover meaningful patterns.",
    context: 'exploration',
    timeContext: 'any',
    tone: 'friendly'
  },

  // Domain-specific variations
  {
    title: "Welcome back, {firstName}!",
    subtitle: "Ready to explore customer behavior and transaction patterns?",
    context: 'analytics',
    timeContext: 'any',
    tone: 'professional'
  },
  {
    title: "Hello {firstName}!",
    subtitle: "I can help you analyze holdings, accounts, and financial data.",
    context: 'business',
    timeContext: 'any',
    tone: 'professional'
  },
  {
    title: "Good to have you here, {firstName}!",
    subtitle: "What business intelligence can I help you discover today?",
    context: 'insights',
    timeContext: 'any',
    tone: 'friendly'
  }
]

/**
 * Get current time context
 */
function getTimeContext(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  return 'evening'
}

/**
 * Get day context
 */
function getDayContext(): 'weekday' | 'weekend' {
  const day = new Date().getDay()
  return (day === 0 || day === 6) ? 'weekend' : 'weekday'
}

/**
 * Extract user role from email (basic heuristic)
 */
function extractUserRole(email: string): string | undefined {
  const domain = email.split('@')[1]?.toLowerCase()
  const localPart = email.split('@')[0]?.toLowerCase()
  
  // Role detection based on email patterns
  if (localPart.includes('analyst') || localPart.includes('data')) return 'analyst'
  if (localPart.includes('manager') || localPart.includes('mgr')) return 'manager'
  if (localPart.includes('director') || localPart.includes('exec')) return 'executive'
  if (localPart.includes('admin')) return 'admin'
  
  return undefined
}

/**
 * Smart message selection algorithm
 */
function selectOptimalMessage(
  messages: WelcomeMessage[], 
  context: WelcomeContext,
  seed: number
): WelcomeMessage {
  // Filter messages by time context
  const timeFilteredMessages = messages.filter(msg => 
    msg.timeContext === 'any' || msg.timeContext === context.timeOfDay
  )
  
  // Prefer time-specific messages during appropriate times
  const timeSpecificMessages = timeFilteredMessages.filter(msg => 
    msg.timeContext === context.timeOfDay
  )
  
  const candidateMessages = timeSpecificMessages.length > 0 
    ? timeSpecificMessages 
    : timeFilteredMessages
  
  // Use deterministic selection based on seed for consistency within session
  const index = seed % candidateMessages.length
  return candidateMessages[index]
}

/**
 * Generate a session-stable seed for consistent message selection
 */
function generateSessionSeed(firstName: string, date: Date): number {
  const dateString = date.toDateString()
  const combined = `${firstName}-${dateString}`
  
  // Simple hash function for deterministic seed
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash)
}

/**
 * Main service function to get personalized welcome message
 */
export function getWelcomeMessage(user: { name: string; email: string }): {
  title: string
  subtitle: string
  context: string
  tone: string
} {
  const firstName = user.name.split(' ')[0]
  const now = new Date()
  
  const context: WelcomeContext = {
    timeOfDay: getTimeContext(),
    dayOfWeek: getDayContext(),
    userRole: extractUserRole(user.email)
  }
  
  // Generate consistent seed for the day to avoid message changes on refresh
  const seed = generateSessionSeed(firstName, now)
  
  // Select optimal message
  const selectedMessage = selectOptimalMessage(welcomeMessages, context, seed)
  
  // Replace firstName placeholder
  const personalizedTitle = selectedMessage.title.replace('{firstName}', firstName)
  
  return {
    title: personalizedTitle,
    subtitle: selectedMessage.subtitle,
    context: selectedMessage.context,
    tone: selectedMessage.tone
  }
}

/**
 * Get a random message for testing purposes
 */
export function getRandomWelcomeMessage(user: { name: string; email: string }): {
  title: string
  subtitle: string
  context: string
  tone: string
} {
  const firstName = user.name.split(' ')[0]
  const randomIndex = Math.floor(Math.random() * welcomeMessages.length)
  const selectedMessage = welcomeMessages[randomIndex]
  
  return {
    title: selectedMessage.title.replace('{firstName}', firstName),
    subtitle: selectedMessage.subtitle,
    context: selectedMessage.context,
    tone: selectedMessage.tone
  }
}

/**
 * Get messages by context for admin/testing
 */
export function getMessagesByContext(context: WelcomeMessage['context']): WelcomeMessage[] {
  return welcomeMessages.filter(msg => msg.context === context)
}

/**
 * Get available contexts
 */
export function getAvailableContexts(): WelcomeMessage['context'][] {
  return Array.from(new Set(welcomeMessages.map(msg => msg.context)))
}
