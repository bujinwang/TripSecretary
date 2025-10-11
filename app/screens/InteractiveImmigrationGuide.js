// 出境通 - Interactive Immigration Guide (互动入境指南)
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
  Image,
  Modal,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

const japanEntryCardSample = require('../../assets/forms/japan-entry-card-sample.jpg');

const InteractiveImmigrationGuide = ({ navigation, route }) => {
  const { passport, destination, travelInfo, currentStep: initialStep = 0 } = route.params || {};
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isFormSampleVisible, setFormSampleVisible] = useState(false);

  const isJapan = destination?.id === 'jp' || destination?.name === '日本';

  const steps = isJapan ? [
    {
      id: 0,
      title: '📋 第一步：领取表格',
      description: '在入境大厅找到入境卡和海关申报单',
      instruction: '找到标有"入境卡"和"海关申报"的柜台或自动发放机，可先查看样本了解填写内容',
      action: '下一步：填写入境卡',
      voiceText: '请走到入境大厅的表格发放区，领取蓝色入境卡和黄色海关申报单，可以先参考手机里的样本了解填写内容',
    },
    {
      id: 1,
      title: '✍️ 第二步：填写入境卡',
      description: '用黑色或蓝色笔填写蓝色入境卡',
      instruction: '对照手机上的信息，仔细抄写到表格上',
      action: '下一步：海关申报表',
      voiceText: '现在请用笔填写蓝色入境卡，姓名、护照号码、航班号等信息',
    },
    {
      id: 2,
      title: '📝 第三步：填写海关申报单',
      description: '填写黄色海关申报单',
      instruction: '如实申报携带物品，回答是否有违禁品等问题',
      action: '下一步：入境审查',
      voiceText: '接下来填写黄色海关申报单，诚实回答所有问题',
    },
    {
      id: 3,
      title: '🏢 第四步：前往入境审查',
      description: '拿着填好的表格前往入境审查柜台',
      instruction: '排队等待叫号，交给工作人员检查',
      action: '下一步：生物识别',
      voiceText: '请前往入境审查柜台，准备好护照和填好的表格',
    },
    {
      id: 4,
      title: '👤 第五步：生物识别检查',
      description: '接受指纹和面部识别',
      instruction: '按照工作人员指示完成生物识别',
      action: '下一步：海关检查',
      voiceText: '工作人员会采集您的指纹和面部信息，请配合完成',
    },
    {
      id: 5,
      title: '🛃 第六步：海关检查',
      description: '前往海关检查区',
      instruction: '可能需要开箱检查行李，请耐心等待',
      action: '完成海关检查',
      voiceText: '现在前往海关检查区，准备接受行李检查',
    },
    {
      id: 6,
      title: '🛃 第七步：向海关出示通关包',
      description: '把手机里的通关包或打印件递给工作人员',
      instruction: '点击下方按钮打开“向海关出示”页面，准备好给边检查看',
      action: '打开通关包',
      voiceText: '请打开手机中的通关包，并递给海关工作人员核对信息。',
      isFinal: true,
    },
  ] : [
    {
      id: 0,
      title: '📋 第一步：领取入境材料',
      description: '在入境大厅领取纸质表格或确认电子申报',
      instruction: '确认机场指引，领取或准备好需要的表格',
      action: '我已准备好',
      voiceText: '请先在入境大厅领取或确认需要填写的入境表格。',
    },
    {
      id: 1,
      title: '✍️ 第二步：核对并填写资料',
      description: '对照通关包填写或确认个人信息',
      instruction: '可点击“抄写模式”对照填写，确保信息准确',
      action: '填写完成',
      voiceText: '请按照手机里的通关包逐项填写或确认信息。',
    },
    {
      id: 2,
      title: '🛃 最后一步：向海关出示通关包',
      description: '将手机里的通关包展示给边检或海关',
      instruction: '打开“向海关出示”页面，递给工作人员核对',
      action: '打开通关包',
      voiceText: '请向海关工作人员展示手机中的通关包，便于快速通关。',
      isFinal: true,
    },
  ];

  const handleNextStep = () => {
    const stepData = steps[currentStep];

    if (stepData?.isFinal) {
      Vibration.vibrate(120);
      navigation.navigate('PresentToCustoms', {
        passport,
        destination,
        travelInfo,
      });
      return;
    }

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

  const currentStepData = steps[currentStep];

  return (
    <>
      <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
      </View>

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

          {isJapan && currentStep === 0 && (
            <>
              <View style={styles.formPreview}>
                <Text style={styles.formPreviewTitle}>🇯🇵 入境卡样本</Text>
                <TouchableOpacity
                  style={styles.sampleImageContainer}
                  onPress={() => setFormSampleVisible(true)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel="查看日本入境卡样本大图"
                >
                  <Image
                    source={japanEntryCardSample}
                    style={styles.sampleImageThumb}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text style={styles.imageHint}>点击查看大图，方便截图或对照填写</Text>
              </View>
              <TouchableOpacity
                style={styles.viewFormButton}
                onPress={() => setFormSampleVisible(true)}
              >
                <Text style={styles.viewFormIcon}>📄</Text>
                <Text style={styles.viewFormText}>打开日本入境卡样本</Text>
                <Text style={styles.viewFormArrow}>›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Show "View Form" button for step 2 (filling out entry card) */}
          {currentStep === 1 && (
            <>
              <View style={styles.formPreview}>
                <Text style={styles.formPreviewTitle}>📋 入境卡样本</Text>
                <View style={styles.formPlaceholder}>
                  <Text style={styles.formPlaceholderText}>蓝色入境卡</Text>
                  <Text style={styles.formPlaceholderHint}>
                    包含个人信息、护照号码、{'\n'}
                    航班信息、住宿地址等
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewFormButton}
                onPress={() => navigation.navigate('CopyWrite', {
                  passport,
                  destination,
                  travelInfo,
                  formType: 'entry', // 入境卡
                })}
              >
                <Text style={styles.viewFormIcon}>📝</Text>
                <Text style={styles.viewFormText}>对照填写入境表</Text>
                <Text style={styles.viewFormArrow}>›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Show "View Customs Declaration" button for step 3 */}
          {currentStep === 2 && (
            <>
              <View style={styles.formPreview}>
                <Text style={styles.formPreviewTitle}>📋 海关申报单样本</Text>
                <View style={styles.formPlaceholder}>
                  <Text style={styles.formPlaceholderText}>黄色海关申报单</Text>
                  <Text style={styles.formPlaceholderHint}>
                    包含携带物品申报、{'\n'}
                    是否携带违禁品等问题
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewFormButton}
                onPress={() => navigation.navigate('CopyWrite', {
                  passport,
                  destination,
                  travelInfo,
                  formType: 'customs', // 海关申报单
                })}
              >
                <Text style={styles.viewFormIcon}>📋</Text>
                <Text style={styles.viewFormText}>对照填写申报表</Text>
                <Text style={styles.viewFormArrow}>›</Text>
              </TouchableOpacity>
            </>
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
          style={styles.navButtonPrimary}
          onPress={handleNextStep}
        >
          <Text style={styles.navButtonTextPrimary}>
            {currentStepData.action}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>

      <Modal
        visible={isFormSampleVisible}
        animationType="slide"
        onRequestClose={() => setFormSampleVisible(false)}
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setFormSampleVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalCloseText}>关闭</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>日本入境卡样本</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          <ScrollView
            style={styles.modalScroll}
            maximumZoomScale={3}
            minimumZoomScale={1}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <Image
              source={japanEntryCardSample}
              style={styles.sampleImageFull}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="日本入境卡样本大图"
            />
            <Text style={styles.modalHint}>可截图或放大查看每一栏位的填写示例</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
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
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  backButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
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
  formPreview: {
    marginTop: spacing.md,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formPreviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: spacing.sm,
  },
  sampleImageContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  sampleImageThumb: {
    width: '100%',
    height: 160,
  },
  imageHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  formPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderStyle: 'dashed',
    minHeight: 100,
    justifyContent: 'center',
  },
  formPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: spacing.xs,
  },
  formPlaceholderHint: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  viewFormButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  viewFormIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  viewFormText: {
    fontSize: 17,
    color: colors.white,
    fontWeight: '600',
    flex: 1,
  },
  viewFormArrow: {
    fontSize: 20,
    color: colors.white,
    fontWeight: '400',
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
  navButtonTextPrimary: {
    fontSize: 17,
    color: colors.white,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  modalCloseButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '600',
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalScroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  sampleImageFull: {
    width: '100%',
    aspectRatio: 860 / 540,
    borderRadius: 12,
  },
  modalHint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default InteractiveImmigrationGuide;
