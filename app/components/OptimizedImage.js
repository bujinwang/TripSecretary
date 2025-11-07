// 入境通 - Optimized Image Component with Loading States and Lazy Loading
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors } from '../theme';

/**
 * OptimizedImage Component
 *
 * Features:
 * - Lazy loading (optional)
 * - Fade-in animation
 * - Auto-retry on error
 * - Loading and error states
 * - Memory-efficient with proper cleanup
 * - Progressive rendering
 *
 * @param {Object} props
 * @param {string} props.uri - Image URI
 * @param {boolean} props.lazy - Enable lazy loading (default: false)
 * @param {number} props.lazyLoadDelay - Delay before loading lazy images in ms (default: 100)
 * @param {number} props.fadeDuration - Fade-in animation duration in ms (default: 200)
 */
const OptimizedImage = ({
  uri,
  style,
  resizeMode = 'cover',
  showLoadingText = true,
  loadingText = 'Loading photo...',
  errorText = 'Failed to load photo',
  placeholder = '📷',
  lazy = false,
  lazyLoadDelay = 100,
  fadeDuration = 200,
  onLoad,
  onError,
  ...props
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset states when URI changes
  useEffect(() => {
    if (uri) {
      setImageLoading(true);
      setImageError(false);
      setRetryCount(0);
      fadeAnim.setValue(0);
    }
  }, [uri, fadeAnim]);

  // Handle lazy loading
  useEffect(() => {
    if (lazy && !shouldLoad) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setShouldLoad(true);
        }
      }, lazyLoadDelay);
      return () => clearTimeout(timer);
    }
  }, [lazy, shouldLoad, lazyLoadDelay]);

  const handleLoadStart = useCallback(() => {
    if (!mountedRef.current) {
return;
}
    setImageLoading(true);
    setImageError(false);
  }, []);

  const handleLoad = useCallback((event) => {
    if (!mountedRef.current) {
return;
}
    setImageLoading(false);
    setImageError(false);

    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: fadeDuration,
      useNativeDriver: true,
    }).start();

    onLoad?.(event);
  }, [fadeDuration, fadeAnim, onLoad]);

  const handleError = useCallback((error) => {
    if (!mountedRef.current) {
return;
}
    setImageLoading(false);
    setImageError(true);

    // Auto-retry once after a short delay
    if (retryCount < 1) {
      setTimeout(() => {
        if (mountedRef.current) {
          setRetryCount(prev => prev + 1);
          setImageLoading(true);
          setImageError(false);
        }
      }, 1000);
    }

    onError?.(error);
    console.error('[OptimizedImage] Image load error:', error.nativeEvent);
  }, [retryCount, onError]);

  // Don't render image if URI is missing
  if (!uri) {
    return (
      <View style={[style, styles.placeholderContainer]}>
        <Text style={styles.placeholderIcon}>{placeholder}</Text>
        <Text style={styles.placeholderText}>No photo</Text>
      </View>
    );
  }

  // Don't load image if lazy loading is enabled and not ready
  if (lazy && !shouldLoad) {
    return (
      <View style={[style, styles.placeholderContainer]}>
        <Text style={styles.placeholderIcon}>{placeholder}</Text>
        {showLoadingText && (
          <Text style={styles.placeholderText}>
            {loadingText}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[style, { position: 'relative' }]}>
      {/* Loading overlay */}
      {imageLoading && !imageError && (
        <View style={[
          StyleSheet.absoluteFill,
          styles.loadingContainer
        ]}>
          <ActivityIndicator size="small" color={colors.primary} />
          {showLoadingText && (
            <Text style={styles.loadingText}>
              {loadingText}
            </Text>
          )}
        </View>
      )}

      {/* Error state */}
      {imageError ? (
        <View style={[style, styles.errorContainer]}>
          <Text style={styles.errorIcon}>{placeholder}</Text>
          <Text style={styles.errorText}>
            {errorText}
          </Text>
          {retryCount > 0 && (
            <Text style={styles.retryText}>
              Retried {retryCount} time{retryCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      ) : (
        <Animated.Image
          source={{ uri }}
          style={[style, { opacity: fadeAnim }]}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          // Performance optimizations
          fadeDuration={0} // We handle fade animation ourselves
          progressiveRenderingEnabled={true}
          resizeMethod="resize" // Use resize for better memory efficiency
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.7,
  },
  placeholderContainer: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default OptimizedImage;