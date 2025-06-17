"use client"

import { useState, useRef } from "react"
import { Plus, MessageSquare, ChevronDown, ChevronRight, MoreHorizontal, Trash2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSidebar } from "@/components/ui/sidebar"
import { MCPToolsPanel } from "@/components/shared/mcp-tools-panel"
import { useChats, useGroupedChatSessions } from "@/hooks/chat"
import { formatRelativeTime } from "@/utils/format"
import type { ChatSidebarProps, Chat, TimePeriod } from "@/types/chat"

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat, user }: ChatSidebarProps & { user?: { id: string; email: string; name: string } }) {
  const { setOpen, open } = useSidebar()
  const [isClosing, setIsClosing] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<TimePeriod>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use updated chat management (aligned with Chat SDK patterns)
  const { chats, createChat, deleteChat, isLoading } = useChats(user)
  const { groupedSessions: groupedChats, groupOrder, getGroupLabel } = useGroupedChatSessions(chats)

  const handleNewChat = async () => {
    setIsClosing(true)
    try {
      // Create new chat without reloading all chats
      const newChat = await createChat()
      if (newChat) {
        // Smooth close animation before action
        setTimeout(() => {
          // Switch to the new chat instead of just calling onNewChat
          onChatSelect(newChat.id)
          setOpen(false)
          setIsClosing(false)
        }, 150)
      } else {
        setIsClosing(false)
      }
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

  const handleDeleteChat = (chatId: string) => {
    setChatToDelete(chatId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return
    
    const success = await deleteChat(chatToDelete)
    if (success) {
      // If the deleted chat was the current one, we might want to navigate away
      if (currentChatId === chatToDelete) {
        onChatSelect('')
      }
    }
    
    setDeleteDialogOpen(false)
    setChatToDelete(null)
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
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-sm text-sidebar-foreground/60">
              No chat history yet
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {groupOrder.map((period) => {
                const groupChats = groupedChats[period]
                if (!groupChats || groupChats.length === 0) return null
                
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
                          {groupChats.length}
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
                          {groupChats.map((chat: Chat, index: number) => (
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
                              <div className="flex items-center w-full group">
                                <SidebarMenuButton
                                  onClick={() => handleChatSelect(chat.id)}
                                  isActive={currentChatId === chat.id}
                                  className="
                                    flex-1 justify-start gap-3 p-3 h-auto rounded-md mr-2
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
                                  <div className="flex flex-col items-start gap-1 overflow-hidden min-w-0 flex-1">
                                    <span className="text-sm font-medium truncate w-full text-left transition-colors duration-200">
                                      {chat.title}
                                    </span>
                                    <span className="text-xs text-sidebar-foreground/60 transition-colors duration-200 truncate w-full">
                                      {formatRelativeTime(chat.updatedAt || new Date())}
                                      {chat.messageCount !== undefined && ` • ${chat.messageCount} messages`}
                                    </span>
                                  </div>
                                </SidebarMenuButton>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteChat(chat.id)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-sm shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove all messages from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}
