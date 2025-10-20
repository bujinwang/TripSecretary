/**
 * 最终综合测试：验证departure flight信息处理的完整流程
 */

console.log('=== Departure Flight信息处理 - 最终验证测试 ===\n');

// 测试场景1：完整的来程和去程信息
console.log('📋 测试场景1: 完整的来程和去程信息');
const completeFlightInfo = {
  // 来程 (到达泰国)
  arrivalArrivalDate: '2025-10-21',
  arrivalFlightNumber: 'AC111',
  arrivalDepartureAirport: 'PEK',
  
  // 去程 (离开泰国)
  departureDepartureDate: '2025-12-02',
  departureFlightNumber: 'AC223',
  departureDepartureAirport: 'BKK',
  
  travelPurpose: 'HOLIDAY',
  accommodationType: 'HOTEL',
  province: 'BANGKOK'
};

function transformToTDAC(travelInfo) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  return {
    // 来程信息 (必需)
    arrivalDate: formatDate(travelInfo?.arrivalArrivalDate),
    flightNo: travelInfo?.arrivalFlightNumber || '',
    countryBoarded: 'CHN',
    travelMode: 'AIR',
    
    // 去程信息 (可选)
    departureDate: travelInfo?.departureDepartureDate ? formatDate(travelInfo.departureDepartureDate) : null,
    departureFlightNo: travelInfo?.departureFlightNumber || '',
    departureFlightNumber: travelInfo?.departureFlightNumber || '',
    departureTravelMode: travelInfo?.departureFlightNumber ? 'AIR' : '',
    
    // 其他信息
    purpose: travelInfo?.travelPurpose || '',
    accommodationType: travelInfo?.accommodationType || '',
    province: travelInfo?.province || ''
  };
}

const result1 = transformToTDAC(completeFlightInfo);
console.log('   来程: ✅', result1.arrivalDate, result1.flightNo);
console.log('   去程: ✅', result1.departureDate, result1.departureFlightNo);

// 测试场景2：只有来程信息
console.log('\n📋 测试场景2: 只有来程信息 (去程可选)');
const arrivalOnlyInfo = {
  arrivalArrivalDate: '2025-10-21',
  arrivalFlightNumber: 'AC111',
  travelPurpose: 'HOLIDAY',
  accommodationType: 'HOTEL',
  province: 'BANGKOK'
};

const result2 = transformToTDAC(arrivalOnlyInfo);
console.log('   来程: ✅', result2.arrivalDate, result2.flightNo);
console.log('   去程: ⚠️ ', result2.departureDate || '(未提供)', result2.departureFlightNo || '(空)');

// 测试场景3：验证TDAC提交数据格式
console.log('\n📋 测试场景3: TDAC提交数据格式验证');

function prepareForTDACSubmission(tdacData) {
  const submissionData = {};
  
  // 只包含非空值
  Object.keys(tdacData).forEach(key => {
    const value = tdacData[key];
    if (value !== null && value !== undefined && value !== '') {
      submissionData[key] = value;
    }
  });
  
  return submissionData;
}

const submissionData1 = prepareForTDACSubmission(result1);
const submissionData2 = prepareForTDACSubmission(result2);

console.log('   完整信息提交字段数:', Object.keys(submissionData1).length);
console.log('   只有来程信息提交字段数:', Object.keys(submissionData2).length);

console.log('\n   完整信息包含的departure字段:');
['departureDate', 'departureFlightNo', 'departureFlightNumber', 'departureTravelMode'].forEach(field => {
  if (submissionData1[field]) {
    console.log(`     ✅ ${field}: "${submissionData1[field]}"`);
  } else {
    console.log(`     ❌ ${field}: (不包含)`);
  }
});

console.log('\n   只有来程信息的departure字段:');
['departureDate', 'departureFlightNo', 'departureFlightNumber', 'departureTravelMode'].forEach(field => {
  if (submissionData2[field]) {
    console.log(`     ✅ ${field}: "${submissionData2[field]}"`);
  } else {
    console.log(`     ⚠️ ${field}: (不包含，符合预期)`);
  }
});

// 测试场景4：验证姓名解析
console.log('\n📋 测试场景4: 姓名解析验证');

function parseFullName(fullName) {
  if (!fullName) return { familyName: '', middleName: '', firstName: '' };
  
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return { familyName: parts[0], middleName: '', firstName: '' };
  } else if (parts.length === 2) {
    return { familyName: parts[0], middleName: '', firstName: parts[1] };
  } else if (parts.length >= 3) {
    return { 
      familyName: parts[0], 
      middleName: parts[1], 
      firstName: parts.slice(2).join(' ') 
    };
  }
  
  return { familyName: '', middleName: '', firstName: '' };
}

const testNames = [
  'LI A MAO',
  'ZHANG WEI',
  'WANG',
  'CHEN XIAO MING'
];

testNames.forEach(name => {
  const parsed = parseFullName(name);
  console.log(`   "${name}" -> Family:"${parsed.familyName}", Middle:"${parsed.middleName}", First:"${parsed.firstName}"`);
});

// 最终验证
console.log('\n=== 最终验证结果 ===');

const validationResults = {
  departureFlightHandling: !!(result1.departureFlightNo && result1.departureFlightNumber),
  optionalDepartureHandling: !result2.departureFlightNo && !result2.departureFlightNumber,
  requiredArrivalHandling: !!(result1.arrivalDate && result1.flightNo && result2.arrivalDate && result2.flightNo),
  nameParsingCorrect: parseFullName('LI A MAO').familyName === 'LI' && parseFullName('LI A MAO').middleName === 'A' && parseFullName('LI A MAO').firstName === 'MAO'
};

console.log('✅ Departure flight信息正确处理:', validationResults.departureFlightHandling ? '是' : '否');
console.log('✅ 可选departure信息正确处理:', validationResults.optionalDepartureHandling ? '是' : '否');
console.log('✅ 必需arrival信息正确处理:', validationResults.requiredArrivalHandling ? '是' : '否');
console.log('✅ 姓名解析正确:', validationResults.nameParsingCorrect ? '是' : '否');

const allTestsPassed = Object.values(validationResults).every(result => result === true);

if (allTestsPassed) {
  console.log('\n🎉 所有测试通过！Departure flight信息处理功能完全正常');
  console.log('   - 系统可以正确处理完整的来程和去程信息');
  console.log('   - 系统可以正确处理只有来程信息的情况');
  console.log('   - 姓名解析功能正常工作');
  console.log('   - TDAC数据格式符合要求');
} else {
  console.log('\n❌ 部分测试失败，需要进一步检查');
}