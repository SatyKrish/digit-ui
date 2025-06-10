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
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-8">
        <div className="text-center space-y-6">
          {/* Company Logo with theme-aware styling */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mr-4 shadow-lg dark:shadow-primary/20">
              <svg className="w-10 h-10 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-6xl font-bold text-primary">DIGIT</h1>
          </div>
          <p className="text-xl text-muted-foreground">Enterprise Data Intelligence Platform</p>
        </div>

        <Button
          onClick={onLogin}
          size="lg"
          className="flex items-center space-x-3 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
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
