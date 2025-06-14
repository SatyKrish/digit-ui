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
    
    // Transform to match the expected format for compatibility
    // Note: Gradually migrating from "sessions" to "chats" terminology
    const sessions = chats.map(chat => ({
      id: chat.id,
      userId: chat.userId,
      title: chat.title || 'New Chat',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: 0 // Computed on demand if needed
    }))

    return NextResponse.json({ sessions })
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
    const { userId, title } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create new chat using simplified persistence service
    const newChat = await chatPersistence.createChat(userId, title)
    
    // Transform to match expected format
    const session = {
      id: newChat.id,
      userId: newChat.userId,
      title: newChat.title || 'New Chat',
      createdAt: newChat.createdAt,
      updatedAt: newChat.updatedAt,
      messageCount: 0
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Failed to create chat:', error)
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, sessionId, title } = await request.json()

    if (!userId || !sessionId || !title) {
      return NextResponse.json(
        { error: 'User ID, session ID, and title are required' },
        { status: 400 }
      )
    }

    // Update chat title using simplified persistence service
    await chatPersistence.updateChatTitle(sessionId, title)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update chat title:', error)
    return NextResponse.json(
      { error: 'Failed to update chat title' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Delete chat using simplified persistence service
    await chatPersistence.deleteChat(sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    )
  }
}
