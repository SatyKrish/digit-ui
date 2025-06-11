"use client"

import { useState, useEffect } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { InitialWelcomeScreen } from "./initial-welcome-screen"
import { ArtifactPanel } from "../artifacts/artifact-panel"
import { SidebarHoverTrigger } from "../layout/sidebar-hover-trigger"
import { useSidebar } from "@/components/ui/sidebar"
import { extractArtifacts } from "@/services/artifacts/artifact-extractor"
import { useChat } from "@ai-sdk/react"
import { useChatSessions } from "@/hooks/chat"
import type { MainChatAreaProps, Artifact } from "@/types"
import type { Message } from "ai"

export function MainChatArea({ user, currentChatId, onLogout, onNewChat }: MainChatAreaProps) {
  // Always start with welcome screen when no specific chat is selected
  const [isInitialState, setIsInitialState] = useState(true)
  const [currentArtifacts, setCurrentArtifacts] = useState<Artifact[]>([])
  const { open: sidebarOpen } = useSidebar()
  
  // Use simplified session management
  const userData = { id: user.email, email: user.email, name: user.name }
  const { currentSession, switchToSession, createSession } = useChatSessions(userData)
  
  // Use Vercel AI SDK's useChat hook with current session ID
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    error,
    setMessages,
    reload,
    setInput
  } = useChat({
    id: currentChatId || undefined,
    api: '/api/chat',
    body: {
      userId: user.email
    },
    onFinish: async (message) => {
      // Auto-save session on completion
      if (currentSession?.id) {
        try {
          await fetch('/api/chat/sessions/touch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSession.id, userId: user.email })
          });
        } catch (error) {
          console.error('Failed to auto-save session:', error);
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    }
  })

  // Load messages for current session when it changes
  useEffect(() => {
    const loadMessages = async () => {
      if (currentChatId && currentSession?.id === currentChatId) {
        try {
          const response = await fetch(`/api/chat/messages?sessionId=${currentChatId}&userId=${user.email}`);
          if (response.ok) {
            const data = await response.json();
            const sessionMessages: Message[] = data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: new Date(msg.timestamp)
            }));
            setMessages(sessionMessages);
            setIsInitialState(false);
          }
        } catch (error) {
          console.error('Failed to load messages:', error);
        }
      } else if (!currentChatId) {
        // No chat ID selected - show welcome screen
        setMessages([]);
        setIsInitialState(true);
      }
    };

    loadMessages();
  }, [currentChatId, currentSession?.id, setMessages, user.email])

  // Handle session switching from parent
  useEffect(() => {
    if (currentChatId && currentSession?.id !== currentChatId) {
      switchToSession(currentChatId)
    }
  }, [currentChatId, currentSession?.id, switchToSession])

  // Handle sending message with domain hints
  const handleSendMessage = async (content: string, selectedHints: string[] = []) => {
    if (isLoading) return

    const fullContent = selectedHints.length > 0 ? `${content}\n\nDomain context: ${selectedHints.join(", ")}` : content

    // Create a form event to use with handleSubmit
    const fakeEvent = {
      preventDefault: () => {},
      target: {
        elements: {
          prompt: { value: fullContent }
        }
      }
    } as any;

    // Set the input and submit
    setInput(fullContent);
    setIsInitialState(false);
    
    // Use a slight delay to ensure input is set
    setTimeout(() => {
      handleSubmit(fakeEvent);
    }, 0);
  }

  const handleNewChat = async () => {
    try {
      const newSession = await createSession()
      setMessages([])
      setIsInitialState(true)
      setCurrentArtifacts([])
      onNewChat?.()
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }

  const handleNavigateHome = () => {
    // Navigate to welcome screen by resetting state
    setMessages([])
    setIsInitialState(true)
    setCurrentArtifacts([])
    // Call onNewChat to update the parent's currentChatId to null
    onNewChat?.()
  }

  // Update artifacts when messages change
  useEffect(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === "assistant").pop()
    if (lastAssistantMessage) {
      const artifacts = extractArtifacts(lastAssistantMessage.content)
      setCurrentArtifacts(artifacts)
    }
  }, [messages])

  // Determine if we should show the artifact panel
  const showArtifactPanel = currentArtifacts && currentArtifacts.length > 0

  return (
    <SidebarInset className="flex flex-col relative transition-all duration-300 ease-in-out">
      <SidebarHoverTrigger />
      <ChatHeader user={user} onLogout={onLogout} onNavigateHome={handleNavigateHome} />

      <div className="flex-1 flex min-h-0 transition-all duration-300 ease-in-out">
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
            showArtifactPanel ? "mr-2" : ""
          }`}
        >
          {isInitialState && !currentChatId ? (
            <InitialWelcomeScreen user={user} onSendMessage={handleSendMessage} />
          ) : (
            <>
              <ChatMessages 
                messages={messages.map(msg => ({
                  id: msg.id,
                  role: msg.role as 'user' | 'assistant' | 'system',
                  content: msg.content,
                  timestamp: msg.createdAt || new Date(),
                  model: 'gpt-4',
                  isError: false
                }))} 
                isLoading={isLoading} 
                user={user} 
              />
              <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </>
          )}
        </div>

        {showArtifactPanel && (
          <div
            className={`transition-all duration-300 ease-in-out ${
              sidebarOpen ? "w-96" : "w-[28rem]"
            }`}
          >
            <ArtifactPanel artifacts={currentArtifacts} />
          </div>
        )}
      </div>
    </SidebarInset>
  )
}
