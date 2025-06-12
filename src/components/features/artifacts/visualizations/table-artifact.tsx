"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, Search, Download, Filter, Eye, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TableData {
  [key: string]: any
}

interface TableArtifactProps {
  data: TableData[]
  title?: string
  pageSize?: number
}

type SortDirection = "asc" | "desc" | null

export function TableArtifact({ data, title, pageSize = 10 }: TableArtifactProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPageSize, setSelectedPageSize] = useState(pageSize)
  const [filterColumn, setFilterColumn] = useState<string>("all")

  const columns = Object.keys(data[0] || {})

  // Enhanced data processing with filtering
  const processedData = useMemo(() => {
    let filtered = data.filter((row) => {
      const searchMatch = Object.values(row).some((value) => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      const columnMatch = filterColumn === "all" || 
        (row[filterColumn] && String(row[filterColumn]).toLowerCase().includes(searchTerm.toLowerCase()))
      
      return searchTerm ? (filterColumn === "all" ? searchMatch : columnMatch) : true
    })

    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal
        }

        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()

        if (sortDirection === "asc") {
          return aStr.localeCompare(bStr)
        } else {
          return bStr.localeCompare(aStr)
        }
      })
    }

    return filtered
  }, [data, searchTerm, sortColumn, sortDirection, filterColumn])

  // Pagination
  const totalPages = Math.ceil(processedData.length / selectedPageSize)
  const paginatedData = processedData.slice(currentPage * selectedPageSize, (currentPage + 1) * selectedPageSize)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc")
      if (sortDirection === "desc") {
        setSortColumn(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
    setCurrentPage(0)
  }

  const formatCellValue = (value: any, column: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">—</span>
    }
    
    if (typeof value === "number") {
      return (
        <span className="font-mono">
          {value.toLocaleString()}
        </span>
      )
    }
    
    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {String(value)}
        </Badge>
      )
    }
    
    if (typeof value === "string" && value.startsWith("http")) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline text-sm"
        >
          Link
        </a>
      )
    }
    
    const stringValue = String(value)
    if (stringValue.length > 50) {
      return (
        <div className="group relative">
          <span className="truncate block max-w-[200px]">
            {stringValue.substring(0, 50)}...
          </span>
          <div className="invisible group-hover:visible absolute z-10 top-0 left-0 bg-popover text-popover-foreground p-2 rounded border shadow-lg max-w-xs">
            {stringValue}
          </div>
        </div>
      )
    }
    
    return <span className="text-foreground">{stringValue}</span>
  }

  const exportToCSV = () => {
    const headers = columns.join(",")
    const rows = processedData
      .map((row) => columns.map((col) => `"${String(row[col]).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title || "data"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const json = JSON.stringify(processedData, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title || "data"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate statistics
  const stats = {
    total: data.length,
    filtered: processedData.length,
    columns: columns.length,
    numericColumns: columns.filter(col => 
      data.some(row => typeof row[col] === 'number')
    ).length
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/10">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          {/* Title and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {title && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                </div>
              )}
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {stats.filtered.toLocaleString()} rows
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.columns} columns
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportToCSV}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToJSON}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                placeholder="Search in all columns..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(0)
                }}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterColumn} onValueChange={setFilterColumn}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All columns</SelectItem>
                  {columns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedPageSize.toString()} 
                onValueChange={(value) => {
                  setSelectedPageSize(Number(value))
                  setCurrentPage(0)
                }}
              >
                <SelectTrigger className="w-24">
                  <Eye className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Table */}
        <div className="rounded-lg border border-border/50 overflow-hidden bg-background/50">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-muted/40">
                {columns.map((column) => (
                  <TableHead 
                    key={column} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors font-semibold"
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">{column}</span>
                      <div className="flex items-center">
                        {sortColumn === column && (
                          <div className="text-primary">
                            {sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow 
                  key={index} 
                  className="hover:bg-muted/20 transition-colors border-border/50"
                >
                  {columns.map((column) => (
                    <TableCell key={column} className="py-3">
                      {formatCellValue(row[column], column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <div className="text-sm text-muted-foreground">
              Showing {currentPage * selectedPageSize + 1} to{" "}
              {Math.min((currentPage + 1) * selectedPageSize, processedData.length)} of{" "}
              {processedData.length} entries
              {searchTerm && (
                <span className="ml-2">
                  (filtered from {data.length} total)
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage < 3 ? i : currentPage - 2 + i
                  if (pageNum >= totalPages) return null
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum + 1}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>
              {processedData.length === data.length 
                ? `${data.length} total rows` 
                : `${processedData.length} of ${data.length} rows shown`
              }
            </span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
