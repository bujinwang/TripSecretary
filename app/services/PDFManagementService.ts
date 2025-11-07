/**
 * PDF Management Service
 *
 * Centralized service for managing TDAC PDF files
 * - Standardized naming convention
 * - Directory management
 * - File operations (save, delete, list)
 */

import * as FileSystem from 'expo-file-system';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import logger from './LoggingService';

interface PDFMetadata {
  submissionMethod?: string;
  [key: string]: any;
}

interface SavePDFResult {
  filepath: string;
  filename: string;
  size: number;
  savedAt: string;
  arrCardNo: string;
  metadata: PDFMetadata;
}

interface SaveQRResult {
  filepath: string;
  filename: string;
  savedAt: string;
  arrCardNo: string;
}

interface PDFInfo {
  exists: boolean;
  uri?: string;
  size?: number;
  modificationTime?: number | null;
}

interface CleanupResult {
  success: boolean;
  deletedCount?: number;
  totalFiles?: number;
  error?: string;
}

interface ShareResult {
  success: boolean;
  filepath?: string;
  error?: string;
}

interface PDFMetadataItem {
  filename: string;
  filepath: string;
  arrCardNo: string;
  savedAt: string;
  timestamp: number;
  size: number;
  exists: boolean;
}

class PDFManagementService {
  // Centralized PDF directory - using legacy API for path construction
  static readonly PDF_DIRECTORY = `${FileSystem.documentDirectory}tdac/`;
  static readonly PDF_SUBDIR = 'tdac'; // For new Directory API

  /**
   * Initialize PDF directory
   * Creates the directory if it doesn't exist
   *
   * @returns {Promise<void>}
   */
  static async initialize(): Promise<void> {
    try {
      // Use new Directory API with Paths helper
      const dir = new Directory(Paths.document, this.PDF_SUBDIR);
      if (!dir.exists) {
        dir.create();
        logger.debug('PDFManagementService', 'PDF directory created');
      }
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to initialize PDF directory', { error });
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
  static generatePDFFilename(arrCardNo: string, submissionMethod: string = 'api'): string {
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
  static generateQRFilename(arrCardNo: string): string {
    const timestamp = Date.now();
    const sanitizedCardNo = arrCardNo.replace(/[^a-zA-Z0-9]/g, '_');
    return `TDAC_QR_${sanitizedCardNo}_${timestamp}.png`;
  }

  /**
   * Normalize URI to file:// format for expo-file-system
   */
  private static normalizeUri(uri: string | null | undefined): string | null {
    if (!uri) {
      return null;
    }
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      return uri;
    }
    if (uri.startsWith('/')) {
      return `file://${uri}`;
    }
    return uri;
  }

  /**
   * Extract filename from TDAC file path
   */
  private static extractFilename(uri: string | null): string | null {
    if (!uri) {
      return null;
    }
    try {
      const decoded = decodeURI(uri);
      const parts = decoded.split('/');
      return parts.pop() || null;
    } catch (error) {
      logger.warn('PDFManagementService', 'Failed to extract filename from uri', { uri, error });
      return null;
    }
  }

  /**
   * Check whether a file exists at the provided URI
   */
  private static async fileExists(uri: string | null): Promise<boolean> {
    if (!uri) {
      return false;
    }
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return Boolean(info?.exists);
    } catch (error) {
      logger.warn('PDFManagementService', 'fileExists check failed', { uri, error });
      return false;
    }
  }

  /**
   * Attempt to resolve and, if necessary, recover a TDAC PDF path
   * from legacy simulator directories.
   *
   * @param pdfUri - Stored PDF URI
   * @param options - Recovery options
   * @returns Object with resolved URI and recovery flag
   */
  static async resolvePDFUri(
    pdfUri: string | null | undefined,
    options: { attemptCopy?: boolean } = {}
  ): Promise<{ uri: string | null; recovered: boolean }> {
    const attemptCopy = options.attemptCopy !== false;
    const normalized = this.normalizeUri(pdfUri);

    if (!normalized) {
      return { uri: null, recovered: false };
    }

    if (await this.fileExists(normalized)) {
      return { uri: normalized, recovered: false };
    }

    const filename = this.extractFilename(normalized);
    if (!filename) {
      return { uri: normalized, recovered: false };
    }

    await this.initialize();
    const currentUri = this.getFilePath(filename);

    if (await this.fileExists(currentUri)) {
      return { uri: currentUri, recovered: true };
    }

    if (attemptCopy) {
      try {
        await FileSystem.copyAsync({
          from: normalized,
          to: currentUri
        });

        if (await this.fileExists(currentUri)) {
          logger.info('PDFManagementService', 'Recovered TDAC PDF from legacy path', { filename });
          return { uri: currentUri, recovered: true };
        }
      } catch (error) {
        logger.warn('PDFManagementService', 'Failed to copy TDAC PDF from legacy path', {
          filename,
          error
        });
      }
    }

    return { uri: normalized, recovered: false };
  }

  /**
   * Get full file path for a filename
   * @deprecated Use direct File creation with Paths.document instead
   *
   * @param {string} filename - Filename
   * @returns {string} - Full file path (URI)
   */
  static getFilePath(filename: string): string {
    const file = new File(Paths.document, `${this.PDF_SUBDIR}/${filename}`);
    return file.uri;
  }

  /**
   * Save PDF blob to file system with standardized naming
   *
   * @param {string} arrCardNo - Arrival card number
   * @param {Blob} pdfBlob - PDF blob data
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Save result with filepath, filename, size, savedAt
   */
  static async savePDF(arrCardNo: string, pdfBlob: Blob, metadata: PDFMetadata = {}): Promise<SavePDFResult> {
    try {
      await this.initialize();

      const filename = this.generatePDFFilename(arrCardNo, metadata.submissionMethod);
      const file = new File(Paths.document, `${this.PDF_SUBDIR}/${filename}`);
      const filepath = file.uri; // Get the actual URI for later use

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const result = reader.result as string;
            const base64data = result.split(',')[1];
            // Decode base64 to Uint8Array for binary data
            const binaryString = atob(base64data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            file.create();
            file.write(bytes);

            logger.debug('PDFManagementService', 'PDF saved', { filepath });
            resolve({
              filepath,
              filename,
              size: pdfBlob.size,
              savedAt: new Date().toISOString(),
              arrCardNo,
              metadata
            });
          } catch (error: any) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to save PDF', { error });
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
  static async saveQRImage(arrCardNo: string, base64Data: string): Promise<SaveQRResult> {
    try {
      await this.initialize();

      const filename = this.generateQRFilename(arrCardNo);
      const file = new File(Paths.document, `${this.PDF_SUBDIR}/${filename}`);
      const filepath = file.uri; // Get the actual URI for later use

      // Remove base64 prefix if present
      const base64Image = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

      // Decode base64 to Uint8Array for binary image data
      const binaryString = atob(base64Image);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      file.create();
      file.write(bytes);

      logger.debug('PDFManagementService', 'QR image saved', { filepath });
      return {
        filepath,
        filename,
        savedAt: new Date().toISOString(),
        arrCardNo
      };
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to save QR image', { error });
      throw error;
    }
  }

  /**
   * Get PDF file info
   *
   * @param {string} filepath - Full file path
   * @returns {Promise<Object>} - File info (exists, uri, size, modificationTime)
   */
  static async getPDFInfo(filepath: string): Promise<PDFInfo> {
    try {
      const file = new File(filepath);

      if (!file.exists) {
        return { exists: false };
      }

      // Get file metadata
      return {
        exists: true,
        uri: file.uri,
        size: file.size,
        modificationTime: null // New API doesn't provide modificationTime directly
      };
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to get PDF info', { error });
      return { exists: false };
    }
  }

  /**
   * Delete PDF file
   *
   * @param {string} filepath - Full file path
   * @returns {Promise<void>}
   */
  static async deletePDF(filepath: string): Promise<void> {
    try {
      const file = new File(filepath);
      if (file.exists) {
        file.delete();
        logger.debug('PDFManagementService', 'PDF deleted', { filepath });
      }
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to delete PDF', { error });
      throw error;
    }
  }

  /**
   * List all PDF files in the TDAC directory
   *
   * @returns {Promise<Array<string>>} - Array of filenames
   */
  static async listPDFs(): Promise<string[]> {
    try {
      await this.initialize();
      const dir = new Directory(Paths.document, this.PDF_SUBDIR);
      const items = dir.list();
      // Filter for .pdf files and extract just the names
      return items
        .filter(item => item instanceof File && item.name.endsWith('.pdf'))
        .map(item => (item as File).name);
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to list PDFs', { error });
      return [];
    }
  }

  /**
   * Clean up old PDFs (older than specified days)
   * NOTE: New File API doesn't provide modificationTime directly.
   * Currently using filename timestamp as fallback.
   *
   * @param {number} daysOld - Number of days (default: 30)
   * @returns {Promise<Object>} - Cleanup result with deleted count
   */
  static async cleanupOldPDFs(daysOld: number = 30): Promise<CleanupResult> {
    try {
      await this.initialize();
      const files = await this.listPDFs();
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      let deletedCount = 0;
      for (const filename of files) {
        // Create file object using path components
        const file = new File(Paths.document, `${this.PDF_SUBDIR}/${filename}`);
        const filepath = file.uri;

        // Extract timestamp from filename (format: TDAC_{cardNo}_{timestamp}.pdf)
        const timestampMatch = filename.match(/_(\d+)\.pdf$/);
        if (timestampMatch) {
          const fileTimestamp = parseInt(timestampMatch[1], 10);
          if (fileTimestamp < cutoffTime) {
            await this.deletePDF(filepath);
            deletedCount++;
          }
        }
      }

      logger.debug('PDFManagementService', `Cleanup complete: ${deletedCount} old PDFs deleted`);
      return {
        success: true,
        deletedCount,
        totalFiles: files.length
      };
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to cleanup old PDFs', { error });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Share PDF file using native share dialog
   *
   * @param {string} filepath - Full file path or filename
   * @returns {Promise<Object>} - Share result
   */
  static async sharePDF(filepath: string): Promise<ShareResult> {
    try {
      // If only filename provided, construct full path
      const fullPath = filepath.includes('/')
        ? filepath
        : this.getFilePath(filepath);

      const file = new File(fullPath);

      if (!file.exists) {
        throw new Error('PDF file not found');
      }

      // Check if sharing is available on this platform
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this platform');
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share TDAC PDF',
        UTI: 'com.adobe.pdf'
      });

      logger.debug('PDFManagementService', 'PDF shared successfully');
      return {
        success: true,
        filepath: file.uri
      };
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to share PDF', { error });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Share QR code image using native share dialog
   *
   * @param {string} filepath - Full file path or filename
   * @returns {Promise<Object>} - Share result
   */
  static async shareQRImage(filepath: string): Promise<ShareResult> {
    try {
      // If only filename provided, construct full path
      const fullPath = filepath.includes('/')
        ? filepath
        : this.getFilePath(filepath);

      const file = new File(fullPath);

      if (!file.exists) {
        throw new Error('QR image file not found');
      }

      // Check if sharing is available on this platform
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this platform');
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share TDAC QR Code'
      });

      logger.debug('PDFManagementService', 'QR image shared successfully');
      return {
        success: true,
        filepath: file.uri
      };
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to share QR image', { error });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all saved PDFs with detailed metadata
   *
   * @returns {Promise<Array<Object>>} - Array of PDF metadata objects
   */
  static async getAllSavedPDFs(): Promise<PDFMetadataItem[]> {
    try {
      await this.initialize();
      const filenames = await this.listPDFs();

      const pdfsWithMetadata: PDFMetadataItem[] = [];

      for (const filename of filenames) {
        const file = new File(Paths.document, `${this.PDF_SUBDIR}/${filename}`);

        // Parse filename: TDAC_{cardNo}_{timestamp}.pdf
        const match = filename.match(/^TDAC_(.+?)_(\d+)\.pdf$/);

        if (match) {
          const cardNo = match[1].replace(/_/g, '-'); // Restore dashes
          const timestamp = parseInt(match[2], 10);

          pdfsWithMetadata.push({
            filename,
            filepath: file.uri,
            arrCardNo: cardNo,
            savedAt: new Date(timestamp).toISOString(),
            timestamp,
            size: file.exists ? file.size : 0,
            exists: file.exists
          });
        }
      }

      // Sort by timestamp descending (newest first)
      pdfsWithMetadata.sort((a, b) => b.timestamp - a.timestamp);

      return pdfsWithMetadata;
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to get all saved PDFs', { error });
      return [];
    }
  }

  /**
   * Get all saved QR images with detailed metadata
   *
   * @returns {Promise<Array<Object>>} - Array of QR image metadata objects
   */
  static async getAllSavedQRImages(): Promise<PDFMetadataItem[]> {
    try {
      await this.initialize();
      const dir = new Directory(Paths.document, this.PDF_SUBDIR);
      const items = dir.list();

      const qrImages: PDFMetadataItem[] = [];

      for (const item of items) {
        if (item instanceof File && item.name.match(/^TDAC_QR_.+\.png$/)) {
          // Parse filename: TDAC_QR_{cardNo}_{timestamp}.png
          const match = item.name.match(/^TDAC_QR_(.+?)_(\d+)\.png$/);

          if (match) {
            const cardNo = match[1].replace(/_/g, '-'); // Restore dashes
            const timestamp = parseInt(match[2], 10);

            qrImages.push({
              filename: item.name,
              filepath: item.uri,
              arrCardNo: cardNo,
              savedAt: new Date(timestamp).toISOString(),
              timestamp,
              size: item.size,
              exists: item.exists
            });
          }
        }
      }

      // Sort by timestamp descending (newest first)
      qrImages.sort((a, b) => b.timestamp - a.timestamp);

      return qrImages;
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to get all saved QR images', { error });
      return [];
    }
  }
}

export default PDFManagementService;
