import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			// Enhanced semantic colors
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		// Enhanced spacing tokens
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem',
  		},
  		// Enhanced shadow system
  		boxShadow: {
  			'soft': '0 2px 4px -1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  			'medium': '0 4px 8px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
  			'large': '0 8px 16px -4px rgb(0 0 0 / 0.1), 0 4px 8px -4px rgb(0 0 0 / 0.06)',
  			'glow': '0 0 20px -2px rgb(59 130 246 / 0.3)',
  			'glow-primary': '0 0 20px -2px hsl(var(--primary) / 0.3)',
  			'inner-soft': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
  			'focus': '0 0 0 2px hsl(var(--ring))',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			// Enhanced animations
  			'fade-in': {
  				from: { opacity: '0' },
  				to: { opacity: '1' }
  			},
  			'slide-in-up': {
  				from: { 
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				to: { 
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-left': {
  				from: { 
  					opacity: '0',
  					transform: 'translateX(-10px)'
  				},
  				to: { 
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			'scale-in': {
  				from: { 
  					opacity: '0',
  					transform: 'scale(0.95)'
  				},
  				to: { 
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			'pulse-glow': {
  				'0%, 100%': { 
  					boxShadow: '0 0 20px -2px hsl(var(--primary) / 0.3)'
  				},
  				'50%': { 
  					boxShadow: '0 0 30px -2px hsl(var(--primary) / 0.6)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'slide-in-up': 'slide-in-up 0.3s ease-out',
  			'slide-in-left': 'slide-in-left 0.3s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  			// Staggered animations
  			'stagger-1': 'slide-in-up 0.3s ease-out 0.1s both',
  			'stagger-2': 'slide-in-up 0.3s ease-out 0.2s both',
  			'stagger-3': 'slide-in-up 0.3s ease-out 0.3s both',
  			'stagger-4': 'slide-in-up 0.3s ease-out 0.4s both',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
