/**
 * Data Serialization/Deserialization Utilities
 *
 * Handles conversion between application objects and database rows
 * with proper JSON parsing and validation
 */

class DataSerializer {
  /**
   * Generate unique ID
   * @returns {string} - UUID-like string
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Safely parse JSON columns while tolerating invalid data
   * @param {*} value - Raw value from SQLite result
   * @param {*} fallback - Value to return when parsing fails
   * @returns {*} - Parsed JSON or fallback
   */
  safeJsonParse(value, fallback = null) {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    if (typeof value === 'object') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('Failed to parse JSON value:', {
        valuePreview: typeof value === 'string' ? value.slice(0, 200) : value,
        error: error.message
      });
      return fallback;
    }
  }

  /**
   * Normalize fund item identifiers from entry info payloads
   * @param {Object} entryInfoData - Entry info payload
   * @returns {Array<string>} - List of fund item IDs
   */
  extractFundItemIds(entryInfoData = {}) {
    const identifiers = [];

    if (!entryInfoData) {
      return identifiers;
    }

    if (Array.isArray(entryInfoData.fundItemIds)) {
      identifiers.push(...entryInfoData.fundItemIds);
    } else if (Array.isArray(entryInfoData.fundItems)) {
      identifiers.push(
        ...entryInfoData.fundItems.map(item => {
          if (!item) return null;
          if (typeof item === 'string') return item;
          return item.id || item.fundItemId || null;
        })
      );
    } else if (entryInfoData.fundItemId) {
      identifiers.push(entryInfoData.fundItemId);
    }

    return Array.from(
      new Set(
        identifiers
          .map(id => (typeof id === 'string' ? id.trim() : id))
          .filter(Boolean)
      )
    );
  }

  /**
   * Parse fund item IDs from aggregated SQL field
   * @param {string|null} aggregatedIds - Comma-separated fund item IDs
   * @returns {Array<string>} - List of fund item IDs
   */
  parseFundItemIds(aggregatedIds) {
    if (!aggregatedIds || typeof aggregatedIds !== 'string') {
      return [];
    }

    return aggregatedIds
      .split(',')
      .map(id => id?.trim())
      .filter(Boolean);
  }

  /**
   * Serialize entry info for database storage (v2.0 schema)
   * @param {Object} entryInfo - Entry info data
   * @returns {Object} - Serialized data
   */
  serializeEntryInfo(entryInfo) {
    return {
      id: entryInfo.id || this.generateId(),
      user_id: entryInfo.userId,
      passport_id: entryInfo.passportId,
      personal_info_id: entryInfo.personalInfoId || null,
      travel_info_id: entryInfo.travelInfoId || null,
      destination_id: entryInfo.destinationId,
      status: entryInfo.status || 'incomplete',
      completion_metrics: JSON.stringify(entryInfo.completionMetrics || {}),
      documents: JSON.stringify(entryInfo.documents || null),
      display_status: JSON.stringify(entryInfo.displayStatus || null),
      last_updated_at: entryInfo.lastUpdatedAt || new Date().toISOString(),
      created_at: entryInfo.createdAt || new Date().toISOString()
    };
  }

  /**
   * Deserialize entry info from database (v2.0 schema)
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized entry info
   */
  deserializeEntryInfo(row) {
    return {
      id: row.id,
      userId: row.user_id,
      passportId: row.passport_id,
      personalInfoId: row.personal_info_id,
      travelInfoId: row.travel_info_id,
      destinationId: row.destination_id,
      status: row.status,
      completionMetrics: this.safeJsonParse(row.completion_metrics, {}),
      documents: this.safeJsonParse(row.documents, null),
      displayStatus: this.safeJsonParse(row.display_status, null),
      lastUpdatedAt: row.last_updated_at,
      createdAt: row.created_at
    };
  }

  /**
   * Deserialize digital arrival card from database (v2.0 schema)
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized digital arrival card
   */
  deserializeDigitalArrivalCard(row) {
    return {
      id: row.id,
      entryInfoId: row.entry_info_id,
      userId: row.user_id,
      cardType: row.card_type,
      destinationId: row.destination_id,
      arrCardNo: row.arr_card_no,
      qrUri: row.qr_uri,
      pdfUrl: row.pdf_url,
      submittedAt: row.submitted_at,
      submissionMethod: row.submission_method,
      status: row.status,
      apiResponse: this.safeJsonParse(row.api_response, null),
      processingTime: row.processing_time,
      retryCount: row.retry_count || 0,
      errorDetails: this.safeJsonParse(row.error_details, null),
      isSuperseded: row.is_superseded === 1,
      supersededAt: row.superseded_at,
      supersededReason: row.superseded_reason,
      supersededBy: row.superseded_by,
      version: row.version || 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Map database row to passport object
   * @param {Object} row - Database row
   * @param {Object} decryptedFields - Decrypted sensitive fields
   * @returns {Object} - Passport object
   */
  deserializePassport(row, decryptedFields) {
    return {
      id: row.id,
      userId: row.user_id,
      passportNumber: decryptedFields.passport_number,
      fullName: decryptedFields.full_name,
      dateOfBirth: decryptedFields.date_of_birth,
      nationality: decryptedFields.nationality,
      gender: row.gender,
      expiryDate: row.expiry_date,
      issueDate: row.issue_date,
      issuePlace: row.issue_place,
      photoUri: row.photo_uri,
      isPrimary: row.is_primary === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Map database row to personal info object
   * @param {Object} row - Database row
   * @param {Object} decryptedFields - Decrypted sensitive fields
   * @returns {Object} - Personal info object
   */
  deserializePersonalInfo(row, decryptedFields) {
    return {
      id: row.id,
      userId: row.user_id,
      passportId: row.passport_id,
      phoneNumber: decryptedFields.phone_number,
      email: decryptedFields.email,
      homeAddress: decryptedFields.home_address,
      occupation: row.occupation,
      provinceCity: row.province_city,
      countryRegion: row.country_region,
      phoneCode: row.phone_code,
      gender: row.gender,
      isDefault: row.is_default === 1,
      label: row.label,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Map database row to travel info object
   * @param {Object} row - Database row
   * @returns {Object} - Travel info object
   */
  deserializeTravelInfo(row) {
    return {
      id: row.id,
      userId: row.user_id,
      destination: row.destination,
      travelPurpose: row.travel_purpose,
      recentStayCountry: row.recent_stay_country,
      boardingCountry: row.boarding_country,
      visaNumber: row.visa_number,
      arrivalFlightNumber: row.arrival_flight_number,
      arrivalDepartureAirport: row.arrival_departure_airport,
      arrivalDepartureDate: row.arrival_departure_date,
      arrivalArrivalAirport: row.arrival_arrival_airport,
      arrivalArrivalDate: row.arrival_arrival_date,
      departureFlightNumber: row.departure_flight_number,
      departureDepartureAirport: row.departure_departure_airport,
      departureDepartureDate: row.departure_departure_date,
      departureArrivalAirport: row.departure_arrival_airport,
      departureArrivalDate: row.departure_arrival_date,
      accommodationType: row.accommodation_type,
      province: row.province,
      district: row.district,
      subDistrict: row.sub_district,
      postalCode: row.postal_code,
      hotelName: row.hotel_name,
      hotelAddress: row.hotel_address,
      accommodationPhone: row.accommodation_phone,
      lengthOfStay: row.length_of_stay,
      isTransitPassenger: row.is_transit_passenger === 1,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Map database row to fund item object
   * @param {Object} row - Database row
   * @returns {Object} - Fund item object
   */
  deserializeFundItem(row) {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      amount: row.amount,
      currency: row.currency,
      details: row.details,
      photoUri: row.photo_uri,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Map database row to passport country object
   * @param {Object} row - Database row
   * @returns {Object} - Passport country object
   */
  deserializePassportCountry(row) {
    return {
      passportId: row.passport_id,
      countryCode: row.country_code,
      visaRequired: row.visa_required === 1,
      maxStayDays: row.max_stay_days,
      notes: row.notes,
      createdAt: row.created_at
    };
  }
}

export default new DataSerializer();
