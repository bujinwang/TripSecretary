/**
 * Data Service Types
 * 
 * Shared type definitions for data services
 */

// User ID type
export type UserId = string;

// Passport-related types
export interface PassportData {
  id?: string;
  userId: UserId;
  passportNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  expiryDate?: string;
  issueDate?: string;
  issuePlace?: string;
  [key: string]: any;
}

export interface SerializablePassport {
  id?: string;
  userId: UserId;
  passportNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  expiryDate?: string;
  issueDate?: string;
  issuePlace?: string;
  [key: string]: any;
}

// Personal Info types
export interface PersonalInfoData {
  id?: string;
  userId: UserId;
  email?: string;
  phoneNumber?: string;
  [key: string]: any;
}

// Fund Item types
export interface FundItemData {
  id?: string;
  userId: UserId;
  amount?: number;
  currency?: string;
  type?: string;
  [key: string]: any;
}

// Travel Info types
export interface TravelInfoData {
  id?: string;
  userId: UserId;
  destination?: string;
  arrivalDate?: string;
  departureDate?: string;
  [key: string]: any;
}

// Entry Info types
export interface EntryInfoData {
  id?: string;
  userId: UserId;
  destinationId?: string;
  [key: string]: any;
}

// All User Data
export interface AllUserData {
  userId: UserId;
  passport: PassportData | null;
  personalInfo: PersonalInfoData | null;
  funds?: FundItemData[];
  travel?: TravelInfoData | null;
  entryInfo?: EntryInfoData | null;
  loadedAt?: string;
  loadDurationMs?: number;
}

// Cache Statistics
export interface CacheStats {
  hits: number;
  misses: number;
  invalidations: number;
  lastReset: number;
  totalRequests: number;
  hitRate: number;
}

// Batch Update Options
export interface BatchUpdateData {
  passport?: Partial<PassportData>;
  personalInfo?: Partial<PersonalInfoData>;
  funds?: FundItemData[];
  travel?: Partial<TravelInfoData>;
  entryInfo?: Partial<EntryInfoData>;
}

// Service Options
export interface ServiceOptions {
  useBatchLoad?: boolean;
  skipCache?: boolean;
  [key: string]: any;
}

// Passport Options
export interface PassportOptions {
  skipCache?: boolean;
  [key: string]: any;
}

