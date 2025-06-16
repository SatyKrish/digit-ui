"use client"

import { memo, useMemo, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { hasArtifacts, countArtifacts } from "@/services/artifacts/artifact-extractor"
import { generateInitials } from "@/utils/format"
import { MarkdownRenderer } from "@/components/shared/markdown-renderer"
import { useScrollToBottom } from "@/hooks/shared/use-scroll-to-bottom"
import { useStreamingOptimization } from "@/hooks/shared/use-streaming-optimization"
import { getSlideInStaggerClass } from "@/utils/animations"
import type { ChatMessage } from "@/types/chat"
import type { ChatMessagesProps } from "@/types/chat"

// Memoized individual message component for better performance
const ChatMessageItem = memo(({ message, user, index, isStreaming = false }: { 
  message: ChatMessage; 
  user?: { name: string }; 
  index: number;
  isStreaming?: boolean;
}) => {
  const { theme } = useTheme()
  const userInitials = generateInitials(user?.name || "User")

  return (
    <div 
      className={`flex gap-4 ${
        // Reduce animations during streaming to prevent flickering
        isStreaming && message.role === "assistant" && index === 0 
          ? "opacity-100" 
          : getSlideInStaggerClass(index)
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

      <div className={`max-w-[95%] sm:max-w-[85%] lg:max-w-[80%] min-w-0 space-y-3 ${message.role === "user" ? "order-first" : ""}`}>
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
          <div className="message-content overflow-hidden break-words">
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
                            <div key={partIndex} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 my-2">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  Tool: {part.toolInvocation?.toolName || 'Unknown'}
                                  {part.toolInvocation?.state && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      part.toolInvocation.state === 'call' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                                      part.toolInvocation.state === 'result' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                                    }`}>
                                      {part.toolInvocation.state}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Tool Arguments */}
                              {part.toolInvocation?.args && (
                                <details className="mb-2">
                                  <summary className="text-xs cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
                                    View Arguments
                                  </summary>
                                  <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded mt-1 overflow-x-auto border border-blue-200 dark:border-blue-800">
                                    {JSON.stringify(part.toolInvocation.args, null, 2)}
                                  </pre>
                                </details>
                              )}
                              
                              {/* Tool Result */}
                              {part.toolInvocation?.result && (
                                <div className="bg-white dark:bg-gray-900 p-2 rounded border border-blue-200 dark:border-blue-800">
                                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Result:</div>
                                  <pre className="text-xs whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                                    {typeof part.toolInvocation.result === 'string' 
                                      ? part.toolInvocation.result 
                                      : JSON.stringify(part.toolInvocation.result, null, 2)
                                    }
                                  </pre>
                                </div>
                              )}
                            </div>
                          )
                        case 'reasoning':
                          return (
                            <details key={partIndex} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 my-2 group">
                              <summary className="text-xs font-semibold text-amber-700 dark:text-amber-300 cursor-pointer flex items-center gap-2 hover:text-amber-600 dark:hover:text-amber-200 transition-colors">
                                <div className="w-2 h-2 bg-amber-500 rounded-full group-open:animate-pulse"></div>
                                <span>🧠 AI Reasoning Steps</span>
                                <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 group-open:hidden">Click to expand</span>
                              </summary>
                              <div className="mt-3 space-y-2">
                                <div className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                                  Here's how I approached this problem:
                                </div>
                                <div className="bg-white dark:bg-amber-950/30 rounded-md p-3 border border-amber-200 dark:border-amber-800">
                                  <pre className="text-xs whitespace-pre-wrap text-amber-800 dark:text-amber-200 leading-relaxed">
                                    {part.reasoning || 'No reasoning details available'}
                                  </pre>
                                </div>
                              </div>
                            </details>
                          )
                        case 'source':
                          return (
                            <div key={partIndex} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 my-2">
                              <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                🔗 Source Reference
                                <span className="ml-auto bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                                  Reference
                                </span>
                              </div>
                              <div className="bg-white dark:bg-green-950/30 rounded-md p-3 border border-green-200 dark:border-green-800">
                                {part.source?.url ? (
                                  <div className="space-y-2">
                                    <a 
                                      href={part.source.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-primary hover:underline font-medium flex items-center gap-2 group"
                                    >
                                      <span>{part.source.title || part.source.url}</span>
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                    </a>
                                    {part.source.title && part.source.url !== part.source.title && (
                                      <div className="text-xs text-green-600 dark:text-green-400 font-mono">
                                        {part.source.url}
                                      </div>
                                    )}
                                    {part.source.description && (
                                      <div className="text-sm text-green-700 dark:text-green-300 italic">
                                        {part.source.description}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm text-green-700 dark:text-green-300">
                                    📚 Source information provided by AI
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        case 'file':
                          return (
                            <div key={partIndex} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 my-2">
                              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                📎 File Attachment
                                {part.mimeType && (
                                  <span className="ml-auto bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs">
                                    {part.mimeType.split('/')[0]}
                                  </span>
                                )}
                              </div>
                              
                              {part.mimeType?.startsWith('image/') && part.data ? (
                                <div className="space-y-3">
                                  <div className="relative group">
                                    <img 
                                      src={`data:${part.mimeType};base64,${part.data}`}
                                      alt="AI generated file"
                                      className="max-w-full h-auto rounded border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                      loading="lazy"
                                      onClick={() => {
                                        const newWindow = window.open();
                                        if (newWindow) {
                                          newWindow.document.write(`<img src="data:${part.mimeType};base64,${part.data}" style="max-width:100%;height:auto;" />`);
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <span className="text-white text-sm bg-black/50 px-3 py-1 rounded">Click to view full size</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 rounded px-2 py-1">
                                    <span>{part.mimeType}</span>
                                    <span>{part.data ? `${Math.round(part.data.length / 1024)}KB` : 'Unknown size'}</span>
                                  </div>
                                </div>
                              ) : part.mimeType?.startsWith('text/') && part.data ? (
                                <div className="space-y-3">
                                  <div className="relative">
                                    <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto max-h-40 font-mono">
                                      {part.data ? atob(part.data) : 'No content available'}
                                    </pre>
                                    {part.data && (
                                      <button
                                        onClick={() => navigator.clipboard.writeText(atob(part.data!))}
                                        className="absolute top-2 right-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 p-1 rounded text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                                        title="Copy to clipboard"
                                      >
                                        📋
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 rounded px-2 py-1">
                                    <span>{part.mimeType}</span>
                                    <span>{part.data ? `${Math.round(part.data.length / 1024)}KB` : 'Unknown size'}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="text-sm text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-900 p-3 rounded border border-purple-200 dark:border-purple-800 text-center">
                                    <div className="text-4xl mb-2">📄</div>
                                    <div>File type: {part.mimeType || 'Unknown'}</div>
                                    {part.data && (
                                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                        Size: {Math.round(part.data.length / 1024)}KB
                                      </div>
                                    )}
                                    <button
                                      onClick={() => {
                                        if (part.data) {
                                          const blob = new Blob([atob(part.data)], { type: part.mimeType || 'application/octet-stream' });
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `attachment.${part.mimeType?.split('/')[1] || 'bin'}`;
                                          a.click();
                                          URL.revokeObjectURL(url);
                                        }
                                      }}
                                      className="mt-2 bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                                    >
                                      Download
                                    </button>
                                  </div>
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
          <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 rounded-lg px-3 py-2 animate-fade-in shadow-soft">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="font-medium">
                {countArtifacts(message.content)} interactive artifact{countArtifacts(message.content) > 1 ? "s" : ""} generated
              </span>
            </div>
            <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export const ChatMessages = memo(({ messages, isLoading = false, user }: ChatMessagesProps) => {
  // Use optimized scroll hook to reduce flickering during streaming
  const scrollRef = useScrollToBottom(messages, true)
  
  // Apply streaming optimizations to reduce flickering
  const { optimizedLoading, isActivelyStreaming } = useStreamingOptimization(isLoading, messages)
  
  return (
    <ScrollArea 
      ref={scrollRef}
      className={`h-full w-full chat-scroll-area ${optimizedLoading ? 'streaming' : ''}`}
    >
      <div className={`p-6 space-y-8 min-h-full chat-container overflow-x-hidden ${optimizedLoading ? 'streaming-container' : ''}`}>
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
