/**
 * OfflineIndicator - Shows a banner when the app is offline
 * Displays queue status and provides retry functionality
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import OfflineQueueService from '../../services/offline/OfflineQueueService';

interface OfflineIndicatorProps {
  /** Whether to show the offline indicator */
  visible?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ visible = true }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const slideAnim = React.useRef(new Animated.Value(-60)).current;

  const updateStatus = useCallback(async () => {
    try {
      const status = await OfflineQueueService.getStatus();
      setIsOffline(!status.isOnline);
      setQueueSize(status.queueSize);
    } catch (error) {
      console.error('[OfflineIndicator] Failed to get status:', error);
    }
  }, []);

  useEffect(() => {
    // Initial check
    updateStatus();

    // Subscribe to queue status changes
    const unsubscribe = OfflineQueueService.subscribe((status) => {
      setIsOffline(!status.isOnline);
      setQueueSize(status.queueSize);
    });

    return () => {
      unsubscribe();
    };
  }, [updateStatus]);

  // Animate banner when offline state changes
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline && visible ? 0 : -60,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [isOffline, visible, slideAnim]);

  const handleRetry = async () => {
    try {
      await OfflineQueueService.processQueue();
      await updateStatus();
    } catch (error) {
      console.error('[OfflineIndicator] Retry failed:', error);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isOffline ? 'Offline Mode' : 'Back Online'}
          </Text>
          <Text style={styles.subtitle}>
            {isOffline
              ? queueSize > 0
                ? `${queueSize} operation${queueSize !== 1 ? 's' : ''} pending`
                : 'Changes will sync when connected'
              : 'Your data is syncing...'}
          </Text>
        </View>
        {isOffline && queueSize > 0 && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#FEF3C7', // amber-50
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D', // amber-300
    paddingTop: 50, // Safe area padding for notch
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E', // amber-800
  },
  subtitle: {
    fontSize: 12,
    color: '#B45309', // amber-700
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: '#D97706', // amber-600
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfflineIndicator;
