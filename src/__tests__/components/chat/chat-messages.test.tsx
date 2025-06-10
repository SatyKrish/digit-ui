import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessages } from '@/components/features/chat/chat-messages';
import { ChatMessage } from '@/types/chat';

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    model: 'gpt-4'
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Hello! I\'m doing well, thank you for asking. How can I help you today?',
    timestamp: new Date('2024-01-01T10:00:30Z'),
    model: 'gpt-4'
  }
];

describe('ChatMessages', () => {
  test('renders chat messages correctly', () => {
    render(<ChatMessages messages={mockMessages} />);
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText(/Hello! I\'m doing well/)).toBeInTheDocument();
  });

  test('displays user and assistant messages with correct styling', () => {
    render(<ChatMessages messages={mockMessages} />);
    
    const userMessage = screen.getByText('Hello, how are you?').closest('[data-role="user"]');
    const assistantMessage = screen.getByText(/Hello! I\'m doing well/).closest('[data-role="assistant"]');
    
    expect(userMessage).toBeInTheDocument();
    expect(assistantMessage).toBeInTheDocument();
  });

  test('renders empty state when no messages', () => {
    render(<ChatMessages messages={[]} />);
    
    // Should render empty messages container
    const messagesContainer = screen.getByTestId('chat-messages');
    expect(messagesContainer).toBeInTheDocument();
    expect(messagesContainer).toBeEmptyDOMElement();
  });
});
