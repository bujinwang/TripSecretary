/**
 * 入境通 - Data Models Index
 * Centralized export of all data models with security integration
 */

import Passport from './Passport';
import PersonalInfo from './PersonalInfo';
import EntryData from './EntryData';
import EntryInfo from './EntryInfo';
import TravelInfo from './TravelInfo';
import FundItem from './FundItem';
import DigitalArrivalCard from './DigitalArrivalCard';
import EntryPackSnapshot from './EntryPackSnapshot';
import PassportCountry from './PassportCountry';

type ValidationResponse = { isValid: boolean; errors: string[] };

let FundingProof: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require('./FundingProof');
  FundingProof = module?.default ?? module;
} catch (error) {
  console.warn('FundingProof model not available:', error);
}

export const ModelUtils = {
  validateCompleteEntry(passport?: Passport | null, personalInfo?: PersonalInfo | null, entryData?: EntryData | null) {
    const errors: string[] = [];
    const validations: Array<{ model: string } & ValidationResponse> = [];

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

    if (entryData && typeof entryData.validate === 'function') {
      const entryValidation = entryData.validate();
      validations.push({ model: 'entryData', ...entryValidation });
      if (!entryValidation.isValid) {
        errors.push(...entryValidation.errors.map(err => `Entry Data: ${err}`));
      }
    } else if (!entryData) {
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

  createCompleteEntry(inputData: Record<string, unknown>, userId: string) {
    const passport = Passport.fromOCRResult(inputData.passport as Record<string, unknown> | undefined ?? {}, userId);
    const personalInfo = PersonalInfo.fromUserInput((inputData.personalInfo as Record<string, unknown> | undefined) ?? {}, userId);
    const entryData = EntryData.fromUserInput((inputData.entryData as Record<string, unknown> | undefined) ?? {}, userId, passport.id, personalInfo.id);

    return {
      passport,
      personalInfo,
      entryData,
      validation: ModelUtils.validateCompleteEntry(passport, personalInfo, entryData)
    };
  },

  async exportAllUserData(userId: string) {
    try {
      const exportData: Record<string, unknown> = {
        exportDate: new Date().toISOString(),
        userId,
        dataTypes: [] as string[]
      };

      try {
        const passport = await Passport.load(userId);
        if (passport) {
          (exportData.dataTypes as string[]).push('passport');
          exportData.passport = passport.exportData();
        }
      } catch (error) {
        console.warn('Failed to export passport data:', error);
      }

      try {
        const personalInfo = await PersonalInfo.load(userId);
        if (personalInfo) {
          (exportData.dataTypes as string[]).push('personalInfo');
          exportData.personalInfo = personalInfo.exportData();
        }
      } catch (error) {
        console.warn('Failed to export personal info:', error);
      }

      if (FundingProof) {
        try {
          const fundingProof = await FundingProof.load(userId);
          if (fundingProof) {
            (exportData.dataTypes as string[]).push('fundingProof');
            exportData.fundingProof = fundingProof.exportData();
          }
        } catch (error) {
          console.warn('Failed to export funding proof:', error);
        }
      }

      exportData.entryData = {
        note: 'Entry data export not yet implemented - would include all travel entries'
      };

      return exportData;
    } catch (error) {
      console.error('Failed to export all user data:', error);
      throw error;
    }
  },

  async getDataCompletenessStatus(userId: string) {
    try {
      const status: Record<string, any> = {
        userId,
        checkDate: new Date().toISOString(),
        sections: {}
      };

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
        status.sections.passport = { exists: false, error: (error as Error).message };
      }

      try {
        const personalInfo = await PersonalInfo.load(userId);
        const validation = personalInfo ? personalInfo.validate() : { isValid: false };
        const completeness = personalInfo ? personalInfo.checkImmigrationCompleteness() : null;

        status.sections.personalInfo = {
          exists: !!personalInfo,
          isValid: validation.isValid,
          completeness
        };
      } catch (error) {
        status.sections.personalInfo = { exists: false, error: (error as Error).message };
      }

      if (FundingProof) {
        try {
          const fundingProof = await FundingProof.load(userId);
          const validation = fundingProof ? fundingProof.validate() : { isValid: false };

          status.sections.fundingProof = {
            exists: !!fundingProof,
            isValid: validation.isValid,
            hasCompleteFundingInfo: fundingProof ? fundingProof.hasCompleteFundingInfo() : false,
            methodCount: fundingProof ? fundingProof.getFundingMethodsSummary().methodCount : 0
          };
        } catch (error) {
          status.sections.fundingProof = { exists: false, error: (error as Error).message };
        }
      }

      const sections = Object.values(status.sections) as Array<{ exists?: boolean; isValid?: boolean }>;
      const validSections = sections.filter(section => section.isValid);

      status.overall = {
        totalSections: sections.length,
        existingSections: sections.filter(section => section.exists).length,
        validSections: validSections.length,
        completenessPercentage: sections.length > 0 ? Math.round((validSections.length / sections.length) * 100) : 0,
        isComplete: sections.length > 0 && validSections.length === sections.length
      };

      return status;
    } catch (error) {
      console.error('Failed to get data completeness status:', error);
      throw error;
    }
  },

  async generateDataQualityReport(userId: string) {
    try {
      const completeness = await ModelUtils.getDataCompletenessStatus(userId);

      const report: Record<string, unknown> = {
        generatedAt: new Date().toISOString(),
        userId,
        completeness: completeness.overall,
        sections: completeness.sections,
        recommendations: [] as Array<Record<string, unknown>>
      };

      const recommendations = report.recommendations as Array<Record<string, unknown>>;
      const passportSection = completeness.sections.passport;
      const personalInfoSection = completeness.sections.personalInfo;
      const fundingSection = completeness.sections.fundingProof;

      if (passportSection) {
        if (!passportSection.exists) {
          recommendations.push({
            type: 'critical',
            message: 'Passport information is missing. Please scan or enter your passport details.',
            action: 'scan_passport'
          });
        } else if (passportSection.isExpired) {
          recommendations.push({
            type: 'critical',
            message: 'Your passport has expired. Please update with current passport information.',
            action: 'update_passport'
          });
        } else if (passportSection.expiresSoon) {
          recommendations.push({
            type: 'warning',
            message: `Your passport expires in ${passportSection.daysUntilExpiry} days. Consider renewal.`,
            action: 'renew_passport'
          });
        }
      }

      if (personalInfoSection) {
        if (!personalInfoSection.exists) {
          recommendations.push({
            type: 'critical',
            message: 'Personal information is missing. Please complete your profile.',
            action: 'complete_profile'
          });
        } else if (!personalInfoSection.isValid) {
          recommendations.push({
            type: 'error',
            message: 'Personal information has validation errors. Please review and correct.',
            action: 'fix_profile'
          });
        }
      }

      if (fundingSection) {
        if (!fundingSection.exists) {
          recommendations.push({
            type: 'warning',
            message: 'Funding proof is missing. Please add funding information for immigration purposes.',
            action: 'add_funding_proof'
          });
        } else if (!fundingSection.isValid) {
          recommendations.push({
            type: 'error',
            message: 'Funding proof has validation errors. Please review and correct.',
            action: 'fix_funding_proof'
          });
        } else if (!fundingSection.hasCompleteFundingInfo) {
          recommendations.push({
            type: 'info',
            message: 'Consider adding more funding proof methods for better immigration clearance.',
            action: 'enhance_funding_proof'
          });
        }
      }

      return report;
    } catch (error) {
      console.error('Failed to generate data quality report:', error);
      throw error;
    }
  },

  sanitizeForLogging(data: Record<string, unknown> | null) {
    if (!data) {
      return data;
    }

    const sensitiveFields = [
      'passportNumber',
      'fullName',
      'dateOfBirth',
      'phoneNumber',
      'email',
      'homeAddress',
      'cashAmount',
      'bankCards'
    ];

    const sanitized: Record<string, unknown> = { ...data };
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
};

export {
  Passport,
  PersonalInfo,
  EntryData,
  EntryInfo,
  TravelInfo,
  FundItem,
  DigitalArrivalCard,
  EntryPackSnapshot,
  PassportCountry
};

export default {
  Passport,
  PersonalInfo,
  EntryData,
  EntryInfo,
  TravelInfo,
  FundItem,
  DigitalArrivalCard,
  EntryPackSnapshot,
  PassportCountry,
  ModelUtils
};

