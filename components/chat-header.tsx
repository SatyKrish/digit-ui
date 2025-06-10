"use client"

import { useState } from "react"
import { Menu, Moon, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MCPStatus } from "@/components/mcp-status"

interface ChatHeaderProps {
  toggleSidebar: () => void
}

export function ChatHeader({ toggleSidebar }: ChatHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <h1 className="text-lg font-semibold tracking-tight">DIGIT</h1>
      </div>
      <div className="flex items-center gap-4">
        <MCPStatus />
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Avatar className="h-8 w-8 cursor-pointer" onClick={() => setShowUserMenu(!showUserMenu)}>
          <AvatarImage src="/placeholder-user.jpg" alt="User" />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
