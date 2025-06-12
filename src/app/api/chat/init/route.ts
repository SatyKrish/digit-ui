import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat/chat-service'

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email' },
        { status: 400 }
      )
    }

    await chatService.initializeForUser({
      id: userId,
      email,
      name: name || 'User'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to initialize user:', error)
    return NextResponse.json(
      { error: 'Failed to initialize user' },
      { status: 500 }
    )
  }
}
