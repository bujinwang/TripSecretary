/**
 * DataDiffCalculator - Utility for calculating differences between entry pack data
 * Used for detecting changes between current data and snapshots
 * 
 * Requirements: 12.3, 12.4
 */

interface ChangeItem {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: string;
  significance: string;
  description: string;
}

interface CategoryResult {
  hasChanges: boolean;
  changes: ChangeItem[];
  category: string;
}

export interface DiffResult {
  hasChanges: boolean;
  changedFields: string[];
  addedFields: string[];
  removedFields: string[];
  categories: {
    passport: CategoryResult;
    personalInfo: CategoryResult;
    funds: CategoryResult;
    travel: CategoryResult;
  };
  summary: {
    totalChanges: number;
    significantChanges: number;
    minorChanges: number;
  };
  error?: string;
}

interface ChangeSummaryCategory {
  name: string;
  changeCount: number;
  significantChanges: number;
  changes: string[];
}

interface ChangeSummary {
  title: string;
  message: string;
  needsResubmission: boolean;
  totalChanges?: number;
  significantChanges?: number;
  minorChanges?: number;
  categories: ChangeSummaryCategory[];
}

class DataDiffCalculator {
  /**
   * Calculate differences between snapshot data and current data
   */
  static calculateDiff(snapshotData: Record<string, unknown>, currentData: Record<string, unknown>): DiffResult {
    try {
      const changes: DiffResult = {
        hasChanges: false,
        changedFields: [],
        addedFields: [],
        removedFields: [],
        categories: {
          passport: { hasChanges: false, changes: [] },
          personalInfo: { hasChanges: false, changes: [] },
          funds: { hasChanges: false, changes: [] },
          travel: { hasChanges: false, changes: [] }
        },
        summary: {
          totalChanges: 0,
          significantChanges: 0,
          minorChanges: 0
        }
      };

      // Compare passport data
      const passportChanges = this.comparePassportData(
        snapshotData.passport as Record<string, unknown> | undefined || {},
        currentData.passport as Record<string, unknown> | undefined || {}
      );
      changes.categories.passport = passportChanges;

      // Compare personal info data
      const personalInfoChanges = this.comparePersonalInfoData(
        snapshotData.personalInfo as Record<string, unknown> | undefined || {},
        currentData.personalInfo as Record<string, unknown> | undefined || {}
      );
      changes.categories.personalInfo = personalInfoChanges;

      // Compare funds data
      const fundsChanges = this.compareFundsData(
        snapshotData.funds as unknown[] | undefined || [],
        currentData.funds as unknown[] | undefined || []
      );
      changes.categories.funds = fundsChanges;

      // Compare travel data
      const travelChanges = this.compareTravelData(
        snapshotData.travel as Record<string, unknown> | undefined || {},
        currentData.travel as Record<string, unknown> | undefined || {}
      );
      changes.categories.travel = travelChanges;

      // Aggregate results
      const allCategories: CategoryResult[] = [passportChanges, personalInfoChanges, fundsChanges, travelChanges];
      changes.hasChanges = allCategories.some(cat => cat.hasChanges);

      // Collect all changed fields
      allCategories.forEach(category => {
        changes.changedFields.push(...category.changes.map(change => change.field));
      });

      // Calculate summary
      const allChanges = allCategories.flatMap(cat => cat.changes);
      changes.summary.totalChanges = allChanges.length;
      changes.summary.significantChanges = allChanges.filter(change => 
        change.significance === 'significant'
      ).length;
      changes.summary.minorChanges = allChanges.filter(change => 
        change.significance === 'minor'
      ).length;

      return changes;
    } catch (error) {
      console.error('Failed to calculate data diff:', error);
      return {
        hasChanges: false,
        changedFields: [],
        addedFields: [],
        removedFields: [],
        categories: {
          passport: { hasChanges: false, changes: [] },
          personalInfo: { hasChanges: false, changes: [] },
          funds: { hasChanges: false, changes: [] },
          travel: { hasChanges: false, changes: [] }
        },
        summary: { totalChanges: 0, significantChanges: 0, minorChanges: 0 },
        error: (error as Error).message
      };
    }
  }

  /**
   * Compare passport data
   */
  static comparePassportData(snapshotPassport: Record<string, unknown>, currentPassport: Record<string, unknown>): CategoryResult {
    const changes: ChangeItem[] = [];
    const significantFields = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
    const minorFields = ['gender', 'placeOfBirth', 'issuingCountry'];

    significantFields.forEach(field => {
      const change = this.compareField(
        field,
        snapshotPassport[field],
        currentPassport[field],
        'significant'
      );
      if (change) {
        changes.push(change);
      }
    });

    minorFields.forEach(field => {
      const change = this.compareField(
        field,
        snapshotPassport[field],
        currentPassport[field],
        'minor'
      );
      if (change) {
        changes.push(change);
      }
    });

    return {
      hasChanges: changes.length > 0,
      changes,
      category: 'passport'
    };
  }

  /**
   * Compare personal info data
   */
  static comparePersonalInfoData(snapshotPersonalInfo: Record<string, unknown>, currentPersonalInfo: Record<string, unknown>): CategoryResult {
    const changes: ChangeItem[] = [];
    const significantFields = ['phoneNumber', 'email', 'occupation'];
    const minorFields = ['provinceCity', 'countryRegion', 'gender'];

    significantFields.forEach(field => {
      const change = this.compareField(
        field,
        snapshotPersonalInfo[field],
        currentPersonalInfo[field],
        'significant'
      );
      if (change) {
        changes.push(change);
      }
    });

    minorFields.forEach(field => {
      const change = this.compareField(
        field,
        snapshotPersonalInfo[field],
        currentPersonalInfo[field],
        'minor'
      );
      if (change) {
        changes.push(change);
      }
    });

    return {
      hasChanges: changes.length > 0,
      changes,
      category: 'personalInfo'
    };
  }

  /**
   * Compare funds data
   */
  static compareFundsData(snapshotFunds: unknown[], currentFunds: unknown[]): CategoryResult {
    const changes: ChangeItem[] = [];

    // Compare fund count
    if (snapshotFunds.length !== currentFunds.length) {
      changes.push({
        field: 'fundCount',
        oldValue: snapshotFunds.length,
        newValue: currentFunds.length,
        changeType: 'modified',
        significance: 'significant',
        description: `Fund count changed from ${snapshotFunds.length} to ${currentFunds.length}`
      });
    }

    // Compare individual funds by ID or index
    const maxLength = Math.max(snapshotFunds.length, currentFunds.length);
    
    for (let i = 0; i < maxLength; i++) {
      const snapshotFund = snapshotFunds[i] as Record<string, unknown> | undefined;
      const currentFund = currentFunds[i] as Record<string, unknown> | undefined;

      if (!snapshotFund && currentFund) {
        changes.push({
          field: `fund[${i}]`,
          oldValue: null,
          newValue: this.getFundSummary(currentFund),
          changeType: 'added',
          significance: 'significant',
          description: `New fund item added: ${this.getFundSummary(currentFund)}`
        });
      } else if (snapshotFund && !currentFund) {
        changes.push({
          field: `fund[${i}]`,
          oldValue: this.getFundSummary(snapshotFund),
          newValue: null,
          changeType: 'removed',
          significance: 'significant',
          description: `Fund item removed: ${this.getFundSummary(snapshotFund)}`
        });
      } else if (snapshotFund && currentFund) {
        const fundChanges = this.compareFundItem(snapshotFund, currentFund, i);
        changes.push(...fundChanges);
      }
    }

    return {
      hasChanges: changes.length > 0,
      changes,
      category: 'funds'
    };
  }

  /**
   * Compare individual fund item
   */
  static compareFundItem(snapshotFund: Record<string, unknown>, currentFund: Record<string, unknown>, index: number): ChangeItem[] {
    const changes: ChangeItem[] = [];
    const significantFields = ['type', 'amount', 'currency'];
    const minorFields = ['description', 'photoUri'];

    significantFields.forEach(field => {
      const change = this.compareField(
        `fund[${index}].${field}`,
        snapshotFund[field],
        currentFund[field],
        'significant'
      );
      if (change) {
        changes.push(change);
      }
    });

    minorFields.forEach(field => {
      const change = this.compareField(
        `fund[${index}].${field}`,
        snapshotFund[field],
        currentFund[field],
        'minor'
      );
      if (change) {
        changes.push(change);
      }
    });

    return changes;
  }

  /**
   * Compare travel data
   */
  static compareTravelData(snapshotTravel: Record<string, unknown>, currentTravel: Record<string, unknown>): CategoryResult {
    const changes: ChangeItem[] = [];
    const significantFields = [
      'travelPurpose', 
      'arrivalDate', 
      'departureDate', 
      'arrivalFlightNumber', 
      'departureFlightNumber'
    ];
    const minorFields = [
      'accommodation', 
      'accommodationAddress', 
      'accommodationPhone'
    ];

    significantFields.forEach(field => {
      const change = this.compareField(
        field,
        snapshotTravel[field],
        currentTravel[field],
        'significant'
      );
      if (change) {
        changes.push(change);
      }
    });

    minorFields.forEach(field => {
      const change = this.compareField(
        field,
        snapshotTravel[field],
        currentTravel[field],
        'minor'
      );
      if (change) {
        changes.push(change);
      }
    });

    return {
      hasChanges: changes.length > 0,
      changes,
      category: 'travel'
    };
  }

  /**
   * Compare individual field values
   */
  static compareField(fieldName: string, oldValue: unknown, newValue: unknown, significance = 'minor'): ChangeItem | null {
    const normalizedOld = this.normalizeValue(oldValue);
    const normalizedNew = this.normalizeValue(newValue);

    if (normalizedOld !== normalizedNew) {
      return {
        field: fieldName,
        oldValue,
        newValue,
        changeType: 'modified',
        significance,
        description: this.getChangeDescription(fieldName, oldValue, newValue)
      };
    }

    return null;
  }

  /**
   * Normalize value for comparison
   */
  static normalizeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    if (typeof value === 'boolean') {
      return value.toString();
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Get human-readable change description
   */
  static getChangeDescription(fieldName: string, oldValue: unknown, newValue: unknown): string {
    const fieldDisplayNames: Record<string, string> = {
      passportNumber: '护照号码',
      fullName: '姓名',
      nationality: '国籍',
      dateOfBirth: '出生日期',
      expiryDate: '护照有效期',
      phoneNumber: '电话号码',
      email: '邮箱地址',
      occupation: '职业',
      travelPurpose: '旅行目的',
      arrivalDate: '抵达日期',
      departureDate: '离开日期',
      arrivalFlightNumber: '抵达航班号',
      departureFlightNumber: '离开航班号',
      accommodation: '住宿信息'
    };

    const displayName = fieldDisplayNames[fieldName] || fieldName;
    const oldDisplay = this.formatValueForDisplay(oldValue);
    const newDisplay = this.formatValueForDisplay(newValue);

    return `${displayName}从"${oldDisplay}"更改为"${newDisplay}"`;
  }

  /**
   * Format value for display
   */
  static formatValueForDisplay(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '(空)';
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return `${value.substring(0, 50)}...`;
    }
    
    return String(value);
  }

  /**
   * Get fund summary for display
   */
  static getFundSummary(fund: Record<string, unknown> | null | undefined): string {
    if (!fund) {
      return '(空)';
    }
    
    const type = (fund.type as string) || '未知类型';
    const amount = (fund.amount as string) || '0';
    const currency = (fund.currency as string) || '';
    
    return `${type} ${amount} ${currency}`.trim();
  }

  /**
   * Generate user-friendly change summary
   */
  static generateChangeSummary(diffResult: DiffResult): ChangeSummary {
    if (!diffResult.hasChanges) {
      return {
        title: '没有检测到变更',
        message: '您的入境信息与上次提交时相同。',
        needsResubmission: false,
        categories: []
      };
    }

    const { summary, categories } = diffResult;
    const changedCategories: ChangeSummaryCategory[] = [];

    (Object.entries(categories) as [string, { hasChanges: boolean; changes: Array<{ significance: string; description: string }> }][]).forEach(([categoryName, categoryData]) => {
      if (categoryData.hasChanges) {
        const categoryDisplayNames: Record<string, string> = {
          passport: '护照信息',
          personalInfo: '个人信息',
          funds: '资金证明',
          travel: '旅行信息'
        };

        changedCategories.push({
          name: categoryDisplayNames[categoryName] || categoryName,
          changeCount: categoryData.changes.length,
          significantChanges: categoryData.changes.filter(c => c.significance === 'significant').length,
          changes: categoryData.changes.map(change => change.description)
        });
      }
    });

    const needsResubmission = summary.significantChanges > 0;
    
    let title: string;
    let message: string;
    if (needsResubmission) {
      title = '检测到重要变更';
      message = `您的入境信息有${summary.significantChanges}项重要变更，需要重新提交入境卡。`;
    } else {
      title = '检测到轻微变更';
      message = `您的入境信息有${summary.minorChanges}项轻微变更，建议重新提交以确保信息准确。`;
    }

    return {
      title,
      message,
      needsResubmission,
      totalChanges: summary.totalChanges,
      significantChanges: summary.significantChanges,
      minorChanges: summary.minorChanges,
      categories: changedCategories
    };
  }

  /**
   * Check if changes require immediate resubmission
   */
  static requiresImmediateResubmission(diffResult: DiffResult): boolean {
    if (!diffResult.hasChanges) {
      return false;
    }

    const criticalFields = [
      'passportNumber',
      'fullName',
      'nationality',
      'arrivalDate',
      'departureDate',
      'arrivalFlightNumber'
    ];

    return diffResult.changedFields.some((field: string) => 
      criticalFields.some((criticalField: string) => field.includes(criticalField))
    );
  }
}

export default DataDiffCalculator;
