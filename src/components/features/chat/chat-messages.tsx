"use client"

import { memo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { hasArtifacts, countArtifacts } from "@/services/artifacts/artifact-extractor"
import { getThemeAwareAvatar } from "@/utils/theme"
import { generateInitials } from "@/utils/format"
import { MarkdownRenderer } from "@/components/shared/markdown-renderer"
import { useScrollToBottom } from "@/hooks/shared/use-scroll-to-bottom"
import { useStreamingOptimization } from "@/hooks/shared/use-streaming-optimization"
import type { ChatMessage } from "@/types/chat"
import type { ChatMessagesProps } from "@/types/chat"

// Memoized individual message component for better performance
const ChatMessageItem = memo(({ message, user, index, isStreaming = false, onReopenArtifacts }: { 
  message: ChatMessage; 
  user?: { name: string; avatar?: string }; 
  index: number;
  isStreaming?: boolean;
  onReopenArtifacts?: (messageContent: string) => void;
}) => {
  const { theme } = useTheme()
  const userInitials = generateInitials(user?.name || "User")

  return (
    <div 
      className={`flex gap-4 ${
        // Reduce animations during streaming to prevent flickering
        isStreaming && message.role === "assistant" && index === 0 
          ? "opacity-100" 
          : `animate-slide-in-up animate-stagger-${Math.min(index % 4 + 1, 4)}`
      } ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
      style={{
        // Ensure stable positioning during streaming
        transform: isStreaming && message.role === "assistant" && index === 0 ? 'none' : undefined
      }}
    >
      {message.role === "assistant" && (
        <Avatar className="message-avatar h-10 w-10 shrink-0 ring-2 ring-primary/20 shadow-soft hover:shadow-medium transition-all duration-200">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">D</AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[80%] space-y-3 ${message.role === "user" ? "order-first" : ""}`}>
        <div
          className={`message-bubble rounded-lg px-5 py-4 transition-all duration-200 ${
            isStreaming ? 'streaming' : ''
          } ${
            // Reduce hover effects during streaming to prevent flickering
            isStreaming 
              ? "shadow-soft" 
              : "shadow-soft hover:shadow-medium"
          } ${
            message.role === "user"
              ? "bg-primary text-primary-foreground ml-auto hover:bg-primary/90"
              : "bg-muted/50 dark:bg-muted/20 border border-border/50 hover:border-border/80"
          }`}
        >
          <div className="message-content">
            {message.role === "assistant" ? (
              <div className={isStreaming ? 'streaming' : ''}>
                <MarkdownRenderer 
                  content={message.content} 
                  className="text-sm leading-[1.7] prose-headings:text-foreground prose-headings:font-semibold prose-headings:leading-tight prose-p:text-foreground prose-p:leading-[1.7] prose-strong:text-foreground prose-code:text-foreground prose-code:bg-background/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/30"
                />
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-[1.7] font-medium">{message.content}</p>
            )}
          </div>
        </div>

        {/* Show artifact indicators for assistant messages */}
        {message.role === "assistant" && hasArtifacts(message.content) && (
          <div 
            className="flex items-center gap-2 text-xs bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 rounded-lg px-3 py-2 animate-fade-in shadow-soft cursor-pointer hover:bg-primary/20 hover:border-primary/30 hover:shadow-medium transition-all duration-200 group"
            onClick={() => onReopenArtifacts?.(message.content)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onReopenArtifacts?.(message.content)
              }
            }}
            aria-label="Click to reopen artifacts panel"
            title="Click to reopen artifacts panel"
          >
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse group-hover:animate-none group-hover:bg-primary/80"></div>
              <span className="font-medium group-hover:text-primary/90">
                {countArtifacts(message.content)} interactive artifact{countArtifacts(message.content) > 1 ? "s" : ""} generated
              </span>
            </div>
            <svg className="w-4 h-4 text-primary/70 group-hover:text-primary/90 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}
      </div>

      {message.role === "user" && (
        <Avatar className="message-avatar h-10 w-10 shrink-0 ring-2 ring-primary/20 shadow-soft hover:shadow-medium transition-all duration-200">
          <AvatarImage src={getThemeAwareAvatar(user?.avatar, theme, userInitials) || "/placeholder.svg"} />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
})

ChatMessageItem.displayName = 'ChatMessageItem'

// Memoized loading indicator
const LoadingIndicator = memo(() => (
  <div className="loading-indicator flex gap-3 justify-start animate-fade-in">
    <Avatar className="message-avatar h-10 w-10 shrink-0 ring-2 ring-primary/20 shadow-soft">
      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">D</AvatarFallback>
    </Avatar>
    <div className="message-bubble bg-muted/50 dark:bg-muted/20 rounded-lg px-5 py-4 border border-border/50 shadow-soft">
      <div className="flex items-center space-x-3">
        <div className="flex space-x-1">
          <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce"></div>
          <div
            className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: "0.15s" }}
          ></div>
          <div
            className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: "0.3s" }}
          ></div>
        </div>
        <span className="text-sm text-muted-foreground font-medium">AI is thinking...</span>
      </div>
    </div>
  </div>
))

LoadingIndicator.displayName = 'LoadingIndicator'

export const ChatMessages = memo(({ messages, isLoading = false, user, onReopenArtifacts }: ChatMessagesProps) => {
  // Use optimized scroll hook to reduce flickering during streaming
  const scrollRef = useScrollToBottom(messages, true)
  
  // Apply streaming optimizations to reduce flickering
  const { optimizedLoading, isActivelyStreaming } = useStreamingOptimization(isLoading, messages)
  
  return (
    <ScrollArea 
      ref={scrollRef}
      className={`h-full w-full chat-scroll-area ${optimizedLoading ? 'streaming' : ''}`}
    >
      <div className={`p-6 space-y-8 min-h-full chat-container ${optimizedLoading ? 'streaming-container' : ''}`}>
        {messages.map((message, index) => {
          // Check if this is a streaming message (last assistant message while loading)
          const isStreamingMessage = optimizedLoading && 
            message.role === "assistant" && 
            index === messages.length - 1;
          
          return (
            <div 
              key={message.id}
              className={`streaming-message ${isStreamingMessage ? 'is-streaming' : ''}`}
            >
              <ChatMessageItem 
                message={message} 
                user={user} 
                index={index}
                isStreaming={Boolean(isStreamingMessage || isActivelyStreaming)}
                onReopenArtifacts={onReopenArtifacts}
              />
            </div>
          );
        })}

        {/* Loading indicator with theme-aware styling */}
        {optimizedLoading && <LoadingIndicator />}
      </div>
    </ScrollArea>
  )
})

ChatMessages.displayName = 'ChatMessages'
