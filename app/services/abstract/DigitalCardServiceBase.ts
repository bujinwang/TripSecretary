/**
 * Digital Card Service Base Class
 *
 * Abstract base class for country-specific digital arrival card submission services.
 * Provides common patterns and lifecycle management, reducing boilerplate code.
 */

import EntryInfoService from '../EntryInfoService';
import SecureStorageService from '../security/SecureStorageService';

type DigitalCardServiceConfig = {
  destinationId: string;
  cardType: string;
  serviceName?: string;
};

type SubmissionOptions = {
  destinationId?: string;
  [key: string]: unknown;
};

type RetryOptions = {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
};

type EntryInfoRecord = {
  id?: string;
  [key: string]: unknown;
};

type EntryInfoServiceAdapter = {
  findByDestination?: (userId: string, destinationId: string) => Promise<EntryInfoRecord | null>;
  create?: (userId: string, destinationId: string) => Promise<string>;
};

type DigitalArrivalCardServiceAdapter = {
  saveDigitalArrivalCard?: (dacData: Record<string, unknown>) => Promise<{ id: string }>;
};

const entryInfoServiceAdapter = EntryInfoService as unknown as EntryInfoServiceAdapter;
const digitalArrivalCardAdapter = SecureStorageService as unknown as DigitalArrivalCardServiceAdapter;

abstract class DigitalCardServiceBase<
  ContextType extends Record<string, unknown> = Record<string, unknown>,
  ResponseType extends Record<string, unknown> = Record<string, unknown>
> {
  protected readonly destinationId: string;

  protected readonly cardType: string;

  protected readonly serviceName: string;

  constructor(config: DigitalCardServiceConfig) {
    if (new.target === DigitalCardServiceBase) {
      throw new Error('DigitalCardServiceBase is an abstract class and cannot be instantiated directly');
    }

    this.destinationId = config.destinationId;
    this.cardType = config.cardType;
    this.serviceName = config.serviceName || `${config.cardType} Service`;
  }

  /**
   * Main submission workflow (public API)
   */
  async submit(userId: string, options: SubmissionOptions = {}): Promise<({ success: true } & ResponseType) | undefined> {
    console.log(`📋 [${this.serviceName}] Starting submission for user: ${userId}`);

    try {
      await this.validatePrerequisites(userId, options);

      console.log(`🔨 [${this.serviceName}] Building context...`);
      const context = await this.buildContext(userId, options);

      await this.validateContext(context, options);
      const transformedContext = await this.transformContext(context, options);

      console.log(`🚀 [${this.serviceName}] Submitting to API...`);
      const response = await this.callAPI(transformedContext, options);

      await this.validateResponse(response, options);
      const processedResponse = await this.processResponse(response, options);

      console.log(`💾 [${this.serviceName}] Saving submission record...`);
      await this.saveSubmissionRecord(userId, processedResponse, transformedContext, options);

      await this.afterSubmission(userId, processedResponse, options);

      console.log(`✅ [${this.serviceName}] Submission completed successfully`);

      return {
        success: true,
        ...processedResponse
      } as ({ success: true } & ResponseType);
    } catch (error: unknown) {
      const handledError = await this.handleError(error, userId, options);

      if (handledError !== null && handledError !== undefined) {
        throw handledError;
      }

      if (handledError === undefined) {
        throw (error instanceof Error ? error : new Error(String(error)));
      }

      return undefined;
    }
  }

  /**
   * Validate prerequisites before submission
   */
  protected async validatePrerequisites(userId: string, _options: SubmissionOptions): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }
  }

  /**
   * Build submission context from user data (must be implemented by subclasses)
   */
  protected abstract buildContext(userId: string, options: SubmissionOptions): Promise<ContextType>;

  /**
   * Validate built context before submission
   */
  protected async validateContext(context: ContextType, _options: SubmissionOptions): Promise<void> {
    if (!context) {
      throw new Error('Context is null or undefined');
    }
  }

  /**
   * Transform context before API call (hook for subclasses)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async transformContext(context: ContextType, _options: SubmissionOptions): Promise<ContextType> {
    return context;
  }

  /**
   * Call external API to submit digital card (must be implemented by subclasses)
   */
  protected abstract callAPI(context: ContextType, options: SubmissionOptions): Promise<ResponseType>;

  /**
   * Validate API response
   */
  protected async validateResponse(response: ResponseType, _options: SubmissionOptions): Promise<void> {
    if (!response) {
      throw new Error('API returned null or undefined response');
    }
  }

  /**
   * Process API response (hook for subclasses)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async processResponse(response: ResponseType, _options: SubmissionOptions): Promise<ResponseType> {
    return response;
  }

  /**
   * Save submission record to database
   */
  protected async saveSubmissionRecord(
    userId: string,
    response: ResponseType,
    _context: ContextType,
    options: SubmissionOptions
  ): Promise<void> {
    const entryInfoId = await this.findOrCreateEntryInfo(userId, options);
    await this.saveDigitalCard(userId, entryInfoId, response, options);
  }

  /**
   * Find or create entry_info record
   */
  protected async findOrCreateEntryInfo(userId: string, options: SubmissionOptions): Promise<string> {
    const destinationId = String(options.destinationId || this.destinationId);

    let existingEntryInfo: EntryInfoRecord | null = null;
    if (entryInfoServiceAdapter.findByDestination) {
      existingEntryInfo = await entryInfoServiceAdapter.findByDestination(userId, destinationId);
    }

    if (existingEntryInfo?.id) {
      console.log(`✓ Found existing entry_info: ${existingEntryInfo.id}`);
      return existingEntryInfo.id;
    }

    if (!entryInfoServiceAdapter.create) {
      throw new Error('EntryInfoService.create is not implemented');
    }

    console.log(`✓ Creating new entry_info for destination: ${destinationId}`);
    return entryInfoServiceAdapter.create(userId, destinationId);
  }

  /**
   * Save digital arrival card record
   */
  protected async saveDigitalCard(
    userId: string,
    entryInfoId: string,
    response: ResponseType,
    options: SubmissionOptions
  ): Promise<void> {
    const cardData: Record<string, unknown> = {
      userId,
      entryInfoId,
      destinationId: options.destinationId || this.destinationId,
      cardType: this.cardType,
      arrCardNo: response.arrCardNo ?? response.applicationNo ?? response.referenceNo ?? null,
      qrUri: response.qrUri ?? response.qrCodeUrl ?? response.qrCode ?? null,
      pdfUrl: response.pdfUrl ?? response.documentUrl ?? null,
      status: 'success',
      submittedAt: new Date().toISOString(),
      submissionMethod: 'api',
      apiResponse: JSON.stringify(response)
    };

    if (!digitalArrivalCardAdapter.saveDigitalArrivalCard) {
      console.warn('Digital arrival card adapter is not available. Skipping save operation.');
      return;
    }

    await digitalArrivalCardAdapter.saveDigitalArrivalCard(cardData);
  }

  /**
   * Hook called after successful submission
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async afterSubmission(_userId: string, _response: ResponseType, _options: SubmissionOptions): Promise<void> {
    // Default implementation does nothing. Subclasses may override.
  }

  /**
   * Handle submission errors (hook for subclasses)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async handleError(
    error: unknown,
    userId: string,
    _options: SubmissionOptions
  ): Promise<Error | null | undefined> {
    const normalizedError = error instanceof Error ? error : new Error(String(error));

    console.error(`[${this.serviceName}] Error details:`, {
      message: normalizedError.message,
      stack: normalizedError.stack,
      userId,
      destinationId: this.destinationId
    });

    return undefined;
  }

  /**
   * Retry submission with exponential backoff
   */
  protected async retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10_000,
      backoffFactor = 2
    } = options;

    let lastError: unknown = null;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        return await fn();
      } catch (error: unknown) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[${this.serviceName}] Attempt ${attempt}/${maxRetries} failed:`, message);

        if (attempt < maxRetries) {
          console.log(`[${this.serviceName}] Retrying in ${delay}ms...`);
          await this.sleep(delay);
          delay = Math.min(delay * backoffFactor, maxDelay);
        }
      }
    }

    throw (lastError instanceof Error ? lastError : new Error(String(lastError)));
  }

  /**
   * Sleep utility
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service configuration
   */
  getConfig(): DigitalCardServiceConfig {
    return {
      destinationId: this.destinationId,
      cardType: this.cardType,
      serviceName: this.serviceName
    };
  }
}

export default DigitalCardServiceBase;
