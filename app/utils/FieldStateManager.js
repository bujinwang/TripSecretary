/**
 * FieldStateManager Utility Class
 * 
 * Manages field state and determines which fields should be saved based on user interaction.
 * Provides filtering logic for save operations and accurate completion metrics calculation.
 * 
 * Features:
 * - Filters fields based on user interaction state
 * - Processes save payloads to include only user-modified fields
 * - Calculates completion metrics based on actual user input
 * - Handles special cases for different field types
 */

/**
 * FieldStateManager Class
 */
class FieldStateManager {
  /**
   * Determine if a field should be saved based on user interaction
   * 
   * @param {string} fieldName - Name of the field
   * @param {any} value - Current value of the field
   * @param {boolean} isUserModified - Whether the field has been user-modified
   * @param {Object} options - Additional options for save logic
   * @param {boolean} options.preserveExisting - Whether to preserve existing saved values
   * @param {Array<string>} options.alwaysSaveFields - Fields that should always be saved
   * @returns {boolean} True if field should be saved
   */
  static shouldSaveField(fieldName, value, isUserModified, options = {}) {
    const { preserveExisting = true, alwaysSaveFields = [] } = options;

    // Always save fields that are explicitly marked as always-save
    if (alwaysSaveFields.includes(fieldName)) {
      return true;
    }

    // Don't save empty or null values unless user explicitly modified them
    if (value === null || value === undefined || value === '') {
      return isUserModified;
    }

    // Save if user has modified the field
    if (isUserModified) {
      return true;
    }

    // If preserveExisting is true and we have a value, it might be existing data
    // In this case, we should save it to maintain backward compatibility
    if (preserveExisting && value !== null && value !== undefined && value !== '') {
      return true;
    }

    // Default: don't save fields that haven't been user-modified
    return false;
  }

  /**
   * Filter fields to include only those that should be saved with error recovery
   * 
   * @param {Object} allFields - Object containing all field values
   * @param {Object} interactionState - User interaction state from UserInteractionTracker
   * @param {Object} options - Additional options for filtering
   * @param {Array<string>} options.alwaysSaveFields - Fields that should always be saved
   * @param {boolean} options.preserveExisting - Whether to preserve existing saved values
   * @returns {Object} Filtered object containing only saveable fields
   */
  static filterSaveableFields(allFields, interactionState, options = {}) {
    try {
      if (!allFields || typeof allFields !== 'object') {
        console.warn('Invalid allFields provided to filterSaveableFields');
        return {};
      }

      // Validate and recover interaction state if needed
      const validatedState = this.validateAndRecoverInteractionState(interactionState);
      const saveableFields = {};

      Object.keys(allFields).forEach(fieldName => {
        try {
          const value = allFields[fieldName];
          const isUserModified = validatedState[fieldName]?.isUserModified || false;

          if (this.shouldSaveField(fieldName, value, isUserModified, options)) {
            saveableFields[fieldName] = value;
          }
        } catch (fieldError) {
          console.warn(`Error processing field ${fieldName} in filterSaveableFields:`, fieldError);
          
          // For critical fields, include them in save to prevent data loss
          if (options.alwaysSaveFields && options.alwaysSaveFields.includes(fieldName)) {
            saveableFields[fieldName] = allFields[fieldName];
          }
        }
      });

      return saveableFields;
    } catch (error) {
      console.error('Error in filterSaveableFields:', error);
      
      // Fallback: return all fields to prevent data loss
      return allFields || {};
    }
  }

  /**
   * Calculate completion metrics based on user-modified fields
   * 
   * @param {Object} fields - Object containing all field values
   * @param {Object} interactionState - User interaction state from UserInteractionTracker
   * @param {Object} fieldConfig - Configuration for field requirements
   * @param {Array<string>} fieldConfig.requiredFields - List of required field names
   * @param {Array<string>} fieldConfig.optionalFields - List of optional field names
   * @param {Object} fieldConfig.fieldWeights - Weights for different fields (optional)
   * @returns {Object} Completion metrics object
   */
  static getCompletionMetrics(fields, interactionState, fieldConfig = {}) {
    const {
      requiredFields = [],
      optionalFields = [],
      fieldWeights = {}
    } = fieldConfig;

    // Get all fields that should be considered for completion
    const allRelevantFields = [...requiredFields, ...optionalFields];
    
    // If no field configuration provided, consider all fields as optional
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

      // Only count fields that have been user-modified or have meaningful values
      const hasValue = value !== null && value !== undefined && value !== '';
      const shouldCount = isUserModified || hasValue;

      if (shouldCount || requiredFields.includes(fieldName)) {
        totalFields++;
        totalWeight += fieldWeight;

        // Field is complete if it has a value and was user-modified
        if (hasValue && isUserModified) {
          completedFields++;
          completedWeight += fieldWeight;
        }
      }
    });

    // Calculate percentages
    const completionPercentage = totalFields > 0 
      ? Math.round((completedFields / totalFields) * 100) 
      : 0;

    const weightedCompletionPercentage = totalWeight > 0 
      ? Math.round((completedWeight / totalWeight) * 100) 
      : 0;

    // Calculate required field completion
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
        fieldName => interactionState[fieldName]?.isUserModified
      ).length
    };
  }

  /**
   * Get field count for display purposes (only user-modified fields)
   * 
   * @param {Object} fields - Object containing all field values
   * @param {Object} interactionState - User interaction state from UserInteractionTracker
   * @param {Array<string>} fieldsToCount - Specific fields to count (optional)
   * @returns {Object} Field count information
   */
  static getFieldCount(fields, interactionState, fieldsToCount = null) {
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

      if (hasValue && isUserModified) {
        totalWithValues++;
      }
    });

    return {
      totalUserModified,
      totalWithValues,
      totalFields: fieldsToCheck.length
    };
  }

  /**
   * Validate field interaction state for consistency
   * 
   * @param {Object} interactionState - User interaction state to validate
   * @returns {Object} Validation result with any issues found
   */
  static validateInteractionState(interactionState) {
    const issues = [];
    const validatedState = {};

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

      // Validate required properties
      if (typeof isUserModified !== 'boolean') {
        issues.push(`Invalid isUserModified for ${fieldName}`);
        return;
      }

      if (lastModified && typeof lastModified !== 'string') {
        issues.push(`Invalid lastModified for ${fieldName}`);
        return;
      }

      // Validate date format if present
      if (lastModified) {
        const date = new Date(lastModified);
        if (isNaN(date.getTime())) {
          issues.push(`Invalid date format for lastModified in ${fieldName}`);
          return;
        }
      }

      // Field state is valid
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

  /**
   * Validate and recover interaction state
   * 
   * @param {Object} interactionState - User interaction state to validate and recover
   * @returns {Object} Validated and recovered interaction state
   */
  static validateAndRecoverInteractionState(interactionState) {
    try {
      if (!interactionState || typeof interactionState !== 'object') {
        console.warn('Invalid interaction state, initializing empty state');
        return {};
      }

      const recoveredState = {};
      let hasRecovery = false;

      Object.keys(interactionState).forEach(fieldName => {
        try {
          const fieldState = interactionState[fieldName];

          if (!fieldState || typeof fieldState !== 'object') {
            console.warn(`Invalid field state for ${fieldName}, skipping`);
            hasRecovery = true;
            return;
          }

          // Validate and recover field state
          const recoveredFieldState = {
            isUserModified: typeof fieldState.isUserModified === 'boolean' 
              ? fieldState.isUserModified 
              : false,
            lastModified: fieldState.lastModified || new Date().toISOString(),
            initialValue: fieldState.initialValue
          };

          // Validate date format
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

  /**
   * Merge interaction states (useful for migration or combining states)
   * 
   * @param {Object} primaryState - Primary interaction state
   * @param {Object} secondaryState - Secondary interaction state to merge
   * @param {Object} options - Merge options
   * @param {boolean} options.preferPrimary - Whether to prefer primary state in conflicts
   * @returns {Object} Merged interaction state
   */
  static mergeInteractionStates(primaryState, secondaryState, options = {}) {
    try {
      const { preferPrimary = true } = options;
      
      // Validate and recover both states
      const validPrimaryState = this.validateAndRecoverInteractionState(primaryState);
      const validSecondaryState = this.validateAndRecoverInteractionState(secondaryState);
      
      const merged = { ...validSecondaryState };

      Object.keys(validPrimaryState).forEach(fieldName => {
        try {
          const primaryField = validPrimaryState[fieldName];
          const secondaryField = validSecondaryState[fieldName];

          if (!secondaryField || preferPrimary) {
            merged[fieldName] = primaryField;
          } else {
            // Merge with preference for more recent modification
            const primaryDate = new Date(primaryField.lastModified || 0);
            const secondaryDate = new Date(secondaryField.lastModified || 0);

            merged[fieldName] = primaryDate > secondaryDate ? primaryField : secondaryField;
          }
        } catch (fieldError) {
          console.warn(`Error merging field ${fieldName}:`, fieldError);
          // Keep the primary field on error
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