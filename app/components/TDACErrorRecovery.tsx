// @ts-nocheck

/**
 * TDAC Error Recovery Component
 * Provides user-friendly error reporting and recovery options for TDAC submissions
 * 
 * Requirements: 5.1-5.5, 24.1-24.5
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Clipboard,
  ActivityIndicator
} from 'react-native';
import { colors } from '../theme';
import TDACErrorHandler from '../services/error/TDACErrorHandler';

const TDACErrorRecovery = ({ 
  visible, 
  onClose, 
  errorResult, 
  onRetry, 
  onAlternativeMethod, 
  onContactSupport,
  showAlternativeMethod = true,
  alternativeMethodText = 'Try Different Method'
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  React.useEffect(() => {
    let interval;
    
    if (retryCountdown > 0) {
      interval = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev <= 1) {
            setIsRetrying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [retryCountdown]);

  const handleRetry = () => {
    if (errorResult?.shouldRetry && errorResult?.retryDelay > 0) {
      setIsRetrying(true);
      setRetryCountdown(Math.ceil(errorResult.retryDelay / 1000));
      
      setTimeout(() => {
        setIsRetrying(false);
        setRetryCountdown(0);
        onRetry?.();
      }, errorResult.retryDelay);
    } else {
      onRetry?.();
    }
  };

  const handleCopyErrorId = () => {
    if (errorResult?.errorId) {
      Clipboard.setString(errorResult.errorId);
      Alert.alert('已复制', '错误ID已复制到剪贴板');
    }
  };

  const handleExportLog = async () => {
    try {
      const errorLog = await TDACErrorHandler.exportErrorLog();
      if (errorLog) {
        // In a real app, this would trigger sharing or email
        Alert.alert(
          '错误日志已准备',
          '错误日志已准备好发送给技术支持。请联系客服并提供错误ID。',
          [{ text: '好的' }]
        );
      }
    } catch (error) {
      Alert.alert('导出失败', '无法导出错误日志，请手动记录错误ID。');
    }
  };

  if (!visible || !errorResult) {
    return null;
  }

  const errorDialog = TDACErrorHandler.createErrorDialog(errorResult);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.icon}>{errorDialog.icon}</Text>
              <Text style={styles.title}>{errorDialog.title}</Text>
              <Text style={[styles.severity, styles[`severity_${errorDialog.severity}`]]}>
                {errorDialog.severity.toUpperCase()}
              </Text>
            </View>

            {/* Main Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{errorResult.userMessage}</Text>
            </View>

            {/* Error Details */}
            <View style={styles.detailsContainer}>
              <TouchableOpacity 
                style={styles.detailsToggle}
                onPress={() => setShowDetails(!showDetails)}
              >
                <Text style={styles.detailsToggleText}>
                  {showDetails ? '隐藏详情 ▲' : '显示详情 ▼'}
                </Text>
              </TouchableOpacity>

              {showDetails && (
                <View style={styles.details}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>错误ID:</Text>
                    <TouchableOpacity onPress={handleCopyErrorId}>
                      <Text style={[styles.detailValue, styles.errorId]}>
                        {errorResult.errorId} 📋
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>错误类型:</Text>
                    <Text style={styles.detailValue}>{errorResult.category}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>尝试次数:</Text>
                    <Text style={styles.detailValue}>
                      {errorResult.attemptNumber} / {errorResult.maxRetries}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>可恢复:</Text>
                    <Text style={[styles.detailValue, errorResult.recoverable ? styles.positive : styles.negative]}>
                      {errorResult.recoverable ? '是' : '否'}
                    </Text>
                  </View>

                  {errorResult.technicalMessage && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>技术信息:</Text>
                      <Text style={[styles.detailValue, styles.technicalMessage]}>
                        {errorResult.technicalMessage}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Suggestions */}
            {errorResult.suggestions && errorResult.suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>💡 建议解决方案:</Text>
                {errorResult.suggestions.slice(0, 4).map((suggestion, index) => (
                  <Text key={index} style={styles.suggestion}>
                    • {suggestion}
                  </Text>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              {/* Retry Button */}
              {(errorResult.shouldRetry || errorResult.recoverable) && (
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.primaryButton,
                    (isRetrying || retryCountdown > 0) && styles.disabledButton
                  ]}
                  onPress={handleRetry}
                  disabled={isRetrying || retryCountdown > 0}
                >
                  {isRetrying || retryCountdown > 0 ? (
                    <View style={styles.retryContent}>
                      <ActivityIndicator size="small" color={colors.white} />
                      <Text style={styles.actionButtonText}>
                        {retryCountdown > 0 ? `重试 (${retryCountdown}s)` : '重试中...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {errorResult.shouldRetry ? '自动重试' : '手动重试'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Alternative Method Button */}
              {showAlternativeMethod && errorResult.recoverable && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={onAlternativeMethod}
                >
                  <Text style={styles.secondaryButtonText}>{alternativeMethodText}</Text>
                </TouchableOpacity>
              )}

              {/* Contact Support Button */}
              {(!errorResult.recoverable || errorResult.category === 'system') && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.supportButton]}
                  onPress={() => {
                    Alert.alert(
                      '联系技术支持',
                      '您可以通过以下方式联系我们:\n\n1. 导出错误日志\n2. 记录错误ID\n3. 联系客服',
                      [
                        { text: '导出日志', onPress: handleExportLog },
                        { text: '复制错误ID', onPress: handleCopyErrorId },
                        { text: '联系客服', onPress: onContactSupport },
                        { text: '取消', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={styles.supportButtonText}>🆘 联系支持</Text>
                </TouchableOpacity>
              )}

              {/* Close Button */}
              <TouchableOpacity 
                style={[styles.actionButton, styles.closeButton]}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>关闭</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  content: {
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  icon: {
    fontSize: 48,
    marginBottom: 8
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4
  },
  severity: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden'
  },
  severity_info: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2'
  },
  severity_warning: {
    backgroundColor: '#fff3e0',
    color: '#f57c00'
  },
  severity_error: {
    backgroundColor: '#ffebee',
    color: '#d32f2f'
  },
  severity_critical: {
    backgroundColor: '#fce4ec',
    color: '#c2185b'
  },
  messageContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  message: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    textAlign: 'center'
  },
  detailsContainer: {
    marginBottom: 20
  },
  detailsToggle: {
    alignItems: 'center',
    paddingVertical: 8
  },
  detailsToggleText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600'
  },
  details: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
    flexShrink: 0
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  errorId: {
    color: colors.secondary,
    fontFamily: 'monospace'
  },
  positive: {
    color: '#4caf50'
  },
  negative: {
    color: '#f44336'
  },
  technicalMessage: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginTop: 4
  },
  suggestionsContainer: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8
  },
  suggestion: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
    lineHeight: 20
  },
  actions: {
    gap: 12
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButton: {
    backgroundColor: colors.secondary
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.secondary
  },
  supportButton: {
    backgroundColor: '#ff9800'
  },
  closeButton: {
    backgroundColor: '#f5f5f5'
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  retryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600'
  },
  supportButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default TDACErrorRecovery;