/**
 * ErrorBoundary Component
 *
 * React error boundary with retry functionality for graceful error handling.
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: (retryCount: number) => void;
  fallback?: React.ReactNode;
  retryCount?: number;
  hasError?: boolean;
  showErrorDetails?: boolean;
  showRetryButton?: boolean;
  containerStyle?: Record<string, unknown>;
  [extra: string]: unknown;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { onRetry } = this.props;
    const { retryCount } = this.state;

    // Increment retry count
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
    });

    // Call onRetry callback if provided
    if (onRetry) {
      onRetry(retryCount + 1);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const {
      fallback,
      children,
      showDetails = false,
      maxRetries = 3,
      customMessage,
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback({
          error,
          errorInfo,
          retry: this.handleRetry,
          reset: this.handleReset,
          retryCount,
        });
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>

            <Text style={styles.title}>出错了</Text>

            <Text style={styles.message}>
              {customMessage || '加载数据时出现问题，请重试。'}
            </Text>

            {retryCount > 0 && (
              <Text style={styles.retryInfo}>
                重试次数: {retryCount}/{maxRetries}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              {retryCount < maxRetries && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={this.handleRetry}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>🔄 重试</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.resetButton}
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <Text style={styles.resetButtonText}>返回</Text>
              </TouchableOpacity>
            </View>

            {showDetails && error && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>错误详情:</Text>
                <View style={styles.detailsContent}>
                  <Text style={styles.detailsText}>
                    {error.toString()}
                  </Text>
                  {errorInfo && errorInfo.componentStack && (
                    <Text style={styles.detailsText}>
                      {errorInfo.componentStack}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {retryCount >= maxRetries && (
              <View style={styles.maxRetriesContainer}>
                <Text style={styles.maxRetriesText}>
                  已达到最大重试次数。请稍后再试，或联系技术支持。
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  retryInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  resetButtonText: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  detailsContainer: {
    width: '100%',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailsContent: {
    maxHeight: 200,
  },
  detailsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  maxRetriesContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  maxRetriesText: {
    ...typography.body2,
    color: colors.error,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ErrorBoundary;
