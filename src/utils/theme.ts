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
