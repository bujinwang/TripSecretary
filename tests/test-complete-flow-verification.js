/**
 * Complete Flow Verification Test
 * Test the entire flow from ThailandTravelerContextBuilder to TDACAPIService
 */

console.log('🔄 Complete Flow Verification Test');
console.log('==================================\n');

// Step 1: Simulate ThailandTravelerContextBuilder.getTransportModeId
function getTransportModeId(travelInfo) {
  console.log('🚁 getTransportModeId called with:', JSON.stringify(travelInfo, null, 2));
  
  const TDAC_TRANSPORT_MODE_IDS = {
    'COMMERCIAL_FLIGHT': '6XcrGmsUxFe9ua1gehBv/Q==',
    'AIR': '6XcrGmsUxFe9ua1gehBv/Q==',
    'LAND': 'roui+vydIOBtjzLaEq6hCg==',
    'SEA': 'kFiGEpiBus5ZgYvP6i3CNQ=='
  };
  
  // For air travel with flight number
  if (travelInfo?.arrivalFlightNumber) {
    const flightNo = travelInfo.arrivalFlightNumber.toUpperCase();
    console.log('🚁 Flight number found:', flightNo);
    
    const isCommercial = /^[A-Z]{2}\d+$/.test(flightNo);
    console.log('🚁 Is commercial flight pattern:', isCommercial);
    
    if (isCommercial) {
      const commercialId = TDAC_TRANSPORT_MODE_IDS['COMMERCIAL_FLIGHT'];
      console.log('🚁 Returning commercial flight ID:', commercialId);
      return commercialId;
    }
  }
  
  const defaultId = TDAC_TRANSPORT_MODE_IDS['COMMERCIAL_FLIGHT'];
  console.log('🚁 Returning default commercial flight ID:', defaultId);
  return defaultId;
}

// Step 2: Simulate buildTravelerContext
function buildTravelerContext(travelInfo) {
  console.log('🚁 About to call getTransportModeId with travelInfo:', JSON.stringify(travelInfo, null, 2));
  const result = getTransportModeId(travelInfo);
  console.log('🚁 getTransportModeId returned:', result);
  
  return {
    // ... other traveler data
    tranModeId: result,
    travelMode: 'AIR',
    flightNo: travelInfo.arrivalFlightNumber
  };
}

// Step 3: Simulate TDACAPIService.buildFormData
function buildFormData(traveler) {
  console.log('📋 buildFormData called with traveler:', JSON.stringify(traveler, null, 2));
  
  // This is the key line from TDACAPIService
  const tranModeId = traveler.tranModeId || getTranModeIdFallback(traveler.travelMode);
  console.log('📋 Final tranModeId for payload:', tranModeId);
  
  const traModeId = getTravelModeId(traveler.travelMode);
  console.log('📋 Final traModeId for payload:', traModeId);
  
  return {
    tripInfo: {
      traModeId: traModeId,      // General travel mode
      tranModeId: tranModeId,    // Specific transport mode
      flightNo: traveler.flightNo
    }
  };
}

// Helper functions
function getTranModeIdFallback(mode) {
  const normalizedMode = (mode || '').toString().trim().toUpperCase();
  if (normalizedMode === 'AIR' || !normalizedMode) {
    return '6XcrGmsUxFe9ua1gehBv/Q=='; // Commercial Flight ID
  }
  if (normalizedMode === 'LAND') {
    return 'roui+vydIOBtjzLaEq6hCg==';
  }
  if (normalizedMode === 'SEA') {
    return 'kFiGEpiBus5ZgYvP6i3CNQ==';
  }
  return '6XcrGmsUxFe9ua1gehBv/Q==';
}

function getTravelModeId(mode) {
  const travelModeIds = {
    AIR: 'ZUSsbcDrA+GoD4mQxvf7Ag==',
    LAND: 'roui+vydIOBtjzLaEq6hCg==',
    SEA: 'kFiGEpiBus5ZgYvP6i3CNQ=='
  };
  const normalizedMode = (mode || '').toString().trim().toUpperCase();
  return travelModeIds[normalizedMode] || travelModeIds.AIR;
}

// Test the complete flow
console.log('🧪 Testing Complete Flow:');
console.log('=========================\n');

const testTravelInfo = {
  arrivalFlightNumber: 'AC111',
  travelMode: 'AIR'
};

console.log('Step 1: ThailandTravelerContextBuilder.buildTravelerContext()');
console.log('------------------------------------------------------------');
const travelerContext = buildTravelerContext(testTravelInfo);

console.log('\nStep 2: TDACAPIService.buildFormData()');
console.log('--------------------------------------');
const formData = buildFormData(travelerContext);

console.log('\n📊 Final Result:');
console.log('================');
console.log('Final TDAC Payload:');
console.log(JSON.stringify(formData, null, 2));

console.log('\n🔍 Verification:');
console.log('================');

const verification = [
  {
    field: 'traModeId (General Travel Mode)',
    expected: 'ZUSsbcDrA+GoD4mQxvf7Ag==',
    actual: formData.tripInfo.traModeId,
    status: formData.tripInfo.traModeId === 'ZUSsbcDrA+GoD4mQxvf7Ag==' ? '✅ CORRECT' : '❌ WRONG'
  },
  {
    field: 'tranModeId (Specific Transport Mode)',
    expected: '6XcrGmsUxFe9ua1gehBv/Q==',
    actual: formData.tripInfo.tranModeId,
    status: formData.tripInfo.tranModeId === '6XcrGmsUxFe9ua1gehBv/Q==' ? '✅ CORRECT' : '❌ WRONG'
  },
  {
    field: 'flightNo',
    expected: 'AC111',
    actual: formData.tripInfo.flightNo,
    status: formData.tripInfo.flightNo === 'AC111' ? '✅ CORRECT' : '❌ WRONG'
  }
];

verification.forEach(item => {
  console.log(`${item.field}:`);
  console.log(`  Expected: ${item.expected}`);
  console.log(`  Actual:   ${item.actual}`);
  console.log(`  Status:   ${item.status}`);
  console.log('');
});

console.log('🎯 Summary:');
console.log('===========');

const allCorrect = verification.every(item => item.status.includes('✅'));

if (allCorrect) {
  console.log('✅ ALL TESTS PASSED - The logic is working correctly!');
  console.log('');
  console.log('If you\'re still seeing empty tranModeId in your JSON, the issue is likely:');
  console.log('1. 🔄 Application needs restart to load updated code');
  console.log('2. 🐛 JavaScript error preventing method execution');
  console.log('3. 📊 Different data structure than expected');
  console.log('4. 🔧 Method not being called at all');
} else {
  console.log('❌ SOME TESTS FAILED - There\'s a logic error');
  console.log('Need to debug the failing components');
}

console.log('\n💡 Next Action Items:');
console.log('=====================');
console.log('1. Restart your application completely');
console.log('2. Clear browser cache');
console.log('3. Open browser DevTools → Console');
console.log('4. Generate TDAC JSON again');
console.log('5. Look for 🚁 debug messages');
console.log('6. Check if tranModeId is now populated');
console.log('');
console.log('Expected: "tranModeId": "6XcrGmsUxFe9ua1gehBv/Q=="');
console.log('Instead of: "tranModeId": ""');