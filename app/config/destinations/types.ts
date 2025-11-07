/**
 * TypeScript definitions for the destination configuration system.
 *
 * The original file used JSDoc typedefs. These definitions are now
 * first-class TypeScript interfaces so the various configuration
 * modules can import and reuse them directly.
 */

export type LocaleCode = string;

export interface ArrivalCardConfig {
  type: string;
  name: string;
  nameZh?: string;
  nameJa?: string;
  hasDigitalOption?: boolean;
  requires?: boolean;
  languages?: LocaleCode[];
}

export type VisaRequirementMap = Record<string, string>;

export interface DestinationMetadata {
  id: string;
  code: string;
  code3: string;
  name: string;
  nameZh: string;
  nameZhTW?: string;
  flag: string;
  enabled: boolean;
  currency: string;
  currencySymbol: string;
  currencyNameEn?: string;
  currencyNameZh?: string;
  dateFormat: string;
  timezone: string;
  flightTimeKey?: string;
  typicalFlightTimeHours?: number;
  digitalCard?: DigitalCardConfig;
  arrivalCard?: ArrivalCardConfig;
  visaRequirement?: VisaRequirementMap;
  priority?: number;
  locales?: LocaleCode[];
  defaultLocale?: LocaleCode;
  [extra: string]: unknown;
}

export interface DigitalCardConfig {
  type: string;
  name: string;
  nameZh?: string;
  nameShort?: string;
  submissionWindowHours?: number;
  required?: boolean;
  apiEndpoint?: string;
  sessionBased?: boolean;
  validationService?: string;
  submissionService?: string;
  [extra: string]: unknown;
}

export interface ATMInfo {
  fee?: number;
  feeUnit?: string;
  feeNote?: string;
  withdrawalLimit?: Record<string, unknown>;
  suggestedAmount?: Record<string, unknown>;
  locations?: Array<Record<string, unknown>>;
  [extra: string]: unknown;
}

export interface FinancialInfo {
  atm?: ATMInfo;
  cash?: Record<string, unknown>;
  denominations?: Record<string, unknown>;
  recommendedBanks?: Array<Record<string, unknown>>;
  exchangeRate?: Record<string, unknown>;
  paymentMethods?: Record<string, unknown>;
  [extra: string]: unknown;
}

export interface EmergencyNumber {
  number: string;
  name: string;
  nameZh?: string;
  available?: string;
  languages?: string[];
  note?: string;
  [extra: string]: unknown;
}

export interface EmbassyInfo {
  country: string;
  countryCode: string;
  name: string;
  nameZh?: string;
  phone: string;
  emergencyPhone?: string;
  address: string;
  addressZh?: string;
  email?: string;
  website?: string;
  hours?: string;
  services?: string[];
  consularProtection24h?: string;
  [extra: string]: unknown;
}

export interface HospitalInfo {
  name: string;
  nameZh?: string;
  phone: string;
  emergency?: string;
  address: string;
  languages?: string[];
  specialties?: string[];
  insurance?: string;
  note?: string;
  [extra: string]: unknown;
}

export interface EmergencyInfo {
  emergencyNumbers?: Record<string, EmergencyNumber>;
  embassies?: EmbassyInfo[];
  hospitals?: HospitalInfo[];
  hotlines?: Array<Record<string, unknown>>;
  notes?: Record<string, unknown>;
  [extra: string]: unknown;
}

export interface ServiceMappings {
  digitalCard?: {
    serviceClass?: string;
    submissionService?: string;
    validationService?: string;
    contextBuilder?: string;
    [extra: string]: unknown;
  };
  entryInfo?: {
    serviceClass?: string;
    [extra: string]: unknown;
  };
  [extra: string]: unknown;
}

export interface ScreenMappings {
  info?: string;
  entryFlow?: string;
  entryQuestions?: string;
  travelInfo?: string;
  requirements?: string;
  entryGuide?: string;
  entryPackPreview?: string;
  [extra: string]: unknown;
}

export interface FeatureFlags {
  digitalArrivalCard?: boolean;
  entryGuide?: boolean;
  multiLanguageSupport?: boolean;
  offlineMode?: boolean;
  qrCodeExtraction?: boolean;
  paperArrivalCard?: boolean;
  arrivalCardRequired?: boolean;
  [extra: string]: unknown;
}

export interface TravelInfoFieldOption {
  value: string;
  defaultLabel: string;
  labelKey?: string;
  icon?: string;
  [extra: string]: unknown;
}

export interface TravelInfoFieldConfig {
  fieldName: string;
  required?: boolean;
  type?: string;
  labelKey?: string;
  defaultLabel?: string;
  helpText?: string;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  options?: TravelInfoFieldOption[];
  allowCustom?: boolean;
  customFieldName?: string;
  customLabel?: string;
  customPlaceholder?: string;
  uppercaseNormalize?: boolean;
  immediateSave?: boolean;
  default?: string;
  [extra: string]: unknown;
}

export interface TravelInfoSectionConfig {
  enabled?: boolean;
  icon?: string;
  sectionKey: string;
  titleKey?: string;
  defaultTitle?: string;
  fields?: Record<string, TravelInfoFieldConfig>;
  minRequired?: number;
  maxAllowed?: number;
  fundTypes?: string[];
  labels?: Record<string, string>;
  [extra: string]: unknown;
}

export interface TravelInfoHeroValueProp {
  icon: string;
  textKey?: string;
  defaultText?: string;
  text?: string;
  [extra: string]: unknown;
}

export interface TravelInfoHeroConfig {
  type?: string;
  titleKey?: string;
  defaultTitle?: string;
  title?: string;
  subtitleKey?: string;
  defaultSubtitle?: string;
  subtitle?: string;
  gradient?: {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  };
  valuePropositions?: TravelInfoHeroValueProp[];
  beginnerTip?: Record<string, unknown>;
  [extra: string]: unknown;
}

export interface TravelInfoLocationHierarchy {
  levels: number;
  provincesData?: unknown;
  getDistrictsFunc?: (...args: unknown[]) => unknown;
  [extra: string]: unknown;
}

export interface TravelInfoValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minMonthsValid?: number;
  futureOnly?: boolean;
  pastOnly?: boolean;
  format?: string;
  messageKey?: string;
  [extra: string]: unknown;
}

export type TravelInfoValidationConfig = Record<string, Record<string, TravelInfoValidationRule>>;

export interface TravelInfoConfig {
  destinationId: string;
  name: string;
  nameZh?: string;
  flag?: string;
  colors?: Record<string, string>;
  screens?: Record<string, string | null>;
  hero?: TravelInfoHeroConfig;
  sections?: Record<string, TravelInfoSectionConfig>;
  validation?: TravelInfoValidationConfig & Record<string, unknown>;
  locationHierarchy?: TravelInfoLocationHierarchy;
  completion?: Record<string, unknown>;
  features?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  navigation?: Record<string, unknown>;
  [extra: string]: unknown;
}

export interface EntryFlowCategoryConfig {
  id: string;
  nameKey?: string;
  icon?: string;
  requiredFields?: string[];
  minRequired?: number;
  validator?: (...args: unknown[]) => boolean;
  [extra: string]: unknown;
}

export interface EntryFlowConfig {
  destinationId: string;
  name: string;
  nameZh?: string;
  flag?: string;
  colors?: Record<string, string>;
  screens?: Record<string, string | null>;
  categories?: EntryFlowCategoryConfig[];
  completion?: Record<string, unknown>;
  status?: Record<string, unknown>;
  entryFlow?: Record<string, unknown>;
  features?: Record<string, unknown>;
  submission?: Record<string, unknown>;
  [extra: string]: unknown;
}

export interface EntryPackDocumentConfig {
  enabled: boolean;
  type: string | null;
  template: string | null;
  languages?: LocaleCode[];
  required?: boolean;
  [extra: string]: unknown;
}

export interface EntryPackPreviewConfig {
  destinationId: string;
  name: string;
  flag?: string;
  colors?: Record<string, string>;
  documents?: Record<string, EntryPackDocumentConfig>;
  export?: Record<string, unknown>;
  preview?: Record<string, unknown>;
  validation?: Record<string, unknown>;
  features?: Record<string, unknown>;
  messages?: Record<string, unknown>;
  i18n?: Record<string, unknown>;
  [extra: string]: unknown;
}

export interface InfoScreenSectionConfig {
  key: string;
  titleKey?: string;
  itemsKey?: string;
  variant?: string;
  [extra: string]: unknown;
}

export interface InfoScreenConfig {
  flag?: string;
  headerTitleKey?: string;
  titleKey?: string;
  subtitleKey?: string;
  sections?: InfoScreenSectionConfig[];
  primaryAction?: {
    labelKey?: string;
    screen: string;
    buildParams?: (...args: unknown[]) => unknown;
    [extra: string]: unknown;
  };
  [extra: string]: unknown;
}

export interface RequirementsItemConfig {
  key: string;
  titleKey: string;
  descriptionKey?: string;
  detailsKey?: string;
  [extra: string]: unknown;
}

export interface RequirementsScreenConfig {
  headerTitleKey?: string;
  introTitleKey?: string;
  introSubtitleKey?: string;
  requirements?: RequirementsItemConfig[];
  infoBox?: Record<string, unknown>;
  primaryAction?: {
    labelKey?: string;
    screen: string;
    buildParams?: (...args: unknown[]) => unknown;
    [extra: string]: unknown;
  };
  [extra: string]: unknown;
}

export interface DestinationConfig extends DestinationMetadata {
  financial?: FinancialInfo;
  emergency?: EmergencyInfo;
  entryGuide?: Record<string, unknown>;
  validation?: Record<string, unknown>;
  dataPath?: Record<string, string>;
  services?: ServiceMappings;
  screens?: ScreenMappings;
  features?: FeatureFlags;
  travelInfo?: TravelInfoConfig;
  comprehensiveTravelInfo?: TravelInfoConfig;
  entryFlow?: EntryFlowConfig;
  entryPackPreview?: EntryPackPreviewConfig;
  infoScreen?: InfoScreenConfig;
  requirementsScreen?: RequirementsScreenConfig;
  [extra: string]: unknown;
}


