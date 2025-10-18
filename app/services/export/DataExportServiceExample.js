/**
 * DataExportService Usage Examples
 * Demonstrates how to use the JSON and PDF export functionality
 * 
 * Requirements: 21.1, 21.2, 21.3
 */

import React, { useState } from 'react';
import { Alert, TouchableOpacity, Text, View } from 'react-native';
import DataExportService from './DataExportService';

/**
 * Example: Export entry pack as JSON with all options
 */
export async function exportEntryPackExample(entryPackId) {
  try {
    console.log('Starting entry pack export...');

    // Export with all options enabled
    const result = await DataExportService.exportEntryPack(entryPackId, 'json', {
      includeMetadata: true,
      includeSubmissionHistory: true,
      includePhotos: true,
      returnData: false // Don't return data in memory to save space
    });

    if (result.success) {
      console.log('Export successful:', {
        filename: result.filename,
        fileSize: result.fileSize,
        dataSize: result.dataSize
      });

      // Show sharing options to user
      if (result.sharingOptions.available) {
        Alert.alert(
          'Export Complete',
          `Entry pack exported successfully!\nFile: ${result.filename}\nSize: ${Math.round(result.fileSize / 1024)} KB`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Share', 
              onPress: () => shareExportedFile(result.sharingOptions)
            }
          ]
        );
      } else {
        Alert.alert(
          'Export Complete',
          `Entry pack exported to:\n${result.filename}`,
          [{ text: 'OK' }]
        );
      }

      return result;
    } else {
      throw new Error('Export failed');
    }
  } catch (error) {
    console.error('Export failed:', error);
    Alert.alert(
      'Export Failed',
      `Failed to export entry pack: ${error.message}`,
      [{ text: 'OK' }]
    );
    throw error;
  }
}

/**
 * Example: Export entry pack as PDF with all information
 */
export async function exportEntryPackAsPDF(entryPackId) {
  try {
    console.log('Starting PDF export...');

    // Export as PDF with all sections included
    const result = await DataExportService.exportEntryPack(entryPackId, 'pdf', {
      includeQRCode: true,
      includeFunds: true
    });

    if (result.success) {
      console.log('PDF export successful:', {
        filename: result.filename,
        fileSize: result.fileSize
      });

      // Show sharing options to user
      if (result.sharingOptions.available) {
        Alert.alert(
          'PDF Export Complete',
          `Entry pack exported as PDF!\nFile: ${result.filename}\nSize: ${Math.round(result.fileSize / 1024)} KB`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Share PDF', 
              onPress: () => shareExportedFile(result.sharingOptions)
            }
          ]
        );
      } else {
        Alert.alert(
          'PDF Export Complete',
          `Entry pack exported to:\n${result.filename}`,
          [{ text: 'OK' }]
        );
      }

      return result;
    } else {
      throw new Error('PDF export failed');
    }
  } catch (error) {
    console.error('PDF export failed:', error);
    Alert.alert(
      'PDF Export Failed',
      `Failed to export entry pack as PDF: ${error.message}`,
      [{ text: 'OK' }]
    );
    throw error;
  }
}

/**
 * Example: Export entry pack as PDF for printing (no funds section)
 */
export async function exportEntryPackForPrinting(entryPackId) {
  try {
    const result = await DataExportService.exportEntryPack(entryPackId, 'pdf', {
      includeQRCode: true,
      includeFunds: false // Exclude funds for privacy when printing
    });

    console.log('Print-ready PDF export completed:', result.filename);
    return result;
  } catch (error) {
    console.error('Print PDF export failed:', error);
    throw error;
  }
}

/**
 * Example: Export entry pack with minimal options (faster)
 */
export async function exportEntryPackMinimal(entryPackId) {
  try {
    const result = await DataExportService.exportEntryPack(entryPackId, 'json', {
      includeMetadata: false,
      includeSubmissionHistory: false,
      includePhotos: false
    });

    console.log('Minimal export completed:', result.filename);
    return result;
  } catch (error) {
    console.error('Minimal export failed:', error);
    throw error;
  }
}

/**
 * Example: Export entry pack and return data for processing
 */
export async function exportEntryPackForProcessing(entryPackId) {
  try {
    const result = await DataExportService.exportEntryPack(entryPackId, 'json', {
      includeMetadata: true,
      includeSubmissionHistory: true,
      includePhotos: false, // Skip photos for faster processing
      returnData: true // Return data in memory for processing
    });

    if (result.success && result.exportData) {
      // Process the exported data
      const processedData = processExportedData(result.exportData);
      console.log('Data processed:', processedData);
      
      return {
        ...result,
        processedData
      };
    }

    return result;
  } catch (error) {
    console.error('Export for processing failed:', error);
    throw error;
  }
}

/**
 * Example: Share exported file
 */
async function shareExportedFile(sharingOptions) {
  try {
    if (!sharingOptions.available) {
      Alert.alert('Sharing Not Available', 'Sharing is not supported on this device');
      return;
    }

    const shareResult = await sharingOptions.share({
      title: 'Entry Pack Export',
      message: 'Here is my travel entry pack data'
    });

    console.log('Share result:', shareResult);
    return shareResult;
  } catch (error) {
    console.error('Sharing failed:', error);
    Alert.alert('Sharing Failed', `Failed to share file: ${error.message}`);
  }
}

/**
 * Example: Process exported data
 */
function processExportedData(exportData) {
  const summary = {
    exportedAt: exportData.exportInfo.exportedAt,
    entryPackId: exportData.entryPack.id,
    destination: exportData.entryPack.destinationId,
    status: exportData.entryPack.status,
    hasPassport: !!exportData.passport,
    hasPersonalInfo: !!exportData.personalInfo,
    fundItemCount: (exportData.funds || []).length,
    hasTravelInfo: !!exportData.travel,
    submissionAttempts: exportData.metadata?.totalSubmissionAttempts || 0,
    completionPercent: exportData.metadata?.exportStats?.completionPercent || 0
  };

  return summary;
}

/**
 * Example: Export multiple entry packs (when batch export is implemented)
 */
export async function exportMultipleEntryPacksExample(entryPackIds) {
  try {
    // This will be implemented in task 8.5
    console.log('Batch export will be available in task 8.5');
    
    // For now, export individually
    const results = [];
    for (const entryPackId of entryPackIds) {
      const result = await exportEntryPackMinimal(entryPackId);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Batch export failed:', error);
    throw error;
  }
}

/**
 * Example: Clean up old export files
 */
export async function cleanupOldExportsExample() {
  try {
    console.log('Cleaning up old export files...');
    
    const result = await DataExportService.cleanupOldExports(24); // 24 hours
    
    console.log('Cleanup completed:', result);
    
    if (result.deletedCount > 0) {
      Alert.alert(
        'Cleanup Complete',
        `Deleted ${result.deletedCount} old export files`,
        [{ text: 'OK' }]
      );
    }
    
    return result;
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}

/**
 * Example: List all export files
 */
export async function listExportFilesExample() {
  try {
    const files = await DataExportService.listExportFiles();
    
    console.log('Export files:', files);
    
    const fileList = files.map(file => ({
      name: file.filename,
      size: `${Math.round(file.size / 1024)} KB`,
      created: new Date(file.createdAt).toLocaleDateString()
    }));
    
    return fileList;
  } catch (error) {
    console.error('Failed to list export files:', error);
    throw error;
  }
}

/**
 * Example: Get export directory info
 */
export async function getExportDirectoryInfoExample() {
  try {
    const info = await DataExportService.getExportDirectoryInfo();
    
    console.log('Export directory info:', info);
    
    return {
      fileCount: info.fileCount,
      totalSize: `${Math.round(info.totalSize / 1024)} KB`,
      directory: info.directory
    };
  } catch (error) {
    console.error('Failed to get directory info:', error);
    throw error;
  }
}

/**
 * Example: Integration with React Native component - Export buttons
 */
export const ExportButtons = ({ entryPackId, onExportComplete }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);

  const handleExport = async (format) => {
    if (isExporting) return;

    setIsExporting(true);
    setExportFormat(format);
    
    try {
      let result;
      if (format === 'pdf') {
        result = await exportEntryPackAsPDF(entryPackId);
      } else {
        result = await exportEntryPackExample(entryPackId);
      }
      onExportComplete?.(result);
    } catch (error) {
      console.error('Export button error:', error);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <View style={styles.exportButtonContainer}>
      <TouchableOpacity 
        onPress={() => handleExport('json')}
        disabled={isExporting}
        style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
      >
        <Text style={styles.exportButtonText}>
          {isExporting && exportFormat === 'json' ? 'Exporting JSON...' : 'Export as JSON'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => handleExport('pdf')}
        disabled={isExporting}
        style={[styles.exportButton, styles.pdfButton, isExporting && styles.exportButtonDisabled]}
      >
        <Text style={styles.exportButtonText}>
          {isExporting && exportFormat === 'pdf' ? 'Generating PDF...' : 'Export as PDF'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  exportButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center'
  },
  exportButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1
  },
  pdfButton: {
    backgroundColor: '#FF6B35' // Different color for PDF export
  },
  exportButtonDisabled: {
    backgroundColor: '#CCCCCC'
  },
  exportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  }
};