import { NextRequest, NextResponse } from 'next/server'
import { aiSdkChatService } from '@/services/chat/ai-sdk-chat-service'

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

    // Get chats using the new AI SDK service
    const chats = await aiSdkChatService.getUserChats(userId)
    
    // Transform to match the expected format for compatibility
    const sessions = chats.map(chat => ({
      id: chat.id,
      userId: chat.userId,
      title: chat.title || 'New Chat',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: 0 // Will be populated if needed
    }))

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Failed to get sessions:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions' },
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

    // Create new chat using AI SDK service
    const newChat = await aiSdkChatService.createChat(userId, title)
    
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
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
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

    // Delete chat using AI SDK service
    await aiSdkChatService.deleteChat(sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
