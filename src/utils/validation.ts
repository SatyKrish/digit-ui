/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate required field
 */
export function isRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0
}

/**
 * Validate minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength
}

/**
 * Validate maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validate form data
 */
export function validateForm(data: Record<string, any>, rules: Record<string, any>): ValidationResult {
  const errors: string[] = []
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field]
    
    if (fieldRules.required && !isRequired(value)) {
      errors.push(`${field} is required`)
    }
    
    if (fieldRules.email && value && !isValidEmail(value)) {
      errors.push(`${field} must be a valid email`)
    }
    
    if (fieldRules.minLength && value && !hasMinLength(value, fieldRules.minLength)) {
      errors.push(`${field} must be at least ${fieldRules.minLength} characters`)
    }
    
    if (fieldRules.maxLength && value && !hasMaxLength(value, fieldRules.maxLength)) {
      errors.push(`${field} must be no more than ${fieldRules.maxLength} characters`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
