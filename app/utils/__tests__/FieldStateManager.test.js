/**
 * FieldStateManager.test.js - Tests for field state management utility
 * Tests the core functionality of filtering fields and calculating completion metrics
 * 
 * Requirements: 1.3, 3.4, 5.1, 5.2
 */

import FieldStateManager from '../FieldStateManager';

describe('FieldStateManager', () => {
  describe('shouldSaveField', () => {
    test('should save user-modified fields with values', () => {
      const result = FieldStateManager.shouldSaveField('testField', 'testValue', true);
      expect(result).toBe(true);
    });

    test('should save user-modified fields even with empty values', () => {
      const result = FieldStateManager.shouldSaveField('testField', '', true);
      expect(result).toBe(true);
    });

    test('should not save non-user-modified empty fields', () => {
      const result = FieldStateManager.shouldSaveField('testField', '', false);
      expect(result).toBe(false);
    });

    test('should save non-user-modified fields with values when preserveExisting is true', () => {
      const result = FieldStateManager.shouldSaveField('testField', 'existingValue', false, {
        preserveExisting: true
      });
      expect(result).toBe(true);
    });

    test('should not save non-user-modified fields when preserveExisting is false', () => {
      const result = FieldStateManager.shouldSaveField('testField', 'existingValue', false, {
        preserveExisting: false
      });
      expect(result).toBe(false);
    });

    test('should always save fields in alwaysSaveFields list', () => {
      const result = FieldStateManager.shouldSaveField('alwaysField', '', false, {
        alwaysSaveFields: ['alwaysField']
      });
      expect(result).toBe(true);
    });

    test('should handle null and undefined values correctly', () => {
      expect(FieldStateManager.shouldSaveField('field1', null, false)).toBe(false);
      expect(FieldStateManager.shouldSaveField('field2', undefined, false)).toBe(false);
      expect(FieldStateManager.shouldSaveField('field3', null, true)).toBe(true);
      expect(FieldStateManager.shouldSaveField('field4', undefined, true)).toBe(true);
    });
  });

  describe('filterSaveableFields', () => {
    test('should filter fields based on user interaction state', () => {
      const allFields = {
        userModifiedField: 'value1',
        nonModifiedField: 'value2',
        emptyUserModified: '',
        emptyNonModified: ''
      };

      const interactionState = {
        userModifiedField: { isUserModified: true },
        emptyUserModified: { isUserModified: true }
      };

      const result = FieldStateManager.filterSaveableFields(allFields, interactionState);

      expect(result).toEqual({
        userModifiedField: 'value1',
        nonModifiedField: 'value2', // Preserved due to default preserveExisting: true
        emptyUserModified: ''
      });
    });

    test('should respect preserveExisting option', () => {
      const allFields = {
        userModifiedField: 'value1',
        nonModifiedField: 'value2'
      };

      const interactionState = {
        userModifiedField: { isUserModified: true }
      };

      const result = FieldStateManager.filterSaveableFields(allFields, interactionState, {
        preserveExisting: false
      });

      expect(result).toEqual({
        userModifiedField: 'value1'
      });
    });

    test('should include alwaysSaveFields', () => {
      const allFields = {
        userModifiedField: 'value1',
        alwaysField: 'value2',
        normalField: 'value3'
      };

      const interactionState = {
        userModifiedField: { isUserModified: true }
      };

      const result = FieldStateManager.filterSaveableFields(allFields, interactionState, {
        alwaysSaveFields: ['alwaysField'],
        preserveExisting: false
      });

      expect(result).toEqual({
        userModifiedField: 'value1',
        alwaysField: 'value2'
      });
    });

    test('should handle invalid input gracefully', () => {
      expect(FieldStateManager.filterSaveableFields(null, {})).toEqual({});
      expect(FieldStateManager.filterSaveableFields(undefined, {})).toEqual({});
      expect(FieldStateManager.filterSaveableFields('invalid', {})).toEqual({});
    });

    test('should handle empty interaction state', () => {
      const allFields = {
        field1: 'value1',
        field2: 'value2'
      };

      const result = FieldStateManager.filterSaveableFields(allFields, {});

      // Should preserve existing values by default
      expect(result).toEqual(allFields);
    });
  });

  describe('getCompletionMetrics', () => {
    test('should calculate basic completion metrics', () => {
      const fields = {
        field1: 'value1',
        field2: 'value2',
        field3: '',
        field4: 'value4'
      };

      const interactionState = {
        field1: { isUserModified: true },
        field2: { isUserModified: true },
        field3: { isUserModified: true },
        field4: { isUserModified: false }
      };

      const result = FieldStateManager.getCompletionMetrics(fields, interactionState);

      expect(result.totalFields).toBe(4);
      expect(result.completedFields).toBe(2); // field1 and field2 have values and are user-modified
      expect(result.completionPercentage).toBe(50);
      expect(result.userModifiedFields).toBe(3);
    });

    test('should handle required and optional fields', () => {
      const fields = {
        requiredField1: 'value1',
        requiredField2: '',
        optionalField1: 'value3',
        optionalField2: ''
      };

      const interactionState = {
        requiredField1: { isUserModified: true },
        requiredField2: { isUserModified: true },
        optionalField1: { isUserModified: true }
      };

      const fieldConfig = {
        requiredFields: ['requiredField1', 'requiredField2'],
        optionalFields: ['optionalField1', 'optionalField2']
      };

      const result = FieldStateManager.getCompletionMetrics(fields, interactionState, fieldConfig);

      expect(result.requiredFields).toBe(2);
      expect(result.requiredFieldsCompleted).toBe(1); // Only requiredField1 has value and is modified
      expect(result.requiredCompletionPercentage).toBe(50);
      expect(result.optionalFields).toBe(2);
      expect(result.optionalFieldsCompleted).toBe(1); // optionalField1
    });

    test('should handle weighted completion', () => {
      const fields = {
        importantField: 'value1',
        normalField: 'value2',
        minorField: ''
      };

      const interactionState = {
        importantField: { isUserModified: true },
        normalField: { isUserModified: true },
        minorField: { isUserModified: true }
      };

      const fieldConfig = {
        fieldWeights: {
          importantField: 3,
          normalField: 1,
          minorField: 1
        }
      };

      const result = FieldStateManager.getCompletionMetrics(fields, interactionState, fieldConfig);

      expect(result.weightedCompletionPercentage).toBe(80); // (3+1)/(3+1+1) * 100
    });

    test('should handle empty fields and interaction state', () => {
      const result = FieldStateManager.getCompletionMetrics({}, {});

      expect(result.totalFields).toBe(0);
      expect(result.completedFields).toBe(0);
      expect(result.completionPercentage).toBe(0);
      expect(result.requiredCompletionPercentage).toBe(100); // No required fields = 100%
    });

    test('should only count user-modified fields', () => {
      const fields = {
        userField: 'value1',
        systemField: 'value2', // Has value but not user-modified
        emptyUserField: ''
      };

      const interactionState = {
        userField: { isUserModified: true },
        emptyUserField: { isUserModified: true }
      };

      const result = FieldStateManager.getCompletionMetrics(fields, interactionState);

      expect(result.totalFields).toBe(3); // systemField counted due to having value
      expect(result.completedFields).toBe(1); // Only userField has value AND is user-modified
      expect(result.userModifiedFields).toBe(2);
    });
  });

  describe('getFieldCount', () => {
    test('should count user-modified fields correctly', () => {
      const fields = {
        field1: 'value1',
        field2: '',
        field3: 'value3',
        field4: null
      };

      const interactionState = {
        field1: { isUserModified: true },
        field2: { isUserModified: true },
        field3: { isUserModified: false }
      };

      const result = FieldStateManager.getFieldCount(fields, interactionState);

      expect(result.totalUserModified).toBe(2); // field1 and field2
      expect(result.totalWithValues).toBe(1); // Only field1 has value and is user-modified
      expect(result.totalFields).toBe(4);
    });

    test('should count specific fields when provided', () => {
      const fields = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      };

      const interactionState = {
        field1: { isUserModified: true },
        field2: { isUserModified: true },
        field3: { isUserModified: false }
      };

      const result = FieldStateManager.getFieldCount(fields, interactionState, ['field1', 'field2']);

      expect(result.totalUserModified).toBe(2);
      expect(result.totalWithValues).toBe(2);
      expect(result.totalFields).toBe(2);
    });
  });

  describe('validateInteractionState', () => {
    test('should validate correct interaction state', () => {
      const interactionState = {
        field1: {
          isUserModified: true,
          lastModified: '2024-01-01T00:00:00.000Z',
          initialValue: 'test'
        },
        field2: {
          isUserModified: false,
          lastModified: '2024-01-01T00:00:00.000Z'
        }
      };

      const result = FieldStateManager.validateInteractionState(interactionState);

      expect(result.isValid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.validatedState).toEqual(interactionState);
    });

    test('should detect invalid interaction state structure', () => {
      const result = FieldStateManager.validateInteractionState(null);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Interaction state is not a valid object');
      expect(result.validatedState).toEqual({});
    });

    test('should detect invalid field states', () => {
      const interactionState = {
        validField: {
          isUserModified: true,
          lastModified: '2024-01-01T00:00:00.000Z'
        },
        invalidField1: null,
        invalidField2: {
          isUserModified: 'not-boolean'
        },
        invalidField3: {
          isUserModified: true,
          lastModified: 'invalid-date'
        }
      };

      const result = FieldStateManager.validateInteractionState(interactionState);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid field state for invalidField1');
      expect(result.issues).toContain('Invalid isUserModified for invalidField2');
      expect(result.issues).toContain('Invalid date format for lastModified in invalidField3');
      expect(result.validatedState.validField).toBeDefined();
    });

    test('should add default lastModified when missing', () => {
      const interactionState = {
        field1: {
          isUserModified: true
        }
      };

      const result = FieldStateManager.validateInteractionState(interactionState);

      expect(result.isValid).toBe(true);
      expect(result.validatedState.field1.lastModified).toBeDefined();
      expect(new Date(result.validatedState.field1.lastModified)).toBeInstanceOf(Date);
    });
  });

  describe('mergeInteractionStates', () => {
    test('should merge interaction states with primary preference', () => {
      const primaryState = {
        field1: {
          isUserModified: true,
          lastModified: '2024-01-02T00:00:00.000Z',
          initialValue: 'primary'
        },
        field2: {
          isUserModified: true,
          lastModified: '2024-01-01T00:00:00.000Z',
          initialValue: 'primary2'
        }
      };

      const secondaryState = {
        field1: {
          isUserModified: false,
          lastModified: '2024-01-01T00:00:00.000Z',
          initialValue: 'secondary'
        },
        field3: {
          isUserModified: true,
          lastModified: '2024-01-01T00:00:00.000Z',
          initialValue: 'secondary3'
        }
      };

      const result = FieldStateManager.mergeInteractionStates(primaryState, secondaryState, {
        preferPrimary: true
      });

      expect(result.field1.initialValue).toBe('primary');
      expect(result.field2.initialValue).toBe('primary2');
      expect(result.field3.initialValue).toBe('secondary3');
    });

    test('should merge based on most recent modification when not preferring primary', () => {
      const primaryState = {
        field1: {
          isUserModified: true,
          lastModified: '2024-01-01T00:00:00.000Z',
          initialValue: 'primary'
        }
      };

      const secondaryState = {
        field1: {
          isUserModified: true,
          lastModified: '2024-01-02T00:00:00.000Z',
          initialValue: 'secondary'
        }
      };

      const result = FieldStateManager.mergeInteractionStates(primaryState, secondaryState, {
        preferPrimary: false
      });

      expect(result.field1.initialValue).toBe('secondary'); // More recent
    });

    test('should handle empty states', () => {
      const result = FieldStateManager.mergeInteractionStates({}, {});
      expect(result).toEqual({});
    });
  });

  describe('error handling and recovery', () => {
    test('should handle corrupted interaction state gracefully', () => {
      const allFields = {
        field1: 'value1',
        field2: 'value2'
      };

      const corruptedState = {
        field1: null,
        field2: 'not-an-object',
        field3: {
          isUserModified: 'not-boolean'
        }
      };

      // Should not throw and should return fallback behavior
      const result = FieldStateManager.filterSaveableFields(allFields, corruptedState);
      expect(result).toEqual(allFields); // Falls back to preserving existing
    });

    test('should recover from validateAndRecoverInteractionState errors', () => {
      const corruptedState = {
        validField: {
          isUserModified: true,
          lastModified: '2024-01-01T00:00:00.000Z'
        },
        invalidField: null,
        corruptedField: {
          isUserModified: 'not-boolean',
          lastModified: 'invalid-date'
        }
      };

      const recovered = FieldStateManager.validateAndRecoverInteractionState(corruptedState);

      expect(recovered.validField).toEqual({
        isUserModified: true,
        lastModified: '2024-01-01T00:00:00.000Z',
        initialValue: undefined
      });

      expect(recovered.invalidField).toBeUndefined();
      
      expect(recovered.corruptedField).toEqual({
        isUserModified: false, // Recovered to safe default
        lastModified: expect.any(String), // Should be current timestamp
        initialValue: undefined
      });
    });

    test('should handle null/undefined interaction states', () => {
      const allFields = { field1: 'value1' };

      expect(FieldStateManager.filterSaveableFields(allFields, null)).toEqual(allFields);
      expect(FieldStateManager.filterSaveableFields(allFields, undefined)).toEqual(allFields);
      
      const metrics = FieldStateManager.getCompletionMetrics(allFields, {});
      expect(metrics.completionPercentage).toBeGreaterThanOrEqual(0);
    });

    test('should handle invalid field values gracefully', () => {
      const fieldsWithInvalidValues = {
        normalField: 'value',
        nullField: null,
        undefinedField: undefined,
        functionField: () => {},
        symbolField: Symbol('test')
      };

      const interactionState = {
        normalField: { isUserModified: true },
        nullField: { isUserModified: true },
        undefinedField: { isUserModified: true },
        functionField: { isUserModified: true },
        symbolField: { isUserModified: true }
      };

      // Should not throw errors
      const result = FieldStateManager.filterSaveableFields(fieldsWithInvalidValues, interactionState);
      expect(result.normalField).toBe('value');
      expect(result.nullField).toBe(null);
      expect(result.undefinedField).toBe(undefined);
    });

    test('should handle circular references in field values', () => {
      const circularObj = { name: 'test' };
      circularObj.self = circularObj;

      const fields = {
        normalField: 'value',
        circularField: circularObj
      };

      const interactionState = {
        normalField: { isUserModified: true },
        circularField: { isUserModified: true }
      };

      // Should not throw errors even with circular references
      const result = FieldStateManager.filterSaveableFields(fields, interactionState);
      expect(result.normalField).toBe('value');
      expect(result.circularField).toBe(circularObj);
    });

    test('should handle errors in field processing gracefully', () => {
      const allFields = {
        normalField: 'value1',
        problematicField: 'value2'
      };

      // Mock a scenario where field processing might fail
      const interactionState = {
        normalField: { isUserModified: true },
        problematicField: { isUserModified: true }
      };

      const options = {
        alwaysSaveFields: ['problematicField'] // Ensure critical field is saved even on error
      };

      const result = FieldStateManager.filterSaveableFields(allFields, interactionState, options);
      expect(result.normalField).toBe('value1');
      expect(result.problematicField).toBe('value2');
    });

    test('should handle mergeInteractionStates with corrupted data', () => {
      const validState = {
        field1: {
          isUserModified: true,
          lastModified: '2024-01-01T00:00:00.000Z'
        }
      };

      const corruptedState = {
        field2: null,
        field3: 'not-an-object'
      };

      const result = FieldStateManager.mergeInteractionStates(validState, corruptedState);
      
      expect(result.field1).toEqual(validState.field1);
      expect(result.field2).toBeUndefined();
      expect(result.field3).toBeUndefined();
    });

    test('should handle completion metrics with corrupted interaction state', () => {
      const fields = {
        field1: 'value1',
        field2: 'value2'
      };

      const corruptedState = {
        field1: null,
        field2: { isUserModified: 'not-boolean' }
      };

      // Should not throw and should provide reasonable defaults
      const metrics = FieldStateManager.getCompletionMetrics(fields, corruptedState);
      
      expect(metrics.totalFields).toBeGreaterThanOrEqual(0);
      expect(metrics.completedFields).toBeGreaterThanOrEqual(0);
      expect(metrics.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.completionPercentage).toBeLessThanOrEqual(100);
    });

    test('should handle validateInteractionState with deeply nested corruption', () => {
      const deeplyCorrupted = {
        field1: {
          isUserModified: true,
          lastModified: {
            nested: 'should-be-string'
          },
          initialValue: {
            deeply: {
              nested: 'value'
            }
          }
        }
      };

      const result = FieldStateManager.validateInteractionState(deeplyCorrupted);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.validatedState).toEqual({});
    });

    test('should gracefully degrade when all operations fail', () => {
      // Simulate complete system failure
      const invalidFields = null;
      const invalidState = undefined;
      const invalidConfig = 'not-an-object';

      // Should return safe defaults instead of throwing
      expect(FieldStateManager.filterSaveableFields(invalidFields, invalidState)).toEqual({});
      expect(FieldStateManager.getCompletionMetrics({}, {}, invalidConfig)).toEqual(
        expect.objectContaining({
          totalFields: 0,
          completedFields: 0,
          completionPercentage: 0
        })
      );
    });
  });

  describe('edge cases', () => {
    test('should handle fields with complex values', () => {
      const fields = {
        arrayField: ['item1', 'item2'],
        objectField: { nested: 'value' },
        numberField: 42,
        booleanField: true,
        dateField: new Date('2024-01-01')
      };

      const interactionState = {
        arrayField: { isUserModified: true },
        objectField: { isUserModified: true },
        numberField: { isUserModified: true },
        booleanField: { isUserModified: true },
        dateField: { isUserModified: true }
      };

      const result = FieldStateManager.filterSaveableFields(fields, interactionState);
      expect(result).toEqual(fields);

      const metrics = FieldStateManager.getCompletionMetrics(fields, interactionState);
      expect(metrics.completedFields).toBe(5);
    });

    test('should handle very large field sets efficiently', () => {
      const fields = {};
      const interactionState = {};

      // Create 1000 fields
      for (let i = 0; i < 1000; i++) {
        fields[`field${i}`] = `value${i}`;
        if (i % 2 === 0) {
          interactionState[`field${i}`] = { isUserModified: true };
        }
      }

      const startTime = Date.now();
      const result = FieldStateManager.filterSaveableFields(fields, interactionState);
      const endTime = Date.now();

      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});