"use client"

import { memo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { hasArtifacts, countArtifacts } from "@/services/artifacts/artifact-extractor"
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

      <div className={`max-w-[80%] min-w-0 space-y-3 ${message.role === "user" ? "order-first" : ""}`}>
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
                {message.parts && message.parts.length > 0 ? (
                  // Render AI SDK v4+ message parts
                  <div className="space-y-2">
                    {message.parts.map((part, partIndex) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <MarkdownRenderer 
                              key={partIndex}
                              content={part.text || ''} 
                              className="text-sm leading-[1.7] prose-headings:text-foreground prose-headings:font-semibold prose-headings:leading-tight prose-p:text-foreground prose-p:leading-[1.7] prose-strong:text-foreground prose-code:text-foreground prose-code:bg-background/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/30"
                            />
                          )
                        case 'tool-invocation':
                          return (
                            <div key={partIndex} className="bg-muted/30 border border-border/30 rounded-lg p-3 my-2">
                              <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Tool: {part.toolInvocation?.toolName || 'Unknown'}
                              </div>
                              <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(part.toolInvocation, null, 2)}
                              </pre>
                            </div>
                          )
                        case 'reasoning':
                          return (
                            <details key={partIndex} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 my-2">
                              <summary className="text-xs font-semibold text-amber-700 dark:text-amber-300 cursor-pointer flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                AI Reasoning
                              </summary>
                              <pre className="text-xs mt-2 whitespace-pre-wrap text-amber-800 dark:text-amber-200">
                                {part.reasoning || 'No reasoning details available'}
                              </pre>
                            </details>
                          )
                        case 'source':
                          return (
                            <div key={partIndex} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 my-2">
                              <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Source Reference
                              </div>
                              <div className="text-sm">
                                {part.source?.url ? (
                                  <a href={part.source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {part.source.title || part.source.url}
                                  </a>
                                ) : (
                                  <span>Source information</span>
                                )}
                              </div>
                            </div>
                          )
                        case 'file':
                          return (
                            <div key={partIndex} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 my-2">
                              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                File Attachment
                              </div>
                              {part.mimeType?.startsWith('image/') && part.data ? (
                                <img 
                                  src={`data:${part.mimeType};base64,${part.data}`}
                                  alt="AI generated file"
                                  className="max-w-full h-auto rounded border"
                                />
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  File: {part.mimeType || 'Unknown type'}
                                </div>
                              )}
                            </div>
                          )
                        case 'step-start':
                          // Only show processing steps during streaming, hide when complete
                          return isStreaming ? (
                            <div key={partIndex} className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-2 my-1">
                              <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                Processing Step
                              </div>
                            </div>
                          ) : null
                        default:
                          return (
                            <div key={partIndex} className="text-sm text-muted-foreground italic">
                              [Unsupported part type: {part.type}]
                            </div>
                          )
                      }
                    })}
                  </div>
                ) : (
                  // Fallback to content for backward compatibility
                  <MarkdownRenderer 
                    content={message.content} 
                    className="text-sm leading-[1.7] prose-headings:text-foreground prose-headings:font-semibold prose-headings:leading-tight prose-p:text-foreground prose-p:leading-[1.7] prose-strong:text-foreground prose-code:text-foreground prose-code:bg-background/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/30"
                  />
                )}
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
      <div className={`p-6 space-y-8 min-h-full chat-container overflow-x-auto ${optimizedLoading ? 'streaming-container' : ''}`}>
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
