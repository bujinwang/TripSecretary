/**
 * ErrorBoundary Component
 *
 * React error boundary for catching and handling component errors
 * Prevents entire app from crashing when component errors occur
 */

import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n/LocaleContext';

class ErrorBoundaryBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging (always log errors, even in production)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View
          style={styles.container}
          accessibilityRole="alert"
          accessibilityLabel="Error screen"
        >
          <Text
            style={styles.emoji}
            accessibilityLabel="Warning icon"
          >
            ⚠️
          </Text>
          <Text
            style={styles.title}
            accessibilityRole="header"
          >
            {this.props.translations?.title || 'Something went wrong'}
          </Text>
          <Text style={styles.message}>
            {this.props.errorMessage || this.props.translations?.message || 'An unexpected error occurred. Please try again.'}
          </Text>

          {__DEV__ && this.state.error && (
            <View style={styles.devInfo}>
              <Text style={styles.devTitle}>Error Details (DEV mode):</Text>
              <Text style={styles.devText}>{this.state.error.toString()}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Attempts to recover from the error and reload the component"
          >
            <Text style={styles.buttonText}>
              {this.props.translations?.tryAgain || 'Try Again'}
            </Text>
          </TouchableOpacity>

          {this.props.onClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={this.props.onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close error message"
              accessibilityHint="Closes the error screen and returns to the previous view"
            >
              <Text style={styles.closeButtonText}>
                {this.props.translations?.close || 'Close'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

ErrorBoundaryBase.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  errorMessage: PropTypes.string,
  onReset: PropTypes.func,
  onClose: PropTypes.func,
  translations: PropTypes.shape({
    title: PropTypes.string,
    message: PropTypes.string,
    tryAgain: PropTypes.string,
    close: PropTypes.string,
  }),
};

ErrorBoundaryBase.defaultProps = {
  fallback: null,
  errorMessage: null,
  onReset: null,
  onClose: null,
  translations: null,
};

// Functional wrapper component that uses i18n hooks
const ErrorBoundary = (props) => {
  const { t } = useTranslation();

  const translations = {
    title: t('thailand.tdacWebView.errorBoundary.title'),
    message: t('thailand.tdacWebView.errorBoundary.message'),
    tryAgain: t('thailand.tdacWebView.errorBoundary.tryAgain'),
    close: t('thailand.tdacWebView.errorBoundary.close'),
  };

  return <ErrorBoundaryBase {...props} translations={translations} />;
};

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  errorMessage: PropTypes.string,
  onReset: PropTypes.func,
  onClose: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  fallback: null,
  errorMessage: null,
  onReset: null,
  onClose: null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  devInfo: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    maxWidth: '100%',
  },
  devTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  devText: {
    fontSize: 11,
    color: '#856404',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ErrorBoundary;
