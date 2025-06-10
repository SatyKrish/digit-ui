"use client"

import { useState, useEffect, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface GeoPoint {
  lat: number
  lng: number
  value?: number
  label?: string
  category?: string
  [key: string]: any
}

interface GeoRegion {
  id: string
  name: string
  value?: number
  color?: string
  [key: string]: any
}

interface GeoData {
  points?: GeoPoint[]
  regions?: GeoRegion[]
  center?: { lat: number; lng: number }
  zoom?: number
}

interface GeospatialArtifactProps {
  data: GeoData
  title?: string
  mapType?: "basic" | "satellite" | "dark"
}

export function GeospatialArtifact({
  data,
  title = "Geospatial Visualization",
  mapType = "basic",
}: GeospatialArtifactProps) {
  const [selectedMapType, setSelectedMapType] = useState(mapType)
  const [pointSize, setPointSize] = useState(50)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Default center and zoom if not provided
  const defaultCenter = data.center || { lat: 40.7128, lng: -74.006 }
  const defaultZoom = data.zoom || 3

  // Simulate map loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <Select
            value={selectedMapType}
            onValueChange={(value: "basic" | "satellite" | "dark") => setSelectedMapType(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.points && data.points.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="point-size">Point Size</Label>
            <span className="text-xs text-muted-foreground">{pointSize}%</span>
          </div>
          <Slider
            id="point-size"
            min={10}
            max={100}
            step={5}
            value={[pointSize]}
            onValueChange={(value) => setPointSize(value[0])}
          />
        </div>
      )}

      <div
        ref={mapContainerRef}
        className={`h-80 w-full rounded-md border overflow-hidden relative ${
          selectedMapType === "dark"
            ? "bg-slate-800"
            : selectedMapType === "satellite"
              ? "bg-slate-700"
              : "bg-slate-200"
        }`}
      >
        {!mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Simulated Map Background */}
            <div className="absolute inset-0">
              <div
                className={`w-full h-full ${
                  selectedMapType === "dark"
                    ? "bg-[url('/placeholder.svg?height=400&width=800&text=Dark+Map')] bg-slate-800"
                    : selectedMapType === "satellite"
                      ? "bg-[url('/placeholder.svg?height=400&width=800&text=Satellite+Map')] bg-slate-700"
                      : "bg-[url('/placeholder.svg?height=400&width=800&text=Basic+Map')] bg-slate-200"
                }`}
              ></div>
            </div>

            {/* Simulated Data Points */}
            {data.points &&
              data.points.map((point, index) => {
                // Calculate position based on lat/lng (simplified for demo)
                const x = ((point.lng + 180) / 360) * 100
                const y = ((90 - point.lat) / 180) * 100

                // Calculate point size based on value
                const minValue = Math.min(...data.points.map((p) => p.value || 1))
                const maxValue = Math.max(...data.points.map((p) => p.value || 1))
                const valueRange = maxValue - minValue
                const normalizedValue = valueRange === 0 ? 1 : ((point.value || 1) - minValue) / valueRange
                const size = 8 + normalizedValue * 16 * (pointSize / 100)

                return (
                  <div
                    key={index}
                    className="absolute rounded-full bg-primary opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      transform: "translate(-50%, -50%)",
                      backgroundColor: point.color || "var(--primary)",
                    }}
                    title={point.label || `${point.lat}, ${point.lng}`}
                  />
                )
              })}

            {/* Map Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button className="bg-background w-8 h-8 rounded-md flex items-center justify-center shadow-md">
                <span className="text-lg">+</span>
              </button>
              <button className="bg-background w-8 h-8 rounded-md flex items-center justify-center shadow-md">
                <span className="text-lg">−</span>
              </button>
            </div>

            {/* Legend */}
            {data.points && data.points.some((p) => p.category) && (
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md">
                <p className="text-xs font-medium mb-1">Categories</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(data.points.map((p) => p.category).filter(Boolean))).map((category, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {data.points && <span>Showing {data.points.length} data points</span>}
        {data.regions && <span>Showing {data.regions.length} regions</span>}
        {!data.points && !data.regions && <span>No data points or regions available</span>}
      </div>
    </div>
  )
}
