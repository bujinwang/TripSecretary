// @ts-nocheck

/**
 * 入境通 - Security Services Index
 * Centralized export of all security-related services
 */

export { default as EncryptionService } from './EncryptionService';
export { default as SecureStorageService } from './SecureStorageService';
export { default as KeyManagementService } from './KeyManagementService';
export { default as GDPRComplianceService } from './GDPRComplianceService';

// Convenience function to initialize all security services
export const initializeSecurityServices = async (userId, masterKey = null) => {
  try {
    const { KeyManagementService } = await import('./KeyManagementService');
    const { SecureStorageService } = await import('./SecureStorageService');
    const { GDPRComplianceService } = await import('./GDPRComplianceService');

    // Initialize key management first
    await KeyManagementService.initialize(masterKey);

    // Setup user keys
    await KeyManagementService.setupUserKeys(userId);

    // Initialize secure storage
    await SecureStorageService.initialize(userId);

    // Initialize GDPR compliance
    await GDPRComplianceService.initialize();

    console.log('All security services initialized successfully');
    return {
      success: true,
      services: {
        keyManagement: KeyManagementService,
        secureStorage: SecureStorageService,
        gdprCompliance: GDPRComplianceService
      }
    };
  } catch (error) {
    console.error('Failed to initialize security services:', error);
    throw error;
  }
};

// Security configuration constants
export const SECURITY_CONFIG = {
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  KEY_DERIVATION: 'PBKDF2-SHA256',
  KEY_ITERATIONS: 100000,
  IV_LENGTH: 12,
  TAG_LENGTH: 16,
  KEY_ROTATION_DAYS: 90,
  BACKUP_RETENTION_COUNT: 5,
  AUDIT_RETENTION_DAYS: 2555, // 7 years for GDPR compliance
};

// Security utility functions
export const SecurityUtils = {
  /**
   * Generate secure random string
   * @param {number} length - Length of string
   * @returns {string} - Random string
   */
  generateSecureString: (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Validate encryption key format
   * @param {string} key - Key to validate
   * @returns {boolean} - Is valid key
   */
  isValidEncryptionKey: (key) => {
    return typeof key === 'string' &&
           key.length >= 32 &&
           /^[a-f0-9]+$/i.test(key);
  },

  /**
   * Check if data appears to be encrypted
   * @param {string} data - Data to check
   * @returns {boolean} - Likely encrypted
   */
  isEncryptedData: (data) => {
    // Heuristic: encrypted data is usually longer than 50 chars
    return typeof data === 'string' &&
           data.length > 50 &&
           /^[A-Za-z0-9+/=]+$/.test(data);
  },

  /**
   * Sanitize data for logging (remove sensitive fields)
   * @param {Object} data - Data object
   * @returns {Object} - Sanitized data
   */
  sanitizeForLogging: (data) => {
    if (!data) {
return data;
}

    const sensitiveFields = [
      'passportNumber', 'fullName', 'dateOfBirth', 'phoneNumber',
      'email', 'homeAddress', 'cashAmount', 'bankCards'
    ];

    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  },

  /**
   * Get security headers for API requests
   * @returns {Object} - Security headers
   */
  getSecurityHeaders: () => {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
    };
  },

  /**
   * Check GDPR consent status
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} - Consent status
   */
  getGDPRConsentStatus: async (userId) => {
    try {
      const consentData = await SecureStore.getItemAsync(`privacy_consents_${userId}`);
      if (!consentData) {
        return {
          hasConsented: false,
          consents: {},
          timestamp: null
        };
      }

      const consents = JSON.parse(consentData);
      return {
        hasConsented: true,
        consents: consents,
        timestamp: consents.timestamp
      };
    } catch (error) {
      console.error('Failed to get GDPR consent status:', error);
      return {
        hasConsented: false,
        consents: {},
        timestamp: null,
        error: error.message
      };
    }
  },

  /**
   * Validate GDPR consent for data processing
   * @param {string} userId - User identifier
   * @param {string} processingType - Type of processing
   * @returns {Promise<boolean>} - Whether consent is valid
   */
  validateGDPRConsent: async (userId, processingType) => {
    try {
      const consentStatus = await SecurityUtils.getGDPRConsentStatus(userId);

      if (!consentStatus.hasConsented) {
        return false;
      }

      // Check specific consent based on processing type
      switch (processingType) {
        case 'essential':
          return consentStatus.consents.privacyPolicy && consentStatus.consents.dataProcessing;
        case 'marketing':
          return consentStatus.consents.marketing;
        case 'analytics':
          return consentStatus.consents.analytics;
        default:
          return consentStatus.consents.privacyPolicy;
      }
    } catch (error) {
      console.error('Failed to validate GDPR consent:', error);
      return false;
    }
  }
};

export default {
  EncryptionService,
  SecureStorageService,
  KeyManagementService,
  GDPRComplianceService,
  initializeSecurityServices,
  SECURITY_CONFIG,
  SecurityUtils
};