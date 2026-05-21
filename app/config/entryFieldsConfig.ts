/**
 * Entry Fields Configuration
 * Defines required field metadata for each category in the progressive entry flow
 * 
 * Requirements: 2.1-2.6
 */

/**
 * Field validation functions
 */
const FieldValidators = {
  /**
   * Validate required text field
   * @param {string} value - Field value
   * @returns {Object} - Validation result
   */
  requiredText: (value) => ({
    isValid: typeof value === 'string' && value.trim().length > 0,
    message: value ? null : 'This field is required'
  }),

  /**
   * Validate passport number
   * @param {string} value - Passport number
   * @returns {Object} - Validation result
   */
  passportNumber: (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, message: 'Passport number is required' };
    }
    
    const cleaned = value.replace(/\s/g, '');
    const isValid = /^[A-Z0-9]{6,12}$/i.test(cleaned);
    
    return {
      isValid,
      message: isValid ? null : 'Passport number must be 6-12 alphanumeric characters'
    };
  },

  /**
   * Validate full name
   * @param {string} value - Full name
   * @returns {Object} - Validation result
   */
  fullName: (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, message: 'Full name is required' };
    }
    
    const isValid = value.trim().length >= 2 && /^[a-zA-Z\s\-'.,]+$/i.test(value);
    
    return {
      isValid,
      message: isValid ? null : 'Please enter a valid full name'
    };
  },

  /**
   * Validate nationality
   * @param {string} value - Nationality
   * @returns {Object} - Validation result
   */
  nationality: (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, message: 'Nationality is required' };
    }
    
    const isValid = value.trim().length >= 2;
    
    return {
      isValid,
      message: isValid ? null : 'Please select your nationality'
    };
  },

  /**
   * Validate date of birth
   * @param {string} value - Date of birth
   * @returns {Object} - Validation result
   */
  dateOfBirth: (value) => {
    if (!value) {
      return { isValid: false, message: 'Date of birth is required' };
    }
    
    const date = new Date(value);
    const now = new Date();
    const age = (now - date) / (1000 * 60 * 60 * 24 * 365.25);
    
    const isValid = date instanceof Date && !isNaN(date) && age >= 0 && age <= 120;
    
    return {
      isValid,
      message: isValid ? null : 'Please enter a valid date of birth'
    };
  },

  /**
   * Validate passport expiry date
   * @param {string} value - Expiry date
   * @returns {Object} - Validation result
   */
  expiryDate: (value) => {
    if (!value) {
      return { isValid: false, message: 'Passport expiry date is required' };
    }
    
    const date = new Date(value);
    const now = new Date();
    
    const isValid = date instanceof Date && !isNaN(date) && date > now;
    
    return {
      isValid,
      message: isValid ? null : 'Passport must not be expired'
    };
  },

  /**
   * Validate email address
   * @param {string} value - Email address
   * @returns {Object} - Validation result
   */
  email: (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, message: 'Email address is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    
    return {
      isValid,
      message: isValid ? null : 'Please enter a valid email address'
    };
  },

  /**
   * Validate phone number
   * @param {string} value - Phone number
   * @returns {Object} - Validation result
   */
  phoneNumber: (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, message: 'Phone number is required' };
    }
    
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    const isValid = /^[\+]?[1-9][\d]{6,14}$/.test(cleaned);
    
    return {
      isValid,
      message: isValid ? null : 'Please enter a valid phone number'
    };
  },

  /**
   * Validate gender
   * @param {string} value - Gender
   * @returns {Object} - Validation result
   */
  gender: (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, message: 'Gender is required' };
    }

    const normalized = value.trim();
    if (!normalized) {
      return { isValid: false, message: 'Gender is required' };
    }

    const lower = normalized.toLowerCase();
    const validLowerCase = ['male', 'female', 'undefined'];
    const validShort = ['m', 'f'];
    const validLocalized = ['男', '女'];

    const isValid = validLowerCase.includes(lower) ||
      validShort.includes(lower) ||
      validLocalized.includes(normalized);

    return {
      isValid,
      message: isValid ? null : 'Please select your gender'
    };
  },

  /**
   * Validate arrival date
   * @param {string} value - Arrival date
   * @returns {Object} - Validation result
   */
  arrivalDate: (value) => {
    if (!value) {
      return { isValid: false, message: 'Arrival date is required' };
    }
    
    const date = new Date(value);
    const now = new Date();
    
    const isValid = date instanceof Date && !isNaN(date) && date >= now;
    
    return {
      isValid,
      message: isValid ? null : 'Arrival date must be in the future'
    };
  },

  /**
   * Validate departure date
   * @param {string} value - Departure date
   * @param {string} arrivalDate - Arrival date for comparison
   * @returns {Object} - Validation result
   */
  departureDate: (value, arrivalDate) => {
    if (!value) {
      return { isValid: false, message: 'Departure date is required' };
    }
    
    const depDate = new Date(value);
    const arrDate = arrivalDate ? new Date(arrivalDate) : null;
    
    let isValid = depDate instanceof Date && !isNaN(depDate);
    
    if (isValid && arrDate && !isNaN(arrDate)) {
      isValid = depDate > arrDate;
    }
    
    return {
      isValid,
      message: isValid ? null : 'Departure date must be after arrival date'
    };
  },

  /**
   * Validate flight number
   * @param {string} value - Flight number
   * @returns {Object} - Validation result
   */
  flightNumber: (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, message: 'Flight number is required' };
    }
    
    const cleaned = value.replace(/\s/g, '');
    const isValid = /^[A-Z]{2,3}\d{1,4}$/i.test(cleaned);
    
    return {
      isValid,
      message: isValid ? null : 'Please enter a valid flight number (e.g., CX123)'
    };
  },

  /**
   * Validate fund item
   * @param {Object} fundItem - Fund item object
   * @returns {Object} - Validation result
   */
  fundItem: (fundItem) => {
    if (!fundItem || typeof fundItem !== 'object') {
      return { isValid: false, message: 'Fund item is required' };
    }
    
    const hasType = fundItem.type && typeof fundItem.type === 'string';
    const hasAmount = fundItem.amount && !isNaN(parseFloat(fundItem.amount));
    const hasCurrency = fundItem.currency && typeof fundItem.currency === 'string';
    
    const isValid = hasType && hasAmount && hasCurrency;
    
    return {
      isValid,
      message: isValid ? null : 'Fund item must have type, amount, and currency'
    };
  }
};

/**
 * Passport category configuration
 */
export const PassportCategory = {
  name: 'passport',
  label: 'Passport Information',
  labelKey: 'progressiveEntryFlow.categories.passport',
  icon: '📘',
  description: 'Basic passport information required for entry',
  requiredFieldCount: 6,
  fields: [
    {
      name: 'passportNumber',
      label: 'Passport Number',
      labelKey: 'passport.passportNumber',
      type: 'required',
      inputType: 'text',
      validator: FieldValidators.passportNumber,
      helpText: 'Enter your passport number as shown on your passport',
      placeholder: 'e.g., E12345678',
      maxLength: 12
    },
    {
      name: 'fullName',
      label: 'Full Name',
      labelKey: 'passport.fullName',
      type: 'required',
      inputType: 'text',
      validator: FieldValidators.fullName,
      helpText: 'Enter your full name as shown on your passport',
      placeholder: 'e.g., ZHANG, Wei',
      maxLength: 100
    },
    {
      name: 'nationality',
      label: 'Nationality',
      labelKey: 'passport.nationality',
      type: 'required',
      inputType: 'select',
      validator: FieldValidators.nationality,
      helpText: 'Select your nationality',
      options: 'nationalities' // Reference to nationalities data
    },
    {
      name: 'dateOfBirth',
      label: 'Date of Birth',
      labelKey: 'passport.dateOfBirth',
      type: 'required',
      inputType: 'date',
      validator: FieldValidators.dateOfBirth,
      helpText: 'Enter your date of birth as shown on your passport'
    },
    {
      name: 'expiryDate',
      label: 'Passport Expiry Date',
      labelKey: 'passport.expiryDate',
      type: 'required',
      inputType: 'date',
      validator: FieldValidators.expiryDate,
      helpText: 'Enter your passport expiry date'
    }
  ]
};

/**
 * Personal Info category configuration
 */
export const PersonalInfoCategory = {
  name: 'personalInfo',
  label: 'Personal Information',
  labelKey: 'progressiveEntryFlow.categories.personalInfo',
  icon: '👤',
  description: 'Personal details for immigration purposes',
  requiredFieldCount: 6,
  fields: [
    {
      name: 'occupation',
      label: 'Occupation',
      labelKey: 'personalInfo.occupation',
      type: 'required',
      inputType: 'text',
      validator: FieldValidators.requiredText,
      helpText: 'Enter your current occupation or job title',
      placeholder: 'e.g., Software Engineer',
      maxLength: 100
    },
    {
      name: 'provinceCity',
      label: 'Province/City',
      labelKey: 'personalInfo.provinceCity',
      type: 'required',
      inputType: 'text',
      validator: FieldValidators.requiredText,
      helpText: 'Enter your province or city of residence',
      placeholder: 'e.g., Beijing',
      maxLength: 100
    },
    {
      name: 'countryRegion',
      label: 'Country/Region',
      labelKey: 'personalInfo.countryRegion',
      type: 'required',
      inputType: 'select',
      validator: FieldValidators.requiredText,
      helpText: 'Select your country or region of residence',
      options: 'countries' // Reference to countries data
    },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      labelKey: 'personalInfo.phoneNumber',
      type: 'required',
      inputType: 'phone',
      validator: FieldValidators.phoneNumber,
      helpText: 'Enter your phone number with country code',
      placeholder: 'e.g., +86 138 0013 8000'
    },
    {
      name: 'email',
      label: 'Email Address',
      labelKey: 'personalInfo.email',
      type: 'required',
      inputType: 'email',
      validator: FieldValidators.email,
      helpText: 'Enter your email address',
      placeholder: 'e.g., zhang.wei@example.com'
    },
    {
      // NOTE: Gender field removed from personalInfo - handled by passport model
      name: 'gender_removed',
      label: 'Gender (Removed)',
      labelKey: 'personalInfo.gender_removed',
      type: 'optional',
      inputType: 'select',
      validator: FieldValidators.gender,
      helpText: 'Gender is now handled by passport data',
      options: [
        { value: 'male', label: 'Male', labelKey: 'common.male' },
        { value: 'female', label: 'Female', labelKey: 'common.female' }
      ]
    }
  ]
};

/**
 * Funds category configuration
 */
export const FundsCategory = {
  name: 'funds',
  label: 'Fund Information',
  labelKey: 'progressiveEntryFlow.categories.funds',
  icon: '💰',
  description: 'Proof of funds for your trip',
  requiredFieldCount: 1, // At least 1 fund item
  isArray: true, // This category contains an array of items
  fields: [
    {
      name: 'fundItems',
      label: 'Fund Items',
      labelKey: 'funds.fundItems',
      type: 'required',
      inputType: 'array',
      validator: (fundItems) => {
        if (!Array.isArray(fundItems) || fundItems.length === 0) {
          return { isValid: false, message: 'At least one fund item is required' };
        }
        
        const validItems = fundItems.filter(item => FieldValidators.fundItem(item).isValid);
        const isValid = validItems.length > 0;
        
        return {
          isValid,
          message: isValid ? null : 'At least one valid fund item is required'
        };
      },
      helpText: 'Add at least one proof of funds (credit card, cash, bank balance, etc.)',
      itemFields: [
        {
          name: 'type',
          label: 'Fund Type',
          labelKey: 'funds.type',
          type: 'required',
          inputType: 'select',
          validator: FieldValidators.requiredText,
          options: [
            { value: 'credit_card', label: 'Credit Card', labelKey: 'funds.types.creditCard' },
            { value: 'cash', label: 'Cash', labelKey: 'funds.types.cash' },
            { value: 'bank_balance', label: 'Bank Balance', labelKey: 'funds.types.bankBalance' },
            { value: 'investment', label: 'Investment', labelKey: 'funds.types.investment' },
            { value: 'other', label: 'Other', labelKey: 'funds.types.other' }
          ]
        },
        {
          name: 'amount',
          label: 'Amount',
          labelKey: 'funds.amount',
          type: 'required',
          inputType: 'number',
          validator: (value) => {
            const num = parseFloat(value);
            const isValid = !isNaN(num) && num > 0;
            return {
              isValid,
              message: isValid ? null : 'Please enter a valid amount'
            };
          }
        },
        {
          name: 'currency',
          label: 'Currency',
          labelKey: 'funds.currency',
          type: 'required',
          inputType: 'select',
          validator: FieldValidators.requiredText,
          options: [
            { value: 'THB', label: 'Thai Baht (THB)', labelKey: 'currencies.THB' },
            { value: 'USD', label: 'US Dollar (USD)', labelKey: 'currencies.USD' },
            { value: 'CNY', label: 'Chinese Yuan (CNY)', labelKey: 'currencies.CNY' },
            { value: 'EUR', label: 'Euro (EUR)', labelKey: 'currencies.EUR' },
            { value: 'GBP', label: 'British Pound (GBP)', labelKey: 'currencies.GBP' }
          ]
        }
      ]
    }
  ]
};

/**
 * Travel category configuration
 */
export const TravelCategory = {
  name: 'travel',
  label: 'Travel Information',
  labelKey: 'progressiveEntryFlow.categories.travel',
  icon: '✈️',
  description: 'Travel details and accommodation information',
  requiredFieldCount: 5,
  fields: [
    {
      name: 'travelPurpose',
      label: 'Travel Purpose',
      labelKey: 'travel.travelPurpose',
      type: 'required',
      inputType: 'select',
      validator: FieldValidators.requiredText,
      helpText: 'Select the purpose of your visit',
      options: 'travelPurposes' // Reference to travel purposes data
    },
    {
      name: 'arrivalArrivalDate',
      label: 'Arrival Date',
      labelKey: 'travel.arrivalDate',
      type: 'required',
      inputType: 'date',
      validator: FieldValidators.arrivalDate,
      helpText: 'Enter your arrival date in Thailand'
    },
    {
      name: 'departureDepartureDate',
      label: 'Departure Date',
      labelKey: 'travel.departureDate',
      type: 'required',
      inputType: 'date',
      validator: (value, allData) => FieldValidators.departureDate(value, allData?.arrivalArrivalDate),
      helpText: 'Enter your departure date from Thailand'
    },
    {
      name: 'arrivalFlightNumber',
      label: 'Arrival Flight Number',
      labelKey: 'travel.arrivalFlightNumber',
      type: 'required',
      inputType: 'text',
      validator: FieldValidators.flightNumber,
      helpText: 'Enter your arrival flight number',
      placeholder: 'e.g., CX123, TG456',
      maxLength: 10
    },
    {
      name: 'accommodation',
      label: 'Accommodation',
      labelKey: 'travel.accommodation',
      type: 'required',
      inputType: 'text',
      validator: FieldValidators.requiredText,
      helpText: 'Enter your accommodation details (hotel name, address, etc.)',
      placeholder: 'e.g., Bangkok Hotel, 123 Sukhumvit Road',
      maxLength: 200
    }
  ]
};

/**
 * Complete entry fields configuration
 */
export const EntryFieldsConfig = {
  passport: PassportCategory,
  personalInfo: PersonalInfoCategory,
  funds: FundsCategory,
  travel: TravelCategory
};

/**
 * Get field configuration by category and field name
 * @param {string} category - Category name
 * @param {string} fieldName - Field name
 * @returns {Object|null} - Field configuration
 */
export function getFieldConfig(category, fieldName) {
  const categoryConfig = EntryFieldsConfig[category];
  if (!categoryConfig) {
return null;
}

  return categoryConfig.fields.find(field => field.name === fieldName) || null;
}

/**
 * Get all required fields for a category
 * @param {string} category - Category name
 * @returns {Array} - Array of required field configurations
 */
export function getRequiredFields(category) {
  const categoryConfig = EntryFieldsConfig[category];
  if (!categoryConfig) {
return [];
}

  return categoryConfig.fields.filter(field => field.type === 'required');
}

/**
 * Validate field value using its configuration
 * @param {string} category - Category name
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @param {Object} allData - All form data (for cross-field validation)
 * @returns {Object} - Validation result
 */
export function validateFieldValue(category, fieldName, value, allData = {}) {
  const fieldConfig = getFieldConfig(category, fieldName);
  if (!fieldConfig) {
    return { isValid: false, message: 'Unknown field' };
  }

  return fieldConfig.validator(value, allData);
}

/**
 * Get category summary
 * @param {string} category - Category name
 * @returns {Object} - Category summary
 */
export function getCategorySummary(category) {
  const categoryConfig = EntryFieldsConfig[category];
  if (!categoryConfig) {
return null;
}

  return {
    name: categoryConfig.name,
    label: categoryConfig.label,
    labelKey: categoryConfig.labelKey,
    icon: categoryConfig.icon,
    description: categoryConfig.description,
    requiredFieldCount: categoryConfig.requiredFieldCount,
    totalFields: categoryConfig.fields.length,
    isArray: categoryConfig.isArray || false
  };
}

/**
 * Get all categories summary
 * @returns {Array} - Array of category summaries
 */
export function getAllCategoriesSummary() {
  return Object.keys(EntryFieldsConfig).map(category => getCategorySummary(category));
}

export default EntryFieldsConfig;
