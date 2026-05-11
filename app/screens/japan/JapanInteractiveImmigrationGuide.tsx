// @ts-nocheck
// 入境通 - Japan Interactive Immigration Guide (日本互动入境指南)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme';
import { useTranslation } from '../../i18n/LocaleContext';
import BackButton from '../../components/BackButton';
import EntryInfoService from '../../services/EntryInfoService';

const JapanInteractiveImmigrationGuide = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { entryPackId, destinationId, currentStep: initialStep = 0 } = route.params || {};
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Japan-specific immigration steps
  const japanSteps = [
    {
      id: 0,
      title: '📱 第一步：落地前准备',
      description: '关闭蜂窝网络数据，激活日本eSIM卡',
      instruction: '飞机滑行时关闭手机数据和WiFi，准备离线模式',
      action: '我已准备好',
      voiceText: '请确认您的手机已关闭蜂窝网络数据，准备进入日本入境流程',
    },
    {
      id: 1,
      title: '🛬 第二步：前往入境检查柜台',
      description: '寻找Immigration标识，外国人通道',
      instruction: '跟随机场指示牌前往入境检查区域，选择Foreign Passport通道',
      action: '已到达柜台',
      voiceText: '请前往入境检查柜台，寻找标有Immigration的区域',
    },
    {
      id: 2,
      title: '📄 第三步：准备必要文件',
      description: '准备护照、居留卡和通关包',
      instruction: '准备好护照原件、居留卡和手机中的通关包页面',
      action: '文件已准备',
      voiceText: '请准备好护照、居留卡和手机中的通关包',
    },
    {
      id: 3,
      title: '👮 第四步：向移民官展示文件',
      description: '出示护照、居留卡和通关包',
      instruction: '将护照和居留卡递给移民官，同时展示手机中的通关包',
      action: '向海关展示',
      voiceText: '现在向移民官出示您的护照、居留卡和通关包',
      showToOfficer: true,
    },
    {
      id: 4,
      title: '📸 第五步：配合生物识别采集',
      description: '按移民官指示进行指纹和面部扫描',
      instruction: '将手指放在扫描仪上，面向摄像头保持自然表情',
      action: '采集完成',
      voiceText: '请配合移民官进行指纹和面部信息采集',
    },
    {
      id: 5,
      title: '✅ 第六步：完成入境手续',
      description: '收回护照，确认入境章',
      instruction: '检查护照上的入境章，确认入境日期和停留期限',
      action: '入境完成',
      voiceText: '恭喜！您已成功完成日本入境手续',
      isFinal: true,
    },
  ];

  const handleNextStep = useCallback(async () => {
    const stepData = japanSteps[currentStep];

    // Handle "Show to Officer" action
    if (stepData?.showToOfficer) {
      try {
        // Navigate to ImmigrationOfficerViewScreen
        navigation.navigate('ImmigrationOfficerView', {
          entryPackId,
          fromImmigrationGuide: true,
        });
        return;
      } catch (error) {
        console.error('Error navigating to officer view:', error);
        Alert.alert('错误', '无法打开展示页面，请稍后重试');
        return;
      }
    }

    // Handle final step - mark entry pack as completed
    if (stepData?.isFinal) {
      try {
        Vibration.vibrate(120);

        // Mark entry info as completed in immigration guide
        if (entryPackId) {
          await EntryInfoService.updateEntryInfo(entryPackId, {
            display_status: JSON.stringify({
              immigration_completed: true,
              completed_at: new Date().toISOString(),
              completed_by: 'interactive_guide'
            })
          });
        }

        Alert.alert(
          '🎉 入境完成！',
          '恭喜您成功完成日本入境手续！\n\n祝您在日本旅途愉快！',
          [
            {
              text: '好的',
              onPress: () => {
                // Navigate back to entry pack detail or home
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Home');
                }
              },
            },
          ]
        );
        return;
      } catch (error) {
        console.error('Error marking immigration completed:', error);
        // Still show success message even if marking fails
        Alert.alert(
          '🎉 入境完成！',
          '恭喜您成功完成日本入境手续！\n\n祝您在日本旅途愉快！',
          [
            {
              text: '好的',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
        return;
      }
    }

    // Move to next step
    if (currentStep < japanSteps.length - 1) {
      Vibration.vibrate(100);
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, entryPackId, navigation]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleEmergency = useCallback(() => {
    Alert.alert(
      '🚨 需要帮助',
      '如果您在入境过程中遇到困难，可以：',
      [
        {
          text: '寻找机场工作人员',
          onPress: () => Alert.alert(
            '💡 提示',
            '寻找穿制服的机场工作人员，他们通常会说英语并能提供帮助'
          )
        },
        {
          text: '语言帮助',
          onPress: () => Alert.alert(
            '🗣️ 语言帮助',
            '可以使用翻译软件或指向手机屏幕上的文字与工作人员沟通'
          )
        },
        {
          text: '紧急情况',
          onPress: () => Alert.alert(
            '🚨 紧急联系',
            '如遇紧急情况，请联系中国驻日本大使馆或拨打当地紧急电话'
          )
        },
        { text: '取消', style: 'cancel' },
      ]
    );
  }, []);

  const currentStepData = japanSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          showLabel={false}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>日本入境指引</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / japanSteps.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} / {japanSteps.length}
        </Text>
      </View>

      {/* Emergency Button */}
      <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
        <Text style={styles.emergencyIcon}>🚨</Text>
        <Text style={styles.emergencyText}>需要帮助</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Current Step */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>{currentStep + 1}</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
              <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            </View>
          </View>

          <View style={styles.instructionBox}>
            <Text style={styles.instructionIcon}>💡</Text>
            <Text style={styles.instructionText}>{currentStepData.instruction}</Text>
          </View>

          {/* Special actions for specific steps */}
          {currentStepData.showToOfficer && (
            <View style={styles.specialActionContainer}>
              <Text style={styles.specialActionTitle}>📱 准备向海关展示</Text>
              <Text style={styles.specialActionDescription}>
                点击下方按钮将打开专门的展示页面，屏幕会自动调整为最佳亮度和方向
              </Text>
            </View>
          )}

          {currentStepData.isFinal && (
            <View style={styles.congratulationsContainer}>
              <Text style={styles.congratulationsIcon}>🎉</Text>
              <Text style={styles.congratulationsTitle}>即将完成入境！</Text>
              <Text style={styles.congratulationsText}>
                完成这一步后，您的日本入境手续就全部完成了
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.navButtonSecondary}
            onPress={handlePreviousStep}
          >
            <Text style={styles.navButtonTextSecondary}>上一步</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.navButtonPrimary,
            currentStepData.showToOfficer && styles.navButtonShowOfficer,
            currentStepData.isFinal && styles.navButtonFinal,
          ]}
          onPress={handleNextStep}
        >
          <Text style={styles.navButtonTextPrimary}>
            {currentStepData.action}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    marginLeft: spacing.sm,
    color: colors.text,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  emergencyButton: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    backgroundColor: '#FF3B30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  emergencyIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  emergencyText: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  stepCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 40,
    fontSize: 20,
    fontWeight: '700',
    marginRight: spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    color: '#000000',
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 22,
  },
  instructionBox: {
    backgroundColor: '#E8F5E9',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  instructionText: {
    fontSize: 15,
    color: '#1C1C1E',
    flex: 1,
    lineHeight: 22,
  },
  specialActionContainer: {
    backgroundColor: '#FFF3CD',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  specialActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: spacing.xs,
  },
  specialActionDescription: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  congratulationsContainer: {
    backgroundColor: '#E8F5E9',
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  congratulationsIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  congratulationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: spacing.xs,
  },
  congratulationsText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  navButtonSecondary: {
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonTextSecondary: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
  },
  navButtonPrimary: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonShowOfficer: {
    backgroundColor: '#007AFF',
  },
  navButtonFinal: {
    backgroundColor: '#FF9500',
  },
  navButtonTextPrimary: {
    fontSize: 17,
    color: colors.white,
    fontWeight: '600',
  },
});

export default JapanInteractiveImmigrationGuide;