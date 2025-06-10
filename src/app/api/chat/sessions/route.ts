import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat/chat-service'

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

    // Initialize chat service for user
    await chatService.initializeForUser({
      id: userId,
      email: userId, // Using userId as email for now
      name: 'User' // Default name
    })

    const sessions = await chatService.getAllSessions()
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

    // Initialize chat service for user
    await chatService.initializeForUser({
      id: userId,
      email: userId,
      name: 'User'
    })

    const session = await chatService.createSession(title)
    return NextResponse.json({ session })
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
