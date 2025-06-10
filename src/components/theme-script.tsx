// This script prevents FOUC (Flash of Unstyled Content) by setting the theme before React hydrates
export function ThemeScript() {
  const script = `
    (function() {
      try {
        function getThemePreference() {
          if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
            return localStorage.getItem('theme')
          }
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        
        const theme = getThemePreference()
        const root = document.documentElement
        
        if (theme === 'dark') {
          root.classList.add('dark')
          root.style.colorScheme = 'dark'
        } else {
          root.classList.remove('dark')
          root.style.colorScheme = 'light'
        }
      } catch (e) {
        // Fallback to light theme if anything fails
        document.documentElement.classList.remove('dark')
        document.documentElement.style.colorScheme = 'light'
      }
    })()
  `

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
