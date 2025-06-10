"use client"

import { useState } from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface TreemapNode {
  name: string
  size?: number
  value?: number
  children?: TreemapNode[]
  color?: string
  [key: string]: any
}

interface TreemapArtifactProps {
  data: TreemapNode
  title?: string
  colorScheme?: "default" | "blue" | "green" | "rainbow"
}

const COLORS = {
  default: ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", "#d0ed57", "#ffc658"],
  blue: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#83a6ed", "#8dd1e1"],
  green: ["#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722"],
  rainbow: ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"],
}

export function TreemapArtifact({ data, title = "Treemap", colorScheme = "default" }: TreemapArtifactProps) {
  const [selectedColorScheme, setSelectedColorScheme] = useState<"default" | "blue" | "green" | "rainbow">(colorScheme)
  const [dataKey, setDataKey] = useState<"size" | "value">("value")

  // Prepare data - ensure all nodes have a unique key
  const prepareData = (node: TreemapNode, depth = 0): TreemapNode => {
    const colors = COLORS[selectedColorScheme]
    const colorIndex = depth % colors.length

    return {
      ...node,
      color: node.color || colors[colorIndex],
      children: node.children ? node.children.map((child, i) => prepareData(child, depth + 1)) : undefined,
    }
  }

  const processedData = prepareData(data)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="text-xs font-medium">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            {dataKey === "value" ? "Value" : "Size"}: {data[dataKey]?.toLocaleString()}
          </p>
          {data.category && (
            <Badge variant="outline" className="mt-1 text-xs">
              {data.category}
            </Badge>
          )}
        </div>
      )
    }
    return null
  }

  // Custom treemap content
  const CustomizedContent = (props: any) => {
    const { x, y, width, height, name, depth, index, value, size, color } = props
    const displayValue = dataKey === "value" ? value : size

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: "#fff",
            strokeWidth: 2 / (depth + 1),
            strokeOpacity: 1 / (depth + 1),
          }}
        />
        {width > 30 && height > 30 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 8}
              textAnchor="middle"
              fill="#fff"
              fontSize={10}
              fontWeight="bold"
              className="select-none pointer-events-none"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 8}
              textAnchor="middle"
              fill="#fff"
              fontSize={8}
              className="select-none pointer-events-none"
            >
              {displayValue?.toLocaleString()}
            </text>
          </>
        )}
      </g>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <Select value={dataKey} onValueChange={(value: "size" | "value") => setDataKey(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedColorScheme}
            onValueChange={(value: "default" | "blue" | "green" | "rainbow") => setSelectedColorScheme(value)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="rainbow">Rainbow</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={[processedData]}
            dataKey={dataKey}
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="#8884d8"
            content={<CustomizedContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing data by {dataKey === "value" ? "value" : "size"} • Click on sections to explore
      </div>
    </div>
  )
}
