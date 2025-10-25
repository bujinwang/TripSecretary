/**
 * Travel Info Repository
 * Data access layer for travel information records
 *
 * Handles all database operations for travel info data including
 * CRUD operations, queries, and relationships.
 */

import DataSerializer from '../utils/DataSerializer';

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
      throw new Error('Travel info data and userId are required');
    }

    const id = travelData.id || this.serializer.generateId();
    const now = new Date().toISOString();

    const query = `
      INSERT OR REPLACE INTO ${this.tableName} (
        id, user_id, entry_info_id, destination, travel_purpose, recent_stay_country,
        boarding_country, visa_number, arrival_flight_number,
        arrival_departure_airport, arrival_departure_date,
        arrival_arrival_airport, arrival_arrival_date,
        departure_flight_number, departure_departure_airport,
        departure_departure_date, departure_arrival_airport,
        departure_arrival_date, accommodation_type, province, district,
        sub_district, postal_code, hotel_name, hotel_address,
        accommodation_phone, length_of_stay, is_transit_passenger,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      travelData.userId,
      travelData.entryInfoId || null,
      travelData.destination || null,
      travelData.travelPurpose || 'HOLIDAY',
      travelData.recentStayCountry || null,
      travelData.boardingCountry || null,
      travelData.visaNumber || null,
      travelData.arrivalFlightNumber || null,
      travelData.arrivalDepartureAirport || null,
      travelData.arrivalDepartureDate || null,
      travelData.arrivalArrivalAirport || null,
      travelData.arrivalArrivalDate || null,
      travelData.departureFlightNumber || null,
      travelData.departureDepartureAirport || null,
      travelData.departureDepartureDate || null,
      travelData.departureArrivalAirport || null,
      travelData.departureArrivalDate || null,
      travelData.accommodationType || 'HOTEL',
      travelData.province || null,
      travelData.district || null,
      travelData.subDistrict || null,
      travelData.postalCode || null,
      travelData.hotelName || null,
      travelData.hotelAddress || null,
      travelData.accommodationPhone || null,
      travelData.lengthOfStay || null,
      travelData.isTransitPassenger ? 1 : 0,
      travelData.status || 'draft',
      travelData.createdAt || now,
      now
    ];

    await this.db.runAsync(query, params);
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

