"use client"

import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from 'next-themes'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// Import KaTeX CSS for math rendering
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface CodeBlockProps {
  node?: any
  inline?: boolean
  className?: string
  children: React.ReactNode
}

// Memoized CodeBlock component for better performance
const CodeBlock = memo(({ node, inline, className, children, ...props }: CodeBlockProps) => {
  const { theme } = useTheme()
  const [copied, setCopied] = useState(false)
  
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  
  const codeString = String(children).replace(/\n$/, '')

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (inline) {
    return (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
        {...props}
      >
        {children}
      </code>
    )
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50 rounded-t-lg">
        <span className="text-xs font-medium text-muted-foreground">
          {language || 'text'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={copyToClipboard}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        style={theme === 'dark' ? oneDark : oneLight}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
        }}
        codeTagProps={{
          style: {
            fontSize: '0.875rem',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          },
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  )
})

CodeBlock.displayName = 'CodeBlock'

// Memoized MarkdownRenderer component
export const MarkdownRenderer = memo(({ content, className }: MarkdownRendererProps) => {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock,
          pre: ({ children }) => <div className="overflow-hidden rounded-lg">{children}</div>,
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold tracking-tight">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold tracking-tight">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold tracking-tight">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-semibold tracking-tight">{children}</h6>
          ),
          p: ({ children }) => (
            <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
          ),
          li: ({ children }) => <li className="mt-2">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-6 border-l-2 border-border pl-6 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-6 w-full overflow-y-auto">
              <table className="w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 text-left font-bold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2">{children}</td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-lg border border-border max-w-full h-auto"
            />
          ),
          hr: () => <hr className="my-4 border-border" />,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})

MarkdownRenderer.displayName = 'MarkdownRenderer'
