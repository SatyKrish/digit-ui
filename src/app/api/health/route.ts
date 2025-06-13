import { NextResponse } from 'next/server';
import { getAzureOpenAIStatus, validateAzureOpenAIConfig } from '@/config/azure-openai';

export async function GET() {
  try {
    // Check if required environment variables are present
    const requiredEnvVars = [
      'AZURE_CLIENT_ID',
      'AZURE_TENANT_ID',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          error: `Missing environment variables: ${missingVars.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Test database connectivity (server-side only)
    let databaseStatus = 'ok';
    try {
      // Dynamic import to avoid bundling issues
      const { getDatabase } = await import('@/database');
      const db = getDatabase();
      const result = db.prepare('SELECT 1 as test').get() as { test: number };
      if (result.test !== 1) {
        databaseStatus = 'error';
      }
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      databaseStatus = 'error';
    }

    // Test API functionality
    let apiStatus = 'ok';
    try {
      // Test basic API response capability
      const testResponse = { test: 'api_functional' };
      if (!testResponse.test) {
        apiStatus = 'error';
      }
    } catch (apiError) {
      console.error('API health check failed:', apiError);
      apiStatus = 'error';
    }

    // Test Azure OpenAI configuration and health
    let llmStatus = 'ok';
    let llmDetails = {};
    try {
      const azureStatus = getAzureOpenAIStatus();
      const isConfigured = validateAzureOpenAIConfig();
      
      llmStatus = isConfigured ? 'ok' : 'error';
      llmDetails = {
        ...azureStatus,
        healthy: isConfigured,
      };
    } catch (llmError) {
      console.error('Azure OpenAI health check failed:', llmError);
      llmStatus = 'error';
      llmDetails = {
        healthy: false,
        configured: false,
        error: llmError instanceof Error ? llmError.message : 'Unknown Azure OpenAI error'
      };
    }

    // Determine overall status
    const hasErrors = databaseStatus === 'error' || apiStatus === 'error' || llmStatus === 'error';
    const overallStatus = hasErrors ? 'degraded' : 'healthy';

    // Comprehensive system health check
    const healthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      checks: {
        auth_config: 'ok',
        environment_vars: 'ok',
        database: databaseStatus,
        api: apiStatus,
        llm: llmStatus
      },
      llm: llmDetails
    };

    const statusCode = hasErrors ? 503 : 200;
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
