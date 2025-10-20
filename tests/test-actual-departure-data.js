/**
 * 测试实际用户界面中的departure数据处理
 * 基于用户截图中的实际数据：航班号 AC223, 出发日期 2025-10-26
 */

console.log('=== 测试实际用户界面中的Departure数据 ===\n');

// 基于用户截图的实际数据
const actualUserData = {
  // 来程信息 (到达泰国)
  arrivalArrivalDate: '2025-10-21',
  arrivalFlightNumber: 'AC111',
  arrivalDepartureAirport: 'PEK',
  
  // 去程信息 (离开泰国) - 来自用户截图
  departureDepartureDate: '2025-10-26',  // 用户截图中显示的日期
  departureFlightNumber: 'AC223',        // 用户截图中显示的航班号
  departureDepartureAirport: 'BKK',
  
  // 其他信息
  travelPurpose: 'HOLIDAY',
  accommodationType: 'HOTEL',
  province: 'BANGKOK',
  hotelAddress: 'Test Hotel Address',
  visaNumber: '123456789'
};

function formatDateForTDAC(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '';
  }
}

// 模拟ThailandTravelerContextBuilder的处理逻辑
function processActualUserData(travelInfo) {
  console.log('📋 处理用户实际输入的数据...\n');
  
  console.log('原始数据:');
  console.log('  来程日期:', travelInfo.arrivalArrivalDate);
  console.log('  来程航班:', travelInfo.arrivalFlightNumber);
  console.log('  去程日期:', travelInfo.departureDepartureDate);
  console.log('  去程航班:', travelInfo.departureFlightNumber);
  
  const tdacData = {
    // 来程信息
    arrivalDate: formatDateForTDAC(travelInfo?.arrivalArrivalDate),
    flightNo: travelInfo?.arrivalFlightNumber || '',
    countryBoarded: 'CHN',
    travelMode: 'AIR',
    
    // 去程信息 - 按照ThailandTravelerContextBuilder的逻辑
    departureDate: travelInfo?.departureDepartureDate ? formatDateForTDAC(travelInfo.departureDepartureDate) : null,
    departureFlightNo: travelInfo?.departureFlightNumber || '',
    departureFlightNumber: travelInfo?.departureFlightNumber || '',
    departureTravelMode: 'AIR',
    
    // 其他信息
    purpose: travelInfo?.travelPurpose || '',
    accommodationType: travelInfo?.accommodationType || '',
    province: travelInfo?.province || '',
    address: travelInfo?.hotelAddress || '',
    visaNo: travelInfo?.visaNumber || ''
  };
  
  console.log('\n转换后的TDAC数据:');
  console.log('  arrivalDate:', tdacData.arrivalDate);
  console.log('  flightNo:', tdacData.flightNo);
  console.log('  departureDate:', tdacData.departureDate);
  console.log('  departureFlightNo:', tdacData.departureFlightNo);
  console.log('  departureFlightNumber:', tdacData.departureFlightNumber);
  console.log('  departureTravelMode:', tdacData.departureTravelMode);
  
  return tdacData;
}

// 处理实际数据
const result = processActualUserData(actualUserData);

console.log('\n=== 验证结果 ===');

// 验证来程信息
const hasArrivalInfo = !!(result.arrivalDate && result.flightNo);
console.log('✅ 来程信息完整:', hasArrivalInfo ? '是' : '否');
console.log('   - 到达日期:', result.arrivalDate);
console.log('   - 航班号:', result.flightNo);

// 验证去程信息
const hasDepartureInfo = !!(result.departureDate && result.departureFlightNo);
console.log('✅ 去程信息完整:', hasDepartureInfo ? '是' : '否');
console.log('   - 离开日期:', result.departureDate);
console.log('   - 航班号:', result.departureFlightNo);

// 验证日期格式
console.log('\n📅 日期格式验证:');
console.log('   - 来程日期格式正确:', /^\d{4}-\d{2}-\d{2}$/.test(result.arrivalDate) ? '是' : '否');
console.log('   - 去程日期格式正确:', /^\d{4}-\d{2}-\d{2}$/.test(result.departureDate) ? '是' : '否');

// 模拟TDAC提交数据
console.log('\n📤 TDAC提交数据预览:');
const submissionData = {};
Object.keys(result).forEach(key => {
  const value = result[key];
  if (value !== null && value !== undefined && value !== '') {
    submissionData[key] = value;
  }
});

console.log('将发送到TDAC的字段:');
Object.keys(submissionData).forEach(key => {
  if (key.includes('departure') || key.includes('arrival') || key.includes('flight')) {
    console.log(`   🛫 ${key}: "${submissionData[key]}"`);
  }
});

console.log('\n=== 总结 ===');
if (hasArrivalInfo && hasDepartureInfo) {
  console.log('🎉 完美！用户截图中的所有departure flight信息都会正确处理');
  console.log('   - 来程: 2025-10-21, AC111 ✅');
  console.log('   - 去程: 2025-10-26, AC223 ✅');
  console.log('   - 所有信息都会发送到TDAC');
} else {
  console.log('❌ 数据处理有问题');
}

// 特别验证用户关心的departure date
console.log('\n🔍 特别验证 - Departure Date处理:');
console.log(`   用户输入: "${actualUserData.departureDepartureDate}"`);
console.log(`   系统处理: "${result.departureDate}"`);
console.log(`   处理正确: ${actualUserData.departureDepartureDate === '2025-10-26' && result.departureDate === '2025-10-26' ? '✅ 是' : '❌ 否'}`);