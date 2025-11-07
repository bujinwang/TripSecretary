/**
 * DataExportService - Service for exporting entry info data
 * Supports JSON, PDF, and image export formats
 *
 * Requirements: 21.1-21.5
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../data/UserDataService';
import BiometricAuthService from '../security/BiometricAuthService';
import type {
  PassportData,
  PersonalInfoData,
  FundItemData,
  TravelInfoData,
  EntryInfoData,
} from '../../types/data';

// Type definitions
type ExportFormat = 'json' | 'pdf' | 'image';
type ImageExportType = 'qr' | 'summary';

interface DigitalArrivalCard {
  id?: string;
  entryInfoId?: string;
  arrCardNo?: string;
  qrUri?: string;
  pdfPath?: string;
  submittedAt?: string;
  submissionMethod?: 'api' | 'webview' | 'hybrid';
  status?: 'success' | 'failed';
  cardType?: string;
  error?: unknown;
  [key: string]: unknown;
}

interface CompleteEntryInfoData {
  entryInfo: EntryInfo & { exportData: () => Record<string, unknown>; displayStatus?: { status?: string } };
  passport: PassportData | null;
  personalInfo: PersonalInfoData | null;
  funds: FundItemData[] | null;
  travel: TravelInfoData | null;
  digitalArrivalCards: DigitalArrivalCard[] | null;
}

interface ExportOptions {
  includeMetadata?: boolean;
  includePhotos?: boolean;
  includeSubmissionHistory?: boolean;
  includeQRCode?: boolean;
  includeFunds?: boolean;
  returnData?: boolean;
  type?: ImageExportType;
  includeQR?: boolean;
  outputDirectory?: string;
  onProgress?: (progress: ProgressInfo) => void;
  [key: string]: unknown;
}

interface ProgressInfo {
  current: number;
  total: number;
  status: 'exporting' | 'exported' | 'packaging' | 'completed';
  currentEntryInfo?: string;
}

interface ExportResult {
  success: boolean;
  format: ExportFormat | 'zip';
  filename: string;
  filePath: string;
  fileSize: number;
  dataSize?: number;
  exportData?: Record<string, unknown> | null;
  sharingOptions: SharingOptions;
  type?: ImageExportType;
  source?: string;
  qrData?: {
    arrCardNo?: string;
    submittedAt?: string;
    submissionMethod?: string;
    cardType?: string;
  };
  summaryData?: {
    destination: string;
    arrivalDate?: string;
    passengerName?: string;
    passportNumber?: string;
  };
  error?: string;
  requiresAuth?: boolean;
}

interface BatchExportResult {
  success: boolean;
  format: 'zip';
  batchSize: number;
  successfulExports: number;
  failedExports: number;
  exportResults: ExportResultItem[];
  zipPackage: ZipPackageResult;
  sharingOptions: SharingOptions;
}

interface ExportResultItem {
  entryInfoId: string;
  success: boolean;
  result?: ExportResult;
  error?: string;
}

interface ZipPackageResult {
  success: boolean;
  filename: string;
  filePath: string;
  fileSize: number;
  entryPackCount: number;
  failureCount: number;
  format: string;
}

interface SharingOptions {
  available: boolean;
  filePath?: string;
  mimeType?: string;
  isImage?: boolean;
  saveToAlbum?: (() => Promise<SaveImageResult>) | null;
  share?: ((options?: SharingShareOptions) => Promise<SharingShareResult>) | null;
  message?: string;
  error?: string;
}

interface SharingShareOptions {
  title?: string;
  [key: string]: unknown;
}

interface SharingShareResult {
  action?: string;
  [key: string]: unknown;
}

interface SaveImageResult {
  success: boolean;
  asset?: unknown;
  album?: string;
  message?: string;
}

interface PhotoData {
  fundItemId?: string;
  originalPath?: string;
  filename?: string;
  mimeType?: string;
  base64Data?: string;
  fileSize?: number;
  exportedAt?: string;
  error?: string;
}

interface ImageData {
  base64: string;
  width: number;
  height: number;
  format: string;
}

interface ExportFileInfo {
  filename: string;
  filePath: string;
  size: number;
  modificationTime: number;
  createdAt: string;
  isBatchExport: boolean;
}

interface ExportDirectoryInfo {
  exists: boolean;
  fileCount: number;
  totalSize: number;
  directory?: string;
  error?: string;
}

interface CleanupResult {
  deletedCount: number;
  message?: string;
  error?: string;
}

interface BatchExportEstimate {
  totalEntryInfos: number;
  totalEstimatedSize: number;
  estimatedDuration: number;
  entryInfoInfo: EntryInfoEstimate[];
  recommendations?: string[];
  error?: string;
}

interface EntryInfoEstimate {
  entryInfoId: string;
  destination: string;
  estimatedSize: number;
  hasPhotos: boolean;
  error?: string;
}

interface QRExportResult {
  success: boolean;
  reason?: string;
  error?: string;
}

// FileSystem type assertions (expo-file-system types may not be complete)
interface FileSystemFile {
  exists(): Promise<boolean>;
  size(): Promise<number>;
  write(data: string | Uint8Array): Promise<void>;
  text(): Promise<string>;
  base64(): Promise<string>;
  copy(dest: string): Promise<void>;
  move(dest: string): Promise<void>;
  delete(): Promise<void>;
  modificationTime(): Promise<number>;
}

interface FileSystemDirectory {
  exists(): Promise<boolean>;
  create(): Promise<void>;
  list(): Promise<string[]>;
}

class DataExportService {
  private exportDirectory: string;
  private tempDirectory: string;

  constructor() {
    this.exportDirectory = FileSystem.documentDirectory + 'exports/';
    this.tempDirectory = FileSystem.documentDirectory + 'temp/';
  }

  /**
   * Export entry info in specified format
   * @param entryInfoId - Entry info ID
   * @param format - Export format ('json', 'pdf', 'image')
   * @param options - Export options
   * @returns Export result with file path and sharing options
   */
  async exportEntryInfo(entryInfoId: string, format: ExportFormat = 'json', options: ExportOptions = {}): Promise<ExportResult> {
    try {
      // Authenticate user for data export
      const authResult = await BiometricAuthService.authenticateForDataExport(format);
      if (!authResult.success && !authResult.skipped) {
        return {
          success: false,
          format,
          filename: '',
          filePath: '',
          fileSize: 0,
          error: authResult.error || 'Authentication required for data export',
          requiresAuth: true,
          sharingOptions: { available: false }
        };
      }

      // Ensure export directory exists
      await this.ensureDirectoryExists(this.exportDirectory);

      // Load entry info data
      const entryInfo = await EntryInfo.load(entryInfoId);
      if (!entryInfo) {
        throw new Error(`Entry info not found: ${entryInfoId}`);
      }

      // Load complete data
      const completeData = await this.loadCompleteEntryInfoData(entryInfo);

      // Export based on format
      switch (format.toLowerCase()) {
        case 'json':
          return await this.exportAsJSON(completeData, options);
        case 'pdf':
          return await this.exportAsPDF(completeData, options);
        case 'image':
          return await this.exportAsImage(completeData, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to export entry info:', errorMessage);
      throw error;
    }
  }

  /**
   * Export entry pack in specified format (backward compatibility)
   * @param entryPackId - Entry pack ID (converted to entry info ID)
   * @param format - Export format ('json', 'pdf', 'image')
   * @param options - Export options
   * @returns Export result with file path and sharing options
   */
  async exportEntryPack(entryPackId: string, format: ExportFormat = 'json', options: ExportOptions = {}): Promise<ExportResult> {
    try {
      // For backward compatibility, try to find entry info by ID
      // In v2.0, entry packs are replaced by entry info
      const entryInfo = await EntryInfo.load(entryPackId);
      if (!entryInfo) {
        throw new Error(`Entry info not found for legacy entry pack ID: ${entryPackId}`);
      }

      return await this.exportEntryInfo(entryInfo.id, format, options);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to export entry pack:', errorMessage);
      throw error;
    }
  }

  /**
   * Export entry pack data as JSON file
   * @param completeData - Complete entry pack data
   * @param options - Export options
   * @returns Export result
   */
  async exportAsJSON(completeData: CompleteEntryInfoData, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      // Build export data structure
      const exportData: Record<string, unknown> = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exportVersion: '2.0',
          exportFormat: 'json',
          appVersion: '1.0.0', // TODO: Get from app config
          exportOptions: options
        },
        entryInfo: completeData.entryInfo.exportData(),
        passport: completeData.passport || null,
        personalInfo: completeData.personalInfo || null,
        funds: completeData.funds || [],
        travel: completeData.travel || null,
        digitalArrivalCards: completeData.digitalArrivalCards || []
      };

      // Include submission history if requested (from DACs)
      if (options.includeSubmissionHistory !== false) {
        exportData.submissionHistory = completeData.digitalArrivalCards || [];
      }

      // Include metadata if requested
      if (options.includeMetadata !== false) {
        exportData.metadata = {
          totalSubmissionAttempts: (completeData.digitalArrivalCards || []).length,
          failedSubmissionAttempts: (completeData.digitalArrivalCards || []).filter((dac: DigitalArrivalCard) => dac.status === 'failed').length,
          hasValidTDACSubmission: (completeData.digitalArrivalCards || []).some((dac: DigitalArrivalCard) => dac.status === 'success'),
          completionStatus: completeData.entryInfo.displayStatus?.status || 'unknown',
          exportStats: {
            fundItemCount: (completeData.funds || []).length,
            photoCount: (completeData.funds || []).filter((f: FundItemData) => f.photoUri).length,
            dacCount: (completeData.digitalArrivalCards || []).length,
            dataSize: JSON.stringify(exportData).length
          }
        };
      }

      // Include photo data if requested
      if (options.includePhotos !== false) {
        exportData.photos = await this.exportPhotoData(completeData.funds || []);
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const destinationName = this.getDestinationName(completeData.entryInfo.destinationId);
      const filename = `entry-info-${destinationName}-${timestamp}.json`;
      const filePath = this.exportDirectory + filename;

      // Write JSON file
      const jsonString = JSON.stringify(exportData, null, 2);
      const file = new FileSystem.File(filePath) as unknown as FileSystemFile;
      await file.write(jsonString);

      // Get file info
      const fileSize = await file.size();

      return {
        success: true,
        format: 'json',
        filename,
        filePath,
        fileSize: fileSize,
        dataSize: jsonString.length,
        exportData: options.returnData ? exportData : null,
        sharingOptions: await this.getSharingOptions(filePath, 'application/json')
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to export as JSON:', errorMessage);
      throw error;
    }
  }

  /**
   * Export entry pack data as PDF
   * @param completeData - Complete entry pack data
   * @param options - Export options
   * @returns Export result
   */
  async exportAsPDF(completeData: CompleteEntryInfoData, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      // Generate HTML content for PDF
      const htmlContent = await this.generatePDFHTML(completeData, options);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const destinationName = this.getDestinationName(completeData.entryInfo.destinationId);
      const filename = `entry-info-${destinationName}-${timestamp}.pdf`;
      const filePath = this.exportDirectory + filename;

      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612, // 8.5 inches at 72 DPI
        height: 792, // 11 inches at 72 DPI
        margins: {
          left: 50,
          top: 50,
          right: 50,
          bottom: 50
        }
      });

      // Move the generated PDF to our export directory
      const sourceFile = new FileSystem.File(uri) as unknown as FileSystemFile;
      await sourceFile.move(filePath);

      // Get file info
      const file = new FileSystem.File(filePath) as unknown as FileSystemFile;
      const fileSize = await file.size();

      return {
        success: true,
        format: 'pdf',
        filename,
        filePath,
        fileSize: fileSize,
        sharingOptions: await this.getSharingOptions(filePath, 'application/pdf')
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to export as PDF:', errorMessage);
      throw error;
    }
  }

  /**
   * Export entry pack data as image
   * @param completeData - Complete entry pack data
   * @param options - Export options
   * @returns Export result
   */
  async exportAsImage(completeData: CompleteEntryInfoData, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const exportType = (options.type || 'summary') as ImageExportType;

      switch (exportType) {
        case 'qr':
          return await this.exportQRCodeImage(completeData, options);
        case 'summary':
          return await this.exportSummaryImage(completeData, options);
        default:
          throw new Error(`Unsupported image export type: ${exportType}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to export as image:', errorMessage);
      throw error;
    }
  }

  /**
   * Export multiple entry infos (batch export)
   * @param entryInfoIds - Array of entry info IDs
   * @param format - Export format
   * @param options - Export options
   * @returns Batch export result
   */
  async exportMultipleEntryInfos(entryInfoIds: string[], format: ExportFormat = 'json', options: ExportOptions = {}): Promise<BatchExportResult> {
    try {
      if (!entryInfoIds || entryInfoIds.length === 0) {
        throw new Error('No entry infos provided for batch export');
      }

      // Ensure temp directory exists for batch processing
      await this.ensureDirectoryExists(this.tempDirectory);

      // Track progress
      const progressCallback = options.onProgress || (() => {});
      const exportResults: ExportResultItem[] = [];
      let completedCount = 0;

      // Export each entry info individually
      for (const entryInfoId of entryInfoIds) {
        try {
          progressCallback({
            current: completedCount,
            total: entryInfoIds.length,
            status: 'exporting',
            currentEntryInfo: entryInfoId
          });

          const result = await this.exportEntryInfo(entryInfoId, format, {
            ...options,
            // Override directory to use temp for batch processing
            outputDirectory: this.tempDirectory
          });

          exportResults.push({
            entryInfoId,
            success: true,
            result
          });

          completedCount++;
          progressCallback({
            current: completedCount,
            total: entryInfoIds.length,
            status: 'exported',
            currentEntryInfo: entryInfoId
          });

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to export entry info ${entryInfoId}:`, errorMessage);
          exportResults.push({
            entryInfoId,
            success: false,
            error: errorMessage
          });
          completedCount++;
        }
      }

      // Create ZIP package
      progressCallback({
        current: completedCount,
        total: entryInfoIds.length,
        status: 'packaging'
      });

      const zipResult = await this.createBatchZipPackage(exportResults, format, options);

      // Cleanup temp files
      await this.cleanupTempFiles(exportResults);

      progressCallback({
        current: completedCount,
        total: entryInfoIds.length,
        status: 'completed'
      });

      return {
        success: true,
        format: 'zip',
        batchSize: entryInfoIds.length,
        successfulExports: exportResults.filter(r => r.success).length,
        failedExports: exportResults.filter(r => !r.success).length,
        exportResults,
        zipPackage: zipResult,
        sharingOptions: await this.getSharingOptions(zipResult.filePath, 'application/zip')
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to complete batch export:', errorMessage);
      throw error;
    }
  }

  /**
   * Export QR code as high resolution image
   * @param completeData - Complete entry pack data
   * @param options - Export options
   * @returns Export result
   */
  async exportQRCodeImage(completeData: CompleteEntryInfoData, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const { entryInfo, digitalArrivalCards } = completeData;
      const latestDAC = digitalArrivalCards && digitalArrivalCards.length > 0 ?
        digitalArrivalCards.find((dac: DigitalArrivalCard) => dac.status === 'success') : null;

      if (!latestDAC) {
        throw new Error('No successful digital arrival card available for export');
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const destinationName = this.getDestinationName(entryInfo.destinationId);
      const filename = `qr-code-${destinationName}-${timestamp}.jpg`;
      const filePath = this.exportDirectory + filename;

      let exportedFromSource: string | null = null;

      // Try to export QR code from available sources
      if (latestDAC.qrUri) {
        // QR code image is available
        try {
          if (latestDAC.qrUri.startsWith('file://') || latestDAC.qrUri.startsWith('/')) {
            // Local file - copy it
            const sourceFile = new FileSystem.File(latestDAC.qrUri) as unknown as FileSystemFile;
            await sourceFile.copy(filePath);
            exportedFromSource = 'qr_image';
          } else {
            // Remote URL - download it
            const downloadResult = await FileSystem.downloadAsync(latestDAC.qrUri, filePath);
            if (downloadResult.status !== 200) {
              throw new Error(`Failed to download QR code: ${downloadResult.status}`);
            }
            exportedFromSource = 'qr_url';
          }
        } catch (qrError: unknown) {
          console.warn('Failed to export from QR URI, trying PDF:', qrError);
          // Fall through to PDF extraction
        }
      }

      // If QR image export failed or not available, try to extract from PDF
      if (!exportedFromSource && latestDAC.pdfPath) {
        try {
          const pdfExportResult = await this.extractQRFromPDF(latestDAC.pdfPath, filePath);
          if (pdfExportResult.success) {
            exportedFromSource = 'pdf_extraction';
          }
        } catch (pdfError: unknown) {
          console.warn('Failed to extract QR from PDF:', pdfError);
        }
      }

      // If both methods failed, generate a placeholder image with entry card info
      if (!exportedFromSource) {
        await this.generateQRPlaceholderImage(latestDAC, filePath);
        exportedFromSource = 'placeholder';
      }

      // Get file info
      const file = new FileSystem.File(filePath) as unknown as FileSystemFile;
      const fileSize = await file.size();

      return {
        success: true,
        format: 'image',
        type: 'qr',
        filename,
        filePath,
        fileSize: fileSize,
        source: exportedFromSource || undefined,
        qrData: {
          arrCardNo: latestDAC.arrCardNo,
          submittedAt: latestDAC.submittedAt,
          submissionMethod: latestDAC.submissionMethod,
          cardType: latestDAC.cardType
        },
        sharingOptions: await this.getSharingOptions(filePath, 'image/jpeg')
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to export QR code image:', errorMessage);
      throw error;
    }
  }

  /**
   * Export entry pack summary as image
   * @param completeData - Complete entry pack data
   * @param options - Export options
   * @returns Export result
   */
  async exportSummaryImage(completeData: CompleteEntryInfoData, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const { entryInfo, passport, personalInfo, travel } = completeData;

      // Generate HTML content for the summary image
      await this.generateSummaryImageHTML(completeData, options);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const destinationName = this.getDestinationName(entryInfo.destinationId);
      const filename = `entry-summary-${destinationName}-${timestamp}.jpg`;
      const filePath = this.exportDirectory + filename;

      // Use expo-print to generate PDF first, then we'll need to convert to image
      // Since we don't have direct HTML-to-image capability, we'll create a structured image using Canvas-like approach
      const imageData = await this.generateSummaryImageData(completeData, options);
      
      // Write the image data to file
      const bytes = Uint8Array.from(atob(imageData.base64), c => c.charCodeAt(0));
      const file = new FileSystem.File(filePath) as unknown as FileSystemFile;
      await file.write(bytes);

      // Get file info
      const fileSize = await file.size();

      return {
        success: true,
        format: 'image',
        type: 'summary',
        filename,
        filePath,
        fileSize: fileSize,
        summaryData: {
          destination: this.getDestinationName(entryInfo.destinationId),
          arrivalDate: travel?.arrivalDate,
          passengerName: passport?.fullName,
          passportNumber: passport?.passportNumber
        },
        sharingOptions: await this.getSharingOptions(filePath, 'image/jpeg')
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to export summary image:', errorMessage);
      throw error;
    }
  }

  /**
   * Extract QR code from PDF file (placeholder implementation)
   * @param pdfPath - Path to PDF file
   * @param outputPath - Output image path
   * @returns Extraction result
   */
  async extractQRFromPDF(pdfPath: string, outputPath: string): Promise<QRExportResult> {
    try {
      // Note: This is a placeholder implementation
      // In a real scenario, you would need a PDF processing library
      // For now, we'll copy the PDF and indicate it needs manual extraction
      
      console.log('PDF QR extraction not implemented - generating placeholder');
      return { success: false, reason: 'PDF QR extraction not implemented' };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to extract QR from PDF:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generate QR placeholder image with entry card information
   * @param tdacSubmission - TDAC submission data
   * @param outputPath - Output image path
   */
  async generateQRPlaceholderImage(tdacSubmission: DigitalArrivalCard, outputPath: string): Promise<void> {
    try {
      const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) {
          return 'Not available';
        }
        try {
          return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return dateStr;
        }
      };

      // Create SVG placeholder with entry card information
      const svgContent = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              .bg { fill: #ffffff; }
              .border { fill: none; stroke: #2c3e50; stroke-width: 3; }
              .title { font: bold 18px Arial; fill: #2c3e50; text-anchor: middle; }
              .label { font: bold 14px Arial; fill: #34495e; }
              .value { font: 14px Arial; fill: #2c3e50; }
              .qr-placeholder { fill: #ecf0f1; stroke: #bdc3c7; stroke-width: 2; stroke-dasharray: 5,5; }
              .qr-text { font: 12px Arial; fill: #7f8c8d; text-anchor: middle; }
            </style>
          </defs>
          
          <!-- Background -->
          <rect class="bg" width="400" height="400" rx="10"/>
          <rect class="border" width="400" height="400" rx="10"/>
          
          <!-- Title -->
          <text class="title" x="200" y="30">Thailand Entry Card</text>
          
          <!-- QR Placeholder -->
          <rect class="qr-placeholder" x="100" y="50" width="200" height="200" rx="5"/>
          <text class="qr-text" x="200" y="140">QR Code</text>
          <text class="qr-text" x="200" y="155">Available in PDF</text>
          
          <!-- Entry Card Number -->
          <text class="label" x="50" y="280">Entry Card Number:</text>
          <text class="value" x="50" y="300">${tdacSubmission.arrCardNo || 'Not available'}</text>
          
          <!-- Submission Info -->
          <text class="label" x="50" y="330">Submitted:</text>
          <text class="value" x="50" y="350">${formatDate(tdacSubmission.submittedAt)}</text>
          
          <!-- Method -->
          <text class="label" x="50" y="380">Method: ${tdacSubmission.submissionMethod || 'Unknown'}</text>
        </svg>
      `;

      // Convert SVG to base64 and save
      const base64Data = Buffer.from(svgContent).toString('base64');
      const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const outputFile = new FileSystem.File(outputPath) as unknown as FileSystemFile;
      await outputFile.write(bytes);

      console.log('Generated QR placeholder image');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to generate QR placeholder image:', errorMessage);
      throw error;
    }
  }

  /**
   * Generate summary image data using SVG-to-base64 approach
   * @param completeData - Complete entry info data
   * @param options - Export options
   * @returns Image data
   */
  async generateSummaryImageData(completeData: CompleteEntryInfoData, options: ExportOptions = {}): Promise<ImageData> {
    try {
      const { entryInfo, passport, personalInfo, travel, digitalArrivalCards } = completeData;
      const latestDAC = digitalArrivalCards && digitalArrivalCards.length > 0 ?
        digitalArrivalCards.find((dac: DigitalArrivalCard) => dac.status === 'success') : null;
      
      // Format data for display
      const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) {
          return 'Not set';
        }
        try {
          return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch {
          return dateStr;
        }
      };

      const destinationName = this.getDestinationName(entryInfo.destinationId).toUpperCase();
      const passengerName = passport?.fullName || 'Not provided';
      const passportNumber = passport?.passportNumber || 'Not provided';
      const arrivalDate = formatDate(travel?.arrivalDate);
      const arrCardNo = latestDAC?.arrCardNo || 'Not submitted';
      const submissionStatus = latestDAC ? 'Submitted' : 'Not submitted';

      // Create SVG content
      const svgContent = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              .title { font: bold 32px Arial; fill: #2c3e50; }
              .destination { font: bold 24px Arial; fill: #e74c3c; }
              .label { font: bold 16px Arial; fill: #34495e; }
              .value { font: 16px Arial; fill: #2c3e50; }
              .status { font: bold 18px Arial; fill: #27ae60; }
              .bg { fill: #ffffff; }
              .border { fill: none; stroke: #bdc3c7; stroke-width: 2; }
              .section-bg { fill: #f8f9fa; }
            </style>
          </defs>
          
          <!-- Background -->
          <rect class="bg" width="800" height="600" rx="10"/>
          <rect class="border" width="800" height="600" rx="10"/>
          
          <!-- Header -->
          <rect class="section-bg" x="20" y="20" width="760" height="80" rx="8"/>
          <text class="title" x="400" y="50" text-anchor="middle">Travel Entry Pack</text>
          <text class="destination" x="400" y="80" text-anchor="middle">${destinationName}</text>
          
          <!-- Status Section -->
          <rect class="section-bg" x="20" y="120" width="760" height="60" rx="8"/>
          <text class="label" x="40" y="145">Status:</text>
          <text class="status" x="40" y="165">${submissionStatus}</text>
          ${latestDAC ? `<text class="value" x="400" y="155">Entry Card: ${arrCardNo}</text>` : ''}
          
          <!-- Passenger Information -->
          <rect class="section-bg" x="20" y="200" width="760" height="120" rx="8"/>
          <text class="label" x="40" y="225">Passenger Information</text>
          <text class="label" x="40" y="250">Name:</text>
          <text class="value" x="150" y="250">${passengerName}</text>
          <text class="label" x="40" y="275">Passport:</text>
          <text class="value" x="150" y="275">${passportNumber}</text>
          <text class="label" x="40" y="300">Nationality:</text>
          <text class="value" x="150" y="300">${passport?.nationality || 'Not provided'}</text>
          
          <!-- Travel Information -->
          <rect class="section-bg" x="20" y="340" width="760" height="120" rx="8"/>
          <text class="label" x="40" y="365">Travel Information</text>
          <text class="label" x="40" y="390">Arrival Date:</text>
          <text class="value" x="150" y="390">${arrivalDate}</text>
          <text class="label" x="40" y="415">Purpose:</text>
          <text class="value" x="150" y="415">${travel?.travelPurpose || 'Not specified'}</text>
          <text class="label" x="40" y="440">Flight:</text>
          <text class="value" x="150" y="440">${travel?.flightNumber || 'Not provided'}</text>
          
          <!-- Footer -->
          <text class="label" x="400" y="520" text-anchor="middle">Generated on ${formatDate(new Date().toISOString())}</text>
          <text class="value" x="400" y="540" text-anchor="middle" font-size="12">Entry Pack Export Service</text>
          <text class="value" x="400" y="560" text-anchor="middle" font-size="10">This is a traveler-prepared document</text>
        </svg>
      `;

      // Convert SVG to base64
      const base64Data = Buffer.from(svgContent).toString('base64');
      
      return {
        base64: base64Data,
        width: 800,
        height: 600,
        format: 'svg'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to generate summary image data:', errorMessage);
      throw error;
    }
  }

  /**
   * Generate HTML content for summary image (alternative approach)
   * @param completeData - Complete entry info data
   * @param options - Export options
   * @returns HTML content
   */
  async generateSummaryImageHTML(completeData: CompleteEntryInfoData, options: ExportOptions = {}): Promise<string> {
    try {
      const { entryInfo, passport, personalInfo, travel, digitalArrivalCards } = completeData;
      const latestDAC = digitalArrivalCards && digitalArrivalCards.length > 0 ?
        digitalArrivalCards.find((dac: DigitalArrivalCard) => dac.status === 'success') : null;

      const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) {
          return 'Not set';
        }
        try {
          return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch {
          return dateStr;
        }
      };

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              width: 800px;
              height: 600px;
              box-sizing: border-box;
            }
            .container {
              border: 2px solid #bdc3c7;
              border-radius: 10px;
              padding: 20px;
              height: 100%;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .title {
              font-size: 32px;
              font-weight: bold;
              color: #2c3e50;
              margin: 0;
            }
            .destination {
              font-size: 24px;
              font-weight: bold;
              color: #e74c3c;
              margin: 10px 0 0 0;
            }
            .section {
              margin-bottom: 20px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #34495e;
              margin-bottom: 10px;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .label {
              font-weight: bold;
              color: #34495e;
              width: 120px;
            }
            .value {
              color: #2c3e50;
            }
            .status {
              font-size: 18px;
              font-weight: bold;
              color: #27ae60;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #7f8c8d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">Travel Entry Pack</h1>
              <div class="destination">${this.getDestinationName(entryInfo.destinationId).toUpperCase()}</div>
            </div>

            <div class="section">
              <div class="section-title">Status</div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="status">${latestDAC ? 'Submitted' : 'Not submitted'}</span>
              </div>
              ${latestDAC ? `
                <div class="info-row">
                  <span class="label">Entry Card:</span>
                  <span class="value">${latestDAC.arrCardNo || 'N/A'}</span>
                </div>
              ` : ''}
            </div>

            <div class="section">
              <div class="section-title">Passenger Information</div>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${passport?.fullName || 'Not provided'}</span>
              </div>
              <div class="info-row">
                <span class="label">Passport:</span>
                <span class="value">${passport?.passportNumber || 'Not provided'}</span>
              </div>
              <div class="info-row">
                <span class="label">Nationality:</span>
                <span class="value">${passport?.nationality || 'Not provided'}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Travel Information</div>
              <div class="info-row">
                <span class="label">Arrival Date:</span>
                <span class="value">${formatDate(travel?.arrivalDate)}</span>
              </div>
              <div class="info-row">
                <span class="label">Purpose:</span>
                <span class="value">${travel?.travelPurpose || 'Not specified'}</span>
              </div>
              <div class="info-row">
                <span class="label">Flight:</span>
                <span class="value">${travel?.flightNumber || 'Not provided'}</span>
              </div>
            </div>

            <div class="footer">
              <div>Generated on ${formatDate(new Date().toISOString())}</div>
              <div>Entry Pack Export Service</div>
              <div>This is a traveler-prepared document</div>
            </div>
          </div>
        </body>
        </html>
      `;

      return html;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to generate summary image HTML:', errorMessage);
      throw error;
    }
  }

  /**
   * Generate HTML content for PDF export
   * @param completeData - Complete entry info data
   * @param options - Export options
   * @returns HTML content
   */
  async generatePDFHTML(completeData: CompleteEntryInfoData, options: ExportOptions = {}): Promise<string> {
    try {
      const { entryInfo, passport, personalInfo, funds, travel, digitalArrivalCards } = completeData;

      // Get latest successful DAC
      const latestDAC = digitalArrivalCards && digitalArrivalCards.length > 0 ?
        digitalArrivalCards.find((dac: DigitalArrivalCard) => dac.status === 'success') : null;
      
      // Format dates
      const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) {
          return 'Not provided';
        }
        try {
          return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch {
          return dateStr;
        }
      };

      // Format currency
      const formatCurrency = (amount: number | undefined, currency: string | undefined): string => {
        if (!amount || !currency) {
          return 'Not specified';
        }
        return `${currency} ${Number(amount).toLocaleString()}`;
      };

      // Generate QR code section
      const qrCodeSection = latestDAC && options.includeQRCode !== false ? `
        <div class="section qr-section">
          <h2>Digital Arrival Card (${latestDAC.cardType || 'TDAC'})</h2>
          <div class="qr-container">
            <div class="qr-placeholder">
              <p><strong>Entry Card Number:</strong> ${latestDAC.arrCardNo || 'N/A'}</p>
              <p><strong>Submitted:</strong> ${formatDate(latestDAC.submittedAt)}</p>
              <p><strong>Method:</strong> ${latestDAC.submissionMethod || 'Unknown'}</p>
              <p class="qr-note">QR Code: ${latestDAC.qrUri ? 'Available in digital format' : 'Not available'}</p>
            </div>
          </div>
        </div>
      ` : '';

      // Generate passport section
      const passportSection = passport ? `
        <div class="section">
          <h2>Passport Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Full Name:</label>
              <span>${passport.fullName || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Passport Number:</label>
              <span>${passport.passportNumber || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Nationality:</label>
              <span>${passport.nationality || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Date of Birth:</label>
              <span>${formatDate(passport.dateOfBirth)}</span>
            </div>
            <div class="info-item">
              <label>Expiry Date:</label>
              <span>${formatDate(passport.expiryDate)}</span>
            </div>
            <div class="info-item">
              <label>Gender:</label>
              <span>${passport.gender || 'Not provided'}</span>
            </div>
          </div>
        </div>
      ` : '';

      // Generate personal info section
      const personalInfoSection = personalInfo ? `
        <div class="section">
          <h2>Personal Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Occupation:</label>
              <span>${personalInfo.occupation || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Province/City:</label>
              <span>${personalInfo.provinceCity || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Country/Region:</label>
              <span>${personalInfo.countryRegion || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Phone Number:</label>
              <span>${personalInfo.phoneNumber || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Email:</label>
              <span>${personalInfo.email || 'Not provided'}</span>
            </div>
          </div>
        </div>
      ` : '';

      // Generate travel info section
      const travelSection = travel ? `
        <div class="section">
          <h2>Travel Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Purpose of Visit:</label>
              <span>${travel.travelPurpose || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Arrival Date:</label>
              <span>${formatDate(travel.arrivalDate)}</span>
            </div>
            <div class="info-item">
              <label>Departure Date:</label>
              <span>${formatDate(travel.departureDate)}</span>
            </div>
            <div class="info-item">
              <label>Flight Number:</label>
              <span>${travel.flightNumber || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Accommodation:</label>
              <span>${travel.accommodation || 'Not provided'}</span>
            </div>
            <div class="info-item">
              <label>Accommodation Address:</label>
              <span>${travel.accommodationAddress || 'Not provided'}</span>
            </div>
          </div>
        </div>
      ` : '';

      // Generate funds section
      const fundsSection = funds && funds.length > 0 && options.includeFunds !== false ? `
        <div class="section">
          <h2>Fund Information</h2>
          <div class="funds-list">
            ${funds.map((fund: FundItemData, index: number) => `
              <div class="fund-item">
                <div class="fund-header">
                  <strong>Fund Item ${index + 1}</strong>
                </div>
                <div class="fund-details">
                  <div class="info-item">
                    <label>Type:</label>
                    <span>${fund.type || 'Not specified'}</span>
                  </div>
                  <div class="info-item">
                    <label>Amount:</label>
                    <span>${formatCurrency(fund.amount, fund.currency)}</span>
                  </div>
                  <div class="info-item">
                    <label>Description:</label>
                    <span>${fund.description || 'No description'}</span>
                  </div>
                  ${fund.photoUri ? '<div class="photo-note">📷 Photo attached (available in digital format)</div>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="funds-summary">
            <strong>Total Funds: ${this.calculateTotalFunds(funds)}</strong>
          </div>
        </div>
      ` : '';

      // Generate complete HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Entry Info Export - ${this.getDestinationName(entryInfo.destinationId).toUpperCase()}</title>
          <style>
            ${this.getPDFStyles()}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Travel Entry Pack</h1>
              <div class="destination">${this.getDestinationName(entryInfo.destinationId).toUpperCase()}</div>
              <div class="export-info">
                <p>Exported on: ${formatDate(new Date().toISOString())}</p>
                <p>Entry Info ID: ${entryInfo.id}</p>
                <p>Status: ${entryInfo.displayStatus?.status || 'Unknown'}</p>
              </div>
            </div>

            ${qrCodeSection}
            ${passportSection}
            ${personalInfoSection}
            ${travelSection}
            ${fundsSection}

            <div class="footer">
              <p><strong>Important Notice:</strong> This document is generated by the traveler and should be verified with official systems. Please present original documents when required.</p>
              <p class="disclaimer">Generated by Entry Pack Export Service v1.0</p>
            </div>
          </div>
        </body>
        </html>
      `;

      return html;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to generate PDF HTML:', errorMessage);
      throw error;
    }
  }

  /**
   * Get CSS styles for PDF export
   * @returns CSS styles
   */
  getPDFStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: white;
      }

      .container {
        max-width: 100%;
        margin: 0 auto;
        padding: 20px;
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #333;
        padding-bottom: 20px;
      }

      .header h1 {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #2c3e50;
      }

      .destination {
        font-size: 18px;
        font-weight: bold;
        color: #e74c3c;
        margin-bottom: 15px;
      }

      .export-info {
        font-size: 10px;
        color: #666;
      }

      .export-info p {
        margin: 2px 0;
      }

      .section {
        margin-bottom: 25px;
        page-break-inside: avoid;
      }

      .section h2 {
        font-size: 16px;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 15px;
        padding-bottom: 5px;
        border-bottom: 1px solid #bdc3c7;
      }

      .qr-section {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #dee2e6;
      }

      .qr-container {
        text-align: center;
      }

      .qr-placeholder {
        background: white;
        padding: 20px;
        border-radius: 4px;
        border: 2px dashed #6c757d;
        margin: 10px 0;
      }

      .qr-placeholder p {
        margin: 8px 0;
        font-size: 14px;
      }

      .qr-note {
        font-style: italic;
        color: #6c757d;
        font-size: 11px !important;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 15px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
        border-left: 3px solid #3498db;
      }

      .info-item label {
        font-weight: bold;
        color: #2c3e50;
        font-size: 11px;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .info-item span {
        color: #333;
        font-size: 12px;
        word-wrap: break-word;
      }

      .funds-list {
        margin-bottom: 15px;
      }

      .fund-item {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        margin-bottom: 15px;
        overflow: hidden;
      }

      .fund-header {
        background: #3498db;
        color: white;
        padding: 10px 15px;
        font-weight: bold;
        font-size: 13px;
      }

      .fund-details {
        padding: 15px;
      }

      .fund-details .info-item {
        margin-bottom: 8px;
        background: white;
        border-left-color: #27ae60;
      }

      .photo-note {
        margin-top: 10px;
        padding: 8px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        font-size: 11px;
        color: #856404;
      }

      .funds-summary {
        text-align: right;
        padding: 15px;
        background: #e8f5e8;
        border-radius: 4px;
        font-size: 14px;
        color: #27ae60;
      }

      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #bdc3c7;
        font-size: 10px;
        color: #666;
        text-align: center;
      }

      .footer p {
        margin: 8px 0;
      }

      .disclaimer {
        font-style: italic;
        color: #999 !important;
      }

      @media print {
        .container {
          padding: 0;
        }
        
        .section {
          page-break-inside: avoid;
        }
        
        .qr-section {
          page-break-inside: avoid;
        }
      }
    `;
  }

  /**
   * Calculate total funds across all currencies
   * @param funds - Array of fund items
   * @returns Formatted total funds string
   */
  calculateTotalFunds(funds: FundItemData[] | null | undefined): string {
    if (!funds || funds.length === 0) {
      return 'No funds specified';
    }

    const totals: Record<string, number> = {};
    
    funds.forEach((fund: FundItemData) => {
      if (fund.amount && fund.currency) {
        const currency = fund.currency.toUpperCase();
        totals[currency] = (totals[currency] || 0) + Number(fund.amount);
      }
    });

    const totalStrings = Object.entries(totals).map(([currency, amount]) => 
      `${currency} ${amount.toLocaleString()}`
    );

    return totalStrings.length > 0 ? totalStrings.join(' + ') : 'No valid funds';
  }

  /**
   * Load complete entry info data including all related information
   * @param entryInfo - Entry info instance
   * @returns Complete data object
   */
  async loadCompleteEntryInfoData(entryInfo: EntryInfo): Promise<CompleteEntryInfoData> {
    try {
      // Load passport data
      const passport = await UserDataService.getPassport(entryInfo.userId);

      // Load personal info
      const personalInfo = await UserDataService.getPersonalInfo(entryInfo.userId);

      // Load funds data
      const funds = await UserDataService.getFunds(entryInfo.userId);

      // Load travel info
      const travel = await UserDataService.getTravelInfo(entryInfo.userId, entryInfo.destinationId);

      // Load digital arrival cards
      const digitalArrivalCards = await UserDataService.getDigitalArrivalCardsByEntryInfoId(entryInfo.id);

      return {
        entryInfo: entryInfo as CompleteEntryInfoData['entryInfo'],
        passport,
        personalInfo,
        funds,
        travel,
        digitalArrivalCards
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load complete entry info data:', errorMessage);
      throw error;
    }
  }

  /**
   * Export photo data with base64 encoding
   * @param funds - Array of fund items
   * @returns Array of photo data
   */
  async exportPhotoData(funds: FundItemData[]): Promise<PhotoData[]> {
    try {
      const photoData: PhotoData[] = [];

      for (const fund of funds) {
        if (fund.photoUri) {
          try {
            // Check if file exists
            const photoFile = new FileSystem.File(fund.photoUri) as unknown as FileSystemFile;
            const fileExists = await photoFile.exists();
            if (fileExists) {
              // Read file as base64
              const base64Data = await photoFile.base64();
              const fileSize = await photoFile.size();

              photoData.push({
                fundItemId: fund.id,
                originalPath: fund.photoUri,
                filename: fund.photoUri.split('/').pop(),
                mimeType: 'image/jpeg',
                base64Data: base64Data,
                fileSize: fileSize,
                exportedAt: new Date().toISOString()
              });
            } else {
              console.warn('Photo file not found:', fund.photoUri);
              photoData.push({
                fundItemId: fund.id,
                originalPath: fund.photoUri,
                filename: fund.photoUri.split('/').pop(),
                error: 'File not found',
                exportedAt: new Date().toISOString()
              });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to export photo:', fund.photoUri, errorMessage);
            photoData.push({
              fundItemId: fund.id,
              originalPath: fund.photoUri,
              filename: fund.photoUri.split('/').pop(),
              error: errorMessage,
              exportedAt: new Date().toISOString()
            });
          }
        }
      }

      return photoData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to export photo data:', errorMessage);
      return [];
    }
  }

  /**
   * Save image to device photo album
   * @param filePath - Image file path
   * @returns Save result
   */
  async saveImageToAlbum(filePath: string): Promise<SaveImageResult> {
    try {
      // Import MediaLibrary dynamically to avoid issues if not available
      const { MediaLibrary } = await import('expo-media-library');
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library was denied');
      }

      // Save to album
      const asset = await MediaLibrary.createAssetAsync(filePath);
      
      // Try to add to a custom album
      try {
        const albumName = 'Entry Pack Exports';
        let album = await MediaLibrary.getAlbumAsync(albumName);
        
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
        
        return {
          success: true,
          asset,
          album: albumName,
          message: `Image saved to ${albumName} album`
        };
      } catch (albumError: unknown) {
        // If album creation fails, the image is still saved to the main library
        console.warn('Failed to create/add to custom album:', albumError);
        return {
          success: true,
          asset,
          album: 'Photos',
          message: 'Image saved to Photos'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to save image to album:', errorMessage);
      throw error;
    }
  }

  /**
   * Get sharing options for exported file
   * @param filePath - File path
   * @param mimeType - MIME type
   * @returns Sharing options
   */
  async getSharingOptions(filePath: string, mimeType: string = 'application/json'): Promise<SharingOptions> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        return {
          available: false,
          message: 'Sharing is not available on this device'
        };
      }

      // Determine UTI based on MIME type
      let UTI: string | undefined;
      switch (mimeType) {
        case 'application/json':
          UTI = 'public.json';
          break;
        case 'application/pdf':
          UTI = 'com.adobe.pdf';
          break;
        case 'image/jpeg':
          UTI = 'public.jpeg';
          break;
        case 'image/png':
          UTI = 'public.png';
          break;
        case 'image/svg+xml':
          UTI = 'public.svg-image';
          break;
        case 'application/zip':
          UTI = 'public.zip-archive';
          break;
        default:
          UTI = undefined;
      }

      const isImage = mimeType.startsWith('image/');

      return {
        available: true,
        filePath,
        mimeType,
        isImage,
        saveToAlbum: isImage ? async () => {
          return await this.saveImageToAlbum(filePath);
        } : null,
        share: async (shareOptions: SharingShareOptions = {}) => {
          const defaultTitle = mimeType === 'application/pdf' ? 
            'Share Entry Pack PDF' : 
            mimeType === 'application/json' ? 
            'Share Entry Pack Data' : 
            mimeType === 'application/zip' ?
            'Share Batch Export Archive' :
            isImage ? 
            'Share Entry Pack Image' :
            'Share Entry Pack Export';

          return await Sharing.shareAsync(filePath, {
            mimeType,
            dialogTitle: shareOptions.title || defaultTitle,
            UTI,
            ...shareOptions
          });
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get sharing options:', errorMessage);
      return {
        available: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get destination name for filename
   * @param destinationId - Destination ID
   * @returns Destination name
   */
  getDestinationName(destinationId: string | undefined): string {
    const destinationMap: Record<string, string> = {
      thailand: 'thailand',
      japan: 'japan',
      singapore: 'singapore',
      malaysia: 'malaysia',
      taiwan: 'taiwan',
      hongkong: 'hongkong',
      korea: 'korea',
      usa: 'usa'
    };

    return destinationMap[destinationId || ''] || destinationId || 'unknown';
  }

  /**
   * Ensure directory exists
   * @param dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      const directory = new FileSystem.Directory(dirPath) as unknown as FileSystemDirectory;
      const dirExists = await directory.exists();
      if (!dirExists) {
        await directory.create();
        console.log('Created directory:', dirPath);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create directory:', dirPath, errorMessage);
      throw error;
    }
  }

  /**
   * Clean up old export files
   * @param maxAgeHours - Maximum age in hours (default: 24)
   * @returns Cleanup result
   */
  async cleanupOldExports(maxAgeHours: number = 24): Promise<CleanupResult> {
    try {
      const directory = new FileSystem.Directory(this.exportDirectory) as unknown as FileSystemDirectory;
      if (!await directory.exists()) {
        return { deletedCount: 0, message: 'Export directory does not exist' };
      }

      const files = await directory.list();
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const filename of files) {
        const filePath = this.exportDirectory + filename;
        const file = new FileSystem.File(filePath) as unknown as FileSystemFile;

        if (await file.exists()) {
          const modificationTime = await file.modificationTime();
          if (modificationTime < cutoffTime) {
            await file.delete();
            deletedCount++;
            console.log('Deleted old export file:', filename);
          }
        }
      }

      return {
        deletedCount,
        message: `Cleaned up ${deletedCount} old export files`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to cleanup old exports:', errorMessage);
      return {
        deletedCount: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Get export directory info
   * @returns Directory info
   */
  async getExportDirectoryInfo(): Promise<ExportDirectoryInfo> {
    try {
      const directory = new FileSystem.Directory(this.exportDirectory) as unknown as FileSystemDirectory;

      if (!await directory.exists()) {
        return {
          exists: false,
          fileCount: 0,
          totalSize: 0
        };
      }

      const files = await directory.list();
      let totalSize = 0;

      for (const filename of files) {
        const filePath = this.exportDirectory + filename;
        const file = new FileSystem.File(filePath) as unknown as FileSystemFile;
        if (await file.exists()) {
          totalSize += (await file.size()) || 0;
        }
      }

      return {
        exists: true,
        fileCount: files.length,
        totalSize,
        directory: this.exportDirectory
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get export directory info:', errorMessage);
      return {
        exists: false,
        fileCount: 0,
        totalSize: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Delete export file
   * @param filename - Filename to delete
   * @returns Success status
   */
  async deleteExportFile(filename: string): Promise<boolean> {
    try {
      const filePath = this.exportDirectory + filename;
      const file = new FileSystem.File(filePath) as unknown as FileSystemFile;

      if (await file.exists()) {
        await file.delete();
        console.log('Deleted export file:', filename);
        return true;
      }

      return false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to delete export file:', filename, errorMessage);
      return false;
    }
  }

  /**
   * Create ZIP package for batch export
   * @param exportResults - Array of export results
   * @param format - Export format
   * @param options - Export options
   * @returns ZIP package result
   */
  async createBatchZipPackage(exportResults: ExportResultItem[], format: ExportFormat, options: ExportOptions = {}): Promise<ZipPackageResult> {
    try {
      // Generate ZIP filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const successfulExports = exportResults.filter(r => r.success);
      const zipFilename = `batch-export-${format}-${successfulExports.length}-packs-${timestamp}.zip`;
      const zipFilePath = this.exportDirectory + zipFilename;

      // Since React Native doesn't have built-in ZIP support, we'll create a simple archive structure
      // For now, we'll create a JSON manifest and copy files to a structured directory
      const archiveData: Record<string, unknown> = {
        exportInfo: {
          createdAt: new Date().toISOString(),
          format,
          totalEntryInfos: exportResults.length,
          successfulExports: successfulExports.length,
          failedExports: exportResults.filter(r => !r.success).length,
          exportVersion: '1.0'
        },
        entryInfos: [],
        failures: exportResults.filter(r => !r.success).map(r => ({
          entryInfoId: r.entryInfoId,
          error: r.error
        }))
      };

      // Process successful exports
      for (const result of successfulExports) {
        if (result.result && result.result.filePath) {
          try {
            // Read the exported file content
            const resultFile = new FileSystem.File(result.result.filePath) as unknown as FileSystemFile;
            const fileContent = await resultFile.text();

            (archiveData.entryInfos as unknown[]).push({
              entryInfoId: result.entryInfoId,
              filename: result.result.filename,
              format: result.result.format,
              fileSize: result.result.fileSize,
              content: format === 'json' ? JSON.parse(fileContent) : fileContent
            });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to read export file for ${result.entryInfoId}:`, errorMessage);
            (archiveData.failures as unknown[]).push({
              entryInfoId: result.entryInfoId,
              error: `Failed to read export file: ${errorMessage}`
            });
          }
        }
      }

      // Write the archive as a JSON file (simulating ZIP structure)
      const archiveContent = JSON.stringify(archiveData, null, 2);
      const zipFile = new FileSystem.File(zipFilePath) as unknown as FileSystemFile;
      await zipFile.write(archiveContent);

      // Get file info
      const fileSize = await zipFile.size();

      return {
        success: true,
        filename: zipFilename,
        filePath: zipFilePath,
        fileSize: fileSize,
        entryPackCount: successfulExports.length,
        failureCount: (archiveData.failures as unknown[]).length,
        format: 'json-archive' // Since we're creating a JSON archive instead of true ZIP
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create ZIP package:', errorMessage);
      throw error;
    }
  }

  /**
   * Cleanup temporary files after batch export
   * @param exportResults - Array of export results
   */
  async cleanupTempFiles(exportResults: ExportResultItem[]): Promise<void> {
    try {
      for (const result of exportResults) {
        if (result.success && result.result && result.result.filePath) {
          try {
            // Only delete if it's in temp directory
            if (result.result.filePath.includes(this.tempDirectory)) {
              const tempFile = new FileSystem.File(result.result.filePath) as unknown as FileSystemFile;
              await tempFile.delete();
              console.log('Cleaned up temp file:', result.result.filename);
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn('Failed to cleanup temp file:', result.result.filePath, errorMessage);
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to cleanup temp files:', errorMessage);
    }
  }

  /**
   * Get batch export progress information
   * @param entryInfoIds - Array of entry info IDs to export
   * @returns Progress estimation
   */
  async getBatchExportEstimate(entryInfoIds: string[]): Promise<BatchExportEstimate> {
    try {
      let totalEstimatedSize = 0;
      const entryInfoInfo: EntryInfoEstimate[] = [];

      for (const entryInfoId of entryInfoIds) {
        try {
          const entryInfo = await EntryInfo.load(entryInfoId);
          if (entryInfo) {
            const completeData = await this.loadCompleteEntryInfoData(entryInfo);

            // Estimate size based on data complexity
            let estimatedSize = 50000; // Base size in bytes (50KB)

            // Add size for funds with photos
            if (completeData.funds) {
              estimatedSize += completeData.funds.length * 10000; // 10KB per fund item
              const fundsWithPhotos = completeData.funds.filter((f: FundItemData) => f.photoUri);
              estimatedSize += fundsWithPhotos.length * 500000; // 500KB per photo
            }

            entryInfoInfo.push({
              entryInfoId,
              destination: this.getDestinationName(entryInfo.destinationId),
              estimatedSize,
              hasPhotos: completeData.funds ? completeData.funds.some((f: FundItemData) => f.photoUri) : false
            });

            totalEstimatedSize += estimatedSize;
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to estimate size for entry info ${entryInfoId}:`, errorMessage);
          entryInfoInfo.push({
            entryInfoId,
            destination: 'Unknown',
            estimatedSize: 50000,
            hasPhotos: false,
            error: errorMessage
          });
          totalEstimatedSize += 50000;
        }
      }

      return {
        totalEntryInfos: entryInfoIds.length,
        totalEstimatedSize,
        estimatedDuration: Math.max(entryInfoIds.length * 2, 10), // At least 10 seconds, 2 seconds per pack
        entryInfoInfo,
        recommendations: this.getBatchExportRecommendations(totalEstimatedSize, entryInfoIds.length)
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get batch export estimate:', errorMessage);
      return {
        totalEntryInfos: entryInfoIds.length,
        totalEstimatedSize: entryInfoIds.length * 50000,
        estimatedDuration: entryInfoIds.length * 2,
        entryInfoInfo: [],
        error: errorMessage
      };
    }
  }

  /**
   * Get recommendations for batch export
   * @param totalSize - Total estimated size in bytes
   * @param entryInfoCount - Number of entry infos
   * @returns Array of recommendation strings
   */
  getBatchExportRecommendations(totalSize: number, entryInfoCount: number): string[] {
    const recommendations: string[] = [];

    if (totalSize > 100 * 1024 * 1024) { // > 100MB
      recommendations.push('Large export size detected. Consider exporting in smaller batches.');
    }

    if (entryInfoCount > 10) {
      recommendations.push('Large number of entry infos. Export may take several minutes.');
    }

    if (totalSize > 50 * 1024 * 1024) { // > 50MB
      recommendations.push('Ensure you have sufficient storage space available.');
    }

    recommendations.push('Keep the app open during export to prevent interruption.');

    return recommendations;
  }

  /**
   * List export files
   * @returns Array of export file info
   */
  async listExportFiles(): Promise<ExportFileInfo[]> {
    try {
      const directory = new FileSystem.Directory(this.exportDirectory) as unknown as FileSystemDirectory;
      if (!await directory.exists()) {
        return [];
      }

      const files = await directory.list();
      const fileInfos: ExportFileInfo[] = [];

      for (const filename of files) {
        const filePath = this.exportDirectory + filename;
        const file = new FileSystem.File(filePath) as unknown as FileSystemFile;

        if (await file.exists()) {
          const modificationTime = await file.modificationTime();
          fileInfos.push({
            filename,
            filePath,
            size: await file.size(),
            modificationTime: modificationTime,
            createdAt: new Date(modificationTime).toISOString(),
            isBatchExport: filename.includes('batch-export')
          });
        }
      }

      // Sort by modification time (newest first)
      fileInfos.sort((a, b) => b.modificationTime - a.modificationTime);

      return fileInfos;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to list export files:', errorMessage);
      return [];
    }
  }
}

// Export singleton instance
const dataExportService = new DataExportService();

export default dataExportService;

