/**
 * DataDiffCalculator.test.js - Tests for data difference calculation
 * Tests the core functionality of detecting changes between entry pack data
 * 
 * Requirements: 12.3, 12.4
 */

import DataDiffCalculator from '../DataDiffCalculator';

describe('DataDiffCalculator', () => {
  describe('calculateDiff', () => {
    test('should detect no changes when data is identical', () => {
      const snapshotData = {
        passport: { passportNumber: 'A12345678', fullName: 'John Doe' },
        personalInfo: { email: 'john@example.com', phoneNumber: '+1234567890' },
        funds: [{ type: 'cash', amount: 1000, currency: 'USD' }],
        travel: { arrivalDate: '2024-12-01', travelPurpose: 'tourism' }
      };

      const currentData = {
        passport: { passportNumber: 'A12345678', fullName: 'John Doe' },
        personalInfo: { email: 'john@example.com', phoneNumber: '+1234567890' },
        funds: [{ type: 'cash', amount: 1000, currency: 'USD' }],
        travel: { arrivalDate: '2024-12-01', travelPurpose: 'tourism' }
      };

      const result = DataDiffCalculator.calculateDiff(snapshotData, currentData);

      expect(result.hasChanges).toBe(false);
      expect(result.summary.totalChanges).toBe(0);
    });

    test('should detect passport changes', () => {
      const snapshotData = {
        passport: { passportNumber: 'A12345678', fullName: 'John Doe' },
        personalInfo: {},
        funds: [],
        travel: {}
      };

      const currentData = {
        passport: { passportNumber: 'B87654321', fullName: 'John Doe' },
        personalInfo: {},
        funds: [],
        travel: {}
      };

      const result = DataDiffCalculator.calculateDiff(snapshotData, currentData);

      expect(result.hasChanges).toBe(true);
      expect(result.categories.passport.hasChanges).toBe(true);
      expect(result.categories.passport.changes).toHaveLength(1);
      expect(result.categories.passport.changes[0].field).toBe('passportNumber');
      expect(result.categories.passport.changes[0].significance).toBe('significant');
    });

    test('should detect fund changes', () => {
      const snapshotData = {
        passport: {},
        personalInfo: {},
        funds: [{ type: 'cash', amount: 1000, currency: 'USD' }],
        travel: {}
      };

      const currentData = {
        passport: {},
        personalInfo: {},
        funds: [
          { type: 'cash', amount: 1000, currency: 'USD' },
          { type: 'card', amount: 500, currency: 'EUR' }
        ],
        travel: {}
      };

      const result = DataDiffCalculator.calculateDiff(snapshotData, currentData);

      expect(result.hasChanges).toBe(true);
      expect(result.categories.funds.hasChanges).toBe(true);
      expect(result.categories.funds.changes.some(change => 
        change.field === 'fundCount'
      )).toBe(true);
    });

    test('should detect travel date changes', () => {
      const snapshotData = {
        passport: {},
        personalInfo: {},
        funds: [],
        travel: { arrivalDate: '2024-12-01', travelPurpose: 'tourism' }
      };

      const currentData = {
        passport: {},
        personalInfo: {},
        funds: [],
        travel: { arrivalDate: '2024-12-15', travelPurpose: 'tourism' }
      };

      const result = DataDiffCalculator.calculateDiff(snapshotData, currentData);

      expect(result.hasChanges).toBe(true);
      expect(result.categories.travel.hasChanges).toBe(true);
      expect(result.categories.travel.changes[0].field).toBe('arrivalDate');
      expect(result.categories.travel.changes[0].significance).toBe('significant');
    });
  });

  describe('generateChangeSummary', () => {
    test('should generate summary for no changes', () => {
      const diffResult = {
        hasChanges: false,
        summary: { totalChanges: 0, significantChanges: 0, minorChanges: 0 },
        categories: {
          passport: { hasChanges: false, changes: [] },
          personalInfo: { hasChanges: false, changes: [] },
          funds: { hasChanges: false, changes: [] },
          travel: { hasChanges: false, changes: [] }
        }
      };

      const summary = DataDiffCalculator.generateChangeSummary(diffResult);

      expect(summary.needsResubmission).toBe(false);
      expect(summary.title).toContain('没有检测到变更');
    });

    test('should generate summary for significant changes', () => {
      const diffResult = {
        hasChanges: true,
        summary: { totalChanges: 2, significantChanges: 1, minorChanges: 1 },
        categories: {
          passport: { 
            hasChanges: true, 
            changes: [
              { field: 'passportNumber', significance: 'significant', description: '护照号码变更' }
            ] 
          },
          personalInfo: { 
            hasChanges: true, 
            changes: [
              { field: 'gender', significance: 'minor', description: '性别变更' }
            ] 
          },
          funds: { hasChanges: false, changes: [] },
          travel: { hasChanges: false, changes: [] }
        }
      };

      const summary = DataDiffCalculator.generateChangeSummary(diffResult);

      expect(summary.needsResubmission).toBe(true);
      expect(summary.title).toContain('重要变更');
      expect(summary.significantChanges).toBe(1);
      expect(summary.categories).toHaveLength(2);
    });
  });

  describe('requiresImmediateResubmission', () => {
    test('should require immediate resubmission for critical fields', () => {
      const diffResult = {
        hasChanges: true,
        changedFields: ['passportNumber', 'email']
      };

      const result = DataDiffCalculator.requiresImmediateResubmission(diffResult);
      expect(result).toBe(true);
    });

    test('should not require immediate resubmission for minor fields', () => {
      const diffResult = {
        hasChanges: true,
        changedFields: ['gender', 'accommodation']
      };

      const result = DataDiffCalculator.requiresImmediateResubmission(diffResult);
      expect(result).toBe(false);
    });
  });

  describe('normalizeValue', () => {
    test('should normalize string values', () => {
      expect(DataDiffCalculator.normalizeValue('  Test  ')).toBe('test');
      expect(DataDiffCalculator.normalizeValue('TEST')).toBe('test');
    });

    test('should handle null and undefined values', () => {
      expect(DataDiffCalculator.normalizeValue(null)).toBe('');
      expect(DataDiffCalculator.normalizeValue(undefined)).toBe('');
    });

    test('should handle numbers and booleans', () => {
      expect(DataDiffCalculator.normalizeValue(123)).toBe('123');
      expect(DataDiffCalculator.normalizeValue(true)).toBe('true');
    });
  });
});