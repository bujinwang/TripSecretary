/**
 * Travel Info Repository
 * Data access layer for travel information records
 *
 * Handles all database operations for travel info data including
 * CRUD operations, queries, and relationships.
 */

import DataSerializer from '../utils/DataSerializer';
import { formatLocalDate, isValidDateString } from '../../../utils/dateUtils';

class TravelInfoRepository {
  constructor(db) {
    this.db = db;
    this.serializer = DataSerializer;
    this.tableName = 'travel_info';
  }

  /**
   * Save or update a travel info record
   * @param {Object} travelData - Travel info data to save
   * @returns {Promise<Object>} - Saved travel info record
   */
  async save(travelData) {
    if (!travelData || !travelData.userId) {
      console.error('[TravelInfoRepository] Missing userId:', {
        hasTravelData: !!travelData,
        userId: travelData?.userId,
        userIdType: typeof travelData?.userId,
        allKeys: travelData ? Object.keys(travelData) : [],
      });
      throw new Error('Travel info data and userId are required');
    }

    const sanitizeTextField = (value) => {
      if (value === undefined || value === null) {
        return null;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
          return null;
        }

        // CRITICAL: Preserve date strings in YYYY-MM-DD format without conversion
        // Converting to Date and back can cause timezone bugs (e.g., Oct 31 → Oct 30)
        if (isValidDateString(trimmed)) {
          return trimmed;
        }

        return trimmed;
      }

      if (value instanceof Date) {
        // For Date objects, use timezone-safe formatting
        // This preserves the local date without UTC conversion
        return formatLocalDate(value);
      }

      if (typeof value === 'object') {
        if (typeof value.uri === 'string') {
          return value.uri;
        }

        if (typeof value.path === 'string') {
          return value.path;
        }

        if (typeof value.value === 'string') {
          return value.value;
        }

        try {
          return JSON.stringify(value);
        } catch (serializationError) {
          console.warn('TravelInfoRepository: Failed to serialize field value, coercing to string.', serializationError);
          return String(value);
        }
      }

      return String(value);
    };

    const id = travelData.id || this.serializer.generateId();
    const now = new Date().toISOString();
    const normalizedUserId = sanitizeTextField(travelData.userId);

    if (!normalizedUserId) {
      throw new Error('Travel info save failed: userId is invalid.');
    }

    const normalizedEntryInfoId = sanitizeTextField(travelData.entryInfoId);
    const normalizedDestination = sanitizeTextField(travelData.destination);

    console.log('TravelInfoRepository.save() called with:', {
      id,
      userId: normalizedUserId,
      entryInfoId: normalizedEntryInfoId,
      destination: normalizedDestination,
      hasId: !!travelData.id
    });
    const normalizedTravelPurpose = sanitizeTextField(travelData.travelPurpose || 'HOLIDAY') || 'HOLIDAY';
    const normalizedRecentStayCountry = sanitizeTextField(travelData.recentStayCountry);
    const normalizedBoardingCountry = sanitizeTextField(travelData.boardingCountry);
    const normalizedVisaNumber = sanitizeTextField(travelData.visaNumber);
    const normalizedArrivalFlightNumber = sanitizeTextField(travelData.arrivalFlightNumber);
    const normalizedArrivalDepartureAirport = sanitizeTextField(travelData.arrivalDepartureAirport);
    const normalizedArrivalDepartureDate = sanitizeTextField(travelData.arrivalDepartureDate);
    const normalizedArrivalArrivalAirport = sanitizeTextField(travelData.arrivalArrivalAirport);
    const normalizedArrivalArrivalDate = sanitizeTextField(travelData.arrivalArrivalDate);
    const normalizedArrivalFlightTicketPhotoUri = sanitizeTextField(
      travelData.flightTicketPhoto ?? travelData.arrivalFlightTicketPhotoUri
    );
    const normalizedDepartureFlightNumber = sanitizeTextField(travelData.departureFlightNumber);
    const normalizedDepartureDepartureAirport = sanitizeTextField(travelData.departureDepartureAirport);
    const normalizedDepartureDepartureDate = sanitizeTextField(travelData.departureDepartureDate);
    const normalizedDepartureArrivalAirport = sanitizeTextField(travelData.departureArrivalAirport);
    const normalizedDepartureArrivalDate = sanitizeTextField(travelData.departureArrivalDate);
    const normalizedDepartureFlightTicketPhotoUri = sanitizeTextField(
      travelData.departureFlightTicketPhoto ?? travelData.departureFlightTicketPhotoUri
    );
    const normalizedAccommodationType = sanitizeTextField(travelData.accommodationType || 'HOTEL') || 'HOTEL';
    const normalizedProvince = sanitizeTextField(travelData.province);
    const normalizedDistrict = sanitizeTextField(travelData.district);
    const normalizedSubDistrict = sanitizeTextField(travelData.subDistrict);
    const normalizedPostalCode = sanitizeTextField(travelData.postalCode);
    const normalizedHotelName = sanitizeTextField(travelData.hotelName);
    const normalizedHotelAddress = sanitizeTextField(travelData.hotelAddress);
    const normalizedHotelBookingPhotoUri = sanitizeTextField(
      travelData.hotelReservationPhoto ?? travelData.hotelBookingPhotoUri
    );
    const normalizedAccommodationPhone = sanitizeTextField(travelData.accommodationPhone);
    const normalizedLengthOfStay = sanitizeTextField(travelData.lengthOfStay);
    const normalizedStatus = sanitizeTextField(travelData.status || 'draft') || 'draft';
    const normalizedCreatedAt = sanitizeTextField(travelData.createdAt) || now;
    const isTransitPassengerFlag = travelData.isTransitPassenger ? 1 : 0;

    // Pre-emptively clear any conflicting records before INSERT OR REPLACE
    // This prevents UNIQUE constraint violations on entry_info_id
    try {
      if (normalizedEntryInfoId) {
        // First, check what records would be deleted
        const conflictingRecords = await this.db.getAllAsync(
          `SELECT id, entry_info_id, destination FROM ${this.tableName} WHERE entry_info_id = ? AND id != ?`,
          [normalizedEntryInfoId, id]
        );

        if (conflictingRecords.length > 0) {
          console.log(`TravelInfoRepository: Found ${conflictingRecords.length} conflicting record(s):`, conflictingRecords);

          // Delete any existing travel_info with this entry_info_id that has a different id
          await this.db.runAsync(
            `DELETE FROM ${this.tableName} WHERE entry_info_id = ? AND id != ?`,
            [normalizedEntryInfoId, id]
          );
          console.log(`TravelInfoRepository: Deleted ${conflictingRecords.length} conflicting record(s) with entry_info_id=${normalizedEntryInfoId}`);
        } else {
          console.log(`TravelInfoRepository: No conflicting records found for entry_info_id=${normalizedEntryInfoId}`);
        }
      } else {
        console.log('TravelInfoRepository: No entry_info_id provided, skipping conflict check');
      }
    } catch (cleanupError) {
      console.warn('TravelInfoRepository: Pre-save cleanup warning:', cleanupError);
      // Don't throw - proceed with save even if cleanup fails
    }

    const query = `
      INSERT OR REPLACE INTO ${this.tableName} (
        id, user_id, entry_info_id, destination, travel_purpose, recent_stay_country,
        boarding_country, visa_number, arrival_flight_number,
        arrival_departure_airport, arrival_departure_date,
        arrival_arrival_airport, arrival_arrival_date,
        arrival_flight_ticket_photo_uri,
        departure_flight_number, departure_departure_airport,
        departure_departure_date, departure_arrival_airport,
        departure_arrival_date, departure_flight_ticket_photo_uri,
        accommodation_type, province, district,
        sub_district, postal_code, hotel_name, hotel_address,
        hotel_booking_photo_uri,
        accommodation_phone, length_of_stay, is_transit_passenger,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      normalizedUserId,
      normalizedEntryInfoId,
      normalizedDestination,
      normalizedTravelPurpose,
      normalizedRecentStayCountry,
      normalizedBoardingCountry,
      normalizedVisaNumber,
      normalizedArrivalFlightNumber,
      normalizedArrivalDepartureAirport,
      normalizedArrivalDepartureDate,
      normalizedArrivalArrivalAirport,
      normalizedArrivalArrivalDate,
      normalizedArrivalFlightTicketPhotoUri,
      normalizedDepartureFlightNumber,
      normalizedDepartureDepartureAirport,
      normalizedDepartureDepartureDate,
      normalizedDepartureArrivalAirport,
      normalizedDepartureArrivalDate,
      normalizedDepartureFlightTicketPhotoUri,
      normalizedAccommodationType,
      normalizedProvince,
      normalizedDistrict,
      normalizedSubDistrict,
      normalizedPostalCode,
      normalizedHotelName,
      normalizedHotelAddress,
      normalizedHotelBookingPhotoUri,
      normalizedAccommodationPhone,
      normalizedLengthOfStay,
      isTransitPassengerFlag,
      normalizedStatus,
      normalizedCreatedAt,
      now
    ];

    try {
      await this.db.runAsync(query, params);
    } catch (error) {
      if (error?.code === 'ERR_INTERNAL_SQLITE_ERROR') {
        console.error(
          'TravelInfoRepository: SQLite internal error while saving travel info. Attempting recovery.',
          {
            userId: normalizedUserId,
            destination: normalizedDestination,
            entryInfoId: normalizedEntryInfoId,
            error: error.message,
          }
        );

        try {
          // Recovery strategy: Delete conflicting records by multiple criteria
          // This handles both (user_id, destination) duplicates and entry_info_id UNIQUE constraint violations
          const deletedRecords = [];

          // Strategy 1: Query and delete by user_id + destination (handles most common case)
          if (normalizedDestination) {
            const existingRecords = await this.db.getAllAsync(
              `SELECT id, destination, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND destination = ?`,
              [normalizedUserId, normalizedDestination]
            );

            if (existingRecords.length > 0) {
              deletedRecords.push(...existingRecords);
              await this.db.runAsync(
                `DELETE FROM ${this.tableName} WHERE user_id = ? AND destination = ?`,
                [normalizedUserId, normalizedDestination]
              );
              console.warn('⚠️  TravelInfoRepository: Deleted conflicting records by user_id + destination:', {
                count: existingRecords.length,
                records: existingRecords.map(r => ({ id: r.id, destination: r.destination, created_at: r.created_at }))
              });
            }
          } else {
            const existingRecords = await this.db.getAllAsync(
              `SELECT id, destination, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND destination IS NULL`,
              [normalizedUserId]
            );

            if (existingRecords.length > 0) {
              deletedRecords.push(...existingRecords);
              await this.db.runAsync(
                `DELETE FROM ${this.tableName} WHERE user_id = ? AND destination IS NULL`,
                [normalizedUserId]
              );
              console.warn('⚠️  TravelInfoRepository: Deleted conflicting records by user_id + NULL destination:', {
                count: existingRecords.length,
                records: existingRecords.map(r => ({ id: r.id, created_at: r.created_at }))
              });
            }
          }

          // Strategy 2: If entry_info_id is provided, also delete by entry_info_id to handle UNIQUE constraint
          if (normalizedEntryInfoId) {
            const existingRecords = await this.db.getAllAsync(
              `SELECT id, destination, created_at, updated_at FROM ${this.tableName} WHERE entry_info_id = ?`,
              [normalizedEntryInfoId]
            );

            if (existingRecords.length > 0) {
              // Avoid duplicates in deletedRecords
              const newRecords = existingRecords.filter(r => !deletedRecords.some(dr => dr.id === r.id));
              deletedRecords.push(...newRecords);

              await this.db.runAsync(
                `DELETE FROM ${this.tableName} WHERE entry_info_id = ?`,
                [normalizedEntryInfoId]
              );
              console.warn('⚠️  TravelInfoRepository: Deleted conflicting records by entry_info_id:', {
                count: existingRecords.length,
                records: existingRecords.map(r => ({ id: r.id, destination: r.destination, created_at: r.created_at }))
              });
            }
          }

          // Retry the insert
          await this.db.runAsync(query, params);

          console.warn(
            '✅ TravelInfoRepository: Recovery succeeded after clearing conflicting travel info records.',
            {
              userId: normalizedUserId,
              destination: normalizedDestination,
              entryInfoId: normalizedEntryInfoId,
              totalDeletedRecords: deletedRecords.length,
              warning: 'Previous travel info data was overwritten to resolve constraint violation'
            }
          );

          // Return info about deleted records so caller can handle it
          return {
            success: true,
            deletedRecords: deletedRecords,
            warning: 'Previous travel info was overwritten due to constraint violation'
          };
        } catch (recoveryError) {
          console.error('❌ TravelInfoRepository: Recovery attempt failed.', {
            error: recoveryError.message,
            originalError: error.message,
            userId: normalizedUserId,
            destination: normalizedDestination,
            entryInfoId: normalizedEntryInfoId,
          });
          recoveryError.cause = error;
          throw recoveryError;
        }
      } else {
        throw error;
      }
    }

    return this.getById(id);
  }

  /**
   * Get travel info by ID
   * @param {string} id - Travel info ID
   * @returns {Promise<Object|null>} - Travel info record or null
   */
  async getById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.db.getFirstAsync(query, [id]);

    if (!row) {
      return null;
    }

    return this.serializer.deserializeTravelInfo(row);
  }

  /**
   * Get all travel info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of travel info records
   */
  async getByUserId(userId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeTravelInfo(row));
  }

  /**
   * Get travel info by entry_info_id
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Object|null>} - Travel info record or null
   */
  async getByEntryInfoId(entryInfoId) {
    const query = `SELECT * FROM ${this.tableName} WHERE entry_info_id = ?`;
    const row = await this.db.getFirstAsync(query, [entryInfoId]);

    if (!row) {
      return null;
    }

    return this.serializer.deserializeTravelInfo(row);
  }

  /**
   * Get travel info by destination
   * @param {string} userId - User ID
   * @param {string} destination - Destination
   * @returns {Promise<Array>} - Array of travel info records
   */
  async getByDestination(userId, destination) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND destination = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, destination]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeTravelInfo(row));
  }

  /**
   * Get draft travel info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of draft travel info records
   */
  async getDraftByUserId(userId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND status = 'draft'
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeTravelInfo(row));
  }

  /**
   * Delete travel info
   * @param {string} id - Travel info ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.runAsync(query, [id]);
  }

  /**
   * Delete all travel info for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted records
   */
  async deleteByUserId(userId) {
    const query = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.runAsync(query, [userId]);
    return result.changes || 0;
  }

  /**
   * Count travel info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of travel info records
   */
  async countByUserId(userId) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.getFirstAsync(query, [userId]);
    return result?.count || 0;
  }

  /**
   * Check if travel info exists
   * @param {string} id - Travel info ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(id) {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.db.getFirstAsync(query, [id]);
    return !!result;
  }

  /**
   * Update travel info status
   * @param {string} id - Travel info ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateStatus(id, status) {
    const query = `
      UPDATE ${this.tableName}
      SET status = ?, updated_at = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [status, new Date().toISOString(), id]);
  }

  /**
   * Link travel info to entry_info
   * @param {string} travelInfoId - Travel info ID
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<void>}
   */
  async linkToEntryInfo(travelInfoId, entryInfoId) {
    const query = `
      UPDATE ${this.tableName}
      SET entry_info_id = ?, updated_at = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [entryInfoId, new Date().toISOString(), travelInfoId]);
  }

  /**
   * Unlink travel info from entry_info
   * @param {string} travelInfoId - Travel info ID
   * @returns {Promise<void>}
   */
  async unlinkFromEntryInfo(travelInfoId) {
    const query = `
      UPDATE ${this.tableName}
      SET entry_info_id = NULL, updated_at = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [new Date().toISOString(), travelInfoId]);
  }
}

export default TravelInfoRepository;
