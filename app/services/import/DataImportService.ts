/**
 * DataImportService - Service for importing entry info data
 * Supports JSON import, conflict resolution, and batch import
 *
 * Requirements: 22.1-22.5
 */

import * as FileSystem from 'expo-file-system';
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../data/UserDataService';
import logger from '../LoggingService';

// Type definitions
type EntryInfoModel = any;

interface ImportOptions {
  resolveConflicts?: boolean;
  conflictResolutions?: Record<string, string>;
  batchImport?: boolean;
  originalEntryPackId?: string;
  onProgress?: (progress: ImportProgress) => void;
}

interface ImportProgress {
  current: number;
  total: number;
  status: 'importing' | 'imported' | 'completed';
  currentEntryPack?: string;
}

interface ImportData {
  exportInfo?: {
    exportedAt?: string;
    exportVersion?: string;
    exportFormat?: string;
    appVersion?: string;
  };
  entryInfo?: {
    id: string;
    destinationId: string;
    userId?: string;
    [key: string]: any;
  };
  passport?: {
    id?: string;
    passportNumber: string;
    fullName: string;
    [key: string]: any;
  };
  personalInfo?: {
    id?: string;
    [key: string]: any;
  };
  travel?: {
    id?: string;
    [key: string]: any;
  };
  funds?: Array<{
    id?: string;
    type: string;
    photoUri?: string;
    [key: string]: any;
  }>;
  photos?: Array<{
    fundItemId: string;
    base64Data?: string;
    originalPath?: string;
    [key: string]: any;
  }>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

interface Conflict {
  type: 'entry_info_exists' | 'passport_exists' | 'fund_exists';
  entryInfoId?: string;
  passportNumber?: string;
  fundId?: string;
  message: string;
  existingData: any;
  importData: any;
  resolutionOptions: string[];
}

interface ConflictResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
  conflictCount: number;
  error?: string;
}

interface ImportResult {
  success: boolean;
  entryInfosImported: number;
  photosRestored: number;
  conflicts: Conflict[];
  errors: string[];
  warnings: string[];
  importedEntryInfoId: string | null;
  importedAt: string;
  requiresConflictResolution?: boolean;
  resolveConflicts?: (resolutions: Record<string, string>) => Promise<ImportResult>;
}

interface BatchImportResult extends ImportResult {
  batchImport: boolean;
  totalEntryInfos: number;
  successfulImports: number;
  failedImports: number;
  importResults: Array<{
    originalEntryPackId: string;
    success: boolean;
    result?: ImportResult;
    error?: string;
  }>;
  summary: {
    originalExportInfo?: any;
    importedAt: string;
    failures: any[];
  };
}

interface ArchiveData {
  exportInfo?: any;
  entryPacks: Array<{
    entryPackId: string;
    content: {
      entryInfo?: any;
      entryPack?: any;
      passport?: any;
      personalInfo?: any;
      funds?: any[];
      travel?: any;
      photos?: any[];
    };
  }>;
  failures?: any[];
}

class DataImportService {
  exportDirectory: string;
  tempDirectory: string;

  constructor() {
    this.exportDirectory = FileSystem.documentDirectory + 'exports/';
    this.tempDirectory = FileSystem.documentDirectory + 'temp/import/';
  }

  /**
    * Import entry info from file
    * @param {string} filePath - Path to import file
    * @param {Object} options - Import options
    * @returns {Promise<Object>} - Import result
    */
   async importEntryInfo(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
     try {
       logger.debug('DataImportService', 'Starting entry info import', {
         filePath,
         options
       });

      // Ensure import directory exists
      await this.ensureDirectoryExists(this.exportDirectory);

      // Validate file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`Import file not found: ${filePath}`);
      }

      // Determine import type based on file extension
      const fileName = filePath.split('/').pop() || '';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

      switch (fileExtension) {
        case 'json':
          return await this.importFromJSON(filePath, options);
        case 'zip':
          return await this.importFromZIP(filePath, options);
        default:
          throw new Error(`Unsupported import file type: ${fileExtension}`);
      }
    } catch (error: any) {
      logger.error('DataImportService', 'Failed to import entry pack', { error });
      throw error;
    }
  }

  /**
   * Import entry pack from JSON file
   * @param {string} filePath - Path to JSON file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import result
   */
  async importFromJSON(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      logger.debug('DataImportService', 'Importing from JSON', { filePath });

      // Read and parse JSON file
      const jsonContent = await FileSystem.readAsStringAsync(filePath);

      let importData: ImportData;
      try {
        importData = JSON.parse(jsonContent);
      } catch (parseError: any) {
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }

      // Validate import data structure
      const validationResult = await this.validateImportData(importData);
      if (!validationResult.isValid) {
        throw new Error(`Invalid import data: ${validationResult.errors.join(', ')}`);
      }

      // Check for conflicts
      const conflictResult = await this.checkForConflicts(importData, options);
      
      if (conflictResult.hasConflicts && !options.resolveConflicts) {
        return {
          success: false,
          requiresConflictResolution: true,
          conflicts: conflictResult.conflicts,
          entryInfosImported: 0,
          photosRestored: 0,
          errors: [],
          warnings: [],
          importedEntryInfoId: null,
          importedAt: new Date().toISOString(),
          resolveConflicts: async (resolutions: Record<string, string>) => {
            return await this.importFromJSON(filePath, {
              ...options,
              resolveConflicts: true,
              conflictResolutions: resolutions
            });
          }
        };
      }

      // Perform the import
      const importResult = await this.performImport(importData, options);

      logger.debug('DataImportService', 'JSON import completed', {
        success: importResult.success,
        entryInfosImported: importResult.entryInfosImported,
        photosRestored: importResult.photosRestored
      });

      return importResult;

    } catch (error: any) {
      logger.error('DataImportService', 'Failed to import from JSON', { error });
      throw error;
    }
  }

  /**
   * Import entry pack from ZIP file (batch import)
   * @param {string} filePath - Path to ZIP file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import result
   */
  async importFromZIP(filePath: string, options: ImportOptions = {}): Promise<BatchImportResult> {
    try {
      logger.debug('DataImportService', 'Importing from ZIP', { filePath });

      // For now, treat ZIP as JSON archive (since we create JSON archives in batch export)
      // In a real implementation, you would extract the ZIP file first
      
      // Read the "ZIP" file as JSON (our batch export format)
      const archiveContent = await FileSystem.readAsStringAsync(filePath);

      let archiveData: ArchiveData;
      try {
        archiveData = JSON.parse(archiveContent);
      } catch (parseError: any) {
        throw new Error(`Invalid archive format: ${parseError.message}`);
      }

      // Validate archive structure
      if (!archiveData.entryPacks || !Array.isArray(archiveData.entryPacks)) {
        throw new Error('Invalid batch export archive: missing entryPacks array');
      }

      // Note: archiveData.entryPacks contains the old format, but we convert to entryInfo format

      const importResults: Array<{
        originalEntryPackId: string;
        success: boolean;
        result?: ImportResult;
        error?: string;
      }> = [];
      const progressCallback = options.onProgress || (() => {});
      let processedCount = 0;

      // Import each entry pack from the archive
      for (const entryPackData of archiveData.entryPacks) {
        try {
          progressCallback({
            current: processedCount,
            total: archiveData.entryPacks.length,
            status: 'importing',
            currentEntryPack: entryPackData.entryPackId
          });

          // Convert archive entry pack data to import format
          // Note: In v2.0, entryPack data is migrated to entryInfo
          const importData: ImportData = {
            exportInfo: archiveData.exportInfo,
            entryInfo: entryPackData.content.entryInfo || entryPackData.content.entryPack, // Use entryInfo if available, fallback to entryPack
            passport: entryPackData.content.passport,
            personalInfo: entryPackData.content.personalInfo,
            funds: entryPackData.content.funds,
            travel: entryPackData.content.travel,
            photos: entryPackData.content.photos
          };

          const result = await this.performImport(importData, {
            ...options,
            batchImport: true,
            originalEntryPackId: entryPackData.entryPackId
          });

          importResults.push({
            originalEntryPackId: entryPackData.entryPackId,
            success: true,
            result
          });

          processedCount++;
          progressCallback({
            current: processedCount,
            total: archiveData.entryPacks.length,
            status: 'imported',
            currentEntryPack: entryPackData.entryPackId
          });

        } catch (error: any) {
          logger.error('DataImportService', `Failed to import entry pack ${entryPackData.entryPackId}`, { error });
          importResults.push({
            originalEntryPackId: entryPackData.entryPackId,
            success: false,
            error: error.message
          });
          processedCount++;
        }
      }

      progressCallback({
        current: processedCount,
        total: archiveData.entryPacks.length,
        status: 'completed'
      });

      const successfulImports = importResults.filter(r => r.success);
      const failedImports = importResults.filter(r => !r.success);

      logger.debug('DataImportService', 'Batch import completed', {
        totalEntryInfos: archiveData.entryPacks.length,
        successfulImports: successfulImports.length,
        failedImports: failedImports.length
      });

      return {
        success: true,
        batchImport: true,
        totalEntryInfos: archiveData.entryPacks.length,
        successfulImports: successfulImports.length,
        failedImports: failedImports.length,
        importResults,
        entryInfosImported: successfulImports.length,
        photosRestored: successfulImports.reduce((sum, r) => sum + (r.result?.photosRestored || 0), 0),
        conflicts: [],
        errors: failedImports.map(f => f.error || 'Unknown error'),
        warnings: [],
        importedEntryInfoId: null,
        importedAt: new Date().toISOString(),
        summary: {
          originalExportInfo: archiveData.exportInfo,
          importedAt: new Date().toISOString(),
          failures: archiveData.failures || []
        }
      };

    } catch (error: any) {
      logger.error('DataImportService', 'Failed to import from ZIP', { error });
      throw error;
    }
  }

  /**
   * Validate import data structure and completeness
   * @param {Object} importData - Import data to validate
   * @returns {Promise<Object>} - Validation result
   */
  async validateImportData(importData: ImportData): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Check basic structure
      if (!importData || typeof importData !== 'object') {
        errors.push('Import data must be a valid object');
        return { isValid: false, errors };
      }

      // Check export info
      if (!importData.exportInfo) {
        errors.push('Missing export information');
      } else {
        if (!importData.exportInfo.exportedAt) {
          errors.push('Missing export timestamp');
        }
        if (!importData.exportInfo.exportVersion) {
          errors.push('Missing export version');
        }
      }

      // Check entry info data
      if (!importData.entryInfo) {
        errors.push('Missing entry info data');
      } else {
        if (!importData.entryInfo.id) {
          errors.push('Entry info missing ID');
        }
        if (!importData.entryInfo.destinationId) {
          errors.push('Entry info missing destination ID');
        }
      }

      // Validate passport data if present
      if (importData.passport) {
        if (!importData.passport.passportNumber) {
          errors.push('Passport data missing passport number');
        }
        if (!importData.passport.fullName) {
          errors.push('Passport data missing full name');
        }
      }

      // Validate funds data if present
      if (importData.funds && Array.isArray(importData.funds)) {
        importData.funds.forEach((fund, index) => {
          if (!fund.id) {
            errors.push(`Fund item ${index + 1} missing ID`);
          }
          if (!fund.type) {
            errors.push(`Fund item ${index + 1} missing type`);
          }
        });
      }

      // Check photo data consistency
      if (importData.photos && Array.isArray(importData.photos)) {
        importData.photos.forEach((photo, index) => {
          if (!photo.fundItemId) {
            errors.push(`Photo ${index + 1} missing fund item ID`);
          }
          if (!photo.base64Data && !photo.originalPath) {
            errors.push(`Photo ${index + 1} missing image data`);
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: this.getImportWarnings(importData)
      };

    } catch (error: any) {
      logger.error('DataImportService', 'Error validating import data', { error });
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  }

  /**
   * Get import warnings for data quality issues
   * @param {Object} importData - Import data
   * @returns {Array} - Array of warning messages
   */
  getImportWarnings(importData: ImportData): string[] {
    const warnings: string[] = [];

    // Check export version compatibility
    if (importData.exportInfo && importData.exportInfo.exportVersion !== '1.0') {
      warnings.push(`Import data from different version (${importData.exportInfo.exportVersion}). Some features may not work correctly.`);
    }

    // Check for missing optional data
    if (!importData.personalInfo) {
      warnings.push('Personal information not included in import');
    }

    if (!importData.travel) {
      warnings.push('Travel information not included in import');
    }

    if (!importData.funds || importData.funds.length === 0) {
      warnings.push('No fund information included in import');
    }

    // Check for missing photos
    if (importData.funds && importData.funds.some(f => f.photoUri)) {
      const fundsWithPhotos = importData.funds.filter(f => f.photoUri);
      const availablePhotos = importData.photos ? importData.photos.length : 0;
      
      if (availablePhotos < fundsWithPhotos.length) {
        warnings.push(`Some fund proof photos may be missing (${availablePhotos}/${fundsWithPhotos.length} available)`);
      }
    }

    return warnings;
  }

  /**
   * Check for conflicts with existing data
   * @param {Object} importData - Import data
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Conflict check result
   */
  async checkForConflicts(importData: ImportData, options: ImportOptions = {}): Promise<ConflictResult> {
    try {
      const conflicts: Conflict[] = [];

      // Check if entry info with same ID already exists
      if (importData.entryInfo && importData.entryInfo.id) {
        const existingEntryInfo = await EntryInfo.load(importData.entryInfo.id);
        if (existingEntryInfo) {
          conflicts.push({
            type: 'entry_info_exists',
            entryInfoId: importData.entryInfo.id,
            message: `Entry info with ID ${importData.entryInfo.id} already exists`,
            existingData: existingEntryInfo.exportData(),
            importData: importData.entryInfo,
            resolutionOptions: ['overwrite', 'keep_both', 'skip']
          });
        }
      }

      // Check for passport conflicts
      if (importData.passport && importData.passport.passportNumber) {
        const existingPassport = await (UserDataService as any).getPassportByNumber(importData.passport.passportNumber);
        if (existingPassport && existingPassport.id !== importData.passport.id) {
          conflicts.push({
            type: 'passport_exists',
            passportNumber: importData.passport.passportNumber,
            message: `Passport with number ${importData.passport.passportNumber} already exists`,
            existingData: existingPassport,
            importData: importData.passport,
            resolutionOptions: ['merge', 'overwrite', 'skip']
          });
        }
      }

      // Check for fund item conflicts (by ID)
      if (importData.funds && Array.isArray(importData.funds)) {
        for (const fund of importData.funds) {
          if (fund.id) {
            const existingFund = await (UserDataService as any).getFundById(fund.id);
            if (existingFund) {
              conflicts.push({
                type: 'fund_exists',
                fundId: fund.id,
                message: `Fund item with ID ${fund.id} already exists`,
                existingData: existingFund,
                importData: fund,
                resolutionOptions: ['overwrite', 'keep_both', 'skip']
              });
            }
          }
        }
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        conflictCount: conflicts.length
      };

    } catch (error: any) {
      logger.error('DataImportService', 'Error checking for conflicts', { error });
      return {
        hasConflicts: false,
        conflicts: [],
        conflictCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Perform the actual import operation
   * @param {Object} importData - Validated import data
   * @param {Object} options - Import options including conflict resolutions
   * @returns {Promise<Object>} - Import result
   */
  async performImport(importData: ImportData, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      const importResult: ImportResult = {
        success: false,
        entryInfosImported: 0,
        photosRestored: 0,
        conflicts: [],
        errors: [],
        warnings: [],
        importedEntryInfoId: null,
        importedAt: new Date().toISOString()
      };

      // Generate new IDs if needed to avoid conflicts
      const shouldGenerateNewIds = options.conflictResolutions?.entry_info_exists === 'keep_both' ||
                                   options.batchImport === true;

      let entryInfoId = importData.entryInfo?.id || '';
      if (shouldGenerateNewIds) {
        entryInfoId = this.generateUniqueId();
      }

      // Import passport data
      if (importData.passport) {
        try {
          await UserDataService.savePassport(importData.passport, importData.passport.userId || '');
          logger.debug('DataImportService', 'Imported passport data');
        } catch (error: any) {
          importResult.errors.push(`Failed to import passport: ${error.message}`);
        }
      }

      // Import personal info
      if (importData.personalInfo) {
        try {
          await UserDataService.savePersonalInfo(importData.personalInfo, importData.personalInfo.userId || '');
          logger.debug('DataImportService', 'Imported personal info');
        } catch (error: any) {
          importResult.errors.push(`Failed to import personal info: ${error.message}`);
        }
      }

      // Import travel info
      if (importData.travel) {
        try {
          await UserDataService.saveTravelInfo(importData.travel.userId || '', importData.travel);
          logger.debug('DataImportService', 'Imported travel info');
        } catch (error: any) {
          importResult.errors.push(`Failed to import travel info: ${error.message}`);
        }
      }

      // Import funds and restore photos
      if (importData.funds && Array.isArray(importData.funds)) {
        for (const fund of importData.funds) {
          try {
            // Generate new fund ID if needed
            if (shouldGenerateNewIds) {
              fund.id = this.generateUniqueId();
            }

            // Restore photo if available
            if (fund.photoUri && importData.photos) {
              const photoData = importData.photos.find(p => p.fundItemId === fund.id);
              if (photoData && photoData.base64Data) {
                const restoredPhotoPath = await this.restorePhoto({ ...photoData, base64Data: photoData.base64Data }, fund.id || '');
                fund.photoUri = restoredPhotoPath;
                importResult.photosRestored++;
              }
            }

            await UserDataService.saveFundItem(fund, fund.userId || '');
            logger.debug('DataImportService', `Imported fund item: ${fund.id}`);
          } catch (error: any) {
            importResult.errors.push(`Failed to import fund ${fund.id}: ${error.message}`);
          }
        }
      }

      // Import entry info
      if (importData.entryInfo) {
        try {
          const entryInfoData = { ...importData.entryInfo };
          entryInfoData.id = entryInfoId;
          entryInfoData.importedAt = importResult.importedAt;
          entryInfoData.originalId = importData.entryInfo.id;

          const entryInfo = new EntryInfo(entryInfoData);
          await entryInfo.save();

          importResult.entryInfosImported = 1;
          importResult.importedEntryInfoId = entryInfoId;
          logger.debug('DataImportService', `Imported entry info: ${entryInfoId}`);
        } catch (error: any) {
          importResult.errors.push(`Failed to import entry info: ${error.message}`);
        }
      }

      importResult.success = importResult.errors.length === 0;
      importResult.warnings = this.getImportWarnings(importData);

      return importResult;

    } catch (error: any) {
      logger.error('DataImportService', 'Error performing import', { error });
      throw error;
    }
  }

  /**
   * Restore photo from base64 data
   * @param {Object} photoData - Photo data with base64
   * @param {string} fundId - Fund item ID
   * @returns {Promise<string>} - Restored photo file path
   */
  async restorePhoto(photoData: { base64Data: string; [key: string]: any }, fundId: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fund_${fundId}_${timestamp}.jpg`;
      const photoPath = FileSystem.documentDirectory + 'funds/' + filename;

      // Ensure funds directory exists
      await this.ensureDirectoryExists(FileSystem.documentDirectory + 'funds/');

      // Write base64 data to file
      // Convert base64 string to bytes and write
      const bytes = Uint8Array.from(atob(photoData.base64Data), c => c.charCodeAt(0));
      await FileSystem.writeAsStringAsync(photoPath, Buffer.from(bytes).toString('base64'), {
        encoding: FileSystem.EncodingType.Base64
      });

      logger.debug('DataImportService', 'Restored photo', { filename });
      return photoPath;

    } catch (error: any) {
      logger.error('DataImportService', 'Failed to restore photo', { error });
      throw error;
    }
  }

  /**
   * Generate unique ID for imported items
   * @returns {string} - Unique ID
   */
  generateUniqueId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        logger.debug('DataImportService', 'Created directory', { dirPath });
      }
    } catch (error: any) {
      logger.error('DataImportService', 'Failed to create directory', { dirPath, error });
      throw error;
    }
  }

  /**
   * Get import operation log
   * @returns {Promise<Array>} - Array of import operations
   */
  async getImportLog(): Promise<any[]> {
    try {
      // This would typically be stored in a separate log file or database
      // For now, return empty array as placeholder
      return [];
    } catch (error: any) {
      logger.error('DataImportService', 'Failed to get import log', { error });
      return [];
    }
  }

  /**
   * Clear import log
   * @returns {Promise<boolean>} - Success status
   */
  async clearImportLog(): Promise<boolean> {
    try {
      // Placeholder for clearing import log
      logger.debug('DataImportService', 'Import log cleared');
      return true;
    } catch (error: any) {
      logger.error('DataImportService', 'Failed to clear import log', { error });
      return false;
    }
  }
}

// Export singleton instance
const dataImportService = new DataImportService();

export default dataImportService;

