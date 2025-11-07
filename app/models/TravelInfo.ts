/**
 * 入境通 - Travel Information Data Model
 * Defines the structure for trip-specific travel information
 */

import SecureStorageService from '../services/security/SecureStorageService';

export type TravelInfoStatus = 'draft' | 'completed';

export interface TravelInfoInit {
  id?: string;
  userId?: string;
  destination?: string | null;
  travelPurpose?: string | null;
  recentStayCountry?: string | null;
  visaNumber?: string | null;
  boardingCountry?: string | null;
  arrivalFlightNumber?: string | null;
  arrivalDepartureAirport?: string | null;
  arrivalDepartureDate?: string | null;
  arrivalArrivalAirport?: string | null;
  arrivalArrivalDate?: string | null;
  arrivalFlightTicketPhotoUri?: string | null;
  departureFlightNumber?: string | null;
  departureDepartureAirport?: string | null;
  departureDepartureDate?: string | null;
  departureArrivalAirport?: string | null;
  departureArrivalDate?: string | null;
  isTransitPassenger?: boolean;
  accommodationType?: string | null;
  province?: string | null;
  district?: string | null;
  subDistrict?: string | null;
  postalCode?: string | null;
  hotelName?: string | null;
  hotelAddress?: string | null;
  hotelBookingPhotoUri?: string | null;
  accommodationPhone?: string | null;
  lengthOfStay?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
  status?: TravelInfoStatus;
  [key: string]: unknown;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface SaveOptions {
  skipValidation?: boolean;
}

interface SaveResult {
  id: string;
}

type UpdatePayload = Record<string, unknown>;

const FLIGHT_NUMBER_REGEX = /^[A-Z]{2,3}\d{1,4}$/i;
const VISA_NUMBER_REGEX = /^[A-Za-z0-9]{5,15}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

class TravelInfo {
  id: string;
  userId?: string;
  destination?: string | null;
  travelPurpose: string | null;
  recentStayCountry: string | null;
  visaNumber: string | null;
  boardingCountry: string | null;
  arrivalFlightNumber: string | null;
  arrivalDepartureAirport: string | null;
  arrivalDepartureDate: string | null;
  arrivalArrivalAirport: string | null;
  arrivalArrivalDate: string | null;
  arrivalFlightTicketPhotoUri: string | null;
  departureFlightNumber: string | null;
  departureDepartureAirport: string | null;
  departureDepartureDate: string | null;
  departureArrivalAirport: string | null;
  departureArrivalDate: string | null;
  isTransitPassenger: boolean;
  accommodationType: string | null;
  province: string | null;
  district: string | null;
  subDistrict: string | null;
  postalCode: string | null;
  hotelName: string | null;
  hotelAddress: string | null;
  hotelBookingPhotoUri: string | null;
  accommodationPhone: string | null;
  lengthOfStay: string | number | null;
  createdAt: string;
  updatedAt: string;
  status: TravelInfoStatus;

  constructor(data: TravelInfoInit = {}) {
    this.id = data.id ?? TravelInfo.generateId();
    this.userId = data.userId;
    this.destination = data.destination ?? null;
    this.travelPurpose = data.travelPurpose ?? 'HOLIDAY';
    this.recentStayCountry = data.recentStayCountry ?? '';
    this.visaNumber = data.visaNumber ?? '';
    this.boardingCountry = data.boardingCountry ?? '';
    this.arrivalFlightNumber = data.arrivalFlightNumber ?? '';
    this.arrivalDepartureAirport = data.arrivalDepartureAirport ?? '';
    this.arrivalDepartureDate = data.arrivalDepartureDate ?? '';
    this.arrivalArrivalAirport = data.arrivalArrivalAirport ?? '';
    this.arrivalArrivalDate = data.arrivalArrivalDate ?? '';
    this.arrivalFlightTicketPhotoUri = data.arrivalFlightTicketPhotoUri ?? '';
    this.departureFlightNumber = data.departureFlightNumber ?? '';
    this.departureDepartureAirport = data.departureDepartureAirport ?? '';
    this.departureDepartureDate = data.departureDepartureDate ?? '';
    this.departureArrivalAirport = data.departureArrivalAirport ?? '';
    this.departureArrivalDate = data.departureArrivalDate ?? '';
    this.isTransitPassenger = data.isTransitPassenger ?? false;
    this.accommodationType = data.accommodationType ?? 'HOTEL';
    this.province = data.province ?? '';
    this.district = data.district ?? '';
    this.subDistrict = data.subDistrict ?? '';
    this.postalCode = data.postalCode ?? '';
    this.hotelName = data.hotelName ?? '';
    this.hotelAddress = data.hotelAddress ?? '';
    this.hotelBookingPhotoUri = data.hotelBookingPhotoUri ?? '';
    this.accommodationPhone = data.accommodationPhone ?? '';
    this.lengthOfStay = data.lengthOfStay ?? '';
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
    this.status = data.status ?? 'draft';
  }

  static generateId(): string {
    return `travel_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    if (this.arrivalFlightNumber && !TravelInfo.isValidFlightNumber(this.arrivalFlightNumber)) {
      errors.push('Invalid arrival flight number format');
    }
    if (this.departureFlightNumber && !TravelInfo.isValidFlightNumber(this.departureFlightNumber)) {
      errors.push('Invalid departure flight number format');
    }
    if (this.visaNumber && !TravelInfo.isValidVisaNumber(this.visaNumber)) {
      errors.push('Invalid visa number format');
    }

    const dateFields = [
      { field: this.arrivalDepartureDate, name: 'Arrival departure date' },
      { field: this.arrivalArrivalDate, name: 'Arrival arrival date' },
      { field: this.departureDepartureDate, name: 'Departure departure date' },
      { field: this.departureArrivalDate, name: 'Departure arrival date' }
    ];

    for (const { field, name } of dateFields) {
      if (field && !TravelInfo.isValidDate(field)) {
        errors.push(`Invalid ${name} format (expected YYYY-MM-DD)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static isValidDate(dateStr: string): boolean {
    if (!DATE_REGEX.test(dateStr)) {
      return false;
    }
    const date = new Date(dateStr);
    return !Number.isNaN(date.getTime());
  }

  private static isValidFlightNumber(flightNumber: string): boolean {
    return FLIGHT_NUMBER_REGEX.test(flightNumber.replace(/\s/g, ''));
  }

  private static isValidVisaNumber(visaNumber: string): boolean {
    return VISA_NUMBER_REGEX.test(visaNumber);
  }

  isComplete(): boolean {
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

    return requiredFields.every(field => typeof field === 'string' && field.trim().length > 0);
  }

  getCompletionPercentage(): number {
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

    const filledCount = fields.filter(field => typeof field === 'string' && field.trim().length > 0).length;
    return Math.round((filledCount / fields.length) * 100);
  }

  async save(options: SaveOptions = {}): Promise<SaveResult> {
    try {
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      this.updatedAt = new Date().toISOString();
      if (this.isComplete()) {
        this.status = 'completed';
      }

      const result = await SecureStorageService.saveTravelInfo({
        id: this.id,
        userId: this.userId,
        destination: this.destination ?? undefined,
        travelPurpose: this.travelPurpose ?? undefined,
        recentStayCountry: this.recentStayCountry ?? undefined,
        boardingCountry: this.boardingCountry ?? undefined,
        visaNumber: this.visaNumber ?? undefined,
        arrivalFlightNumber: this.arrivalFlightNumber ?? undefined,
        arrivalDepartureAirport: this.arrivalDepartureAirport ?? undefined,
        arrivalDepartureDate: this.arrivalDepartureDate ?? undefined,
        arrivalArrivalAirport: this.arrivalArrivalAirport ?? undefined,
        arrivalArrivalDate: this.arrivalArrivalDate ?? undefined,
        arrivalFlightTicketPhotoUri: this.arrivalFlightTicketPhotoUri ?? undefined,
        departureFlightNumber: this.departureFlightNumber ?? undefined,
        departureDepartureAirport: this.departureDepartureAirport ?? undefined,
        departureDepartureDate: this.departureDepartureDate ?? undefined,
        departureArrivalAirport: this.departureArrivalAirport ?? undefined,
        departureArrivalDate: this.departureArrivalDate ?? undefined,
        isTransitPassenger: this.isTransitPassenger,
        accommodationType: this.accommodationType ?? undefined,
        province: this.province ?? undefined,
        district: this.district ?? undefined,
        subDistrict: this.subDistrict ?? undefined,
        postalCode: this.postalCode ?? undefined,
        hotelName: this.hotelName ?? undefined,
        hotelAddress: this.hotelAddress ?? undefined,
        hotelBookingPhotoUri: this.hotelBookingPhotoUri ?? undefined,
        accommodationPhone: this.accommodationPhone ?? undefined,
        lengthOfStay: this.lengthOfStay ?? undefined,
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

  static async load(userId: string, destination: string | null = null): Promise<TravelInfo | null> {
    try {
      const data = await SecureStorageService.getTravelInfo(userId, destination ?? undefined);
      if (!data) {
        return null;
      }
      return new TravelInfo(data as TravelInfoInit);
    } catch (error) {
      console.error('Failed to load travel info:', error);
      throw error;
    }
  }

  async update(updates: UpdatePayload, options: SaveOptions = {}): Promise<SaveResult> {
    try {
      Object.assign(this, updates);
      this.updatedAt = new Date().toISOString();

      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return this.save(options);
    } catch (error) {
      console.error('Failed to update travel info:', error);
      throw error;
    }
  }

  async mergeUpdates(updates: UpdatePayload, options: SaveOptions = {}): Promise<SaveResult> {
    try {
      const nonEmptyUpdates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'id' || key === 'createdAt') {
          continue;
        }

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

      Object.assign(this, nonEmptyUpdates);
      this.updatedAt = new Date().toISOString();

      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return this.save(options);
    } catch (error) {
      console.error('Failed to merge travel info updates:', error);
      throw error;
    }
  }

  getSummary(): Record<string, unknown> {
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

  exportData(): Record<string, unknown> {
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

