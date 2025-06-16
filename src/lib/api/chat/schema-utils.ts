import { z } from "zod"

// Performance: Cache expensive operations
export const TOOL_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
export const SCHEMA_CONVERSION_CACHE = new Map<string, z.ZodType<any>>()

/**
 * Convert JSON Schema to Zod schema with caching for performance
 */
export function jsonSchemaToZod(schema: any): z.ZodType<any> {
  if (!schema || typeof schema !== 'object') {
    return z.any()
  }

  // Performance: Use cached schema if available
  const cacheKey = JSON.stringify(schema)
  if (SCHEMA_CONVERSION_CACHE.has(cacheKey)) {
    return SCHEMA_CONVERSION_CACHE.get(cacheKey)!
  }

  let result: z.ZodType<any>

  switch (schema.type) {
    case 'string':
      result = z.string()
      if (schema.description) result = result.describe(schema.description)
      if (schema.minLength) result = (result as z.ZodString).min(schema.minLength)
      if (schema.maxLength) result = (result as z.ZodString).max(schema.maxLength)
      break

    case 'number':
      result = z.number()
      if (schema.description) result = result.describe(schema.description)
      if (schema.minimum !== undefined) result = (result as z.ZodNumber).min(schema.minimum)
      if (schema.maximum !== undefined) result = (result as z.ZodNumber).max(schema.maximum)
      break

    case 'integer':
      result = z.number().int()
      if (schema.description) result = result.describe(schema.description)
      if (schema.minimum !== undefined) result = (result as z.ZodNumber).min(schema.minimum)
      if (schema.maximum !== undefined) result = (result as z.ZodNumber).max(schema.maximum)
      break

    case 'boolean':
      result = z.boolean()
      if (schema.description) result = result.describe(schema.description)
      break

    case 'array':
      const itemSchema = schema.items ? jsonSchemaToZod(schema.items) : z.any()
      result = z.array(itemSchema)
      if (schema.description) result = result.describe(schema.description)
      if (schema.minItems) result = (result as z.ZodArray<any>).min(schema.minItems)
      if (schema.maxItems) result = (result as z.ZodArray<any>).max(schema.maxItems)
      break

    case 'object':
      if (!schema.properties) {
        result = z.record(z.any())
        if (schema.description) result = result.describe(schema.description)
        break
      }

      const shape: Record<string, z.ZodType<any>> = {}
      for (const [key, prop] of Object.entries(schema.properties)) {
        shape[key] = jsonSchemaToZod(prop)
      }

      const requiredFields = new Set(schema.required || [])
      const finalShape: Record<string, z.ZodType<any>> = {}
      
      for (const [key, zodSchema] of Object.entries(shape)) {
        finalShape[key] = requiredFields.has(key) ? zodSchema : zodSchema.optional()
      }
      
      result = z.object(finalShape)
      if (schema.description) result = result.describe(schema.description)
      break

    default:
      result = z.any()
  }

  // Cache the result for future use
  SCHEMA_CONVERSION_CACHE.set(cacheKey, result)
  
  // Prevent memory leaks by limiting cache size
  if (SCHEMA_CONVERSION_CACHE.size > 1000) {
    const firstKey = SCHEMA_CONVERSION_CACHE.keys().next().value
    if (firstKey) {
      SCHEMA_CONVERSION_CACHE.delete(firstKey)
    }
  }

  return result
}
