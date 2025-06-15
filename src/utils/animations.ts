/**
 * Simple animation utilities
 */

/**
 * Get stagger animation class for list items
 * Simplified to use just 4 stagger levels
 */
export function getStaggerClass(index: number): string {
  const staggerLevel = (index % 4) + 1
  return `animate-stagger-${staggerLevel}`
}

/**
 * Get slide-in animation with stagger
 */
export function getSlideInStaggerClass(index: number): string {
  return `animate-slide-in-up ${getStaggerClass(index)}`
}
