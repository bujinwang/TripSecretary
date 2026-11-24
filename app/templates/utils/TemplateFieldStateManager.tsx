import LoggingService from '../../services/LoggingService';

/**
 * Options for field save logic
 */
interface FieldSaveOptions {
  preserveExisting?: boolean;
  alwaysSaveFields?: string[];
  [key: string]: unknown;
}

/**
 * Field interaction state tracked per field
 */
interface FieldInteractionState {
  isUserModified: boolean;
  timestamp?: number;
  initialValue?: unknown;
  [key: string]: unknown;
}

/**
 * Interaction state map (field name → interaction state)
 */
type InteractionStateMap = Record<string, FieldInteractionState>;

/**
 * Generic section config shape for field extraction
 */
interface SectionConfig {
  fields?: Record<string, { fieldName?: string; immediateSave?: boolean; [key: string]: unknown }>;
  [key: string]: unknown;
}

/**
 * Generic config shape for getAlwaysSaveFieldsFromConfig
 */
interface TemplateConfig {
  features?: {
    autoSave?: {
      immediateSaveFields?: string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  sections?: Record<string, SectionConfig>;
  [key: string]: unknown;
}

/**
 * TemplateFieldStateManager Utility Class
 *
 * Manages field state and determines which fields should be saved based on user interaction.
 */
class TemplateFieldStateManager {
  static shouldSaveField(
    fieldName: string,
    value: unknown,
    isUserModified: boolean,
    options: FieldSaveOptions = {}
  ): boolean {
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

  static validateAndRecoverInteractionState(
    interactionState: unknown
  ): InteractionStateMap {
    if (!interactionState || typeof interactionState !== 'object') {
      LoggingService.warn('FieldStateManager', 'Invalid interaction state, using empty state');
      return {};
    }

    const validated: InteractionStateMap = {};
    const raw = interactionState as Record<string, unknown>;

    Object.keys(raw).forEach((fieldName: string) => {
      const fieldState = raw[fieldName] as Record<string, unknown> | undefined;
      if (fieldState && typeof fieldState.isUserModified === 'boolean') {
        validated[fieldName] = fieldState as unknown as FieldInteractionState;
      }
    });

    return validated;
  }

  static filterSaveableFields(
    allFields: Record<string, unknown> | null | undefined,
    interactionState: unknown,
    options: FieldSaveOptions = {}
  ): Record<string, unknown> {
    try {
      if (!allFields || typeof allFields !== 'object') {
        LoggingService.warn('FieldStateManager', 'Invalid allFields provided');
        return {};
      }

      const validatedState = this.validateAndRecoverInteractionState(interactionState);
      const saveableFields: Record<string, unknown> = {};

      Object.keys(allFields).forEach((fieldName: string) => {
        try {
          const value = allFields[fieldName];
          const fieldInteraction = validatedState[fieldName];
          const isUserModified = fieldInteraction?.isUserModified || false;

          if (this.shouldSaveField(fieldName, value, isUserModified, options)) {
            saveableFields[fieldName] = value;
          }
        } catch (fieldError: unknown) {
          LoggingService.warn('FieldStateManager', `Error processing field ${fieldName}`, {
            fieldName,
            error: fieldError,
          });

          if (
            options.alwaysSaveFields &&
            options.alwaysSaveFields.includes(fieldName)
          ) {
            saveableFields[fieldName] = allFields[fieldName];
          }
        }
      });

      return saveableFields;
    } catch (error: unknown) {
      LoggingService.error('FieldStateManager', 'Error in filterSaveableFields', { error });

      if (options.preserveExisting) {
        return allFields || {};
      }

      return {};
    }
  }

  static getAlwaysSaveFieldsFromConfig(config: TemplateConfig): string[] {
    const alwaysSaveFields: string[] = [];

    if (config.features?.autoSave?.immediateSaveFields) {
      alwaysSaveFields.push(...config.features.autoSave.immediateSaveFields);
    }

    const sections = config.sections || {};
    Object.values(sections).forEach((section: SectionConfig) => {
      if (section.fields) {
        Object.values(section.fields).forEach(
          (field: { fieldName?: string; immediateSave?: boolean; [key: string]: unknown }) => {
            if (field.immediateSave && field.fieldName) {
              alwaysSaveFields.push(field.fieldName);
            }
          }
        );
      }
    });

    return [...new Set(alwaysSaveFields)];
  }

  static calculateFieldCompletion(
    fields: Record<string, unknown>,
    interactionState: unknown,
    requiredFields: string[] = []
  ): { filled: number; total: number } {
    const validatedState = this.validateAndRecoverInteractionState(interactionState);

    let filled = 0;
    const total = requiredFields.length;

    requiredFields.forEach((fieldName: string) => {
      const value = fields[fieldName];
      const fieldState = validatedState[fieldName];
      const isUserModified = fieldState?.isUserModified || false;
      const hasInitialValue =
        fieldState?.initialValue !== undefined && fieldState?.initialValue !== null;

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
