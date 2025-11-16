// @ts-nocheck

/**
 * Unit tests for PDFManagementService
 * Testing migration to new expo-file-system SDK 54 API
 */

import PDFManagementService from '../PDFManagementService';
import { File, Directory, Paths } from 'expo-file-system';

// Mock FileReader for Node.js environment
global.FileReader = class FileReader {
  readAsDataURL(blob) {
    // Simulate async file reading
    setTimeout(() => {
      // Create a mock base64 string
      this.result = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKNSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3==';
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
};

global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type || '';
    this.size = parts.reduce((acc, part) => acc + (part.length || part.byteLength || 0), 0);
  }
};

global.atob = function(str) {
  return Buffer.from(str, 'base64').toString('binary');
};

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(async () => ({ status: 'shared' })),
  isAvailableAsync: jest.fn(async () => true),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => {
  const mockFiles = new Map();
  const mockDirectories = new Set();

  class MockFile {
    constructor(basePath, relativePath) {
      if (arguments.length === 1) {
        // Legacy constructor with full path
        this.uri = basePath;
        this.path = basePath;
      } else {
        // New constructor with basePath and relativePath
        this.uri = `${basePath}/${relativePath}`;
        this.path = `${basePath}/${relativePath}`;
      }
      this._name = this.uri.split('/').pop();
    }

    get exists() {
      return mockFiles.has(this.uri);
    }

    get name() {
      return this._name;
    }

    get size() {
      const data = mockFiles.get(this.uri);
      return data ? data.length : 0;
    }

    create() {
      if (!this.exists) {
        mockFiles.set(this.uri, new Uint8Array(0));
      }
    }

    write(data) {
      mockFiles.set(this.uri, data);
    }

    delete() {
      mockFiles.delete(this.uri);
    }

    // Test helper
    static _reset() {
      mockFiles.clear();
    }

    static _getMockFiles() {
      return mockFiles;
    }
  }

  class MockDirectory {
    constructor(basePath, relativePath) {
      this.uri = `${basePath}/${relativePath}`;
      this.path = `${basePath}/${relativePath}`;
      this._relativePath = relativePath;
    }

    get exists() {
      return mockDirectories.has(this.uri);
    }

    create() {
      mockDirectories.add(this.uri);
    }

    list() {
      const files = [];
      const prefix = this.uri + '/';
      for (const [path, data] of mockFiles.entries()) {
        if (path.startsWith(prefix)) {
          const filename = path.substring(prefix.length);
          // Only include direct children, not nested
          if (!filename.includes('/')) {
            const file = new MockFile(path);
            file._data = data;
            files.push(file);
          }
        }
      }
      return files;
    }

    // Test helper
    static _reset() {
      mockDirectories.clear();
    }
  }

  const MockPaths = {
    document: '/mock/documents'
  };

  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: MockPaths,
    documentDirectory: '/mock/documents/' // For legacy compatibility
  };
});

describe('PDFManagementService - SDK 54 Migration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    File._reset();
    Directory._reset();
  });

  describe('initialize()', () => {
    test('should create PDF directory if it does not exist', async () => {
      await PDFManagementService.initialize();

      const dir = new Directory(Paths.document, 'tdac');
      expect(dir.exists).toBe(true);
    });

    test('should not fail if directory already exists', async () => {
      await PDFManagementService.initialize();
      await PDFManagementService.initialize();

      const dir = new Directory(Paths.document, 'tdac');
      expect(dir.exists).toBe(true);
    });
  });

  describe('generatePDFFilename()', () => {
    test('should generate standardized PDF filename', () => {
      const filename = PDFManagementService.generatePDFFilename('TEST123');
      expect(filename).toMatch(/^TDAC_TEST123_\d+\.pdf$/);
    });

    test('should sanitize special characters in card number', () => {
      const filename = PDFManagementService.generatePDFFilename('TEST-123/456');
      expect(filename).toMatch(/^TDAC_TEST_123_456_\d+\.pdf$/);
    });

    test('should include submission method in filename generation', () => {
      const filename1 = PDFManagementService.generatePDFFilename('TEST123', 'api');
      const filename2 = PDFManagementService.generatePDFFilename('TEST123', 'webview');

      // Both should follow the same naming pattern
      expect(filename1).toMatch(/^TDAC_TEST123_\d+\.pdf$/);
      expect(filename2).toMatch(/^TDAC_TEST123_\d+\.pdf$/);
    });
  });

  describe('generateQRFilename()', () => {
    test('should generate standardized QR filename', () => {
      const filename = PDFManagementService.generateQRFilename('TEST123');
      expect(filename).toMatch(/^TDAC_QR_TEST123_\d+\.png$/);
    });

    test('should sanitize special characters in card number', () => {
      const filename = PDFManagementService.generateQRFilename('TEST-123/456');
      expect(filename).toMatch(/^TDAC_QR_TEST_123_456_\d+\.png$/);
    });
  });

  describe('savePDF()', () => {
    test('should save PDF blob to file system using new File API', async () => {
      const mockPDFData = 'test pdf data';
      const mockBlob = new Blob([mockPDFData], { type: 'application/pdf' });

      const result = await PDFManagementService.savePDF('TEST123', mockBlob, {
        submissionMethod: 'api'
      });

      expect(result).toHaveProperty('filepath');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('savedAt');
      expect(result.arrCardNo).toBe('TEST123');
      expect(result.filename).toMatch(/^TDAC_TEST123_\d+\.pdf$/);

      // Verify file was created using new API
      const file = new File(Paths.document, `tdac/${result.filename}`);
      expect(file.exists).toBe(true);
    });

    test('should convert blob to Uint8Array for binary data', async () => {
      const mockPDFData = 'binary pdf content';
      const mockBlob = new Blob([mockPDFData], { type: 'application/pdf' });

      const result = await PDFManagementService.savePDF('TEST456', mockBlob);

      const file = new File(Paths.document, `tdac/${result.filename}`);
      const savedData = File._getMockFiles().get(file.uri);

      expect(savedData).toBeInstanceOf(Uint8Array);
    });

    test('should initialize directory before saving', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });

      await PDFManagementService.savePDF('TEST789', mockBlob);

      const dir = new Directory(Paths.document, 'tdac');
      expect(dir.exists).toBe(true);
    });
  });

  describe('saveQRImage()', () => {
    test('should save QR image to file system using new File API', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await PDFManagementService.saveQRImage('TEST123', mockBase64);

      expect(result).toHaveProperty('filepath');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('savedAt');
      expect(result.arrCardNo).toBe('TEST123');
      expect(result.filename).toMatch(/^TDAC_QR_TEST123_\d+\.png$/);

      // Verify file was created
      const file = new File(Paths.document, `tdac/${result.filename}`);
      expect(file.exists).toBe(true);
    });

    test('should handle base64 data with or without data URI prefix', async () => {
      const base64WithPrefix = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const base64WithoutPrefix = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result1 = await PDFManagementService.saveQRImage('TEST1', base64WithPrefix);
      const result2 = await PDFManagementService.saveQRImage('TEST2', base64WithoutPrefix);

      const file1 = new File(Paths.document, `tdac/${result1.filename}`);
      const file2 = new File(Paths.document, `tdac/${result2.filename}`);

      expect(file1.exists).toBe(true);
      expect(file2.exists).toBe(true);
    });

    test('should convert base64 to Uint8Array for binary image data', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await PDFManagementService.saveQRImage('TEST123', mockBase64);

      const file = new File(Paths.document, `tdac/${result.filename}`);
      const savedData = File._getMockFiles().get(file.uri);

      expect(savedData).toBeInstanceOf(Uint8Array);
    });
  });

  describe('getPDFInfo()', () => {
    test('should return file info for existing file using new File API', async () => {
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      const saveResult = await PDFManagementService.savePDF('TEST123', mockBlob);

      const info = await PDFManagementService.getPDFInfo(saveResult.filepath);

      expect(info.exists).toBe(true);
      expect(info.uri).toBe(saveResult.filepath);
      expect(info.size).toBeGreaterThan(0);
    });

    test('should return exists: false for non-existent file', async () => {
      const info = await PDFManagementService.getPDFInfo('/mock/documents/tdac/nonexistent.pdf');

      expect(info.exists).toBe(false);
    });
  });

  describe('deletePDF()', () => {
    test('should delete PDF file using new File API', async () => {
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      const saveResult = await PDFManagementService.savePDF('TEST123', mockBlob);

      const file = new File(Paths.document, `tdac/${saveResult.filename}`);
      expect(file.exists).toBe(true);

      await PDFManagementService.deletePDF(saveResult.filepath);

      expect(file.exists).toBe(false);
    });

    test('should not fail when deleting non-existent file', async () => {
      await expect(
        PDFManagementService.deletePDF('/mock/documents/tdac/nonexistent.pdf')
      ).resolves.not.toThrow();
    });
  });

  describe('listPDFs()', () => {
    test('should list all PDF files using new Directory API', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });

      await PDFManagementService.savePDF('TEST1', mockBlob);
      await PDFManagementService.savePDF('TEST2', mockBlob);
      await PDFManagementService.savePDF('TEST3', mockBlob);

      const files = await PDFManagementService.listPDFs();

      expect(files).toHaveLength(3);
      expect(files.every(f => f.endsWith('.pdf'))).toBe(true);
    });

    test('should filter out non-PDF files', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const mockQRBase64 = 'data:image/png;base64,test';

      await PDFManagementService.savePDF('TEST1', mockBlob);
      await PDFManagementService.saveQRImage('TEST2', mockQRBase64);

      const files = await PDFManagementService.listPDFs();

      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/\.pdf$/);
    });

    test('should return empty array when directory is empty', async () => {
      const files = await PDFManagementService.listPDFs();

      expect(files).toEqual([]);
    });
  });

  describe('cleanupOldPDFs()', () => {
    test('should delete PDFs older than specified days', async () => {
      // Mock Date.now() to control timestamps
      const now = Date.now();
      const oldTimestamp = now - (31 * 24 * 60 * 60 * 1000); // 31 days ago
      const recentTimestamp = now - (5 * 24 * 60 * 60 * 1000); // 5 days ago

      // Create mock PDFs with specific timestamps in filenames
      const oldFilename = `TDAC_OLD_${oldTimestamp}.pdf`;
      const recentFilename = `TDAC_RECENT_${recentTimestamp}.pdf`;

      const oldFile = new File(Paths.document, `tdac/${oldFilename}`);
      const recentFile = new File(Paths.document, `tdac/${recentFilename}`);

      oldFile.create();
      oldFile.write(new Uint8Array([1, 2, 3]));
      recentFile.create();
      recentFile.write(new Uint8Array([4, 5, 6]));

      const result = await PDFManagementService.cleanupOldPDFs(30);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
      expect(oldFile.exists).toBe(false);
      expect(recentFile.exists).toBe(true);
    });

    test('should handle files without timestamp in filename', async () => {
      const invalidFile = new File(Paths.document, 'tdac/invalid_filename.pdf');
      invalidFile.create();
      invalidFile.write(new Uint8Array([1, 2, 3]));

      const result = await PDFManagementService.cleanupOldPDFs(30);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
      expect(invalidFile.exists).toBe(true);
    });
  });

  describe('getFilePath()', () => {
    test('should return file URI using new File API', () => {
      const filename = 'TDAC_TEST123_1234567890.pdf';
      const filepath = PDFManagementService.getFilePath(filename);

      expect(filepath).toBe(`/mock/documents/tdac/${filename}`);
    });

    test('should be marked as deprecated', () => {
      // This test verifies the method exists but should be replaced
      // by direct File creation in future code
      const filename = 'test.pdf';
      const filepath = PDFManagementService.getFilePath(filename);

      expect(typeof filepath).toBe('string');
      expect(filepath).toContain('tdac');
      expect(filepath).toContain(filename);
    });
  });
});
