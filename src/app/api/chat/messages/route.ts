import { NextRequest, NextResponse } from 'next/server'
import { chatPersistence } from '@/services/chat/chat-persistence'

/**
 * Handle chat messages - loading and saving
 * Updated to use simplified ChatPersistence service
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const sessionId = searchParams.get('sessionId') // Backward compatibility

    // Support both chatId and sessionId for backward compatibility
    const id = chatId || sessionId

    if (!id) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    // Load initial messages for the chat
    const messages = await chatPersistence.loadInitialMessages(id)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to load messages:', error)
    return NextResponse.json(
      { error: 'Failed to load messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json()

    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'Chat ID and message are required' },
        { status: 400 }
      )
    }

    // Persist the message
    await chatPersistence.persistMessage(chatId, message)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to persist message:', error)
    return NextResponse.json(
      { error: 'Failed to persist message' },
      { status: 500 }
    )
  }
}
