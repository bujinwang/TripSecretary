/**
 * useViewportVisibility Hook
 *
 * A React Native implementation of Intersection Observer API
 * Detects when a component enters or leaves the viewport
 *
 * Useful for:
 * - Lazy loading images only when visible
 * - Pausing/playing videos based on visibility
 * - Analytics tracking (viewport impressions)
 * - Performance optimization
 *
 * Usage:
 * ```
 * const [ref, isVisible] = useViewportVisibility({
 *   threshold: 0.5,  // 50% visible
 *   rootMargin: 100, // Start loading 100px before visible
 * });
 *
 * return (
 *   <View ref={ref}>
 *     {isVisible && <OptimizedImage uri={imageUri} />}
 *   </View>
 * );
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to detect if a component is visible in the viewport
 *
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Percentage of element that must be visible (0-1)
 * @param {number} options.rootMargin - Margin in pixels to expand the viewport (can be negative)
 * @param {boolean} options.once - Only trigger once when element becomes visible
 * @param {Function} options.onVisibilityChange - Callback when visibility changes
 * @returns {[Function, boolean]} [ref function to attach to element, isVisible boolean]
 */
export const useViewportVisibility = (options = {}) => {
  const {
    threshold = 0,
    rootMargin = 0,
    once = false,
    onVisibilityChange,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const viewRef = useRef(null);
  const intervalRef = useRef(null);

  /**
   * Check if the element is visible in the viewport
   */
  const checkVisibility = useCallback(() => {
    if (!viewRef.current) {
return;
}

    // Skip check if already visible and once=true
    if (once && hasBeenVisible) {
return;
}

    viewRef.current.measureInWindow((x, y, width, height) => {
      // Get viewport dimensions
      const windowHeight = require('react-native').Dimensions.get('window').height;
      const windowWidth = require('react-native').Dimensions.get('window').width;

      // Calculate visible area
      const visibleTop = Math.max(0, y);
      const visibleBottom = Math.min(windowHeight, y + height);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      const visibleLeft = Math.max(0, x);
      const visibleRight = Math.min(windowWidth, x + width);
      const visibleWidth = Math.max(0, visibleRight - visibleLeft);

      // Calculate visible percentage
      const visibleArea = visibleHeight * visibleWidth;
      const totalArea = height * width;
      const visiblePercentage = totalArea > 0 ? visibleArea / totalArea : 0;

      // Check if element is within viewport (with margin)
      const isInViewport =
        y + height + rootMargin >= 0 &&
        y - rootMargin <= windowHeight &&
        x + width + rootMargin >= 0 &&
        x - rootMargin <= windowWidth &&
        visiblePercentage >= threshold;

      // Update visibility state
      if (isInViewport !== isVisible) {
        setIsVisible(isInViewport);

        if (isInViewport && once) {
          setHasBeenVisible(true);
        }

        // Call callback if provided
        if (onVisibilityChange) {
          onVisibilityChange(isInViewport);
        }
      }
    });
  }, [threshold, rootMargin, once, hasBeenVisible, isVisible, onVisibilityChange]);

  /**
   * Ref callback to attach to the element
   */
  const setRef = useCallback((node) => {
    viewRef.current = node;

    // Start checking visibility when ref is set
    if (node && !intervalRef.current) {
      // Initial check
      setTimeout(checkVisibility, 100);

      // Set up interval for continuous checking
      intervalRef.current = setInterval(checkVisibility, 300);
    }
  }, [checkVisibility]);

  /**
   * Cleanup interval on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return [setRef, isVisible];
};

/**
 * Hook specifically for lazy loading images
 * Automatically handles the common case of loading images when visible
 *
 * @param {Object} options - Configuration options
 * @returns {[Function, boolean, boolean]} [ref, isVisible, shouldLoad]
 */
export const useLazyLoad = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = 100, // Start loading 100px before visible
    once = true,
  } = options;

  const [ref, isVisible] = useViewportVisibility({
    threshold,
    rootMargin,
    once,
  });

  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (isVisible && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isVisible, shouldLoad]);

  return [ref, isVisible, shouldLoad];
};

/**
 * Hook for tracking viewport impressions (analytics)
 * Fires callback when element has been visible for a minimum duration
 *
 * @param {Function} onImpression - Callback when impression is recorded
 * @param {Object} options - Configuration options
 * @param {number} options.minDuration - Minimum visible duration in ms (default: 1000)
 * @param {number} options.threshold - Visibility threshold (default: 0.5)
 * @returns {Function} ref to attach to element
 */
export const useViewportImpression = (onImpression, options = {}) => {
  const {
    minDuration = 1000,
    threshold = 0.5,
  } = options;

  const impressionFiredRef = useRef(false);
  const visibleStartTimeRef = useRef(null);
  const timerRef = useRef(null);

  const handleVisibilityChange = useCallback((isVisible) => {
    if (isVisible && !impressionFiredRef.current) {
      // Start tracking visible time
      if (!visibleStartTimeRef.current) {
        visibleStartTimeRef.current = Date.now();

        // Set timer to fire impression after minDuration
        timerRef.current = setTimeout(() => {
          if (!impressionFiredRef.current) {
            impressionFiredRef.current = true;
            onImpression();
          }
        }, minDuration);
      }
    } else {
      // Element no longer visible, reset timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      visibleStartTimeRef.current = null;
    }
  }, [minDuration, onImpression]);

  const [ref] = useViewportVisibility({
    threshold,
    onVisibilityChange: handleVisibilityChange,
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return ref;
};

export default {
  useViewportVisibility,
  useLazyLoad,
  useViewportImpression,
};
