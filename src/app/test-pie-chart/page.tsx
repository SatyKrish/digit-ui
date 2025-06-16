"use client"

import { ChartArtifact } from '@/components/features/artifacts/visualizations/chart-artifact'

const testData = [
  { country: "United States", gdp: 25.46 },
  { country: "China", gdp: 17.73 },
  { country: "Japan", gdp: 4.94 },
  { country: "Germany", gdp: 4.07 },
  { country: "India", gdp: 3.73 }
]

export default function TestPieChart() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Pie Chart Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test 1: Explicit Pie Chart</h2>
        <ChartArtifact
          data={testData}
          chartType="pie"
          title="Top 5 Countries by GDP - Pie Chart"
          xKey="country"
          yKey="gdp"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test 2: Bar Chart (for comparison)</h2>
        <ChartArtifact
          data={testData}
          chartType="bar"
          title="Top 5 Countries by GDP - Bar Chart"
          xKey="country"
          yKey="gdp"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test 3: Auto-detected keys</h2>
        <ChartArtifact
          data={testData}
          chartType="pie"
          title="Top 5 Countries by GDP - Auto Keys"
        />
      </div>
    </div>
  )
}
