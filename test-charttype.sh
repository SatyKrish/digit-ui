#!/bin/bash

# Test script to verify chart generation includes chartType field
echo "Testing chart generation with chartType field..."

# Make API request and capture response
response=$(curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "id": "test-chart-type",
        "role": "user", 
        "content": "Create a simple pie chart showing browser market share: Chrome 65%, Safari 20%, Firefox 10%, Edge 5%",
        "createdAt": "2025-06-16T02:37:17.845Z"
      }
    ],
    "userId": "test-charttype-verification"
  }' | tail -c 1000)

echo "Response (last 1000 chars):"
echo "$response"
echo ""

# Check if chartType is in the response
if echo "$response" | grep -q '"chartType"'; then
    echo "✅ SUCCESS: chartType field found in response!"
else
    echo "❌ ISSUE: chartType field NOT found in response"
fi

# Check if it's a pie chart
if echo "$response" | grep -q '"chartType":"pie"'; then
    echo "✅ SUCCESS: Correct pie chartType detected!"
else
    echo "⚠️  WARNING: pie chartType not detected (might be different chart type)"
fi

# Check for data array
if echo "$response" | grep -q '"data":\['; then
    echo "✅ SUCCESS: data array found in response!"
else
    echo "❌ ISSUE: data array NOT found in response"
fi
