"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
}

function MetricCard({ title, value, change, trend }: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
        {change !== undefined && (
          <p className={`text-xs ${getTrendColor()}`}>
            {change > 0 ? "+" : ""}
            {change}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface KPIDashboardProps {
  metrics: Array<{
    title: string
    value: string | number
    change?: number
    trend?: "up" | "down" | "neutral"
  }>
  title?: string
}

function KPIDashboard({ metrics, title }: KPIDashboardProps) {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
    </div>
  )
}

interface ProgressTrackerProps {
  items: Array<{
    label: string
    value: number
    target?: number
    status?: "completed" | "in-progress" | "pending"
  }>
  title?: string
}

function ProgressTracker({ items, title }: ProgressTrackerProps) {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {item.value}
                  {item.target && `/${item.target}`}
                </span>
                {item.status && (
                  <Badge
                    variant={
                      item.status === "completed" ? "default" : item.status === "in-progress" ? "secondary" : "outline"
                    }
                  >
                    {item.status}
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={item.target ? (item.value / item.target) * 100 : item.value} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface VisualizationArtifactProps {
  type: "kpi" | "progress" | "custom"
  data: any
  title?: string
}

export function VisualizationArtifact({ type, data, title }: VisualizationArtifactProps) {
  switch (type) {
    case "kpi":
      return <KPIDashboard metrics={data} title={title} />

    case "progress":
      return <ProgressTracker items={data} title={title} />

    default:
      return (
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{title || "Custom Visualization"}</h3>
          <pre className="text-sm bg-muted p-2 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )
  }
}
