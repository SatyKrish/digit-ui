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
  messageCount?: number;
  lastMessageAt?: Date;
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
  createdAt: Date | string; // Accept both Date and string for flexibility
  parts?: string; // JSON string for AI SDK v4+ parts
  reasoning?: string; // For reasoning traces
  finishReason?: string; // AI completion finish reason
  usageStats?: string; // JSON object for token usage
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
  // Handle createdAt - it could be a Date, string, or undefined
  let createdAt: Date | string;
  if (message.createdAt) {
    // If it's already a Date object, keep it
    if (message.createdAt instanceof Date) {
      createdAt = message.createdAt;
    } else {
      // If it's a string or number, convert to Date
      createdAt = new Date(message.createdAt);
    }
  } else {
    // If no createdAt provided, use current time
    createdAt = new Date();
  }

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
    createdAt,
    // AI SDK v4+ fields
    parts: (message as any).parts ? JSON.stringify((message as any).parts) : undefined,
    reasoning: (message as any).reasoning,
    finishReason: (message as any).finishReason,
    usageStats: (message as any).usage ? JSON.stringify((message as any).usage) : undefined,
  };
}

export function convertDbToMessage(dbMessage: DbMessage): Message {
  // Ensure createdAt is a Date object for AI SDK
  const createdAt = dbMessage.createdAt instanceof Date 
    ? dbMessage.createdAt 
    : new Date(dbMessage.createdAt);

  const baseMessage: any = {
    id: dbMessage.id,
    role: dbMessage.role,
    content: dbMessage.content,
    createdAt,
  };

  // Add optional fields only if they exist
  if (dbMessage.name) baseMessage.name = dbMessage.name;
  if (dbMessage.toolCallId) baseMessage.toolCallId = dbMessage.toolCallId;
  if (dbMessage.toolInvocations) baseMessage.toolInvocations = JSON.parse(dbMessage.toolInvocations);
  if (dbMessage.annotations) baseMessage.annotations = JSON.parse(dbMessage.annotations);
  if (dbMessage.experimentalAttachments) baseMessage.experimental_attachments = JSON.parse(dbMessage.experimentalAttachments);
  
  // AI SDK v4+ fields
  if (dbMessage.parts) baseMessage.parts = JSON.parse(dbMessage.parts);
  if (dbMessage.reasoning) baseMessage.reasoning = dbMessage.reasoning;
  if (dbMessage.finishReason) baseMessage.finishReason = dbMessage.finishReason;
  if (dbMessage.usageStats) baseMessage.usage = JSON.parse(dbMessage.usageStats);

  return baseMessage as Message;
}
