"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import type { Message } from "ai"

interface ChatMessagesProps {
  messages: Message[]
  isLoading?: boolean
  user?: {
    name: string
    avatar?: string
  }
}

// Function to check if message has artifacts
function hasArtifacts(content: string): boolean {
  return /```[\s\S]*?```/.test(content)
}

// Function to count artifacts in content
function countArtifacts(content: string): number {
  const matches = content.match(/```[\s\S]*?```/g)
  return matches ? matches.length : 0
}

export function ChatMessages({ messages, isLoading, user }: ChatMessagesProps) {
  const { theme } = useTheme()

  // Get user initials (first character of first name)
  const userInitials = user?.name.charAt(0).toUpperCase() || "U"

  // Generate theme-aware placeholder images
  const getThemeAwareAvatar = (src?: string) => {
    if (src) return src
    const isDark = theme === "dark"
    return `/placeholder.svg?height=32&width=32&text=${userInitials}&bg=${isDark ? "1f2937" : "f3f4f6"}&color=${isDark ? "ffffff" : "000000"}`
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/10">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">D</AvatarFallback>
              </Avatar>
            )}

            <div className={`max-w-[80%] space-y-2 ${message.role === "user" ? "order-first" : ""}`}>
              <div
                className={`rounded-lg px-4 py-3 shadow-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted/50 dark:bg-muted/20 border border-border/50"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>

              {/* Show artifact indicators for assistant messages */}
              {message.role === "assistant" && hasArtifacts(message.content) && (
                <div className="text-xs text-muted-foreground bg-muted/30 dark:bg-muted/10 rounded px-2 py-1 border border-border/30">
                  📊 {countArtifacts(message.content)} artifact{countArtifacts(message.content) > 1 ? "s" : ""}{" "}
                  generated
                </div>
              )}
            </div>

            {message.role === "user" && (
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/10">
                <AvatarImage src={getThemeAwareAvatar(user?.avatar) || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {/* Loading indicator with theme-aware styling */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/10">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">D</AvatarFallback>
            </Avatar>
            <div className="bg-muted/50 dark:bg-muted/20 rounded-lg px-4 py-3 border border-border/50">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
