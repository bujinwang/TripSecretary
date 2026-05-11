// @ts-nocheck
// 入境通 - Interactive Immigration Guide (互动入境指南)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Vibration,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme';
import { useTranslation } from '../../i18n/LocaleContext';
import BackButton from '../../components/BackButton';
import UserDataService from '../../services/data/UserDataService';

const japanEntryCardSample = require('../../../assets/forms/japan-entry-card-sample.jpg');
const japanCustomsSample = require('../../../assets/forms/japan-customs-declaration.jpg');
const japanBiometricSample = require('../../../assets/forms/japan-biometric-scan.jpg');

const InteractiveImmigrationGuide = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { passport: rawPassport, destination, travelInfo, currentStep: initialStep = 0, userId: routeUserId } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const userId = routeUserId || passport?.id || rawPassport?.id || 'user_001';
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isFormSampleVisible, setFormSampleVisible] = useState(false);
  const [isCustomsSampleVisible, setCustomsSampleVisible] = useState(false);
  const [isBiometricSampleVisible, setBiometricSampleVisible] = useState(false);

  const isJapan = destination?.id === 'jp' || destination?.name === '日本';

  const japanSteps = [
    {
      id: 0,
      title: t('immigrationGuide.japanSteps.step1.title'),
      description: t('immigrationGuide.japanSteps.step1.description'),
      instruction: t('immigrationGuide.japanSteps.step1.instruction'),
      action: t('immigrationGuide.japanSteps.step1.action'),
      voiceText: '请走到入境大厅的表格发放区，领取蓝色入境卡和黄色海关申报单，可以先参考手机里的样本了解填写内容',
    },
    {
      id: 1,
      title: t('immigrationGuide.japanSteps.step2.title'),
      description: t('immigrationGuide.japanSteps.step2.description'),
      instruction: t('immigrationGuide.japanSteps.step2.instruction'),
      action: t('immigrationGuide.japanSteps.step2.action'),
      voiceText: '现在请用笔填写蓝色入境卡，姓名、护照号码、航班号等信息',
    },
    {
      id: 2,
      title: t('immigrationGuide.japanSteps.step3.title'),
      description: t('immigrationGuide.japanSteps.step3.description'),
      instruction: t('immigrationGuide.japanSteps.step3.instruction'),
      action: t('immigrationGuide.japanSteps.step3.action'),
      voiceText: '接下来填写黄色海关申报单，诚实回答所有问题',
    },
    {
      id: 3,
      title: t('immigrationGuide.japanSteps.step4.title'),
      description: t('immigrationGuide.japanSteps.step4.description'),
      instruction: t('immigrationGuide.japanSteps.step4.instruction'),
      action: t('immigrationGuide.japanSteps.step4.action'),
      voiceText: '请前往入境审查柜台，准备好护照和填好的表格',
    },
    {
      id: 4,
      title: t('immigrationGuide.japanSteps.step5.title'),
      description: t('immigrationGuide.japanSteps.step5.description'),
      instruction: t('immigrationGuide.japanSteps.step5.instruction'),
      action: t('immigrationGuide.japanSteps.step5.action'),
      voiceText: '工作人员会采集您的指纹和面部信息，请配合完成',
    },
    {
      id: 5,
      title: t('immigrationGuide.japanSteps.step6.title'),
      description: t('immigrationGuide.japanSteps.step6.description'),
      instruction: t('immigrationGuide.japanSteps.step6.instruction'),
      action: t('immigrationGuide.japanSteps.step6.action'),
      voiceText: '现在前往海关检查区，准备接受行李检查',
    },
    {
      id: 6,
      title: t('immigrationGuide.japanSteps.step7.title'),
      description: t('immigrationGuide.japanSteps.step7.description'),
      instruction: t('immigrationGuide.japanSteps.step7.instruction'),
      action: t('immigrationGuide.japanSteps.step7.action'),
      voiceText: '入境流程即将完成。通关包已准备好，如果移民官员有疑问，可以随时打开给他们查看。',
      isFinal: true,
    },
  ];

  const genericSteps = [
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

  const steps = isJapan ? japanSteps : genericSteps;

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
      t('immigrationGuide.helpMenu.title'),
      t('immigrationGuide.helpMenu.message'),
      [
        { 
          text: t('immigrationGuide.helpMenu.findStaff'), 
          onPress: () => Alert.alert(
            t('immigrationGuide.helpMenu.notice'), 
            t('immigrationGuide.helpMenu.findStaffMessage')
          ) 
        },
        { 
          text: t('immigrationGuide.helpMenu.languageHelp'), 
          onPress: () => Alert.alert(
            t('immigrationGuide.helpMenu.notice'), 
            t('immigrationGuide.helpMenu.languageHelpMessage')
          ) 
        },
        { 
          text: t('immigrationGuide.helpMenu.medicalHelp'), 
          onPress: () => Alert.alert(
            t('immigrationGuide.helpMenu.emergency'), 
            t('immigrationGuide.helpMenu.medicalHelpMessage')
          ) 
        },
        { text: t('immigrationGuide.helpMenu.cancel'), style: 'cancel' },
      ]
    );
  };

  const currentStepData = steps[currentStep];

  return (
    <>
      <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          showLabel={false}
          style={styles.backButton}
        />
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
        <Text style={styles.emergencyText}>{t('immigrationGuide.needHelp')}</Text>
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
            <Text style={styles.formPreviewTitle}>{t('immigrationGuide.entryCardSampleTitle')}</Text>
            <TouchableOpacity
              style={styles.sampleImageContainer}
              onPress={() => setFormSampleVisible(true)}
              accessibilityRole="imagebutton"
              accessibilityLabel={t('immigrationGuide.entryCardModalTitle')}
            >
              <Image
                source={japanEntryCardSample}
                style={styles.sampleImageThumb}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.imageHint}>{t('immigrationGuide.clickToViewLarge')}</Text>
          </View>

          <View style={[styles.formPreview, { marginTop: spacing.md }]}>
            <Text style={styles.formPreviewTitle}>{t('immigrationGuide.customsDeclarationSampleTitle')}</Text>
            <TouchableOpacity
              style={styles.sampleImageContainer}
              onPress={() => setCustomsSampleVisible(true)}
              accessibilityRole="imagebutton"
              accessibilityLabel={t('immigrationGuide.customsModalTitle')}
            >
              <Image
                source={japanCustomsSample}
                style={styles.sampleImageThumb}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.imageHint}>{t('immigrationGuide.clickToViewLarge')}</Text>
          </View>
        </>
      )}

      {isJapan && currentStep === 4 && (
        <>
          <View style={styles.formPreview}>
            <Text style={styles.formPreviewTitle}>{t('immigrationGuide.japanSteps.step5.biometricNotice')}</Text>
            <TouchableOpacity
              style={styles.sampleImageContainer}
              onPress={() => setBiometricSampleVisible(true)}
              accessibilityRole="imagebutton"
              accessibilityLabel="查看生物识别示意图大图"
            >
              <Image
                source={japanBiometricSample}
                style={styles.sampleImageThumb}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.imageHint}>{t('immigrationGuide.japanSteps.step5.biometricCaption')}</Text>
          </View>
        </>
      )}

      {/* Show "View Form" button for step 2 (filling out entry card) */}
      {currentStep === 1 && (
        <>
          <View style={styles.formPreview}>
            <Text style={styles.formPreviewTitle}>{t('immigrationGuide.japanSteps.step2.formPreviewTitle')}</Text>
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
        </>
      )}

          {/* Show "View Customs Declaration" button for step 3 */}
          {currentStep === 2 && (
            <>
              <View style={styles.formPreview}>
                <Text style={styles.formPreviewTitle}>{t('immigrationGuide.japanSteps.step3.formPreviewTitle')}</Text>
                <TouchableOpacity
                  style={styles.sampleImageContainer}
                  onPress={() => setCustomsSampleVisible(true)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={t('immigrationGuide.japanSteps.step3.formPreviewTitle')}
                >
                  <Image
                    source={japanCustomsSample}
                    style={styles.sampleImageThumb}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text style={styles.imageHint}>{t('immigrationGuide.japanSteps.step3.imageHint')}</Text>
                <View style={[styles.formPlaceholder, styles.formPlaceholderSpacing]}>
                  <Text style={styles.formPlaceholderText}>{t('immigrationGuide.japanSteps.step3.formPlaceholderText')}</Text>
                  <Text style={styles.formPlaceholderHint}>
                    {t('immigrationGuide.japanSteps.step3.formPlaceholderHint')}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Show "Complete Entry" button for steps 6 and 7 */}
          {(currentStep === 5 || currentStep === 6) && (
            <TouchableOpacity
              style={styles.completeEntryButton}
              onPress={() => navigation.navigate('Result', {
                passport,
                destination,
                travelInfo,
              })}
            >
              <Text style={styles.completeEntryIcon}>🎉</Text>
              <Text style={styles.completeEntryText}>{t('immigrationGuide.completeEntry')}</Text>
            </TouchableOpacity>
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
            <Text style={styles.navButtonTextSecondary}>{t('immigrationGuide.previousStep')}</Text>
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
              <Text style={styles.modalCloseText}>{t('immigrationGuide.modalClose')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('immigrationGuide.entryCardModalTitle')}</Text>
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
            <Text style={styles.modalHint}>{t('immigrationGuide.entryCardModalHint')}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isCustomsSampleVisible}
        animationType="slide"
        onRequestClose={() => setCustomsSampleVisible(false)}
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCustomsSampleVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalCloseText}>{t('immigrationGuide.modalClose')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('immigrationGuide.customsModalTitle')}</Text>
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
              source={japanCustomsSample}
              style={styles.sampleImageFull}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel={t('immigrationGuide.customsModalTitle')}
            />
            <Text style={styles.modalHint}>{t('immigrationGuide.customsModalHint')}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isBiometricSampleVisible}
        animationType="slide"
        onRequestClose={() => setBiometricSampleVisible(false)}
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setBiometricSampleVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalCloseText}>{t('immigrationGuide.modalClose')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('immigrationGuide.biometricModalTitle')}</Text>
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
              source={japanBiometricSample}
              style={styles.biometricImageFull}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="日本入境生物识别采集照片"
            />
            <Text style={styles.modalHint}>{t('immigrationGuide.biometricModalHint')}</Text>
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
    marginLeft: -spacing.sm,
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
  formPlaceholderSpacing: {
    marginTop: spacing.md,
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
  completeEntryButton: {
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  completeEntryIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  completeEntryText: {
    fontSize: 17,
    color: colors.white,
    fontWeight: '600',
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
  biometricImageFull: {
    width: '100%',
    aspectRatio: 468 / 224,
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
