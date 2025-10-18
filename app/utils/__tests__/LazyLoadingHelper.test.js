/**
 * LazyLoadingHelper Tests
 * Tests for lazy loading and virtualization utilities
 * 
 * Requirements: 18.1-18.5
 */

import LazyLoadingHelper from '../LazyLoadingHelper';

describe('LazyLoadingHelper', () => {
  describe('optimized FlatList props', () => {
    it('should return optimized FlatList props with defaults', () => {
      const props = LazyLoadingHelper.getOptimizedFlatListProps();
      
      expect(props).toHaveProperty('windowSize', 10);
      expect(props).toHaveProperty('initialNumToRender', 10);
      expect(props).toHaveProperty('maxToRenderPerBatch', 5);
      expect(props).toHaveProperty('updateCellsBatchingPeriod', 50);
      expect(props).toHaveProperty('removeClippedSubviews', true);
      expect(props).toHaveProperty('getItemLayout');
      expect(props).toHaveProperty('keyExtractor');
      expect(props).toHaveProperty('viewabilityConfig');
      expect(props).toHaveProperty('scrollEventThrottle', 16);
      expect(props).toHaveProperty('disableVirtualization', false);
    });

    it('should allow custom configuration', () => {
      const customOptions = {
        itemHeight: 120,
        windowSize: 15,
        initialNumToRender: 8,
        maxToRenderPerBatch: 3,
        updateCellsBatchingPeriod: 100,
        removeClippedSubviews: false
      };
      
      const props = LazyLoadingHelper.getOptimizedFlatListProps(customOptions);
      
      expect(props.windowSize).toBe(15);
      expect(props.initialNumToRender).toBe(8);
      expect(props.maxToRenderPerBatch).toBe(3);
      expect(props.updateCellsBatchingPeriod).toBe(100);
      expect(props.removeClippedSubviews).toBe(false);
    });

    it('should generate correct getItemLayout function', () => {
      const props = LazyLoadingHelper.getOptimizedFlatListProps({ itemHeight: 100 });
      const getItemLayout = props.getItemLayout;
      
      const layout0 = getItemLayout([], 0);
      expect(layout0).toEqual({ length: 100, offset: 0, index: 0 });
      
      const layout2 = getItemLayout([], 2);
      expect(layout2).toEqual({ length: 100, offset: 200, index: 2 });
    });

    it('should generate keyExtractor function', () => {
      const props = LazyLoadingHelper.getOptimizedFlatListProps();
      const keyExtractor = props.keyExtractor;
      
      expect(keyExtractor({ id: 'test123' }, 0)).toBe('test123');
      expect(keyExtractor({ key: 'key456' }, 0)).toBe('key456');
      expect(keyExtractor({}, 5)).toBe('5');
    });
  });

  describe('paginated data loader', () => {
    it('should create paginated loader with correct initial state', () => {
      const mockLoadFunction = jest.fn().mockResolvedValue([]);
      const loader = LazyLoadingHelper.createPaginatedLoader(mockLoadFunction);
      
      const state = loader.getState();
      expect(state.currentPage).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.hasMoreData).toBe(true);
      expect(state.totalItems).toBe(0);
      expect(state.cacheSize).toBe(0);
    });

    it('should load next page correctly', async () => {
      const mockData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];
      const mockLoadFunction = jest.fn().mockResolvedValue(mockData);
      const loader = LazyLoadingHelper.createPaginatedLoader(mockLoadFunction, { pageSize: 2 });
      
      const result = await loader.loadNextPage();
      
      expect(result).toEqual(mockData);
      expect(mockLoadFunction).toHaveBeenCalledWith({
        page: 0,
        pageSize: 2,
        offset: 0
      });
      
      const state = loader.getState();
      expect(state.currentPage).toBe(1);
      expect(state.totalItems).toBe(2);
      expect(state.hasMoreData).toBe(true);
    });

    it('should detect end of data when page is not full', async () => {
      const mockData = [{ id: 1, name: 'Item 1' }]; // Less than pageSize
      const mockLoadFunction = jest.fn().mockResolvedValue(mockData);
      const loader = LazyLoadingHelper.createPaginatedLoader(mockLoadFunction, { pageSize: 2 });
      
      await loader.loadNextPage();
      
      const state = loader.getState();
      expect(state.hasMoreData).toBe(false);
    });

    it('should use cache for previously loaded pages', async () => {
      const mockData = [{ id: 1, name: 'Item 1' }];
      const mockLoadFunction = jest.fn().mockResolvedValue(mockData);
      const loader = LazyLoadingHelper.createPaginatedLoader(mockLoadFunction);
      
      // Load page first time
      await loader.loadNextPage();
      expect(mockLoadFunction).toHaveBeenCalledTimes(1);
      
      // Reset and load same page again
      loader.reset();
      await loader.loadNextPage();
      expect(mockLoadFunction).toHaveBeenCalledTimes(2); // Should call again after reset
    });

    it('should determine when to load more data', async () => {
      const mockLoadFunction = jest.fn().mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ id: i, name: `Item ${i}` }))
      );
      const loader = LazyLoadingHelper.createPaginatedLoader(mockLoadFunction, { 
        pageSize: 20, 
        preloadThreshold: 5 
      });
      
      await loader.loadNextPage();
      
      expect(loader.shouldLoadMore(10)).toBe(false); // 10 remaining items > threshold
      expect(loader.shouldLoadMore(16)).toBe(true);  // 4 remaining items <= threshold
    });

    it('should reset loader state correctly', async () => {
      const mockLoadFunction = jest.fn().mockResolvedValue([{ id: 1 }]);
      const loader = LazyLoadingHelper.createPaginatedLoader(mockLoadFunction);
      
      await loader.loadNextPage();
      loader.reset();
      
      const state = loader.getState();
      expect(state.currentPage).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.hasMoreData).toBe(true);
      expect(state.totalItems).toBe(0);
    });
  });

  describe('lazy image loader', () => {
    it('should create lazy image loader with correct initial state', () => {
      const imageLoader = LazyLoadingHelper.createLazyImageLoader();
      
      const stats = imageLoader.getCacheStats();
      expect(stats.cacheSize).toBe(0);
      expect(stats.loadingCount).toBe(0);
      expect(stats.maxCacheSize).toBe(50);
    });

    it('should handle empty URI', async () => {
      const imageLoader = LazyLoadingHelper.createLazyImageLoader({ placeholder: 'placeholder.png' });
      
      const result = await imageLoader.loadImage('');
      expect(result.uri).toBe('placeholder.png');
      expect(result.cached).toBe(false);
    });

    it('should load and cache images', async () => {
      const imageLoader = LazyLoadingHelper.createLazyImageLoader();
      
      const result1 = await imageLoader.loadImage('test.jpg');
      expect(result1.uri).toBe('test.jpg');
      expect(result1.cached).toBe(false);
      expect(result1.loaded).toBe(true);
      
      const result2 = await imageLoader.loadImage('test.jpg');
      expect(result2.cached).toBe(true);
    });

    it('should clear cache', async () => {
      const imageLoader = LazyLoadingHelper.createLazyImageLoader();
      
      await imageLoader.loadImage('test.jpg');
      let stats = imageLoader.getCacheStats();
      expect(stats.cacheSize).toBe(1);
      
      imageLoader.clearCache();
      stats = imageLoader.getCacheStats();
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('intersection observer', () => {
    it('should create intersection observer', () => {
      const observer = LazyLoadingHelper.createIntersectionObserver();
      
      const stats = observer.getStats();
      expect(stats.observedCount).toBe(0);
      expect(stats.visibleCount).toBe(0);
      expect(stats.triggeredCount).toBe(0);
    });

    it('should observe and trigger callbacks', () => {
      const observer = LazyLoadingHelper.createIntersectionObserver();
      const mockCallback = jest.fn();
      
      observer.observe('element1', mockCallback);
      
      let stats = observer.getStats();
      expect(stats.observedCount).toBe(1);
      
      observer.checkVisibility('element1', true);
      expect(mockCallback).toHaveBeenCalledWith('element1');
      
      stats = observer.getStats();
      expect(stats.visibleCount).toBe(1);
      expect(stats.triggeredCount).toBe(1);
    });

    it('should not trigger callback multiple times', () => {
      const observer = LazyLoadingHelper.createIntersectionObserver();
      const mockCallback = jest.fn();
      
      observer.observe('element1', mockCallback);
      observer.checkVisibility('element1', true);
      observer.checkVisibility('element1', true); // Second call
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should unobserve elements', () => {
      const observer = LazyLoadingHelper.createIntersectionObserver();
      const mockCallback = jest.fn();
      
      observer.observe('element1', mockCallback);
      observer.unobserve('element1');
      
      const stats = observer.getStats();
      expect(stats.observedCount).toBe(0);
      
      observer.checkVisibility('element1', true);
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('data chunker', () => {
    it('should create data chunker with correct chunks', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const chunker = LazyLoadingHelper.createDataChunker(data, { chunkSize: 25 });
      
      const stats = chunker.getStats();
      expect(stats.totalChunks).toBe(4);
      expect(stats.totalItems).toBe(100);
      expect(stats.currentChunkIndex).toBe(0);
      expect(stats.loadedChunks).toBe(0);
    });

    it('should get chunks by index', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      const chunker = LazyLoadingHelper.createDataChunker(data, { chunkSize: 3 });
      
      const chunk0 = chunker.getChunk(0);
      expect(chunk0).toHaveLength(3);
      expect(chunk0[0].id).toBe(0);
      expect(chunk0[2].id).toBe(2);
      
      const chunk3 = chunker.getChunk(3);
      expect(chunk3).toHaveLength(1);
      expect(chunk3[0].id).toBe(9);
    });

    it('should load next chunk', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      const chunker = LazyLoadingHelper.createDataChunker(data, { chunkSize: 3 });
      
      const currentChunk = chunker.getCurrentChunk();
      expect(currentChunk[0].id).toBe(0);
      
      const nextChunk = chunker.loadNextChunk();
      expect(nextChunk[0].id).toBe(3);
      
      const stats = chunker.getStats();
      expect(stats.currentChunkIndex).toBe(1);
    });

    it('should get all loaded data', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      const chunker = LazyLoadingHelper.createDataChunker(data, { chunkSize: 3 });
      
      chunker.getCurrentChunk(); // Load chunk 0
      chunker.loadNextChunk();   // Load chunk 1
      
      const loadedData = chunker.getLoadedData();
      expect(loadedData).toHaveLength(6);
      expect(loadedData[0].id).toBe(0);
      expect(loadedData[5].id).toBe(5);
    });
  });

  describe('memory-efficient renderer', () => {
    it('should create memory-efficient renderer', () => {
      const renderer = LazyLoadingHelper.createMemoryEfficientRenderer();
      
      const stats = renderer.getStats();
      expect(stats.renderedItems).toBe(0);
      expect(stats.recycledComponents).toBe(0);
      expect(stats.memoryUsage).toBe(0);
    });

    it('should render and recycle components', () => {
      const renderer = LazyLoadingHelper.createMemoryEfficientRenderer();
      const mockRenderFunction = jest.fn().mockReturnValue({ 
        update: jest.fn(),
        id: 'component'
      });
      
      // Render some items
      const item1 = { id: 1, name: 'Item 1' };
      const component1 = renderer.renderItem(item1, 0, mockRenderFunction);
      expect(component1).toBeTruthy();
      expect(mockRenderFunction).toHaveBeenCalledWith(item1, 0);
      
      let stats = renderer.getStats();
      expect(stats.renderedItems).toBe(1);
      
      // Recycle invisible components
      renderer.recycleInvisibleComponents([]);
      
      stats = renderer.getStats();
      expect(stats.renderedItems).toBe(0);
      expect(stats.recycledComponents).toBe(1);
    });

    it('should clear all rendered items', () => {
      const renderer = LazyLoadingHelper.createMemoryEfficientRenderer();
      const mockRenderFunction = jest.fn().mockReturnValue({ 
        update: jest.fn(),
        id: 'component'
      });
      
      renderer.renderItem({ id: 1 }, 0, mockRenderFunction);
      renderer.clearAll();
      
      const stats = renderer.getStats();
      expect(stats.renderedItems).toBe(0);
      expect(stats.recycledComponents).toBe(0);
    });
  });

  describe('list optimization recommendations', () => {
    it('should provide recommendations for large lists', () => {
      const recommendations = LazyLoadingHelper.getListOptimizationRecommendations({
        itemCount: 500,
        averageItemHeight: 80,
        renderTime: 50,
        scrollPerformance: 'good'
      });
      
      const largeListRec = recommendations.find(r => r.type === 'optimization');
      expect(largeListRec).toBeTruthy();
      expect(largeListRec.priority).toBe('high');
    });

    it('should provide recommendations for slow rendering', () => {
      const recommendations = LazyLoadingHelper.getListOptimizationRecommendations({
        itemCount: 50,
        renderTime: 150,
        scrollPerformance: 'good'
      });
      
      const slowRenderRec = recommendations.find(r => r.type === 'performance');
      expect(slowRenderRec).toBeTruthy();
      expect(slowRenderRec.message).toContain('Slow rendering detected');
    });

    it('should provide recommendations for poor scroll performance', () => {
      const recommendations = LazyLoadingHelper.getListOptimizationRecommendations({
        itemCount: 50,
        renderTime: 50,
        scrollPerformance: 'poor'
      });
      
      const scrollRec = recommendations.find(r => r.message.includes('Poor scroll performance'));
      expect(scrollRec).toBeTruthy();
      expect(scrollRec.priority).toBe('medium');
    });
  });
});