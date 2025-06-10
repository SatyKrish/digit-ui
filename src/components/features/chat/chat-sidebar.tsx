"use client"

import { useState, useRef } from "react"
import { Plus, MessageSquare } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "@/components/ui/sidebar"
import { MOCK_CHAT_HISTORY } from "@/constants/chat"
import { formatRelativeTime } from "@/utils/format"
import type { ChatSidebarProps } from "@/types/chat"

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat }: ChatSidebarProps) {
  const { setOpen, open } = useSidebar()
  const [isClosing, setIsClosing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleNewChat = () => {
    setIsClosing(true)
    // Smooth close animation before action
    setTimeout(() => {
      onNewChat()
      setOpen(false)
      setIsClosing(false)
    }, 150)
  }

  const handleChatSelect = (chatId: string) => {
    setIsClosing(true)
    // Smooth close animation before action
    setTimeout(() => {
      onChatSelect(chatId)
      setOpen(false)
      setIsClosing(false)
    }, 150)
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Only close the sidebar if the mouse is moving to the right
    const rect = e.currentTarget.getBoundingClientRect()
    if (e.clientX > rect.right) {
      // Add a small delay for smoother interaction
      timeoutRef.current = setTimeout(() => {
        setOpen(false)
      }, 200)
    }
  }

  const handleMouseEnter = () => {
    // Cancel any pending close action when mouse re-enters
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsClosing(false)
  }

  return (
    <Sidebar
      className={`
        border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out
        ${open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}
        ${isClosing ? "animate-out slide-out-to-left-1/2 duration-200" : "animate-in slide-in-from-left-1/2 duration-300"}
        shadow-elegant-lg dark:shadow-2xl backdrop-blur-sm
      `}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <SidebarHeader className="p-4 transform transition-all duration-200 ease-out border-b border-sidebar-border/50">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground shadow-soft hover:shadow-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          size="lg"
        >
          <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="transform transition-all duration-200 ease-out">
        <SidebarGroup>
          <SidebarGroupContent>
            <ScrollArea className="h-full">
              <SidebarMenu className="space-y-1 p-2">
                {MOCK_CHAT_HISTORY.map((chat, index) => (
                  <SidebarMenuItem
                    key={chat.id}
                    className={`
                      transform transition-all duration-200 ease-out
                      ${open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}
                    `}
                    style={{
                      transitionDelay: open ? `${index * 30}ms` : "0ms",
                    }}
                  >
                    <SidebarMenuButton
                      onClick={() => handleChatSelect(chat.id)}
                      isActive={currentChatId === chat.id}
                      className="
                        w-full justify-start gap-3 p-3 h-auto rounded-md
                        transition-all duration-200 ease-out
                        hover:scale-[1.02] hover:shadow-soft hover:bg-sidebar-accent/50
                        active:scale-[0.98]
                        data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground
                        data-[active=true]:border-l-2 data-[active=true]:border-sidebar-primary
                        data-[active=true]:shadow-soft
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2
                      "
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 transition-colors duration-200" />
                      <div className="flex flex-col items-start gap-1 overflow-hidden">
                        <span className="text-sm font-medium truncate w-full text-left transition-colors duration-200">
                          {chat.title}
                        </span>
                        <span className="text-xs text-sidebar-foreground/60 transition-colors duration-200">
                          {formatRelativeTime(chat.timestamp)}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
