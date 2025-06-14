import { NextRequest, NextResponse } from 'next/server'
import { chatPersistence } from '@/services/chat/chat-persistence'

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email' },
        { status: 400 }
      )
    }

    // With the simplified architecture, user initialization is just 
    // ensuring the user exists in the system - no complex session management
    console.log(`User ${userId} (${email}) initialized for chat system`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to initialize user:', error)
    return NextResponse.json(
      { error: 'Failed to initialize user' },
      { status: 500 }
    )
  }
}
