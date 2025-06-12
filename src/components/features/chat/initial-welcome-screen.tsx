"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useWelcomeMessage } from "@/hooks/welcome/use-welcome-message"

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

  // Get dynamic welcome message
  const welcomeMessage = useWelcomeMessage(user)
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
      <div className="w-full max-w-4xl space-y-8">
        {/* Welcome Message */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            {welcomeMessage.isLoading ? `Welcome, ${firstName}!` : welcomeMessage.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {welcomeMessage.isLoading ? 'How can I help you today?' : welcomeMessage.subtitle}
          </p>
          {!welcomeMessage.isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/80">
              <span className="px-2 py-1 bg-muted/30 rounded-full text-xs font-medium">
                {welcomeMessage.context}
              </span>
              <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full"></span>
              <span className="text-xs">
                {welcomeMessage.tone === 'professional' ? '🎯' : 
                 welcomeMessage.tone === 'friendly' ? '😊' : '⚡'} {welcomeMessage.tone}
              </span>
            </div>
          )}
        </div>

        {/* Centered Input */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your data..."
              className="
                min-h-[60px] text-lg resize-none pr-12 w-full
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
              className={`absolute right-3 bottom-3 h-10 w-10 shadow-soft hover:shadow-medium transition-all duration-200 ${
                !message.trim() 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:scale-105 hover:-translate-y-0.5"
              }`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Domain Hints - positioned below the chat text bar */}
          <div className="space-y-2 max-w-2xl mx-auto">
            <h3 className="text-sm font-medium text-muted-foreground">Domains</h3>
            <div className="flex flex-wrap gap-2">
              {domainHints.map((hint, index) => (
                <Badge
                  key={hint}
                  variant={selectedHints.includes(hint) ? "default" : "secondary"}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-soft px-3 py-1 animate-slide-in-up animate-stagger-${Math.min(index + 1, 4)} ${
                    selectedHints.includes(hint) 
                      ? "hover:bg-primary/80" 
                      : "hover:bg-primary hover:text-primary-foreground"
                  }`}
                  onClick={() => toggleHint(hint)}
                >
                  {hint}
                </Badge>
              ))}
            </div>
          </div>

          {/* Selected Hints Display */}
          {selectedHints.length > 0 && (
            <div className="space-y-2 max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground">Selected domains:</p>
              <div className="flex flex-wrap gap-2">
                {selectedHints.map((hint, index) => (
                  <Badge 
                    key={hint} 
                    variant="default" 
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 animate-slide-in-up animate-stagger-${Math.min(index + 1, 4)}`}
                    onClick={() => toggleHint(hint)}
                  >
                    {hint} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
