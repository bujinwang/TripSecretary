/**
 * Travel Info Repository
 * Data access layer for travel information records
 *
 * Handles all database operations for travel info data including
 * CRUD operations, queries, and relationships.
 */

import DataSerializer from '../utils/DataSerializer';
import { formatLocalDate, isValidDateString } from '../../../utils/dateUtils';

// Type definitions
interface SQLiteDatabase {
  runAsync(query: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync(query: string, params?: unknown[]): Promise<unknown[]>;
  getFirstAsync(query: string, params?: unknown[]): Promise<unknown | null>;
  closeAsync(): Promise<void>;
  execAsync(query: string): Promise<void>;
  withTransactionAsync<T>(callback: () => Promise<T>): Promise<T>;
}

interface TravelInfoData {
  id?: string;
  userId: string;
  entryInfoId?: string | null;
  destination?: string | null;
  travelPurpose?: string;
  recentStayCountry?: string | null;
  boardingCountry?: string | null;
  visaNumber?: string | null;
  arrivalFlightNumber?: string | null;
  arrivalDepartureAirport?: string | null;
  arrivalDepartureDate?: string | null;
  arrivalArrivalAirport?: string | null;
  arrivalArrivalDate?: string | null;
  arrivalFlightTicketPhotoUri?: string | null;
  flightTicketPhoto?: string | null;
  departureFlightNumber?: string | null;
  departureDepartureAirport?: string | null;
  departureDepartureDate?: string | null;
  departureArrivalAirport?: string | null;
  departureArrivalDate?: string | null;
  departureFlightTicketPhotoUri?: string | null;
  accommodationType?: string;
  province?: string | null;
  district?: string | null;
  subDistrict?: string | null;
  postalCode?: string | null;
  hotelName?: string | null;
  hotelAddress?: string | null;
  hotelBookingPhotoUri?: string | null;
  hotelReservationPhoto?: string | null;
  accommodationPhone?: string | null;
  lengthOfStay?: string | null;
  status?: string;
  createdAt?: string;
  isTransitPassenger?: boolean;
  [key: string]: unknown;
}

interface TravelInfoRecord {
  id: string;
  userId: string;
  [key: string]: unknown;
}

interface SaveResult {
  success?: boolean;
  deletedRecords?: unknown[];
  warning?: string;
}

interface ConflictingRecord {
  id: string;
  destination?: string | null;
  created_at?: string;
  updated_at?: string;
  entry_info_id?: string | null;
}

class TravelInfoRepository {
  private db: SQLiteDatabase;
  private serializer: typeof DataSerializer;
  private tableName: string;

  constructor(db: SQLiteDatabase) {
    this.db = db;
    this.serializer = DataSerializer;
    this.tableName = 'travel_info';
  }

  /**
   * Save or update a travel info record
   * @param {Object} travelData - Travel info data to save
   * @returns {Promise<Object>} - Saved travel info record
   */
  async save(travelData: TravelInfoData): Promise<TravelInfoRecord | SaveResult> {
    if (!travelData || !travelData.userId) {
      throw new Error('Travel info data and userId are required');
    }

    const sanitizeTextField = (value: unknown): string | null => {
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

      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.uri === 'string') {
          return obj.uri;
        }

        if (typeof obj.path === 'string') {
          return obj.path;
        }

        if (typeof obj.value === 'string') {
          return obj.value;
        }

        try {
          return JSON.stringify(value);
        } catch (serializationError) {
          const errorMessage = serializationError instanceof Error ? serializationError.message : 'Unknown error';
          console.warn('TravelInfoRepository: Failed to serialize field value, coercing to string.', errorMessage);
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
        ) as ConflictingRecord[];

        if (conflictingRecords.length > 0) {
          // Delete any existing travel_info with this entry_info_id that has a different id
          await this.db.runAsync(
            `DELETE FROM ${this.tableName} WHERE entry_info_id = ? AND id != ?`,
            [normalizedEntryInfoId, id]
          );
        }
      }
    } catch (cleanupError) {
      const errorMessage = cleanupError instanceof Error ? cleanupError.message : 'Unknown error';
      console.warn('TravelInfoRepository: Pre-save cleanup warning:', errorMessage);
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
    } catch (error: unknown) {
      const errorObj = error as { code?: string; message?: string };
      if (errorObj?.code === 'ERR_INTERNAL_SQLITE_ERROR') {
        // Recovery strategy: Delete conflicting records by multiple criteria
        const deletedRecords: ConflictingRecord[] = [];

        // Strategy 1: Query and delete by user_id + destination
        if (normalizedDestination) {
          const existingRecords = await this.db.getAllAsync(
            `SELECT id, destination, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND destination = ?`,
            [normalizedUserId, normalizedDestination]
          ) as ConflictingRecord[];

          if (existingRecords.length > 0) {
            deletedRecords.push(...existingRecords);
            await this.db.runAsync(
              `DELETE FROM ${this.tableName} WHERE user_id = ? AND destination = ?`,
              [normalizedUserId, normalizedDestination]
            );
          }
        } else {
          const existingRecords = await this.db.getAllAsync(
            `SELECT id, destination, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND destination IS NULL`,
            [normalizedUserId]
          ) as ConflictingRecord[];

          if (existingRecords.length > 0) {
            deletedRecords.push(...existingRecords);
            await this.db.runAsync(
              `DELETE FROM ${this.tableName} WHERE user_id = ? AND destination IS NULL`,
              [normalizedUserId]
            );
          }
        }

        // Strategy 2: If entry_info_id is provided, also delete by entry_info_id
        if (normalizedEntryInfoId) {
          const existingRecords = await this.db.getAllAsync(
            `SELECT id, destination, created_at, updated_at FROM ${this.tableName} WHERE entry_info_id = ?`,
            [normalizedEntryInfoId]
          ) as ConflictingRecord[];

          if (existingRecords.length > 0) {
            const newRecords = existingRecords.filter(r => !deletedRecords.some(dr => dr.id === r.id));
            deletedRecords.push(...newRecords);

            await this.db.runAsync(
              `DELETE FROM ${this.tableName} WHERE entry_info_id = ?`,
              [normalizedEntryInfoId]
            );
          }
        }

        // Retry the insert
        await this.db.runAsync(query, params);

        // Return info about deleted records so caller can handle it
        return {
          success: true,
          deletedRecords,
          warning: 'Previous travel info was overwritten due to constraint violation'
        };
      } else {
        throw error;
      }
    }

    return this.getById(id) as Promise<TravelInfoRecord>;
  }

  /**
   * Get travel info by ID
   * @param {string} id - Travel info ID
   * @returns {Promise<Object|null>} - Travel info record or null
   */
  async getById(id: string): Promise<TravelInfoRecord | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.db.getFirstAsync(query, [id]);

    if (!row) {
      return null;
    }

    return this.serializer.deserializeTravelInfo(row) as TravelInfoRecord;
  }

  /**
   * Get all travel info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of travel info records
   */
  async getByUserId(userId: string): Promise<TravelInfoRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeTravelInfo(row) as TravelInfoRecord);
  }

  /**
   * Get travel info by entry_info_id
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Object|null>} - Travel info record or null
   */
  async getByEntryInfoId(entryInfoId: string): Promise<TravelInfoRecord | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE entry_info_id = ?`;
    const row = await this.db.getFirstAsync(query, [entryInfoId]);

    if (!row) {
      return null;
    }

    return this.serializer.deserializeTravelInfo(row) as TravelInfoRecord;
  }

  /**
   * Get travel info by destination
   * @param {string} userId - User ID
   * @param {string} destination - Destination
   * @returns {Promise<Array>} - Array of travel info records
   */
  async getByDestination(userId: string, destination: string): Promise<TravelInfoRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND destination = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, destination]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeTravelInfo(row) as TravelInfoRecord);
  }

  /**
   * Get draft travel info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of draft travel info records
   */
  async getDraftByUserId(userId: string): Promise<TravelInfoRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND status = 'draft'
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeTravelInfo(row) as TravelInfoRecord);
  }

  /**
   * Delete travel info
   * @param {string} id - Travel info ID
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.runAsync(query, [id]);
  }

  /**
   * Delete all travel info for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted records
   */
  async deleteByUserId(userId: string): Promise<number> {
    const query = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.runAsync(query, [userId]);
    return result.changes || 0;
  }

  /**
   * Count travel info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of travel info records
   */
  async countByUserId(userId: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.getFirstAsync(query, [userId]) as { count: number } | null;
    return result?.count || 0;
  }

  /**
   * Check if travel info exists
   * @param {string} id - Travel info ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(id: string): Promise<boolean> {
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
  async updateStatus(id: string, status: string): Promise<void> {
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
  async linkToEntryInfo(travelInfoId: string, entryInfoId: string): Promise<void> {
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
  async unlinkFromEntryInfo(travelInfoId: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET entry_info_id = NULL, updated_at = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [new Date().toISOString(), travelInfoId]);
  }
}

export default TravelInfoRepository;

