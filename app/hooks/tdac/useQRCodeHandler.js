/**
 * useQRCodeHandler Hook
 *
 * Custom hook for handling QR code saving functionality in TDAC WebView
 * Handles saving to both app storage and photo album
 */

import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EntryInfoService from '../../services/EntryInfoService';

export const useQRCodeHandler = ({ passport, route }) => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const isMountedRef = useRef(true);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Save QR code image to photo album
   * @param {string} base64Data - Base64 encoded image data
   * @returns {Promise<boolean>} - Success status
   */
  const saveToPhotoAlbum = async (base64Data) => {
    // Declare filename outside try block so it's accessible in catch block for cleanup
    let filename = null;

    try {
      // Request photo album permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('需要相册权限', '请在设置中允许访问相册');
        return false;
      }

      // Save base64 image to file system
      filename = FileSystem.documentDirectory + `tdac_qr_${Date.now()}.png`;

      // Remove base64 prefix if present
      const base64Image = base64Data.split(',')[1] || base64Data;

      await FileSystem.writeAsStringAsync(filename, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save to photo album
      const asset = await MediaLibrary.createAssetAsync(filename);
      await MediaLibrary.createAlbumAsync('BorderBuddy', asset, false);

      // Clean up temporary file after successful save
      try {
        await FileSystem.deleteAsync(filename, { idempotent: true });
        if (__DEV__) {
          console.log('✅ 临时文件已清理');
        }
      } catch (cleanupError) {
        if (__DEV__) {
          console.warn('⚠️ 临时文件清理失败:', cleanupError);
        }
        // Don't fail the operation if cleanup fails
      }

      if (__DEV__) {
        console.log('✅ QR码已保存到相册');
      }
      return true;

    } catch (error) {
      console.error('保存到相册失败:', error);

      // Clean up temporary file even if save operation failed
      if (filename) {
        try {
          await FileSystem.deleteAsync(filename, { idempotent: true });
          if (__DEV__) {
            console.log('✅ 临时文件已清理（错误路径）');
          }
        } catch (cleanupError) {
          // Silently ignore cleanup errors in error path
          if (__DEV__) {
            console.warn('⚠️ 错误路径文件清理失败:', cleanupError);
          }
        }
      }

      return false;
    }
  };

  /**
   * Save QR code to app storage and photo album
   * @param {Object} qrData - QR code data including image source
   */
  const saveQRCode = async (qrData) => {
    try {
      if (__DEV__) {
        console.log('📸 开始保存QR码...');
      }

      // Generate card number from QR data or timestamp
      const cardNo = qrData.arrCardNo || `WV_${Date.now()}`;

      // 1. Save to AsyncStorage (app internal storage)
      const storageKey = `tdac_qr_${passport?.passportNo}_${Date.now()}`;
      const entryData = {
        ...qrData,
        passportNo: passport?.passportNo,
        name: passport?.nameEn || passport?.name,
        savedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        submissionMethod: 'webview',
        // TDAC submission metadata for EntryPackService
        arrCardNo: cardNo,
        cardNo: cardNo,
        qrUri: qrData.src,
        pdfPath: qrData.src,
        timestamp: Date.now(),
        alreadySubmitted: true
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(entryData));
      if (__DEV__) {
        console.log('✅ QR码已保存到App');
      }

      // Set flag for EntryPackService integration
      await AsyncStorage.setItem('recent_tdac_submission', JSON.stringify(entryData));
      if (__DEV__) {
        console.log('✅ Recent submission flag set for EntryPackService');
      }

      // 2. Create or update digital arrival card with TDAC submission
      try {
        const tdacSubmission = {
          arrCardNo: cardNo,
          qrUri: qrData.src,
          pdfPath: qrData.src,
          submittedAt: new Date().toISOString(),
          submissionMethod: 'webview',
          cardType: 'TDAC',
          status: 'success'
        };

        // Find entry info ID - use from route params or default
        const entryInfoId = route.params?.entryInfoId || 'thailand_entry_info';

        await EntryInfoService.updateEntryInfo(entryInfoId, {
          documents: JSON.stringify([tdacSubmission]),
          displayStatus: JSON.stringify({ tdacSubmitted: true, submissionMethod: 'webview' })
        });

        if (__DEV__) {
          console.log('✅ Entry info updated successfully via WebView');
        }
      } catch (entryInfoError) {
        console.error('❌ Failed to update entry info:', entryInfoError);
        // Don't block user flow - continue with QR code saving
      }

      // 3. Save to photo album
      const saved = await saveToPhotoAlbum(qrData.src);

      if (saved && isMountedRef.current) {
        Alert.alert(
          '🎉 QR码已保存！',
          'QR码已保存到:\n1. App内（可在"我的旅程"查看）\n2. 手机相册\n\n入境时向海关出示即可！',
          [
            {
              text: '查看QR码',
              onPress: () => {
                if (isMountedRef.current) {
                  setShowQrCode(true);
                }
              }
            },
            { text: '好的' }
          ]
        );
      }

      // Update state only if component is still mounted
      if (isMountedRef.current) {
        setQrCodeData(qrData);
      }

    } catch (error) {
      console.error('保存QR码失败:', error);
      Alert.alert('保存失败', '无法保存QR码，请截图保存');
    }
  };

  return {
    qrCodeData,
    showQrCode,
    setShowQrCode,
    saveQRCode,
    saveToPhotoAlbum,
  };
};

export default useQRCodeHandler;
