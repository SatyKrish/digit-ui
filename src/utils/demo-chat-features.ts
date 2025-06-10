import { generateTopicBasedTitle, generateChatTitle, getTimePeriod, getTimePeriodLabel } from '@/utils/format'
import type { TimePeriod } from '@/types/chat'

/**
 * Demo chat messages for testing title generation
 */
export const demoMessages = [
  "How to create a REST API with Node.js and Express",
  "What is React and how does it work?",
  "Fix error 'Cannot read property of undefined' in JavaScript", 
  "Help me understand TypeScript interfaces",
  "Create a responsive navbar component",
  "Explain the difference between SQL and NoSQL databases",
  "Debug my Python function that's not working correctly",
  "Build a todo app with React hooks",
  "Hello, can you help me?",
  "What's the weather like today?",
  "Code a simple calculator in JavaScript",
  "How do I deploy to AWS?",
  "Troubleshoot Docker container issues",
  "Make a beautiful CSS animation",
  "Tell me about machine learning algorithms"
]

/**
 * Test title generation with various inputs
 */
export function testTitleGeneration() {
  console.log("🎯 Testing Chat Title Generation")
  console.log("=".repeat(50))
  
  demoMessages.forEach((message, index) => {
    const topicTitle = generateTopicBasedTitle(message)
    const regularTitle = generateChatTitle(message)
    
    console.log(`\n${index + 1}. Input: "${message}"`)
    console.log(`   Topic-based: "${topicTitle}"`)
    console.log(`   Regular: "${regularTitle}"`)
  })
}

/**
 * Demo time period grouping
 */
export function testTimeGrouping() {
  console.log("\n\n📅 Testing Time Period Grouping")
  console.log("=".repeat(50))
  
  const testDates = [
    new Date(), // Today
    new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
  ]
  
  testDates.forEach((date, index) => {
    const period = getTimePeriod(date)
    const label = getTimePeriodLabel(period)
    
    console.log(`\n${index + 1}. Date: ${date.toLocaleDateString()}`)
    console.log(`   Period: ${period}`)
    console.log(`   Label: "${label}"`)
  })
}

/**
 * Demo grouping logic with sample sessions
 */
export function demoGroupedSessions() {
  console.log("\n\n📋 Demo Grouped Sessions")
  console.log("=".repeat(50))
  
  // Create sample sessions with different dates
  const sessions = demoMessages.map((message, index) => {
    const daysAgo = Math.floor(Math.random() * 60) // Random date in last 60 days
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    
    return {
      id: `session-${index}`,
      title: generateTopicBasedTitle(message),
      timestamp: date.toISOString(),
      updatedAt: date,
      messageCount: Math.floor(Math.random() * 20) + 1
    }
  })
  
  // Group sessions by time period
  const grouped: Record<TimePeriod, typeof sessions> = {
    'today': [],
    'yesterday': [],
    'last-week': [],
    'last-month': [],
    'older': []
  }
  
  sessions.forEach(session => {
    const period = getTimePeriod(session.updatedAt!)
    grouped[period].push(session)
  })
  
  // Display grouped results
  Object.entries(grouped).forEach(([period, periodSessions]) => {
    if (periodSessions.length > 0) {
      const label = getTimePeriodLabel(period as TimePeriod)
      console.log(`\n📂 ${label} (${periodSessions.length} sessions):`)
      periodSessions
        .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime())
        .slice(0, 3) // Show only first 3 for demo
        .forEach(session => {
          console.log(`   • ${session.title} (${session.messageCount} messages)`)
        })
    }
  })
}

/**
 * Run all demos
 */
export function runChatFeatureDemo() {
  console.clear()
  console.log("🚀 Chat Features Demo")
  console.log("====================")
  
  testTitleGeneration()
  testTimeGrouping()
  demoGroupedSessions()
  
  console.log("\n\n✅ Demo completed! Check the browser console for output.")
}

// Export for testing in browser console or development
if (typeof window !== 'undefined') {
  (window as any).runChatFeatureDemo = runChatFeatureDemo
  (window as any).testTitleGeneration = testTitleGeneration
  (window as any).testTimeGrouping = testTimeGrouping
  (window as any).demoGroupedSessions = demoGroupedSessions
}
