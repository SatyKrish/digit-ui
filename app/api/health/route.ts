import { NextResponse } from 'next/server';

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

    // Test basic functionality
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
      checks: {
        auth_config: 'ok',
        environment_vars: 'ok'
      }
    };

    return NextResponse.json(healthCheck, { status: 200 });

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
