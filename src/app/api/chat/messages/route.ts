import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat/chat-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      )
    }

    // Initialize chat service for user
    await chatService.initializeForUser({
      id: userId,
      email: userId,
      name: 'User'
    })

    const messages = await chatService.getSessionMessages(sessionId)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to get messages:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, content, model = 'gpt-4' } = await request.json()

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      )
    }

    // Initialize chat service for user
    await chatService.initializeForUser({
      id: userId,
      email: userId,
      name: 'User'
    })

    // Get current session messages to build context
    const currentSession = await chatService.getCurrentSession()
    let messages: Array<{ role: string; content: string }> = []
    
    if (currentSession) {
      const sessionMessages = await chatService.getSessionMessages(currentSession.id)
      messages = sessionMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }

    // Add the new user message
    messages.push({
      role: 'user',
      content: content
    })

    // Call the MCP-enabled chat API
    const chatResponse = await fetch(`${request.nextUrl.origin}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages
      })
    })

    if (!chatResponse.ok) {
      throw new Error(`Chat API error: ${chatResponse.status}`)
    }

    // Handle streaming response from the MCP chat API
    const reader = chatResponse.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    let assistantResponse = ''
    const decoder = new TextDecoder()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const data = JSON.parse(line.slice(2))
              if (data.type === 'text-delta' && data.textDelta) {
                assistantResponse += data.textDelta
              }
            } catch (e) {
              // Ignore parsing errors for now
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    // Store the conversation in the database
    const userMessage = await chatService.addMessage({
      role: 'user',
      content,
      model: model
    })

    const assistantMessage = await chatService.addMessage({
      role: 'assistant',
      content: assistantResponse || 'I apologize, but I encountered an issue processing your request.',
      model: model
    })

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
