/**
 * DataExportService Tests
 * Tests for JSON export functionality
 */

import DataExportService from '../DataExportService';
import EntryPack from '../../../models/EntryPack';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';

// Mock dependencies
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  moveAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64'
  }
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue({ action: 'shared' })
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({
    uri: '/mock/temp/generated.pdf'
  })
}));

jest.mock('../../../models/EntryPack');
jest.mock('../../data/PassportDataService', () => ({
  default: {
    getEntryInfo: jest.fn(),
    getPassport: jest.fn(),
    getPersonalInfo: jest.fn(),
    getFunds: jest.fn(),
    getTravelInfo: jest.fn()
  }
}));

describe('DataExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock FileSystem methods
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
    FileSystem.makeDirectoryAsync.mockResolvedValue();
    FileSystem.writeAsStringAsync.mockResolvedValue();
    FileSystem.readAsStringAsync.mockResolvedValue('base64data');
    FileSystem.moveAsync.mockResolvedValue();
    
    // Mock Print methods
    Print.printToFileAsync.mockResolvedValue({
      uri: '/mock/temp/generated.pdf'
    });
  });

  describe('exportAsJSON', () => {
    it('should export entry pack data as JSON', async () => {
      // Mock entry pack data
      const mockEntryPack = {
        id: 'pack_123',
        userId: 'user_123',
        destinationId: 'thailand',
        status: 'submitted',
        exportData: jest.fn().mockReturnValue({
          id: 'pack_123',
          status: 'submitted',
          createdAt: '2024-01-01T00:00:00.000Z'
        }),
        getSubmissionAttemptCount: jest.fn().mockReturnValue(1),
        getFailedSubmissionCount: jest.fn().mockReturnValue(0),
        hasValidTDACSubmission: jest.fn().mockReturnValue(true),
        displayStatus: { completionPercent: 100 }
      };

      const mockCompleteData = {
        entryPack: mockEntryPack,
        entryInfo: null,
        passport: { passportNumber: 'E12345678' },
        personalInfo: { email: 'test@example.com' },
        funds: [{ id: 'fund_1', amount: 1000, photoUri: null }],
        travel: { arrivalDate: '2024-12-01' }
      };

      // Test JSON export
      const result = await DataExportService.exportAsJSON(mockCompleteData);

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
      expect(result.filename).toContain('entry-pack-thailand');
      expect(result.filename).toContain('.json');
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should include metadata when requested', async () => {
      const mockEntryPack = {
        id: 'pack_123',
        exportData: jest.fn().mockReturnValue({ id: 'pack_123' }),
        getSubmissionAttemptCount: jest.fn().mockReturnValue(2),
        getFailedSubmissionCount: jest.fn().mockReturnValue(1),
        hasValidTDACSubmission: jest.fn().mockReturnValue(true),
        displayStatus: { completionPercent: 75 }
      };

      const mockCompleteData = {
        entryPack: mockEntryPack,
        entryInfo: null,
        passport: null,
        personalInfo: null,
        funds: [],
        travel: null
      };

      const result = await DataExportService.exportAsJSON(mockCompleteData, {
        includeMetadata: true,
        returnData: true
      });

      expect(result.success).toBe(true);
      expect(result.exportData.metadata).toBeDefined();
      expect(result.exportData.metadata.totalSubmissionAttempts).toBe(2);
      expect(result.exportData.metadata.failedSubmissionAttempts).toBe(1);
    });

    it('should handle photo export when funds have photos', async () => {
      const mockEntryPack = {
        id: 'pack_123',
        exportData: jest.fn().mockReturnValue({ id: 'pack_123' }),
        getSubmissionAttemptCount: jest.fn().mockReturnValue(1),
        getFailedSubmissionCount: jest.fn().mockReturnValue(0),
        hasValidTDACSubmission: jest.fn().mockReturnValue(true),
        displayStatus: { completionPercent: 100 }
      };

      const mockCompleteData = {
        entryPack: mockEntryPack,
        entryInfo: null,
        passport: null,
        personalInfo: null,
        funds: [
          { 
            id: 'fund_1', 
            amount: 1000, 
            photoUri: 'file:///path/to/photo.jpg' 
          }
        ],
        travel: null
      };

      // Mock successful file read
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: true, size: 1024 });
      FileSystem.readAsStringAsync.mockResolvedValueOnce('base64photodata');

      const result = await DataExportService.exportAsJSON(mockCompleteData, {
        includePhotos: true,
        returnData: true
      });

      expect(result.success).toBe(true);
      expect(result.exportData.photos).toBeDefined();
      expect(result.exportData.photos).toHaveLength(1);
      expect(result.exportData.photos[0].base64Data).toBe('base64photodata');
    });

    it('should handle missing photo files gracefully', async () => {
      const mockEntryPack = {
        id: 'pack_123',
        exportData: jest.fn().mockReturnValue({ id: 'pack_123' }),
        getSubmissionAttemptCount: jest.fn().mockReturnValue(1),
        getFailedSubmissionCount: jest.fn().mockReturnValue(0),
        hasValidTDACSubmission: jest.fn().mockReturnValue(true),
        displayStatus: { completionPercent: 100 }
      };

      const mockCompleteData = {
        entryPack: mockEntryPack,
        entryInfo: null,
        passport: null,
        personalInfo: null,
        funds: [
          { 
            id: 'fund_1', 
            amount: 1000, 
            photoUri: 'file:///path/to/missing.jpg' 
          }
        ],
        travel: null
      };

      // Mock missing file
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: false });

      const result = await DataExportService.exportAsJSON(mockCompleteData, {
        includePhotos: true,
        returnData: true
      });

      expect(result.success).toBe(true);
      expect(result.exportData.photos).toBeDefined();
      expect(result.exportData.photos).toHaveLength(1);
      expect(result.exportData.photos[0].error).toBe('File not found');
    });
  });

  describe('exportAsPDF', () => {
    it('should export entry pack data as PDF', async () => {
      // Mock entry pack data with TDAC submission
      const mockEntryPack = {
        id: 'pack_123',
        userId: 'user_123',
        destinationId: 'thailand',
        status: 'submitted',
        getLatestSuccessfulSubmission: jest.fn().mockReturnValue({
          arrCardNo: 'TH123456789',
          submittedAt: '2024-01-01T00:00:00.000Z',
          submissionMethod: 'API',
          qrUri: 'data:image/png;base64,mockqrcode'
        })
      };

      const mockCompleteData = {
        entryPack: mockEntryPack,
        passport: { 
          fullName: 'John Doe',
          passportNumber: 'E12345678',
          nationality: 'USA',
          dateOfBirth: '1990-01-01',
          expiryDate: '2030-01-01',
          gender: 'Male'
        },
        personalInfo: { 
          occupation: 'Engineer',
          email: 'john@example.com',
          phoneNumber: '+1234567890'
        },
        funds: [
          { 
            id: 'fund_1', 
            type: 'Bank Statement',
            amount: 5000, 
            currency: 'USD',
            description: 'Savings account'
          }
        ],
        travel: { 
          travelPurpose: 'Tourism',
          arrivalDate: '2024-12-01',
          departureDate: '2024-12-15',
          flightNumber: 'TG123',
          accommodation: 'Hotel Bangkok'
        }
      };

      // Test PDF export
      const result = await DataExportService.exportAsPDF(mockCompleteData);

      expect(result.success).toBe(true);
      expect(result.format).toBe('pdf');
      expect(result.filename).toContain('entry-pack-thailand');
      expect(result.filename).toContain('.pdf');
      expect(Print.printToFileAsync).toHaveBeenCalled();
      expect(FileSystem.moveAsync).toHaveBeenCalled();
    });

    it('should generate PDF with QR code section when TDAC submission exists', async () => {
      const mockEntryPack = {
        id: 'pack_123',
        destinationId: 'thailand',
        getLatestSuccessfulSubmission: jest.fn().mockReturnValue({
          arrCardNo: 'TH123456789',
          submittedAt: '2024-01-01T00:00:00.000Z',
          submissionMethod: 'API',
          qrUri: 'data:image/png;base64,mockqrcode'
        })
      };

      const mockCompleteData = {
        entryPack: mockEntryPack,
        passport: null,
        personalInfo: null,
        funds: [],
        travel: null
      };

      const result = await DataExportService.exportAsPDF(mockCompleteData);

      expect(result.success).toBe(true);
      expect(Print.printToFileAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('TH123456789'),
          width: 612,
          height: 792
        })
      );
    });

    it('should generate PDF without QR code section when no TDAC submission', async () => {
      const mockEntryPack = {
        id: 'pack_123',
        destinationId: 'thailand',
        getLatestSuccessfulSubmission: jest.fn().mockReturnValue(null)
      };

      const mockCompleteData = {
        entryPack: mockEntryPack,
        passport: { fullName: 'John Doe' },
        personalInfo: null,
        funds: [],
        travel: null
      };

      const result = await DataExportService.exportAsPDF(mockCompleteData);

      expect(result.success).toBe(true);
      expect(Print.printToFileAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.not.stringContaining('Thailand Entry Card (TDAC)')
        })
      );
    });

    it('should exclude funds section when includeFunds is false', async () => {
      const mockEntryPack = {
        id: 'pack_123',
        destinationId: 'thailand',
        getLatestSuccessfulSubmission: jest.fn().mockReturnValue(null)
      };

      const mockCompleteData = {
        entryPack: mockEntryPack,
        passport: null,
        personalInfo: null,
        funds: [{ id: 'fund_1', amount: 1000, currency: 'USD' }],
        travel: null
      };

      const result = await DataExportService.exportAsPDF(mockCompleteData, {
        includeFunds: false
      });

      expect(result.success).toBe(true);
      expect(Print.printToFileAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.not.stringContaining('Fund Information')
        })
      );
    });

    it('should handle PDF generation errors', async () => {
      const mockEntryPack = {
        id: 'pack_123',
        destinationId: 'thailand',
        getLatestSuccessfulSubmission: jest.fn().mockReturnValue(null)
      };

      const mockCompleteData = {
        entryPack: mockEntryPack,
        passport: null,
        personalInfo: null,
        funds: [],
        travel: null
      };

      // Mock Print.printToFileAsync to throw error
      Print.printToFileAsync.mockRejectedValueOnce(new Error('PDF generation failed'));

      await expect(
        DataExportService.exportAsPDF(mockCompleteData)
      ).rejects.toThrow('PDF generation failed');
    });
  });

  describe('calculateTotalFunds', () => {
    it('should calculate total funds across multiple currencies', () => {
      const funds = [
        { amount: 1000, currency: 'USD' },
        { amount: 2000, currency: 'USD' },
        { amount: 50000, currency: 'THB' }
      ];

      const result = DataExportService.calculateTotalFunds(funds);
      expect(result).toBe('USD 3,000 + THB 50,000');
    });

    it('should handle empty funds array', () => {
      const result = DataExportService.calculateTotalFunds([]);
      expect(result).toBe('No funds specified');
    });

    it('should handle funds without amount or currency', () => {
      const funds = [
        { amount: null, currency: 'USD' },
        { amount: 1000, currency: null },
        { amount: 2000, currency: 'USD' }
      ];

      const result = DataExportService.calculateTotalFunds(funds);
      expect(result).toBe('USD 2,000');
    });

    it('should handle null funds', () => {
      const result = DataExportService.calculateTotalFunds(null);
      expect(result).toBe('No funds specified');
    });
  });

  describe('exportEntryPack', () => {
    it('should export entry pack by ID', async () => {
      // Mock EntryPack.load
      const mockEntryPack = {
        id: 'pack_123',
        entryInfoId: 'entry_123',
        userId: 'user_123',
        destinationId: 'thailand',
        exportData: jest.fn().mockReturnValue({ id: 'pack_123' }),
        getSubmissionAttemptCount: jest.fn().mockReturnValue(1),
        getFailedSubmissionCount: jest.fn().mockReturnValue(0),
        hasValidTDACSubmission: jest.fn().mockReturnValue(true),
        displayStatus: { completionPercent: 100 }
      };

      EntryPack.load.mockResolvedValue(mockEntryPack);

      // Mock loadCompleteEntryPackData method
      const originalLoadCompleteEntryPackData = DataExportService.loadCompleteEntryPackData;
      DataExportService.loadCompleteEntryPackData = jest.fn().mockResolvedValue({
        entryPack: mockEntryPack,
        entryInfo: null,
        passport: null,
        personalInfo: null,
        funds: [],
        travel: null
      });

      const result = await DataExportService.exportEntryPack('pack_123', 'json');

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
      expect(EntryPack.load).toHaveBeenCalledWith('pack_123');
    });

    it('should export entry pack as PDF', async () => {
      const mockEntryPack = {
        id: 'pack_123',
        entryInfoId: 'entry_123',
        userId: 'user_123',
        destinationId: 'thailand',
        getLatestSuccessfulSubmission: jest.fn().mockReturnValue({
          arrCardNo: 'TH123456789'
        })
      };

      EntryPack.load.mockResolvedValue(mockEntryPack);

      // Mock loadCompleteEntryPackData method
      DataExportService.loadCompleteEntryPackData = jest.fn().mockResolvedValue({
        entryPack: mockEntryPack,
        entryInfo: null,
        passport: null,
        personalInfo: null,
        funds: [],
        travel: null
      });

      const result = await DataExportService.exportEntryPack('pack_123', 'pdf');

      expect(result.success).toBe(true);
      expect(result.format).toBe('pdf');
      expect(result.filename).toContain('.pdf');
      expect(Print.printToFileAsync).toHaveBeenCalled();
    });

    it('should throw error for non-existent entry pack', async () => {
      EntryPack.load.mockResolvedValue(null);

      await expect(
        DataExportService.exportEntryPack('nonexistent', 'json')
      ).rejects.toThrow('Entry pack not found: nonexistent');
    });

    it('should throw error for unsupported format', async () => {
      const mockEntryPack = { id: 'pack_123' };
      EntryPack.load.mockResolvedValue(mockEntryPack);

      await expect(
        DataExportService.exportEntryPack('pack_123', 'unsupported')
      ).rejects.toThrow('Unsupported export format: unsupported');
    });
  });

  describe('utility methods', () => {
    it('should get correct destination name', () => {
      expect(DataExportService.getDestinationName('thailand')).toBe('thailand');
      expect(DataExportService.getDestinationName('japan')).toBe('japan');
      expect(DataExportService.getDestinationName('unknown')).toBe('unknown');
      expect(DataExportService.getDestinationName(null)).toBe('unknown');
    });

    it('should ensure directory exists', async () => {
      // Mock directory doesn't exist
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: false });
      
      await DataExportService.ensureDirectoryExists('/test/path/');
      
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        '/test/path/',
        { intermediates: true }
      );
    });

    it('should not create directory if it already exists', async () => {
      // Mock directory exists
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: true });
      
      await DataExportService.ensureDirectoryExists('/test/path/');
      
      expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });
  });

  describe('file management', () => {
    it('should list export files', async () => {
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: true });
      FileSystem.readDirectoryAsync.mockResolvedValue(['file1.json', 'file2.json']);
      FileSystem.getInfoAsync.mockResolvedValue({ 
        exists: true, 
        size: 1024, 
        modificationTime: Date.now() 
      });

      const files = await DataExportService.listExportFiles();

      expect(files).toHaveLength(2);
      expect(files[0].filename).toBe('file1.json');
      expect(files[0].size).toBe(1024);
    });

    it('should cleanup old export files', async () => {
      const oldTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: true });
      FileSystem.readDirectoryAsync.mockResolvedValue(['old-file.json']);
      FileSystem.getInfoAsync.mockResolvedValueOnce({ 
        exists: true, 
        modificationTime: oldTime 
      });
      FileSystem.deleteAsync.mockResolvedValue();

      const result = await DataExportService.cleanupOldExports(24);

      expect(result.deletedCount).toBe(1);
      expect(FileSystem.deleteAsync).toHaveBeenCalled();
    });
  });
});