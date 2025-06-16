// Quick test script to verify chart generation with createDocument tool
const fetch = require('node-fetch');

async function testChartGeneration() {
  try {
    console.log('Testing chart generation with createDocument tool...\n');
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            id: 'test-1',
            role: 'user',
            content: 'Create a pie chart showing market share distribution for top 5 tech companies',
            createdAt: new Date()
          }
        ],
        userId: 'test-user-chart'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Read the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      result += chunk;
      
      // Look for tool calls in the stream
      if (chunk.includes('createDocument')) {
        console.log('Found createDocument tool call in stream:');
        console.log(chunk);
        console.log('\n');
      }
    }

    console.log('Chart generation test completed!');
    console.log('Full response length:', result.length);
    
    // Look for chart-related content
    if (result.includes('chartType')) {
      console.log('✅ SUCCESS: Found chartType in response!');
    } else {
      console.log('❌ ISSUE: No chartType found in response');
    }

    if (result.includes('"pie"') || result.includes('pie chart')) {
      console.log('✅ SUCCESS: Pie chart content detected!');
    } else {
      console.log('❌ ISSUE: No pie chart content detected');
    }

  } catch (error) {
    console.error('Error testing chart generation:', error);
  }
}

// Run the test
testChartGeneration();
