/**
 * PersonalInfo Model Tests
 * Tests for the mergeUpdates method
 */

import PersonalInfo from '../PersonalInfo';
import SecureStorageService from '../../services/security/SecureStorageService';

// Mock SecureStorageService
jest.mock('../../services/security/SecureStorageService');

describe('PersonalInfo Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByUserId', () => {
    it('should load personal info by userId', async () => {
      const mockData = {
        id: 'personal_123',
        userId: 'user_123',
        passportId: 'passport_123', // NEW: Schema v2.0 field
        phoneNumber: '+86 123 4567 8900',
        email: 'test@example.com',
        homeAddress: '123 Main St',
        occupation: 'Engineer',
        provinceCity: 'Shanghai',
        countryRegion: 'CHN',
        phoneCode: '+86',
        gender: 'Male',
        isDefault: 1, // NEW: Schema v2.0 field
        label: 'China', // NEW: Schema v2.0 field
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      SecureStorageService.getPersonalInfo.mockResolvedValue(mockData);

      const personalInfo = await PersonalInfo.getByUserId('user_123');

      expect(SecureStorageService.getPersonalInfo).toHaveBeenCalledWith('user_123');
      expect(personalInfo).toBeInstanceOf(PersonalInfo);
      expect(personalInfo.userId).toBe('user_123');
      expect(personalInfo.email).toBe('test@example.com');
      expect(personalInfo.phoneNumber).toBe('+86 123 4567 8900');
    });

    it('should return null when no personal info exists for userId', async () => {
      SecureStorageService.getPersonalInfo.mockResolvedValue(null);

      const personalInfo = await PersonalInfo.getByUserId('user_456');

      expect(SecureStorageService.getPersonalInfo).toHaveBeenCalledWith('user_456');
      expect(personalInfo).toBeNull();
    });

    it('should throw error when storage service fails', async () => {
      SecureStorageService.getPersonalInfo.mockRejectedValue(
        new Error('Storage error')
      );

      await expect(
        PersonalInfo.getByUserId('user_123')
      ).rejects.toThrow('Storage error');
    });

    it('should be equivalent to calling loadDefault()', async () => {
      const mockData = {
        id: 'personal_123',
        userId: 'user_123',
        passportId: 'passport_123', // NEW: Schema v2.0 field
        email: 'test@example.com',
        isDefault: 0, // NEW: Schema v2.0 field
        label: 'Hong Kong' // NEW: Schema v2.0 field
      };

      SecureStorageService.getPersonalInfo.mockResolvedValue(mockData);

      const resultFromGetByUserId = await PersonalInfo.getByUserId('user_123');

      // Clear mock and call loadDefault
      jest.clearAllMocks();
      SecureStorageService.getPersonalInfo.mockResolvedValue(mockData);

      const resultFromLoad = await PersonalInfo.loadDefault('user_123');

      expect(resultFromGetByUserId.id).toBe(resultFromLoad.id);
      expect(resultFromGetByUserId.userId).toBe(resultFromLoad.userId);
      expect(resultFromGetByUserId.email).toBe(resultFromLoad.email);
    });
  });

  describe('mergeUpdates', () => {
    it('should merge non-empty updates without overwriting existing data', async () => {
      // Create a PersonalInfo instance with existing data
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123', // NEW: Schema v2.0 field
        phoneNumber: '+86 123 4567 8900',
        email: 'existing@example.com',
        homeAddress: '123 Main St',
        occupation: 'Engineer',
        provinceCity: 'Shanghai',
        countryRegion: 'CHN',
        phoneCode: '+86',
        gender: 'Male',
        isDefault: 1, // NEW: Schema v2.0 field
        label: 'China' // NEW: Schema v2.0 field
      });

      // Mock the save operation
      SecureStorageService.savePersonalInfo.mockResolvedValue({ success: true });

      // Merge updates with some empty fields
      await personalInfo.mergeUpdates({
        phoneNumber: '', // Empty - should NOT overwrite
        email: 'new@example.com', // Non-empty - should overwrite
        homeAddress: '   ', // Whitespace only - should NOT overwrite
        occupation: 'Designer', // Non-empty - should overwrite
        provinceCity: null, // Null - should NOT overwrite
        countryRegion: undefined // Undefined - should NOT overwrite
      }, { skipValidation: true });

      // Verify that only non-empty values were updated
      expect(personalInfo.phoneNumber).toBe('+86 123 4567 8900'); // Unchanged
      expect(personalInfo.email).toBe('new@example.com'); // Updated
      expect(personalInfo.homeAddress).toBe('123 Main St'); // Unchanged
      expect(personalInfo.occupation).toBe('Designer'); // Updated
      expect(personalInfo.provinceCity).toBe('Shanghai'); // Unchanged
      expect(personalInfo.countryRegion).toBe('CHN'); // Unchanged
    });

    it('should not overwrite id or createdAt fields', async () => {
      const originalId = 'personal_123';
      const originalCreatedAt = '2024-01-01T00:00:00Z';

      const personalInfo = new PersonalInfo({
        id: originalId,
        userId: 'user_123',
        passportId: 'passport_123', // NEW: Schema v2.0 field
        email: 'test@example.com',
        isDefault: 0, // NEW: Schema v2.0 field
        label: 'Test', // NEW: Schema v2.0 field
        createdAt: originalCreatedAt
      });

      SecureStorageService.savePersonalInfo.mockResolvedValue({ success: true });

      await personalInfo.mergeUpdates({
        id: 'personal_456', // Should be ignored
        createdAt: '2024-12-31T00:00:00Z', // Should be ignored
        email: 'updated@example.com'
      }, { skipValidation: true });

      expect(personalInfo.id).toBe(originalId);
      expect(personalInfo.createdAt).toBe(originalCreatedAt);
      expect(personalInfo.email).toBe('updated@example.com');
    });

    it('should update updatedAt timestamp', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123', // NEW: Schema v2.0 field
        email: 'test@example.com',
        isDefault: 0, // NEW: Schema v2.0 field
        label: 'Test', // NEW: Schema v2.0 field
        updatedAt: '2024-01-01T00:00:00Z'
      });

      SecureStorageService.savePersonalInfo.mockResolvedValue({ success: true });

      const beforeUpdate = personalInfo.updatedAt;
      
      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await personalInfo.mergeUpdates({
        occupation: 'Engineer'
      }, { skipValidation: true });

      expect(personalInfo.updatedAt).not.toBe(beforeUpdate);
    });

    it('should validate merged data when skipValidation is false', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123', // NEW: Schema v2.0 field
        email: 'valid@example.com',
        phoneNumber: '+86 123 4567 8900',
        isDefault: 0, // NEW: Schema v2.0 field
        label: 'Test' // NEW: Schema v2.0 field
      });

      SecureStorageService.savePersonalInfo.mockResolvedValue({ success: true });

      // This should succeed with valid data
      await expect(
        personalInfo.mergeUpdates({
          occupation: 'Engineer'
        }, { skipValidation: false })
      ).resolves.toBeDefined();
    });

    it('should skip validation when skipValidation is true', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123', // NEW: Schema v2.0 field
        email: '', // Invalid - no contact method
        phoneNumber: '',
        isDefault: 0, // NEW: Schema v2.0 field
        label: 'Test' // NEW: Schema v2.0 field
      });

      SecureStorageService.savePersonalInfo.mockResolvedValue({ success: true });

      // This should succeed even with invalid data when skipValidation is true
      await expect(
        personalInfo.mergeUpdates({
          occupation: 'Engineer'
        }, { skipValidation: true })
      ).resolves.toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123', // NEW: Schema v2.0 field
        email: 'test@example.com',
        isDefault: 0, // NEW: Schema v2.0 field
        label: 'Test' // NEW: Schema v2.0 field
      });

      SecureStorageService.savePersonalInfo.mockRejectedValue(
        new Error('Storage error')
      );

      await expect(
        personalInfo.mergeUpdates({
          occupation: 'Engineer'
        }, { skipValidation: true })
      ).rejects.toThrow('Storage error');
    });

    it('should merge all non-empty fields in a progressive filling scenario', async () => {
      // Simulate progressive filling where user fills form step by step
      const personalInfo = new PersonalInfo({
        userId: 'user_123',
        passportId: 'passport_123', // NEW: Schema v2.0 field
        email: 'user@example.com',
        isDefault: 0, // NEW: Schema v2.0 field
        label: 'Test' // NEW: Schema v2.0 field
      });

      SecureStorageService.savePersonalInfo.mockResolvedValue({ success: true });

      // Step 1: Add phone number
      await personalInfo.mergeUpdates({
        phoneNumber: '+86 123 4567 8900'
      }, { skipValidation: true });

      expect(personalInfo.email).toBe('user@example.com');
      expect(personalInfo.phoneNumber).toBe('+86 123 4567 8900');

      // Step 2: Add address
      await personalInfo.mergeUpdates({
        homeAddress: '123 Main St'
      }, { skipValidation: true });

      expect(personalInfo.email).toBe('user@example.com');
      expect(personalInfo.phoneNumber).toBe('+86 123 4567 8900');
      expect(personalInfo.homeAddress).toBe('123 Main St');

      // Step 3: Add occupation and location
      await personalInfo.mergeUpdates({
        occupation: 'Engineer',
        provinceCity: 'Shanghai',
        countryRegion: 'CHN'
      }, { skipValidation: true });

      expect(personalInfo.email).toBe('user@example.com');
      expect(personalInfo.phoneNumber).toBe('+86 123 4567 8900');
      expect(personalInfo.homeAddress).toBe('123 Main St');
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
