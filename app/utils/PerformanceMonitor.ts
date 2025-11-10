// @ts-nocheck

/**
 * PerformanceMonitor - Utility for monitoring and optimizing app performance
 * Tracks key operations, memory usage, and provides performance insights
 * 
 * Requirements: 18.1-18.5
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.operationTimings = new Map();
    this.memorySnapshots = [];
    this.isEnabled = __DEV__; // Only enable in development by default
    this.maxMetricsHistory = 100;
    this.performanceThresholds = {
      dataLoading: 2000, // 2 seconds
      rendering: 100, // 100ms
      navigation: 500, // 500ms
      storage: 1000, // 1 second
      calculation: 200 // 200ms
    };
  }

  /**
   * Start timing an operation
   * @param {string} operationName - Name of the operation
   * @param {Object} metadata - Additional metadata
   * @returns {string} - Operation ID for ending the timing
   */
  startTiming(operationName, metadata = {}) {
    if (!this.isEnabled) {
return null;
}

    const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = performance.now();

    this.operationTimings.set(operationId, {
      operationName,
      startTime,
      metadata,
      status: 'running'
    });

    console.log(`[Performance] Started: ${operationName}`, metadata);
    return operationId;
  }

  /**
   * End timing an operation
   * @param {string} operationId - Operation ID from startTiming
   * @param {Object} additionalMetadata - Additional metadata
   * @returns {Object} - Performance metrics for the operation
   */
  endTiming(operationId, additionalMetadata = {}) {
    if (!this.isEnabled || !operationId) {
return null;
}

    const operation = this.operationTimings.get(operationId);
    if (!operation) {
      console.warn(`[Performance] Operation not found: ${operationId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - operation.startTime;

    const metrics = {
      operationId,
      operationName: operation.operationName,
      duration,
      startTime: operation.startTime,
      endTime,
      metadata: { ...operation.metadata, ...additionalMetadata },
      timestamp: new Date().toISOString(),
      isSlowOperation: this.isSlowOperation(operation.operationName, duration)
    };

    // Store metrics
    this.storeMetrics(metrics);

    // Clean up timing record
    this.operationTimings.delete(operationId);

    // Log performance
    const logLevel = metrics.isSlowOperation ? 'warn' : 'log';
    console[logLevel](`[Performance] Completed: ${operation.operationName} (${duration.toFixed(2)}ms)`, {
      duration: `${duration.toFixed(2)}ms`,
      threshold: `${this.performanceThresholds[this.getOperationType(operation.operationName)] || 'N/A'}ms`,
      slow: metrics.isSlowOperation,
      ...additionalMetadata
    });

    return metrics;
  }

  /**
   * Time a function execution
   * @param {string} operationName - Name of the operation
   * @param {Function} fn - Function to time
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<*>} - Function result with timing
   */
  async timeFunction(operationName, fn, metadata = {}) {
    const operationId = this.startTiming(operationName, metadata);
    
    try {
      const result = await fn();
      this.endTiming(operationId, { success: true });
      return result;
    } catch (error) {
      this.endTiming(operationId, { success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Record memory usage snapshot
   * @param {string} context - Context where memory is being measured
   * @param {Object} metadata - Additional metadata
   */
  recordMemoryUsage(context, metadata = {}) {
    if (!this.isEnabled) {
return;
}

    try {
      // Note: React Native doesn't have performance.memory, so we'll use a placeholder
      const memoryInfo = {
        timestamp: new Date().toISOString(),
        context,
        metadata,
        // Placeholder values - in a real implementation, you'd use platform-specific APIs
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
      };

      this.memorySnapshots.push(memoryInfo);

      // Keep only recent snapshots
      if (this.memorySnapshots.length > this.maxMetricsHistory) {
        this.memorySnapshots = this.memorySnapshots.slice(-this.maxMetricsHistory);
      }

      console.log(`[Performance] Memory snapshot: ${context}`, memoryInfo);
    } catch (error) {
      console.warn('[Performance] Failed to record memory usage:', error);
    }
  }

  /**
   * Store performance metrics
   * @param {Object} metrics - Performance metrics
   */
  storeMetrics(metrics) {
    const operationType = this.getOperationType(metrics.operationName);
    
    if (!this.metrics.has(operationType)) {
      this.metrics.set(operationType, []);
    }

    const typeMetrics = this.metrics.get(operationType);
    typeMetrics.push(metrics);

    // Keep only recent metrics
    if (typeMetrics.length > this.maxMetricsHistory) {
      typeMetrics.splice(0, typeMetrics.length - this.maxMetricsHistory);
    }
  }

  /**
   * Get operation type from operation name
   * @param {string} operationName - Operation name
   * @returns {string} - Operation type
   */
  getOperationType(operationName) {
    const lowerName = operationName.toLowerCase();
    
    if (lowerName.includes('load') || lowerName.includes('fetch') || lowerName.includes('get')) {
      return 'dataLoading';
    }
    if (lowerName.includes('render') || lowerName.includes('draw')) {
      return 'rendering';
    }
    if (lowerName.includes('navigate') || lowerName.includes('route')) {
      return 'navigation';
    }
    if (lowerName.includes('save') || lowerName.includes('store') || lowerName.includes('persist')) {
      return 'storage';
    }
    if (lowerName.includes('calculate') || lowerName.includes('compute') || lowerName.includes('process')) {
      return 'calculation';
    }
    
    return 'other';
  }

  /**
   * Check if operation is slow based on thresholds
   * @param {string} operationName - Operation name
   * @param {number} duration - Duration in milliseconds
   * @returns {boolean} - Whether operation is slow
   */
  isSlowOperation(operationName, duration) {
    const operationType = this.getOperationType(operationName);
    const threshold = this.performanceThresholds[operationType];
    return threshold && duration > threshold;
  }

  /**
   * Get performance summary
   * @param {string} operationType - Optional operation type filter
   * @returns {Object} - Performance summary
   */
  getPerformanceSummary(operationType = null) {
    const summary = {
      totalOperations: 0,
      slowOperations: 0,
      averageDuration: 0,
      operationTypes: {},
      recentSlowOperations: [],
      generatedAt: new Date().toISOString()
    };

    const metricsToAnalyze = operationType 
      ? (this.metrics.get(operationType) || [])
      : Array.from(this.metrics.values()).flat();

    if (metricsToAnalyze.length === 0) {
      return summary;
    }

    summary.totalOperations = metricsToAnalyze.length;
    summary.slowOperations = metricsToAnalyze.filter(m => m.isSlowOperation).length;
    summary.averageDuration = metricsToAnalyze.reduce((sum, m) => sum + m.duration, 0) / metricsToAnalyze.length;

    // Group by operation type
    for (const [type, metrics] of this.metrics.entries()) {
      if (operationType && type !== operationType) {
continue;
}
      
      summary.operationTypes[type] = {
        count: metrics.length,
        averageDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
        slowCount: metrics.filter(m => m.isSlowOperation).length,
        threshold: this.performanceThresholds[type] || null
      };
    }

    // Get recent slow operations
    summary.recentSlowOperations = metricsToAnalyze
      .filter(m => m.isSlowOperation)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(m => ({
        operationName: m.operationName,
        duration: m.duration,
        timestamp: m.timestamp,
        metadata: m.metadata
      }));

    return summary;
  }

  /**
   * Get memory usage summary
   * @returns {Object} - Memory usage summary
   */
  getMemoryUsageSummary() {
    return {
      totalSnapshots: this.memorySnapshots.length,
      recentSnapshots: this.memorySnapshots.slice(-10),
      contexts: [...new Set(this.memorySnapshots.map(s => s.context))],
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Clear all metrics and snapshots
   */
  clearMetrics() {
    this.metrics.clear();
    this.operationTimings.clear();
    this.memorySnapshots = [];
    console.log('[Performance] All metrics cleared');
  }

  /**
   * Enable or disable performance monitoring
   * @param {boolean} enabled - Whether to enable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`[Performance] Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update performance thresholds
   * @param {Object} thresholds - New thresholds
   */
  updateThresholds(thresholds) {
    this.performanceThresholds = { ...this.performanceThresholds, ...thresholds };
    console.log('[Performance] Thresholds updated:', this.performanceThresholds);
  }

  /**
   * Export metrics for analysis
   * @returns {Object} - Exported metrics data
   */
  exportMetrics() {
    return {
      metrics: Object.fromEntries(this.metrics),
      memorySnapshots: this.memorySnapshots,
      thresholds: this.performanceThresholds,
      summary: this.getPerformanceSummary(),
      memorySummary: this.getMemoryUsageSummary(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Get performance recommendations
   * @returns {Array} - Array of performance recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const summary = this.getPerformanceSummary();

    // Check for slow operations
    if (summary.slowOperations > 0) {
      const slowPercentage = (summary.slowOperations / summary.totalOperations) * 100;
      recommendations.push({
        type: 'warning',
        category: 'slow_operations',
        message: `${summary.slowOperations} operations (${slowPercentage.toFixed(1)}%) are slower than recommended thresholds`,
        suggestion: 'Consider optimizing slow operations or implementing lazy loading',
        priority: slowPercentage > 20 ? 'high' : 'medium'
      });
    }

    // Check average duration by type
    for (const [type, typeMetrics] of Object.entries(summary.operationTypes)) {
      const threshold = this.performanceThresholds[type];
      if (threshold && typeMetrics.averageDuration > threshold * 0.8) {
        recommendations.push({
          type: 'info',
          category: 'approaching_threshold',
          message: `${type} operations averaging ${typeMetrics.averageDuration.toFixed(2)}ms (threshold: ${threshold}ms)`,
          suggestion: `Consider optimizing ${type} operations`,
          priority: 'medium'
        });
      }
    }

    // Memory recommendations
    if (this.memorySnapshots.length > 50) {
      recommendations.push({
        type: 'info',
        category: 'memory_monitoring',
        message: 'High number of memory snapshots recorded',
        suggestion: 'Monitor memory usage patterns for potential leaks',
        priority: 'low'
      });
    }

    return recommendations;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;