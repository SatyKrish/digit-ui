import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS middleware for API routes
 */
export function corsMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Execute the handler
    const response = await handler(req);

    // Add CORS headers to the response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  };
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function rateLimitMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { 
    windowMs?: number; 
    maxRequests?: number; 
    keyGenerator?: (req: NextRequest) => string;
  } = {}
) {
  const {
    windowMs = 60 * 1000, // 1 minute
    maxRequests = 100,
    keyGenerator = (req) => req.ip || 'anonymous'
  } = options;

  return async (req: NextRequest) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create rate limit entry
    let entry = rateLimitMap.get(key);
    if (!entry || entry.lastReset < windowStart) {
      entry = { count: 0, lastReset: now };
      rateLimitMap.set(key, entry);
    }

    // Check if rate limit exceeded
    if (entry.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.lastReset + windowMs).toISOString()
          }
        }
      );
    }

    // Increment counter
    entry.count++;

    // Execute handler
    const response = await handler(req);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(entry.lastReset + windowMs).toISOString());

    return response;
  };
}

/**
 * Authentication middleware
 */
export function authMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { required?: boolean } = {}
) {
  const { required = true } = options;

  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    
    if (required && !authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (authHeader) {
      try {
        // Extract token from "Bearer <token>" format
        const token = authHeader.split(' ')[1];
        
        if (!token) {
          return NextResponse.json(
            { error: 'Invalid authorization header format' },
            { status: 401 }
          );
        }

        // Validate token (implementation depends on your auth strategy)
        // For MSAL, you might validate the JWT token here
        // const isValid = await validateToken(token);
        
        // if (!isValid) {
        //   return NextResponse.json(
        //     { error: 'Invalid or expired token' },
        //     { status: 401 }
        //   );
        // }
        
        // Add user info to request context if needed
        // req.user = await getUserFromToken(token);
        
      } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }

    return await handler(req);
  };
}

/**
 * Error handling middleware
 */
export function errorHandlerMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API Error:', error);
      
      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return NextResponse.json(
        {
          error: isDevelopment 
            ? (error instanceof Error ? error.message : 'An error occurred')
            : 'Internal server error'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Logging middleware
 */
export function loggingMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const start = Date.now();
    const { method, url } = req;
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - Started`);
    
    const response = await handler(req);
    
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${response.status} (${duration}ms)`);
    
    return response;
  };
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}
