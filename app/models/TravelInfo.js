/**
 * 入境通 - Travel Information Data Model
 * Defines the structure for trip-specific travel information
 * 
 * This model stores draft travel information that users can resume filling out.
 * It's designed for progressive data entry where users may fill fields incrementally.
 */

import SecureStorageService from '../services/security/SecureStorageService';

class TravelInfo {
  constructor(data = {}) {
    this.id = data.id || TravelInfo.generateId();
    this.userId = data.userId;
    this.destination = data.destination; // e.g., 'Thailand', 'Japan'
    
    // Travel Purpose
    this.travelPurpose = data.travelPurpose || 'HOLIDAY'; // HOLIDAY, MEETING, SPORTS, BUSINESS, etc.
    
    // Recent stay (last 14 days) country for health declaration
    this.recentStayCountry = data.recentStayCountry || '';
    
    // Visa Information (optional)
    this.visaNumber = data.visaNumber || '';
    
    // Boarding Country
    this.boardingCountry = data.boardingCountry || ''; // Country/region where boarding the flight
    
    // Arrival Flight Information (来泰国机票)
    this.arrivalFlightNumber = data.arrivalFlightNumber || '';
    this.arrivalDepartureAirport = data.arrivalDepartureAirport || '';
    this.arrivalDepartureDate = data.arrivalDepartureDate || '';
    this.arrivalArrivalAirport = data.arrivalArrivalAirport || '';
    this.arrivalArrivalDate = data.arrivalArrivalDate || '';
    this.arrivalFlightTicketPhotoUri = data.arrivalFlightTicketPhotoUri || ''; // Flight ticket photo

    // Departure Flight Information (离开泰国机票)
    this.departureFlightNumber = data.departureFlightNumber || '';
    this.departureDepartureAirport = data.departureDepartureAirport || '';
    this.departureDepartureDate = data.departureDepartureDate || '';
    this.departureArrivalAirport = data.departureArrivalAirport || '';
    this.departureArrivalDate = data.departureArrivalDate || '';

    // Accommodation Information
    this.isTransitPassenger = data.isTransitPassenger || false; // Transit passenger flag
    this.accommodationType = data.accommodationType || 'HOTEL'; // HOTEL, YOUTH_HOSTEL, GUEST_HOUSE, FRIEND_HOUSE, APARTMENT, or custom
    this.province = data.province || ''; // Province (required for all types)
    this.district = data.district || ''; // District (required for non-hotel types)
    this.subDistrict = data.subDistrict || ''; // Sub-district (required for non-hotel types)
    this.postalCode = data.postalCode || ''; // Postal code (required for non-hotel types)
    this.hotelName = data.hotelName || ''; // Hotel name (for hotel types)
    this.hotelAddress = data.hotelAddress || ''; // Detailed address
    this.hotelBookingPhotoUri = data.hotelBookingPhotoUri || ''; // Hotel booking photo
    this.accommodationPhone = data.accommodationPhone || ''; // Accommodation phone (for Japan)
    this.lengthOfStay = data.lengthOfStay || ''; // Length of stay in days
    
    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.status = data.status || 'draft'; // draft, completed
  }

  /**
   * Generate unique travel info ID
   * @returns {string} - Unique travel info ID
   */
  static generateId() {
    return `travel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate travel information
   * @returns {Object} - Validation result {isValid, errors}
   */
  validate() {
    const errors = [];

    // For progressive filling, we don't require all fields
    // Just validate format of fields that are provided

    // Validate flight numbers if provided
    if (this.arrivalFlightNumber && !this.isValidFlightNumber(this.arrivalFlightNumber)) {
      errors.push('Invalid arrival flight number format');
    }
    if (this.departureFlightNumber && !this.isValidFlightNumber(this.departureFlightNumber)) {
      errors.push('Invalid departure flight number format');
    }
    if (this.visaNumber && !this.isValidVisaNumber(this.visaNumber)) {
      errors.push('Invalid visa number format');
    }

    // Validate dates if provided
    const dateFields = [
      { field: this.arrivalDepartureDate, name: 'Arrival departure date' },
      { field: this.arrivalArrivalDate, name: 'Arrival arrival date' },
      { field: this.departureDepartureDate, name: 'Departure departure date' },
      { field: this.departureArrivalDate, name: 'Departure arrival date' }
    ];

    dateFields.forEach(({ field, name }) => {
      if (field && !this.isValidDate(field)) {
        errors.push(`Invalid ${name} format (expected YYYY-MM-DD)`);
      }
    });

    // Time fields removed from schema - no validation needed

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate date format (YYYY-MM-DD)
   * @param {string} dateStr - Date string
   * @returns {boolean} - Is valid date
   */
  isValidDate(dateStr) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  // Time validation removed - time fields no longer in schema

  /**
   * Validate flight number format
   * @param {string} flightNumber - Flight number
   * @returns {boolean} - Is valid format
   */
  isValidFlightNumber(flightNumber) {
    // Basic flight number validation: airline code (2-3 letters) + number (1-4 digits)
    const flightRegex = /^[A-Z]{2,3}\d{1,4}$/i;
    return flightRegex.test(flightNumber.replace(/\s/g, ''));
  }

  /**
   * Validate visa number format
   * Allows alphanumeric strings (5-15 chars) without spaces
   * @param {string} visaNumber - Visa number
   * @returns {boolean} - Is valid format
   */
  isValidVisaNumber(visaNumber) {
    const visaRegex = /^[A-Za-z0-9]{5,15}$/;
    return visaRegex.test(visaNumber);
  }

  /**
   * Check if travel info is complete
   * @returns {boolean} - Is complete
   */
  isComplete() {
    const requiredFields = [
      this.arrivalFlightNumber,
      this.arrivalDepartureAirport,
      this.arrivalDepartureDate,
      this.arrivalArrivalAirport,
      this.arrivalArrivalDate,
      this.departureFlightNumber,
      this.departureDepartureAirport,
      this.departureDepartureDate,
      this.departureArrivalAirport,
      this.departureArrivalDate,
      this.hotelName,
      this.hotelAddress
    ];

    return requiredFields.every(field => field && field.trim().length > 0);
  }

  /**
   * Get completion percentage
   * @returns {number} - Completion percentage (0-100)
   */
  getCompletionPercentage() {
    const fields = [
      this.arrivalFlightNumber,
      this.arrivalDepartureAirport,
      this.arrivalDepartureDate,
      this.arrivalArrivalAirport,
      this.arrivalArrivalDate,
      this.departureFlightNumber,
      this.departureDepartureAirport,
      this.departureDepartureDate,
      this.departureArrivalAirport,
      this.departureArrivalDate,
      this.hotelName,
      this.hotelAddress
    ];

    const filledCount = fields.filter(field => field && field.trim().length > 0).length;
    return Math.round((filledCount / fields.length) * 100);
  }

  /**
   * Save travel information to secure storage
   * @param {Object} options - Save options
   * @param {boolean} options.skipValidation - Skip validation for progressive filling
   * @returns {Promise<Object>} - Save result
   */
  async save(options = {}) {
    try {
      // Validate before saving (unless skipped for progressive filling)
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update timestamp and status
      this.updatedAt = new Date().toISOString();
      if (this.isComplete()) {
        this.status = 'completed';
      }

      // Save to secure storage
      const result = await SecureStorageService.saveTravelInfo({
        id: this.id,
        userId: this.userId,
        destination: this.destination,
        travelPurpose: this.travelPurpose,
        recentStayCountry: this.recentStayCountry,
        boardingCountry: this.boardingCountry,
        visaNumber: this.visaNumber,
        arrivalFlightNumber: this.arrivalFlightNumber,
        arrivalDepartureAirport: this.arrivalDepartureAirport,
        arrivalDepartureDate: this.arrivalDepartureDate,
        arrivalArrivalAirport: this.arrivalArrivalAirport,
        arrivalArrivalDate: this.arrivalArrivalDate,
        arrivalFlightTicketPhotoUri: this.arrivalFlightTicketPhotoUri,
        departureFlightNumber: this.departureFlightNumber,
        departureDepartureAirport: this.departureDepartureAirport,
        departureDepartureDate: this.departureDepartureDate,
        departureArrivalAirport: this.departureArrivalAirport,
        departureArrivalDate: this.departureArrivalDate,
        isTransitPassenger: this.isTransitPassenger,
        accommodationType: this.accommodationType,
        province: this.province,
        district: this.district,
        subDistrict: this.subDistrict,
        postalCode: this.postalCode,
        hotelName: this.hotelName,
        hotelAddress: this.hotelAddress,
        hotelBookingPhotoUri: this.hotelBookingPhotoUri,
        accommodationPhone: this.accommodationPhone,
        lengthOfStay: this.lengthOfStay,
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      });

      return result;
    } catch (error) {
      console.error('Failed to save travel info:', error);
      throw error;
    }
  }

  /**
   * Load travel information from secure storage
   * @param {string} userId - User ID
   * @param {string} destination - Destination (optional filter)
   * @returns {Promise<TravelInfo>} - TravelInfo instance
   */
  static async load(userId, destination = null) {
    try {
      const data = await SecureStorageService.getTravelInfo(userId, destination);
      
      if (!data) {
        return null;
      }

      return new TravelInfo(data);
    } catch (error) {
      console.error('Failed to load travel info:', error);
      throw error;
    }
  }

  /**
   * Update specific fields
   * @param {Object} updates - Fields to update
   * @param {Object} options - Update options
   * @param {boolean} options.skipValidation - Skip validation for progressive filling
   * @returns {Promise<Object>} - Update result
   */
  async update(updates, options = {}) {
    try {
      // Update fields
      Object.assign(this, updates);
      this.updatedAt = new Date().toISOString();

      // Validate updated data (unless skipped for progressive filling)
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Save updated data
      return await this.save(options);
    } catch (error) {
      console.error('Failed to update travel info:', error);
      throw error;
    }
  }

  /**
   * Merge updates without overwriting existing non-empty fields with empty values
   * @param {Object} updates - Fields to merge
   * @param {Object} options - Update options
   * @returns {Promise<Object>} - Update result
   */
  async mergeUpdates(updates, options = {}) {
    try {
      // Filter out empty/null/undefined values from updates
      const nonEmptyUpdates = {};
      
      for (const [key, value] of Object.entries(updates)) {
        // Skip metadata fields
        if (key === 'id' || key === 'createdAt') {
          continue;
        }
        
        // Only include non-empty values
        if (value !== null && value !== undefined) {
          if (typeof value === 'string') {
            if (value.trim().length > 0) {
              nonEmptyUpdates[key] = value;
            }
          } else {
            nonEmptyUpdates[key] = value;
          }
        }
      }

      // Merge non-empty updates
      Object.assign(this, nonEmptyUpdates);
      this.updatedAt = new Date().toISOString();

      // Validate merged data (unless skipped)
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Save merged data
      return await this.save(options);
    } catch (error) {
      console.error('Failed to merge travel info updates:', error);
      throw error;
    }
  }

  /**
   * Get travel info summary
   * @returns {Object} - Summary object
   */
  getSummary() {
    return {
      id: this.id,
      destination: this.destination,
      recentStayCountry: this.recentStayCountry,
      arrivalFlight: this.arrivalFlightNumber,
      departureFlight: this.departureFlightNumber,
      hotel: this.hotelName,
      completionPercentage: this.getCompletionPercentage(),
      isComplete: this.isComplete(),
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Export travel info data
   * @returns {Object} - Exportable data
   */
  exportData() {
    return {
      id: this.id,
      userId: this.userId,
      destination: this.destination,
      boardingCountry: this.boardingCountry,
      visaNumber: this.visaNumber,
      arrivalFlight: {
        flightNumber: this.arrivalFlightNumber,
        departureAirport: this.arrivalDepartureAirport,
        departureDate: this.arrivalDepartureDate,
        arrivalAirport: this.arrivalArrivalAirport,
        arrivalDate: this.arrivalArrivalDate
      },
      departureFlight: {
        flightNumber: this.departureFlightNumber,
        departureAirport: this.departureDepartureAirport,
        departureDate: this.departureDepartureDate,
        arrivalAirport: this.departureArrivalAirport,
        arrivalDate: this.departureArrivalDate
      },
      accommodation: {
        hotelName: this.hotelName,
        hotelAddress: this.hotelAddress
      },
      metadata: {
        completionPercentage: this.getCompletionPercentage(),
        isComplete: this.isComplete(),
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      }
    };
  }
}

export default TravelInfo;
