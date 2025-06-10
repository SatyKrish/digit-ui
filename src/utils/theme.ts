/**
 * Get theme-aware avatar URL
 */
export function getThemeAwareAvatar(src?: string, theme?: string, initials?: string): string {
  if (src) return src
  
  const isDark = theme === "dark"
  const bgColor = isDark ? "1f2937" : "f3f4f6"
  const textColor = isDark ? "ffffff" : "000000"
  
  return `/placeholder.svg?height=32&width=32&text=${initials || "U"}&bg=${bgColor}&color=${textColor}`
}

/**
 * Get system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Toggle theme
 */
export function toggleTheme(currentTheme: string): 'light' | 'dark' {
  return currentTheme === 'dark' ? 'light' : 'dark'
}
