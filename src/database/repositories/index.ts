import { UserRepository } from './user-repository';
import { SessionRepository } from './session-repository';
import { MessageRepository } from './message-repository';
import { ChatRepository } from './chat-repository';

export { UserRepository, SessionRepository, MessageRepository, ChatRepository };

// Lazy singleton instances to avoid initialization issues
let userRepositoryInstance: UserRepository | null = null;
let sessionRepositoryInstance: SessionRepository | null = null;
let messageRepositoryInstance: MessageRepository | null = null;
let chatRepositoryInstance: ChatRepository | null = null;

export function getUserRepository(): UserRepository {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    throw new Error('Repository cannot be accessed in browser environment');
  }
  
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository();
  }
  return userRepositoryInstance;
}

export function getSessionRepository(): SessionRepository {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    throw new Error('Repository cannot be accessed in browser environment');
  }
  
  if (!sessionRepositoryInstance) {
    sessionRepositoryInstance = new SessionRepository();
  }
  return sessionRepositoryInstance;
}

export function getMessageRepository(): MessageRepository {
  if (!messageRepositoryInstance) {
    messageRepositoryInstance = new MessageRepository();
  }
  return messageRepositoryInstance;
}

export function getChatRepository(): ChatRepository {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    throw new Error('Repository cannot be accessed in browser environment');
  }
  
  if (!chatRepositoryInstance) {
    chatRepositoryInstance = new ChatRepository();
  }
  return chatRepositoryInstance;
}
