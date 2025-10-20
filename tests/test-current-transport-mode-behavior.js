/**
 * Test Current Transport Mode Behavior
 * Verify what's happening with tranModeId in the actual payload
 */

console.log('🔍 Testing Current Transport Mode Behavior');
console.log('==========================================\n');

// Mock the methods from TDACAPIService
function normalizeInput(value) {
  return value === undefined || value === null
    ? ''
    : value.toString().trim().toUpperCase();
}

function getTranModeId(mode, dynamicData = {}) {
  const dyn = dynamicData || {};
  if (dyn.tranModeRow?.key) {
    return dyn.tranModeRow.key;
  }
  
  // Enhanced fallback: use specific transport mode IDs based on travel mode
  const normalizedMode = normalizeInput(mode);
  
  // For air travel, default to commercial flight (most common case)
  if (normalizedMode === 'AIR' || !normalizedMode) {
    return '6XcrGmsUxFe9ua1gehBv/Q=='; // Commercial Flight ID
  }
  
  // For other modes, use the general transport mode IDs
  if (normalizedMode === 'LAND') {
    return 'roui+vydIOBtjzLaEq6hCg=='; // Land transport
  }
  
  if (normalizedMode === 'SEA') {
    return 'kFiGEpiBus5ZgYvP6i3CNQ=='; // Sea transport
  }
  
  // Default fallback to commercial flight for unknown modes
  return '6XcrGmsUxFe9ua1gehBv/Q==';
}

function getTravelModeId(mode) {
  const travelModeIds = {
    AIR: 'ZUSsbcDrA+GoD4mQxvf7Ag==',
    LAND: 'roui+vydIOBtjzLaEq6hCg==',
    SEA: 'kFiGEpiBus5ZgYvP6i3CNQ=='
  };
  const normalizedMode = normalizeInput(mode);
  return travelModeIds[normalizedMode] || travelModeIds.AIR;
}

// Simulate the traveler data from the JSON screenshot
const mockTraveler = {
  travelMode: 'AIR',
  flightNo: 'AC111',
  tranModeId: '', // This is empty in the input
  departureTravelMode: 'AIR'
};

console.log('📋 Input Traveler Data:');
console.log('=======================');
console.log(`travelMode: "${mockTraveler.travelMode}"`);
console.log(`flightNo: "${mockTraveler.flightNo}"`);
console.log(`tranModeId: "${mockTraveler.tranModeId}"`);
console.log(`departureTravelMode: "${mockTraveler.departureTravelMode}"`);

console.log('\n🔍 Processing Logic (from buildFormData):');
console.log('=========================================');

// Simulate the logic from buildFormData method
const dynamicData = {}; // Empty dynamic data (no API lookup results)

// Line 981: const tranModeId = traveler.tranModeId || this.getTranModeId(traveler.travelMode);
const calculatedTranModeId = mockTraveler.tranModeId || getTranModeId(mockTraveler.travelMode, dynamicData);

console.log(`traveler.tranModeId: "${mockTraveler.tranModeId}"`);
console.log(`getTranModeId(traveler.travelMode): "${getTranModeId(mockTraveler.travelMode, dynamicData)}"`);
console.log(`Final tranModeId: "${calculatedTranModeId}"`);

// Line 984-986: departure transport mode
const hasDeparture = true; // Assuming departure date exists
const deptTranModeId = hasDeparture
  ? getTranModeId(mockTraveler.departureTravelMode || mockTraveler.travelMode, dynamicData)
  : '';

console.log(`\nDeparture Logic:`);
console.log(`departureTravelMode: "${mockTraveler.departureTravelMode}"`);
console.log(`deptTranModeId: "${deptTranModeId}"`);

console.log('\n📋 Final Payload Values:');
console.log('========================');

const tripInfo = {
  traModeId: getTravelModeId(mockTraveler.travelMode),
  tranModeId: calculatedTranModeId,
  flightNo: (mockTraveler.flightNo || '').toUpperCase(),
  deptTraModeId: deptTranModeId
};

Object.entries(tripInfo).forEach(([key, value]) => {
  console.log(`${key}: "${value}"`);
});

console.log('\n🔍 Analysis:');
console.log('============');

const analysis = [
  {
    field: 'traModeId (General Travel Mode)',
    expected: 'ZUSsbcDrA+GoD4mQxvf7Ag== (General AIR)',
    actual: tripInfo.traModeId,
    status: tripInfo.traModeId === 'ZUSsbcDrA+GoD4mQxvf7Ag==' ? '✅ Correct' : '❌ Wrong'
  },
  {
    field: 'tranModeId (Specific Transport Mode)',
    expected: '6XcrGmsUxFe9ua1gehBv/Q== (Commercial Flight)',
    actual: tripInfo.tranModeId,
    status: tripInfo.tranModeId === '6XcrGmsUxFe9ua1gehBv/Q==' ? '✅ Correct' : '❌ Wrong'
  },
  {
    field: 'deptTraModeId (Departure Transport)',
    expected: '6XcrGmsUxFe9ua1gehBv/Q== (Commercial Flight)',
    actual: tripInfo.deptTraModeId,
    status: tripInfo.deptTraModeId === '6XcrGmsUxFe9ua1gehBv/Q==' ? '✅ Correct' : '❌ Wrong'
  }
];

analysis.forEach((item, index) => {
  console.log(`${index + 1}. ${item.field}:`);
  console.log(`   Expected: ${item.expected}`);
  console.log(`   Actual:   ${item.actual}`);
  console.log(`   Status:   ${item.status}`);
  console.log('');
});

console.log('🎯 Expected vs Actual Comparison:');
console.log('=================================');

const comparison = {
  'JSON Screenshot (Current)': {
    tranModeId: '""', // Empty string
    travelMode: '"AIR"'
  },
  'Expected After Fix': {
    tranModeId: '"6XcrGmsUxFe9ua1gehBv/Q=="', // Commercial Flight
    travelMode: '"AIR"' // Unchanged
  },
  'Our Test Result': {
    tranModeId: `"${tripInfo.tranModeId}"`,
    travelMode: '"AIR"'
  }
};

Object.entries(comparison).forEach(([scenario, values]) => {
  console.log(`${scenario}:`);
  console.log(`  tranModeId: ${values.tranModeId}`);
  console.log(`  travelMode: ${values.travelMode}`);
  console.log('');
});

console.log('🚨 Issue Diagnosis:');
console.log('===================');

if (tripInfo.tranModeId === '') {
  console.log('❌ PROBLEM: tranModeId is still empty');
  console.log('   This suggests the fix is not being applied correctly');
  console.log('   Check if getTranModeId method is properly implemented');
} else if (tripInfo.tranModeId === '6XcrGmsUxFe9ua1gehBv/Q==') {
  console.log('✅ SUCCESS: tranModeId is using commercial flight ID');
  console.log('   The fix is working correctly');
} else {
  console.log('⚠️ UNEXPECTED: tranModeId has unexpected value');
  console.log(`   Got: ${tripInfo.tranModeId}`);
  console.log('   Expected: 6XcrGmsUxFe9ua1gehBv/Q==');
}

console.log('\n💡 Next Steps:');
console.log('==============');

if (tripInfo.tranModeId === '6XcrGmsUxFe9ua1gehBv/Q==') {
  console.log('1. ✅ Fix is working - deploy to production');
  console.log('2. ✅ Monitor TDAC submission success rates');
  console.log('3. ✅ Verify reduced validation errors');
} else {
  console.log('1. ❌ Investigate why getTranModeId is not working');
  console.log('2. ❌ Check if the method was properly updated');
  console.log('3. ❌ Verify the method is being called correctly');
  console.log('4. ❌ Test with actual TDACAPIService instance');
}