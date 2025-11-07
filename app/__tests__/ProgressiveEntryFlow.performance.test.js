/**
 * Progressive Entry Flow Performance Tests
 * End-to-end performance tests for complete user flows
 * 
 * Requirements: 18.1-18.5
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens and services
import HomeScreen from '../screens/HomeScreen';
import EntryPackHistoryScreen from '../screens/EntryPackHistoryScreen';
import ThailandTravelInfoScreen from '../screens/thailand/ThailandTravelInfoScreen';
import EntryInfoDetailScreen from '../screens/thailand/EntryInfoDetailScreen';
import EntryInfoService from '../services/EntryInfoService';
import UserDataService from '../services/data/UserDataService';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import LazyLoadingHelper from '../utils/LazyLoadingHelper';

// Mock navigation
const Stack = createStackNavigator();

const TestNavigator = ({ initialRouteName = 'Home', initialParams = {} }) => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        initialParams={initialParams}
      />
      <Stack.Screen 
        name="EntryPackHistory" 
        component={EntryPackHistoryScreen}
      />
      <Stack.Screen 
        name="ThailandTravelInfo" 
        component={ThailandTravelInfoScreen}
      />
      <Stack.Screen
        name="EntryInfoDetail"
        component={EntryInfoDetailScreen}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

// Mock services
jest.mock('../services/EntryInfoService');
jest.mock('../services/data/UserDataService');
jest.mock('../services/snapshot/SnapshotService');
jest.mock('../services/data/LegacyDataMigrationService');

describe('Progressive Entry Flow Performance Tests', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMetrics();
    PerformanceMonitor.setEnabled(true);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    UserDataService.initialize.mockResolvedValue(true);
    UserDataService.getPrimaryPassport.mockResolvedValue({
      fullName: 'John Doe',
      passportNumber: 'A12345678',
      expiryDate: '2025-12-31'
    });
    
    EntryInfoService.getHomeScreenData.mockResolvedValue({
      submittedEntryPacks: [],
      inProgressDestinations: [],
      summary: {
        totalActiveEntryPacks: 0,
        submittedEntryPacks: 0,
        inProgressDestinations: 0,
        hasAnyProgress: false,
        overallCompletionPercent: 0
      }
    });
  });

  afterEach(() => {
    PerformanceMonitor.clearMetrics();
  });

  describe('HomeScreen Performance', () => {
    it('should load HomeScreen within performance thresholds', async () => {
      const startTime = performance.now();
      
      const { getByText } = render(<TestNavigator />);
      
      await waitFor(() => {
        expect(getByText(/入境通/)).toBeTruthy();
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
      
      // Check performance metrics
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBeGreaterThan(0);
    });

    it('should handle large number of entry packs efficiently', async () => {
      // Mock large dataset
      const largeEntryPackData = {
        submittedEntryPacks: Array.from({ length: 50 }, (_, i) => ({
          id: `pack_${i}`,
          destinationId: 'th',
          destinationName: 'Thailand',
          status: 'submitted',
          arrivalDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
        })),
        inProgressDestinations: Array.from({ length: 20 }, (_, i) => ({
          destinationId: `dest_${i}`,
          destinationName: `Destination ${i}`,
          completionPercent: Math.floor(Math.random() * 100),
          isReady: Math.random() > 0.5
        })),
        summary: {
          totalActiveEntryPacks: 50,
          submittedEntryPacks: 50,
          inProgressDestinations: 20,
          hasAnyProgress: true,
          overallCompletionPercent: 75
        }
      };
      
      EntryInfoService.getHomeScreenData.mockResolvedValue(largeEntryPackData);
      
      const startTime = performance.now();
      
      const { getByText } = render(<TestNavigator />);
      
      await waitFor(() => {
        expect(getByText(/入境通/)).toBeTruthy();
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should handle large data within 3 seconds
      
      // Verify performance monitoring recorded the operations
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBeGreaterThan(0);
      
      const dataLoadingOps = summary.operationTypes?.dataLoading;
      if (dataLoadingOps) {
        expect(dataLoadingOps.count).toBeGreaterThan(0);
      }
    });

    it('should optimize rendering with memoization', async () => {
      const { rerender } = render(<TestNavigator />);
      
      // Record initial render performance
      const initialSummary = PerformanceMonitor.getPerformanceSummary();
      
      // Re-render with same props (should be optimized)
      rerender(<TestNavigator />);
      
      await waitFor(() => {
        // Verify that memoized components don't cause excessive re-renders
        const newSummary = PerformanceMonitor.getPerformanceSummary();
        // The difference should be minimal for memoized components
        expect(newSummary.totalOperations - initialSummary.totalOperations).toBeLessThan(5);
      });
    });
  });

  describe('EntryPackHistoryScreen Performance', () => {
    it('should handle large history lists with lazy loading', async () => {
      // Mock large history dataset
      const largeHistoryData = Array.from({ length: 200 }, (_, i) => ({
        id: `history_${i}`,
        type: i % 3 === 0 ? 'legacy' : 'snapshot',
        destination: `Destination ${i}`,
        destinationId: 'th',
        status: ['completed', 'cancelled', 'expired'][i % 3],
        arrivalDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        migrationEligible: i % 3 === 0
      }));
      
      // Mock the LegacyDataMigrationService
      const LegacyDataMigrationService = require('../services/data/LegacyDataMigrationService').default;
      LegacyDataMigrationService.createMixedHistoryList.mockResolvedValue(largeHistoryData);
      LegacyDataMigrationService.getMigrationStats.mockResolvedValue({
        totalRecords: 200,
        legacyRecords: 67,
        snapshotRecords: 133,
        migrationPending: 67
      });
      
      const startTime = performance.now();
      
      const { getByText } = render(<TestNavigator initialRouteName="EntryPackHistory" />);
      
      await waitFor(() => {
        expect(getByText('历史记录')).toBeTruthy();
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load large list within 3 seconds
      
      // Verify lazy loading optimizations are applied
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBeGreaterThan(0);
    });

    it('should optimize FlatList performance with proper configuration', async () => {
      const optimizedProps = LazyLoadingHelper.getOptimizedFlatListProps({
        itemHeight: 120,
        windowSize: 10,
        initialNumToRender: 8
      });
      
      // Verify optimization properties
      expect(optimizedProps.windowSize).toBe(10);
      expect(optimizedProps.initialNumToRender).toBe(8);
      expect(optimizedProps.removeClippedSubviews).toBe(true);
      expect(optimizedProps.getItemLayout).toBeDefined();
      expect(optimizedProps.keyExtractor).toBeDefined();
      
      // Test getItemLayout function
      const layout = optimizedProps.getItemLayout([], 5);
      expect(layout).toEqual({
        length: 120,
        offset: 600, // 5 * 120
        index: 5
      });
    });

    it('should handle search and filtering efficiently', async () => {
      const { getByPlaceholderText, getByText } = render(
        <TestNavigator initialRouteName="EntryPackHistory" />
      );
      
      await waitFor(() => {
        expect(getByText('历史记录')).toBeTruthy();
      });
      
      const searchInput = getByPlaceholderText('搜索目的地或日期...');
      
      const startTime = performance.now();
      
      // Simulate typing in search
      fireEvent.changeText(searchInput, 'Thailand');
      
      const searchTime = performance.now() - startTime;
      expect(searchTime).toBeLessThan(500); // Search should be fast
      
      // Verify search performance is recorded
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should monitor memory usage during navigation', async () => {
      const { getByText } = render(<TestNavigator />);
      
      await waitFor(() => {
        expect(getByText(/入境通/)).toBeTruthy();
      });
      
      // Record memory usage
      PerformanceMonitor.recordMemoryUsage('homeScreenLoaded', {
        screen: 'HomeScreen',
        timestamp: Date.now()
      });
      
      // Navigate to history screen
      const historyButton = getByText('查看历史');
      fireEvent.press(historyButton);
      
      await waitFor(() => {
        PerformanceMonitor.recordMemoryUsage('historyScreenLoaded', {
          screen: 'EntryPackHistoryScreen',
          timestamp: Date.now()
        });
      });
      
      const memorySummary = PerformanceMonitor.getMemoryUsageSummary();
      expect(memorySummary.totalSnapshots).toBeGreaterThanOrEqual(2);
      expect(memorySummary.contexts).toContain('homeScreenLoaded');
      expect(memorySummary.contexts).toContain('historyScreenLoaded');
    });

    it('should optimize component rendering with proper memoization', async () => {
      // Test that components are properly memoized to prevent unnecessary re-renders
      const renderCount = { count: 0 };
      
      const TestComponent = React.memo(function TestComponent() {
        renderCount.count++;
        return null;
      });
      
      const { rerender } = render(<TestComponent />);
      
      expect(renderCount.count).toBe(1);
      
      // Re-render with same props
      rerender(<TestComponent />);
      
      // Should not re-render due to memoization
      expect(renderCount.count).toBe(1);
    });
  });

  describe('Data Loading Performance', () => {
    it('should load passport data efficiently', async () => {
      const startTime = performance.now();
      
      await UserDataService.initialize('test_user');
      const passport = await UserDataService.getPrimaryPassport('test_user');
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Should load within 1 second
      expect(passport).toBeTruthy();
    });

    it('should handle concurrent data loading efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate concurrent loading of multiple data sources
      const promises = [
        UserDataService.initialize('test_user'),
        EntryInfoService.getHomeScreenData('test_user'),
        UserDataService.getPrimaryPassport('test_user')
      ];
      
      await Promise.all(promises);
      
      const totalTime = performance.now() - startTime;
      expect(totalTime).toBeLessThan(2000); // Concurrent loading should be faster
    });
  });

  describe('Performance Recommendations', () => {
    it('should generate performance recommendations', async () => {
      // Simulate some operations with varying performance
      const operations = [
        { name: 'loadHomeData', duration: 1500 },
        { name: 'renderHistoryList', duration: 200 },
        { name: 'loadPassportData', duration: 800 },
        { name: 'calculateCompletion', duration: 50 }
      ];
      
      for (const op of operations) {
        const id = PerformanceMonitor.startTiming(op.name);
        // Simulate work
        await new Promise(resolve => {
          setTimeout(() => resolve(), 10);
        });
        PerformanceMonitor.endTiming(id);
      }
      
      const recommendations = PerformanceMonitor.getRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
      
      // Should have recommendations for optimization
      const hasOptimizationRec = recommendations.some(r => 
        r.category === 'slow_operations' || r.category === 'approaching_threshold'
      );
      expect(hasOptimizationRec).toBe(true);
    });

    it('should provide list optimization recommendations', () => {
      const recommendations = LazyLoadingHelper.getListOptimizationRecommendations({
        itemCount: 1000,
        averageItemHeight: 120,
        renderTime: 150,
        scrollPerformance: 'poor'
      });
      
      expect(recommendations.length).toBeGreaterThan(0);
      
      const largeListRec = recommendations.find(r => r.type === 'optimization');
      expect(largeListRec).toBeTruthy();
      expect(largeListRec.priority).toBe('high');
      
      const slowRenderRec = recommendations.find(r => r.type === 'performance');
      expect(slowRenderRec).toBeTruthy();
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors without significant performance impact', async () => {
      // Mock service to throw error
      EntryInfoService.getHomeScreenData.mockRejectedValue(new Error('Network error'));
      
      const startTime = performance.now();
      
      const { getByText } = render(<TestNavigator />);
      
      await waitFor(() => {
        expect(getByText(/入境通/)).toBeTruthy();
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should handle errors gracefully
      
      // Verify error was recorded in performance metrics
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should integrate performance monitoring throughout the flow', async () => {
      const { getByText } = render(<TestNavigator />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(getByText(/入境通/)).toBeTruthy();
      });
      
      // Navigate to different screens to generate metrics
      const historyButton = getByText('查看历史');
      if (historyButton) {
        fireEvent.press(historyButton);
      }
      
      // Check that performance metrics were collected
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBeGreaterThan(0);
      
      // Verify different operation types were recorded
      expect(summary.operationTypes).toBeTruthy();
      
      // Export metrics for analysis
      const exportedData = PerformanceMonitor.exportMetrics();
      expect(exportedData).toHaveProperty('metrics');
      expect(exportedData).toHaveProperty('summary');
      expect(exportedData).toHaveProperty('exportedAt');
    });
  });
});