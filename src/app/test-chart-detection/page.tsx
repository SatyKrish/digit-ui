"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Import the chart artifact content component for testing
function ChartArtifactContent({ content, metadata }: any) {
  // This is a simplified version of the detection logic for testing
  
  let chartData: any = null;
  let parseError: string | null = null;
  
  if (content && content.trim()) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
        // Auto-detect chart type
        let detectedChartType = 'bar'; // default
        
        // Priority 1: Explicit chartType
        if (parsed.chartType) {
          detectedChartType = parsed.chartType;
        }
        // Priority 2: Title-based detection
        else if ((parsed.title || '').toLowerCase().includes('pie')) {
          detectedChartType = 'pie';
        }
        // Priority 3: Data structure hints for your specific case
        else if (parsed.data.length <= 10) {
          const firstItem = parsed.data[0];
          const keys = Object.keys(firstItem || {});
          const numericKeys = keys.filter(key => typeof firstItem[key] === 'number');
          
          if (keys.length === 2 && numericKeys.length === 1) {
            const textKey = keys.find(key => typeof firstItem[key] !== 'number');
            if (textKey && ['category', 'country', 'type', 'name', 'label'].some(hint => 
                textKey.toLowerCase().includes(hint))) {
              detectedChartType = 'pie';
            }
          }
        }
        
        chartData = {
          chartType: detectedChartType,
          title: parsed.title || 'Chart',
          data: parsed.data,
        };
      } else {
        parseError = 'Invalid chart data structure';
      }
    } catch (error) {
      parseError = `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  return (
    <div className="space-y-4">
      {parseError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600 font-medium">Error: {parseError}</p>
        </div>
      ) : chartData ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-600 font-medium">✅ Chart Type Detected: {chartData.chartType}</p>
          <p className="text-sm text-gray-600">Title: {chartData.title}</p>
          <p className="text-sm text-gray-600">Data points: {chartData.data.length}</p>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <p className="text-gray-600">No valid chart data</p>
        </div>
      )}
    </div>
  )
}

export default function TestChartDetection() {
  const [jsonInput, setJsonInput] = useState(`{
  "data": [
    {"country": "United States", "gdp": 25.46},
    {"country": "China", "gdp": 17.73},
    {"country": "Japan", "gdp": 4.94},
    {"country": "Germany", "gdp": 4.07},
    {"country": "India", "gdp": 3.73}
  ],
  "title": "Top 5 Countries by GDP - Pie Chart"
}`)

  const testCases = [
    {
      name: "Your Original Data (should detect pie)",
      json: `{
  "data": [
    {"country": "United States", "gdp": 25.46},
    {"country": "China", "gdp": 17.73},
    {"country": "Japan", "gdp": 4.94},
    {"country": "Germany", "gdp": 4.07},
    {"country": "India", "gdp": 3.73}
  ],
  "title": "Top 5 Countries by GDP - Pie Chart"
}`
    },
    {
      name: "Explicit Pie Chart",
      json: `{
  "chartType": "pie",
  "data": [
    {"category": "A", "value": 30},
    {"category": "B", "value": 70}
  ],
  "title": "Sample Pie Chart"
}`
    },
    {
      name: "Bar Chart Data",
      json: `{
  "data": [
    {"month": "Jan", "sales": 100},
    {"month": "Feb", "sales": 120},
    {"month": "Mar", "sales": 90}
  ],
  "title": "Monthly Sales"
}`
    }
  ]

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Chart Type Detection Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Custom Input</h2>
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          <ChartArtifactContent content={jsonInput} />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Test Cases</h2>
          {testCases.map((testCase, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{testCase.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartArtifactContent content={testCase.json} />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setJsonInput(testCase.json)}
                >
                  Load This Example
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
