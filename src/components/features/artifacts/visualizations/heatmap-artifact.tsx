"use client"

import { useState } from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Palette, Eye } from "lucide-react"
import { useTheme } from "next-themes"

interface HeatmapData {
  x: string | number
  y: string | number
  value: number
  category?: string
  label?: string
  [key: string]: any
}

interface HeatmapArtifactProps {
  data: HeatmapData[]
  title?: string
  xLabel?: string
  yLabel?: string
  colorRange?: [string, string]
}

// Enhanced color schemes
const COLOR_SCHEMES = {
  default: ["#3b82f6", "#ef4444"],
  heat: ["#fbbf24", "#dc2626"],
  cool: ["#06b6d4", "#1e40af"],
  nature: ["#84cc16", "#059669"],
  sunset: ["#f97316", "#be123c"],
  ocean: ["#0ea5e9", "#1e3a8a"],
}

export function HeatmapArtifact({
  data,
  title = "Heatmap Visualization",
  xLabel = "X Axis",
  yLabel = "Y Axis",
  colorRange = ["#3b82f6", "#ef4444"],
}: HeatmapArtifactProps) {
  const [colorIntensity, setColorIntensity] = useState(100)
  const [viewType, setViewType] = useState<"heatmap" | "bubble">("heatmap")
  const [selectedColorScheme, setSelectedColorScheme] = useState<keyof typeof COLOR_SCHEMES>("default")
  const { theme } = useTheme()

  // Find min and max values for color scaling
  const minValue = Math.min(...data.map((item) => item.value))
  const maxValue = Math.max(...data.map((item) => item.value))
  const valueRange = maxValue - minValue

  // Statistics
  const avgValue = data.reduce((sum, item) => sum + item.value, 0) / data.length
  const categories = Array.from(new Set(data.map(item => item.category).filter(Boolean)))

  // Generate color based on value using selected scheme
  const getColor = (value: number) => {
    const [startColor, endColor] = COLOR_SCHEMES[selectedColorScheme]

    // Convert hex to RGB
    const startRGB = {
      r: parseInt(startColor.slice(1, 3), 16),
      g: parseInt(startColor.slice(3, 5), 16),
      b: parseInt(startColor.slice(5, 7), 16),
    }

    const endRGB = {
      r: parseInt(endColor.slice(1, 3), 16),
      g: parseInt(endColor.slice(3, 5), 16),
      b: parseInt(endColor.slice(5, 7), 16),
    }

    // Calculate color based on value position in range
    const ratio = valueRange === 0 ? 0 : (value - minValue) / valueRange
    const adjustedRatio = ratio * (colorIntensity / 100)

    const r = Math.round(startRGB.r + adjustedRatio * (endRGB.r - startRGB.r))
    const g = Math.round(startRGB.g + adjustedRatio * (endRGB.g - startRGB.g))
    const b = Math.round(startRGB.b + adjustedRatio * (endRGB.b - startRGB.b))

    return `rgb(${r}, ${g}, ${b})`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background/95 backdrop-blur-sm p-3 rounded-lg border border-border shadow-lg">
          <p className="font-medium text-foreground">{`${data.x} × ${data.y}`}</p>
          <p className="text-sm text-muted-foreground">Value: {data.value.toLocaleString()}</p>
          {data.category && (
            <Badge variant="outline" className="mt-1 text-xs">
              {data.category}
            </Badge>
          )}
          {data.label && <p className="text-xs mt-1">{data.label}</p>}
        </div>
      )
    }
    return null
  }

  const exportData = () => {
    const csv = [
      [xLabel, yLabel, "Value", "Category"].join(","),
      ...data.map(item => [item.x, item.y, item.value, item.category || ""].join(","))
    ].join("\n")
    
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-sm">🔥</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {data.length} data points • {categories.length} categories
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="font-semibold text-foreground">{minValue.toFixed(1)}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Avg</p>
            <p className="font-semibold text-foreground">{avgValue.toFixed(1)}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="font-semibold text-foreground">{maxValue.toFixed(1)}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Range</p>
            <p className="font-semibold text-foreground">{valueRange.toFixed(1)}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-4">
            <Select value={viewType} onValueChange={(value: "heatmap" | "bubble") => setViewType(value)}>
              <SelectTrigger className="w-40">
                <Eye className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heatmap">Heatmap</SelectItem>
                <SelectItem value="bubble">Bubble Chart</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={selectedColorScheme} 
              onValueChange={(value: keyof typeof COLOR_SCHEMES) => setSelectedColorScheme(value)}
            >
              <SelectTrigger className="w-40">
                <Palette className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="heat">Heat</SelectItem>
                <SelectItem value="cool">Cool</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
                <SelectItem value="sunset">Sunset</SelectItem>
                <SelectItem value="ocean">Ocean</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="color-intensity">Color Intensity</Label>
              <span className="text-xs text-muted-foreground">{colorIntensity}%</span>
            </div>
            <Slider
              id="color-intensity"
              min={10}
              max={100}
              step={5}
              value={[colorIntensity]}
              onValueChange={(value) => setColorIntensity(value[0])}
              className="flex-1"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 30,
                bottom: 40,
                left: 40,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme === "dark" ? "#374151" : "#e5e7eb"} 
              />
              <XAxis
                type="category"
                dataKey="x"
                name={xLabel}
                tick={{ fontSize: 12, fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
                label={{ value: xLabel, position: "insideBottom", offset: -10 }}
              />
              <YAxis
                type="category"
                dataKey="y"
                name={yLabel}
                tick={{ fontSize: 12, fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
                label={{ value: yLabel, angle: -90, position: "insideLeft" }}
              />
              <ZAxis 
                type="number" 
                dataKey="value" 
                range={viewType === "bubble" ? [50, 400] : [400, 400]} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Values" data={data}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Color Legend */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Color Scale:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Low</span>
              <div 
                className="w-20 h-3 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${COLOR_SCHEMES[selectedColorScheme][0]}, ${COLOR_SCHEMES[selectedColorScheme][1]})`
                }}
              />
              <span className="text-xs text-muted-foreground">High</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Categories Legend */}
        {categories.length > 0 && (
          <div className="mt-4 p-4 bg-muted/20 rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Categories:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
