// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

interface FlatListProps {
  windowSize: number;
  initialNumToRender: number;
  maxToRenderPerBatch: number;
  updateCellsBatchingPeriod: number;
  removeClippedSubviews: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getItemLayout: ((data: any, index: number) => { length: number; offset: number; index: number }) | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyExtractor: (item: any, index: number) => string;
  viewabilityConfig: { itemVisiblePercentThreshold: number; minimumViewTime: number };
  scrollEventThrottle: number;
  disableVirtualization: boolean;
}

interface OptimizedListOptions {
  itemHeight?: number;
  windowSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getItemLayout?: ((data: any, index: number) => { length: number; offset: number; index: number }) | null;
}

interface PaginatedLoader<T> {
  loadNext(): Promise<T[]>;
  shouldLoadMore(currentIndex: number): boolean;
  reset(): void;
  getData(): T[];
  getState(): { currentPage: number; pageSize: number; isLoading: boolean; hasMore: boolean; totalItems: number };
}

interface LazyImageLoader {
  loadImage(uri: string): Promise<{ uri: string; loaded: boolean; cached: boolean }>;
  preloadImages(uris: string[]): Promise<void>;
  clearCache(): void;
  getCacheStats(): { cachedCount: number; loadingCount: number };
}

interface IntersectionObserver {
  observe(elementId: string, callback: (id: string) => void): void;
  unobserve(elementId: string): void;
  triggerVisibility(elementId: string, isVisible: boolean): void;
  getStats(): { observed: number; visible: number };
}

interface DataChunker<T> {
  getChunk(index: number): T[];
  getCurrentChunk(): T[];
  loadNextChunk(): T[];
  preloadUpcomingChunks(): void;
  getAllLoaded(): T[];
  getStats(): { totalChunks: number; loadedChunks: number; currentChunk: number; chunkSize: number };
}

interface MemoryEfficientRenderer<T> {
  renderItem(item: T, index: number, renderer: (item: T, idx: number) => React.ReactNode): React.ReactNode;
  recycleItems(visibleItemKeys: string[]): void;
  clearAll(): void;
  getStats(): { renderedCount: number; recycledCount: number };
}

/**
 * LazyLoadingHelper - Utility for implementing lazy loading and virtualization
 */
import React from 'react';
import { Dimensions } from 'react-native';

class LazyLoadingHelper {
  screenHeight: number;
  defaultItemHeight: number;
  viewabilityConfig: { itemVisiblePercentThreshold: number; minimumViewTime: number };

  constructor() {
    this.screenHeight = Dimensions.get('window').height;
    this.defaultItemHeight = 80;
    this.viewabilityConfig = {
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 100,
    };
  }

  getOptimizedFlatListProps(options: OptimizedListOptions = {}): FlatListProps {
    const {
      itemHeight = this.defaultItemHeight,
      windowSize = 10,
      initialNumToRender = 10,
      maxToRenderPerBatch = 5,
      updateCellsBatchingPeriod = 50,
      removeClippedSubviews = true,
      getItemLayout = null,
    } = options;

    return {
      windowSize,
      initialNumToRender,
      maxToRenderPerBatch,
      updateCellsBatchingPeriod,
      removeClippedSubviews,
      getItemLayout:
        getItemLayout ||
        ((_data: unknown, index: number) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      keyExtractor: (item: any, index: number) => (item?.id ?? item?.key ?? String(index)),
      viewabilityConfig: this.viewabilityConfig,
      scrollEventThrottle: 16,
      disableVirtualization: false,
    };
  }

  createPaginatedLoader<T>(
    loadDataFunction: (page: number, pageSize: number) => Promise<T[]>,
    options: { pageSize?: number; preloadThreshold?: number } = {},
  ): PaginatedLoader<T> {
    const pageSize = options.pageSize || 20;
    const preloadThreshold = options.preloadThreshold || 5;

    let currentPage = 0;
    let isLoading = false;
    let hasMoreData = true;
    let allData: T[] = [];

    const loader: PaginatedLoader<T> = {
      loadNext: async (): Promise<T[]> => {
        if (isLoading || !hasMoreData) {
          return [];
        }
        isLoading = true;
        try {
          const newData = await loadDataFunction(currentPage, pageSize);
          if (newData.length < pageSize) {
            hasMoreData = false;
          }
          allData = [...allData, ...newData];
          currentPage++;
          return newData;
        } catch (_error) {
          return [];
        } finally {
          isLoading = false;
        }
      },
      shouldLoadMore: (currentIndex: number): boolean => {
        const remainingItems = allData.length - currentIndex;
        return remainingItems <= preloadThreshold && hasMoreData && !isLoading;
      },
      reset: (): void => {
        currentPage = 0;
        isLoading = false;
        hasMoreData = true;
        allData = [];
      },
      getData: (): T[] => allData,
      getState: () => ({
        currentPage,
        pageSize,
        isLoading,
        hasMore: hasMoreData,
        totalItems: allData.length,
      }),
    };

    return loader;
  }

  createLazyImageLoader(_options: AnyRecord = {}): LazyImageLoader {
    const imageCache = new Map<string, boolean>();
    const loadingImages = new Set<string>();

    return {
      loadImage: async (uri: string) => {
        const cached = imageCache.get(uri);
        if (cached !== undefined) {
          return { uri, loaded: cached, cached: true };
        }
        loadingImages.add(uri);
        try {
          imageCache.set(uri, true);
          loadingImages.delete(uri);
          return { uri, loaded: true, cached: false };
        } catch (_error) {
          loadingImages.delete(uri);
          imageCache.set(uri, false);
          return { uri, loaded: false, cached: false };
        }
      },
      preloadImages: async (uris: string[]) => {
        await Promise.allSettled(uris.map((uri) => 
          new Promise<void>((resolve) => {
            imageCache.set(uri, true);
            resolve();
          })
        ));
      },
      clearCache: () => {
        imageCache.clear();
        loadingImages.clear();
      },
      getCacheStats: () => ({
        cachedCount: imageCache.size,
        loadingCount: loadingImages.size,
      }),
    };
  }

  createIntersectionObserver(_options: AnyRecord = {}): IntersectionObserver {
    const observedElements = new Map<string, { visible: boolean; triggered: boolean }>();

    return {
      observe: (elementId: string, _callback: (id: string) => void) => {
        observedElements.set(elementId, { visible: false, triggered: false });
      },
      unobserve: (elementId: string) => {
        observedElements.delete(elementId);
      },
      triggerVisibility: (elementId: string, isVisible: boolean) => {
        const el = observedElements.get(elementId);
        if (el && isVisible && !el.triggered) {
          el.visible = true;
          el.triggered = true;
        }
      },
      getStats: () => ({
        observed: observedElements.size,
        visible: [...observedElements.values()].filter((el) => el.visible).length,
      }),
    };
  }

  createDataChunker<T>(
    data: T[],
    options: { chunkSize?: number; preloadAhead?: number } = {},
  ): DataChunker<T> {
    const chunkSize = options.chunkSize || 50;
    const preloadAhead = options.preloadAhead || 2;
    const totalChunks = Math.ceil(data.length / chunkSize);
    let currentChunkIndex = 0;
    const loadedChunks = new Set<number>();

    return {
      getChunk: (index: number): T[] => {
        if (index >= totalChunks) {
          return [];
        }
        const start = index * chunkSize;
        const end = Math.min(start + chunkSize, data.length);
        loadedChunks.add(index);
        return data.slice(start, end);
      },
      getCurrentChunk: function (): T[] {
        return this.getChunk(currentChunkIndex);
      },
      loadNextChunk: function (): T[] {
        currentChunkIndex++;
        if (currentChunkIndex < totalChunks) {
          return this.getChunk(currentChunkIndex);
        }
        return [];
      },
      preloadUpcomingChunks: function (): void {
        for (let i = 1; i <= preloadAhead; i++) {
          const nextIndex = currentChunkIndex + i;
          if (nextIndex < totalChunks) {
            this.getChunk(nextIndex);
          }
        }
      },
      getAllLoaded: (): T[] => {
        const loadedData: T[] = [];
        for (const chunkIdx of [...loadedChunks].sort()) {
          const start = chunkIdx * chunkSize;
          const end = Math.min(start + chunkSize, data.length);
          loadedData.push(...data.slice(start, end));
        }
        return loadedData;
      },
      getStats: () => ({
        totalChunks,
        loadedChunks: loadedChunks.size,
        currentChunk: currentChunkIndex,
        chunkSize,
      }),
    };
  }

  createMemoryEfficientRenderer<T>(
    _options: { maxCachedItems?: number } = {},
  ): MemoryEfficientRenderer<T> {
    const renderedItems = new Map<string, React.ReactNode>();
    const recycledComponents: React.ReactNode[] = [];

    return {
      renderItem: (
        item: T,
        index: number,
        renderer: (item: T, idx: number) => React.ReactNode,
      ): React.ReactNode => {
        const key = String(index);
        let component: React.ReactNode;

        if (recycledComponents.length > 0) {
          component = recycledComponents.pop()!;
        } else {
          component = renderer(item, index);
        }

        renderedItems.set(key, component);
        return component;
      },
      recycleItems: (visibleItemKeys: string[]): void => {
        const visibleSet = new Set(visibleItemKeys);
        for (const [key, component] of renderedItems) {
          if (!visibleSet.has(key)) {
            recycledComponents.push(component);
            renderedItems.delete(key);
          }
        }
      },
      clearAll: (): void => {
        renderedItems.clear();
        recycledComponents.length = 0;
      },
      getStats: () => ({
        renderedCount: renderedItems.size,
        recycledCount: recycledComponents.length,
      }),
    };
  }

  updateScreenDimensions(): void {
    const { width, height } = Dimensions.get('window');
    this.screenHeight = height;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void width;
  }

  getPerformanceRecommendations(_listStats: AnyRecord): string[] {
    const recommendations: string[] = [];
    recommendations.push('Use getItemLayout for fixed-height items');
    recommendations.push('Set removeClippedSubviews=true for long lists');
    return recommendations;
  }
}

export default LazyLoadingHelper;
