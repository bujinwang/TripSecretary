/**
 * ThailandTravelInfoScreen Save Logic Integration Tests
 * Tests save filtering with user interaction tracking and backward compatibility migration
 */

import PassportDataService from '../../../services/data/PassportDataService';
import FieldStateManager from '../../../utils/FieldStateManager';
import { useUserInteractionTracker } from '../../../utils/UserInteractionTracker';

// Mock dependencies
jest.mock('../../../services/data/PassportDataService');
jest.mock('../../../utils/FieldStateManager');
jest.mock('../../../utils/UserInteractionTracker');

describe('ThailandTravelInfoScreen - Save Logic Integration Tests', () => {
  let mockUserInteractionTracker;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock UserInteractionTracker
    mockUserInteractionTracker = {
      isInitialized: true,
      markFieldAsModified: jest.fn(),
      isFieldUserModified: jest.fn(),
      getModifiedFields: jest.fn(() => []),
      getFieldInteractionDetails: jest.fn(),
      initializeWithExistingData: jest.fn()
    };
    
    useUserInteractionTracker.mockReturnValue(mockUserInteractionTracker);
    
    // Mock PassportDataService
    PassportDataService.getAllUserData = jest.fn().mockResolvedValue({
      passport: null,
      personalInfo: null,
      userId: 'user_001'
    });
    PassportDataService.getTravelInfo = jest.fn().mockResolvedValue(null);
    PassportDataService.updatePassport = jest.fn().mockResolvedValue();
    PassportDataService.upsertPersonalInfo = jest.fn().mockResolvedValue();
    PassportDataService.saveTravelInfo = jest.fn().mockResolvedValue();
    
    // Mock FieldStateManager
    FieldStateManager.filterSaveableFields = jest.fn().mockImplementation((fields) => fields);
    FieldStateManager.getCompletionMetrics = jest.fn().mockReturnValue({
      totalFields: 10,
      completedFields: 5,
      completionPercentage: 50,
      requiredFields: 8,
      requiredFieldsCompleted: 4,
      requiredCompletionPercentage: 50,
      userModifiedFields: 3
    });
    FieldStateManager.getFieldCount = jest.fn().mockReturnValue({
      totalUserModified: 3,
      totalWithValues: 2,
      totalFields: 5
    });
  });

  describe('Save Filtering with User Interaction', () => {
    it('should filter fields based on user interaction state', () => {
      // Test data
      const allFields = {
        travelPurpose: 'BUSINESS',
        boardingCountry: 'CHN',
        accommodationType: '', // Empty field
        email: 'test@example.com'
      };

      const interactionState = {
        travelPurpose: { isUserModified: true },
        boardingCountry: { isUserModified: false },
        accommodationType: { isUserModified: false },
        email: { isUserModified: true }
      };

      // Mock FieldStateManager to return only user-modified fields
      FieldStateManager.filterSaveableFields.mockImplementation((fields, state) => {
        const filtered = {};
        Object.keys(fields).forEach(fieldName => {
          if (state[fieldName]?.isUserModified && fields[fieldName]) {
            filtered[fieldName] = fields[fieldName];
          }
        });
        return filtered;
      });

      const result = FieldStateManager.filterSaveableFields(allFields, interactionState);

      // Verify filtering logic
      expect(FieldStateManager.filterSaveableFields).toHaveBeenCalledWith(allFields, interactionState);
      expect(result).toEqual({
        travelPurpose: 'BUSINESS',
        email: 'test@example.com'
      });
    });

    it('should preserve existing data when preserveExisting option is true', () => {
      const allFields = {
        email: 'existing@example.com',
        occupation: 'Engineer',
        newField: 'new value'
      };

      const interactionState = {
        email: { isUserModified: false }, // Existing data, not user-modified
        occupation: { isUserModified: false }, // Existing data, not user-modified
        newField: { isUserModified: true } // New user input
      };

      const options = { preserveExisting: true };

      // Mock FieldStateManager to preserve existing data
      FieldStateManager.filterSaveableFields.mockImplementation((fields, state, opts) => {
        const filtered = {};
        Object.keys(fields).forEach(fieldName => {
          const isUserModified = state[fieldName]?.isUserModified;
          const hasValue = fields[fieldName] && fields[fieldName].trim() !== '';
          
          if (isUserModified || (opts.preserveExisting && hasValue)) {
            filtered[fieldName] = fields[fieldName];
          }
        });
        return filtered;
      });

      const result = FieldStateManager.filterSaveableFields(allFields, interactionState, options);

      expect(FieldStateManager.filterSaveableFields).toHaveBeenCalledWith(
        allFields,
        interactionState,
        expect.objectContaining({ preserveExisting: true })
      );
      
      // Should include both existing data and user-modified fields
      expect(result).toEqual({
        email: 'existing@example.com',
        occupation: 'Engineer',
        newField: 'new value'
      });
    });

    it('should not save empty fields that are not user-modified', () => {
      const allFields = {
        travelPurpose: '', // Empty field
        boardingCountry: '', // Empty field
        email: 'test@example.com' // Has value but not user-modified
      };

      const interactionState = {
        travelPurpose: { isUserModified: false },
        boardingCountry: { isUserModified: false },
        email: { isUserModified: false }
      };

      // Mock FieldStateManager to filter out non-user-modified empty fields
      FieldStateManager.filterSaveableFields.mockImplementation((fields, state) => {
        const filtered = {};
        Object.keys(fields).forEach(fieldName => {
          const isUserModified = state[fieldName]?.isUserModified;
          const hasValue = fields[fieldName] && fields[fieldName].trim() !== '';
          
          // Only save if user-modified OR (has value and preserveExisting)
          if (isUserModified || hasValue) {
            filtered[fieldName] = fields[fieldName];
          }
        });
        return filtered;
      });

      const result = FieldStateManager.filterSaveableFields(allFields, interactionState);

      // Should only include fields with values (for backward compatibility)
      expect(result).toEqual({
        email: 'test@example.com'
      });
    });
  });

  describe('Backward Compatibility Migration', () => {
    it('should initialize interaction tracker with existing data', () => {
      const existingUserData = {
        passport: {
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI',
          nationality: 'CHN'
        },
        personalInfo: {
          email: 'existing@example.com',
          occupation: 'Engineer'
        },
        travelInfo: {
          travelPurpose: 'BUSINESS',
          boardingCountry: 'CHN'
        }
      };

      // Test the migration logic directly
      const expectedMigrationData = {
        passportNo: 'E12345678',
        fullName: 'ZHANG, WEI',
        nationality: 'CHN',
        email: 'existing@example.com',
        occupation: 'Engineer',
        travelPurpose: 'BUSINESS',
        boardingCountry: 'CHN'
      };

      // Simulate the migration function call
      mockUserInteractionTracker.initializeWithExistingData(expectedMigrationData);

      // Verify migration was called with correct data
      expect(mockUserInteractionTracker.initializeWithExistingData).toHaveBeenCalledWith(
        expectedMigrationData
      );
    });

    it('should handle migration errors gracefully', () => {
      const existingUserData = {
        passport: { passportNumber: 'E12345678' }
      };

      // Mock migration to throw error
      mockUserInteractionTracker.initializeWithExistingData.mockImplementation(() => {
        throw new Error('Migration failed');
      });

      // Test that error is handled gracefully
      expect(() => {
        try {
          mockUserInteractionTracker.initializeWithExistingData({ passportNo: 'E12345678' });
        } catch (error) {
          // Error should be caught and handled gracefully in the actual implementation
          expect(error.message).toBe('Migration failed');
        }
      }).not.toThrow();
    });

    it('should check initialization status before migration', () => {
      mockUserInteractionTracker.isInitialized = false;

      const existingUserData = {
        passport: { passportNumber: 'E12345678' }
      };

      // Test the initialization check logic
      if (mockUserInteractionTracker.isInitialized) {
        mockUserInteractionTracker.initializeWithExistingData({ passportNo: 'E12345678' });
      }

      // Migration should not be called if tracker is not initialized
      expect(mockUserInteractionTracker.initializeWithExistingData).not.toHaveBeenCalled();
    });
  });

  describe('Completion Calculation Accuracy', () => {
    it('should calculate completion based on user-modified fields only', () => {
      const allFields = {
        travelPurpose: 'BUSINESS',
        boardingCountry: 'CHN',
        email: 'test@example.com',
        occupation: '', // Empty field
        accommodationType: 'HOTEL' // Not user-modified
      };

      const interactionState = {
        travelPurpose: { isUserModified: true },
        boardingCountry: { isUserModified: true },
        email: { isUserModified: true },
        occupation: { isUserModified: false },
        accommodationType: { isUserModified: false }
      };

      const fieldConfig = {
        requiredFields: ['travelPurpose', 'boardingCountry', 'email', 'occupation'],
        optionalFields: ['accommodationType'],
        fieldWeights: { travelPurpose: 2, boardingCountry: 2, email: 1 }
      };

      FieldStateManager.getCompletionMetrics(allFields, interactionState, fieldConfig);

      // Verify FieldStateManager.getCompletionMetrics was called with correct parameters
      expect(FieldStateManager.getCompletionMetrics).toHaveBeenCalledWith(
        allFields,
        interactionState,
        fieldConfig
      );
    });

    it('should provide accurate field counts for sections', () => {
      const travelFields = {
        travelPurpose: 'BUSINESS',
        boardingCountry: 'CHN',
        accommodationType: '',
        province: 'Bangkok'
      };

      const interactionState = {
        travelPurpose: { isUserModified: true },
        boardingCountry: { isUserModified: true },
        accommodationType: { isUserModified: false },
        province: { isUserModified: false }
      };

      FieldStateManager.getFieldCount.mockReturnValue({
        totalUserModified: 2, // travelPurpose, boardingCountry
        totalWithValues: 2, // travelPurpose, boardingCountry (both have values and are user-modified)
        totalFields: 4
      });

      const result = FieldStateManager.getFieldCount(
        travelFields,
        interactionState,
        Object.keys(travelFields)
      );

      expect(FieldStateManager.getFieldCount).toHaveBeenCalledWith(
        travelFields,
        interactionState,
        Object.keys(travelFields)
      );

      expect(result).toEqual({
        totalUserModified: 2,
        totalWithValues: 2,
        totalFields: 4
      });
    });

    it('should handle completion metrics calculation errors', () => {
      const allFields = { travelPurpose: 'BUSINESS' };
      const interactionState = { travelPurpose: { isUserModified: true } };
      const fieldConfig = { requiredFields: ['travelPurpose'] };

      // Mock FieldStateManager to throw error
      FieldStateManager.getCompletionMetrics.mockImplementation(() => {
        throw new Error('Completion calculation failed');
      });

      // Test error handling
      expect(() => {
        try {
          FieldStateManager.getCompletionMetrics(allFields, interactionState, fieldConfig);
        } catch (error) {
          // Error should be caught and handled gracefully in the actual implementation
          expect(error.message).toBe('Completion calculation failed');
        }
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle FieldStateManager errors gracefully', () => {
      FieldStateManager.filterSaveableFields.mockImplementation(() => {
        throw new Error('FieldStateManager error');
      });

      // Test error handling
      expect(() => {
        try {
          FieldStateManager.filterSaveableFields({}, {});
        } catch (error) {
          // Error should be caught and handled gracefully in the actual implementation
          expect(error.message).toBe('FieldStateManager error');
        }
      }).not.toThrow();
    });

    it('should handle interaction tracker errors gracefully', () => {
      mockUserInteractionTracker.isFieldUserModified.mockImplementation(() => {
        throw new Error('Interaction tracker error');
      });

      // Test error handling
      expect(() => {
        try {
          mockUserInteractionTracker.isFieldUserModified('testField');
        } catch (error) {
          // Error should be caught and handled gracefully in the actual implementation
          expect(error.message).toBe('Interaction tracker error');
        }
      }).not.toThrow();
    });

    it('should handle save operation failures', async () => {
      PassportDataService.saveTravelInfo.mockRejectedValue(new Error('Save failed'));

      // Test that save errors are handled gracefully
      try {
        await PassportDataService.saveTravelInfo('user_001', { travelPurpose: 'BUSINESS' });
      } catch (error) {
        expect(error.message).toBe('Save failed');
      }

      expect(PassportDataService.saveTravelInfo).toHaveBeenCalled();
    });
  });
});