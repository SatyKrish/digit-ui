"use client"

import type React from "react"

import { useState } from "react"
import { Send, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface ChatInputProps {
  onSendMessage: (message: string, selectedHints?: string[]) => void
  isLoading?: boolean
}

// Updated to use Domains as requested
const domainHints = ["Account", "Party", "Holdings", "Transaction"]

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [selectedHints, setSelectedHints] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim(), selectedHints)
      setMessage("")
      setSelectedHints([])
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
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 space-y-3">
      {/* Selected Hints */}
      {selectedHints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedHints.map((hint) => (
            <Badge key={hint} variant="default" className="cursor-pointer text-xs" onClick={() => toggleHint(hint)}>
              {hint} ×
            </Badge>
          ))}
        </div>
      )}

      {/* Quick Domain Hints */}
      <div className="flex flex-wrap gap-1">
        {domainHints.map((hint) => (
          <Badge
            key={hint}
            variant={selectedHints.includes(hint) ? "default" : "outline"}
            className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => toggleHint(hint)}
          >
            {hint}
          </Badge>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your data..."
            disabled={isLoading}
            className="
              min-h-[44px] max-h-32 resize-none pr-12 
              border-border/50 bg-background/50 
              focus:border-primary focus:ring-1 focus:ring-primary 
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0
              transition-all duration-200
              placeholder:text-muted-foreground/60
            "
            rows={1}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 hover:bg-muted/50 transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="h-11 px-4 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
