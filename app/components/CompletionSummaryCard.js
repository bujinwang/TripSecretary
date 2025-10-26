// 入境通 - Completion Summary Card Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

const CompletionSummaryCard = ({
  completionPercent = 0,
  status = 'incomplete',
  showProgressBar = true,
  country = 'thailand' // 'thailand', 'malaysia', 'japan', etc.
}) => {
  // Country-specific emojis and text
  const countryConfig = {
    thailand: {
      readyEmoji: '🌴',
      progressEmoji: '🌺',
      readyText: '泰国准备就绪！',
      progressText: '泰国之旅准备就绪！'
    },
    malaysia: {
      readyEmoji: '🌴',
      progressEmoji: '🇲🇾',
      readyText: '马来西亚准备就绪！',
      progressText: '马来西亚之旅准备就绪！'
    },
    japan: {
      readyEmoji: '🌸',
      progressEmoji: '🗾',
      readyText: '日本准备就绪！',
      progressText: '日本之旅准备就绪！'
    }
  };

  const config = countryConfig[country] || countryConfig.thailand;

  // Determine status text and color based on completion percentage
  const getStatusInfo = () => {
    if (completionPercent === 100) {
      return {
        text: `Ready! ${config.readyEmoji}`,
        textKey: `${country}.entryFlow.status.ready`,
        defaultText: `${config.readyText}${config.readyEmoji}`,
        color: colors.success,
        backgroundColor: '#E8F9F0', // Light green
      };
    } else if (completionPercent >= 50) {
      return {
        text: 'Great Progress! 💪',
        textKey: `${country}.entryFlow.status.mostlyComplete`,
        defaultText: '进展不错！💪',
        color: colors.warning,
        backgroundColor: '#FFF7E6', // Light orange
      };
    } else {
      return {
        text: `Let\'s Get Started! ${config.progressEmoji}`,
        textKey: `${country}.entryFlow.status.needsImprovement`,
        defaultText: `让我们开始吧！${config.progressEmoji}`,
        color: colors.primary,
        backgroundColor: '#F0F8FF', // Light blue
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={[styles.container, { backgroundColor: statusInfo.backgroundColor }]}>
      {/* Completion Percentage */}
      <View style={styles.percentageContainer}>
        <Text style={[styles.percentageText, { color: statusInfo.color }]}>
          {completionPercent}%
        </Text>
        <Text style={styles.percentageLabel}>
          准备进度
        </Text>
      </View>

      {/* Status Text */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.defaultText}
        </Text>
      </View>

      {/* Progress Bar */}
      {showProgressBar && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${completionPercent}%`,
                  backgroundColor: statusInfo.color
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completionPercent < 100
              ? `继续加油！还差 ${100 - completionPercent}% ${config.progressEmoji}`
              : `太棒了！${config.progressText}${config.readyEmoji}`
            }
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
  },
  percentageLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusContainer: {
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.h3,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 8, // Ensure some visual feedback even at 0%
  },
  progressText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default CompletionSummaryCard;