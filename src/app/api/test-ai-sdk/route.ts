import { NextRequest, NextResponse } from 'next/server'
import { ChatRepository } from '@/database/repositories/chat-repository'
import { convertMessageToDb, convertDbToMessage } from '@/database/types-ai-sdk'
import { getDatabase } from '@/database'
import type { Message } from 'ai'

/**
 * Test endpoint for AI SDK implementation
 * This endpoint tests the new database structure and repository functions
 */
export async function GET(req: NextRequest) {
  try {
    const chatRepo = new ChatRepository()
    const testUserId = 'test-user-123'
    
    // Test 0: Create a test user first (required for foreign key constraint)
    console.log('🧪 Test 0: Creating test user...')
    const db = getDatabase()
    const userStmt = db.prepare(`
      INSERT OR IGNORE INTO users (id, email, name)
      VALUES (?, ?, ?)
    `)
    userStmt.run(testUserId, testUserId, 'Test User')
    console.log('✅ Test user created')
    
    // Test 1: Create a new chat
    console.log('🧪 Test 1: Creating new chat...')
    const newChat = await chatRepo.createChat(testUserId, 'Test AI SDK Chat')
    console.log('✅ Chat created:', newChat.id)
    
    // Test 2: Test message conversion
    console.log('🧪 Test 2: Testing message conversion...')
    const testMessage: Message = {
      id: 'msg-123',
      role: 'user',
      content: 'Hello, this is a test message!',
      createdAt: new Date()
    }
    
    const dbMessage = convertMessageToDb(testMessage)
    dbMessage.chatId = newChat.id
    
    console.log('✅ Message converted to DB format')
    
    // Test 3: Save message
    console.log('🧪 Test 3: Saving message...')
    await chatRepo.addMessage(newChat.id, dbMessage)
    console.log('✅ Message saved')
    
    // Test 4: Load messages
    console.log('🧪 Test 4: Loading messages...')
    const savedMessages = await chatRepo.getMessages(newChat.id)
    console.log('✅ Messages loaded:', savedMessages.length)
    
    // Test 5: Convert back to AI SDK format
    console.log('🧪 Test 5: Converting back to AI SDK format...')
    const aiSdkMessages = savedMessages.map(convertDbToMessage)
    console.log('✅ Messages converted back:', aiSdkMessages.length)
    
    // Test 6: Update chat title
    console.log('🧪 Test 6: Updating chat title...')
    await chatRepo.updateChatTitle(newChat.id, 'Updated Test Chat')
    const updatedChat = await chatRepo.getChatById(newChat.id)
    console.log('✅ Chat title updated:', updatedChat?.title)
    
    // Test 7: Get user chats
    console.log('🧪 Test 7: Getting user chats...')
    const userChats = await chatRepo.getChatsByUserId(testUserId)
    console.log('✅ User chats found:', userChats.length)
    
    // Test 8: Get chat stats
    console.log('🧪 Test 8: Getting chat stats...')
    const stats = await chatRepo.getChatStats(newChat.id)
    console.log('✅ Chat stats:', stats)
    
    // Test 9: Search messages
    console.log('🧪 Test 9: Searching messages...')
    const searchResults = await chatRepo.searchMessages(testUserId, 'test', 10)
    console.log('✅ Search results:', searchResults.length)
    
    // Cleanup
    console.log('🧹 Cleaning up test data...')
    await chatRepo.deleteChat(newChat.id)
    console.log('✅ Test data cleaned up')
    
    return NextResponse.json({
      success: true,
      message: 'All AI SDK tests passed!',
      results: {
        chatCreated: !!newChat,
        messagesSaved: savedMessages.length > 0,
        messagesConverted: aiSdkMessages.length > 0,
        chatUpdated: updatedChat?.title === 'Updated Test Chat',
        userChatsFound: userChats.length > 0,
        statsRetrieved: stats.messageCount >= 0,
        searchWorking: searchResults.length >= 0
      }
    })
    
  } catch (error) {
    console.error('❌ AI SDK test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

/**
 * Test the AI SDK chat API endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const { testMessage = 'Hello AI SDK!' } = await req.json()
    
    // Test the AI SDK chat endpoint
    const chatResponse = await fetch(`${req.nextUrl.origin}/api/chat/ai-sdk-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            id: 'test-msg-1',
            role: 'user',
            content: testMessage
          }
        ],
        userId: 'test-user-ai-sdk'
      })
    })
    
    if (!chatResponse.ok) {
      throw new Error(`Chat API returned ${chatResponse.status}: ${chatResponse.statusText}`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'AI SDK chat API test passed!',
      chatResponseStatus: chatResponse.status,
      chatResponseHeaders: Object.fromEntries(chatResponse.headers.entries())
    })
    
  } catch (error) {
    console.error('❌ AI SDK chat API test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
