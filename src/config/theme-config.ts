// Enhanced theme configuration for the chat application
// This file centralizes our design system enhancements

export const themeConfig = {
  // Enhanced shadow system
  shadows: {
    soft: '0 2px 4px -1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    medium: '0 4px 8px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
    large: '0 8px 16px -4px rgb(0 0 0 / 0.1), 0 4px 8px -4px rgb(0 0 0 / 0.06)',
    glow: '0 0 30px -2px hsl(var(--primary) / 0.6)',
    innerSoft: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    focus: '0 0 0 2px hsl(var(--ring))'
  },

  // Enhanced spacing tokens
  spacing: {
    '18': '4.5rem',
    '88': '22rem',
    '128': '32rem'
  },

  // Animation timing
  animations: {
    durations: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms'
    },
    easings: {
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },

  // Semantic colors
  semanticColors: {
    success: {
      light: '142 76% 36%',
      dark: '142 71% 45%'
    },
    warning: {
      light: '38 92% 50%',
      dark: '48 96% 53%'
    },
    info: {
      light: '199 89% 48%',
      dark: '200 98% 39%'
    }
  },

  // Interactive states
  interactions: {
    hover: {
      scale: '1.02',
      translateY: '-1px',
      shadowIntensity: '1.2'
    },
    active: {
      scale: '0.98'
    },
    focus: {
      ringWidth: '2px',
      ringOffset: '2px'
    }
  },

  // Typography enhancements
  typography: {
    fontWeights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625'
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em'
    }
  },

  // Component variants
  components: {
    button: {
      sizes: {
        xs: { height: '1.5rem', padding: '0 0.5rem', fontSize: '0.75rem' },
        sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.875rem' },
        md: { height: '2.5rem', padding: '0 1rem', fontSize: '0.875rem' },
        lg: { height: '3rem', padding: '0 1.5rem', fontSize: '1rem' },
        xl: { height: '3.5rem', padding: '0 2rem', fontSize: '1.125rem' }
      }
    },
    card: {
      variants: {
        default: { padding: '1.5rem', borderRadius: '0.5rem' },
        compact: { padding: '1rem', borderRadius: '0.375rem' },
        spacious: { padding: '2rem', borderRadius: '0.75rem' }
      }
    }
  },

  // Responsive breakpoints
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080
  }
} as const

export type ThemeConfig = typeof themeConfig
