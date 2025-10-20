/**
 * Test tranModeId Flow
 * Verify the complete flow from ThailandTravelerContextBuilder to TDACHybridScreen
 */

console.log('🔍 Testing tranModeId Flow');
console.log('===========================\n');

// Step 1: Simulate ThailandTravelerContextBuilder.buildTravelerContext
function buildTravelerContext() {
  const travelInfo = {
    arrivalFlightNumber: 'AC111',
    travelMode: 'AIR'
  };
  
  // Simulate getTransportModeId
  const tranModeId = '6XcrGmsUxFe9ua1gehBv/Q==';
  console.log('🚁 getTransportModeId returned:', tranModeId);
  
  // Simulate the travelerPayload creation
  const travelerPayload = {
    familyName: 'LI',
    firstName: 'MAO',
    passportNo: 'E12341433',
    flightNo: 'AC111',
    travelMode: 'AIR',
    tranModeId: tranModeId, // This should be included
    // ... other fields
  };
  
  console.log('✅ Built traveler context with tranModeId:', travelerPayload.tranModeId);
  
  return {
    success: true,
    payload: travelerPayload
  };
}

// Step 2: Simulate navigation to TDACHybridScreen
function navigateToTDACHybridScreen(travelerContext) {
  const travelerInfo = travelerContext.payload;
  
  console.log('\n📱 Navigating to TDACHybridScreen...');
  console.log('🔍 TDACHybridScreen received travelerInfo:');
  console.log('   tranModeId:', travelerInfo.tranModeId);
  console.log('   flightNo:', travelerInfo.flightNo);
  console.log('   travelMode:', travelerInfo.travelMode);
  
  return travelerInfo;
}

// Step 3: Simulate showDetailedLog function
function showDetailedLog(travelerData) {
  console.log('\n📋 Creating JSON payload for preview...');
  
  const jsonPayload = {
    flightNo: travelerData.flightNo || "",
    travelMode: travelerData.travelMode || "",
    tranModeId: travelerData.tranModeId || "", // This line from TDACHybridScreen.js:943
    // ... other fields
  };
  
  console.log('📋 JSON payload created:');
  console.log('   flightNo:', jsonPayload.flightNo);
  console.log('   travelMode:', jsonPayload.travelMode);
  console.log('   tranModeId:', jsonPayload.tranModeId);
  
  if (jsonPayload.tranModeId === "") {
    console.log('❌ PROBLEM: tranModeId is empty in JSON payload!');
    console.log('   This means travelerData.tranModeId was falsy');
  } else {
    console.log('✅ SUCCESS: tranModeId is populated in JSON payload');
  }
  
  return jsonPayload;
}

// Run the test
console.log('🧪 Running complete flow test...');
console.log('=================================\n');

const travelerContext = buildTravelerContext();
const travelerInfo = navigateToTDACHybridScreen(travelerContext);
const jsonPayload = showDetailedLog(travelerInfo);

console.log('\n📊 Final Analysis:');
console.log('==================');

const analysis = [
  {
    step: 'ThailandTravelerContextBuilder',
    tranModeId: travelerContext.payload.tranModeId,
    status: travelerContext.payload.tranModeId ? '✅ Present' : '❌ Missing'
  },
  {
    step: 'TDACHybridScreen (travelerInfo)',
    tranModeId: travelerInfo.tranModeId,
    status: travelerInfo.tranModeId ? '✅ Present' : '❌ Missing'
  },
  {
    step: 'showDetailedLog (JSON payload)',
    tranModeId: jsonPayload.tranModeId,
    status: jsonPayload.tranModeId ? '✅ Present' : '❌ Missing'
  }
];

analysis.forEach((item, index) => {
  console.log(`${index + 1}. ${item.step}:`);
  console.log(`   tranModeId: "${item.tranModeId}"`);
  console.log(`   Status: ${item.status}`);
  console.log('');
});

console.log('🎯 Expected Behavior:');
console.log('=====================');
console.log('All three steps should show tranModeId as "6XcrGmsUxFe9ua1gehBv/Q=="');
console.log('If any step shows empty string, that\'s where the data is being lost.');

console.log('\n🔍 Next Steps:');
console.log('==============');
console.log('1. Run your app and check the new debug logs');
console.log('2. Look for these messages in the console:');
console.log('   🔍 TDACHybridScreen received travelerInfo: { ..., tranModeId: "..." }');
console.log('   🔍 Using pure user data: { ..., tranModeId: "..." }');
console.log('3. If tranModeId is missing in the logs, the issue is in data passing');
console.log('4. If tranModeId is present in logs but empty in JSON, the issue is in showDetailedLog');