/**
 * PDF Management Service
 *
 * Centralized service for managing TDAC PDF files
 * - Standardized naming convention
 * - Directory management
 * - File operations (save, delete, list)
 */

import * as FileSystem from 'expo-file-system';

class PDFManagementService {
  // Centralized PDF directory
  static PDF_DIRECTORY = `${FileSystem.documentDirectory}tdac/`;

  /**
   * Initialize PDF directory
   * Creates the directory if it doesn't exist
   *
   * @returns {Promise<void>}
   */
  static async initialize() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.PDF_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.PDF_DIRECTORY, {
          intermediates: true
        });
        console.log('✅ PDF directory created:', this.PDF_DIRECTORY);
      }
    } catch (error) {
      console.error('❌ Failed to initialize PDF directory:', error);
      throw error;
    }
  }

  /**
   * Generate standardized PDF filename
   * Format: TDAC_{arrCardNo}_{timestamp}.pdf
   *
   * @param {string} arrCardNo - Arrival card number
   * @param {string} submissionMethod - Method used (api, webview, hybrid)
   * @returns {string} - Standardized filename
   */
  static generatePDFFilename(arrCardNo, submissionMethod = 'api') {
    const timestamp = Date.now();
    const sanitizedCardNo = arrCardNo.replace(/[^a-zA-Z0-9]/g, '_');
    return `TDAC_${sanitizedCardNo}_${timestamp}.pdf`;
  }

  /**
   * Generate standardized QR code image filename
   * Format: TDAC_QR_{arrCardNo}_{timestamp}.png
   *
   * @param {string} arrCardNo - Arrival card number
   * @returns {string} - Standardized filename
   */
  static generateQRFilename(arrCardNo) {
    const timestamp = Date.now();
    const sanitizedCardNo = arrCardNo.replace(/[^a-zA-Z0-9]/g, '_');
    return `TDAC_QR_${sanitizedCardNo}_${timestamp}.png`;
  }

  /**
   * Get full file path for a filename
   *
   * @param {string} filename - Filename
   * @returns {string} - Full file path
   */
  static getFilePath(filename) {
    return `${this.PDF_DIRECTORY}${filename}`;
  }

  /**
   * Save PDF blob to file system with standardized naming
   *
   * @param {string} arrCardNo - Arrival card number
   * @param {Blob} pdfBlob - PDF blob data
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Save result with filepath, filename, size, savedAt
   */
  static async savePDF(arrCardNo, pdfBlob, metadata = {}) {
    try {
      await this.initialize();

      const filename = this.generatePDFFilename(arrCardNo, metadata.submissionMethod);
      const filepath = this.getFilePath(filename);

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64data = reader.result.split(',')[1];
            await FileSystem.writeAsStringAsync(filepath, base64data, {
              encoding: FileSystem.EncodingType.Base64,
            });

            console.log('✅ PDF saved:', filepath);
            resolve({
              filepath,
              filename,
              size: pdfBlob.size,
              savedAt: new Date().toISOString(),
              arrCardNo,
              metadata
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });
    } catch (error) {
      console.error('❌ Failed to save PDF:', error);
      throw error;
    }
  }

  /**
   * Save QR code image (base64 or data URI) to file system
   *
   * @param {string} arrCardNo - Arrival card number
   * @param {string} base64Data - Base64 encoded image data (with or without prefix)
   * @returns {Promise<Object>} - Save result
   */
  static async saveQRImage(arrCardNo, base64Data) {
    try {
      await this.initialize();

      const filename = this.generateQRFilename(arrCardNo);
      const filepath = this.getFilePath(filename);

      // Remove base64 prefix if present
      const base64Image = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

      await FileSystem.writeAsStringAsync(filepath, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('✅ QR image saved:', filepath);
      return {
        filepath,
        filename,
        savedAt: new Date().toISOString(),
        arrCardNo
      };
    } catch (error) {
      console.error('❌ Failed to save QR image:', error);
      throw error;
    }
  }

  /**
   * Get PDF file info
   *
   * @param {string} filepath - Full file path
   * @returns {Promise<Object>} - File info (exists, uri, size, modificationTime)
   */
  static async getPDFInfo(filepath) {
    try {
      return await FileSystem.getInfoAsync(filepath);
    } catch (error) {
      console.error('❌ Failed to get PDF info:', error);
      return { exists: false };
    }
  }

  /**
   * Delete PDF file
   *
   * @param {string} filepath - Full file path
   * @returns {Promise<void>}
   */
  static async deletePDF(filepath) {
    try {
      await FileSystem.deleteAsync(filepath, { idempotent: true });
      console.log('✅ PDF deleted:', filepath);
    } catch (error) {
      console.error('❌ Failed to delete PDF:', error);
      throw error;
    }
  }

  /**
   * List all PDF files in the TDAC directory
   *
   * @returns {Promise<Array<string>>} - Array of filenames
   */
  static async listPDFs() {
    try {
      await this.initialize();
      const files = await FileSystem.readDirectoryAsync(this.PDF_DIRECTORY);
      return files.filter(f => f.endsWith('.pdf'));
    } catch (error) {
      console.error('❌ Failed to list PDFs:', error);
      return [];
    }
  }

  /**
   * Clean up old PDFs (older than specified days)
   *
   * @param {number} daysOld - Number of days (default: 30)
   * @returns {Promise<Object>} - Cleanup result with deleted count
   */
  static async cleanupOldPDFs(daysOld = 30) {
    try {
      await this.initialize();
      const files = await this.listPDFs();
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      let deletedCount = 0;
      for (const file of files) {
        const filepath = this.getFilePath(file);
        const info = await this.getPDFInfo(filepath);

        if (info.exists && info.modificationTime && info.modificationTime < cutoffTime) {
          await this.deletePDF(filepath);
          deletedCount++;
        }
      }

      console.log(`✅ Cleanup complete: ${deletedCount} old PDFs deleted`);
      return {
        success: true,
        deletedCount,
        totalFiles: files.length
      };
    } catch (error) {
      console.error('❌ Failed to cleanup old PDFs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default PDFManagementService;
