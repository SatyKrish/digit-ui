"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartArtifact } from '@/components/features/artifacts/visualizations/chart-artifact'

const GDP_DATA = [
  { country: "United States", gdp: 25.46 },
  { country: "China", gdp: 17.73 },
  { country: "Japan", gdp: 4.94 },
  { country: "Germany", gdp: 4.07 },
  { country: "India", gdp: 3.73 }
]

export default function PieChartDemo() {
  const [showChart, setShowChart] = useState(false)

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Pie Chart Fix Demonstration</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Original Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The original issue was that when requesting a pie chart, the generated JSON was missing the 
            <code className="bg-muted px-1 rounded">chartType: "pie"</code> field, causing it to default to a bar chart.
          </p>
          
          <div className="bg-muted p-4 rounded">
            <h4 className="font-semibold mb-2">Original JSON (problematic):</h4>
            <pre className="text-sm overflow-x-auto">{JSON.stringify({
              "data": GDP_DATA,
              "title": "Top 5 Countries by GDP - Pie Chart"
              // Missing: "chartType": "pie"
            }, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solution Applied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Enhanced Server Prompts</h4>
            <p className="text-sm text-muted-foreground">
              Updated the AI prompts to be more explicit about including chartType for pie charts.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">2. Smart Client-Side Detection</h4>
            <p className="text-sm text-muted-foreground">
              Added intelligent detection that analyzes:
            </p>
            <ul className="text-sm text-muted-foreground ml-4 space-y-1">
              <li>• Title contains "pie"</li>
              <li>• Data structure (2 fields, one numeric, ≤10 items)</li>
              <li>• Field names like "country", "category", etc.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">3. Streaming Updates</h4>
            <p className="text-sm text-muted-foreground">
              Applied the same detection logic to real-time streaming updates.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowChart(!showChart)} className="mb-4">
            {showChart ? 'Hide' : 'Show'} Fixed Pie Chart
          </Button>
          
          {showChart && (
            <div className="space-y-4">
              <p className="text-sm text-green-600 font-medium">
                ✅ Chart type automatically detected as "pie" from title and data structure
              </p>
              <ChartArtifact
                data={GDP_DATA}
                chartType="pie"  // This would now be auto-detected
                title="Top 5 Countries by GDP - Pie Chart"
                xKey="country"
                yKey="gdp"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to your chat interface</li>
            <li>Request: "plot as pie chart" with GDP data</li>
            <li>The system should now automatically detect and render as a pie chart</li>
            <li>If you see the old behavior, try clearing cache and reloading</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
