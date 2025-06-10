import { UserRepository } from './user-repository';
import { SessionRepository } from './session-repository';
import { MessageRepository } from './message-repository';

export { UserRepository, SessionRepository, MessageRepository };

// Lazy singleton instances to avoid initialization issues
let userRepositoryInstance: UserRepository | null = null;
let sessionRepositoryInstance: SessionRepository | null = null;
let messageRepositoryInstance: MessageRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository();
  }
  return userRepositoryInstance;
}

export function getSessionRepository(): SessionRepository {
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
