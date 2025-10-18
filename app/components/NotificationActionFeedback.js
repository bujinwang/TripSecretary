/**
 * NotificationActionFeedback - Component to display feedback when users interact with notification actions
 * 
 * Features:
 * - Show toast/banner feedback for notification actions
 * - Auto-dismiss after timeout
 * - Support different feedback types (success, info, warning)
 * - Localized messages
 * 
 * Requirements: 16.3, 16.5
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import NotificationService from '../services/notification/NotificationService';

const NotificationActionFeedback = () => {
  const [feedback, setFeedback] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Check for pending feedback when component mounts
    checkForPendingFeedback();

    // Set up interval to check for new feedback
    const interval = setInterval(checkForPendingFeedback, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkForPendingFeedback = async () => {
    try {
      const pendingFeedback = await NotificationService.getPendingActionFeedback();
      
      if (pendingFeedback && !feedback) {
        setFeedback(pendingFeedback);
        showFeedback();
      }
    } catch (error) {
      console.error('Error checking for pending feedback:', error);
    }
  };

  const showFeedback = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000), // Show for 3 seconds
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFeedback(null);
    });
  };

  const dismissFeedback = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setFeedback(null);
    });
  };

  const getFeedbackStyle = (actionType) => {
    switch (actionType) {
      case 'submit':
      case 'resubmit':
        return styles.successFeedback;
      case 'view':
      case 'continue':
        return styles.infoFeedback;
      case 'archive':
      case 'cleanup':
        return styles.warningFeedback;
      default:
        return styles.defaultFeedback;
    }
  };

  const getFeedbackIcon = (actionType) => {
    switch (actionType) {
      case 'submit':
      case 'resubmit':
        return '✓';
      case 'view':
        return '👁';
      case 'continue':
        return '▶';
      case 'archive':
        return '📦';
      case 'cleanup':
        return '🧹';
      default:
        return 'ℹ';
    }
  };

  if (!feedback) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        getFeedbackStyle(feedback.actionType),
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>
          {getFeedbackIcon(feedback.actionType)}
        </Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{feedback.title}</Text>
          <Text style={styles.message}>{feedback.message}</Text>
        </View>
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={dismissFeedback}
        >
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    color: '#fff',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  successFeedback: {
    backgroundColor: '#4CAF50',
  },
  infoFeedback: {
    backgroundColor: '#2196F3',
  },
  warningFeedback: {
    backgroundColor: '#FF9800',
  },
  defaultFeedback: {
    backgroundColor: '#757575',
  },
});

export default NotificationActionFeedback;