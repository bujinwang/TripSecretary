// 入境通 - Optimized Image Component with Loading States
import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme';

const OptimizedImage = ({ 
  uri, 
  style, 
  resizeMode = 'cover',
  showLoadingText = true,
  loadingText = 'Loading photo...',
  errorText = 'Failed to load photo',
  placeholder = '📷',
  onLoad,
  onError,
  ...props 
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reset states when URI changes
  useEffect(() => {
    if (uri) {
      setImageLoading(true);
      setImageError(false);
      setRetryCount(0);
    }
  }, [uri]);

  const handleLoadStart = () => {
    setImageLoading(true);
    setImageError(false);
  };

  const handleLoad = (event) => {
    setImageLoading(false);
    setImageError(false);
    onLoad?.(event);
  };

  const handleError = (error) => {
    setImageLoading(false);
    setImageError(true);
    
    // Auto-retry once after a short delay
    if (retryCount < 1) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageLoading(true);
        setImageError(false);
      }, 1000);
    }
    
    onError?.(error);
    console.error('[OptimizedImage] Image load error:', error.nativeEvent);
  };

  if (!uri) {
    return (
      <View style={[style, styles.placeholderContainer]}>
        <Text style={styles.placeholderIcon}>{placeholder}</Text>
        <Text style={styles.placeholderText}>No photo</Text>
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
        <Image
          source={{ uri }}
          style={style}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          // Performance optimizations
          fadeDuration={200}
          progressiveRenderingEnabled={true}
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