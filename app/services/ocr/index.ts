// @ts-nocheck

/**
 * 出境通 - OCR Services Index
 * Centralized export of OCR-related services
 */

import LocalOCRService from './LocalOCRService';
export { LocalOCRService };

// OCR service utilities
export const OCRUtils = {
  /**
   * Check if OCR is available on device
   * @returns {Promise<boolean>} - OCR availability
   */
  async isOCRAvailable() {
    try {
      // Check if ML Kit is available
      const TextRecognition = require('@react-native-ml-kit/text-recognition').default;
      return TextRecognition !== null;
    } catch (error) {
      console.warn('OCR not available:', error.message);
      return false;
    }
  },

  /**
   * Get OCR processing capabilities
   * @returns {Object} - OCR capabilities
   */
  getCapabilities() {
    return {
      localProcessing: true,
      privacyLevel: 'maximum',
      supportedLanguages: ['en', 'zh', 'ja', 'ko', 'th'], // ML Kit supports these
      supportedDocumentTypes: ['passport', 'id_card', 'text'],
      realTimeProcessing: true,
      offlineProcessing: true
    };
  },

  /**
   * Validate image for OCR processing
   * @param {string} imageUri - Image URI
   * @returns {Promise<Object>} - Image validation result
   */
  async validateImageForOCR(imageUri) {
    try {
      const { Image } = require('react-native');

      return new Promise((resolve) => {
        Image.getSize(imageUri, (width, height) => {
          const validation = {
            isValid: true,
            warnings: [],
            recommendations: []
          };

          // Check dimensions
          if (width < 800 || height < 600) {
            validation.warnings.push('Image resolution is low');
            validation.recommendations.push('Use higher resolution for better OCR accuracy');
          }

          // Check aspect ratio (passports are typically rectangular)
          const aspectRatio = width / height;
          if (aspectRatio < 1.2 || aspectRatio > 2.0) {
            validation.warnings.push('Image aspect ratio may not be optimal for passport OCR');
          }

          // Estimate file size (rough calculation)
          const estimatedSizeKB = (width * height * 3) / 1024; // RGB image
          if (estimatedSizeKB > 5000) {
            validation.warnings.push('Image file size is large');
            validation.recommendations.push('Consider compressing image for faster processing');
          }

          resolve(validation);
        }, (error) => {
          resolve({
            isValid: false,
            warnings: ['Failed to read image'],
            recommendations: ['Ensure image URI is valid']
          });
        });
      });
    } catch (error) {
      return {
        isValid: false,
        warnings: ['Image validation failed'],
        recommendations: ['Check image format and accessibility']
      };
    }
  },

  /**
   * Preprocess image for better OCR results
   * @param {string} imageUri - Image URI
   * @returns {Promise<Object>} - Preprocessing result
   */
  async preprocessImage(imageUri) {
    // In a real implementation, you might:
    // - Adjust brightness/contrast
    // - Rotate image if needed
    // - Crop to relevant area
    // - Apply filters for better text recognition

    // For now, return basic preprocessing info
    const validation = await this.validateImageForOCR(imageUri);

    return {
      originalUri: imageUri,
      processedUri: imageUri, // Same for now
      preprocessing: {
        rotation: 0,
        cropping: false,
        filters: []
      },
      quality: validation.isValid ? 'good' : 'needs_improvement',
      recommendations: validation.recommendations
    };
  },

  /**
   * Get OCR accuracy estimation based on image quality
   * @param {Object} imageInfo - Image information
   * @returns {number} - Estimated accuracy (0-1)
   */
  estimateAccuracy(imageInfo) {
    let accuracy = 0.8; // Base accuracy

    // Adjust based on image properties
    if (imageInfo.quality === 'good') {
      accuracy += 0.1;
    }

    if (imageInfo.preprocessing?.filters?.length > 0) {
      accuracy += 0.05;
    }

    // Reduce accuracy for warnings
    if (imageInfo.warnings?.length > 0) {
      accuracy -= imageInfo.warnings.length * 0.05;
    }

    return Math.max(0.1, Math.min(1.0, accuracy));
  },

  /**
   * Format OCR result for display
   * @param {Object} ocrResult - Raw OCR result
   * @returns {Object} - Formatted result
   */
  formatResult(ocrResult) {
    return {
      ...ocrResult,
      formattedData: {
        passportNumber: ocrResult.data?.passportNumber || 'Not found',
        fullName: ocrResult.data?.fullName || 'Not found',
        dateOfBirth: ocrResult.data?.dateOfBirth || 'Not found',
        expirationDate: ocrResult.data?.expirationDate || 'Not found',
        nationality: ocrResult.data?.nationality || 'Not found'
      },
      displayConfidence: Math.round((ocrResult.confidence?.overall || 0) * 100),
      displayCompleteness: ocrResult.completeness || 0,
      status: ocrResult.success ? 'success' : 'needs_review'
    };
  },

  /**
   * Get user-friendly error messages
   * @param {string} errorType - Error type
   * @returns {string} - User-friendly message
   */
  getErrorMessage(errorType) {
    const messages = {
      'ocr_failed': 'Unable to read text from image. Please try again.',
      'low_confidence': 'Text recognition confidence is low. Please ensure good lighting and focus.',
      'no_text_found': 'No text was found in the image. Please check the passport is clearly visible.',
      'invalid_image': 'Invalid image format. Please use a clear photo of the passport.',
      'processing_error': 'An error occurred while processing the image. Please try again.',
      'permission_denied': 'Camera permission is required for OCR. Please enable it in settings.'
    };

    return messages[errorType] || 'An unknown error occurred. Please try again.';
  },

  /**
   * Get OCR tips for better results
   * @returns {Array} - OCR improvement tips
   */
  getOCRTips() {
    return [
      'Ensure good lighting - avoid shadows on the text',
      'Hold the camera steady and focus on the passport',
      'Make sure the entire data page is visible',
      'Avoid blurry or distorted images',
      'Clean the passport surface if it\'s dirty',
      'Try different angles if the text isn\'t clear',
      'Ensure the text is large enough to read clearly'
    ];
  }
};

export default {
  LocalOCRService,
  OCRUtils
};