import { NextRequest, NextResponse } from 'next/server'
import { chatPersistence } from '@/services/chat/chat-persistence'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { title } = await request.json()
    const chatId = params.chatId

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    if (title !== undefined) {
      // Update chat title using simplified persistence service
      await chatPersistence.updateChatTitle(chatId, title)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update chat:', error)
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    // Delete chat using simplified persistence service
    await chatPersistence.deleteChat(chatId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    )
  }
}
