// 出国啰 - Scan Passport Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/Button';
import { colors, typography, spacing, borderRadius } from '../theme';
import api from '../services/api';

const ScanPassportScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current || !cameraReady || scanning) return;
    
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        skipProcessing: false,
      });
      
      const result = await api.recognizePassport(photo.uri);
      
      navigation.navigate('SelectDestination', {
        passport: result,
      });
    } catch (error) {
      Alert.alert('识别失败', error.message || '请重试');
      setScanning(false);
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要权限', '请允许访问相册');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });
      
      if (!result.canceled) {
        setScanning(true);
        try {
          const ocrResult = await api.recognizePassport(result.assets[0].uri);
          navigation.navigate('SelectDestination', { passport: ocrResult });
        } catch (error) {
          Alert.alert('识别失败', error.message || '请重试');
          setScanning(false);
        }
      }
    } catch (error) {
      Alert.alert('错误', '无法打开相册');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>扫描证件</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            需要相机权限来扫描护照
          </Text>
          <Button
            title="授权"
            onPress={() => Camera.requestCameraPermissionsAsync()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>扫描证件</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Camera Preview Area */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.cameraPreview}
          type={Camera.Constants.Type.back}
          onCameraReady={() => setCameraReady(true)}
        >
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            
            <Text style={styles.scanText}>对准护照资料页</Text>
          </View>
        </Camera>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>
          将护照对准框内
        </Text>
        <Text style={styles.instructionsSubtitle}>
          自动识别拍照
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          title="拍照识别"
          onPress={handleCapture}
          loading={scanning}
          disabled={!cameraReady || scanning}
          icon={<Text style={styles.buttonIcon}>📸</Text>}
          style={styles.captureButton}
        />

        <TouchableOpacity onPress={handleGallery} disabled={scanning}>
          <Text style={styles.galleryLink}>或从相册选择 →</Text>
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 提示:</Text>
        <Text style={styles.tipText}>• 光线充足</Text>
        <Text style={styles.tipText}>• 避免反光</Text>
        <Text style={styles.tipText}>• 对准护照资料页</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  backButton: {
    ...typography.body2,
    color: colors.primary,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 50,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 300,
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanText: {
    ...typography.body1,
    color: colors.white,
  },
  instructionsContainer: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  instructionsTitle: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  instructionsSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  actionsContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  captureButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  buttonIcon: {
    fontSize: 24,
  },
  galleryLink: {
    ...typography.body1,
    color: colors.secondary,
  },
  tipsContainer: {
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  tipsTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  permissionText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});

export default ScanPassportScreen;
