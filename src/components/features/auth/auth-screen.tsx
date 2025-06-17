"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Moon, Sun, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/auth/use-auth"

export function AuthScreen() {
  const { theme, setTheme } = useTheme()
  const { signIn, isLoading } = useAuth()

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background transition-colors duration-300 p-4 md:p-6">
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="h-10 w-10 shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Main content - centered both horizontally and vertically */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center space-y-8 md:space-y-12 animate-scale-in">
        {/* Header section */}
        <div className="text-center space-y-6 md:space-y-8 animate-fade-in">
          {/* Company Logo with theme-aware styling */}
          <div className="flex items-center justify-center gap-4 md:gap-6 animate-slide-in-up">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-lg flex items-center justify-center shadow-elegant hover:shadow-elegant-lg transition-all duration-300 hover:scale-105">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary tracking-tight animate-slide-in-left">
              DIGIT
            </h1>
          </div>
          
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground animate-stagger-1 max-w-md mx-auto px-4">
            Enterprise Data Intelligence Platform
          </p>
        </div>

        {/* Sign in button */}
        <div className="w-full max-w-sm px-4 animate-stagger-2">
          <Button
            onClick={signIn}
            disabled={isLoading}
            size="lg"
            className="w-full flex items-center justify-center space-x-3 md:space-x-4 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg shadow-elegant hover:shadow-elegant-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
            ) : (
              /* Official Microsoft Logo */
              <svg className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" viewBox="0 0 23 23" fill="none">
                <path fill="#f25022" d="M1 1h10v10H1z" />
                <path fill="#00a4ef" d="M12 1h10v10H12z" />
                <path fill="#7fba00" d="M1 12h10v10H1z" />
                <path fill="#ffb900" d="M12 12h10v10H12z" />
              </svg>
            )}
            <span className="font-medium">
              {isLoading ? 'Signing in...' : 'Login with Microsoft'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
