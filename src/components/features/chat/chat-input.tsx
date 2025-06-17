"use client"

import type React from "react"

import { useState } from "react"
import { Send, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DOMAIN_HINTS } from "@/constants/chat"
import { getSlideInStaggerClass } from "@/utils/animations"

export interface ChatInputProps {
  onSendMessage?: (content: string, selectedHints?: string[]) => void
  input?: string
  setInput?: (value: string) => void
  onSubmit?: (event: React.FormEvent) => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSendMessage, 
  input, 
  setInput, 
  onSubmit, 
  onStop,
  isLoading, 
  disabled,
  placeholder 
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [selectedHints, setSelectedHints] = useState<string[]>([])

  // Use either controlled or uncontrolled input
  const currentMessage = input !== undefined ? input : message
  const setCurrentMessage = setInput || setMessage

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentMessage.trim() && !isLoading && !disabled) {
      if (onSubmit) {
        onSubmit(e)
      } else if (onSendMessage) {
        onSendMessage(currentMessage.trim(), selectedHints)
        setCurrentMessage("")
        setSelectedHints([])
      }
    }
  }

  const toggleHint = (hint: string) => {
    setSelectedHints((prev) => (prev.includes(hint) ? prev.filter((h) => h !== hint) : [...prev, hint]))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 lg:p-6 space-y-3 lg:space-y-4 shadow-elegant chat-input-container">
      <div className="w-full">
        {/* Selected Hints */}
        {selectedHints.length > 0 && (
          <div className="flex justify-center selected-hints-container mb-4">
            <div className="w-full max-w-full flex flex-wrap gap-1.5 lg:gap-2 animate-fade-in px-1 lg:px-2">
              {selectedHints.map((hint, index) => (
                <Badge 
                  key={hint} 
                  variant="default" 
                  className={`cursor-pointer text-xs transition-all duration-200 hover:scale-105 hover:shadow-soft ${getSlideInStaggerClass(index)} domain-hint-badge`}
                  onClick={() => toggleHint(hint)}
                >
                  {hint} ×
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick Domain Hints */}
        <div className="flex justify-center domain-hints-container mb-4">
          <div className="w-full max-w-full px-1 lg:px-2">
            <div className="text-xs text-muted-foreground mb-2 text-center font-medium">
              Quick domain contexts:
            </div>
            <div className="flex flex-wrap gap-1.5 lg:gap-2 justify-center domain-hints-grid">
            {DOMAIN_HINTS.map((hint, index) => (
              <Badge
                key={hint}
                variant={selectedHints.includes(hint) ? "default" : "outline"}
                className={`cursor-pointer text-xs transition-all duration-200 hover:scale-105 hover:shadow-soft ${getSlideInStaggerClass(index)} domain-hint-badge ${
                  selectedHints.includes(hint) 
                    ? "hover:bg-primary/80 ring-2 ring-primary/20" 
                    : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                }`}
                onClick={() => toggleHint(hint)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleHint(hint)
                  }
                }}
                aria-pressed={selectedHints.includes(hint)}
                aria-label={`${selectedHints.includes(hint) ? 'Remove' : 'Add'} ${hint} context`}
              >
                {hint}
              </Badge>
            ))}
          </div>
        </div>
      </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 justify-center chat-input-form">
          <div className="w-full max-w-full relative px-1 lg:px-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || "Ask me anything about your data..."}
              disabled={isLoading || disabled}
              className="
                min-h-[48px] lg:min-h-[52px] max-h-32 resize-none pr-16 w-full
                border-border/50 bg-background/50 shadow-soft
                focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-medium
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0
                transition-all duration-200 ease-out hover:shadow-medium hover:border-border/70
                placeholder:text-muted-foreground/60
                text-sm lg:text-base leading-6 font-medium
                disabled:opacity-60 disabled:cursor-not-allowed
                chat-input-textarea
              "
              rows={1}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 hover:bg-muted/50 transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="submit"
            disabled={!currentMessage.trim() || isLoading || disabled}
            className={`h-10 lg:h-12 px-4 lg:px-6 shadow-soft hover:shadow-medium transition-all duration-200 font-medium ${
              !currentMessage.trim() || isLoading || disabled 
                ? "opacity-50 cursor-not-allowed scale-100" 
                : "hover:scale-105 hover:-translate-y-0.5 active:scale-95"
            }`}
            aria-label="Send message"
          >
            <Send className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
