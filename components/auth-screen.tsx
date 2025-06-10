"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

interface AuthScreenProps {
  onLogin: () => void
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background transition-colors duration-300">
      {/* Theme toggle in top right */}
      <div className="absolute top-6 right-6">
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

      <div className="flex flex-col items-center space-y-12 animate-scale-in">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Company Logo with theme-aware styling */}
          <div className="flex items-center justify-center mb-8 animate-slide-in-up">
            <div className="w-18 h-18 bg-primary rounded-lg flex items-center justify-center mr-6 shadow-large hover:shadow-glow-primary transition-all duration-300 hover:scale-105">
              <svg className="w-12 h-12 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-7xl font-bold text-primary tracking-tight animate-slide-in-left">DIGIT</h1>
          </div>
          <p className="text-xl text-muted-foreground animate-stagger-1 max-w-md">
            Enterprise Data Intelligence Platform
          </p>
        </div>

        <Button
          onClick={onLogin}
          size="lg"
          className="flex items-center space-x-4 px-10 py-6 text-lg shadow-large hover:shadow-glow transition-all duration-300 hover:scale-105 animate-stagger-2"
        >
          {/* Official Microsoft Logo */}
          <svg className="w-6 h-6" viewBox="0 0 23 23" fill="none">
            <path fill="#f25022" d="M1 1h10v10H1z" />
            <path fill="#00a4ef" d="M12 1h10v10H12z" />
            <path fill="#7fba00" d="M1 12h10v10H1z" />
            <path fill="#ffb900" d="M12 12h10v10H12z" />
          </svg>
          <span>Login with Microsoft</span>
        </Button>
      </div>
    </div>
  )
}
