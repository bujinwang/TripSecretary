import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SerializablePassport, AllUserData, TravelInfoData } from './data';
import type { ImmigrationOfficerViewParams, TDACTravelerInfo } from './thailand';

export interface OCRConfidence {
  overall?: number;
  [key: string]: number | undefined;
}

export interface PassportValidationFieldResult {
  isValid?: boolean;
  errors?: string[];
}

export interface PassportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fields?: Record<string, PassportValidationFieldResult>;
}

export type DestinationParam = {
  id?: string;
  name?: string;
  [key: string]: unknown;
} | null;

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ScanPassport: undefined;
  SelectDestination:
    | {
        passport?: SerializablePassport | null;
      }
    | undefined;
  TravelInfo: undefined;
  Generating: undefined;
  Result: undefined;
  PresentToCustoms: undefined;
  PIKGuide: undefined;
  CopyWrite:
    | {
        passport?: SerializablePassport | null;
        destination?: DestinationParam;
        travelInfo?: TravelInfoData | null;
        userId?: string;
      }
    | undefined;
  TDACSelection:
    | {
        destinationId?: string | null;
        entryInfoId?: string;
        regeneratePDF?: boolean;
        cardType?: string;
        travelerInfo?: TDACTravelerInfo | null;
      }
    | undefined;
  TDACWebView:
    | {
        travelerInfo?: TDACTravelerInfo | null;
      }
    | undefined;
  TDACAPI:
    | {
        travelerInfo?: TDACTravelerInfo | null;
        autoSubmit?: boolean;
      }
    | undefined;
  TDACHybrid:
    | {
        travelerInfo?: TDACTravelerInfo | null;
        autoSubmit?: boolean;
      }
    | undefined;
  TDACFiles: undefined;
  SingaporeInfo: undefined;
  SingaporeRequirements: undefined;
  MalaysiaInfo: undefined;
  MalaysiaRequirements: undefined;
  MDACSelection: undefined;
  MDACGuide: undefined;
  MDACWebView: undefined;
  MalaysiaTravelInfo: undefined;
  MalaysiaEntryFlow: undefined;
  MalaysiaEntryGuide: undefined;
  MalaysiaEntryPackPreview: undefined;
  TaiwanInfo: undefined;
  TaiwanRequirements: undefined;
  TaiwanEntryFlow: undefined;
  TaiwanEntryPackPreview: undefined;
  TaiwanTravelInfo: undefined;
  TWArrivalSelection: undefined;
  TWArrivalGuide: undefined;
  TWArrivalWebView: undefined;
  HongKongInfo: undefined;
  HongKongRequirements: undefined;
  HongKongEntryFlow: undefined;
  HongKongEntryPackPreview: undefined;
  HongKongEntryGuide: undefined;
  HongKongTravelInfo: undefined;
  HDACSelection: undefined;
  HDACGuide: undefined;
  HDACWebView: undefined;
  KoreaInfo: undefined;
  KoreaRequirements: undefined;
  KoreaTravelInfo: undefined;
  KoreaEntryFlow: undefined;
  KoreaEntryGuide: undefined;
  KoreaEntryPackPreview: undefined;
  USAInfo: undefined;
  USARequirements: undefined;
  USTravelInfo: undefined;
  USAEntryFlow: undefined;
  USAEntryPackPreview: undefined;
  USAEntryGuide: undefined;
  CanadaEntryGuide: undefined;
  SGArrivalSelection: {
    passport?: SerializablePassport | null;
    destination?: DestinationParam;
    travelInfo?: TravelInfoData | null;
  } | undefined;
  SGArrivalGuide: {
    passport?: SerializablePassport | null;
    destination?: DestinationParam;
    travelInfo?: TravelInfoData | null;
  } | undefined;
  SGArrivalWebView: {
    passport?: SerializablePassport | null;
    destination?: DestinationParam;
    travelInfo?: TravelInfoData | null;
  } | undefined;
  SGACSelection: {
    passport?: SerializablePassport | null;
    destination?: DestinationParam;
  } | undefined;
  SGACWebView: {
    passport?: SerializablePassport | null;
    destination?: DestinationParam;
    userData?: Partial<AllUserData> | null;
    submissionMethod: 'online' | 'airport';
  } | undefined;
  SGACAirportGuide: {
    passport?: SerializablePassport | null;
    destination?: DestinationParam;
    userData?: Partial<AllUserData> | null;
    submissionMethod: 'online' | 'airport';
  } | undefined;
  AirportArrival: undefined;
  ImmigrationGuide: undefined;
  ThailandInteractiveImmigrationGuide:
    | {
        destinationId?: string | null;
        entryInfoId?: string;
        cardType?: string;
        currentStep?: number;
      }
    | undefined;
  ImmigrationOfficerView: ImmigrationOfficerViewParams | undefined;
  ThailandEntryQuestions:
    | {
        entryPackId?: string;
        preferredLanguage?: 'zh' | 'en' | 'th';
      }
    | undefined;
  ThailandInfo: undefined;
  ThailandRequirements: undefined;
  ThailandEntryFlow:
    | {
        passport?: SerializablePassport | null;
        destination?: DestinationParam;
        entryPackId?: string;
        fromNotification?: boolean;
        notificationData?: Record<string, unknown>;
        expandSection?: string;
        resubmissionMode?: boolean;
        showResubmissionHint?: boolean;
        highlightMissingFields?: boolean;
      }
    | undefined;
  ThailandTravelInfo:
    | {
        entryInfoId?: string;
        destinationId?: string | null;
        destination?: DestinationParam;
        passport?: SerializablePassport | null;
        expandSection?: string;
        resubmissionMode?: boolean;
        showResubmissionHint?: boolean;
        highlightMissingFields?: boolean;
      }
    | undefined;
  ThailandEntryGuide: undefined;
  ThailandEntryPackPreview: undefined;
  VietnamInfo: undefined;
  VietnamRequirements: undefined;
  VietnamTravelInfo: undefined;
  VietnamEntryFlow: undefined;
  VietnamEntryGuide: undefined;
  VietnamEntryPackPreview: undefined;
  JapanInfo: undefined;
  JapanRequirements: undefined;
  JapanProcedures: undefined;
  JapanTravelInfo: undefined;
  JapanEntryFlow: undefined;
  JapanEntryGuide: undefined;
  JapanEntryPackPreview: undefined;
  JapanInteractiveImmigrationGuide: undefined;
  EntryInfoDetail:
    | {
        entryInfoId: string;
        isHistorical?: boolean;
      }
    | undefined;
  EntryPackPreview:
    | {
        userData?: Record<string, unknown> | null;
        passport?: SerializablePassport | null;
        destination?: DestinationParam;
        entryPackData?: Record<string, unknown>;
        entryPackId?: string;
      }
    | undefined;
  EntryInfoHistory: undefined;
  NotificationSettings: undefined;
  NotificationLog: undefined;
  NotificationTest?: undefined;
  TamaguiTest?: undefined;
  ComponentShowcase?: undefined;
} & {
  [key: string]: Record<string, unknown> | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<MainTabParamList, T>;

export type ScreenProps = RootStackScreenProps<keyof RootStackParamList>;
