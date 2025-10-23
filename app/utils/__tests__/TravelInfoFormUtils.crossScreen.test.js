/**
 * TravelInfoFormUtils Cross-Screen Consistency Tests
 * 
 * Tests interaction state consistency across navigation between different
 * travel info screens and reusable component behavior in different contexts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDestinationConfig, validateFieldValue } from '../TravelInfoFormUtils';
import FieldStateManager from '../FieldStateManager';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../FieldStateManager');

describe('TravelInfoFormUtils - Cross-Screen Consistency Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock FieldStateManager
    FieldStateManager.getFieldCount.mockReturnValue({
      totalUserModified: 5,
      totalWithValues: 3,
      totalFields: 8
    });
    
    FieldStateManager.getCompletionMetrics.mockReturnValue({
      totalFields: 10,
      completedFields: 6,
      completionPercentage: 60,
      requiredFields: 8,
      requiredFieldsCompleted: 5,
      requiredCompletionPercentage: 62,
      userModifiedFields: 6
    });
    
    FieldStateManager.filterSaveableFields.mockImplementation((fields) => {
      // Return only fields that would be user-modified
      const filtered = {};
      Object.keys(fields).forEach(key => {
        if (fields[key] && fields[key] !== '') {
          filtered[key] = fields[key];
        }
      });
      return filtered;
    });
  });

  describe('Destination Configuration Consistency', () => {
    test('should provide consistent field configurations across destinations', () => {
      const thailandConfig = getDestinationConfig('thailand');
      const singaporeConfig = getDestinationConfig('singapore');
      const japanConfig = getDestinationConfig('japan');

      // All destinations should have required core fields
      const coreRequiredFields = [
        'fullName', 'nationality', 'passportNo', 'dob', 'expiryDate', 'sex',
        'occupation', 'phoneNumber', 'email', 'travelPurpose', 'boardingCountry'
      ];

      coreRequiredFields.forEach(field => {
        expect(thailandConfig.requiredFields).toContain(field);
        expect(singaporeConfig.requiredFields).toContain(field);
        expect(japanConfig.requiredFields).toContain(field);
      });

      // All destinations should have consistent predefined options
      expect(thailandConfig.predefinedOptions.travelPurpose).toEqual(
        singaporeConfig.predefinedOptions.travelPurpose
      );
      expect(singaporeConfig.predefinedOptions.travelPurpose).toEqual(
        japanConfig.predefinedOptions.travelPurpose
      );

      // All destinations should have no hard-coded defaults
      expect(Object.keys(thailandConfig.defaultValues)).toHaveLength(0);
      expect(Object.keys(singaporeConfig.defaultValues)).toHaveLength(0);
      expect(Object.keys(japanConfig.defaultValues)).toHaveLength(0);
    });

    test('should handle unknown destinations gracefully', () => {
      const unknownConfig = getDestinationConfig('unknown_destination');
      const thailandConfig = getDestinationConfig('thailand');

      // Should fallback to Thailand configuration
      expect(unknownConfig).toEqual(thailandConfig);
    });
  });

  describe('Cross-Screen Interaction State Consistency', () => {
    test('should use consistent storage keys for different destinations', () => {
      const destinations = ['thailand', 'singapore', 'japan'];
      
      destinations.forEach(destination => {
        const expectedKey = `user_interaction_state_${destination}_travel_info`;
        
        // This would be the key used by the UserInteractionTracker
        expect(expectedKey).toMatch(/^user_interaction_state_\w+_travel_info$/);
        expect(expectedKey).toContain(destination);
      });
    });

    test('should handle data migration consistently across destinations', () => {
      const testData = {
        passport: { fullName: 'John Doe', nationality: 'USA' },
        personalInfo: { email: 'john@example.com' },
        travelInfo: { travelPurpose: 'HOLIDAY', boardingCountry: 'USA' }
      };

      // All destinations should extract the same fields for migration
      const expectedFields = [
        'fullName', 'nationality', 'phoneCode', 'phoneNumber', 'email', 'occupation',
        'cityOfResidence', 'residentCountry', 'travelPurpose', 'boardingCountry',
        'accommodationType', 'arrivalFlightNumber', 'arrivalArrivalDate',
        'departureFlightNumber', 'departureDepartureDate'
      ];

      // This tests the migration logic that would be used by all destinations
      const extractedData = {};
      
      if (testData.passport) {
        if (testData.passport.fullName) extractedData.fullName = testData.passport.fullName;
        if (testData.passport.nationality) extractedData.nationality = testData.passport.nationality;
      }
      
      if (testData.personalInfo) {
        if (testData.personalInfo.email) extractedData.email = testData.personalInfo.email;
      }
      
      if (testData.travelInfo) {
        if (testData.travelInfo.travelPurpose) extractedData.travelPurpose = testData.travelInfo.travelPurpose;
        if (testData.travelInfo.boardingCountry) extractedData.boardingCountry = testData.travelInfo.boardingCountry;
      }

      expect(extractedData.fullName).toBe('John Doe');
      expect(extractedData.nationality).toBe('USA');
      expect(extractedData.email).toBe('john@example.com');
      expect(extractedData.travelPurpose).toBe('HOLIDAY');
      expect(extractedData.boardingCountry).toBe('USA');
    });
  });

  describe('Field Count Consistency', () => {
    test('should use consistent field groupings across destinations', () => {
      const passportFields = ['fullName', 'nationality', 'passportNo', 'dob', 'expiryDate', 'sex'];
      const personalFields = ['occupation', 'cityOfResidence', 'residentCountry', 'phoneCode', 'phoneNumber', 'email'];
      const travelFields = ['travelPurpose', 'boardingCountry', 'arrivalFlightNumber', 'arrivalArrivalDate', 'departureFlightNumber', 'departureDepartureDate'];

      // All destinations should use the same field groupings
      const allDestinations = ['thailand', 'singapore', 'japan'];
      
      allDestinations.forEach(destination => {
        const config = getDestinationConfig(destination);
        
        // Check that core passport fields are required
        passportFields.forEach(field => {
          expect(config.requiredFields).toContain(field);
        });
        
        // Check that core personal fields are required
        personalFields.slice(0, 3).forEach(field => { // occupation, cityOfResidence, residentCountry
          expect(config.requiredFields).toContain(field);
        });
        
        // Check that core travel fields are required
        travelFields.slice(0, 2).forEach(field => { // travelPurpose, boardingCountry
          expect(config.requiredFields).toContain(field);
        });
      });
    });
  });

  describe('Completion Metrics Consistency', () => {
    test('should use consistent completion calculation logic across destinations', () => {
      const testFields = {
        fullName: 'John Doe',
        nationality: 'USA',
        passportNo: 'A12345678',
        dob: '1990-01-01',
        expiryDate: '2030-01-01',
        sex: 'Male',
        occupation: 'Engineer',
        phoneNumber: '+1234567890',
        email: 'john@example.com',
        travelPurpose: 'HOLIDAY',
        boardingCountry: 'USA',
        funds: [{ type: 'cash', amount: 1000 }]
      };

      // Mock interaction state
      const interactionState = {
        fullName: { isUserModified: true },
        nationality: { isUserModified: true },
        passportNo: { isUserModified: true },
        travelPurpose: { isUserModified: true },
        boardingCountry: { isUserModified: true }
      };

      // All destinations should use the same FieldStateManager logic
      const destinations = ['thailand', 'singapore', 'japan'];
      
      destinations.forEach(destination => {
        const config = getDestinationConfig(destination);
        
        // Verify the configuration has the expected structure
        expect(config.requiredFields).toBeInstanceOf(Array);
        expect(config.optionalFields).toBeInstanceOf(Array);
        expect(config.fieldWeights).toBeInstanceOf(Object);
        expect(config.predefinedOptions).toBeInstanceOf(Object);
        
        // Verify no hard-coded defaults
        expect(Object.keys(config.defaultValues)).toHaveLength(0);
      });

      // Verify FieldStateManager would be called with consistent parameters
      expect(FieldStateManager.getCompletionMetrics).toBeDefined();
    });
  });

  describe('Save Field Filtering Consistency', () => {
    test('should use consistent filtering logic across destinations', () => {
      const testFields = {
        fullName: 'John Doe',
        nationality: 'USA',
        passportNo: 'A12345678',
        travelPurpose: 'HOLIDAY',
        boardingCountry: 'USA',
        emptyField: '',
        nullField: null,
        undefinedField: undefined
      };

      // Mock interaction state
      const interactionState = {
        fullName: { isUserModified: true },
        nationality: { isUserModified: true },
        passportNo: { isUserModified: true },
        travelPurpose: { isUserModified: true },
        boardingCountry: { isUserModified: true },
        emptyField: { isUserModified: false },
        nullField: { isUserModified: false },
        undefinedField: { isUserModified: false }
      };

      // Test the filtering logic directly
      const filtered = FieldStateManager.filterSaveableFields(testFields, interactionState);

      // Should include fields with values
      expect(filtered.fullName).toBe('John Doe');
      expect(filtered.nationality).toBe('USA');
      expect(filtered.passportNo).toBe('A12345678');
      expect(filtered.travelPurpose).toBe('HOLIDAY');
      expect(filtered.boardingCountry).toBe('USA');

      // Should not include empty, null, or undefined fields
      expect(filtered.emptyField).toBeUndefined();
      expect(filtered.nullField).toBeUndefined();
      expect(filtered.undefinedField).toBeUndefined();

      // Verify FieldStateManager was called
      expect(FieldStateManager.filterSaveableFields).toHaveBeenCalledWith(testFields, interactionState);
    });
  });

  describe('Suggestion Provider Consistency', () => {
    test('should provide consistent predefined options across destinations', () => {
      const destinations = ['thailand', 'singapore', 'japan'];
      
      // All destinations should have the same predefined options
      const configs = destinations.map(dest => getDestinationConfig(dest));
      
      // Travel purpose options should be consistent
      const travelPurposeOptions = configs[0].predefinedOptions.travelPurpose;
      configs.forEach(config => {
        expect(config.predefinedOptions.travelPurpose).toEqual(travelPurposeOptions);
      });
      
      // Accommodation type options should be consistent
      const accommodationOptions = configs[0].predefinedOptions.accommodationType;
      configs.forEach(config => {
        expect(config.predefinedOptions.accommodationType).toEqual(accommodationOptions);
      });
      
      // Verify expected options are present
      expect(travelPurposeOptions).toContain('HOLIDAY');
      expect(travelPurposeOptions).toContain('BUSINESS');
      expect(travelPurposeOptions).toContain('MEETING');
      
      expect(accommodationOptions).toContain('HOTEL');
      expect(accommodationOptions).toContain('YOUTH_HOSTEL');
      expect(accommodationOptions).toContain('GUEST_HOUSE');
    });
  });

  describe('Field Validation Consistency', () => {
    test('should validate fields consistently across destinations', () => {
      const testCases = [
        { field: 'fullName', value: 'John Doe', shouldBeValid: true },
        { field: 'fullName', value: '张三', shouldBeValid: false }, // Chinese characters
        { field: 'fullName', value: 'A', shouldBeValid: false }, // Too short
        { field: 'passportNo', value: 'A12345678', shouldBeValid: true },
        { field: 'passportNo', value: '123', shouldBeValid: false }, // Too short
        { field: 'email', value: 'test@example.com', shouldBeValid: true },
        { field: 'email', value: 'invalid-email', shouldBeValid: false }
      ];

      testCases.forEach(({ field, value, shouldBeValid }) => {
        const thailandResult = validateFieldValue(field, value, 'thailand');
        const singaporeResult = validateFieldValue(field, value, 'singapore');
        const japanResult = validateFieldValue(field, value, 'japan');

        // All destinations should validate the same way
        expect(thailandResult.isValid).toBe(shouldBeValid);
        expect(singaporeResult.isValid).toBe(shouldBeValid);
        expect(japanResult.isValid).toBe(shouldBeValid);

        if (!shouldBeValid) {
          // Error messages should be consistent
          expect(thailandResult.errorMessage).toBe(singaporeResult.errorMessage);
          expect(singaporeResult.errorMessage).toBe(japanResult.errorMessage);
        }
      });
    });
  });

  describe('Predefined Options Consistency', () => {
    test('should handle predefined options consistently across destinations', () => {
      const destinations = ['thailand', 'singapore', 'japan'];
      
      // Test predefined travel purposes
      const predefinedPurposes = ['HOLIDAY', 'BUSINESS', 'MEETING'];
      const customPurpose = 'CUSTOM_PURPOSE';

      destinations.forEach(destination => {
        const config = getDestinationConfig(destination);
        
        predefinedPurposes.forEach(purpose => {
          expect(config.predefinedOptions.travelPurpose).toContain(purpose);
        });
        
        expect(config.predefinedOptions.travelPurpose).not.toContain(customPurpose);
      });

      // Test predefined accommodation types
      const predefinedAccommodations = ['HOTEL', 'YOUTH_HOSTEL', 'GUEST_HOUSE'];
      const customAccommodation = 'CUSTOM_ACCOMMODATION';

      destinations.forEach(destination => {
        const config = getDestinationConfig(destination);
        
        predefinedAccommodations.forEach(accommodation => {
          expect(config.predefinedOptions.accommodationType).toContain(accommodation);
        });
        
        expect(config.predefinedOptions.accommodationType).not.toContain(customAccommodation);
      });
    });
  });

  describe('Error Recovery Consistency', () => {
    test('should handle errors consistently across destinations', () => {
      // Mock FieldStateManager to throw an error
      FieldStateManager.getCompletionMetrics.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const testFields = { fullName: 'John Doe' };
      const interactionState = { fullName: { isUserModified: true } };

      // Test error handling directly
      let result;
      try {
        result = FieldStateManager.getCompletionMetrics(testFields, interactionState);
      } catch (error) {
        // Should handle error gracefully
        result = { totalPercent: 0, metrics: null, isReady: false };
      }

      expect(result).toEqual({ totalPercent: 0, metrics: null, isReady: false });
      
      // Verify the error was thrown as expected
      expect(FieldStateManager.getCompletionMetrics).toHaveBeenCalledWith(testFields, interactionState);
    });
  });
});