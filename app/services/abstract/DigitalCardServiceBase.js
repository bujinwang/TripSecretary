/**
 * Digital Card Service Base Class
 *
 * Abstract base class for country-specific digital arrival card submission services.
 * Provides common patterns and lifecycle management, reducing boilerplate code.
 *
 * Subclasses should implement:
 * - buildContext(userId): Transform user data to API format
 * - callAPI(context): Submit to government API
 * - Additional hooks for customization
 *
 * @module services/abstract/DigitalCardServiceBase
 * @abstract
 */

import EntryInfoService from '../EntryInfoService';
import DigitalArrivalCardService from '../DigitalArrivalCardService';

/**
 * Abstract base class for digital card services
 * @abstract
 */
class DigitalCardServiceBase {
  /**
   * Constructor
   * @param {Object} config - Service configuration
   * @param {string} config.destinationId - Destination ID (e.g., 'th', 'vn')
   * @param {string} config.cardType - Card type name (e.g., 'TDAC', 'EVISA')
   * @param {string} config.serviceName - Human-readable service name
   */
  constructor(config) {
    if (new.target === DigitalCardServiceBase) {
      throw new Error('DigitalCardServiceBase is an abstract class and cannot be instantiated directly');
    }

    this.destinationId = config.destinationId;
    this.cardType = config.cardType;
    this.serviceName = config.serviceName || `${config.cardType} Service`;
  }

  /**
   * Main submission workflow
   * This is the public API that orchestrates the entire process
   *
   * @param {string} userId - User ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Submission result
   */
  async submit(userId, options = {}) {
    console.log(`📋 [${this.serviceName}] Starting submission for user: ${userId}`);

    try {
      // Step 1: Validate prerequisites
      await this.validatePrerequisites(userId, options);

      // Step 2: Build context from user data
      console.log(`🔨 [${this.serviceName}] Building context...`);
      const context = await this.buildContext(userId, options);

      // Step 3: Validate context before submission
      await this.validateContext(context, options);

      // Step 4: Transform context (hook for subclasses)
      const transformedContext = await this.transformContext(context, options);

      // Step 5: Call external API
      console.log(`🚀 [${this.serviceName}] Submitting to API...`);
      const response = await this.callAPI(transformedContext, options);

      // Step 6: Validate response
      await this.validateResponse(response, options);

      // Step 7: Process response (hook for subclasses)
      const processedResponse = await this.processResponse(response, options);

      // Step 8: Save submission record
      console.log(`💾 [${this.serviceName}] Saving submission record...`);
      await this.saveSubmissionRecord(userId, processedResponse, transformedContext, options);

      // Step 9: Post-submission actions (hook for subclasses)
      await this.afterSubmission(userId, processedResponse, options);

      console.log(`✅ [${this.serviceName}] Submission completed successfully`);

      return {
        success: true,
        ...processedResponse
      };

    } catch (error) {
      console.error(`❌ [${this.serviceName}] Submission failed:`, error);

      // Handle error (hook for subclasses)
      // Subclasses can return a transformed error, or null to suppress re-throwing
      const handledError = await this.handleError(error, userId, options);

      // If handleError returns an error (transformed or original), throw it
      // If it returns null/undefined, suppress the error (allowing graceful degradation)
      if (handledError !== null && handledError !== undefined) {
        throw handledError;
      } else if (handledError === undefined) {
        // Default behavior: re-throw original error if nothing returned
        throw error;
      }
      // If handledError === null, error is suppressed
    }
  }

  /**
   * Validate prerequisites before submission
   * Override this to add custom validation
   *
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @protected
   */
  async validatePrerequisites(userId, options) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Subclasses can override to add more validation
    // e.g., check if passport data exists, check if visa is required, etc.
  }

  /**
   * Build submission context from user data
   * **MUST BE IMPLEMENTED BY SUBCLASS**
   *
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Context object ready for API submission
   * @abstract
   */
  async buildContext(userId, options) {
    throw new Error('buildContext() must be implemented by subclass');
  }

  /**
   * Validate built context before submission
   * Override this to add custom validation
   *
   * @param {Object} context - Built context
   * @param {Object} options - Options
   * @protected
   */
  async validateContext(context, options) {
    if (!context) {
      throw new Error('Context is null or undefined');
    }

    // Subclasses can override to add specific validation
    // e.g., check required fields, validate formats, etc.
  }

  /**
   * Transform context before API call
   * Hook for subclasses to modify context
   *
   * @param {Object} context - Context object
   * @param {Object} options - Options
   * @returns {Promise<Object>} Transformed context
   * @protected
   */
  async transformContext(context, options) {
    // Default: return context as-is
    // Subclasses can override to add transformations
    return context;
  }

  /**
   * Call external API to submit digital card
   * **MUST BE IMPLEMENTED BY SUBCLASS**
   *
   * @param {Object} context - Submission context
   * @param {Object} options - Options
   * @returns {Promise<Object>} API response
   * @abstract
   */
  async callAPI(context, options) {
    throw new Error('callAPI() must be implemented by subclass');
  }

  /**
   * Validate API response
   * Override this to add custom validation
   *
   * @param {Object} response - API response
   * @param {Object} options - Options
   * @protected
   */
  async validateResponse(response, options) {
    if (!response) {
      throw new Error('API returned null or undefined response');
    }

    // Subclasses can override to add specific validation
    // e.g., check for error codes, validate response structure, etc.
  }

  /**
   * Process API response
   * Hook for subclasses to extract and format data
   *
   * @param {Object} response - Raw API response
   * @param {Object} options - Options
   * @returns {Promise<Object>} Processed response
   * @protected
   */
  async processResponse(response, options) {
    // Default: return response as-is
    // Subclasses can override to extract specific fields
    return response;
  }

  /**
   * Save submission record to database
   * Can be overridden for custom save logic
   *
   * @param {string} userId - User ID
   * @param {Object} response - Processed API response
   * @param {Object} context - Submission context
   * @param {Object} options - Options
   * @protected
   */
  async saveSubmissionRecord(userId, response, context, options) {
    // Step 1: Find or create entry_info record
    const entryInfoId = await this.findOrCreateEntryInfo(userId, options);

    // Step 2: Save digital arrival card record
    await this.saveDigitalCard(userId, entryInfoId, response, options);
  }

  /**
   * Find or create entry_info record
   *
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<string>} Entry info ID
   * @protected
   */
  async findOrCreateEntryInfo(userId, options) {
    const destinationId = options.destinationId || this.destinationId;

    // Check if entry_info exists
    const existingEntryInfo = await EntryInfoService.findByDestination(userId, destinationId);

    if (existingEntryInfo?.id) {
      console.log(`✓ Found existing entry_info: ${existingEntryInfo.id}`);
      return existingEntryInfo.id;
    }

    // Create new entry_info
    console.log(`✓ Creating new entry_info for destination: ${destinationId}`);
    const entryInfoId = await EntryInfoService.create(userId, destinationId);

    return entryInfoId;
  }

  /**
   * Save digital arrival card record
   *
   * @param {string} userId - User ID
   * @param {string} entryInfoId - Entry info ID
   * @param {Object} response - Processed API response
   * @param {Object} options - Options
   * @protected
   */
  async saveDigitalCard(userId, entryInfoId, response, options) {
    const cardData = {
      userId,
      entryInfoId,
      destinationId: options.destinationId || this.destinationId,
      cardType: this.cardType,

      // Extract common fields (subclasses may have different field names)
      arrCardNo: response.arrCardNo || response.applicationNo || response.referenceNo,
      qrUri: response.qrUri || response.qrCodeUrl || response.qrCode,
      pdfUrl: response.pdfUrl || response.documentUrl,

      // Metadata
      status: 'success',
      submittedAt: new Date().toISOString(),
      submissionMethod: 'api',
      apiResponse: JSON.stringify(response),
    };

    await DigitalArrivalCardService.saveDigitalArrivalCard(cardData);
  }

  /**
   * Hook called after successful submission
   * Override this for post-submission actions
   *
   * @param {string} userId - User ID
   * @param {Object} response - Processed response
   * @param {Object} options - Options
   * @protected
   */
  async afterSubmission(userId, response, options) {
    // Default: do nothing
    // Subclasses can override to add post-submission logic
    // e.g., send notifications, update user status, etc.
  }

  /**
   * Handle submission errors
   * Override this for custom error handling
   *
   * Return behavior:
   * - Return undefined (default): Re-throw original error
   * - Return Error object: Throw the returned error (allows transformation)
   * - Return null: Suppress error (allows graceful degradation)
   *
   * @param {Error} error - Error object
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Error|null|undefined>} Error to throw, null to suppress, or undefined for default
   * @protected
   *
   * @example
   * // Transform error to add context
   * async handleError(error, userId, options) {
   *   const enhancedError = new Error(`Submission failed for ${userId}: ${error.message}`);
   *   enhancedError.originalError = error;
   *   return enhancedError;
   * }
   *
   * @example
   * // Suppress error for non-critical failures
   * async handleError(error, userId, options) {
   *   if (error.message.includes('timeout')) {
   *     console.warn('Timeout occurred, continuing...');
   *     return null; // Suppress error
   *   }
   *   return undefined; // Re-throw for other errors
   * }
   */
  async handleError(error, userId, options) {
    // Default: just log the error and return undefined (re-throw original)
    // Subclasses can override to add custom error handling
    // e.g., save failed attempt, retry logic, notifications, etc.

    console.error(`[${this.serviceName}] Error details:`, {
      message: error.message,
      stack: error.stack,
      userId,
      destinationId: this.destinationId,
    });

    // Return undefined to indicate default behavior (re-throw original error)
    return undefined;
  }

  /**
   * Retry submission with exponential backoff
   * Utility method for subclasses
   *
   * @param {Function} fn - Function to retry
   * @param {Object} options - Retry options
   * @returns {Promise<any>} Function result
   * @protected
   */
  async retryWithBackoff(fn, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`[${this.serviceName}] Attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries) {
          console.log(`[${this.serviceName}] Retrying in ${delay}ms...`);
          await this.sleep(delay);
          delay = Math.min(delay * backoffFactor, maxDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @protected
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service configuration
   * @returns {Object} Service configuration
   */
  getConfig() {
    return {
      destinationId: this.destinationId,
      cardType: this.cardType,
      serviceName: this.serviceName,
    };
  }
}

/**
 * Export base class
 */
export default DigitalCardServiceBase;
