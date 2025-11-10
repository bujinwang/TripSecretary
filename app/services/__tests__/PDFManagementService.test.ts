// @ts-nocheck

/**
 * Unit tests for PDFManagementService
 * Ensures compatibility with the async expo-file-system helpers.
 */

import PDFManagementService from '../PDFManagementService';
import * as FileSystem from 'expo-file-system';

// Mock FileReader for Node.js environment
global.FileReader = class FileReader {
  readAsDataURL(blob) {
    setTimeout(() => {
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

jest.mock('expo-file-system', () => {
  const files = new Map();
  const directories = new Set();
  const ensureTrailingSlash = (path) => (path.endsWith('/') ? path : `${path}/`);
  const documentDirectory = 'file:///mock/documents/';
  directories.add(documentDirectory);

  const getDirectoryInfo = (uri) => {
    const normalized = ensureTrailingSlash(uri);
    if (directories.has(normalized)) {
      return {
        exists: true,
        uri: normalized,
        isDirectory: true,
        size: undefined,
        modificationTime: undefined
      };
    }
    return null;
  };

  const state = {
    reset() {
      files.clear();
      directories.clear();
      directories.add(documentDirectory);
    },
    getFile(path) {
      return files.get(path);
    },
    hasDirectory(path) {
      return directories.has(ensureTrailingSlash(path));
    },
    ensureDirectory(path) {
      directories.add(ensureTrailingSlash(path));
    }
  };

  return {
    documentDirectory,
    EncodingType: { Base64: 'base64', UTF8: 'utf8' },
    __mockState: state,
    async getInfoAsync(uri) {
      if (files.has(uri)) {
        const entry = files.get(uri);
        return {
          exists: true,
          uri,
          isDirectory: false,
          size: entry.buffer.length,
          modificationTime: entry.mtime
        };
      }

      const dirInfo = getDirectoryInfo(uri);
      if (dirInfo) {
        return dirInfo;
      }

      return {
        exists: false,
        uri,
        isDirectory: false,
        size: undefined,
        modificationTime: undefined
      };
    },
    async makeDirectoryAsync(uri) {
      directories.add(ensureTrailingSlash(uri));
    },
    async readDirectoryAsync(dirUri) {
      const normalized = ensureTrailingSlash(dirUri);
      if (!directories.has(normalized)) {
        throw new Error(`Directory does not exist: ${dirUri}`);
      }

      const contents = [];
      for (const path of files.keys()) {
        if (path.startsWith(normalized)) {
          const relative = path.substring(normalized.length);
          if (!relative.includes('/')) {
            contents.push(relative);
          }
        }
      }

      return contents;
    },
    async writeAsStringAsync(uri, data, options = {}) {
      const encoding = options.encoding;
      const buffer = encoding === 'base64' || encoding === 'Base64'
        ? Buffer.from(data ?? '', 'base64')
        : Buffer.from(data ?? '', 'utf8');

      files.set(uri, {
        buffer,
        mtime: Date.now()
      });
    },
    async deleteAsync(uri) {
      files.delete(uri);
    },
    async copyAsync({ from, to }) {
      if (!files.has(from)) {
        throw new Error(`Source file does not exist: ${from}`);
      }

      const source = files.get(from);
      files.set(to, {
        buffer: Buffer.from(source.buffer),
        mtime: Date.now()
      });
    }
  };
});

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined)
}));

const getTdacDirectory = () => `${FileSystem.documentDirectory}tdac/`;

const seedFile = async (filename, bytes = [1, 2, 3]) => {
  const dir = getTdacDirectory();
  await PDFManagementService.initialize();
  await FileSystem.writeAsStringAsync(
    `${dir}${filename}`,
    Buffer.from(bytes).toString('base64'),
    { encoding: 'base64' }
  );
};

describe('PDFManagementService - Expo FileSystem helpers', () => {
  beforeEach(() => {
    FileSystem.__mockState.reset();
    jest.clearAllMocks();
  });

  describe('initialize()', () => {
    test('should create PDF directory if it does not exist', async () => {
      await PDFManagementService.initialize();
      expect(FileSystem.__mockState.hasDirectory(getTdacDirectory())).toBe(true);
    });

    test('should not fail if directory already exists', async () => {
      await PDFManagementService.initialize();
      await PDFManagementService.initialize();
      expect(FileSystem.__mockState.hasDirectory(getTdacDirectory())).toBe(true);
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
    test('should save PDF blob to file system', async () => {
      const mockBlob = new Blob(['test pdf data'], { type: 'application/pdf' });

      const result = await PDFManagementService.savePDF('TEST123', mockBlob, {
        submissionMethod: 'api'
      });

      expect(result).toMatchObject({
        arrCardNo: 'TEST123',
        filename: expect.stringMatching(/^TDAC_TEST123_\d+\.pdf$/)
      });
      expect(result).toHaveProperty('filepath');
      expect(result).toHaveProperty('size', mockBlob.size);

      const savedFile = FileSystem.__mockState.getFile(result.filepath);
      expect(savedFile).toBeDefined();
      expect(savedFile.buffer.length).toBeGreaterThan(0);
    });

    test('should convert blob content to binary buffer', async () => {
      const mockBlob = new Blob(['binary pdf content'], { type: 'application/pdf' });

      const result = await PDFManagementService.savePDF('TEST456', mockBlob);
      const savedFile = FileSystem.__mockState.getFile(result.filepath);

      expect(Buffer.isBuffer(savedFile.buffer)).toBe(true);
    });

    test('should initialize directory before saving', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });

      await PDFManagementService.savePDF('TEST789', mockBlob);

      expect(FileSystem.__mockState.hasDirectory(getTdacDirectory())).toBe(true);
    });
  });

  describe('saveQRImage()', () => {
    test('should save QR image to file system', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await PDFManagementService.saveQRImage('TEST123', mockBase64);

      expect(result).toMatchObject({
        arrCardNo: 'TEST123',
        filename: expect.stringMatching(/^TDAC_QR_TEST123_\d+\.png$/)
      });

      const savedFile = FileSystem.__mockState.getFile(result.filepath);
      expect(savedFile).toBeDefined();
    });

    test('should handle base64 data with or without data URI prefix', async () => {
      const base64WithPrefix = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const base64WithoutPrefix = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result1 = await PDFManagementService.saveQRImage('TEST1', base64WithPrefix);
      const result2 = await PDFManagementService.saveQRImage('TEST2', base64WithoutPrefix);

      expect(FileSystem.__mockState.getFile(result1.filepath)).toBeDefined();
      expect(FileSystem.__mockState.getFile(result2.filepath)).toBeDefined();
    });
  });

  describe('getPDFInfo()', () => {
    test('should return file info for existing file', async () => {
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
    test('should delete PDF file', async () => {
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      const saveResult = await PDFManagementService.savePDF('TEST123', mockBlob);

      await PDFManagementService.deletePDF(saveResult.filepath);

      expect(FileSystem.__mockState.getFile(saveResult.filepath)).toBeUndefined();
    });

    test('should not fail when deleting non-existent file', async () => {
      await expect(
        PDFManagementService.deletePDF('/mock/documents/tdac/nonexistent.pdf')
      ).resolves.not.toThrow();
    });
  });

  describe('listPDFs()', () => {
    test('should list all PDF files', async () => {
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
      const mockQRBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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
      const now = Date.now();
      const oldTimestamp = now - (31 * 24 * 60 * 60 * 1000);
      const recentTimestamp = now - (5 * 24 * 60 * 60 * 1000);

      const oldFilename = `TDAC_OLD_${oldTimestamp}.pdf`;
      const recentFilename = `TDAC_RECENT_${recentTimestamp}.pdf`;

      await seedFile(oldFilename, [1, 2, 3]);
      await seedFile(recentFilename, [4, 5, 6]);

      const result = await PDFManagementService.cleanupOldPDFs(30);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
      expect(FileSystem.__mockState.getFile(`${getTdacDirectory()}${oldFilename}`)).toBeUndefined();
      expect(FileSystem.__mockState.getFile(`${getTdacDirectory()}${recentFilename}`)).toBeDefined();
    });

    test('should handle files without timestamp in filename', async () => {
      const invalidFilename = 'invalid_filename.pdf';
      await seedFile(invalidFilename, [1, 2, 3]);

      const result = await PDFManagementService.cleanupOldPDFs(30);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
      expect(FileSystem.__mockState.getFile(`${getTdacDirectory()}${invalidFilename}`)).toBeDefined();
    });
  });

  describe('getFilePath()', () => {
    test('should return TDAC file path within document directory', () => {
      const filename = 'TDAC_TEST123_1234567890.pdf';
      const filepath = PDFManagementService.getFilePath(filename);

      expect(filepath).toBe(`${getTdacDirectory()}${filename}`);
    });

    test('should return string containing tdac directory and filename', () => {
      const filename = 'test.pdf';
      const filepath = PDFManagementService.getFilePath(filename);

      expect(filepath).toContain('tdac');
      expect(filepath).toContain(filename);
    });
  });
});
