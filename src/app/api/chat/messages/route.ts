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

    const message = await chatService.sendMessage(content, model)
    return NextResponse.json({ message })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
