"use client"

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  Table as TableIcon, 
  Download, 
  Copy, 
  Plus, 
  Minus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Edit3,
  Trash2
} from 'lucide-react'

interface Cell {
  value: string | number
  type?: 'text' | 'number' | 'date' | 'boolean'
  formula?: string
}

interface SpreadsheetData {
  headers: string[]
  rows: Cell[][]
  metadata?: {
    title?: string
    description?: string
    rowCount?: number
    columnCount?: number
  }
}

interface SpreadsheetEditorProps {
  content?: string // CSV or JSON
  title?: string
  isCurrentVersion?: boolean
  currentVersionIndex?: number
  status?: 'streaming' | 'idle' | 'completed'
  onSaveContent?: (content: string, debounce?: boolean) => void
  className?: string
  readOnly?: boolean
}

interface SpreadsheetToolbarProps {
  onDownload: () => void
  onCopy: () => void
  onAddRow: () => void
  onAddColumn: () => void
  onRemoveRow: () => void
  onRemoveColumn: () => void
  rowCount: number
  columnCount: number
  selectedRow?: number
  selectedColumn?: number
  disabled?: boolean
}

function SpreadsheetToolbar({ 
  onDownload, 
  onCopy, 
  onAddRow, 
  onAddColumn, 
  onRemoveRow, 
  onRemoveColumn,
  rowCount,
  columnCount,
  selectedRow,
  selectedColumn,
  disabled 
}: SpreadsheetToolbarProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddRow}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddColumn}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Column
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemoveRow}
          disabled={disabled || selectedRow === undefined}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Minus className="h-4 w-4" />
          Remove Row
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemoveColumn}
          disabled={disabled || selectedColumn === undefined}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Minus className="h-4 w-4" />
          Remove Column
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {rowCount} × {columnCount}
        </Badge>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Copy to clipboard"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Download CSV"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function parseCSV(csvContent: string): SpreadsheetData {
  const lines = csvContent.trim().split('\n')
  if (lines.length === 0) {
    return { headers: ['Column A'], rows: [[{ value: '' }]] }
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows = lines.slice(1).map(line => 
    line.split(',').map(cell => ({
      value: cell.trim().replace(/"/g, ''),
      type: 'text' as const
    }))
  )

  return {
    headers,
    rows,
    metadata: {
      rowCount: rows.length,
      columnCount: headers.length
    }
  }
}

function formatCSV(data: SpreadsheetData): string {
  const csvLines = [
    data.headers.map(h => `"${h}"`).join(','),
    ...data.rows.map(row => 
      row.map(cell => `"${cell.value}"`).join(',')
    )
  ]
  return csvLines.join('\n')
}

function SpreadsheetPlaceholder({ status }: { status?: string }) {
  return (
    <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed border-border">
      <div className="text-center space-y-3">
        <div className="relative">
          <TableIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
          {status === 'streaming' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/60 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {status === 'streaming' ? 'Generating spreadsheet...' : 'No data available'}
          </p>
          {status === 'streaming' && (
            <div className="flex items-center justify-center gap-1">
              <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce delay-100"></div>
              <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce delay-200"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SpreadsheetEditor({ 
  content, 
  title,
  isCurrentVersion, 
  currentVersionIndex, 
  status, 
  onSaveContent,
  className,
  readOnly = false
}: SpreadsheetEditorProps) {
  const [data, setData] = useState<SpreadsheetData>({ headers: [], rows: [] })
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [selectedRow, setSelectedRow] = useState<number>()
  const [selectedColumn, setSelectedColumn] = useState<number>()
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (content) {
      try {
        // Try parsing as JSON first, then CSV
        const parsed = content.startsWith('{') || content.startsWith('[') 
          ? JSON.parse(content) 
          : parseCSV(content)
        setData(parsed)
      } catch (error) {
        console.error('Failed to parse spreadsheet content:', error)
        setData(parseCSV(content || ''))
      }
    } else {
      setData({ headers: ['Column A'], rows: [[{ value: '' }]] })
    }
  }, [content])

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (readOnly) return

    const newData = { ...data }
    if (!newData.rows[rowIndex]) {
      newData.rows[rowIndex] = []
    }
    if (!newData.rows[rowIndex][colIndex]) {
      newData.rows[rowIndex][colIndex] = { value: '', type: 'text' }
    }
    
    newData.rows[rowIndex][colIndex].value = value
    setData(newData)
    setIsEditing(true)

    if (onSaveContent) {
      onSaveContent(formatCSV(newData), true)
    }
  }

  const handleHeaderChange = (colIndex: number, value: string) => {
    if (readOnly) return

    const newData = { ...data }
    newData.headers[colIndex] = value
    setData(newData)
    setIsEditing(true)

    if (onSaveContent) {
      onSaveContent(formatCSV(newData), true)
    }
  }

  const handleAddRow = () => {
    if (readOnly) return

    const newData = { ...data }
    const newRow = data.headers.map(() => ({ value: '', type: 'text' as const }))
    newData.rows.push(newRow)
    setData(newData)
    setIsEditing(true)

    if (onSaveContent) {
      onSaveContent(formatCSV(newData), true)
    }
  }

  const handleAddColumn = () => {
    if (readOnly) return

    const newData = { ...data }
    const newColumnIndex = data.headers.length
    newData.headers.push(`Column ${String.fromCharCode(65 + newColumnIndex)}`)
    newData.rows.forEach(row => {
      row.push({ value: '', type: 'text' })
    })
    setData(newData)
    setIsEditing(true)

    if (onSaveContent) {
      onSaveContent(formatCSV(newData), true)
    }
  }

  const handleRemoveRow = () => {
    if (readOnly || selectedRow === undefined || data.rows.length <= 1) return

    const newData = { ...data }
    newData.rows.splice(selectedRow, 1)
    setData(newData)
    setSelectedRow(undefined)
    setIsEditing(true)

    if (onSaveContent) {
      onSaveContent(formatCSV(newData), true)
    }
  }

  const handleRemoveColumn = () => {
    if (readOnly || selectedColumn === undefined || data.headers.length <= 1) return

    const newData = { ...data }
    newData.headers.splice(selectedColumn, 1)
    newData.rows.forEach(row => {
      row.splice(selectedColumn, 1)
    })
    setData(newData)
    setSelectedColumn(undefined)
    setIsEditing(true)

    if (onSaveContent) {
      onSaveContent(formatCSV(newData), true)
    }
  }

  const handleDownload = () => {
    const csvContent = formatCSV(data)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = title ? `${title}.csv` : 'spreadsheet.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatCSV(data))
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const hasData = data.headers.length > 0 && data.rows.length > 0

  return (
    <div className={cn(
      "flex flex-col h-full border border-border rounded-lg overflow-hidden bg-background",
      className
    )}>
      <SpreadsheetToolbar
        onDownload={handleDownload}
        onCopy={handleCopy}
        onAddRow={handleAddRow}
        onAddColumn={handleAddColumn}
        onRemoveRow={handleRemoveRow}
        onRemoveColumn={handleRemoveColumn}
        rowCount={data.rows.length}
        columnCount={data.headers.length}
        selectedRow={selectedRow}
        selectedColumn={selectedColumn}
        disabled={!hasData || status === 'streaming' || readOnly}
      />
      
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          {status === 'streaming' && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              Generating...
            </Badge>
          )}
          {isEditing && !readOnly && (
            <Badge variant="outline" className="text-xs">
              Unsaved
            </Badge>
          )}
          {readOnly && (
            <Badge variant="outline" className="text-xs">
              Read-only
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {hasData ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="w-12 p-2 text-xs text-muted-foreground border-r border-border">#</th>
                {data.headers.map((header, colIndex) => (
                  <th 
                    key={colIndex}
                    className={cn(
                      "p-2 text-left font-medium border-r border-border min-w-[120px] cursor-pointer",
                      selectedColumn === colIndex && "bg-primary/10"
                    )}
                    onClick={() => setSelectedColumn(colIndex)}
                  >
                    <Input
                      value={header}
                      onChange={(e) => handleHeaderChange(colIndex, e.target.value)}
                      className="border-0 bg-transparent p-1 text-sm font-medium"
                      readOnly={readOnly}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className={cn(
                    "border-b border-border hover:bg-muted/10",
                    selectedRow === rowIndex && "bg-primary/5"
                  )}
                >
                  <td 
                    className="w-12 p-2 text-xs text-muted-foreground border-r border-border text-center cursor-pointer bg-muted/10"
                    onClick={() => setSelectedRow(rowIndex)}
                  >
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => (
                    <td 
                      key={colIndex}
                      className={cn(
                        "p-1 border-r border-border",
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                    >
                      <Input
                        value={cell.value}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="border-0 bg-transparent p-1 text-sm"
                        readOnly={readOnly}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <SpreadsheetPlaceholder status={status} />
        )}
      </div>
      
      {hasData && (
        <div className="p-3 border-t border-border bg-muted/10">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{data.rows.length} rows × {data.headers.length} columns</span>
              {selectedCell && (
                <span>
                  Selected: {String.fromCharCode(65 + selectedCell.col)}{selectedCell.row + 1}
                </span>
              )}
            </div>
            <span>Click cells to edit, headers to rename columns</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpreadsheetEditor
