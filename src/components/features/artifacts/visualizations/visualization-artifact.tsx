"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Minus, Target, Clock, CheckCircle } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
  icon?: React.ReactNode
}

function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-success"
      case "down":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="group hover:shadow-medium transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-background to-muted/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-xs font-medium">
                {change > 0 ? "+" : ""}{change}%
              </span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500 group-hover:from-primary group-hover:to-primary/80"
              style={{ width: change ? `${Math.min(Math.abs(change), 100)}%` : "0%" }}
            />
          </div>
        </div>
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
    icon?: React.ReactNode
  }>
  title?: string
}

function KPIDashboard({ metrics, title }: KPIDashboardProps) {
  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {metrics.length} metrics
          </Badge>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    description?: string
  }>
  title?: string
}

function ProgressTracker({ items, title }: ProgressTrackerProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-warning" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "border-success/20 bg-success/5"
      case "in-progress":
        return "border-warning/20 bg-warning/5"
      default:
        return "border-muted/20 bg-muted/5"
    }
  }

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {items.length} items
          </Badge>
        </div>
      )}
      <div className="space-y-4">
        {items.map((item, index) => {
          const progressValue = item.target ? (item.value / item.target) * 100 : item.value
          return (
            <Card key={index} className={`border transition-all duration-300 hover:shadow-medium ${getStatusColor(item.status)}`}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <span className="font-semibold text-foreground">{item.label}</span>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        {item.value.toLocaleString()}
                        {item.target && ` / ${item.target.toLocaleString()}`}
                      </span>
                      {item.status && (
                        <Badge
                          variant={
                            item.status === "completed" ? "default" : 
                            item.status === "in-progress" ? "secondary" : "outline"
                          }
                          className="text-xs"
                        >
                          {item.status.replace('-', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress 
                      value={progressValue} 
                      className="h-3 bg-muted/30"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span className="font-medium">{progressValue.toFixed(1)}%</span>
                      <span>{item.target || 100}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
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
        <Card className="bg-gradient-to-br from-background to-muted/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                <span className="text-xs">🎯</span>
              </div>
              {title || "Custom Visualization"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <pre className="text-sm overflow-auto max-h-40 text-foreground">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm">
                View Raw Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )
  }
}
