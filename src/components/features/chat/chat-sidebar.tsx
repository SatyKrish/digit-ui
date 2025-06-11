"use client"

import { useState, useRef } from "react"
import { Plus, MessageSquare, ChevronDown, ChevronRight } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "@/components/ui/sidebar"
import { MCPToolsPanel } from "@/components/shared/mcp-tools-panel"
import { useChatSessions, useGroupedChatSessions } from "@/hooks/chat"
import { formatRelativeTime } from "@/utils/format"
import type { ChatSidebarProps, ChatSession, TimePeriod } from "@/types/chat"

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat, user }: ChatSidebarProps & { user?: { id: string; email: string; name: string } }) {
  const { setOpen, open } = useSidebar()
  const [isClosing, setIsClosing] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<TimePeriod>>(new Set())
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use real session data
  const { sessions, createSession, isLoading } = useChatSessions(user)
  const { groupedSessions, groupOrder, getGroupLabel } = useGroupedChatSessions(sessions)

  const handleNewChat = async () => {
    setIsClosing(true)
    try {
      // Create new session without reloading all sessions
      const newSession = await createSession()
      // Smooth close animation before action
      setTimeout(() => {
        onNewChat()
        setOpen(false)
        setIsClosing(false)
      }, 150)
    } catch (error) {
      console.error('Failed to create new chat:', error)
      setIsClosing(false)
    }
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

  const toggleGroupCollapse = (period: TimePeriod) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(period)) {
        newSet.delete(period)
      } else {
        newSet.add(period)
      }
      return newSet
    })
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
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-sidebar-foreground/60">
              Loading chats...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-sidebar-foreground/60">
              No chat history yet
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {groupOrder.map((period) => {
                const groupSessions = groupedSessions[period]
                if (!groupSessions || groupSessions.length === 0) return null
                
                const isCollapsed = collapsedGroups.has(period)
                
                return (
                  <SidebarGroup key={period}>
                    <SidebarGroupLabel 
                      className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1 transition-colors"
                      onClick={() => toggleGroupCollapse(period)}
                    >
                      <span className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
                        {getGroupLabel(period)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-sidebar-foreground/50">
                          {groupSessions.length}
                        </span>
                        {isCollapsed ? (
                          <ChevronRight className="h-3 w-3 text-sidebar-foreground/50" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-sidebar-foreground/50" />
                        )}
                      </div>
                    </SidebarGroupLabel>
                    
                    {!isCollapsed && (
                      <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                          {groupSessions.map((session: ChatSession, index: number) => (
                            <SidebarMenuItem
                              key={session.id}
                              className={`
                                transform transition-all duration-200 ease-out
                                ${open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}
                              `}
                              style={{
                                transitionDelay: open ? `${index * 30}ms` : "0ms",
                              }}
                            >
                              <SidebarMenuButton
                                onClick={() => handleChatSelect(session.id)}
                                isActive={currentChatId === session.id}
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
                                    {session.title}
                                  </span>
                                  <span className="text-xs text-sidebar-foreground/60 transition-colors duration-200">
                                    {formatRelativeTime(session.timestamp)}
                                    {session.messageCount !== undefined && ` • ${session.messageCount} messages`}
                                  </span>
                                </div>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    )}
                  </SidebarGroup>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}
