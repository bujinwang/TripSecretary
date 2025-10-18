/**
 * DataImportService - Service for importing entry pack data
 * Supports JSON import, conflict resolution, and batch import
 * 
 * Requirements: 22.1-22.5
 */

import * as FileSystem from 'expo-file-system';
import EntryPack from '../../models/EntryPack';
import EntryInfo from '../../models/EntryInfo';
import PassportDataService from '../data/PassportDataService';

class DataImportService {
  constructor() {
    this.importDirectory = FileSystem.documentDirectory + 'imports/';
    this.tempDirectory = FileSystem.documentDirectory + 'temp/import/';
  }

  /**
   * Import entry pack from file
   * @param {string} filePath - Path to import file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import result
   */
  async importEntryPack(filePath, options = {}) {
    try {
      console.log('Starting entry pack import:', {
        filePath,
        options
      });

      // Ensure import directory exists
      await this.ensureDirectoryExists(this.importDirectory);

      // Validate file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`Import file not found: ${filePath}`);
      }

      // Determine import type based on file extension
      const fileName = filePath.split('/').pop();
      const fileExtension = fileName.split('.').pop().toLowerCase();

      switch (fileExtension) {
        case 'json':
          return await this.importFromJSON(filePath, options);
        case 'zip':
          return await this.importFromZIP(filePath, options);
        default:
          throw new Error(`Unsupported import file type: ${fileExtension}`);
      }
    } catch (error) {
      console.error('Failed to import entry pack:', error);
      throw error;
    }
  }

  /**
   * Import entry pack from JSON file
   * @param {string} filePath - Path to JSON file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import result
   */
  async importFromJSON(filePath, options = {}) {
    try {
      console.log('Importing from JSON:', filePath);

      // Read and parse JSON file
      const jsonContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8
      });

      let importData;
      try {
        importData = JSON.parse(jsonContent);
      } catch (parseError) {
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
          importData,
          resolveConflicts: async (resolutions) => {
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

      console.log('JSON import completed:', {
        success: importResult.success,
        entryPacksImported: importResult.entryPacksImported,
        photosRestored: importResult.photosRestored
      });

      return importResult;

    } catch (error) {
      console.error('Failed to import from JSON:', error);
      throw error;
    }
  }

  /**
   * Import entry pack from ZIP file (batch import)
   * @param {string} filePath - Path to ZIP file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import result
   */
  async importFromZIP(filePath, options = {}) {
    try {
      console.log('Importing from ZIP:', filePath);

      // For now, treat ZIP as JSON archive (since we create JSON archives in batch export)
      // In a real implementation, you would extract the ZIP file first
      
      // Read the "ZIP" file as JSON (our batch export format)
      const archiveContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8
      });

      let archiveData;
      try {
        archiveData = JSON.parse(archiveContent);
      } catch (parseError) {
        throw new Error(`Invalid archive format: ${parseError.message}`);
      }

      // Validate archive structure
      if (!archiveData.entryPacks || !Array.isArray(archiveData.entryPacks)) {
        throw new Error('Invalid batch export archive: missing entryPacks array');
      }

      const importResults = [];
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
          const importData = {
            exportInfo: archiveData.exportInfo,
            entryPack: entryPackData.content.entryPack,
            entryInfo: entryPackData.content.entryInfo,
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

        } catch (error) {
          console.error(`Failed to import entry pack ${entryPackData.entryPackId}:`, error);
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

      console.log('Batch import completed:', {
        totalEntryPacks: archiveData.entryPacks.length,
        successfulImports: successfulImports.length,
        failedImports: failedImports.length
      });

      return {
        success: true,
        batchImport: true,
        totalEntryPacks: archiveData.entryPacks.length,
        successfulImports: successfulImports.length,
        failedImports: failedImports.length,
        importResults,
        summary: {
          originalExportInfo: archiveData.exportInfo,
          importedAt: new Date().toISOString(),
          failures: archiveData.failures || []
        }
      };

    } catch (error) {
      console.error('Failed to import from ZIP:', error);
      throw error;
    }
  }

  /**
   * Validate import data structure and completeness
   * @param {Object} importData - Import data to validate
   * @returns {Promise<Object>} - Validation result
   */
  async validateImportData(importData) {
    const errors = [];

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

      // Check entry pack data
      if (!importData.entryPack) {
        errors.push('Missing entry pack data');
      } else {
        if (!importData.entryPack.id) {
          errors.push('Entry pack missing ID');
        }
        if (!importData.entryPack.destinationId) {
          errors.push('Entry pack missing destination ID');
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

    } catch (error) {
      console.error('Error validating import data:', error);
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
  getImportWarnings(importData) {
    const warnings = [];

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
  async checkForConflicts(importData, options = {}) {
    try {
      const conflicts = [];

      // Check if entry pack with same ID already exists
      if (importData.entryPack && importData.entryPack.id) {
        const existingEntryPack = await EntryPack.load(importData.entryPack.id);
        if (existingEntryPack) {
          conflicts.push({
            type: 'entry_pack_exists',
            entryPackId: importData.entryPack.id,
            message: `Entry pack with ID ${importData.entryPack.id} already exists`,
            existingData: existingEntryPack.exportData(),
            importData: importData.entryPack,
            resolutionOptions: ['overwrite', 'keep_both', 'skip']
          });
        }
      }

      // Check for passport conflicts
      if (importData.passport && importData.passport.passportNumber) {
        const existingPassport = await PassportDataService.getPassportByNumber(importData.passport.passportNumber);
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
            const existingFund = await PassportDataService.getFundById(fund.id);
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

    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return {
        hasConflicts: false,
        conflicts: [],
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
  async performImport(importData, options = {}) {
    try {
      const importResult = {
        success: false,
        entryPacksImported: 0,
        photosRestored: 0,
        conflicts: [],
        errors: [],
        warnings: [],
        importedEntryPackId: null,
        importedAt: new Date().toISOString()
      };

      // Generate new IDs if needed to avoid conflicts
      const shouldGenerateNewIds = options.conflictResolutions?.entry_pack_exists === 'keep_both' ||
                                   options.batchImport;

      let entryPackId = importData.entryPack.id;
      if (shouldGenerateNewIds) {
        entryPackId = this.generateUniqueId();
      }

      // Import passport data
      if (importData.passport) {
        try {
          await PassportDataService.savePassport(importData.passport);
          console.log('Imported passport data');
        } catch (error) {
          importResult.errors.push(`Failed to import passport: ${error.message}`);
        }
      }

      // Import personal info
      if (importData.personalInfo) {
        try {
          await PassportDataService.savePersonalInfo(importData.personalInfo);
          console.log('Imported personal info');
        } catch (error) {
          importResult.errors.push(`Failed to import personal info: ${error.message}`);
        }
      }

      // Import travel info
      if (importData.travel) {
        try {
          await PassportDataService.saveTravelInfo(importData.travel);
          console.log('Imported travel info');
        } catch (error) {
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
                const restoredPhotoPath = await this.restorePhoto(photoData, fund.id);
                fund.photoUri = restoredPhotoPath;
                importResult.photosRestored++;
              }
            }

            await PassportDataService.saveFund(fund);
            console.log(`Imported fund item: ${fund.id}`);
          } catch (error) {
            importResult.errors.push(`Failed to import fund ${fund.id}: ${error.message}`);
          }
        }
      }

      // Import entry pack
      if (importData.entryPack) {
        try {
          const entryPackData = { ...importData.entryPack };
          entryPackData.id = entryPackId;
          entryPackData.importedAt = importResult.importedAt;
          entryPackData.originalId = importData.entryPack.id;

          const entryPack = new EntryPack(entryPackData);
          await entryPack.save();
          
          importResult.entryPacksImported = 1;
          importResult.importedEntryPackId = entryPackId;
          console.log(`Imported entry pack: ${entryPackId}`);
        } catch (error) {
          importResult.errors.push(`Failed to import entry pack: ${error.message}`);
        }
      }

      // Import entry info if available
      if (importData.entryInfo) {
        try {
          const entryInfoData = { ...importData.entryInfo };
          if (shouldGenerateNewIds) {
            entryInfoData.id = this.generateUniqueId();
          }

          const entryInfo = new EntryInfo(entryInfoData);
          await entryInfo.save();
          console.log(`Imported entry info: ${entryInfoData.id}`);
        } catch (error) {
          importResult.errors.push(`Failed to import entry info: ${error.message}`);
        }
      }

      importResult.success = importResult.errors.length === 0;
      importResult.warnings = this.getImportWarnings(importData);

      return importResult;

    } catch (error) {
      console.error('Error performing import:', error);
      throw error;
    }
  }

  /**
   * Restore photo from base64 data
   * @param {Object} photoData - Photo data with base64
   * @param {string} fundId - Fund item ID
   * @returns {Promise<string>} - Restored photo file path
   */
  async restorePhoto(photoData, fundId) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fund_${fundId}_${timestamp}.jpg`;
      const photoPath = FileSystem.documentDirectory + 'funds/' + filename;

      // Ensure funds directory exists
      await this.ensureDirectoryExists(FileSystem.documentDirectory + 'funds/');

      // Write base64 data to file
      await FileSystem.writeAsStringAsync(photoPath, photoData.base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });

      console.log('Restored photo:', filename);
      return photoPath;

    } catch (error) {
      console.error('Failed to restore photo:', error);
      throw error;
    }
  }

  /**
   * Generate unique ID for imported items
   * @returns {string} - Unique ID
   */
  generateUniqueId() {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath) {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        console.log('Created directory:', dirPath);
      }
    } catch (error) {
      console.error('Failed to create directory:', dirPath, error);
      throw error;
    }
  }

  /**
   * Get import operation log
   * @returns {Promise<Array>} - Array of import operations
   */
  async getImportLog() {
    try {
      // This would typically be stored in a separate log file or database
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Failed to get import log:', error);
      return [];
    }
  }

  /**
   * Clear import log
   * @returns {Promise<boolean>} - Success status
   */
  async clearImportLog() {
    try {
      // Placeholder for clearing import log
      console.log('Import log cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear import log:', error);
      return false;
    }
  }
}

// Export singleton instance
const dataImportService = new DataImportService();

export default dataImportService;