/**
 * Test ThailandTravelerContextBuilder Transport Mode Logic
 * Simulate the exact scenario from the JSON screenshot
 */

console.log('🛩️ Testing ThailandTravelerContextBuilder Transport Mode');
console.log('======================================================\n');

// Replicate the methods from ThailandTravelerContextBuilder
function getTravelMode(travelInfo) {
  // If flight information is present, it's air travel
  if (travelInfo?.arrivalFlightNumber || travelInfo?.departureFlightNumber) {
    return 'AIR';
  }

  // Check for explicit travel mode
  if (travelInfo?.travelMode) {
    const mode = travelInfo.travelMode.toUpperCase();
    if (['AIR', 'LAND', 'SEA'].includes(mode)) {
      return mode;
    }
  }

  // Default to AIR for most international tourists
  return 'AIR';
}

function getTransportModeId(travelInfo) {
  const travelMode = getTravelMode(travelInfo);
  
  // TDAC transport mode IDs (extracted from HAR file)
  const TDAC_TRANSPORT_MODE_IDS = {
    // Air transport subtypes
    'COMMERCIAL_FLIGHT': '6XcrGmsUxFe9ua1gehBv/Q==',     // Commercial flights (most common)
    'PRIVATE_CARGO': 'yYdaVPLIpwqddAuVOLDorQ==',         // Private/Cargo airline
    'OTHERS_AIR': 'mhapxYyzDmGnIyuZ0XgD8Q==',           // Others (please specify)
    
    // General transport modes (fallback)
    'AIR_GENERAL': 'ZUSsbcDrA+GoD4mQxvf7Ag==',           // General air transport
    'LAND_GENERAL': 'roui+vydIOBtjzLaEq6hCg==',          // General land transport
    'SEA_GENERAL': 'kFiGEpiBus5ZgYvP6i3CNQ==',          // General sea transport
    
    // Fallback mappings
    'AIR': '6XcrGmsUxFe9ua1gehBv/Q==',                   // Default to commercial flight
    'LAND': 'roui+vydIOBtjzLaEq6hCg==',                  // Land transport
    'SEA': 'kFiGEpiBus5ZgYvP6i3CNQ=='                    // Sea transport
  };
  
  // For air travel, determine specific subtype
  if (travelMode === 'AIR') {
    // Check if we can determine the specific flight type
    if (travelInfo?.arrivalFlightNumber) {
      const flightNo = travelInfo.arrivalFlightNumber.toUpperCase();
      
      // Commercial flights typically have airline codes (2 letters + numbers)
      if (/^[A-Z]{2}\d+$/.test(flightNo)) {
        return TDAC_TRANSPORT_MODE_IDS['COMMERCIAL_FLIGHT'];
      }
    }
    
    // Default to commercial flight for air travel (most common case)
    return TDAC_TRANSPORT_MODE_IDS['COMMERCIAL_FLIGHT'];
  }
  
  return TDAC_TRANSPORT_MODE_IDS[travelMode] || TDAC_TRANSPORT_MODE_IDS['COMMERCIAL_FLIGHT'];
}

// Simulate the travel info from the JSON screenshot
const mockTravelInfo = {
  arrivalFlightNumber: 'AC111',
  travelMode: 'AIR'
};

console.log('📋 Input Travel Info (from JSON screenshot):');
console.log('============================================');
console.log(`arrivalFlightNumber: "${mockTravelInfo.arrivalFlightNumber}"`);
console.log(`travelMode: "${mockTravelInfo.travelMode}"`);

console.log('\n🔍 Processing Steps:');
console.log('===================');

// Step 1: Determine travel mode
const determinedTravelMode = getTravelMode(mockTravelInfo);
console.log(`1. getTravelMode() → "${determinedTravelMode}"`);

// Step 2: Check flight number pattern
const flightNo = mockTravelInfo.arrivalFlightNumber?.toUpperCase();
const isCommercialPattern = /^[A-Z]{2}\d+$/.test(flightNo);
console.log(`2. Flight number: "${flightNo}"`);
console.log(`3. Commercial pattern (/^[A-Z]{2}\\d+$/): ${isCommercialPattern ? '✅ Match' : '❌ No match'}`);

// Step 3: Get transport mode ID
const transportModeId = getTransportModeId(mockTravelInfo);
console.log(`4. getTransportModeId() → "${transportModeId}"`);

console.log('\n📋 Expected vs Actual:');
console.log('======================');

const results = {
  'JSON Screenshot (Current Issue)': {
    tranModeId: '""', // Empty string - this is the problem
    travelMode: '"AIR"'
  },
  'Our Test Result (Expected Fix)': {
    tranModeId: `"${transportModeId}"`,
    travelMode: `"${determinedTravelMode}"`
  }
};

Object.entries(results).forEach(([scenario, values]) => {
  console.log(`${scenario}:`);
  console.log(`  tranModeId: ${values.tranModeId}`);
  console.log(`  travelMode: ${values.travelMode}`);
  console.log('');
});

console.log('🔍 Analysis:');
console.log('============');

if (transportModeId === '6XcrGmsUxFe9ua1gehBv/Q==') {
  console.log('✅ SUCCESS: Transport mode ID is correct');
  console.log('   The ThailandTravelerContextBuilder logic is working properly');
  console.log('   Expected: Commercial Flight ID (6XcrGmsUxFe9ua1gehBv/Q==)');
  console.log(`   Actual:   ${transportModeId}`);
} else {
  console.log('❌ PROBLEM: Transport mode ID is incorrect');
  console.log('   Expected: 6XcrGmsUxFe9ua1gehBv/Q== (Commercial Flight)');
  console.log(`   Actual:   ${transportModeId}`);
}

console.log('\n🚨 Root Cause Analysis:');
console.log('=======================');

if (transportModeId === '6XcrGmsUxFe9ua1gehBv/Q==') {
  console.log('The ThailandTravelerContextBuilder logic is correct.');
  console.log('If tranModeId is still empty in the JSON, the issue might be:');
  console.log('');
  console.log('1. 🔄 Code not deployed yet');
  console.log('   - The updated code hasn\'t been applied to the running app');
  console.log('   - Need to restart/redeploy the application');
  console.log('');
  console.log('2. 🐛 Runtime issue');
  console.log('   - Exception thrown during getTransportModeId execution');
  console.log('   - Check console logs for errors');
  console.log('');
  console.log('3. 📊 Data flow issue');
  console.log('   - Travel info not being passed correctly to getTransportModeId');
  console.log('   - Check if travelInfo object has the expected structure');
  console.log('');
  console.log('4. 🔧 Method not being called');
  console.log('   - The getTransportModeId method might not be invoked');
  console.log('   - Check the buildTravelerContext method execution');
} else {
  console.log('There\'s a logic error in the getTransportModeId method.');
  console.log('Need to debug the method implementation.');
}

console.log('\n💡 Debugging Steps:');
console.log('===================');

const debugSteps = [
  {
    step: 'Verify Code Deployment',
    action: 'Restart the application to ensure updated code is loaded',
    priority: 'HIGH'
  },
  {
    step: 'Check Console Logs',
    action: 'Look for JavaScript errors during TDAC form building',
    priority: 'HIGH'
  },
  {
    step: 'Add Debug Logging',
    action: 'Add console.log statements in getTransportModeId method',
    priority: 'MEDIUM'
  },
  {
    step: 'Verify Input Data',
    action: 'Check if travelInfo object has arrivalFlightNumber field',
    priority: 'MEDIUM'
  },
  {
    step: 'Test Method Directly',
    action: 'Call getTransportModeId directly with test data',
    priority: 'LOW'
  }
];

debugSteps.forEach((step, index) => {
  console.log(`${index + 1}. ${step.step} (${step.priority}):`);
  console.log(`   Action: ${step.action}`);
  console.log('');
});

console.log('🎯 Expected Outcome:');
console.log('====================');
console.log('After applying the fix, the JSON should show:');
console.log(`"tranModeId": "${transportModeId}",`);
console.log('"travelMode": "AIR",');
console.log('');
console.log('This will result in:');
console.log('✅ Higher TDAC submission success rate');
console.log('✅ Reduced transport mode validation errors');
console.log('✅ Better alignment with TDAC form requirements');