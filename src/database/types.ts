/**
 * Database model types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model: string;
  is_error: boolean;
  created_at: string;
}

/**
 * Input types for creating new records
 */
export interface CreateUser {
  id: string;
  email: string;
  name: string;
}

export interface CreateChatSession {
  id: string;
  user_id: string;
  title: string;
}

export interface CreateChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model: string;
  is_error?: boolean;
}

/**
 * Update types
 */
export interface UpdateChatSession {
  title?: string;
  updated_at?: string;
}

/**
 * Query result types
 */
export interface SessionWithMessageCount extends ChatSession {
  message_count: number;
  last_message_at: string | null;
}

export interface SessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}
