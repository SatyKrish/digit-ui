import type { Metadata } from 'next'
import './globals.css'
import { ThemeScript } from '@/components/theme-script'

export const metadata: Metadata = {
  title: 'Digit',
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
