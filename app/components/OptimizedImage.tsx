// 入境通 - Optimized Image Component with Loading States and Lazy Loading
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  type ImageResizeMode,
  type ImageStyle,
  type NativeSyntheticEvent,
  type ImageLoadEventData,
  type ImageErrorEventData,
  type StyleProp,
  type ImageProps,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme';

type AnimatedImageProps = Omit<ImageProps, 'source'>;

export interface OptimizedImageProps extends AnimatedImageProps {
  uri?: string | null;
  showLoadingText?: boolean;
  loadingText?: string;
  errorText?: string;
  placeholder?: string;
  lazy?: boolean;
  lazyLoadDelay?: number;
  fadeDuration?: number;
  style?: StyleProp<ImageStyle>;
}

const DEFAULT_LOADING_TEXT = 'Loading photo...';
const DEFAULT_ERROR_TEXT = 'Failed to load photo';
const DEFAULT_PLACEHOLDER = '📷';

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  resizeMode = 'cover' as ImageResizeMode,
  showLoadingText = true,
  loadingText = DEFAULT_LOADING_TEXT,
  errorText = DEFAULT_ERROR_TEXT,
  placeholder = DEFAULT_PLACEHOLDER,
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

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    if (uri) {
      setImageLoading(true);
      setImageError(false);
      setRetryCount(0);
      fadeAnim.setValue(0);
    }
  }, [uri, fadeAnim]);

  useEffect(() => {
    if (lazy && !shouldLoad) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setShouldLoad(true);
        }
      }, lazyLoadDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [lazy, shouldLoad, lazyLoadDelay]);

  const handleLoadStart = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }
    setImageLoading(true);
    setImageError(false);
  }, []);

  const handleLoad = useCallback(
    (event: NativeSyntheticEvent<ImageLoadEventData>) => {
      if (!mountedRef.current) {
        return;
      }
      setImageLoading(false);
      setImageError(false);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start();

      onLoad?.(event);
    },
    [fadeAnim, fadeDuration, onLoad],
  );

  const handleError = useCallback(
    (event: NativeSyntheticEvent<ImageErrorEventData>) => {
      if (!mountedRef.current) {
        return;
      }
      setImageLoading(false);
      setImageError(true);

      if (retryCount < 1) {
        setTimeout(() => {
          if (mountedRef.current) {
            setRetryCount((prev) => prev + 1);
            setImageLoading(true);
            setImageError(false);
          }
        }, 1000);
      }

      onError?.(event);
      console.error('[OptimizedImage] Image load error:', event.nativeEvent);
    },
    [retryCount, onError],
  );

  const flattenedStyle = StyleSheet.flatten(style) as ImageStyle | undefined;
  const baseViewStyle = flattenedStyle as ViewStyle | undefined;

  if (!uri) {
    return (
      <View style={[baseViewStyle, styles.placeholderContainer]}>
        <Text style={styles.placeholderIcon}>{placeholder}</Text>
        <Text style={styles.placeholderText}>No photo</Text>
      </View>
    );
  }

  if (lazy && !shouldLoad) {
    return (
      <View style={[baseViewStyle, styles.placeholderContainer]}>
        <Text style={styles.placeholderIcon}>{placeholder}</Text>
        {showLoadingText ? <Text style={styles.placeholderText}>{loadingText}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[baseViewStyle, styles.container]}>
      {imageLoading && !imageError ? (
        <View style={[StyleSheet.absoluteFillObject, styles.loadingContainer]}>
          <ActivityIndicator size="small" color={colors.primary} />
          {showLoadingText ? <Text style={styles.loadingText}>{loadingText}</Text> : null}
        </View>
      ) : null}

      {imageError ? (
        <View style={[baseViewStyle, styles.errorContainer]}>
          <Text style={styles.errorIcon}>{placeholder}</Text>
          <Text style={styles.errorText}>{errorText}</Text>
          {retryCount > 0 ? (
            <Text style={styles.retryText}>
              Retried {retryCount} time{retryCount > 1 ? 's' : ''}
            </Text>
          ) : null}
        </View>
      ) : (
        <Animated.Image
          source={{ uri }}
          style={[style, { opacity: fadeAnim }]}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          fadeDuration={0}
          progressiveRenderingEnabled
          resizeMethod="resize"
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
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