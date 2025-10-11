// 出国啰 - Interactive Immigration Guide (互动入境指南)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

const InteractiveImmigrationGuide = ({ navigation, route }) => {
  const { passport, destination, travelInfo, currentStep: initialStep = 0 } = route.params || {};
  const [currentStep, setCurrentStep] = useState(initialStep);

  const isJapan = destination?.id === 'jp' || destination?.name === '日本';

  const steps = isJapan ? [
    {
      id: 0,
      title: '📋 第一步：领取表格',
      description: '在入境大厅找到入境卡和海关申报单',
      instruction: '找到标有"入境卡"和"海关申报"的柜台或自动发放机',
      action: '我已拿到表格',
      voiceText: '请走到入境大厅的表格发放区，领取蓝色入境卡和黄色海关申报单',
    },
    {
      id: 1,
      title: '✍️ 第二步：填写入境卡',
      description: '用黑色或蓝色笔填写蓝色入境卡',
      instruction: '对照手机上的信息，仔细抄写到表格上',
      action: '开始填写入境卡',
      voiceText: '现在请用笔填写蓝色入境卡，姓名、护照号码、航班号等信息',
    },
    {
      id: 2,
      title: '📝 第三步：填写海关申报单',
      description: '填写黄色海关申报单',
      instruction: '如实申报携带物品，回答是否有违禁品等问题',
      action: '开始填写申报单',
      voiceText: '接下来填写黄色海关申报单，诚实回答所有问题',
    },
    {
      id: 3,
      title: '🏢 第四步：前往入境审查',
      description: '拿着填好的表格前往入境审查柜台',
      instruction: '排队等待叫号，交给工作人员检查',
      action: '前往入境柜台',
      voiceText: '请前往入境审查柜台，准备好护照和填好的表格',
    },
    {
      id: 4,
      title: '👤 第五步：生物识别检查',
      description: '接受指纹和面部识别',
      instruction: '按照工作人员指示完成生物识别',
      action: '开始生物识别',
      voiceText: '工作人员会采集您的指纹和面部信息，请配合完成',
    },
    {
      id: 5,
      title: '🛃 第六步：海关检查',
      description: '前往海关检查区',
      instruction: '可能需要开箱检查行李，请耐心等待',
      action: '前往海关检查',
      voiceText: '现在前往海关检查区，准备接受行李检查',
    },
    {
      id: 6,
      title: '✅ 第七步：完成入境',
      description: '领取入境章，正式进入日本',
      instruction: '保留入境卡副联，祝旅途愉快！',
      action: '完成入境',
      voiceText: '恭喜您成功入境日本，祝您旅途愉快！',
    },
  ] : [
    // Canada steps would go here
    {
      id: 0,
      title: '📋 第一步：领取E311表格',
      description: '在入境大厅领取加拿大海关申报表格',
      instruction: '找到标有"E311"的表格发放处',
      action: '我已拿到表格',
      voiceText: '请在入境大厅领取E311海关申报表格',
    },
    // Add more Canada-specific steps...
  ];

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      Vibration.vibrate(100); // Short vibration for feedback
      setCurrentStep(currentStep + 1);
    } else {
      // Immigration completed
      Alert.alert(
        '🎉 入境完成！',
        '恭喜您成功完成入境手续！\n\n请妥善保管入境卡副联，祝旅途愉快！',
        [
          {
            text: '好的',
            onPress: () => navigation.navigate('Home'), // Or appropriate next screen
          },
        ]
      );
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      '需要帮助吗？',
      '请选择您需要的帮助类型：',
      [
        { text: '找工作人员', onPress: () => Alert.alert('提示', '请寻找穿制服的工作人员') },
        { text: '语言帮助', onPress: () => Alert.alert('提示', '工作人员会说英语和日语') },
        { text: '医疗帮助', onPress: () => Alert.alert('紧急', '请拨打机场医疗急救电话') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const handleFormHelp = () => {
    navigation.navigate('CopyWrite', {
      passport,
      destination,
      travelInfo,
    });
  };

  const currentStepData = steps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / steps.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} / {steps.length}
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

          {/* Voice Guidance (placeholder) */}
          <TouchableOpacity style={styles.voiceButton}>
            <Text style={styles.voiceIcon}>🔊</Text>
            <Text style={styles.voiceText}>语音指导</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>快捷操作</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleFormHelp}>
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionText}>查看表格</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionText}>找洗手间</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>☕</Text>
              <Text style={styles.actionText}>找休息区</Text>
            </TouchableOpacity>
          </View>
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
          style={styles.navButtonPrimary}
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
    backgroundColor: colors.background,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emergencyButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    backgroundColor: '#FF4444',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
  },
  emergencyIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  emergencyText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  stepCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    color: colors.white,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: spacing.lg,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  stepDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  instructionBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  instructionText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
  voiceButton: {
    backgroundColor: '#E3F2FD',
    padding: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  voiceText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  actionsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    minWidth: 80,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  navButtonSecondary: {
    flex: 1,
    backgroundColor: colors.border,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonTextSecondary: {
    ...typography.h3,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  navButtonPrimary: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonTextPrimary: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default InteractiveImmigrationGuide;