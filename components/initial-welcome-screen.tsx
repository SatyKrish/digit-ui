"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface User {
  name: string
  email: string
  avatar: string
}

interface InitialWelcomeScreenProps {
  user: User
  onSendMessage: (message: string, selectedHints?: string[]) => void
}

// Updated to use Domains as requested
const domainHints = ["Account", "Party", "Holdings", "Transaction", "Customer", "Product", "Order", "Payment"]

export function InitialWelcomeScreen({ user, onSendMessage }: InitialWelcomeScreenProps) {
  const [message, setMessage] = useState("")
  const [selectedHints, setSelectedHints] = useState<string[]>([])

  const firstName = user.name.split(" ")[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
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
    <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-2xl space-y-8">
        {/* Welcome Message */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Welcome back, {firstName}!</h1>
          <p className="text-xl text-muted-foreground">How can I help you discover data today?</p>
        </div>

        {/* Centered Input */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your data..."
              className="
                min-h-[60px] text-lg resize-none pr-12 
                border-2 border-border/50 bg-background/50 
                focus:border-primary focus:ring-2 focus:ring-primary/20
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0
                transition-all duration-200 shadow-sm hover:shadow-md
                placeholder:text-muted-foreground/60
              "
              rows={2}
            />
            <Button
              type="submit"
              disabled={!message.trim()}
              size="icon"
              className="absolute right-3 bottom-3 h-8 w-8 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Hints Display */}
          {selectedHints.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Selected domains:</p>
              <div className="flex flex-wrap gap-2">
                {selectedHints.map((hint) => (
                  <Badge key={hint} variant="default" className="cursor-pointer" onClick={() => toggleHint(hint)}>
                    {hint} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Domain Hints */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Domains</h3>
            <div className="flex flex-wrap gap-2">
              {domainHints.map((hint) => (
                <Badge
                  key={hint}
                  variant={selectedHints.includes(hint) ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1"
                  onClick={() => toggleHint(hint)}
                >
                  {hint}
                </Badge>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
