/**
 * Entry Info Repository
 * Data access layer for entry information records
 *
 * Handles all database operations for entry info data including
 * CRUD operations, queries, and relationships with fund items.
 */

import DataSerializer from '../utils/DataSerializer';

class EntryInfoRepository {
  constructor(db) {
    this.db = db;
    this.serializer = DataSerializer;
    this.tableName = 'entry_info';
  }

  /**
   * Save or update an entry info record
   * @param {Object} entryData - Entry info data to save
   * @returns {Promise<Object>} - Saved entry info record
   */
  async save(entryData) {
    if (!entryData || !entryData.userId) {
      throw new Error('Entry info data and userId are required');
    }

    const id = entryData.id || this.serializer.generateId();
    const now = new Date().toISOString();

    const query = `
      INSERT OR REPLACE INTO ${this.tableName} (
        id, user_id, passport_id, personal_info_id, travel_info_id,
        destination_id, status, completion_metrics, documents,
        display_status, last_updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      entryData.userId,
      entryData.passportId,
      entryData.personalInfoId || null,
      entryData.travelInfoId || null,
      entryData.destinationId || null,
      entryData.status || 'incomplete',
      entryData.completionMetrics ? JSON.stringify(entryData.completionMetrics) : null,
      entryData.documents ? JSON.stringify(entryData.documents) : null,
      entryData.displayStatus || null,
      entryData.lastUpdatedAt || now,
      entryData.createdAt || now
    ];

    await this.db.runAsync(query, params);
    return this.getById(id);
  }

  /**
   * Get entry info by ID
   * @param {string} id - Entry info ID
   * @returns {Promise<Object|null>} - Entry info record or null
   */
  async getById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.db.getFirstAsync(query, [id]);

    if (!row) {
      return null;
    }

    return this.serializer.deserializeEntryInfo(row);
  }

  /**
   * Get all entry info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of entry info records
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

    return rows.map(row => this.serializer.deserializeEntryInfo(row));
  }

  /**
   * Get all entry info records for a user with related data (optimized with JOINs)
   * This method eliminates N+1 query problems by fetching all related data in a single query
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of entry info records with populated relations
   */
  async getByUserIdWithRelations(userId) {
    // Main query with LEFT JOINs to fetch all related data
    const query = `
      SELECT
        e.id as entry_id,
        e.user_id,
        e.passport_id,
        e.personal_info_id,
        e.travel_info_id,
        e.destination_id,
        e.status,
        e.completion_metrics,
        e.documents,
        e.display_status,
        e.last_updated_at,
        e.created_at,
        p.id as p_id,
        p.encrypted_passport_number as p_passport_number,
        p.encrypted_full_name as p_full_name,
        p.encrypted_date_of_birth as p_date_of_birth,
        p.encrypted_nationality as p_nationality,
        p.gender as p_gender,
        p.expiry_date as p_expiry_date,
        p.issue_date as p_issue_date,
        p.issue_place as p_issue_place,
        p.photo_uri as p_photo_uri,
        p.is_primary as p_is_primary,
        pi.id as pi_id,
        pi.encrypted_phone_number as pi_phone_number,
        pi.encrypted_email as pi_email,
        pi.encrypted_home_address as pi_home_address,
        pi.occupation as pi_occupation,
        pi.province_city as pi_province_city,
        pi.country_region as pi_country_region,
        pi.phone_code as pi_phone_code,
        pi.gender as pi_gender,
        pi.is_default as pi_is_default,
        pi.label as pi_label,
        ti.id as ti_id,
        ti.destination as ti_destination,
        ti.travel_purpose as ti_travel_purpose,
        ti.arrival_flight_number as ti_arrival_flight_number,
        ti.arrival_arrival_date as ti_arrival_arrival_date,
        ti.departure_flight_number as ti_departure_flight_number,
        ti.departure_departure_date as ti_departure_departure_date,
        ti.accommodation_type as ti_accommodation_type,
        ti.hotel_name as ti_hotel_name,
        ti.hotel_address as ti_hotel_address,
        ti.province as ti_province,
        ti.status as ti_status
      FROM ${this.tableName} e
      LEFT JOIN passports p ON e.passport_id = p.id
      LEFT JOIN personal_info pi ON e.personal_info_id = pi.id
      LEFT JOIN travel_info ti ON e.travel_info_id = ti.id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    // Fetch fund items and digital arrival cards separately (still optimized - 2 queries total instead of N)
    const entryInfoIds = rows.map(r => r.entry_id);
    const placeholders = entryInfoIds.map(() => '?').join(',');

    // Fetch all linked fund items in one query
    const fundItemsQuery = `
      SELECT
        eif.entry_info_id,
        f.id,
        f.type,
        f.amount,
        f.currency,
        f.details,
        f.photo_uri,
        f.created_at,
        f.updated_at
      FROM entry_info_fund_items eif
      JOIN fund_items f ON eif.fund_item_id = f.id
      WHERE eif.entry_info_id IN (${placeholders})
      ORDER BY eif.linked_at DESC
    `;
    const fundItems = await this.db.getAllAsync(fundItemsQuery, entryInfoIds);

    // Fetch all digital arrival cards in one query
    const dacQuery = `
      SELECT *
      FROM digital_arrival_cards
      WHERE entry_info_id IN (${placeholders})
        AND is_superseded = 0
      ORDER BY submitted_at DESC
    `;
    const dacs = await this.db.getAllAsync(dacQuery, entryInfoIds);

    // Group fund items and DACs by entry_info_id
    const fundItemsByEntry = {};
    fundItems.forEach(item => {
      if (!fundItemsByEntry[item.entry_info_id]) {
        fundItemsByEntry[item.entry_info_id] = [];
      }
      fundItemsByEntry[item.entry_info_id].push({
        id: item.id,
        type: item.type,
        amount: item.amount,
        currency: item.currency,
        details: item.details,
        photoUri: item.photo_uri,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      });
    });

    const dacsByEntry = {};
    dacs.forEach(dac => {
      if (!dacsByEntry[dac.entry_info_id]) {
        dacsByEntry[dac.entry_info_id] = [];
      }
      dacsByEntry[dac.entry_info_id].push(dac);
    });

    // Map rows to entry info objects with all relations populated
    return rows.map(row => {
      const entryInfo = {
        id: row.entry_id,
        userId: row.user_id,
        passportId: row.passport_id,
        personalInfoId: row.personal_info_id,
        travelInfoId: row.travel_info_id,
        destinationId: row.destination_id,
        status: row.status,
        completionMetrics: this.serializer.safeJsonParse(row.completion_metrics, {}),
        documents: this.serializer.safeJsonParse(row.documents, null),
        displayStatus: row.display_status,
        lastUpdatedAt: row.last_updated_at,
        createdAt: row.created_at,
      };

      // Add populated passport if exists
      if (row.p_id) {
        entryInfo.passport = {
          id: row.p_id,
          passportNumber: row.p_passport_number,
          fullName: row.p_full_name,
          dateOfBirth: row.p_date_of_birth,
          nationality: row.p_nationality,
          gender: row.p_gender,
          expiryDate: row.p_expiry_date,
          issueDate: row.p_issue_date,
          issuePlace: row.p_issue_place,
          photoUri: row.p_photo_uri,
          isPrimary: row.p_is_primary
        };
      }

      // Add populated personal info if exists
      if (row.pi_id) {
        entryInfo.personalInfo = {
          id: row.pi_id,
          phoneNumber: row.pi_phone_number,
          email: row.pi_email,
          homeAddress: row.pi_home_address,
          occupation: row.pi_occupation,
          provinceCity: row.pi_province_city,
          countryRegion: row.pi_country_region,
          phoneCode: row.pi_phone_code,
          gender: row.pi_gender,
          isDefault: row.pi_is_default,
          label: row.pi_label
        };
      }

      // Add populated travel info if exists
      if (row.ti_id) {
        entryInfo.travelInfo = {
          id: row.ti_id,
          destination: row.ti_destination,
          travelPurpose: row.ti_travel_purpose,
          arrivalFlightNumber: row.ti_arrival_flight_number,
          arrivalArrivalDate: row.ti_arrival_arrival_date,
          departureFlightNumber: row.ti_departure_flight_number,
          departureDepartureDate: row.ti_departure_departure_date,
          accommodationType: row.ti_accommodation_type,
          hotelName: row.ti_hotel_name,
          hotelAddress: row.ti_hotel_address,
          province: row.ti_province,
          status: row.ti_status
        };
      }

      // Add fund items
      entryInfo.fundItems = fundItemsByEntry[row.entry_id] || [];

      // Add digital arrival cards
      entryInfo.digitalArrivalCards = dacsByEntry[row.entry_id] || [];

      return entryInfo;
    });
  }

  /**
   * Get entry info by destination
   * @param {string} userId - User ID
   * @param {string} destinationId - Destination ID
   * @returns {Promise<Array>} - Array of entry info records
   */
  async getByDestination(userId, destinationId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND destination_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, destinationId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeEntryInfo(row));
  }

  /**
   * Get entry info by status
   * @param {string} userId - User ID
   * @param {string} status - Status
   * @returns {Promise<Array>} - Array of entry info records
   */
  async getByStatus(userId, status) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND status = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, status]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeEntryInfo(row));
  }

  /**
   * Delete entry info
   * @param {string} id - Entry info ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.runAsync(query, [id]);
  }

  /**
   * Delete all entry info for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted records
   */
  async deleteByUserId(userId) {
    const query = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.runAsync(query, [userId]);
    return result.changes || 0;
  }

  /**
   * Count entry info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of entry info records
   */
  async countByUserId(userId) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.getFirstAsync(query, [userId]);
    return result?.count || 0;
  }

  /**
   * Check if entry info exists
   * @param {string} id - Entry info ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(id) {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.db.getFirstAsync(query, [id]);
    return !!result;
  }

  /**
   * Update entry info status
   * @param {string} id - Entry info ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateStatus(id, status) {
    const query = `
      UPDATE ${this.tableName}
      SET status = ?, last_updated_at = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [status, new Date().toISOString(), id]);
  }

  /**
   * Link fund item to entry info
   * @param {string} entryInfoId - Entry info ID
   * @param {string} fundItemId - Fund item ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async linkFundItem(entryInfoId, fundItemId, userId) {
    const query = `
      INSERT OR REPLACE INTO entry_info_fund_items (
        entry_info_id, fund_item_id, user_id, linked_at
      ) VALUES (?, ?, ?, ?)
    `;

    await this.db.runAsync(query, [entryInfoId, fundItemId, userId, new Date().toISOString()]);
  }

  /**
   * Unlink fund item from entry info
   * @param {string} entryInfoId - Entry info ID
   * @param {string} fundItemId - Fund item ID
   * @returns {Promise<void>}
   */
  async unlinkFundItem(entryInfoId, fundItemId) {
    const query = `
      DELETE FROM entry_info_fund_items
      WHERE entry_info_id = ? AND fund_item_id = ?
    `;

    await this.db.runAsync(query, [entryInfoId, fundItemId]);
  }

  /**
   * Get fund items linked to entry info
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Array>} - Array of fund item IDs
   */
  async getLinkedFundItems(entryInfoId) {
    const query = `
      SELECT fund_item_id FROM entry_info_fund_items
      WHERE entry_info_id = ?
      ORDER BY linked_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [entryInfoId]);
    return rows ? rows.map(row => row.fund_item_id) : [];
  }
}

export default EntryInfoRepository;

