// @ts-nocheck

/**
 * OCR Processing Utilities for Thailand Travel
 * Handles ticket and hotel OCR result processing
 */

/**
 * Format date from OCR result to YYYY-MM-DD format
 * @param {string} dateString - Date string from OCR
 * @returns {string|null} - Formatted date or null
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) {
return null;
}

  try {
    // Try different date formats that might come from OCR
    const dateFormats = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY or DD-MM-YYYY
      /(\d{4})年(\d{1,2})月(\d{1,2})日/, // Chinese format
      /(\d{1,2})月(\d{1,2})日/, // Chinese format without year
    ];

    for (const format of dateFormats) {
      const match = dateString.match(format);
      if (match) {
        let year, month, day;

        if (format.source.includes('年')) {
          // Chinese format
          if (match.length === 4) {
            [, year, month, day] = match;
          } else {
            // No year, use current year
            year = new Date().getFullYear().toString();
            [, month, day] = match;
          }
        } else if (match[1].length === 4) {
          // YYYY-MM-DD format
          [, year, month, day] = match;
        } else {
          // Assume DD/MM/YYYY for international documents
          [, day, month, year] = match;
        }

        // Validate and format
        const y = parseInt(year);
        const m = parseInt(month);
        const d = parseInt(day);

        if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        }
      }
    }
  } catch (error) {
    console.error('Date formatting error:', error);
  }

  return null;
};

/**
 * Map city names to country codes
 * @param {string} cityName - City name from OCR
 * @returns {string|null} - Country code or null
 */
export const mapCityToCountryCode = (cityName) => {
  if (!cityName) {
return null;
}

  const cityToCountry = {
    // Major Chinese cities
    '北京': 'CHN', '上海': 'CHN', '广州': 'CHN', '深圳': 'CHN', '成都': 'CHN',
    '杭州': 'CHN', '南京': 'CHN', '武汉': 'CHN', '西安': 'CHN', '重庆': 'CHN',
    'Beijing': 'CHN', 'Shanghai': 'CHN', 'Guangzhou': 'CHN', 'Shenzhen': 'CHN',
    'Chengdu': 'CHN', 'Hangzhou': 'CHN', 'Nanjing': 'CHN', 'Wuhan': 'CHN',

    // Major international cities
    'Bangkok': 'THA', '曼谷': 'THA',
    'Singapore': 'SGP', '新加坡': 'SGP',
    'Tokyo': 'JPN', '东京': 'JPN', 'Osaka': 'JPN', '大阪': 'JPN',
    'Seoul': 'KOR', '首尔': 'KOR',
    'Hong Kong': 'HKG', '香港': 'HKG',
    'Taipei': 'TWN', '台北': 'TWN',
    'Kuala Lumpur': 'MYS', '吉隆坡': 'MYS',
    'New York': 'USA', '纽约': 'USA', 'Los Angeles': 'USA', '洛杉矶': 'USA',
    'London': 'GBR', '伦敦': 'GBR',
    'Paris': 'FRA', '巴黎': 'FRA',
    'Sydney': 'AUS', '悉尼': 'AUS',
    'Vancouver': 'CAN', '温哥华': 'CAN', 'Toronto': 'CAN', '多伦多': 'CAN',
  };

  // Direct match
  if (cityToCountry[cityName]) {
    return cityToCountry[cityName];
  }

  // Partial match (case insensitive)
  const cityLower = cityName.toLowerCase();
  for (const [city, country] of Object.entries(cityToCountry)) {
    if (city.toLowerCase().includes(cityLower) || cityLower.includes(city.toLowerCase())) {
      return country;
    }
  }

  return null;
};

/**
 * Extract province from address
 * @param {string} address - Address string
 * @returns {string|null} - Province name or null
 */
export const extractProvinceFromAddress = (address) => {
  if (!address) {
return null;
}

  const thaiProvinces = [
    'Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Koh Samui',
    'Hua Hin', 'Ayutthaya', 'Sukhothai', 'Chiang Rai', 'Kanchanaburi',
    'Nakhon Ratchasima', 'Udon Thani', 'Khon Kaen', 'Surat Thani',
    '曼谷', '清迈', '普吉', '芭提雅', '甲米', '苏梅岛'
  ];

  for (const province of thaiProvinces) {
    if (address.includes(province)) {
      return province;
    }
  }

  // If no specific province found, try to extract from common patterns
  const provincePatterns = [
    /(\w+)\s+Province/i,
    /(\w+)府/,
    /(\w+)\s+จังหวัด/
  ];

  for (const pattern of provincePatterns) {
    const match = address.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};

/**
 * Process ticket OCR result
 * @param {Object} ocrResult - OCR result from ticket scan
 * @param {Object} currentState - Current state values
 * @param {Function} setters - State setter functions
 * @param {Object} t - Translation function
 */
export const processTicketOCRResult = async (ocrResult, currentState, setters, t) => {
  const { arrivalFlightNumber, departureFlightNumber } = currentState;
  const { setArrivalFlightNumber, setDepartureFlightNumber, setArrivalArrivalDate, setBoardingCountry, setLastEditedField, Alert } = setters;

  // Extract and set flight information
  if (ocrResult.flightNumber) {
    // Determine if this is arrival or departure flight based on current context
    if (!arrivalFlightNumber || arrivalFlightNumber.trim() === '') {
      setArrivalFlightNumber(ocrResult.flightNumber);
      setLastEditedField('arrivalFlightNumber');
    } else if (!departureFlightNumber || departureFlightNumber.trim() === '') {
      setDepartureFlightNumber(ocrResult.flightNumber);
      setLastEditedField('departureFlightNumber');
    } else {
      // Both are filled, ask user which one to update
      Alert.alert(
        t('thailand.travelInfo.scan.flightChoiceTitle', { defaultValue: '选择航班' }),
        t('thailand.travelInfo.scan.flightChoiceMessage', {
          defaultValue: '检测到航班号 {flightNumber}，请选择要更新的航班信息',
          flightNumber: ocrResult.flightNumber
        }),
        [
          {
            text: t('thailand.travelInfo.scan.arrivalFlight', { defaultValue: '入境航班' }),
            onPress: () => {
              setArrivalFlightNumber(ocrResult.flightNumber);
              setLastEditedField('arrivalFlightNumber');
            }
          },
          {
            text: t('thailand.travelInfo.scan.departureFlight', { defaultValue: '离境航班' }),
            onPress: () => {
              setDepartureFlightNumber(ocrResult.flightNumber);
              setLastEditedField('departureFlight');
            }
          },
          {
            text: t('common.cancel', { defaultValue: '取消' }),
            style: 'cancel'
          }
        ]
      );
      return;
    }
  }

  // Set arrival date if detected
  if (ocrResult.arrivalDate && (ocrResult.flightNumber === arrivalFlightNumber || !departureFlightNumber)) {
    const formattedDate = formatDateForInput(ocrResult.arrivalDate);
    if (formattedDate) {
      setArrivalArrivalDate(formattedDate);
      setLastEditedField('arrivalArrivalDate');
    }
  }

  // Set departure city as boarding country if available
  if (ocrResult.departureCity) {
    const countryCode = mapCityToCountryCode(ocrResult.departureCity);
    if (countryCode) {
      setBoardingCountry(countryCode);
      setLastEditedField('boardingCountry');
    }
  }
};

/**
 * Process hotel OCR result
 * @param {Object} ocrResult - OCR result from hotel scan
 * @param {Object} currentState - Current state values
 * @param {Function} setters - State setter functions
 */
export const processHotelOCRResult = async (ocrResult, currentState, setters) => {
  const { arrivalArrivalDate, departureDepartureDate, province } = currentState;
  const { setHotelAddress, setArrivalArrivalDate, setDepartureDepartureDate, setProvince, setLastEditedField } = setters;

  // Set hotel address
  if (ocrResult.address) {
    setHotelAddress(ocrResult.address);
    setLastEditedField('hotelAddress');
  } else if (ocrResult.hotelName) {
    setHotelAddress(ocrResult.hotelName);
    setLastEditedField('hotelAddress');
  }

  // Set check-in date as arrival date if not already set
  if (ocrResult.checkIn && (!arrivalArrivalDate || arrivalArrivalDate.trim() === '')) {
    const formattedDate = formatDateForInput(ocrResult.checkIn);
    if (formattedDate) {
      setArrivalArrivalDate(formattedDate);
      setLastEditedField('arrivalArrivalDate');
    }
  }

  // Set check-out date as departure date if not already set
  if (ocrResult.checkOut && (!departureDepartureDate || departureDepartureDate.trim() === '')) {
    const formattedDate = formatDateForInput(ocrResult.checkOut);
    if (formattedDate) {
      setDepartureDepartureDate(formattedDate);
      setLastEditedField('departureDepartureDate');
    }
  }

  // Extract province from address if possible
  if (ocrResult.address && (!province || province.trim() === '')) {
    const extractedProvince = extractProvinceFromAddress(ocrResult.address);
    if (extractedProvince) {
      setProvince(extractedProvince);
      setLastEditedField('province');
    }
  }
};
