/**
 * 入境通 - Data Models Index
 * Centralized export of all data models with security integration
 */

export { default as Passport } from './Passport';
export { default as PersonalInfo } from './PersonalInfo';
export { default as FundingProof } from './FundingProof';
export { default as EntryData } from './EntryData';
export { default as EntryInfo } from './EntryInfo';
export { default as EntryPack } from './EntryPack';
export { default as EntryPackSnapshot } from './EntryPackSnapshot';
export { default as FundItem } from './FundItem';

// Model utilities and helpers
export const ModelUtils = {
  /**
   * Validate all models for a complete entry
   * @param {Passport} passport - Passport model
   * @param {PersonalInfo} personalInfo - Personal info model
   * @param {EntryData} entryData - Entry data model
   * @returns {Object} - Validation result
   */
  validateCompleteEntry: (passport, personalInfo, entryData) => {
    const errors = [];
    const validations = [];

    if (passport) {
      const passportValidation = passport.validate();
      validations.push({ model: 'passport', ...passportValidation });
      if (!passportValidation.isValid) {
        errors.push(...passportValidation.errors.map(err => `Passport: ${err}`));
      }
    } else {
      errors.push('Passport information is required');
    }

    if (personalInfo) {
      const personalValidation = personalInfo.validate();
      validations.push({ model: 'personalInfo', ...personalValidation });
      if (!personalValidation.isValid) {
        errors.push(...personalValidation.errors.map(err => `Personal Info: ${err}`));
      }
    } else {
      errors.push('Personal information is required');
    }

    if (entryData) {
      const entryValidation = entryData.validate();
      validations.push({ model: 'entryData', ...entryValidation });
      if (!entryValidation.isValid) {
        errors.push(...entryValidation.errors.map(err => `Entry Data: ${err}`));
      }
    } else {
      errors.push('Entry data is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      validations,
      summary: {
        totalModels: 3,
        validModels: validations.filter(v => v.isValid).length,
        invalidModels: validations.filter(v => !v.isValid).length
      }
    };
  },

  /**
   * Create complete entry from user input
   * @param {Object} inputData - User input data
   * @param {string} userId - User ID
   * @returns {Object} - Complete entry models
   */
  createCompleteEntry: (inputData, userId) => {
    const passport = Passport.fromOCRResult(inputData.passport, userId);
    const personalInfo = PersonalInfo.fromUserInput(inputData.personalInfo, userId);
    const entryData = EntryData.fromUserInput(inputData.entryData, userId, passport.id, personalInfo.id);

    return {
      passport,
      personalInfo,
      entryData,
      validation: ModelUtils.validateCompleteEntry(passport, personalInfo, entryData)
    };
  },

  /**
   * Export all user data for GDPR compliance
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete user data export
   */
  exportAllUserData: async (userId) => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        dataTypes: []
      };

      // Export passport data
      try {
        const passport = await Passport.load(userId);
        if (passport) {
          exportData.passport = passport.exportData();
          exportData.dataTypes.push('passport');
        }
      } catch (error) {
        console.warn('Failed to export passport data:', error);
      }

      // Export personal info
      try {
        const personalInfo = await PersonalInfo.load(userId);
        if (personalInfo) {
          exportData.personalInfo = personalInfo.exportData();
          exportData.dataTypes.push('personalInfo');
        }
      } catch (error) {
        console.warn('Failed to export personal info:', error);
      }

      // Export funding proof
      try {
        const FundingProof = require('./FundingProof').default;
        const fundingProof = await FundingProof.load(userId);
        if (fundingProof) {
          exportData.fundingProof = fundingProof.exportData();
          exportData.dataTypes.push('fundingProof');
        }
      } catch (error) {
        console.warn('Failed to export funding proof:', error);
      }

      // Export entry data (this would need to be implemented to get all entries)
      // For now, just include the structure
      exportData.entryData = {
        note: 'Entry data export not yet implemented - would include all travel entries'
      };

      return exportData;
    } catch (error) {
      console.error('Failed to export all user data:', error);
      throw error;
    }
  },

  /**
   * Get data completeness status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Completeness status
   */
  getDataCompletenessStatus: async (userId) => {
    try {
      const status = {
        userId,
        checkDate: new Date().toISOString(),
        sections: {}
      };

      // Check passport
      try {
        const passport = await Passport.load(userId);
        status.sections.passport = {
          exists: !!passport,
          isValid: passport ? passport.validate().isValid : false,
          isExpired: passport ? passport.isExpired() : false,
          expiresSoon: passport ? passport.expiresSoon() : false,
          daysUntilExpiry: passport ? passport.daysUntilExpiry() : null
        };
      } catch (error) {
        status.sections.passport = { exists: false, error: error.message };
      }

      // Check personal info
      try {
        const personalInfo = await PersonalInfo.load(userId);
        const validation = personalInfo ? personalInfo.validate() : { isValid: false };
        const completeness = personalInfo ? personalInfo.checkImmigrationCompleteness() : null;

        status.sections.personalInfo = {
          exists: !!personalInfo,
          isValid: validation.isValid,
          completeness: completeness
        };
      } catch (error) {
        status.sections.personalInfo = { exists: false, error: error.message };
      }

      // Check funding proof
      try {
        const FundingProof = require('./FundingProof').default;
        const fundingProof = await FundingProof.load(userId);
        const validation = fundingProof ? fundingProof.validate() : { isValid: false };

        status.sections.fundingProof = {
          exists: !!fundingProof,
          isValid: validation.isValid,
          hasCompleteFundingInfo: fundingProof ? fundingProof.hasCompleteFundingInfo() : false,
          methodCount: fundingProof ? fundingProof.getFundingMethodsSummary().methodCount : 0
        };
      } catch (error) {
        status.sections.fundingProof = { exists: false, error: error.message };
      }

      // Calculate overall completeness
      const sections = Object.values(status.sections);
      const existingSections = sections.filter(s => s.exists && !s.error);
      const validSections = sections.filter(s => s.isValid);

      status.overall = {
        totalSections: 3, // passport + personalInfo + fundingProof
        existingSections: existingSections.length,
        validSections: validSections.length,
        completenessPercentage: Math.round((validSections.length / 3) * 100),
        isComplete: validSections.length === 3
      };

      return status;
    } catch (error) {
      console.error('Failed to get data completeness status:', error);
      throw error;
    }
  },

  /**
   * Sanitize data for logging (remove sensitive fields)
   * @param {Object} data - Data object
   * @returns {Object} - Sanitized data
   */
  sanitizeForLogging: (data) => {
    if (!data) return data;

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
   * Generate data quality report
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Data quality report
   */
  generateDataQualityReport: async (userId) => {
    try {
      const completeness = await ModelUtils.getDataCompletenessStatus(userId);

      const report = {
        generatedAt: new Date().toISOString(),
        userId,
        completeness: completeness.overall,
        sections: completeness.sections,
        recommendations: []
      };

      // Generate recommendations based on completeness
      if (!completeness.sections.passport.exists) {
        report.recommendations.push({
          type: 'critical',
          message: 'Passport information is missing. Please scan or enter your passport details.',
          action: 'scan_passport'
        });
      } else if (completeness.sections.passport.isExpired) {
        report.recommendations.push({
          type: 'critical',
          message: 'Your passport has expired. Please update with current passport information.',
          action: 'update_passport'
        });
      } else if (completeness.sections.passport.expiresSoon) {
        report.recommendations.push({
          type: 'warning',
          message: `Your passport expires in ${completeness.sections.passport.daysUntilExpiry} days. Consider renewal.`,
          action: 'renew_passport'
        });
      }

      if (!completeness.sections.personalInfo.exists) {
        report.recommendations.push({
          type: 'critical',
          message: 'Personal information is missing. Please complete your profile.',
          action: 'complete_profile'
        });
      } else if (!completeness.sections.personalInfo.isValid) {
        report.recommendations.push({
          type: 'error',
          message: 'Personal information has validation errors. Please review and correct.',
          action: 'fix_profile'
        });
      }

      if (!completeness.sections.fundingProof.exists) {
        report.recommendations.push({
          type: 'warning',
          message: 'Funding proof is missing. Please add funding information for immigration purposes.',
          action: 'add_funding_proof'
        });
      } else if (!completeness.sections.fundingProof.isValid) {
        report.recommendations.push({
          type: 'error',
          message: 'Funding proof has validation errors. Please review and correct.',
          action: 'fix_funding_proof'
        });
      } else if (!completeness.sections.fundingProof.hasCompleteFundingInfo) {
        report.recommendations.push({
          type: 'info',
          message: 'Consider adding more funding proof methods for better immigration clearance.',
          action: 'enhance_funding_proof'
        });
      }

      return report;
    } catch (error) {
      console.error('Failed to generate data quality report:', error);
      throw error;
    }
  }
};

export default {
  Passport,
  PersonalInfo,
  FundingProof,
  EntryData,
  ModelUtils
};