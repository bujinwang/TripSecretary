/**
 * Test script to verify departure flight information handling
 */

// Mock travel info based on your actual database data
const mockTravelInfo = {
  // Arrival information (来程 - 到达泰国)
  arrivalArrivalDate: '2025-10-21',
  arrivalFlightNumber: 'AC111',
  arrivalDepartureAirport: 'PEK',
  
  // Departure information (去程 - 离开泰国)
  departureDepartureDate: '2025-12-02', // From your database
  departureFlightNumber: 'AC223',       // From your UI screenshots
  
  // Other info
  travelPurpose: 'HOLIDAY',
  accommodationType: 'HOTEL',
  province: 'BANGKOK',
  hotelAddress: 'Add add Adidas Dad',
  visaNumber: '123412312'
};

// Simulate the transformation
function transformToTDACFormat(travelInfo) {
  const formatDateForTDAC = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  const transformTravelPurpose = (purpose) => {
    if (!purpose) return '';
    const purposeMap = { 'HOLIDAY': 'HOLIDAY', '度假旅游': 'HOLIDAY' };
    return purposeMap[purpose] || purpose;
  };

  const transformAccommodationType = (type) => {
    if (!type) return '';
    const typeMap = { 'HOTEL': 'HOTEL', '酒店': 'HOTEL' };
    return typeMap[type] || type;
  };

  const transformProvince = (province) => {
    if (!province) return '';
    if (province.includes('Bangkok') || province.includes('曼谷') || province === 'BANGKOK') {
      return 'BANGKOK';
    }
    return province;
  };

  const tdacData = {
    // Trip Information (from user's travel info)
    arrivalDate: formatDateForTDAC(travelInfo?.arrivalArrivalDate),
    departureDate: travelInfo?.departureDepartureDate ? formatDateForTDAC(travelInfo.departureDepartureDate) : null,
    countryBoarded: 'CHN', // From airport
    purpose: transformTravelPurpose(travelInfo?.travelPurpose),
    travelMode: 'AIR',
    flightNo: travelInfo?.arrivalFlightNumber || '',
    
    // Departure flight information (optional but include if provided)
    departureFlightNo: travelInfo?.departureFlightNumber || '',
    departureFlightNumber: travelInfo?.departureFlightNumber || '',
    departureTravelMode: 'AIR',
    
    // Accommodation
    accommodationType: transformAccommodationType(travelInfo?.accommodationType),
    province: transformProvince(travelInfo?.province),
    address: travelInfo?.hotelAddress || '',
    
    // Visa
    visaNo: travelInfo?.visaNumber || ''
  };

  return tdacData;
}

// Test the departure flight handling
console.log('=== 测试Departure Flight信息处理 ===\n');

console.log('1. 原始旅行信息:');
console.log('   来程 (到达泰国):');
console.log('     日期:', mockTravelInfo.arrivalArrivalDate);
console.log('     航班号:', mockTravelInfo.arrivalFlightNumber);
console.log('   去程 (离开泰国):');
console.log('     日期:', mockTravelInfo.departureDepartureDate);
console.log('     航班号:', mockTravelInfo.departureFlightNumber);

console.log('\n2. 转换为TDAC格式:');
const tdacData = transformToTDACFormat(mockTravelInfo);

console.log('   来程信息:');
console.log('     arrivalDate:', tdacData.arrivalDate);
console.log('     flightNo:', tdacData.flightNo);
console.log('   去程信息:');
console.log('     departureDate:', tdacData.departureDate);
console.log('     departureFlightNo:', tdacData.departureFlightNo);
console.log('     departureFlightNumber:', tdacData.departureFlightNumber);

console.log('\n3. 验证结果:');
const hasArrivalInfo = !!(tdacData.arrivalDate && tdacData.flightNo);
const hasDepartureInfo = !!(tdacData.departureDate && tdacData.departureFlightNo);

console.log('   来程信息:', hasArrivalInfo ? '✅ 完整' : '❌ 缺失');
console.log('   去程信息:', hasDepartureInfo ? '✅ 完整' : '⚠️ 缺失 (可选)');

console.log('\n4. TDAC提交数据:');
console.log('   将发送到TDAC的数据:');
console.log('     - 到达日期:', tdacData.arrivalDate);
console.log('     - 到达航班:', tdacData.flightNo);
if (hasDepartureInfo) {
  console.log('     - 离开日期:', tdacData.departureDate);
  console.log('     - 离开航班:', tdacData.departureFlightNo);
} else {
  console.log('     - 离开信息: (未提供)');
}

console.log('\n=== 总结 ===');
if (hasArrivalInfo) {
  console.log('✅ 来程信息完整，可以提交TDAC');
  if (hasDepartureInfo) {
    console.log('✅ 去程信息也会一起发送到TDAC');
  } else {
    console.log('⚠️ 去程信息缺失，但不影响TDAC提交');
  }
} else {
  console.log('❌ 来程信息缺失，无法提交TDAC');
}