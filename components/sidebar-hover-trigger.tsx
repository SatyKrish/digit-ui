"use client"

import { useState, useEffect, useRef } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { useTheme } from "next-themes"

export function SidebarHoverTrigger() {
  const { setOpen, open } = useSidebar()
  const [isHovering, setIsHovering] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const isNearLeftEdge = e.clientX <= 15

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Only open the sidebar when hovering near the left edge and it's not already open
      if (isNearLeftEdge && !open) {
        setIsHovering(true)
        // Small delay for smoother activation
        timeoutRef.current = setTimeout(() => {
          setOpen(true)
        }, 100)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [open, setOpen])

  return (
    <>
      {/* Invisible trigger area */}
      <div
        className="fixed left-0 top-0 w-4 h-full z-50 bg-transparent"
        onMouseEnter={() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          setIsHovering(true)
          timeoutRef.current = setTimeout(() => {
            setOpen(true)
          }, 50)
        }}
      />

      {/* Visual indicator when hovering near edge - theme aware */}
      {isHovering && !open && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-primary/40 dark:bg-primary/60 rounded-r-full z-40 animate-in slide-in-from-left-2 duration-200 shadow-lg dark:shadow-primary/20" />
      )}
    </>
  )
}
