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
  country = 'thailand' // 'thailand', 'malaysia', 'hongkong', 'japan', etc.
}) => {
  // Get country-specific emojis and texts
  const getCountryConfig = () => {
    const configs = {
      thailand: {
        readyText: '泰国准备就绪！🌴',
        progressText: (remaining) => `还差 ${remaining}% 即可完成`,
        completeText: null
      },
      malaysia: {
        readyText: '马来西亚准备就绪！🇲🇾',
        progressText: (remaining) => `还差 ${remaining}% 即可完成`,
        completeText: null
      },
      hongkong: {
        readyText: '香港准备就绪！🇭🇰',
        progressText: (remaining) => `还差 ${remaining}% 即可完成`,
        completeText: null
      },
      japan: {
        readyText: '日本准备就绪！🌸',
        progressText: (remaining) => `还差 ${remaining}% 即可完成`,
        completeText: null
      }
    };
    return configs[country] || configs.thailand;
  };

  const config = getCountryConfig();

  // Determine status text and color based on completion percentage
  const getStatusInfo = () => {
    if (completionPercent === 100) {
      return {
        text: config.readyText,
        textKey: `${country}.entryFlow.status.ready`,
        defaultText: config.readyText,
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
        text: 'Let\'s Get Started! 🌺',
        textKey: `${country}.entryFlow.status.needsImprovement`,
        defaultText: '让我们开始吧！🌺',
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
        <View style={[
          styles.progressBarContainer,
          completionPercent === 100 && styles.progressBarContainerCompact
        ]}>
          <View style={[
            styles.progressBarBackground,
            completionPercent === 100 && styles.progressBarBackgroundCompact
          ]}>
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
          {completionPercent < 100 && (
            <Text style={styles.progressText}>
              {config.progressText(100 - completionPercent)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  percentageText: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
  },
  percentageLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusContainer: {
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarContainerCompact: {
    marginBottom: 0,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarBackgroundCompact: {
    marginBottom: 0,
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
