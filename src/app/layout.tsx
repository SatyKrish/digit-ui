import type { Metadata } from 'next'
import './globals.css'
import { ThemeScript } from '@/components/features/layout/theme-script'
import { MsalAuthProvider } from '@/components/features/auth/msal-provider'
import { ThemeProvider } from '@/components/features/layout/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'

export const metadata: Metadata = {
  title: 'DiGIT',
  description: 'AI-powered Enterprise Data Intelligence Platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen={false}>
            <MsalAuthProvider>
              {children}
            </MsalAuthProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
