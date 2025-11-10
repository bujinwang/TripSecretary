// 出境通 - Scan Passport Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { colors, typography, spacing, borderRadius } from '../theme';
import { LocalOCRService } from '../services/ocr';
import { useLocale } from '../i18n/LocaleContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ScanPassportScreen = ({ navigation, route }) => {
  const { t } = useLocale();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [passportData, setPassportData] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        setProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        // Process the image with OCR
        await processPassportImage(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert(
          t('scanPassport.error.title', '扫描错误'),
          t('scanPassport.error.camera', '拍照失败，请重试')
        );
        setProcessing(false);
      }
    }
  };

  const processPassportImage = async (imageUri: string) => {
    try {
      const ocrService = new LocalOCRService();
      const result = await ocrService.extractPassportData(imageUri);

      if (!result.success) {
        const validationErrors = result.validation?.errors ?? [];
        Alert.alert(
          t('scanPassport.error.title', '扫描错误'),
          validationErrors.length > 0
            ? validationErrors.join('\n')
            : t('scanPassport.error.processing', '处理护照信息时出错，请重试')
        );
        return;
      }

      const extractedData = result.data;

      if (extractedData) {
        setPassportData(extractedData);
        setScanned(true);

        // Show success message and navigate back
        Alert.alert(
          t('scanPassport.success.title', '扫描成功'),
          t('scanPassport.success.message', '护照信息已提取'),
          [
            {
              text: t('common.confirm', '确定'),
              onPress: () => {
                navigation.navigate('SelectDestination', {
                  passport: extractedData,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t('scanPassport.error.title', '扫描错误'),
          t('scanPassport.error.noData', '未能识别护照信息，请重试或手动输入')
        );
      }
    } catch (error) {
      console.error('Error processing passport:', error);
      Alert.alert(
        t('scanPassport.error.title', '扫描错误'),
        t('scanPassport.error.processing', '处理护照信息时出错，请重试')
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('scanPassport.permission.title', '需要权限'),
          t('scanPassport.permission.gallery', '需要相册权限才能选择照片')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setProcessing(true);
        await processPassportImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert(
        t('scanPassport.error.title', '扫描错误'),
        t('scanPassport.error.gallery', '选择照片失败，请重试')
      );
      setProcessing(false);
    }
  };

  const handleRetake = () => {
    setScanned(false);
    setPassportData(null);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.permissionText}>
            {t('scanPassport.permission.checking', '检查相机权限...')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>
            {t('scanPassport.title', '扫描护照')}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorTitle}>
            {t('scanPassport.permission.denied', '相机权限被拒绝')}
          </Text>
          <Text style={styles.errorMessage}>
            {t('scanPassport.permission.message', '需要相机权限才能扫描护照')}
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title={t('scanPassport.permission.settings', '去设置')}
              onPress={() => {
                // In a real app, you might open device settings
                Alert.alert(
                  t('scanPassport.permission.settings', '去设置'),
                  t('scanPassport.permission.instructions', '请在设备设置中启用相机权限')
                );
              }}
              variant="primary"
            />
            <Button
              title={t('scanPassport.useGallery', '从相册选择')}
              onPress={handleSelectFromGallery}
              variant="secondary"
              style={styles.secondaryButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (scanned && passportData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>
            {t('scanPassport.result.title', '扫描结果')}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.resultContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.resultTitle}>
            {t('scanPassport.result.success', '护照扫描成功')}
          </Text>

          <View style={styles.passportData}>
            {passportData.passportNo && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>
                  {t('scanPassport.result.passportNo', '护照号')}:
                </Text>
                <Text style={styles.dataValue}>{passportData.passportNo}</Text>
              </View>
            )}
            {passportData.name && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>
                  {t('scanPassport.result.name', '姓名')}:
                </Text>
                <Text style={styles.dataValue}>{passportData.name}</Text>
              </View>
            )}
            {passportData.nationality && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>
                  {t('scanPassport.result.nationality', '国籍')}:
                </Text>
                <Text style={styles.dataValue}>{passportData.nationality}</Text>
              </View>
            )}
            {passportData.dob && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>
                  {t('scanPassport.result.dob', '出生日期')}:
                </Text>
                <Text style={styles.dataValue}>{passportData.dob}</Text>
              </View>
            )}
            {passportData.expiry && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>
                  {t('scanPassport.result.expiry', '有效期')}:
                </Text>
                <Text style={styles.dataValue}>{passportData.expiry}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={t('scanPassport.result.continue', '继续')}
              onPress={() => {
                navigation.navigate('SelectDestination', {
                  passport: passportData,
                });
              }}
              variant="primary"
            />
            <Button
              title={t('scanPassport.result.retake', '重新扫描')}
              onPress={handleRetake}
              variant="secondary"
              style={styles.secondaryButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>
          {t('scanPassport.title', '扫描护照')}
        </Text>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handleSelectFromGallery}
        >
          <Text style={styles.galleryButtonText}>
            {t('scanPassport.gallery', '相册')}
          </Text>
        </TouchableOpacity>
      </View>

      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        ratio="4:3"
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.scanText}>
              {t('scanPassport.instruction', '将护照置于框内')}
            </Text>
          </View>

          {processing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.processingText}>
                {t('scanPassport.processing', '识别中...')}
              </Text>
            </View>
          )}
        </View>
      </Camera>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleTakePicture}
          disabled={processing}
        >
          <View style={styles.captureButtonInner}>
            {processing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <View style={styles.captureButtonCenter} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => {
            setCameraType(
              cameraType === CameraType.back
                ? CameraType.front
                : CameraType.back
            );
          }}
        >
          <Text style={styles.flipButtonText}>🔄</Text>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 60,
  },
  galleryButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  galleryButtonText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8 * 0.75, // 护照比例大约是 1.33:1
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: colors.white,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.white,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanText: {
    ...typography.body1,
    color: colors.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    ...typography.body1,
    color: colors.white,
    marginTop: spacing.md,
  },
  controls: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonCenter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  flipButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 24,
  },
  permissionText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  resultTitle: {
    ...typography.h3,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  passportData: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dataLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dataValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
  },
});

export default ScanPassportScreen;
