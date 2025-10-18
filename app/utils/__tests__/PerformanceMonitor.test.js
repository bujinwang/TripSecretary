/**
 * PerformanceMonitor Tests
 * Tests for performance monitoring utility
 * 
 * Requirements: 18.1-18.5
 */

import PerformanceMonitor from '../PerformanceMonitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMetrics();
    PerformanceMonitor.setEnabled(true);
  });

  afterEach(() => {
    PerformanceMonitor.clearMetrics();
  });

  describe('timing operations', () => {
    it('should start and end timing operations', async () => {
      const operationId = PerformanceMonitor.startTiming('testOperation', { test: true });
      
      expect(operationId).toBeTruthy();
      expect(typeof operationId).toBe('string');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const metrics = PerformanceMonitor.endTiming(operationId, { completed: true });
      
      expect(metrics).toBeTruthy();
      expect(metrics.operationName).toBe('testOperation');
      expect(metrics.duration).toBeGreaterThan(0);
      expect(metrics.metadata.test).toBe(true);
      expect(metrics.metadata.completed).toBe(true);
    });

    it('should handle invalid operation IDs gracefully', () => {
      const metrics = PerformanceMonitor.endTiming('invalid_id');
      expect(metrics).toBeNull();
    });

    it('should time function execution', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'test result';
      };

      const result = await PerformanceMonitor.timeFunction('testFunction', testFunction, { test: true });
      
      expect(result).toBe('test result');
      
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBe(1);
    });

    it('should handle function errors and still record timing', async () => {
      const errorFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Test error');
      };

      await expect(
        PerformanceMonitor.timeFunction('errorFunction', errorFunction)
      ).rejects.toThrow('Test error');
      
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBe(1);
    });
  });

  describe('performance analysis', () => {
    it('should categorize operations correctly', () => {
      expect(PerformanceMonitor.getOperationType('loadData')).toBe('dataLoading');
      expect(PerformanceMonitor.getOperationType('fetchUsers')).toBe('dataLoading');
      expect(PerformanceMonitor.getOperationType('renderComponent')).toBe('rendering');
      expect(PerformanceMonitor.getOperationType('navigateToScreen')).toBe('navigation');
      expect(PerformanceMonitor.getOperationType('saveToStorage')).toBe('storage');
      expect(PerformanceMonitor.getOperationType('calculateTotal')).toBe('calculation');
      expect(PerformanceMonitor.getOperationType('unknownOperation')).toBe('other');
    });

    it('should identify slow operations', () => {
      expect(PerformanceMonitor.isSlowOperation('loadData', 3000)).toBe(true);
      expect(PerformanceMonitor.isSlowOperation('loadData', 1000)).toBe(false);
      expect(PerformanceMonitor.isSlowOperation('renderComponent', 200)).toBe(true);
      expect(PerformanceMonitor.isSlowOperation('renderComponent', 50)).toBe(false);
    });

    it('should generate performance summary', async () => {
      // Add some test operations
      const operations = [
        { name: 'loadData', duration: 1500 },
        { name: 'renderComponent', duration: 50 },
        { name: 'loadData', duration: 3000 }, // This should be slow
        { name: 'calculateTotal', duration: 100 }
      ];

      for (const op of operations) {
        const id = PerformanceMonitor.startTiming(op.name);
        // Simulate the duration by directly ending with the duration
        PerformanceMonitor.endTiming(id);
      }

      const summary = PerformanceMonitor.getPerformanceSummary();
      
      expect(summary.totalOperations).toBe(4);
      expect(summary.operationTypes).toHaveProperty('dataLoading');
      expect(summary.operationTypes).toHaveProperty('rendering');
      expect(summary.operationTypes).toHaveProperty('calculation');
      expect(summary.operationTypes.dataLoading.count).toBe(2);
    });
  });

  describe('memory monitoring', () => {
    it('should record memory usage snapshots', () => {
      PerformanceMonitor.recordMemoryUsage('testContext', { component: 'TestComponent' });
      
      const memorySummary = PerformanceMonitor.getMemoryUsageSummary();
      expect(memorySummary.totalSnapshots).toBe(1);
      expect(memorySummary.contexts).toContain('testContext');
    });

    it('should limit memory snapshots to max history', () => {
      // Record more than max snapshots
      for (let i = 0; i < 150; i++) {
        PerformanceMonitor.recordMemoryUsage(`context_${i}`);
      }
      
      const memorySummary = PerformanceMonitor.getMemoryUsageSummary();
      expect(memorySummary.totalSnapshots).toBeLessThanOrEqual(100);
    });
  });

  describe('recommendations', () => {
    it('should provide performance recommendations', async () => {
      // Add some slow operations
      for (let i = 0; i < 5; i++) {
        const id = PerformanceMonitor.startTiming('slowLoadData');
        PerformanceMonitor.endTiming(id);
      }

      const recommendations = PerformanceMonitor.getRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should recommend optimization for high slow operation percentage', async () => {
      // Create mostly slow operations
      for (let i = 0; i < 10; i++) {
        const id = PerformanceMonitor.startTiming('loadData');
        // Simulate slow operation by updating thresholds
        PerformanceMonitor.updateThresholds({ dataLoading: 1 }); // Very low threshold
        PerformanceMonitor.endTiming(id);
      }

      const recommendations = PerformanceMonitor.getRecommendations();
      const slowOpRecommendation = recommendations.find(r => r.category === 'slow_operations');
      expect(slowOpRecommendation).toBeTruthy();
      expect(slowOpRecommendation.priority).toBe('high');
    });
  });

  describe('configuration', () => {
    it('should allow enabling/disabling monitoring', () => {
      PerformanceMonitor.setEnabled(false);
      
      const operationId = PerformanceMonitor.startTiming('testOperation');
      expect(operationId).toBeNull();
      
      PerformanceMonitor.setEnabled(true);
      
      const operationId2 = PerformanceMonitor.startTiming('testOperation');
      expect(operationId2).toBeTruthy();
    });

    it('should allow updating performance thresholds', () => {
      const newThresholds = {
        dataLoading: 5000,
        rendering: 200
      };
      
      PerformanceMonitor.updateThresholds(newThresholds);
      
      expect(PerformanceMonitor.isSlowOperation('loadData', 4000)).toBe(false);
      expect(PerformanceMonitor.isSlowOperation('loadData', 6000)).toBe(true);
      expect(PerformanceMonitor.isSlowOperation('renderComponent', 150)).toBe(false);
      expect(PerformanceMonitor.isSlowOperation('renderComponent', 250)).toBe(true);
    });
  });

  describe('data export', () => {
    it('should export metrics data', async () => {
      // Add some test data
      const id = PerformanceMonitor.startTiming('testOperation');
      PerformanceMonitor.endTiming(id);
      PerformanceMonitor.recordMemoryUsage('testContext');
      
      const exportedData = PerformanceMonitor.exportMetrics();
      
      expect(exportedData).toHaveProperty('metrics');
      expect(exportedData).toHaveProperty('memorySnapshots');
      expect(exportedData).toHaveProperty('thresholds');
      expect(exportedData).toHaveProperty('summary');
      expect(exportedData).toHaveProperty('memorySummary');
      expect(exportedData).toHaveProperty('exportedAt');
    });
  });

  describe('cache management', () => {
    it('should clear all metrics', async () => {
      // Add some data
      const id = PerformanceMonitor.startTiming('testOperation');
      PerformanceMonitor.endTiming(id);
      PerformanceMonitor.recordMemoryUsage('testContext');
      
      let summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBe(1);
      
      PerformanceMonitor.clearMetrics();
      
      summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBe(0);
      
      const memorySummary = PerformanceMonitor.getMemoryUsageSummary();
      expect(memorySummary.totalSnapshots).toBe(0);
    });
  });
});