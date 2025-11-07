/**
 * Data Serialization/Deserialization Utilities
 *
 * Handles conversion between application objects and database rows
 * with proper JSON parsing and validation
 */

type Nullable<T> = T | null | undefined;

type EntryInfoInput = {
  id?: string;
  userId: string;
  passportId?: string | null;
  personalInfoId?: string | null;
  travelInfoId?: string | null;
  destinationId?: string | null;
  status?: string;
  completionMetrics?: unknown;
  documents?: unknown;
  displayStatus?: unknown;
  lastUpdatedAt?: string;
  createdAt?: string;
};

type SerializedEntryInfoRow = {
  id: string;
  user_id: string;
  passport_id?: string | null;
  personal_info_id: string | null;
  travel_info_id: string | null;
  destination_id?: string | null;
  status: string;
  completion_metrics: string;
  documents: string;
  display_status: string;
  last_updated_at: string;
  created_at: string;
};

type EntryInfoRow = Record<string, any> & {
  id: string;
  user_id: string;
  passport_id?: string | null;
  personal_info_id?: string | null;
  travel_info_id?: string | null;
  destination_id?: string | null;
  status?: string;
  completion_metrics?: string;
  documents?: string;
  display_status?: string;
  last_updated_at?: string;
  created_at?: string;
};

type DigitalArrivalCardRow = Record<string, any> & {
  id: string;
  entry_info_id: string;
  user_id: string;
  card_type: string;
  destination_id?: string | null;
  arr_card_no?: string | null;
  qr_uri?: string | null;
  pdf_url?: string | null;
  submitted_at: string;
  submission_method?: string;
  status?: string;
  api_response?: string | null;
  processing_time?: number | null;
  retry_count?: number | null;
  error_details?: string | null;
  is_superseded?: number;
  superseded_at?: string | null;
  superseded_reason?: string | null;
  superseded_by?: string | null;
  version?: number | null;
  created_at: string;
  updated_at: string;
};

type PassportRow = Record<string, any> & {
  id: string;
  user_id: string;
  gender?: string;
  expiry_date?: string;
  issue_date?: string;
  issue_place?: string;
  photo_uri?: string;
  is_primary?: number;
  created_at?: string;
  updated_at?: string;
};

type PersonalInfoRow = Record<string, any> & {
  id: string;
  user_id: string;
  passport_id?: string | null;
  occupation?: string;
  province_city?: string;
  country_region?: string;
  phone_code?: string;
  gender?: string;
  is_default?: number;
  label?: string;
  created_at?: string;
  updated_at?: string;
};

type TravelInfoRow = Record<string, any> & {
  id: string;
  user_id?: string;
  destination?: string;
  travel_purpose?: string;
  recent_stay_country?: string;
  boarding_country?: string;
  visa_number?: string;
  arrival_flight_number?: string;
  arrival_departure_airport?: string;
  arrival_departure_date?: string;
  arrival_arrival_airport?: string;
  arrival_arrival_date?: string;
  arrival_flight_ticket_photo_uri?: string;
  departure_flight_number?: string;
  departure_departure_airport?: string;
  departure_departure_date?: string;
  departure_arrival_airport?: string;
  departure_arrival_date?: string;
  departure_flight_ticket_photo_uri?: string;
  accommodation_type?: string;
  province?: string;
  district?: string;
  sub_district?: string;
  postal_code?: string;
  hotel_name?: string;
  hotel_address?: string;
  hotel_booking_photo_uri?: string;
  accommodation_phone?: string;
  length_of_stay?: string;
  is_transit_passenger?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

type FundItemRow = Record<string, any> & {
  id: string;
  user_id: string;
  type: string;
  amount?: string;
  currency?: string;
  details?: string;
  photo_uri?: string;
  created_at?: string;
  updated_at?: string;
};

type PassportCountryRow = Record<string, any> & {
  passport_id: string;
  country_code: string;
  visa_required?: number;
  max_stay_days?: number;
  notes?: string;
  created_at?: string;
};

type DecryptedFields = Record<string, any>;

class DataSerializer {
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  safeJsonParse<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    if (typeof value === 'object') {
      return value as T;
    }

    try {
      return JSON.parse(String(value)) as T;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Failed to parse JSON value:', {
        valuePreview: typeof value === 'string' ? value.slice(0, 200) : value,
        error: message
      });
      return fallback;
    }
  }

  extractFundItemIds(entryInfoData: Record<string, any> = {}): string[] {
    const identifiers: Array<string | null | undefined> = [];

    if (!entryInfoData) {
      return [];
    }

    if (Array.isArray(entryInfoData.fundItemIds)) {
      identifiers.push(...entryInfoData.fundItemIds);
    } else if (Array.isArray(entryInfoData.fundItems)) {
      identifiers.push(
        ...entryInfoData.fundItems.map((item: unknown) => {
          if (!item || typeof item !== 'object') {
            return typeof item === 'string' ? item : null;
          }
          const data = item as Record<string, unknown>;
          if (typeof data.id === 'string') {
            return data.id;
          }
          if (typeof data.fundItemId === 'string') {
            return data.fundItemId;
          }
          return null;
        })
      );
    } else if (typeof entryInfoData.fundItemId === 'string') {
      identifiers.push(entryInfoData.fundItemId);
    }

    const normalized = identifiers
      .map(id => (typeof id === 'string' ? id.trim() : id))
      .filter((id): id is string => Boolean(id));

    return Array.from(new Set(normalized));
  }

  parseFundItemIds(aggregatedIds: Nullable<string>): string[] {
    if (!aggregatedIds || typeof aggregatedIds !== 'string') {
      return [];
    }

    return aggregatedIds
      .split(',')
      .map(id => id?.trim())
      .filter((id): id is string => Boolean(id));
  }

  serializeEntryInfo(entryInfo: EntryInfoInput): SerializedEntryInfoRow {
    return {
      id: entryInfo.id || this.generateId(),
      user_id: entryInfo.userId,
      passport_id: entryInfo.passportId ?? null,
      personal_info_id: entryInfo.personalInfoId ?? null,
      travel_info_id: entryInfo.travelInfoId ?? null,
      destination_id: entryInfo.destinationId ?? null,
      status: entryInfo.status || 'incomplete',
      completion_metrics: JSON.stringify(entryInfo.completionMetrics || {}),
      documents: JSON.stringify(entryInfo.documents ?? null),
      display_status: JSON.stringify(entryInfo.displayStatus ?? null),
      last_updated_at: entryInfo.lastUpdatedAt || new Date().toISOString(),
      created_at: entryInfo.createdAt || new Date().toISOString()
    };
  }

  deserializeEntryInfo(row: EntryInfoRow): EntryInfoInput {
    return {
      id: row.id,
      userId: row.user_id,
      passportId: row.passport_id ?? null,
      personalInfoId: row.personal_info_id ?? null,
      travelInfoId: row.travel_info_id ?? null,
      destinationId: row.destination_id ?? null,
      status: row.status,
      completionMetrics: this.safeJsonParse(row.completion_metrics, {}),
      documents: this.safeJsonParse(row.documents, null),
      displayStatus: this.safeJsonParse(row.display_status, null),
      lastUpdatedAt: row.last_updated_at,
      createdAt: row.created_at
    };
  }

  deserializeDigitalArrivalCard(row: DigitalArrivalCardRow): Record<string, unknown> {
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

  deserializePassport(row: PassportRow, decryptedFields: DecryptedFields): Record<string, unknown> {
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

  deserializePersonalInfo(row: PersonalInfoRow, decryptedFields: DecryptedFields): Record<string, unknown> {
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

  deserializeTravelInfo(row: TravelInfoRow): Record<string, unknown> {
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
      flightTicketPhoto: row.arrival_flight_ticket_photo_uri,
      departureFlightNumber: row.departure_flight_number,
      departureDepartureAirport: row.departure_departure_airport,
      departureDepartureDate: row.departure_departure_date,
      departureArrivalAirport: row.departure_arrival_airport,
      departureArrivalDate: row.departure_arrival_date,
      departureFlightTicketPhoto: row.departure_flight_ticket_photo_uri,
      accommodationType: row.accommodation_type,
      province: row.province,
      district: row.district,
      subDistrict: row.sub_district,
      postalCode: row.postal_code,
      hotelName: row.hotel_name,
      hotelAddress: row.hotel_address,
      hotelReservationPhoto: row.hotel_booking_photo_uri,
      accommodationPhone: row.accommodation_phone,
      lengthOfStay: row.length_of_stay,
      isTransitPassenger: row.is_transit_passenger === 1,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  deserializeFundItem(row: FundItemRow): Record<string, unknown> {
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

  deserializePassportCountry(row: PassportCountryRow): Record<string, unknown> {
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

const dataSerializer = new DataSerializer();

export default dataSerializer;
