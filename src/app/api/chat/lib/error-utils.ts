// Simplified error handling utilities
import { ValidationError } from "./types"

/**
 * Simplified error categorization
 */
export function categorizeStreamError(errorMessage: string): { statusCode: number; userMessage: string } {
  const lowerError = errorMessage.toLowerCase()
  
  if (lowerError.includes('timeout')) {
    return { statusCode: 408, userMessage: 'Request timed out. Please try again.' }
  }
  if (lowerError.includes('quota') || lowerError.includes('rate limit')) {
    return { statusCode: 429, userMessage: 'Rate limit exceeded. Please try again later.' }
  }
  if (lowerError.includes('authentication')) {
    return { statusCode: 401, userMessage: 'Authentication failed.' }
  }
  if (lowerError.includes('not found')) {
    return { statusCode: 404, userMessage: 'Resource not found.' }
  }
  
  return { statusCode: 500, userMessage: 'Service error. Please try again.' }
}

/**
 * Simple error response helper
 */
export function createErrorResponse(error: string, details?: string, status = 500) {
  return new Response(
    JSON.stringify({ 
      error,
      details,
      timestamp: new Date().toISOString()
    }), 
    { 
      status, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}

/**
 * Simplified user validation
 */
export function validateUserId(userId?: string): string {
  if (!userId?.trim()) {
    throw new ValidationError('User ID is required')
  }
  return userId
}
