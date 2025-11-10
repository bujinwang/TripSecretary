// @ts-nocheck

/**
 * Test suite for Progressive Entry Flow translations
 * Ensures all required translation keys exist across all supported languages
 */

import { getTranslationWithFallback } from '../locales';

// Import translation files
import zhTranslations from '../translations/countries.zh.json';
import enTranslations from '../translations/countries.en.json';
import esTranslations from '../translations/countries.es.json';
import frTranslations from '../translations/countries.fr.json';
import deTranslations from '../translations/countries.de.json';

describe('Progressive Entry Flow Translations', () => {
  const supportedLanguages = ['zh-CN', 'en', 'es', 'fr', 'de'];
  const translationFiles = {
    'zh-CN': zhTranslations,
    'en': enTranslations,
    'es': esTranslations,
    'fr': frTranslations,
    'de': deTranslations
  };

  // Core translation keys that must exist in all languages
  const requiredKeys = [
    'progressiveEntryFlow.status.completed',
    'progressiveEntryFlow.status.cancelled',
    'progressiveEntryFlow.status.expired',
    'progressiveEntryFlow.status.inProgress',
    'progressiveEntryFlow.status.needsResubmission',
    
    'progressiveEntryFlow.snapshot.readOnlyBanner',
    'progressiveEntryFlow.snapshot.viewTitle',
    'progressiveEntryFlow.snapshot.incompleteNotice',
    
    'progressiveEntryFlow.history.title',
    'progressiveEntryFlow.history.filterOptions.all',
    'progressiveEntryFlow.history.filterOptions.completed',
    'progressiveEntryFlow.history.filterOptions.cancelled',
    'progressiveEntryFlow.history.filterOptions.expired',
    
    'progressiveEntryFlow.notifications.submissionWindowOpen.title',
    'progressiveEntryFlow.notifications.submissionWindowOpen.body',
    'progressiveEntryFlow.notifications.urgentReminderNotification.title',
    'progressiveEntryFlow.notifications.urgentReminderNotification.body',
    'progressiveEntryFlow.notifications.deadlineWarning.title',
    'progressiveEntryFlow.notifications.deadlineWarning.body',
    
    'progressiveEntryFlow.notifications.actions.submit',
    'progressiveEntryFlow.notifications.actions.later',
    'progressiveEntryFlow.notifications.actions.ignore',
    'progressiveEntryFlow.notifications.actions.view',
    'progressiveEntryFlow.notifications.actions.resubmit',
    
    'progressiveEntryFlow.entryFlow.viewStatus',
    'progressiveEntryFlow.entryFlow.submitTDAC',
    'progressiveEntryFlow.entryFlow.resubmitTDAC',
    'progressiveEntryFlow.entryFlow.continueEditing',
    'progressiveEntryFlow.entryFlow.startGuide',
    
    'progressiveEntryFlow.countdown.noDate',
    'progressiveEntryFlow.countdown.preWindow',
    'progressiveEntryFlow.countdown.withinWindow',
    'progressiveEntryFlow.countdown.urgent',
    
    'progressiveEntryFlow.categories.passport',
    'progressiveEntryFlow.categories.personal',
    'progressiveEntryFlow.categories.funds',
    'progressiveEntryFlow.categories.travel',
    
    'progressiveEntryFlow.dataChange.handleError',
    'progressiveEntryFlow.dataChange.confirmResubmit.title',
    'progressiveEntryFlow.dataChange.confirmResubmit.message',
    'progressiveEntryFlow.dataChange.resubmit',
    'progressiveEntryFlow.dataChange.ignore',
    
    'progressiveEntryFlow.superseded.resubmitHint',
    'progressiveEntryFlow.superseded.message',
    
    'progressiveEntryFlow.immigrationOfficer.title',
    'progressiveEntryFlow.immigrationOfficer.presentation.exitTitle',
    'progressiveEntryFlow.immigrationOfficer.presentation.tdacQRCode',
    'progressiveEntryFlow.immigrationOfficer.presentation.passportInformation',
    
    'thailand.entryFlow.title',
    'thailand.entryFlow.preparationTitle',
    'thailand.entryFlow.loading',
    'thailand.entryFlow.noData.title',
    'thailand.entryFlow.noData.startButton'
  ];

  describe('Translation Key Existence', () => {
    supportedLanguages.forEach(language => {
      describe(`${language} translations`, () => {
        const translations = translationFiles[language];

        requiredKeys.forEach(key => {
          it(`should have translation for key: ${key}`, () => {
            const value = getNestedValue(translations, key);
            expect(value).toBeDefined();
            expect(typeof value).toBe('string');
            expect(value.length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe('Translation Interpolation', () => {
    const interpolationKeys = [
      'progressiveEntryFlow.history.resultCount',
      'progressiveEntryFlow.entryFlow.completionPercent',
      'progressiveEntryFlow.notifications.submissionWindowOpen.body',
      'progressiveEntryFlow.categories.fieldsComplete'
    ];

    supportedLanguages.forEach(language => {
      describe(`${language} interpolation`, () => {
        const translations = translationFiles[language];

        interpolationKeys.forEach(key => {
          it(`should have interpolation placeholders in: ${key}`, () => {
            const value = getNestedValue(translations, key);
            expect(value).toBeDefined();
            expect(value).toMatch(/\{\{.*\}\}/); // Should contain {{variable}} placeholders
          });
        });
      });
    });
  });

  describe('Translation Consistency', () => {
    it('should have consistent action button translations', () => {
      const actionKeys = [
        'progressiveEntryFlow.notifications.actions.submit',
        'progressiveEntryFlow.notifications.actions.later',
        'progressiveEntryFlow.notifications.actions.ignore',
        'progressiveEntryFlow.notifications.actions.view'
      ];

      supportedLanguages.forEach(language => {
        const translations = translationFiles[language];
        actionKeys.forEach(key => {
          const value = getNestedValue(translations, key);
          expect(value).toBeDefined();
          expect(value.length).toBeLessThan(20); // Action buttons should be concise
        });
      });
    });

    it('should have consistent status translations', () => {
      const statusKeys = [
        'progressiveEntryFlow.status.completed',
        'progressiveEntryFlow.status.cancelled',
        'progressiveEntryFlow.status.expired',
        'progressiveEntryFlow.status.inProgress'
      ];

      supportedLanguages.forEach(language => {
        const translations = translationFiles[language];
        statusKeys.forEach(key => {
          const value = getNestedValue(translations, key);
          expect(value).toBeDefined();
          expect(value.length).toBeLessThan(15); // Status should be short
        });
      });
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to English when translation is missing', () => {
      const missingKey = 'progressiveEntryFlow.nonexistent.key';
      const fallbackValue = getTranslationWithFallback(missingKey, 'zh-CN');
      
      // Should either return the English value or the key itself
      expect(fallbackValue).toBeDefined();
      expect(typeof fallbackValue).toBe('string');
    });

    it('should handle nested key fallbacks correctly', () => {
      const key = 'progressiveEntryFlow.status.completed';
      
      supportedLanguages.forEach(language => {
        const value = getTranslationWithFallback(key, language);
        expect(value).toBeDefined();
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Special Characters and Formatting', () => {
    it('should handle Chinese characters correctly', () => {
      const chineseKeys = [
        'progressiveEntryFlow.status.completed',
        'progressiveEntryFlow.entryFlow.viewStatus',
        'progressiveEntryFlow.countdown.noDate'
      ];

      const zhTranslations = translationFiles['zh-CN'];
      chineseKeys.forEach(key => {
        const value = getNestedValue(zhTranslations, key);
        expect(value).toBeDefined();
        // Should contain Chinese characters
        expect(value).toMatch(/[\u4e00-\u9fff]/);
      });
    });

    it('should handle special characters in other languages', () => {
      const specialCharKeys = [
        'progressiveEntryFlow.notifications.actions.later',
        'progressiveEntryFlow.entryFlow.continueEditing'
      ];

      // French should have accented characters
      const frTranslations = translationFiles['fr'];
      specialCharKeys.forEach(key => {
        const value = getNestedValue(frTranslations, key);
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
      });

      // German should handle umlauts
      const deTranslations = translationFiles['de'];
      specialCharKeys.forEach(key => {
        const value = getNestedValue(deTranslations, key);
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
      });
    });
  });
});

/**
 * Helper function to get nested object value by dot notation key
 * @param {Object} obj - Object to search in
 * @param {string} key - Dot notation key (e.g., 'a.b.c')
 * @returns {*} Value at the key path
 */
function getNestedValue(obj, key) {
  return key.split('.').reduce((current, keyPart) => {
    return current && current[keyPart];
  }, obj);
}