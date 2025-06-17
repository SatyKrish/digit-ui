import { NextRequest, NextResponse } from 'next/server'
import { chatPersistence } from '@/services/chat/chat-persistence'

/**
 * Clear all chats for a user
 * POST /api/chat/chats/clear
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get all user chats and delete them
    const userChats = await chatPersistence.getUserChats(userId)
    let deletedCount = 0

    for (const chat of userChats) {
      await chatPersistence.deleteChat(chat.id)
      deletedCount++
    }

    return NextResponse.json({
      message: `Cleared ${deletedCount} chats`,
      deletedCount
    })

  } catch (error) {
    console.error('Error clearing chats:', error)
    return NextResponse.json(
      { error: 'Failed to clear chats' },
      { status: 500 }
    )
  }
}
