"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TrendingUp, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react"
import { useTheme } from "next-themes"

interface ChartData {
  [key: string]: any
}

interface ChartArtifactProps {
  data: ChartData[]
  chartType?: "bar" | "line" | "pie" | "area"
  title?: string
  xKey?: string
  yKey?: string
}

// Enhanced color palette with better accessibility
const COLORS = {
  light: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"],
  dark: ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#22d3ee", "#a3e635", "#fb923c"]
}

const CHART_ICONS = {
  bar: BarChart3,
  line: LineChartIcon, 
  pie: PieChartIcon,
  area: TrendingUp,
}

export function ChartArtifact({ data, chartType = "bar", title, xKey, yKey }: ChartArtifactProps) {
  const [currentChartType, setCurrentChartType] = useState(chartType)
  const { theme } = useTheme()

  // Handle empty or invalid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="w-full bg-gradient-to-br from-background to-muted/20 border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {title && (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                </div>
              )}
              <Badge variant="outline" className="text-xs text-orange-600">
                No data
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full flex items-center justify-center border border-dashed border-border/50 rounded-lg">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No data available</p>
                <p className="text-xs text-muted-foreground">Chart data is empty or invalid</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Auto-detect keys if not provided - improved logic
  const keys = Object.keys(data[0] || {})
  const defaultXKey = xKey || keys[0] || 'category'
  
  // For yKey, find the first numeric field, or fall back to the second key
  let defaultYKey = yKey
  if (!defaultYKey) {
    // Find first numeric field that's not the X key
    defaultYKey = keys.find((key) => 
      key !== defaultXKey && typeof data[0]?.[key] === "number"
    ) || keys[1] || 'value'
  }

  // For multi-series data, get all numeric keys (excluding X key)
  const numericKeys = keys.filter(key => 
    key !== defaultXKey && typeof data[0]?.[key] === "number"
  )

  // Debug logging for data structure issues
  console.log('[CHART] Data analysis:', {
    dataLength: data.length,
    firstItem: data[0],
    keys,
    defaultXKey,
    defaultYKey,
    numericKeys,
    isMultiSeries: numericKeys.length > 1
  })

  // Choose colors based on theme
  const colors = COLORS[theme === "dark" ? "dark" : "light"]

  // Calculate statistics - handle both single and multi-series data
  let total, average, max, min
  
  if (numericKeys.length > 1) {
    // Multi-series: sum all numeric values
    total = data.reduce((sum, item) => {
      return sum + numericKeys.reduce((itemSum, key) => itemSum + (item[key] || 0), 0)
    }, 0)
    const allValues = data.flatMap(item => numericKeys.map(key => item[key] || 0))
    average = total / allValues.length
    max = Math.max(...allValues)
    min = Math.min(...allValues)
  } else {
    // Single series: use primary Y key
    total = data.reduce((sum, item) => sum + (item[defaultYKey] || 0), 0)
    average = total / data.length
    max = Math.max(...data.map(item => item[defaultYKey] || 0))
    min = Math.min(...data.map(item => item[defaultYKey] || 0))
  }

  // Custom tooltip styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm p-3 rounded-lg border border-border shadow-lg">
          <p className="font-medium text-foreground">{`${defaultXKey}: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    }

    switch (currentChartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
            <XAxis 
              dataKey={defaultXKey} 
              stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
              fontSize={12}
            />
            <YAxis stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Render multiple lines for multi-series data */}
            {numericKeys.length > 1 ? (
              numericKeys.map((key, index) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index % colors.length]} 
                  strokeWidth={3}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                />
              ))
            ) : (
              <Line 
                type="monotone" 
                dataKey={defaultYKey} 
                stroke={colors[0]} 
                strokeWidth={3}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              />
            )}
          </LineChart>
        )

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
            <XAxis 
              dataKey={defaultXKey} 
              stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
              fontSize={12}
            />
            <YAxis stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Render multiple areas for multi-series data */}
            {numericKeys.length > 1 ? (
              numericKeys.map((key, index) => (
                <Area 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index % colors.length]} 
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))
            ) : (
              <Area 
                type="monotone" 
                dataKey={defaultYKey} 
                stroke={colors[0]} 
                fill={colors[0]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            )}
          </AreaChart>
        )

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey={defaultYKey}
              nameKey={defaultXKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        )

      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
            <XAxis 
              dataKey={defaultXKey} 
              stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
              fontSize={12}
            />
            <YAxis stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Render multiple bars for multi-series data */}
            {numericKeys.length > 1 ? (
              numericKeys.map((key, index) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  fill={colors[index % colors.length]} 
                  radius={[4, 4, 0, 0]}
                />
              ))
            ) : (
              <Bar dataKey={defaultYKey} fill={colors[0]} radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            )}
          </BarChart>
        )
    }
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/20 border border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {title && (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              </div>
            )}
            <Badge variant="outline" className="text-xs">
              {data.length} data points
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={currentChartType} onValueChange={(value: any) => setCurrentChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-foreground">{total.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="font-semibold text-foreground">{average.toFixed(1)}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="font-semibold text-foreground">{max.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="font-semibold text-foreground">{min.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>X-axis: {defaultXKey}</span>
            <span>Y-axis: {defaultYKey}</span>
          </div>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
