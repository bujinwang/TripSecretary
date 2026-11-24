/**
 * PersonalInfo Model Tests
 * Tests for the mergeUpdates method
 */

import PersonalInfo from '../PersonalInfo';
import secureStorageService from '../../services/security/SecureStorageService';

jest.mock('../../services/security/SecureStorageService', () => {
  const mockService = {
    getPersonalInfo: jest.fn(),
    savePersonalInfo: jest.fn(),
    deleteFundItem: jest.fn()
  };

  return {
    __esModule: true,
    default: mockService
  };
});

type SecureStorageServiceType = typeof secureStorageService;
const mockedSecureStorage = secureStorageService as jest.Mocked<SecureStorageServiceType>;

describe('PersonalInfo Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByUserId', () => {
    it('should load personal info by userId', async () => {
      const mockData = {
        id: 'personal_123',
        userId: 'user_123',
        passportId: 'passport_123',
        phoneNumber: '+86 123 4567 8900',
        email: 'test@example.com',
        homeAddress: '123 Main St',
        occupation: 'Engineer',
        provinceCity: 'Shanghai',
        countryRegion: 'CHN',
        phoneCode: '+86',
        gender: 'Male',
        isDefault: 1,
        label: 'China',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockedSecureStorage.getPersonalInfo.mockResolvedValue(mockData);

      const personalInfo = await PersonalInfo.getByUserId('user_123');

      expect(mockedSecureStorage.getPersonalInfo).toHaveBeenCalledWith('user_123');
      expect(personalInfo).toBeInstanceOf(PersonalInfo);
      expect(personalInfo?.userId).toBe('user_123');
      expect(personalInfo?.email).toBe('test@example.com');
      expect(personalInfo?.phoneNumber).toBe('+86 123 4567 8900');
    });

    it('should return null when no personal info exists for userId', async () => {
      mockedSecureStorage.getPersonalInfo.mockResolvedValue(null);

      const personalInfo = await PersonalInfo.getByUserId('user_456');

      expect(mockedSecureStorage.getPersonalInfo).toHaveBeenCalledWith('user_456');
      expect(personalInfo).toBeNull();
    });

    it('should throw error when storage service fails', async () => {
      mockedSecureStorage.getPersonalInfo.mockRejectedValue(new Error('Storage error'));

      await expect(PersonalInfo.getByUserId('user_123')).rejects.toThrow('Storage error');
    });

    it('should be equivalent to calling loadDefault()', async () => {
      const mockData = {
        id: 'personal_123',
        userId: 'user_123',
        passportId: 'passport_123',
        email: 'test@example.com',
        isDefault: 0,
        label: 'Hong Kong'
      };

      mockedSecureStorage.getPersonalInfo.mockResolvedValue(mockData);

      const resultFromGetByUserId = await PersonalInfo.getByUserId('user_123');

      jest.clearAllMocks();
      mockedSecureStorage.getPersonalInfo.mockResolvedValue(mockData);

      const resultFromLoad = await PersonalInfo.loadDefault('user_123');

      expect(resultFromGetByUserId?.id).toBe(resultFromLoad?.id);
      expect(resultFromGetByUserId?.userId).toBe(resultFromLoad?.userId);
      expect(resultFromGetByUserId?.email).toBe(resultFromLoad?.email);
    });
  });

  describe('mergeUpdates', () => {
    it('should merge non-empty updates without overwriting existing data', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123',
        phoneNumber: '+86 123 4567 8900',
        email: 'existing@example.com',
        homeAddress: '123 Main St',
        occupation: 'Engineer',
        provinceCity: 'Shanghai',
        countryRegion: 'CHN',
        phoneCode: '+86',
        gender: 'Male',
        isDefault: 1,
        label: 'China'
      });

      mockedSecureStorage.savePersonalInfo.mockResolvedValue({ id: personalInfo.id });

      await personalInfo.mergeUpdates(
        {
          phoneNumber: '',
          email: 'new@example.com',
          homeAddress: '   ',
          occupation: 'Designer',
          provinceCity: null,
          countryRegion: undefined
        },
        { skipValidation: true }
      );

      expect(personalInfo.phoneNumber).toBe('+86 123 4567 8900');
      expect(personalInfo.email).toBe('new@example.com');
      expect(personalInfo.homeAddress).toBe('123 Main St');
      expect(personalInfo.occupation).toBe('Designer');
      expect(personalInfo.provinceCity).toBe('Shanghai');
      expect(personalInfo.countryRegion).toBe('CHN');
    });

    it('should not overwrite id or createdAt fields', async () => {
      const originalId = 'personal_123';
      const originalCreatedAt = '2024-01-01T00:00:00Z';

      const personalInfo = new PersonalInfo({
        id: originalId,
        userId: 'user_123',
        passportId: 'passport_123',
        email: 'test@example.com',
        isDefault: 0,
        label: 'Test',
        createdAt: originalCreatedAt
      });

      mockedSecureStorage.savePersonalInfo.mockResolvedValue({ id: personalInfo.id });

      await personalInfo.mergeUpdates(
        {
          id: 'personal_456',
          createdAt: '2024-12-31T00:00:00Z',
          email: 'updated@example.com'
        },
        { skipValidation: true }
      );

      expect(personalInfo.id).toBe(originalId);
      expect(personalInfo.createdAt).toBe(originalCreatedAt);
      expect(personalInfo.email).toBe('updated@example.com');
    });

    it('should update updatedAt timestamp', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123',
        email: 'test@example.com',
        isDefault: 0,
        label: 'Test',
        updatedAt: '2024-01-01T00:00:00Z'
      });

      mockedSecureStorage.savePersonalInfo.mockResolvedValue({ id: personalInfo.id });

      const beforeUpdate = personalInfo.updatedAt;
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 10);
      });

      await personalInfo.mergeUpdates({ occupation: 'Engineer' }, { skipValidation: true });

      expect(personalInfo.updatedAt).not.toBe(beforeUpdate);
    });

    it('should validate merged data when skipValidation is false', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123',
        email: 'valid@example.com',
        phoneNumber: '+86 123 4567 8900',
        isDefault: 0,
        label: 'Test'
      });

      mockedSecureStorage.savePersonalInfo.mockResolvedValue({ id: personalInfo.id });

      await expect(
        personalInfo.mergeUpdates({ occupation: 'Engineer' }, { skipValidation: false })
      ).resolves.toBeDefined();
    });

    it('should skip validation when skipValidation is true', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123',
        email: '',
        phoneNumber: '',
        isDefault: 0,
        label: 'Test'
      });

      mockedSecureStorage.savePersonalInfo.mockResolvedValue({ id: personalInfo.id });

      await expect(
        personalInfo.mergeUpdates({ occupation: 'Engineer' }, { skipValidation: true })
      ).resolves.toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123',
        email: 'test@example.com',
        isDefault: 0,
        label: 'Test'
      });

      mockedSecureStorage.savePersonalInfo.mockRejectedValue(new Error('Storage error'));

      await expect(
        personalInfo.mergeUpdates({ occupation: 'Engineer' }, { skipValidation: true })
      ).rejects.toThrow('Storage error');
    });

    it('should merge all non-empty fields in a progressive filling scenario', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123',
        email: 'user@example.com',
        isDefault: 0,
        label: 'Test'
      });

      mockedSecureStorage.savePersonalInfo.mockResolvedValue({ id: personalInfo.id });

      await personalInfo.mergeUpdates({ phoneNumber: '+86 123 4567 8900' }, { skipValidation: true });
      expect(personalInfo.phoneNumber).toBe('+86 123 4567 8900');

      await personalInfo.mergeUpdates({ homeAddress: '123 Main St' }, { skipValidation: true });
      expect(personalInfo.homeAddress).toBe('123 Main St');

      await personalInfo.mergeUpdates(
        {
          occupation: 'Engineer',
          provinceCity: 'Shanghai',
          countryRegion: 'CHN'
        },
        { skipValidation: true }
      );

      expect(personalInfo.occupation).toBe('Engineer');
      expect(personalInfo.provinceCity).toBe('Shanghai');
      expect(personalInfo.countryRegion).toBe('CHN');
    });
  });

  describe('Schema v2.0 fields', () => {
    it('should handle passportId field correctly', () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_456',
        email: 'test@example.com',
        isDefault: 0,
        label: 'Test Passport'
      });

      expect(personalInfo.passportId).toBe('passport_456');
      expect(personalInfo.isDefault).toBe(0);
      expect(personalInfo.label).toBe('Test Passport');
    });

    it('should handle isDefault field correctly', () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        email: 'test@example.com',
        isDefault: 1,
        label: 'Default Profile'
      });

      expect(personalInfo.isDefault).toBe(1);
      expect(personalInfo.label).toBe('Default Profile');
    });

    it('should handle label field correctly', () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        email: 'test@example.com',
        isDefault: 0,
        label: 'Work Profile'
      });

      expect(personalInfo.label).toBe('Work Profile');
    });

    it('should include new fields in export data', () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123',
        email: 'test@example.com',
        isDefault: 1,
        label: 'China Profile'
      });

      const exportData = personalInfo.exportData();

      expect(exportData.passportId).toBe('passport_123');
      expect(exportData.isDefault).toBe(1);
      expect(exportData.label).toBe('China Profile');
    });
  });
});

