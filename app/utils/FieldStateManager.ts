/**
 * FieldStateManager Utility Class
 * 
 * Manages field state and determines which fields should be saved based on user interaction.
 * Provides filtering logic for save operations and accurate completion metrics calculation.
 */

export interface InteractionFieldState {
  isUserModified: boolean;
  lastModified?: string;
  initialValue?: unknown;
}

export interface InteractionState {
  [fieldName: string]: InteractionFieldState;
}

interface SaveOptions {
  preserveExisting?: boolean;
  alwaysSaveFields?: string[];
}

interface FieldConfig {
  requiredFields?: string[];
  optionalFields?: string[];
  fieldWeights?: Record<string, number>;
}

interface CompletionMetrics {
  totalFields: number;
  completedFields: number;
  completionPercentage: number;
  weightedCompletionPercentage: number;
  requiredFields: number;
  requiredFieldsCompleted: number;
  requiredCompletionPercentage: number;
  optionalFields: number;
  optionalFieldsCompleted: number;
  userModifiedFields: number;
}

interface FieldCount {
  totalUserModified: number;
  totalWithValues: number;
  totalFields: number;
}

interface MergeOptions {
  preferPrimary?: boolean;
}

class FieldStateManager {
  static shouldSaveField(fieldName: string, value: unknown, isUserModified: boolean, options: SaveOptions = {}): boolean {
    const { preserveExisting = true, alwaysSaveFields = [] } = options;

    if (alwaysSaveFields.includes(fieldName)) {
      return true;
    }

    if (value === null || value === undefined || value === '') {
      return isUserModified;
    }

    if (isUserModified) {
      return true;
    }

    if (preserveExisting && value !== null && value !== undefined && value !== '') {
      return true;
    }

    return false;
  }

  static filterSaveableFields(allFields: Record<string, unknown>, interactionState: InteractionState, options: SaveOptions = {}): Record<string, unknown> {
    try {
      if (!allFields || typeof allFields !== 'object') {
        console.warn('Invalid allFields provided to filterSaveableFields');
        return {};
      }

      const validatedState = this.validateAndRecoverInteractionState(interactionState);
      const saveableFields: Record<string, unknown> = {};

      Object.keys(allFields).forEach(fieldName => {
        try {
          const value = allFields[fieldName];
          const isUserModified = validatedState[fieldName]?.isUserModified || false;

          if (this.shouldSaveField(fieldName, value, isUserModified, options)) {
            saveableFields[fieldName] = value;
          }
        } catch (fieldError) {
          console.warn(`Error processing field ${fieldName} in filterSaveableFields:`, fieldError);
          
          if (options.alwaysSaveFields && options.alwaysSaveFields.includes(fieldName)) {
            saveableFields[fieldName] = allFields[fieldName];
          }
        }
      });

      return saveableFields;
    } catch (error) {
      console.error('Error in filterSaveableFields:', error);
      return allFields || {};
    }
  }

  static getCompletionMetrics(fields: Record<string, unknown>, interactionState: InteractionState, fieldConfig: FieldConfig = {}): CompletionMetrics {
    const {
      requiredFields = [],
      optionalFields = [],
      fieldWeights = {}
    } = fieldConfig;

    const allRelevantFields = [...requiredFields, ...optionalFields];
    
    const fieldsToConsider = allRelevantFields.length > 0 
      ? allRelevantFields 
      : Object.keys(fields);

    let totalFields = 0;
    let completedFields = 0;
    let totalWeight = 0;
    let completedWeight = 0;

    fieldsToConsider.forEach(fieldName => {
      const value = fields[fieldName];
      const isUserModified = interactionState[fieldName]?.isUserModified || false;
      const fieldWeight = fieldWeights[fieldName] || 1;

      const hasValue = value !== null && value !== undefined && value !== '';
      const shouldCount = isUserModified || hasValue;

      if (shouldCount || requiredFields.includes(fieldName)) {
        totalFields++;
        totalWeight += fieldWeight;

        if (hasValue && isUserModified) {
          completedFields++;
          completedWeight += fieldWeight;
        }
      }
    });

    const completionPercentage = totalFields > 0 
      ? Math.round((completedFields / totalFields) * 100) 
      : 0;

    const weightedCompletionPercentage = totalWeight > 0 
      ? Math.round((completedWeight / totalWeight) * 100) 
      : 0;

    const requiredFieldsCompleted = requiredFields.filter(fieldName => {
      const value = fields[fieldName];
      const isUserModified = interactionState[fieldName]?.isUserModified || false;
      const hasValue = value !== null && value !== undefined && value !== '';
      return hasValue && isUserModified;
    }).length;

    const requiredCompletionPercentage = requiredFields.length > 0 
      ? Math.round((requiredFieldsCompleted / requiredFields.length) * 100) 
      : 100;

    return {
      totalFields,
      completedFields,
      completionPercentage,
      weightedCompletionPercentage,
      requiredFields: requiredFields.length,
      requiredFieldsCompleted,
      requiredCompletionPercentage,
      optionalFields: optionalFields.length,
      optionalFieldsCompleted: completedFields - requiredFieldsCompleted,
      userModifiedFields: Object.keys(interactionState).filter(
        (fieldName: string) => interactionState[fieldName]?.isUserModified
      ).length
    };
  }

  static getFieldCount(fields: Record<string, unknown>, interactionState: InteractionState, fieldsToCount: string[] | null = null): FieldCount {
    const fieldsToCheck = fieldsToCount || Object.keys(fields);
    
    let totalUserModified = 0;
    let totalWithValues = 0;

    fieldsToCheck.forEach(fieldName => {
      const value = fields[fieldName];
      const isUserModified = interactionState[fieldName]?.isUserModified || false;
      const hasValue = value !== null && value !== undefined && value !== '';

      if (isUserModified) {
        totalUserModified++;
      }

      if (hasValue) {
        totalWithValues++;
      }
    });

    return {
      totalUserModified,
      totalWithValues,
      totalFields: fieldsToCheck.length
    };
  }

  static validateInteractionState(interactionState: InteractionState): { isValid: boolean; issues: string[]; validatedState: InteractionState } {
    const issues: string[] = [];
    const validatedState: InteractionState = {};

    if (!interactionState || typeof interactionState !== 'object') {
      return {
        isValid: false,
        issues: ['Interaction state is not a valid object'],
        validatedState: {}
      };
    }

    Object.keys(interactionState).forEach(fieldName => {
      const fieldState = interactionState[fieldName];

      if (!fieldState || typeof fieldState !== 'object') {
        issues.push(`Invalid field state for ${fieldName}`);
        return;
      }

      const {
        isUserModified,
        lastModified,
        initialValue
      } = fieldState;

      if (typeof isUserModified !== 'boolean') {
        issues.push(`Invalid isUserModified for ${fieldName}`);
        return;
      }

      if (lastModified && typeof lastModified !== 'string') {
        issues.push(`Invalid lastModified for ${fieldName}`);
        return;
      }

      if (lastModified) {
        const date = new Date(lastModified);
        if (isNaN(date.getTime())) {
          issues.push(`Invalid date format for lastModified in ${fieldName}`);
          return;
        }
      }

      validatedState[fieldName] = {
        isUserModified,
        lastModified: lastModified || new Date().toISOString(),
        initialValue
      };
    });

    return {
      isValid: issues.length === 0,
      issues,
      validatedState
    };
  }

  static validateAndRecoverInteractionState(interactionState: InteractionState): InteractionState {
    try {
      if (!interactionState || typeof interactionState !== 'object') {
        console.warn('Invalid interaction state, initializing empty state');
        return {};
      }

      const recoveredState: InteractionState = {};
      let hasRecovery = false;

      Object.keys(interactionState).forEach(fieldName => {
        try {
          const fieldState = interactionState[fieldName];

          if (!fieldState || typeof fieldState !== 'object') {
            console.warn(`Invalid field state for ${fieldName}, skipping`);
            hasRecovery = true;
            return;
          }

          const recoveredFieldState: InteractionFieldState = {
            isUserModified: typeof fieldState.isUserModified === 'boolean' 
              ? fieldState.isUserModified 
              : false,
            lastModified: fieldState.lastModified || new Date().toISOString(),
            initialValue: fieldState.initialValue
          };

          if (fieldState.lastModified) {
            const date = new Date(fieldState.lastModified);
            if (isNaN(date.getTime())) {
              console.warn(`Invalid date format for ${fieldName}, using current time`);
              recoveredFieldState.lastModified = new Date().toISOString();
              hasRecovery = true;
            }
          }

          recoveredState[fieldName] = recoveredFieldState;
        } catch (fieldError) {
          console.warn(`Error recovering field state for ${fieldName}:`, fieldError);
          hasRecovery = true;
        }
      });

      if (hasRecovery) {
        console.warn('Interaction state recovery performed');
      }

      return recoveredState;
    } catch (error) {
      console.error('Error in validateAndRecoverInteractionState:', error);
      return {};
    }
  }

  static mergeInteractionStates(primaryState: InteractionState, secondaryState: InteractionState, options: MergeOptions = {}): InteractionState {
    try {
      const { preferPrimary = true } = options;
      
      const validPrimaryState = this.validateAndRecoverInteractionState(primaryState);
      const validSecondaryState = this.validateAndRecoverInteractionState(secondaryState);
      
      const merged: InteractionState = { ...validSecondaryState };

      Object.keys(validPrimaryState).forEach(fieldName => {
        try {
          const primaryField = validPrimaryState[fieldName];
          const secondaryField = validSecondaryState[fieldName];

          if (!secondaryField || preferPrimary) {
            merged[fieldName] = primaryField;
          } else {
            const primaryDate = new Date(primaryField.lastModified || 0);
            const secondaryDate = new Date(secondaryField.lastModified || 0);

            merged[fieldName] = primaryDate > secondaryDate ? primaryField : secondaryField;
          }
        } catch (fieldError) {
          console.warn(`Error merging field ${fieldName}:`, fieldError);
          merged[fieldName] = validPrimaryState[fieldName];
        }
      });

      return merged;
    } catch (error) {
      console.error('Error in mergeInteractionStates:', error);
      return primaryState || secondaryState || {};
    }
  }
}

export default FieldStateManager;
