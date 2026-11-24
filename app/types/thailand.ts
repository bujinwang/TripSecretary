import type { SerializablePassport, TravelInfoData, FundItemData } from './data';
import type { EntryInfoStatus } from '../models/EntryInfo';

export type PresentationLanguage = 'bilingual' | 'thai' | 'english';

export type SubmissionMethod = 'api' | 'webview' | 'hybrid' | 'unknown';

export type EntryPackPresentationStatus =
  | 'submitted'
  | 'in_progress'
  | 'superseded'
  | 'expired'
  | 'completed'
  | 'cancelled'
  | 'archived'
  | 'unknown';

export type EntryPackPresentation = {
  id?: string;
  cardType?: string | null;
  qrCodeUri?: string | null;
  arrCardNo?: string | null;
  submittedAt?: string | null;
  submissionMethod?: SubmissionMethod | null;
  status?: EntryPackPresentationStatus;
};

export type PassportPresentation = Partial<SerializablePassport> & {
  fullName?: string | null;
  passportNumber?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
  expiryDate?: string | null;
  gender?: string | null;
  photoUri?: string | null;
};

export type TravelPresentation = (Partial<TravelInfoData> & {
  arrivalDate?: string | null;
  arrivalFlightNumber?: string | null;
  travelPurpose?: string | null;
  accommodation?: string | null;
}) | null;

export type FundPresentation = Array<
  Partial<FundItemData> & {
    id?: string | null;
    amount?: number | string | null;
    currency?: string | null;
  }
>;

export type EntryInfoPresentation = {
  id: string;
  status?: EntryInfoStatus | null;
  destinationId?: string | null;
  destinationName?: string | null;
  userId?: string | null;
  documents?: unknown;
};

export type ImmigrationOfficerViewParams = {
  entryPack?: EntryPackPresentation | null;
  entryInfo?: EntryInfoPresentation | null;
  passportData?: SerializablePassport | null;
  travelData?: TravelPresentation;
  fundData?: FundPresentation;
  cardType?: string | null;
  entryPackId?: string;
  fromImmigrationGuide?: boolean;
};

export type TDACTravelerInfo = {
  userId?: string;
  firstName?: string;
  familyName?: string;
  middleName?: string;
  passportNo?: string;
  gender?: string;
  nationality?: string;
  nationalityDesc?: string;
  birthDate?: string | { year: number; month: number; day: number };
  occupation?: string;
  phoneNo?: string;
  phoneCode?: string;
  phoneNumber?: string;
  email?: string;
  arrivalDate?: string;
  departureDate?: string;
  flightNo?: string;
  purpose?: string;
  travelMode?: string;
  countryBoarded?: string;
  recentStayCountry?: string;
  countryBoardedCode?: string;
  cityResidence?: string;
  countryResidence?: string;
  visaNo?: string;
  address?: string;
  accommodationAddress?: string;
  accommodationType?: string;
  province?: string;
  district?: string;
  subDistrict?: string;
  postCode?: string;
  cloudflareToken?: string;
  tranModeId?: string;
  departureFlightNo?: string;
  departureFlightNumber?: string;
  departureTravelMode?: string;
  departureTransportModeId?: string;
  formFields?: Array<Record<string, unknown>>;
  digitalArrivalCardId?: string;
  [key: string]: unknown;
};
