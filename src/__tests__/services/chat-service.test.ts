import { describe, test, expect, beforeEach } from 'vitest';
import { chatService } from '@/services/chat/chat-service';

describe('ChatService', () => {
  beforeEach(() => {
    // Clear any existing sessions before each test
    chatService.clearHistory();
  });

  test('creates a new session', () => {
    const session = chatService.createSession('Test Session');
    
    expect(session).toBeDefined();
    expect(session.title).toBe('Test Session');
    expect(session.messages).toEqual([]);
    expect(session.isActive).toBe(true);
  });

  test('gets current session', () => {
    const created = chatService.createSession('Test Session');
    const current = chatService.getCurrentSession();
    
    expect(current).toEqual(created);
  });

  test('adds message to current session', () => {
    chatService.createSession('Test Session');
    
    const message = chatService.addMessage({
      role: 'user',
      content: 'Hello, world!',
      model: 'gpt-4'
    });
    
    expect(message.content).toBe('Hello, world!');
    expect(message.role).toBe('user');
    expect(message.id).toBeDefined();
    expect(message.timestamp).toBeDefined();
    
    const session = chatService.getCurrentSession();
    expect(session?.messages).toContain(message);
  });

  test('switches between sessions', () => {
    const session1 = chatService.createSession('Session 1');
    const session2 = chatService.createSession('Session 2');
    
    expect(chatService.getCurrentSession()?.id).toBe(session2.id);
    
    chatService.switchToSession(session1.id);
    expect(chatService.getCurrentSession()?.id).toBe(session1.id);
  });

  test('deletes session', () => {
    const session = chatService.createSession('Test Session');
    const sessionId = session.id;
    
    const success = chatService.deleteSession(sessionId);
    expect(success).toBe(true);
    
    const allSessions = chatService.getAllSessions();
    expect(allSessions.find(s => s.id === sessionId)).toBeUndefined();
  });

  test('updates session title', () => {
    const session = chatService.createSession('Original Title');
    
    const success = chatService.updateSessionTitle(session.id, 'Updated Title');
    expect(success).toBe(true);
    
    const updatedSession = chatService.getCurrentSession();
    expect(updatedSession?.title).toBe('Updated Title');
  });
});
