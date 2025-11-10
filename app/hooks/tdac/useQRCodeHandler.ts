// @ts-nocheck

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
import { File } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EntryInfoService from '../../services/EntryInfoService';
import SecureStorageService from '../../services/security/SecureStorageService';
import PDFManagementService from '../../services/PDFManagementService';
import { useTranslation } from '../../i18n/LocaleContext';

export const useQRCodeHandler = ({ passport, route }) => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const isMountedRef = useRef(true);
  const { t } = useTranslation();

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
    // Declare file outside try block so it's accessible in catch block for cleanup
    let file = null;

    try {
      // Request photo album permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          t('thailand.tdacWebView.qrCodeHandler.permissionTitle'),
          t('thailand.tdacWebView.qrCodeHandler.permissionMessage')
        );
        return false;
      }

      // Create temporary file for saving to photo album
      const tempFilename = `tdac_qr_${Date.now()}.png`;
      file = new File(FileSystem.documentDirectory + tempFilename);

      // Remove base64 prefix if present
      const base64Image = base64Data.split(',')[1] || base64Data;

      // Decode base64 to Uint8Array for binary image data
      const binaryString = atob(base64Image);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      file.create();
      file.write(bytes);

      // Save to photo album using the file URI
      const asset = await MediaLibrary.createAssetAsync(file.uri);
      await MediaLibrary.createAlbumAsync('BorderBuddy', asset, false);

      // Clean up temporary file after successful save
      try {
        if (file.exists) {
          file.delete();
          if (__DEV__) {
            console.log('✅ 临时文件已清理');
          }
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
      if (file) {
        try {
          if (file.exists) {
            file.delete();
            if (__DEV__) {
              console.log('✅ 临时文件已清理（错误路径）');
            }
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

      // 2. Try to download and save PDF if download info is available
      let pdfUrl = null;
      if (qrData.pdfDownloadInfo && qrData.pdfDownloadInfo.hiddenToken && qrData.pdfDownloadInfo.submitId) {
        try {
          if (__DEV__) {
            console.log('📥 Attempting to download PDF from TDAC...');
          }
          
          // Download PDF directly from TDAC API
          const BASE_URL = 'https://tdac.immigration.go.th/arrival-card-api/api/v1';
          const downloadUrl = `${BASE_URL}/arrivalcard/downloadPdf?submitId=${qrData.pdfDownloadInfo.submitId}`;
          
          const response = await fetch(downloadUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hiddenToken: qrData.pdfDownloadInfo.hiddenToken })
          });
          
          if (!response.ok) {
            throw new Error(`PDF download failed: ${response.status} ${response.statusText}`);
          }
          
          const pdfBlob = await response.blob();
          
          if (pdfBlob && pdfBlob.size > 0) {
            // Use the extracted arrCardNo or fallback to generated cardNo
            const arrCardNoForPdf = qrData.pdfDownloadInfo.arrCardNo || cardNo;
            
            // Save PDF using PDFManagementService
            const pdfSaveResult = await PDFManagementService.savePDF(
              arrCardNoForPdf,
              pdfBlob,
              { submissionMethod: 'webview' }
            );
            
            pdfUrl = pdfSaveResult.filepath;
            
            if (__DEV__) {
              console.log('✅ PDF downloaded and saved:', pdfUrl);
            }
          } else {
            throw new Error('PDF blob is empty');
          }
        } catch (pdfError) {
          console.warn('⚠️ Failed to download PDF (non-critical):', pdfError);
          // Don't block the flow if PDF download fails - QR code is more important
        }
      } else {
        if (__DEV__) {
          console.log('ℹ️ No PDF download info available, skipping PDF download');
        }
      }

      // 3. Save to digital_arrival_cards table (CRITICAL - must happen regardless of other operations)
      try {
        // Get userId from passport or use default
        const userId = passport?.id || passport?.passportNo || 'user_001';
        const entryInfoId = route.params?.entryInfoId || 'thailand_entry_info';

        // Use extracted arrCardNo if available, otherwise use generated cardNo
        const finalArrCardNo = qrData.pdfDownloadInfo?.arrCardNo || cardNo;

        // Create digital arrival card record in database
        const dacData = {
          userId: userId,
          entryInfoId: entryInfoId,
          cardType: 'TDAC',
          destinationId: 'THA',
          arrCardNo: finalArrCardNo,
          qrUri: qrData.src,
          pdfUrl: pdfUrl, // Will be null if PDF download failed or not available
          submittedAt: new Date().toISOString(),
          submissionMethod: 'webview',
          status: 'success',
          apiResponse: null,
          processingTime: null,
          retryCount: 0,
          errorDetails: null,
          version: 1
        };

        await SecureStorageService.initialize(userId);
        const result = await SecureStorageService.saveDigitalArrivalCard(dacData);

        if (__DEV__) {
          console.log('✅ Digital arrival card saved to database:', result);
          if (pdfUrl) {
            console.log('✅ PDF URL saved to database:', pdfUrl);
          }
        }
      } catch (dacError) {
        console.error('❌ CRITICAL: Failed to save digital arrival card to database:', dacError);
        // Log this error prominently as it means the record won't be in digital_arrival_cards
        if (__DEV__) {
          Alert.alert(
            '⚠️ Database Save Error',
            `Failed to save to digital_arrival_cards table: ${dacError.message}\n\nThe QR code was saved to photos but may not appear in your entry pack.`
          );
        }
        // Don't block user flow - continue with remaining operations
      }

      // 4. Update entry info (secondary operation, not critical)
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

      // 5. Save to photo album
      const saved = await saveToPhotoAlbum(qrData.src);

      if (saved && isMountedRef.current) {
        Alert.alert(
          t('thailand.tdacWebView.qrCodeHandler.qrSavedSuccess.title'),
          t('thailand.tdacWebView.qrCodeHandler.qrSavedSuccess.message'),
          [
            {
              text: t('thailand.tdacWebView.qrCodeHandler.qrSavedSuccess.viewQR'),
              onPress: () => {
                if (isMountedRef.current) {
                  setShowQrCode(true);
                }
              }
            },
            { text: t('thailand.tdacWebView.qrCodeHandler.qrSavedSuccess.ok') }
          ]
        );
      }

      // Update state only if component is still mounted
      if (isMountedRef.current) {
        setQrCodeData(qrData);
      }

    } catch (error) {
      console.error('保存QR码失败:', error);
      Alert.alert(
        t('thailand.tdacWebView.qrCodeHandler.saveFailed.title'),
        t('thailand.tdacWebView.qrCodeHandler.saveFailed.message')
      );
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
