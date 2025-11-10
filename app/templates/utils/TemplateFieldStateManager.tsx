// @ts-nocheck

/**
 * TemplateFieldStateManager Utility Class
 *
 * Ported from Thailand's FieldStateManager
 * Manages field state and determines which fields should be saved based on user interaction.
 * Provides filtering logic for save operations and accurate completion metrics calculation.
 *
 * Features:
 * - Filters fields based on user interaction state
 * - Processes save payloads to include only user-modified fields
 * - Handles special cases for different field types
 * - Error recovery for corrupted state
 */

class TemplateFieldStateManager {
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
   * Validate and recover interaction state
   *
   * @param {Object} interactionState - Interaction state to validate
   * @returns {Object} Validated interaction state
   */
  static validateAndRecoverInteractionState(interactionState) {
    if (!interactionState || typeof interactionState !== 'object') {
      console.warn('[FieldStateManager] Invalid interaction state, using empty state');
      return {};
    }

    const validated = {};
    Object.keys(interactionState).forEach(fieldName => {
      const fieldState = interactionState[fieldName];
      if (fieldState && typeof fieldState.isUserModified === 'boolean') {
        validated[fieldName] = fieldState;
      }
    });

    return validated;
  }

  /**
   * Filter fields to include only those that should be saved
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
        console.warn('[FieldStateManager] Invalid allFields provided');
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
          console.warn(`[FieldStateManager] Error processing field ${fieldName}:`, fieldError);

          // For critical fields, include them in save to prevent data loss
          if (options.alwaysSaveFields && options.alwaysSaveFields.includes(fieldName)) {
            saveableFields[fieldName] = allFields[fieldName];
          }
        }
      });

      return saveableFields;
    } catch (error) {
      console.error('[FieldStateManager] Error in filterSaveableFields:', error);

      // Fallback: return all fields to prevent data loss
      if (options.preserveExisting) {
        return allFields;
      }

      return {};
    }
  }

  /**
   * Extract always-save fields from config
   *
   * @param {Object} config - Template configuration
   * @returns {Array<string>} List of field names that should always be saved
   */
  static getAlwaysSaveFieldsFromConfig(config) {
    const alwaysSaveFields = [];

    // Extract from autoSave config
    if (config.features?.autoSave?.immediateSaveFields) {
      alwaysSaveFields.push(...config.features.autoSave.immediateSaveFields);
    }

    // Extract fields marked with immediateSave: true
    Object.values(config.sections || {}).forEach(section => {
      if (section.fields) {
        Object.values(section.fields).forEach(field => {
          if (field.immediateSave && field.fieldName) {
            alwaysSaveFields.push(field.fieldName);
          }
        });
      }
    });

    // Remove duplicates
    return [...new Set(alwaysSaveFields)];
  }

  /**
   * Calculate field completion count
   *
   * @param {Object} fields - Field values
   * @param {Object} interactionState - User interaction state
   * @param {Array<string>} requiredFields - List of required field names
   * @returns {Object} { filled: number, total: number }
   */
  static calculateFieldCompletion(fields, interactionState, requiredFields = []) {
    const validatedState = this.validateAndRecoverInteractionState(interactionState);

    let filled = 0;
    const total = requiredFields.length;

    requiredFields.forEach(fieldName => {
      const value = fields[fieldName];
      const fieldState = validatedState[fieldName];
      const isUserModified = fieldState?.isUserModified || false;
      const hasInitialValue = fieldState?.initialValue !== undefined && fieldState?.initialValue !== null;

      // Count as filled if:
      // 1. User has modified it and it has a value, OR
      // 2. It has a tracked initial value (pre-filled), OR
      // 3. Tracking disabled (no field state recorded)
      if (value !== null && value !== undefined && value !== '') {
        if (isUserModified || hasInitialValue || !fieldState) {
          filled++;
        }
      }
    });

    return { filled, total };
  }
}

export default TemplateFieldStateManager;
