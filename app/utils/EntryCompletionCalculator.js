/**
 * EntryCompletionCalculator - Utility for calculating entry information completion status
 * Computes completion metrics for passport, personal info, funds, and travel categories
 * Supports multi-destination progress tracking
 * 
 * Requirements: 2.1-2.6, 7.1-7.5, 15.1-15.7
 */

class EntryCompletionCalculator {
  constructor() {
    // Cache for performance optimization
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Multi-destination progress cache
    this.destinationProgressCache = new Map();
    this.destinationCacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Compute category completion state
   * @param {Object[]} fields - Array of field validation results
   * @returns {'complete'|'partial'|'missing'} - Category state
   */
  computeCategoryState(fields) {
    if (!fields || fields.length === 0) {
      return 'missing';
    }

    const validFields = fields.filter(field => field.isValid && field.hasValue);
    const totalFields = fields.length;
    const completedFields = validFields.length;

    if (completedFields === totalFields) {
      return 'complete';
    } else if (completedFields > 0) {
      return 'partial';
    } else {
      return 'missing';
    }
  }

  /**
   * Validate and check if a field has a valid value
   * @param {*} value - Field value
   * @param {string} fieldType - Type of field for validation
   * @returns {Object} - Validation result
   */
  validateField(value, fieldType = 'text') {
    const result = {
      hasValue: false,
      isValid: false,
      value: value
    };

    // Check if value exists and is not empty
    if (value === null || value === undefined) {
      return result;
    }

    if (typeof value === 'string' && value.trim() === '') {
      return result;
    }

    result.hasValue = true;

    // Type-specific validation
    switch (fieldType) {
      case 'email':
        result.isValid = this.validateEmail(value);
        break;
      case 'phone':
        result.isValid = this.validatePhone(value);
        break;
      case 'date':
        result.isValid = this.validateDate(value);
        break;
      case 'passport':
        result.isValid = this.validatePassportNumber(value);
        break;
      case 'currency':
        result.isValid = this.validateCurrency(value);
        break;
      case 'number':
        result.isValid = !isNaN(parseFloat(value)) && isFinite(value);
        break;
      case 'text':
      default:
        result.isValid = typeof value === 'string' && value.trim().length > 0;
        break;
    }

    return result;
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} - Is valid email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number
   * @returns {boolean} - Is valid phone
   */
  validatePhone(phone) {
    // Allow various phone formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7;
  }

  /**
   * Validate date format
   * @param {string} date - Date string
   * @returns {boolean} - Is valid date
   */
  validateDate(date) {
    if (!date) return false;
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
  }

  /**
   * Validate passport number format
   * @param {string} passport - Passport number
   * @returns {boolean} - Is valid passport
   */
  validatePassportNumber(passport) {
    // Basic passport validation - alphanumeric, 6-12 characters
    const passportRegex = /^[A-Z0-9]{6,12}$/i;
    return passportRegex.test(passport);
  }

  /**
   * Validate currency amount
   * @param {number|string} amount - Currency amount
   * @returns {boolean} - Is valid currency
   */
  validateCurrency(amount) {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0;
  }

  /**
   * Calculate completion metrics for all categories
   * @param {Object} entryInfo - Complete entry information
   * @returns {Object} - Completion metrics for all categories
   */
  calculateCompletionMetrics(entryInfo) {
    const cacheKey = this.generateCacheKey(entryInfo);
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    const metrics = {
      passport: this.calculatePassportCompletion(entryInfo.passport),
      personalInfo: this.calculatePersonalInfoCompletion(entryInfo.personalInfo, entryInfo.passport),
      funds: this.calculateFundsCompletion(entryInfo.funds),
      travel: this.calculateTravelCompletion(entryInfo.travel)
    };

    // Cache the result
    this.setCachedResult(cacheKey, metrics);

    return metrics;
  }

  /**
   * Calculate passport completion
   * @param {Object} passport - Passport data
   * @returns {Object} - Passport completion metrics
   */
  calculatePassportCompletion(passport = {}) {
    // If passport is null or undefined, treat as missing (but allow entry_info creation)
    if (!passport || Object.keys(passport).length === 0) {
      return {
        complete: 0,
        total: 5,
        state: 'missing',
        fields: [
          { name: 'passportNumber', hasValue: false, isValid: false },
          { name: 'fullName', hasValue: false, isValid: false },
          { name: 'nationality', hasValue: false, isValid: false },
          { name: 'dateOfBirth', hasValue: false, isValid: false },
          { name: 'expiryDate', hasValue: false, isValid: false }
        ],
        percentage: 0,
        note: 'Passport can be added later'
      };
    }

    const requiredFields = [
      { name: 'passportNumber', type: 'passport', value: passport.passportNumber },
      { name: 'fullName', type: 'text', value: passport.fullName },
      { name: 'nationality', type: 'text', value: passport.nationality },
      { name: 'dateOfBirth', type: 'date', value: passport.dateOfBirth },
      { name: 'expiryDate', type: 'date', value: passport.expiryDate }
    ];

    const fieldResults = requiredFields.map(field => ({
      name: field.name,
      ...this.validateField(field.value, field.type)
    }));

    const completedCount = fieldResults.filter(field => field.isValid && field.hasValue).length;
    const totalCount = requiredFields.length;

    return {
      complete: completedCount,
      total: totalCount,
      state: this.computeCategoryState(fieldResults),
      fields: fieldResults,
      percentage: Math.round((completedCount / totalCount) * 100)
    };
  }

  /**
   * Calculate personal info completion
   * @param {Object} personalInfo - Personal info data
   * @returns {Object} - Personal info completion metrics
   */
  calculatePersonalInfoCompletion(personalInfo = {}, passport = {}) {
    // Gender removed from personalInfo - use passport only (single source of truth)
    const genderValueRaw =
      (typeof passport.gender === 'string' && passport.gender.trim())
        ? passport.gender
        : (typeof passport.sex === 'string' && passport.sex.trim())
          ? passport.sex
          : '';
    const genderValue = typeof genderValueRaw === 'string' ? genderValueRaw.trim() : '';

    const requiredFields = [
      { name: 'occupation', type: 'text', value: personalInfo.occupation },
      { name: 'provinceCity', type: 'text', value: personalInfo.provinceCity },
      { name: 'countryRegion', type: 'text', value: personalInfo.countryRegion },
      { name: 'phoneNumber', type: 'phone', value: personalInfo.phoneNumber },
      { name: 'email', type: 'email', value: personalInfo.email },
      { name: 'gender', type: 'text', value: genderValue }
    ];

    const fieldResults = requiredFields.map(field => ({
      name: field.name,
      ...this.validateField(field.value, field.type)
    }));

    const completedCount = fieldResults.filter(field => field.isValid && field.hasValue).length;
    const totalCount = requiredFields.length;

    return {
      complete: completedCount,
      total: totalCount,
      state: this.computeCategoryState(fieldResults),
      fields: fieldResults,
      percentage: Math.round((completedCount / totalCount) * 100)
    };
  }

  /**
   * Calculate funds completion
   * @param {Array} funds - Fund items array
   * @returns {Object} - Funds completion metrics
   */
  calculateFundsCompletion(funds = []) {
    // Funds require at least 1 valid fund item with type, amount, and currency
    const validFunds = funds.filter(fund => {
      const typeValid = this.validateField(fund.type, 'text');
      const amountValid = this.validateField(fund.amount, 'currency');
      const currencyValid = this.validateField(fund.currency, 'text');
      
      return typeValid.isValid && amountValid.isValid && currencyValid.isValid;
    });

    const hasValidFunds = validFunds.length > 0;
    const totalFunds = funds.length;

    return {
      complete: hasValidFunds ? 1 : 0,
      total: 1,
      state: hasValidFunds ? 'complete' : 'missing',
      validFundCount: validFunds.length,
      totalFundCount: totalFunds,
      percentage: hasValidFunds ? 100 : 0,
      details: {
        validFunds: validFunds.length,
        totalFunds: totalFunds,
        hasMinimumFunds: hasValidFunds
      }
    };
  }

  /**
   * Calculate travel completion
   * @param {Object} travel - Travel data
   * @returns {Object} - Travel completion metrics
   */
  calculateTravelCompletion(travel = {}) {
    const firstNonEmpty = (...candidates) => {
      for (const candidate of candidates) {
        if (candidate === null || candidate === undefined) {
          continue;
        }

        if (typeof candidate === 'string') {
          const trimmed = candidate.trim();
          if (trimmed.length > 0) {
            return trimmed;
          }
        } else if (typeof candidate === 'number') {
          return candidate.toString();
        } else if (candidate) {
          return `${candidate}`;
        }
      }
      return '';
    };

    const travelPurpose = firstNonEmpty(
      travel.travelPurpose,
      travel.purpose,
      travel.tripPurpose
    );

    const arrivalDate = firstNonEmpty(
      travel.arrivalDate,
      travel.arrivalArrivalDate,
      travel.arrivalDepartureDate,
      travel.dateOfArrival
    );

    const departureDate = firstNonEmpty(
      travel.departureDate,
      travel.departureDepartureDate,
      travel.departureArrivalDate,
      travel.dateOfDeparture
    );

    const combinedFlightNumber = (() => {
      const arrivalFlight = firstNonEmpty(
        travel.arrivalFlightNumber,
        travel.arrivalFlight
      );
      const departureFlight = firstNonEmpty(
        travel.departureFlightNumber,
        travel.returnFlightNumber,
        travel.departureFlight
      );

      if (arrivalFlight && departureFlight) {
        return `${arrivalFlight}/${departureFlight}`;
      }

      return firstNonEmpty(
        travel.flightNumber,
        arrivalFlight,
        departureFlight
      );
    })();

    const accommodation = (() => {
      if (travel.isTransitPassenger) {
        return 'Transit passenger';
      }

      // Check if we have a meaningful accommodation value
      // For HOTEL/HOSTEL/RESORT types, we need both address AND province
      const accommodationType = firstNonEmpty(
        travel.accommodationType,
        travel.customAccommodationType
      );

      const hotelAddress = firstNonEmpty(
        travel.hotelAddress,
        travel.accommodation,
        travel.stayAddress
      );

      const hotelName = firstNonEmpty(
        travel.hotelName,
        travel.accommodationName
      );

      const province = firstNonEmpty(travel.province);

      // If accommodation type requires address (HOTEL, HOSTEL, RESORT, etc.)
      // Then we need BOTH province AND (hotelAddress OR hotelName)
      if (accommodationType) {
        const requiresAddress = ['HOTEL', 'HOSTEL', 'RESORT', 'APARTMENT', 'GUESTHOUSE', 'VILLA'].includes(
          accommodationType.toUpperCase()
        );

        if (requiresAddress) {
          // For these types, we need province AND (address OR name)
          const hasLocation = province && (hotelAddress || hotelName);
          if (hasLocation) {
            const parts = [hotelName || hotelAddress, province].filter(Boolean);
            return parts.join(', ');
          }
          // If province or address is missing, return empty (incomplete)
          return '';
        } else {
          // For other types (FRIEND, RELATIVE, etc.), just the type is enough
          return accommodationType;
        }
      }

      // Fallback: try to build from location parts only
      const locationParts = [
        travel.province,
        travel.district,
        travel.subDistrict,
        travel.postalCode
      ]
        .map(value => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);

      if (locationParts.length > 0) {
        return locationParts.join(', ');
      }

      return '';
    })();

    // Updated to match UI granular field counting (7-10 fields instead of 5 logical fields)
    // This ensures the completion percentage matches what users see in the Thailand screen
    const requiredFields = [
      { name: 'travelPurpose', type: 'text', value: travelPurpose },
      { name: 'recentStayCountry', type: 'text', value: firstNonEmpty(travel.recentStayCountry) },
      { name: 'boardingCountry', type: 'text', value: firstNonEmpty(travel.boardingCountry) },
      { name: 'arrivalFlightNumber', type: 'text', value: firstNonEmpty(travel.arrivalFlightNumber, travel.arrivalFlight) },
      { name: 'arrivalArrivalDate', type: 'date', value: arrivalDate },
      { name: 'departureFlightNumber', type: 'text', value: firstNonEmpty(travel.departureFlightNumber, travel.returnFlightNumber, travel.departureFlight) },
      { name: 'departureDepartureDate', type: 'date', value: departureDate }
    ];

    // Add accommodation fields only if not a transit passenger
    if (!travel.isTransitPassenger) {
      const accommodationType = firstNonEmpty(
        travel.accommodationType,
        travel.customAccommodationType
      );
      const province = firstNonEmpty(travel.province);
      const hotelAddress = firstNonEmpty(
        travel.hotelAddress,
        travel.accommodation,
        travel.stayAddress
      );

      requiredFields.push(
        { name: 'accommodationType', type: 'text', value: accommodationType },
        { name: 'province', type: 'text', value: province },
        { name: 'hotelAddress', type: 'text', value: hotelAddress }
      );
    }

    const fieldResults = requiredFields.map(field => ({
      name: field.name,
      ...this.validateField(field.value, field.type)
    }));

    const completedCount = fieldResults.filter(field => field.isValid && field.hasValue).length;
    const totalCount = requiredFields.length;

    return {
      complete: completedCount,
      total: totalCount,
      state: this.computeCategoryState(fieldResults),
      fields: fieldResults,
      percentage: Math.round((completedCount / totalCount) * 100)
    };
  }

  /**
   * Get total completion percentage across all categories
   * @param {Object} metrics - Completion metrics from calculateCompletionMetrics
   * @returns {number} - Total completion percentage (0-100)
   */
  getTotalCompletionPercent(metrics) {
    if (!metrics) {
      return 0;
    }

    const totalCompleted = Object.values(metrics).reduce((sum, metric) => sum + metric.complete, 0);
    const totalRequired = Object.values(metrics).reduce((sum, metric) => sum + metric.total, 0);

    return totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;
  }

  /**
   * Get missing fields by category
   * @param {Object} metrics - Completion metrics
   * @returns {Object} - Missing fields grouped by category
   */
  getMissingFields(metrics) {
    const missing = {};

    Object.keys(metrics).forEach(category => {
      const categoryMetrics = metrics[category];
      
      if (categoryMetrics.state !== 'complete') {
        if (category === 'funds') {
          // Special handling for funds
          missing[category] = categoryMetrics.validFundCount === 0 
            ? ['At least one fund item with type, amount, and currency']
            : [];
        } else if (categoryMetrics.fields) {
          // Regular field-based categories
          missing[category] = categoryMetrics.fields
            .filter(field => !field.isValid || !field.hasValue)
            .map(field => field.name);
        } else {
          missing[category] = ['Category incomplete'];
        }
      } else {
        missing[category] = [];
      }
    });

    return missing;
  }

  /**
   * Check if entry is ready for submission
   * @param {Object} metrics - Completion metrics
   * @returns {boolean} - Is ready for submission
   */
  isReadyForSubmission(metrics) {
    // Allow submission even if passport is missing (can be added later)
    // But require all other categories to be complete
    const requiredCategories = ['personalInfo', 'funds', 'travel'];
    const allRequiredComplete = requiredCategories.every(category =>
      metrics[category] && metrics[category].state === 'complete'
    );

    // Passport is optional for submission (can be added later)
    const passportComplete = !metrics.passport || metrics.passport.state === 'complete';

    return allRequiredComplete && passportComplete;
  }

  /**
   * Get completion summary for display
   * @param {Object} entryInfo - Complete entry information
   * @returns {Object} - Completion summary
   */
  getCompletionSummary(entryInfo) {
    const metrics = this.calculateCompletionMetrics(entryInfo);
    const totalPercent = this.getTotalCompletionPercent(metrics);
    const missingFields = this.getMissingFields(metrics);
    const isReady = this.isReadyForSubmission(metrics);

    return {
      totalPercent,
      metrics,
      missingFields,
      isReady,
      categorySummary: {
        passport: {
          state: metrics.passport.state,
          percentage: metrics.passport.percentage,
          completed: metrics.passport.complete,
          total: metrics.passport.total
        },
        personalInfo: {
          state: metrics.personalInfo.state,
          percentage: metrics.personalInfo.percentage,
          completed: metrics.personalInfo.complete,
          total: metrics.personalInfo.total
        },
        funds: {
          state: metrics.funds.state,
          percentage: metrics.funds.percentage,
          validFunds: metrics.funds.validFundCount,
          totalFunds: metrics.funds.totalFundCount
        },
        travel: {
          state: metrics.travel.state,
          percentage: metrics.travel.percentage,
          completed: metrics.travel.complete,
          total: metrics.travel.total
        }
      }
    };
  }

  /**
   * Generate cache key for entry info
   * @param {Object} entryInfo - Entry information
   * @returns {string} - Cache key
   */
  generateCacheKey(entryInfo) {
    // Create a hash-like key based on entry info content
    const keyData = {
      passport: entryInfo.passport || {},
      personalInfo: entryInfo.personalInfo || {},
      funds: (entryInfo.funds || []).length,
      travel: entryInfo.travel || {},
      timestamp: entryInfo.lastUpdatedAt || entryInfo.updatedAt
    };

    return JSON.stringify(keyData);
  }

  /**
   * Get cached result if available and not expired
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} - Cached result or null
   */
  getCachedResult(cacheKey) {
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.result;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Set cached result
   * @param {string} cacheKey - Cache key
   * @param {Object} result - Result to cache
   */
  setCachedResult(cacheKey, result) {
    // Limit cache size to prevent memory issues
    if (this.cache.size > 100) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.slice(0, 50).forEach(([key]) => this.cache.delete(key));
    }

    this.cache.set(cacheKey, {
      result: result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear completion cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: this.cache.size,
      destinationProgressCacheSize: this.destinationProgressCache.size,
      destinationCacheTimeout: this.destinationCacheTimeout
    };
  }

  /**
   * Calculate completion metrics for multiple destinations
   * @param {Object} allDestinationData - Data for all destinations { destinationId: entryInfo }
   * @returns {Object} - Multi-destination completion metrics
   */
  calculateMultiDestinationMetrics(allDestinationData) {
    const multiDestinationMetrics = {};
    let totalCompletedDestinations = 0;
    let totalDestinations = 0;
    let overallCompletionSum = 0;

    for (const [destinationId, entryInfo] of Object.entries(allDestinationData)) {
      if (!entryInfo) {
        // Destination has no data yet
        multiDestinationMetrics[destinationId] = this.getEmptyDestinationMetrics(destinationId);
        totalDestinations++;
        continue;
      }

      // Calculate metrics for this destination
      const destinationMetrics = this.calculateCompletionMetrics(entryInfo);
      const totalPercent = this.getTotalCompletionPercent(destinationMetrics);
      
      multiDestinationMetrics[destinationId] = {
        ...destinationMetrics,
        destinationId,
        totalPercent,
        isReady: this.isReadyForSubmission(destinationMetrics),
        lastUpdated: entryInfo.lastUpdatedAt || entryInfo.updatedAt || new Date().toISOString()
      };

      overallCompletionSum += totalPercent;
      totalDestinations++;
      
      if (totalPercent === 100) {
        totalCompletedDestinations++;
      }
    }

    const overallCompletionPercent = totalDestinations > 0 
      ? Math.round(overallCompletionSum / totalDestinations) 
      : 0;

    return {
      destinations: multiDestinationMetrics,
      summary: {
        totalDestinations,
        completedDestinations: totalCompletedDestinations,
        inProgressDestinations: totalDestinations - totalCompletedDestinations,
        overallCompletionPercent,
        hasAnyProgress: overallCompletionPercent > 0,
        allDestinationsComplete: totalCompletedDestinations === totalDestinations && totalDestinations > 0
      },
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Get empty metrics for a destination with no data
   * @param {string} destinationId - Destination ID
   * @returns {Object} - Empty destination metrics
   */
  getEmptyDestinationMetrics(destinationId) {
    return {
      destinationId,
      passport: { complete: 0, total: 5, state: 'missing', percentage: 0 },
      personalInfo: { complete: 0, total: 6, state: 'missing', percentage: 0 },
      funds: { complete: 0, total: 1, state: 'missing', percentage: 0 },
      travel: { complete: 0, total: 5, state: 'missing', percentage: 0 },
      totalPercent: 0,
      isReady: false,
      lastUpdated: null
    };
  }

  /**
   * Get completion summary for specific destination
   * @param {string} destinationId - Destination ID
   * @param {Object} entryInfo - Entry info for the destination
   * @returns {Object} - Destination-specific completion summary
   */
  getDestinationCompletionSummary(destinationId, entryInfo) {
    const cacheKey = `destination_${destinationId}_${this.generateCacheKey(entryInfo)}`;
    
    // Check destination cache first
    const cached = this.getDestinationCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    const metrics = this.calculateCompletionMetrics(entryInfo);
    const totalPercent = this.getTotalCompletionPercent(metrics);
    const missingFields = this.getMissingFields(metrics);
    const isReady = this.isReadyForSubmission(metrics);

    const summary = {
      destinationId,
      totalPercent,
      metrics,
      missingFields,
      isReady,
      categorySummary: {
        passport: {
          state: metrics.passport.state,
          percentage: metrics.passport.percentage,
          completed: metrics.passport.complete,
          total: metrics.passport.total
        },
        personalInfo: {
          state: metrics.personalInfo.state,
          percentage: metrics.personalInfo.percentage,
          completed: metrics.personalInfo.complete,
          total: metrics.personalInfo.total
        },
        funds: {
          state: metrics.funds.state,
          percentage: metrics.funds.percentage,
          validFunds: metrics.funds.validFundCount,
          totalFunds: metrics.funds.totalFundCount
        },
        travel: {
          state: metrics.travel.state,
          percentage: metrics.travel.percentage,
          completed: metrics.travel.complete,
          total: metrics.travel.total
        }
      },
      lastUpdated: entryInfo.lastUpdatedAt || entryInfo.updatedAt || new Date().toISOString()
    };

    // Cache the result
    this.setDestinationCachedResult(cacheKey, summary);

    return summary;
  }

  /**
   * Get progress summary for all destinations for a user
   * @param {string} userId - User ID
   * @param {Array} destinationIds - Array of destination IDs to check
   * @returns {Promise<Object>} - Multi-destination progress summary
   */
  async getMultiDestinationProgress(userId, destinationIds = []) {
    try {
      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../services/data/UserDataService').default;
      
      const allDestinationData = {};
      
      // Load entry info for each destination
      for (const destinationId of destinationIds) {
        try {
          const entryInfo = await UserDataService.getEntryInfoByDestination(destinationId);
          allDestinationData[destinationId] = entryInfo;
        } catch (error) {
          console.log(`Failed to load entry info for destination ${destinationId}:`, error.message);
          allDestinationData[destinationId] = null;
        }
      }

      return this.calculateMultiDestinationMetrics(allDestinationData);
    } catch (error) {
      console.error('Failed to get multi-destination progress:', error);
      return {
        destinations: {},
        summary: {
          totalDestinations: 0,
          completedDestinations: 0,
          inProgressDestinations: 0,
          overallCompletionPercent: 0,
          hasAnyProgress: false,
          allDestinationsComplete: false
        },
        calculatedAt: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get destinations with any progress for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of destination IDs with progress
   */
  async getDestinationsWithProgress(userId) {
    try {
      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../services/data/UserDataService').default;
      
      // Get all entry infos for the user
      const allEntryInfos = await UserDataService.getAllEntryInfosForUser(userId);
      
      const destinationsWithProgress = [];
      
      for (const entryInfo of allEntryInfos) {
        if (entryInfo.destinationId) {
          const metrics = this.calculateCompletionMetrics(entryInfo);
          const totalPercent = this.getTotalCompletionPercent(metrics);
          
          if (totalPercent > 0) {
            destinationsWithProgress.push({
              destinationId: entryInfo.destinationId,
              completionPercent: totalPercent,
              isReady: this.isReadyForSubmission(metrics),
              lastUpdated: entryInfo.lastUpdatedAt || entryInfo.updatedAt
            });
          }
        }
      }
      
      // Sort by completion percentage (highest first) and then by last updated
      destinationsWithProgress.sort((a, b) => {
        if (a.completionPercent !== b.completionPercent) {
          return b.completionPercent - a.completionPercent;
        }
        return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
      });
      
      return destinationsWithProgress;
    } catch (error) {
      console.error('Failed to get destinations with progress:', error);
      return [];
    }
  }

  /**
   * Switch destination context without losing progress
   * @param {string} fromDestinationId - Current destination ID
   * @param {string} toDestinationId - Target destination ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Switch result with both destination summaries
   */
  async switchDestinationContext(fromDestinationId, toDestinationId, userId) {
    try {
      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../services/data/UserDataService').default;
      
      // Get entry info for both destinations
      const [fromEntryInfo, toEntryInfo] = await Promise.all([
        UserDataService.getEntryInfoByDestination(fromDestinationId),
        UserDataService.getEntryInfoByDestination(toDestinationId)
      ]);
      
      const fromSummary = fromEntryInfo 
        ? this.getDestinationCompletionSummary(fromDestinationId, fromEntryInfo)
        : this.getEmptyDestinationMetrics(fromDestinationId);
        
      const toSummary = toEntryInfo 
        ? this.getDestinationCompletionSummary(toDestinationId, toEntryInfo)
        : this.getEmptyDestinationMetrics(toDestinationId);
      
      return {
        fromDestination: {
          destinationId: fromDestinationId,
          ...fromSummary
        },
        toDestination: {
          destinationId: toDestinationId,
          ...toSummary
        },
        switchedAt: new Date().toISOString(),
        progressPreserved: true
      };
    } catch (error) {
      console.error('Failed to switch destination context:', error);
      return {
        fromDestination: this.getEmptyDestinationMetrics(fromDestinationId),
        toDestination: this.getEmptyDestinationMetrics(toDestinationId),
        switchedAt: new Date().toISOString(),
        progressPreserved: false,
        error: error.message
      };
    }
  }

  /**
   * Get cached result for destination-specific calculations
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} - Cached result or null
   */
  getDestinationCachedResult(cacheKey) {
    const cached = this.destinationProgressCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.destinationCacheTimeout) {
      return cached.result;
    }

    // Remove expired cache entry
    if (cached) {
      this.destinationProgressCache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Set cached result for destination-specific calculations
   * @param {string} cacheKey - Cache key
   * @param {Object} result - Result to cache
   */
  setDestinationCachedResult(cacheKey, result) {
    // Limit cache size to prevent memory issues
    if (this.destinationProgressCache.size > 50) {
      // Remove oldest entries
      const entries = Array.from(this.destinationProgressCache.entries());
      entries.slice(0, 25).forEach(([key]) => this.destinationProgressCache.delete(key));
    }

    this.destinationProgressCache.set(cacheKey, {
      result: result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear destination progress cache
   * @param {string} destinationId - Optional destination ID to clear specific cache
   */
  clearDestinationCache(destinationId = null) {
    if (destinationId) {
      // Clear cache entries for specific destination
      const keysToDelete = [];
      for (const [key] of this.destinationProgressCache.entries()) {
        if (key.includes(`destination_${destinationId}_`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.destinationProgressCache.delete(key));
    } else {
      // Clear all destination cache
      this.destinationProgressCache.clear();
    }
  }

  /**
   * Clear all caches (both regular and destination-specific)
   */
  clearAllCaches() {
    this.clearCache();
    this.clearDestinationCache();
  }

  /**
   * Get completion status for home screen display
   * @param {string} userId - User ID
   * @param {Array} priorityDestinations - Priority destinations to show first
   * @returns {Promise<Object>} - Home screen completion data
   */
  async getHomeScreenCompletionData(userId, priorityDestinations = ['th', 'jp', 'sg', 'my']) {
    try {
      // Get destinations with any progress
      const destinationsWithProgress = await this.getDestinationsWithProgress(userId);
      
      // Get multi-destination progress for priority destinations
      const allDestinations = [...new Set([...priorityDestinations, ...destinationsWithProgress.map(d => d.destinationId)])];
      const multiDestinationProgress = await this.getMultiDestinationProgress(userId, allDestinations);
      
      // Separate into categories for home screen display
      const inProgressDestinations = [];
      const readyDestinations = [];
      const emptyDestinations = [];
      
      for (const destinationId of allDestinations) {
        const destinationData = multiDestinationProgress.destinations[destinationId];
        
        if (!destinationData || destinationData.totalPercent === 0) {
          emptyDestinations.push({
            destinationId,
            completionPercent: 0,
            state: 'empty'
          });
        } else if (destinationData.isReady) {
          readyDestinations.push({
            destinationId,
            completionPercent: destinationData.totalPercent,
            state: 'ready',
            lastUpdated: destinationData.lastUpdated
          });
        } else {
          inProgressDestinations.push({
            destinationId,
            completionPercent: destinationData.totalPercent,
            state: 'in_progress',
            lastUpdated: destinationData.lastUpdated
          });
        }
      }
      
      return {
        summary: multiDestinationProgress.summary,
        inProgressDestinations,
        readyDestinations,
        emptyDestinations,
        hasAnyProgress: inProgressDestinations.length > 0 || readyDestinations.length > 0,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get home screen completion data:', error);
      return {
        summary: {
          totalDestinations: 0,
          completedDestinations: 0,
          inProgressDestinations: 0,
          overallCompletionPercent: 0,
          hasAnyProgress: false,
          allDestinationsComplete: false
        },
        inProgressDestinations: [],
        readyDestinations: [],
        emptyDestinations: [],
        hasAnyProgress: false,
        calculatedAt: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Export singleton instance
const entryCompletionCalculator = new EntryCompletionCalculator();

export default entryCompletionCalculator;
