// @ts-nocheck

/**
 * DataDiffCalculator - Utility for calculating differences between entry pack data
 * Used for detecting changes between current data and snapshots
 * 
 * Requirements: 12.3, 12.4
 */

class DataDiffCalculator {
  /**
   * Calculate differences between snapshot data and current data
   * @param {Object} snapshotData - Data from snapshot
   * @param {Object} currentData - Current user data
   * @returns {Object} - Difference analysis
   */
  static calculateDiff(snapshotData, currentData) {
    try {
      const changes = {
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
        snapshotData.passport || {},
        currentData.passport || {}
      );
      changes.categories.passport = passportChanges;

      // Compare personal info data
      const personalInfoChanges = this.comparePersonalInfoData(
        snapshotData.personalInfo || {},
        currentData.personalInfo || {}
      );
      changes.categories.personalInfo = personalInfoChanges;

      // Compare funds data
      const fundsChanges = this.compareFundsData(
        snapshotData.funds || [],
        currentData.funds || []
      );
      changes.categories.funds = fundsChanges;

      // Compare travel data
      const travelChanges = this.compareTravelData(
        snapshotData.travel || {},
        currentData.travel || {}
      );
      changes.categories.travel = travelChanges;

      // Aggregate results
      const allCategories = [passportChanges, personalInfoChanges, fundsChanges, travelChanges];
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
        error: error.message
      };
    }
  }

  /**
   * Compare passport data
   * @param {Object} snapshotPassport - Passport data from snapshot
   * @param {Object} currentPassport - Current passport data
   * @returns {Object} - Passport comparison result
   */
  static comparePassportData(snapshotPassport, currentPassport) {
    const changes = [];
    const significantFields = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
    const minorFields = ['gender', 'placeOfBirth', 'issuingCountry'];

    // Check significant fields
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

    // Check minor fields
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
      changes: changes,
      category: 'passport'
    };
  }

  /**
   * Compare personal info data
   * @param {Object} snapshotPersonalInfo - Personal info from snapshot
   * @param {Object} currentPersonalInfo - Current personal info
   * @returns {Object} - Personal info comparison result
   */
  static comparePersonalInfoData(snapshotPersonalInfo, currentPersonalInfo) {
    const changes = [];
    const significantFields = ['phoneNumber', 'email', 'occupation'];
    const minorFields = ['provinceCity', 'countryRegion', 'gender'];

    // Check significant fields
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

    // Check minor fields
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
      changes: changes,
      category: 'personalInfo'
    };
  }

  /**
   * Compare funds data
   * @param {Array} snapshotFunds - Funds from snapshot
   * @param {Array} currentFunds - Current funds
   * @returns {Object} - Funds comparison result
   */
  static compareFundsData(snapshotFunds, currentFunds) {
    const changes = [];

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
      const snapshotFund = snapshotFunds[i];
      const currentFund = currentFunds[i];

      if (!snapshotFund && currentFund) {
        // New fund added
        changes.push({
          field: `fund[${i}]`,
          oldValue: null,
          newValue: this.getFundSummary(currentFund),
          changeType: 'added',
          significance: 'significant',
          description: `New fund item added: ${this.getFundSummary(currentFund)}`
        });
      } else if (snapshotFund && !currentFund) {
        // Fund removed
        changes.push({
          field: `fund[${i}]`,
          oldValue: this.getFundSummary(snapshotFund),
          newValue: null,
          changeType: 'removed',
          significance: 'significant',
          description: `Fund item removed: ${this.getFundSummary(snapshotFund)}`
        });
      } else if (snapshotFund && currentFund) {
        // Compare fund properties
        const fundChanges = this.compareFundItem(snapshotFund, currentFund, i);
        changes.push(...fundChanges);
      }
    }

    return {
      hasChanges: changes.length > 0,
      changes: changes,
      category: 'funds'
    };
  }

  /**
   * Compare individual fund item
   * @param {Object} snapshotFund - Fund from snapshot
   * @param {Object} currentFund - Current fund
   * @param {number} index - Fund index
   * @returns {Array} - Array of changes
   */
  static compareFundItem(snapshotFund, currentFund, index) {
    const changes = [];
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
   * @param {Object} snapshotTravel - Travel data from snapshot
   * @param {Object} currentTravel - Current travel data
   * @returns {Object} - Travel comparison result
   */
  static compareTravelData(snapshotTravel, currentTravel) {
    const changes = [];
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

    // Check significant fields
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

    // Check minor fields
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
      changes: changes,
      category: 'travel'
    };
  }

  /**
   * Compare individual field values
   * @param {string} fieldName - Field name
   * @param {*} oldValue - Value from snapshot
   * @param {*} newValue - Current value
   * @param {string} significance - 'significant' or 'minor'
   * @returns {Object|null} - Change object or null if no change
   */
  static compareField(fieldName, oldValue, newValue, significance = 'minor') {
    // Normalize values for comparison
    const normalizedOld = this.normalizeValue(oldValue);
    const normalizedNew = this.normalizeValue(newValue);

    if (normalizedOld !== normalizedNew) {
      return {
        field: fieldName,
        oldValue: oldValue,
        newValue: newValue,
        changeType: 'modified',
        significance: significance,
        description: this.getChangeDescription(fieldName, oldValue, newValue)
      };
    }

    return null;
  }

  /**
   * Normalize value for comparison
   * @param {*} value - Value to normalize
   * @returns {string} - Normalized value
   */
  static normalizeValue(value) {
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
   * @param {string} fieldName - Field name
   * @param {*} oldValue - Old value
   * @param {*} newValue - New value
   * @returns {string} - Change description
   */
  static getChangeDescription(fieldName, oldValue, newValue) {
    const fieldDisplayNames = {
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
   * @param {*} value - Value to format
   * @returns {string} - Formatted value
   */
  static formatValueForDisplay(value) {
    if (value === null || value === undefined || value === '') {
      return '(空)';
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    
    return String(value);
  }

  /**
   * Get fund summary for display
   * @param {Object} fund - Fund object
   * @returns {string} - Fund summary
   */
  static getFundSummary(fund) {
    if (!fund) {
return '(空)';
}
    
    const type = fund.type || '未知类型';
    const amount = fund.amount || '0';
    const currency = fund.currency || '';
    
    return `${type} ${amount} ${currency}`.trim();
  }

  /**
   * Generate user-friendly change summary
   * @param {Object} diffResult - Result from calculateDiff
   * @returns {Object} - User-friendly summary
   */
  static generateChangeSummary(diffResult) {
    if (!diffResult.hasChanges) {
      return {
        title: '没有检测到变更',
        message: '您的入境信息与上次提交时相同。',
        needsResubmission: false,
        categories: []
      };
    }

    const { summary, categories } = diffResult;
    const changedCategories = [];

    // Analyze each category
    Object.entries(categories).forEach(([categoryName, categoryData]) => {
      if (categoryData.hasChanges) {
        const categoryDisplayNames = {
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
    
    let title, message;
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
   * @param {Object} diffResult - Result from calculateDiff
   * @returns {boolean} - Whether immediate resubmission is required
   */
  static requiresImmediateResubmission(diffResult) {
    if (!diffResult.hasChanges) {
      return false;
    }

    // Critical fields that always require resubmission
    const criticalFields = [
      'passportNumber',
      'fullName',
      'nationality',
      'arrivalDate',
      'departureDate',
      'arrivalFlightNumber'
    ];

    return diffResult.changedFields.some(field => 
      criticalFields.some(criticalField => field.includes(criticalField))
    );
  }
}

export default DataDiffCalculator;