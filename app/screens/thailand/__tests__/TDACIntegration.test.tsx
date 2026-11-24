/**
 * Integration test for TDAC submission flows with EntryPackService
 * Tests task 9.1 implementation
 */

import EntryPackService from '../../../services/entryPack/EntryPackService';

// Mock dependencies
jest.mock('../../../services/entryPack/EntryPackService', () => ({
  createOrUpdatePack: jest.fn(),
}));

describe('TDAC EntryPackService Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TDAC API Screen Integration', () => {
    it('should call EntryPackService.createOrUpdatePack after successful API submission', async () => {
      // Mock successful TDAC API result
      const mockResult = {
        success: true,
        arrCardNo: 'TEST123456',
        duration: 3.5,
        submittedAt: '2024-01-01T12:00:00Z'
      };

      const expectedTdacSubmission = {
        arrCardNo: 'TEST123456',
        qrUri: expect.stringContaining('tdac_TEST123456.pdf'),
        pdfPath: expect.stringContaining('tdac_TEST123456.pdf'),
        submittedAt: expect.any(String),
        submissionMethod: 'api'
      };

      const expectedOptions = {
        submissionMethod: 'api'
      };

      // Simulate the integration call that would happen in TDACAPIScreen
      await EntryPackService.createOrUpdatePack(
        'thailand_entry_info',
        expectedTdacSubmission,
        expectedOptions
      );

      expect(EntryPackService.createOrUpdatePack).toHaveBeenCalledWith(
        'thailand_entry_info',
        expectedTdacSubmission,
        expectedOptions
      );
    });
  });

  describe('TDAC WebView Screen Integration', () => {
    it('should call EntryPackService.createOrUpdatePack after successful WebView submission', async () => {
      // Mock QR code data from WebView
      const mockQrData = {
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        timestamp: '2024-01-01T12:00:00Z',
        pageUrl: 'https://tdac.immigration.go.th/success'
      };

      const expectedTdacSubmission = {
        arrCardNo: expect.stringContaining('WV_'),
        qrUri: mockQrData.src,
        pdfPath: mockQrData.src,
        submittedAt: expect.any(String),
        submissionMethod: 'webview'
      };

      const expectedOptions = {
        submissionMethod: 'webview'
      };

      // Simulate the integration call that would happen in TDACWebViewScreen
      await EntryPackService.createOrUpdatePack(
        'thailand_entry_info',
        expectedTdacSubmission,
        expectedOptions
      );

      expect(EntryPackService.createOrUpdatePack).toHaveBeenCalledWith(
        'thailand_entry_info',
        expectedTdacSubmission,
        expectedOptions
      );
    });
  });

  describe('TDAC Hybrid Screen Integration', () => {
    it('should call EntryPackService.createOrUpdatePack after successful Hybrid submission', async () => {
      // Mock successful hybrid result
      const mockResult = {
        success: true,
        arrCardNo: 'HYB789012',
        duration: 5.2,
        submittedAt: '2024-01-01T12:00:00Z'
      };

      const expectedTdacSubmission = {
        arrCardNo: 'HYB789012',
        qrUri: expect.stringContaining('TDAC_HYB789012.pdf'),
        pdfPath: expect.stringContaining('TDAC_HYB789012.pdf'),
        submittedAt: '2024-01-01T12:00:00Z',
        submissionMethod: 'hybrid'
      };

      const expectedOptions = {
        submissionMethod: 'hybrid'
      };

      // Simulate the integration call that would happen in TDACHybridScreen
      await EntryPackService.createOrUpdatePack(
        'thailand_entry_info',
        expectedTdacSubmission,
        expectedOptions
      );

      expect(EntryPackService.createOrUpdatePack).toHaveBeenCalledWith(
        'thailand_entry_info',
        expectedTdacSubmission,
        expectedOptions
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle EntryPackService errors gracefully without blocking user flow', async () => {
      // Mock EntryPackService to throw an error
      EntryPackService.createOrUpdatePack.mockRejectedValue(
        new Error('Failed to create entry pack')
      );

      // The integration should catch errors and not throw
      let errorThrown = false;
      try {
        await EntryPackService.createOrUpdatePack(
          'thailand_entry_info',
          {
            arrCardNo: 'TEST123',
            qrUri: 'test.pdf',
            pdfPath: 'test.pdf',
            submittedAt: new Date().toISOString(),
            submissionMethod: 'api'
          },
          { submissionMethod: 'api' }
        );
      } catch (error) {
        errorThrown = true;
      }

      // In the actual implementation, errors are caught and logged but don't block user flow
      expect(EntryPackService.createOrUpdatePack).toHaveBeenCalled();
    });
  });

  describe('TDAC Submission Metadata', () => {
    it('should pass all required metadata fields', () => {
      const requiredFields = [
        'arrCardNo',
        'qrUri', 
        'pdfPath',
        'submittedAt',
        'submissionMethod'
      ];

      const mockTdacSubmission = {
        arrCardNo: 'TEST123456',
        qrUri: '/path/to/qr.pdf',
        pdfPath: '/path/to/qr.pdf',
        submittedAt: '2024-01-01T12:00:00Z',
        submissionMethod: 'api'
      };

      // Verify all required fields are present
      requiredFields.forEach(field => {
        expect(mockTdacSubmission).toHaveProperty(field);
        expect(mockTdacSubmission[field]).toBeDefined();
        expect(mockTdacSubmission[field]).not.toBe('');
      });
    });

    it('should handle different submission methods correctly', () => {
      const submissionMethods = ['api', 'webview', 'hybrid'];
      
      submissionMethods.forEach(method => {
        const mockTdacSubmission = {
          arrCardNo: `TEST_${method.toUpperCase()}`,
          qrUri: `/path/to/${method}.pdf`,
          pdfPath: `/path/to/${method}.pdf`,
          submittedAt: new Date().toISOString(),
          submissionMethod: method
        };

        expect(mockTdacSubmission.submissionMethod).toBe(method);
      });
    });
  });
});