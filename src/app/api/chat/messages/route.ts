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

// Remove the old POST endpoint since we now use /api/chat directly with useChat
// This simplifies the architecture and leverages the AI SDK's built-in streaming
