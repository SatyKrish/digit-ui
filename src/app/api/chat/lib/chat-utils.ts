// Chat persistence utilities
import { aiSdkChatPersistence } from "@/database/repositories"
import { generateUUID } from "@/lib/utils"
import { ValidationError } from "./types"

/**
 * Ensure user exists - simplified
 */
export async function ensureUserExists(userId: string): Promise<void> {
  try {
    await aiSdkChatPersistence.ensureUser({
      id: userId,
      email: userId.includes('@') ? userId : `${userId}@example.com`,
      name: userId.includes('@') ? userId.split('@')[0] : 'User'
    })
  } catch (error) {
    console.error(`[USER] Failed to ensure user:`, error)
    throw new ValidationError('Failed to initialize user')
  }
}

/**
 * Get or create chat - simplified
 */
export async function getOrCreateChat(chatId: string | undefined, userId: string): Promise<string> {
  if (chatId) {
    return chatId
  }
  
  try {
    const newChat = await aiSdkChatPersistence.createChat(userId)
    console.log(`[CHAT] Created new chat: ${newChat.id}`)
    return newChat.id
  } catch (error) {
    console.error(`[CHAT] Failed to create chat:`, error)
    throw new Error('Failed to create chat')
  }
}

/**
 * Save chat completion - simplified
 */
export async function saveChatCompletion(
  messages: any[], 
  chatId: string, 
  assistantText: string
): Promise<void> {
  try {
    const formattedMessages = messages.map(msg => ({
      ...msg,
      role: msg.role === 'tool' ? 'data' as const : msg.role,
      createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date()
    }))

    const assistantMessage = {
      id: generateUUID(),
      role: 'assistant' as const,
      content: assistantText,
      createdAt: new Date()
    }

    await aiSdkChatPersistence.handleMessageCompletion(
      [...formattedMessages, assistantMessage],
      chatId,
      { updateTitle: true }
    )
    
    console.log(`[PERSISTENCE] Saved messages`)
  } catch (error) {
    console.error(`[PERSISTENCE] Failed to save:`, error)
    // Don't throw - persistence errors shouldn't break the stream
  }
}
