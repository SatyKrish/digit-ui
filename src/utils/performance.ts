/**
 * Performance monitoring utilities for chat streaming
 */

export class StreamingPerformanceMonitor {
  private renderTimes: number[] = []
  private lastRender = 0
  private frameCount = 0
  
  startFrame() {
    this.lastRender = performance.now()
  }
  
  endFrame() {
    const renderTime = performance.now() - this.lastRender
    this.renderTimes.push(renderTime)
    this.frameCount++
    
    // Keep only last 100 measurements
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift()
    }
  }
  
  getAverageRenderTime() {
    if (this.renderTimes.length === 0) return 0
    return this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length
  }
  
  getMaxRenderTime() {
    if (this.renderTimes.length === 0) return 0
    return Math.max(...this.renderTimes)
  }
  
  getRenderStats() {
    return {
      frameCount: this.frameCount,
      averageRenderTime: this.getAverageRenderTime(),
      maxRenderTime: this.getMaxRenderTime(),
      recentRenderTimes: this.renderTimes.slice(-10)
    }
  }
  
  logPerformance() {
    const stats = this.getRenderStats()
    console.log('Streaming Performance Stats:', {
      ...stats,
      fps: 1000 / stats.averageRenderTime
    })
  }
  
  reset() {
    this.renderTimes = []
    this.frameCount = 0
  }
}

// Global monitor instance
export const streamingMonitor = new StreamingPerformanceMonitor()

// Hook for performance monitoring in development
export function usePerformanceMonitoring(enabled = process.env.NODE_ENV === 'development') {
  if (!enabled) return { monitor: null }
  
  return { monitor: streamingMonitor }
}
