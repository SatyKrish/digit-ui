import { NextRequest, NextResponse } from 'next/server'
import { chatPersistence } from '@/services/chat/chat-persistence'

/**
 * Clear all chats for a user
 * This endpoint provides bulk deletion functionality
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
      try {
        await chatPersistence.deleteChat(chat.id)
        deletedCount++
      } catch (error) {
        console.error(`Failed to delete chat ${chat.id}:`, error)
        // Continue with other chats even if one fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount,
      message: `Cleared ${deletedCount} chat${deletedCount !== 1 ? 's' : ''}`
    })
  } catch (error) {
    console.error('Failed to clear chats:', error)
    return NextResponse.json(
      { error: 'Failed to clear chats' },
      { status: 500 }
    )
  }
}
