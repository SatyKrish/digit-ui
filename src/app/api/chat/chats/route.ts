import { NextRequest, NextResponse } from 'next/server'
import { chatPersistence } from '@/services/chat/chat-persistence'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get chats using the simplified persistence service
    const chats = await chatPersistence.getUserChats(userId)
    
    return NextResponse.json({ chats })
  } catch (error) {
    console.error('Failed to get chats:', error)
    return NextResponse.json(
      { error: 'Failed to get chats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, visibility = 'private' } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create new chat using simplified persistence service
    const newChat = await chatPersistence.createChat(userId, title || 'New Chat')
    
    // Add visibility support (Phase 2 enhancement)
    const chatWithVisibility = {
      ...newChat,
      visibility,
      shared: false
    }
    
    return NextResponse.json(chatWithVisibility)
  } catch (error) {
    console.error('Failed to create chat:', error)
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}
