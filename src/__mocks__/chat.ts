import { ChatMessage, ChatSession } from '@/types/chat';

export const mockChatMessage: ChatMessage = {
  id: 'msg-1',
  role: 'user',
  content: 'Hello, how are you?',
  timestamp: new Date('2024-01-01T10:00:00Z'),
  model: 'gpt-4'
};

export const mockAssistantMessage: ChatMessage = {
  id: 'msg-2',
  role: 'assistant',
  content: 'Hello! I\'m doing well, thank you for asking.',
  timestamp: new Date('2024-01-01T10:00:30Z'),
  model: 'gpt-4'
};

export const mockChatSession: ChatSession = {
  id: 'session-1',
  title: 'Test Chat Session',
  messages: [mockChatMessage, mockAssistantMessage],
  createdAt: new Date('2024-01-01T09:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:30Z'),
  isActive: true
};

export const mockChatSessions: ChatSession[] = [
  mockChatSession,
  {
    id: 'session-2',
    title: 'Another Chat Session',
    messages: [],
    createdAt: new Date('2024-01-02T09:00:00Z'),
    updatedAt: new Date('2024-01-02T09:00:00Z'),
    isActive: false
  }
];
