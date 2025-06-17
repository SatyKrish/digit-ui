"use client"

import { Moon, Sun, LogOut, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { MCPStatus } from "@/components/shared/mcp-status"
interface User {
  name: string
  email: string
}

interface ChatHeaderProps {
  user: User
  onLogout: () => void
  onNavigateHome?: () => void
  connectionStatus?: string
  artifactCount?: number
  isMobile?: boolean
  showArtifacts?: boolean
  onToggleView?: () => void
  currentChatId?: string | null
  messageCount?: number
}

export function ChatHeader({ 
  user, 
  onLogout, 
  onNavigateHome, 
  connectionStatus, 
  artifactCount, 
  isMobile, 
  showArtifacts, 
  onToggleView
}: ChatHeaderProps) {
  const { theme, setTheme } = useTheme()

  // Get user initials (first character of first name)
  const userInitials = user.name.charAt(0).toUpperCase()

  return (
    <header className="flex h-18 shrink-0 items-center gap-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-elegant">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
        <div className="flex-1 flex items-center gap-4">
        {/* Company Logo with theme-aware styling - clickable to navigate home */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-4 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          aria-label="Go to welcome screen"
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-soft hover:shadow-medium transition-all duration-200 group-hover:scale-105">
            <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight group-hover:text-primary/80 transition-colors duration-200">D<span className="text-red-500">i</span>GIT</h1>
        </button>
        
        {/* MCP Status Display */}
        <div className="ml-8 flex items-center gap-4">
          <MCPStatus />
          
          {/* Connection Status */}
          {connectionStatus && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'Ready' ? 'bg-green-500' :
                connectionStatus === 'Thinking...' ? 'bg-blue-500 animate-pulse' :
                connectionStatus === 'Connection error' ? 'bg-red-500' :
                'bg-yellow-500'
              }`} />
              {connectionStatus}
            </div>
          )}
          
          {/* Artifact Count */}
          {artifactCount !== undefined && artifactCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm text-primary">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {artifactCount} artifact{artifactCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Mobile view toggle for artifacts */}
        {isMobile && artifactCount && artifactCount > 0 && onToggleView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleView}
            className="h-9 px-3 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showArtifacts ? "Show chat" : "Show artifacts"}
          >
            {showArtifacts ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Artifacts ({artifactCount})
              </>
            )}
          </Button>
        )}

        {/* Theme Toggle Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Toggle theme settings"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
              <Sun className="mr-2 h-4 w-4" />
              <span>Light theme</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark theme</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
              <Monitor className="mr-2 h-4 w-4" />
              <span>System theme</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  )
}
