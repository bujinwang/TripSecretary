// @ts-nocheck

/**
 * TDAC Submission Logger Tests
 * 测试TDAC提交日志记录功能
 */

import TDACSubmissionLogger from '../TDACSubmissionLogger';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

describe('TDACSubmissionLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('logHybridSubmission', () => {
    it('should log hybrid submission details', async () => {
      const mockTravelerData = {
        familyName: 'ZHANG',
        firstName: 'WEI',
        passportNo: 'E12345678',
        nationality: 'China',
        arrivalDate: '2024-12-25',
        flightNo: 'CA123',
        email: 'test@example.com',
        phoneCode: '86',
        phoneNo: '13800138000'
      };
      
      const mockToken = 'mock_cloudflare_token_12345';
      
      await TDACSubmissionLogger.logHybridSubmission(mockTravelerData, mockToken);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TDAC 闪电提交详细日志')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('logWebViewFill', () => {
    it('should log webview fill details', async () => {
      const mockFormFields = [
        {
          section: 'personal',
          label: 'Family Name',
          labelCn: '姓',
          value: 'ZHANG',
          searchTerms: ['familyName', 'lastName'],
          field: 'familyName'
        }
      ];
      
      await TDACSubmissionLogger.logWebViewFill(mockFormFields);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TDAC WebView 自动填充详细日志')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});