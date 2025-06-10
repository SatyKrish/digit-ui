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
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function ChartArtifact({ data, chartType = "bar", title, xKey, yKey }: ChartArtifactProps) {
  const [currentChartType, setCurrentChartType] = useState(chartType)

  // Auto-detect keys if not provided
  const keys = Object.keys(data[0] || {})
  const defaultXKey = xKey || keys[0]
  const defaultYKey = yKey || keys.find((key) => typeof data[0]?.[key] === "number") || keys[1]

  const renderChart = () => {
    switch (currentChartType) {
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={defaultXKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={defaultYKey} stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        )

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={defaultYKey}
              nameKey={defaultXKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )

      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={defaultXKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={defaultYKey} fill="#8884d8" />
          </BarChart>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        <Select value={currentChartType} onValueChange={(value: any) => setCurrentChartType(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
            <SelectItem value="pie">Pie Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground">
        Data points: {data.length} | X-axis: {defaultXKey} | Y-axis: {defaultYKey}
      </div>
    </div>
  )
}
