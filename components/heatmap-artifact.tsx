"use client"

import { useState } from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface HeatmapData {
  x: string | number
  y: string | number
  value: number
  [key: string]: any
}

interface HeatmapArtifactProps {
  data: HeatmapData[]
  title?: string
  xLabel?: string
  yLabel?: string
  colorRange?: [string, string]
}

export function HeatmapArtifact({
  data,
  title = "Heatmap",
  xLabel = "X Axis",
  yLabel = "Y Axis",
  colorRange = ["#8884d8", "#ff0000"],
}: HeatmapArtifactProps) {
  const [colorIntensity, setColorIntensity] = useState(100)
  const [viewType, setViewType] = useState<"heatmap" | "bubble">("heatmap")

  // Find min and max values for color scaling
  const minValue = Math.min(...data.map((item) => item.value))
  const maxValue = Math.max(...data.map((item) => item.value))
  const valueRange = maxValue - minValue

  // Generate color based on value
  const getColor = (value: number) => {
    const startColor = colorRange[0]
    const endColor = colorRange[1]

    // Convert hex to RGB
    const startRGB = {
      r: Number.parseInt(startColor.slice(1, 3), 16),
      g: Number.parseInt(startColor.slice(3, 5), 16),
      b: Number.parseInt(startColor.slice(5, 7), 16),
    }

    const endRGB = {
      r: Number.parseInt(endColor.slice(1, 3), 16),
      g: Number.parseInt(endColor.slice(3, 5), 16),
      b: Number.parseInt(endColor.slice(5, 7), 16),
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
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="text-xs font-medium">{`${data.x} × ${data.y}`}</p>
          <p className="text-xs text-muted-foreground">{`Value: ${data.value}`}</p>
          {data.label && <p className="text-xs">{data.label}</p>}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <Select value={viewType} onValueChange={(value: "heatmap" | "bubble") => setViewType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="heatmap">Heatmap</SelectItem>
              <SelectItem value="bubble">Bubble Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
        />
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="category"
              dataKey="x"
              name={xLabel}
              tick={{ fontSize: 12 }}
              label={{ value: xLabel, position: "insideBottom", offset: -10 }}
            />
            <YAxis
              type="category"
              dataKey="y"
              name={yLabel}
              tick={{ fontSize: 12 }}
              label={{ value: yLabel, angle: -90, position: "insideLeft" }}
            />
            <ZAxis type="number" dataKey="value" range={viewType === "bubble" ? [50, 500] : [500, 500]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Values" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <div>Min: {minValue}</div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gradient-to-r from-[#8884d8] to-[#ff0000]"></div>
        </div>
        <div>Max: {maxValue}</div>
      </div>
    </div>
  )
}
