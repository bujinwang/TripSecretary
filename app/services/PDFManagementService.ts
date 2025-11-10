/**
 * PDF Management Service
 *
 * Centralized service for managing TDAC PDF files
 * - Standardized naming convention
 * - Directory management
 * - File operations (save, delete, list)
 */

import * as FileSystem from 'expo-file-system';
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

interface DirectoryEnsureResult {
  uri: string;
  exists: boolean;
  created: boolean;
}

class PDFManagementService {
  /**
   * TDAC files live under the tdac/ sub-directory inside Expo's document directory:
   * <documentDirectory>/tdac/
   *   ├── TDAC_<cardNo>_<timestamp>.pdf
   *   └── TDAC_QR_<cardNo>_<timestamp>.png
   */
  static readonly PDF_SUBDIR = 'tdac';

  static get PDF_DIRECTORY(): string {
    return this.getPdfDirectoryUri();
  }

  private static getPdfDirectoryUri(): string {
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) {
      throw new Error('FileSystem.documentDirectory is not available');
    }
    const normalizedBase = baseDir.endsWith('/') ? baseDir : `${baseDir}/`;
    return `${normalizedBase}${this.PDF_SUBDIR}/`;
  }

  private static buildFilePath(filename: string): string {
    return `${this.getPdfDirectoryUri()}${filename}`;
  }

  private static async ensurePdfDirectory(): Promise<DirectoryEnsureResult> {
    const directoryUri = this.getPdfDirectoryUri();
    const directoryInfo = await FileSystem.getInfoAsync(directoryUri);

    if (directoryInfo.exists) {
      return {
        uri: directoryUri,
        exists: true,
        created: false
      };
    }

    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
    return {
      uri: directoryUri,
      exists: true,
      created: true
    };
  }

  /**
   * Initialize PDF directory
   * Creates the directory if it doesn't exist
   *
   * @returns {Promise<void>}
   */
  static async initialize(): Promise<DirectoryEnsureResult> {
    try {
      const result = await this.ensurePdfDirectory();
      if (result.created) {
        logger.debug('PDFManagementService', 'PDF directory created', { directoryUri: result.uri });
      }
      return result;
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

  private static async writeBase64File(filepath: string, base64Data: string): Promise<void> {
    const normalized = this.normalizeUri(filepath);
    if (!normalized) {
      throw new Error('Invalid TDAC file path');
    }

    await FileSystem.writeAsStringAsync(normalized, base64Data, {
      encoding: FileSystem.EncodingType.Base64
    });
  }

  private static convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result as string;
          const base64data = result.includes(',')
            ? result.split(',')[1]
            : result;
          resolve(base64data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private static stripBase64Prefix(data: string): string {
    return data.includes(',') ? data.split(',')[1] : data;
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
   * Get fully-qualified TDAC file path within the document directory.
   *
   * @param {string} filename - Filename
   * @returns {string} - Full file path (URI)
   */
  static getFilePath(filename: string): string {
    return this.buildFilePath(filename);
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
      const filepath = this.buildFilePath(filename);
      const base64data = await this.convertBlobToBase64(pdfBlob);

      await this.writeBase64File(filepath, base64data);

      logger.debug('PDFManagementService', 'PDF saved', { filepath });
      return {
        filepath,
        filename,
        size: pdfBlob.size,
        savedAt: new Date().toISOString(),
        arrCardNo,
        metadata
      };
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
      const filepath = this.buildFilePath(filename);
      const base64Image = this.stripBase64Prefix(base64Data);

      await this.writeBase64File(filepath, base64Image);

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
      const normalized = this.normalizeUri(filepath);
      if (!normalized) {
        return { exists: false };
      }

      const info = await FileSystem.getInfoAsync(normalized);
      if (!info.exists) {
        return { exists: false };
      }

      return {
        exists: true,
        uri: info.uri ?? normalized,
        size: typeof info.size === 'number' ? info.size : undefined,
        modificationTime: typeof info.modificationTime === 'number' ? info.modificationTime : null
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
      const normalized = this.normalizeUri(filepath);
      if (!normalized) {
        return;
      }

      const info = await FileSystem.getInfoAsync(normalized);
      if (info.exists) {
        await FileSystem.deleteAsync(normalized, { idempotent: true });
        logger.debug('PDFManagementService', 'PDF deleted', { filepath: normalized });
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
      const directoryUri = this.getPdfDirectoryUri();
      const items = await FileSystem.readDirectoryAsync(directoryUri);
      return items.filter(name => name.toLowerCase().endsWith('.pdf'));
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
        const filepath = this.buildFilePath(filename);

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
      const directoryUri = this.getPdfDirectoryUri();
      const fullPath = filepath.includes('/')
        ? filepath
        : `${directoryUri}${filepath}`;

      const info = await FileSystem.getInfoAsync(fullPath);

      if (!info.exists) {
        throw new Error('PDF file not found');
      }

      // Check if sharing is available on this platform
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this platform');
      }

      const shareUri = info.uri ?? fullPath;

      await Sharing.shareAsync(shareUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share TDAC PDF',
        UTI: 'com.adobe.pdf'
      });

      logger.debug('PDFManagementService', 'PDF shared successfully');
      return {
        success: true,
        filepath: shareUri
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
      const directoryUri = this.getPdfDirectoryUri();
      const fullPath = filepath.includes('/')
        ? filepath
        : `${directoryUri}${filepath}`;

      const info = await FileSystem.getInfoAsync(fullPath);

      if (!info.exists) {
        throw new Error('QR image file not found');
      }

      // Check if sharing is available on this platform
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this platform');
      }

      const shareUri = info.uri ?? fullPath;

      await Sharing.shareAsync(shareUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share TDAC QR Code'
      });

      logger.debug('PDFManagementService', 'QR image shared successfully');
      return {
        success: true,
        filepath: shareUri
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
      const directoryUri = this.getPdfDirectoryUri();
      const filenames = await this.listPDFs();
      const pdfsWithMetadata: PDFMetadataItem[] = [];

      for (const filename of filenames) {
        const match = filename.match(/^TDAC_(.+?)_(\d+)\.pdf$/i);
        if (!match) {
          continue;
        }

        const cardNo = match[1].replace(/_/g, '-');
        const timestamp = parseInt(match[2], 10);
        const uri = `${directoryUri}${filename}`;
        const info = await FileSystem.getInfoAsync(uri);

        pdfsWithMetadata.push({
          filename,
          filepath: uri,
          arrCardNo: cardNo,
          savedAt: new Date(timestamp).toISOString(),
          timestamp,
          size: info.exists && typeof info.size === 'number' ? info.size : 0,
          exists: info.exists
        });
      }

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
      const directoryUri = this.getPdfDirectoryUri();
      const items = await FileSystem.readDirectoryAsync(directoryUri);
      const qrImages: PDFMetadataItem[] = [];

      for (const name of items) {
        if (!/^TDAC_QR_.+\.png$/i.test(name)) {
          continue;
        }

        const match = name.match(/^TDAC_QR_(.+?)_(\d+)\.png$/i);
        if (!match) {
          continue;
        }

        const cardNo = match[1].replace(/_/g, '-');
        const timestamp = parseInt(match[2], 10);
        const uri = `${directoryUri}${name}`;
        const info = await FileSystem.getInfoAsync(uri);

        qrImages.push({
          filename: name,
          filepath: uri,
          arrCardNo: cardNo,
          savedAt: new Date(timestamp).toISOString(),
          timestamp,
          size: info.exists && typeof info.size === 'number' ? info.size : 0,
          exists: info.exists
        });
      }

      qrImages.sort((a, b) => b.timestamp - a.timestamp);
      return qrImages;
    } catch (error: any) {
      logger.error('PDFManagementService', 'Failed to get all saved QR images', { error });
      return [];
    }
  }
}

export default PDFManagementService;
