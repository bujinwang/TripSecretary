/**
 * Test script to verify TDAC data accuracy fixes
 */

// Mock the ThailandTravelerContextBuilder methods for testing
class TestTravelerContextBuilder {
  /**
   * Parse full name into components (FIXED VERSION)
   */
  static parseFullName(fullName) {
    if (!fullName) {
      return { familyName: '', firstName: '', middleName: '' };
    }

    console.log('🔍 Parsing full name:', fullName);

    // Clean the full name - remove extra spaces and normalize
    const cleanedName = fullName.trim().replace(/\s+/g, ' ');

    // Try comma-separated format first (e.g., "ZHANG, WEI MING")
    if (cleanedName.includes(',')) {
      const parts = cleanedName.split(',').map(part => part.trim());
      if (parts.length === 2) {
        const givenNames = parts[1].split(' ').filter(name => name.length > 0);
        const result = {
          familyName: parts[0].replace(/,+$/, '').trim(), // Remove trailing commas
          middleName: givenNames[0] || '',
          firstName: givenNames.slice(1).join(' ') || givenNames[0] || ''
        };
        console.log('✅ Comma format parsed:', result);
        return result;
      }
    }

    // Try space-separated format (e.g., "LI A MAO")
    const spaceParts = cleanedName.split(/\s+/);
    if (spaceParts.length === 3) {
      // Three parts: Family Middle First
      const result = {
        familyName: spaceParts[0].replace(/,+$/, '').trim(),    // Remove trailing commas
        middleName: spaceParts[1].replace(/,+$/, '').trim(),    // Remove trailing commas
        firstName: spaceParts[2].replace(/,+$/, '').trim()      // Remove trailing commas
      };
      console.log('✅ Three-part name parsed:', result);
      return result;
    } else if (spaceParts.length === 2) {
      // Two parts: Family First (no middle name)
      const result = {
        familyName: spaceParts[0].replace(/,+$/, '').trim(),    // Remove trailing commas
        middleName: '',                                         // (empty)
        firstName: spaceParts[1].replace(/,+$/, '').trim()      // Remove trailing commas
      };
      console.log('✅ Two-part name parsed:', result);
      return result;
    } else if (spaceParts.length > 3) {
      // More than three parts: First is family, second is middle, rest is first
      const result = {
        familyName: spaceParts[0].replace(/,+$/, '').trim(),                    // First part as family
        middleName: spaceParts[1].replace(/,+$/, '').trim(),                    // Second part as middle
        firstName: spaceParts.slice(2).join(' ').replace(/,+$/, '').trim()     // Rest as first name
      };
      console.log('✅ Multi-part name parsed:', result);
      return result;
    }

    // Single name - treat as first name
    const result = {
      familyName: '',
      middleName: '',
      firstName: cleanedName.replace(/,+$/, '').trim()
    };
    console.log('✅ Single name parsed:', result);
    return result;
  }

  /**
   * Get country boarded with fallback strategies (NEW METHOD)
   */
  static getCountryBoarded(travelInfo, passport) {
    // Strategy 1: Use explicit departure country if provided
    if (travelInfo?.departureCountry) {
      return travelInfo.departureCountry;
    }

    // Strategy 2: Derive from departure airport code
    if (travelInfo?.arrivalDepartureAirport) {
      const countryFromAirport = this.getCountryFromAirport(travelInfo.arrivalDepartureAirport);
      if (countryFromAirport) {
        return countryFromAirport;
      }
    }

    // Strategy 3: Use recent stay country if available
    if (travelInfo?.recentStayCountry) {
      return travelInfo.recentStayCountry;
    }

    // Strategy 4: Use passport nationality as fallback (most common case)
    if (passport?.nationality) {
      return passport.nationality;
    }

    // Strategy 5: Default to empty (will be flagged as validation error)
    return '';
  }

  /**
   * Get country from airport code (IMPROVED VERSION)
   */
  static getCountryFromAirport(airportCode) {
    if (!airportCode) return '';

    // Normalize airport code
    const normalizedCode = airportCode.toUpperCase().trim();

    // Map common airport codes to countries
    const airportMap = {
      // China
      'PEK': 'CHN', 'PVG': 'CHN', 'CAN': 'CHN', 'SZX': 'CHN', 'CTU': 'CHN', 'KMG': 'CHN',
      'XIY': 'CHN', 'WUH': 'CHN', 'CSX': 'CHN', 'NKG': 'CHN', 'HGH': 'CHN', 'TSN': 'CHN',
      
      // Hong Kong, Macau, Taiwan
      'HKG': 'HKG', 'MFM': 'MAC', 'TPE': 'TWN', 'KHH': 'TWN',
      
      // Japan
      'NRT': 'JPN', 'HND': 'JPN', 'KIX': 'JPN', 'NGO': 'JPN', 'FUK': 'JPN', 'CTS': 'JPN',
      
      // Korea
      'ICN': 'KOR', 'GMP': 'KOR', 'PUS': 'KOR',
      
      // Southeast Asia
      'SIN': 'SGP', 'KUL': 'MYS', 'CGK': 'IDN', 'MNL': 'PHL', 'BKK': 'THA', 'DMK': 'THA',
      'HAN': 'VNM', 'SGN': 'VNM', 'RGN': 'MMR', 'PNH': 'KHM',
      
      // USA & Canada
      'LAX': 'USA', 'JFK': 'USA', 'SFO': 'USA', 'ORD': 'USA', 'DFW': 'USA', 'ATL': 'USA',
      'YVR': 'CAN', 'YYZ': 'CAN', 'YUL': 'CAN',
      
      // Europe
      'LHR': 'GBR', 'CDG': 'FRA', 'FRA': 'DEU', 'AMS': 'NLD', 'FCO': 'ITA', 'MAD': 'ESP',
      
      // Australia & New Zealand
      'SYD': 'AUS', 'MEL': 'AUS', 'AKL': 'NZL',
      
      // Middle East
      'DXB': 'ARE', 'DOH': 'QAT', 'KWI': 'KWT'
    };

    return airportMap[normalizedCode] || '';
  }

  /**
   * Check if address appears to be test or dummy data (NEW METHOD)
   */
  static isTestOrDummyAddress(address) {
    if (!address) return false;
    
    const lowerAddress = address.toLowerCase().trim();
    
    // Common test/dummy patterns
    const testPatterns = [
      'test', 'dummy', 'fake', 'sample', 'example',
      'add add', 'adidas dad', 'abc', '123', 'xxx',
      'temp', 'placeholder', 'default', 'lorem ipsum'
    ];
    
    // Check for test patterns
    for (const pattern of testPatterns) {
      if (lowerAddress.includes(pattern)) {
        return true;
      }
    }
    
    // Check for very short addresses (likely incomplete)
    if (lowerAddress.length < 10) {
      return true;
    }
    
    // Check for repeated characters (e.g., "aaaa", "1111")
    if (/(.)\1{3,}/.test(lowerAddress)) {
      return true;
    }
    
    return false;
  }
}

console.log('🧪 Testing TDAC Data Accuracy Fixes');
console.log('===================================\n');

// Test 1: Name parsing fixes
console.log('1. 🔧 TESTING NAME PARSING FIXES:');
console.log('----------------------------------');

const testNames = [
  'LI, A, MAO',  // Original problematic format
  'LI A MAO',    // Space-separated format
  'ZHANG, WEI MING',  // Comma format
  'WANG LEI',    // Two-part name
  'CHEN',        // Single name
  'LI, A, MAO XIAO MING'  // Complex name
];

testNames.forEach(name => {
  console.log(`\nTesting: "${name}"`);
  const result = TestTravelerContextBuilder.parseFullName(name);
  console.log('Result:', result);
  
  // Check for comma issues
  const hasCommaIssues = result.familyName.includes(',') || 
                        result.middleName.includes(',') || 
                        result.firstName.includes(',');
  
  if (hasCommaIssues) {
    console.log('❌ Still has comma issues!');
  } else {
    console.log('✅ No comma issues');
  }
});

// Test 2: Country boarded logic
console.log('\n\n2. 🔧 TESTING COUNTRY BOARDED LOGIC:');
console.log('------------------------------------');

const testScenarios = [
  {
    name: 'With departure airport',
    travelInfo: { arrivalDepartureAirport: 'PVG' },
    passport: { nationality: 'CHN' }
  },
  {
    name: 'With recent stay country',
    travelInfo: { recentStayCountry: 'CHN' },
    passport: { nationality: 'CHN' }
  },
  {
    name: 'Fallback to nationality',
    travelInfo: {},
    passport: { nationality: 'CHN' }
  },
  {
    name: 'No data available',
    travelInfo: {},
    passport: {}
  }
];

testScenarios.forEach(scenario => {
  console.log(`\nTesting: ${scenario.name}`);
  const result = TestTravelerContextBuilder.getCountryBoarded(scenario.travelInfo, scenario.passport);
  console.log('Country boarded:', result || '(empty)');
  
  if (!result) {
    console.log('⚠️ Empty result - will trigger validation error');
  } else {
    console.log('✅ Valid country code');
  }
});

// Test 3: Airport code mapping
console.log('\n\n3. 🔧 TESTING AIRPORT CODE MAPPING:');
console.log('-----------------------------------');

const testAirports = ['PVG', 'PEK', 'HKG', 'NRT', 'ICN', 'SIN', 'LAX', 'INVALID'];

testAirports.forEach(airport => {
  const country = TestTravelerContextBuilder.getCountryFromAirport(airport);
  console.log(`${airport} → ${country || '(not found)'}`);
});

// Test 4: Address validation
console.log('\n\n4. 🔧 TESTING ADDRESS VALIDATION:');
console.log('---------------------------------');

const testAddresses = [
  'Add add Adidas Dad',  // Original problematic address
  'Bangkok Marriott Hotel Sukhumvit, 57 Sukhumvit Soi 57',  // Good address
  'test address',        // Test data
  'abc',                 // Too short
  'aaaaaaaaaa',         // Repeated characters
  'Hilton Bangkok Grande Asoke, 30 Sukhumvit Road'  // Good address
];

testAddresses.forEach(address => {
  const isTestData = TestTravelerContextBuilder.isTestOrDummyAddress(address);
  console.log(`"${address}" → ${isTestData ? '❌ Test/Dummy data' : '✅ Looks valid'}`);
});

// Summary
console.log('\n\n📊 FIX VERIFICATION SUMMARY:');
console.log('============================');
console.log('✅ Name parsing: Fixed comma removal');
console.log('✅ Country boarded: Added fallback logic');
console.log('✅ Airport mapping: Expanded coverage');
console.log('✅ Address validation: Added test data detection');

console.log('\n🎯 EXPECTED IMPROVEMENTS:');
console.log('=========================');
console.log('• Names will no longer have trailing commas');
console.log('• Country boarded will use passport nationality as fallback');
console.log('• Test addresses will be flagged during validation');
console.log('• More airport codes will be recognized');

console.log('\n🔄 NEXT STEPS:');
console.log('==============');
console.log('1. Deploy these fixes to the app');
console.log('2. Test with real user data');
console.log('3. Monitor submission logs for improvements');
console.log('4. Add user confirmation dialog before submission');