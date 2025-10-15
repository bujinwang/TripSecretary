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
    
    // Arrival Flight Information
    this.arrivalFlightNumber = data.arrivalFlightNumber || '';
    this.arrivalDepartureAirport = data.arrivalDepartureAirport || '';
    this.arrivalDepartureDate = data.arrivalDepartureDate || '';
    this.arrivalDepartureTime = data.arrivalDepartureTime || '';
    this.arrivalArrivalAirport = data.arrivalArrivalAirport || '';
    this.arrivalArrivalDate = data.arrivalArrivalDate || '';
    this.arrivalArrivalTime = data.arrivalArrivalTime || '';
    
    // Departure Flight Information
    this.departureFlightNumber = data.departureFlightNumber || '';
    this.departureDepartureAirport = data.departureDepartureAirport || '';
    this.departureDepartureDate = data.departureDepartureDate || '';
    this.departureDepartureTime = data.departureDepartureTime || '';
    this.departureArrivalAirport = data.departureArrivalAirport || '';
    this.departureArrivalDate = data.departureArrivalDate || '';
    this.departureArrivalTime = data.departureArrivalTime || '';
    
    // Accommodation Information
    this.hotelName = data.hotelName || '';
    this.hotelAddress = data.hotelAddress || '';
    
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

    // Validate times if provided
    const timeFields = [
      { field: this.arrivalDepartureTime, name: 'Arrival departure time' },
      { field: this.arrivalArrivalTime, name: 'Arrival arrival time' },
      { field: this.departureDepartureTime, name: 'Departure departure time' },
      { field: this.departureArrivalTime, name: 'Departure arrival time' }
    ];

    timeFields.forEach(({ field, name }) => {
      if (field && !this.isValidTime(field)) {
        errors.push(`Invalid ${name} format (expected HH:MM)`);
      }
    });

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

  /**
   * Validate time format (HH:MM)
   * @param {string} timeStr - Time string
   * @returns {boolean} - Is valid time
   */
  isValidTime(timeStr) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(timeStr);
  }

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
   * Check if travel info is complete
   * @returns {boolean} - Is complete
   */
  isComplete() {
    const requiredFields = [
      this.arrivalFlightNumber,
      this.arrivalDepartureAirport,
      this.arrivalDepartureDate,
      this.arrivalDepartureTime,
      this.arrivalArrivalAirport,
      this.arrivalArrivalDate,
      this.arrivalArrivalTime,
      this.departureFlightNumber,
      this.departureDepartureAirport,
      this.departureDepartureDate,
      this.departureDepartureTime,
      this.departureArrivalAirport,
      this.departureArrivalDate,
      this.departureArrivalTime,
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
      this.arrivalDepartureTime,
      this.arrivalArrivalAirport,
      this.arrivalArrivalDate,
      this.arrivalArrivalTime,
      this.departureFlightNumber,
      this.departureDepartureAirport,
      this.departureDepartureDate,
      this.departureDepartureTime,
      this.departureArrivalAirport,
      this.departureArrivalDate,
      this.departureArrivalTime,
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
        arrivalFlightNumber: this.arrivalFlightNumber,
        arrivalDepartureAirport: this.arrivalDepartureAirport,
        arrivalDepartureDate: this.arrivalDepartureDate,
        arrivalDepartureTime: this.arrivalDepartureTime,
        arrivalArrivalAirport: this.arrivalArrivalAirport,
        arrivalArrivalDate: this.arrivalArrivalDate,
        arrivalArrivalTime: this.arrivalArrivalTime,
        departureFlightNumber: this.departureFlightNumber,
        departureDepartureAirport: this.departureDepartureAirport,
        departureDepartureDate: this.departureDepartureDate,
        departureDepartureTime: this.departureDepartureTime,
        departureArrivalAirport: this.departureArrivalAirport,
        departureArrivalDate: this.departureArrivalDate,
        departureArrivalTime: this.departureArrivalTime,
        hotelName: this.hotelName,
        hotelAddress: this.hotelAddress,
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
      arrivalFlight: {
        flightNumber: this.arrivalFlightNumber,
        departureAirport: this.arrivalDepartureAirport,
        departureDate: this.arrivalDepartureDate,
        departureTime: this.arrivalDepartureTime,
        arrivalAirport: this.arrivalArrivalAirport,
        arrivalDate: this.arrivalArrivalDate,
        arrivalTime: this.arrivalArrivalTime
      },
      departureFlight: {
        flightNumber: this.departureFlightNumber,
        departureAirport: this.departureDepartureAirport,
        departureDate: this.departureDepartureDate,
        departureTime: this.departureDepartureTime,
        arrivalAirport: this.departureArrivalAirport,
        arrivalDate: this.departureArrivalDate,
        arrivalTime: this.departureArrivalTime
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
