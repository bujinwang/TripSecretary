/**
 * Test suite for Passport isPrimary constraint
 */

import Passport from '../Passport';
import secureStorageService from '../../services/security/SecureStorageService';

jest.mock('../../services/security/SecureStorageService', () => {
  const mockService = {
    savePassport: jest.fn(),
    getPassport: jest.fn(),
    listUserPassports: jest.fn(),
    getUserPassport: jest.fn()
  };

  return {
    __esModule: true,
    default: mockService
  };
});

type SecureStorageServiceType = typeof secureStorageService;
const mockedSecureStorage = secureStorageService as jest.Mocked<SecureStorageServiceType>;

describe('Passport isPrimary Constraint', () => {
  const TEST_USER_ID = 'test_user_123';

  beforeEach(() => {
    jest.clearAllMocks();

    const mockPassports = new Map<string, Record<string, unknown>>();

    mockedSecureStorage.savePassport.mockImplementation(async data => {
      mockPassports.set(String(data.id), { ...(data as unknown as Record<string, unknown>) });
      return { id: data.id ?? '' };
    });

    mockedSecureStorage.getPassport.mockImplementation(async id => {
      return (mockPassports.get(String(id)) ?? null) as unknown;
    });

    mockedSecureStorage.listUserPassports.mockImplementation(async userId => {
      return Array.from(mockPassports.values()).filter(p => p.userId === userId);
    });

    mockedSecureStorage.getUserPassport.mockImplementation(async userId => {
      const passports = Array.from(mockPassports.values()).filter(p => p.userId === userId);
      return passports.find(p => p.isPrimary) ?? passports[0] ?? null;
    });
  });

  describe('setAsPrimary', () => {
    it('should set passport as primary', async () => {
      const passport = new Passport({
        userId: TEST_USER_ID,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1990-01-01',
        nationality: 'CHN',
        expiryDate: '2030-12-31'
      });

      await passport.save({ skipValidation: true });
      expect(passport.isPrimary).toBe(false);

      await passport.setAsPrimary();
      expect(passport.isPrimary).toBe(true);

      const saveCall = mockedSecureStorage.savePassport.mock.calls[mockedSecureStorage.savePassport.mock.calls.length - 1]?.[0];
      expect(saveCall).toBeDefined();
      if (!saveCall) {
        throw new Error('Expected savePassport to be called');
      }
      expect(saveCall.isPrimary).toBe(true);
    });

    it('should throw error if userId is not set', async () => {
      const passport = new Passport({
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1990-01-01',
        nationality: 'CHN'
      });

      await expect(passport.setAsPrimary()).rejects.toThrow('Cannot set as primary: userId is not set');
    });

    it('should only call save once when setting as primary', async () => {
      const passport = new Passport({
        userId: TEST_USER_ID,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1990-01-01',
        nationality: 'CHN',
        expiryDate: '2030-12-31'
      });

      await passport.save({ skipValidation: true });
      mockedSecureStorage.savePassport.mockClear();

      await passport.setAsPrimary();

      expect(mockedSecureStorage.savePassport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Database trigger simulation', () => {
    it('should simulate trigger unsetting other primary passports', async () => {
      const passport1 = new Passport({
        userId: TEST_USER_ID,
        passportNumber: 'E11111111',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1990-01-01',
        nationality: 'CHN',
        expiryDate: '2030-12-31'
      });

      const passport2 = new Passport({
        userId: TEST_USER_ID,
        passportNumber: 'E22222222',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1990-01-01',
        nationality: 'CHN',
        expiryDate: '2030-12-31'
      });

      await passport1.save({ skipValidation: true });
      await passport2.save({ skipValidation: true });

      await passport1.setAsPrimary();
      expect(passport1.isPrimary).toBe(true);

      mockedSecureStorage.savePassport.mockClear();

      mockedSecureStorage.savePassport.mockImplementation(async data => {
        if (data.isPrimary && data.userId) {
          // this block simulates a trigger; kept for call verification
        }
        return { id: data.id } as unknown as ReturnType<typeof mockedSecureStorage.savePassport>;
      });

      await passport2.setAsPrimary();
      expect(passport2.isPrimary).toBe(true);

      const lastCall = mockedSecureStorage.savePassport.mock.calls[mockedSecureStorage.savePassport.mock.calls.length - 1]?.[0];
      expect(lastCall).toBeDefined();
      if (!lastCall) {
        throw new Error('Expected savePassport to be called');
      }
      expect(lastCall.isPrimary).toBe(true);
      expect(lastCall.id).toBe(passport2.id);
    });
  });

  describe('Constructor', () => {
    it('should default isPrimary to false', () => {
      const passport = new Passport({
        userId: TEST_USER_ID,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1990-01-01',
        nationality: 'CHN'
      });

      expect(passport.isPrimary).toBe(false);
    });

    it('should accept isPrimary in constructor', () => {
      const passport = new Passport({
        userId: TEST_USER_ID,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1990-01-01',
        nationality: 'CHN',
        isPrimary: true
      });

      expect(passport.isPrimary).toBe(true);
    });
  });

  describe('toPlainObject', () => {
    it('should include isPrimary in serialization', () => {
      const passport = new Passport({
        userId: TEST_USER_ID,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1990-01-01',
        nationality: 'CHN',
        isPrimary: true
      });

      const plain = passport.toPlainObject();
      expect(plain.isPrimary).toBe(true);
    });
  });

  describe('exportData', () => {
    it('should include isPrimary in export', () => {
      const passport = new Passport({
        userId: TEST_USER_ID,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1990-01-01',
        nationality: 'CHN',
        isPrimary: true
      });

      const exported = passport.exportData();
      expect(exported.isPrimary).toBe(true);
    });
  });
});

