/**
 * AI SDK-aligned database types
 * These types are designed to work seamlessly with Vercel AI SDK
 */

import type { Message } from 'ai';

// Simplified Chat type (replaces ChatSession)
export interface Chat {
  id: string;
  userId: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AI SDK-aligned Message type for database storage
export interface DbMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'data';
  content: string;
  name?: string; // For tool messages
  toolCallId?: string; // For tool responses
  toolInvocations?: string; // JSON string
  experimentalAttachments?: string; // JSON string
  annotations?: string; // JSON string
  createdAt: Date;
}

// Input types for creating records
export interface CreateChat {
  id: string;
  user_id: string;
  title?: string;
}

export interface CreateDbMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_invocations?: any[];
  experimental_attachments?: any[];
  annotations?: Record<string, any>;
}

// Update types
export interface UpdateChat {
  title?: string;
  updated_at?: string;
}

// Conversion helpers between AI SDK Message and DbMessage
export function convertMessageToDb(message: Message): DbMessage {
  return {
    id: message.id,
    chatId: '', // Will be set when saving
    role: message.role,
    content: message.content,
    name: (message as any).name,
    toolCallId: (message as any).toolCallId,
    toolInvocations: message.toolInvocations ? JSON.stringify(message.toolInvocations) : undefined,
    experimentalAttachments: (message as any).experimental_attachments ? JSON.stringify((message as any).experimental_attachments) : undefined,
    annotations: message.annotations ? JSON.stringify(message.annotations) : undefined,
    createdAt: message.createdAt || new Date()
  };
}

export function convertDbToMessage(dbMessage: DbMessage): Message {
  return {
    id: dbMessage.id,
    role: dbMessage.role,
    content: dbMessage.content,
    name: dbMessage.name,
    toolCallId: dbMessage.toolCallId,
    createdAt: dbMessage.createdAt,
    toolInvocations: dbMessage.toolInvocations ? JSON.parse(dbMessage.toolInvocations) : undefined,
    annotations: dbMessage.annotations ? JSON.parse(dbMessage.annotations) : undefined,
    experimental_attachments: dbMessage.experimentalAttachments ? JSON.parse(dbMessage.experimentalAttachments) : undefined,
  } as Message;
}
