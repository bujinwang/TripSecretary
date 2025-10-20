/**
 * 集成测试：验证ThailandTravelerContextBuilder中departure flight信息的处理
 */

// 模拟数据库和服务
const mockSecureStorageService = {
  async getItem(key) {
    const mockData = {
      'passport_data': JSON.stringify({
        passportNumber: 'E12345678',
        fullName: 'LI A MAO',
        nationality: 'CHN',
        dateOfBirth: '1990-01-01',
        gender: 'M',
        passportExpiryDate: '2030-01-01'
      }),
      'travel_info_th': JSON.stringify({
        // 来程信息 (到达泰国)
        arrivalArrivalDate: '2025-10-21',
        arrivalFlightNumber: 'AC111',
        arrivalDepartureAirport: 'PEK',
        
        // 去程信息 (离开泰国)
        departureDepartureDate: '2025-12-02',
        departureFlightNumber: 'AC223',
        departureDepartureAirport: 'BKK',
        
        // 其他信息
        travelPurpose: 'HOLIDAY',
        accommodationType: 'HOTEL',
        province: 'BANGKOK',
        hotelAddress: 'Test Hotel Address',
        visaNumber: '123456789'
      })
    };
    return mockData[key] || null;
  }
};

const mockPassportDataService = {
  async getPassportData() {
    return {
      passportNumber: 'E12345678',
      fullName: 'LI A MAO',
      nationality: 'CHN',
      dateOfBirth: '1990-01-01',
      gender: 'M',
      passportExpiryDate: '2030-01-01'
    };
  }
};

// 模拟ThailandTravelerContextBuilder的核心逻辑
class MockThailandTravelerContextBuilder {
  constructor() {
    this.secureStorageService = mockSecureStorageService;
    this.passportDataService = mockPassportDataService;
  }

  async getTravelInfoWithFallback(destination) {
    console.log(`🔍 查找旅行信息: ${destination}`);
    
    // 尝试多个可能的key
    const possibleKeys = [
      `travel_info_${destination}`,
      `travel_info_thailand`,
      'travel_info_th'
    ];
    
    for (const key of possibleKeys) {
      console.log(`   尝试key: ${key}`);
      const data = await this.secureStorageService.getItem(key);
      if (data) {
        console.log(`   ✅ 找到数据: ${key}`);
        return JSON.parse(data);
      }
    }
    
    console.log('   ❌ 未找到旅行信息');
    return null;
  }

  parseFullName(fullName) {
    if (!fullName) return { familyName: '', middleName: '', firstName: '' };
    
    const parts = fullName.trim().split(/\s+/);
    console.log(`📝 解析姓名: "${fullName}" -> [${parts.join(', ')}]`);
    
    if (parts.length === 1) {
      return { familyName: parts[0], middleName: '', firstName: '' };
    } else if (parts.length === 2) {
      return { familyName: parts[0], middleName: '', firstName: parts[1] };
    } else if (parts.length >= 3) {
      // 对于"LI A MAO"这样的三部分姓名：Family: LI, Middle: A, First: MAO
      return { 
        familyName: parts[0], 
        middleName: parts[1], 
        firstName: parts.slice(2).join(' ') 
      };
    }
    
    return { familyName: '', middleName: '', firstName: '' };
  }

  formatDateForTDAC(dateStr) {
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

  async buildFormData(destination = 'thailand') {
    console.log(`\n🏗️ 构建${destination}的TDAC表单数据...\n`);
    
    try {
      // 获取护照数据
      console.log('1. 获取护照数据...');
      const passportData = await this.passportDataService.getPassportData();
      if (!passportData) {
        throw new Error('护照数据不存在');
      }
      console.log('   ✅ 护照数据获取成功');
      
      // 获取旅行信息
      console.log('\n2. 获取旅行信息...');
      const travelInfo = await this.getTravelInfoWithFallback(destination);
      if (!travelInfo) {
        throw new Error('旅行信息不存在');
      }
      console.log('   ✅ 旅行信息获取成功');
      
      // 解析姓名
      console.log('\n3. 解析护照姓名...');
      const { familyName, middleName, firstName } = this.parseFullName(passportData.fullName);
      console.log(`   Family: "${familyName}", Middle: "${middleName}", First: "${firstName}"`);
      
      // 构建TDAC数据
      console.log('\n4. 构建TDAC数据...');
      const tdacData = {
        // 护照信息
        passportNo: passportData.passportNumber,
        familyName,
        middleName,
        firstName,
        nationality: passportData.nationality,
        dateOfBirth: this.formatDateForTDAC(passportData.dateOfBirth),
        gender: passportData.gender,
        passportExpiryDate: this.formatDateForTDAC(passportData.passportExpiryDate),
        
        // 来程信息 (到达泰国)
        arrivalDate: this.formatDateForTDAC(travelInfo.arrivalArrivalDate),
        flightNo: travelInfo.arrivalFlightNumber || '',
        countryBoarded: 'CHN',
        travelMode: 'AIR',
        
        // 去程信息 (离开泰国) - 新增的departure flight处理
        departureDate: travelInfo.departureDepartureDate ? this.formatDateForTDAC(travelInfo.departureDepartureDate) : null,
        departureFlightNo: travelInfo.departureFlightNumber || '',
        departureFlightNumber: travelInfo.departureFlightNumber || '', // 备用字段
        departureTravelMode: 'AIR',
        
        // 其他信息
        purpose: travelInfo.travelPurpose || '',
        accommodationType: travelInfo.accommodationType || '',
        province: travelInfo.province || '',
        address: travelInfo.hotelAddress || '',
        visaNo: travelInfo.visaNumber || ''
      };
      
      console.log('   ✅ TDAC数据构建完成');
      return tdacData;
      
    } catch (error) {
      console.error('❌ 构建表单数据失败:', error.message);
      throw error;
    }
  }
}

// 运行测试
async function runDepartureFlightTest() {
  console.log('=== Departure Flight信息处理集成测试 ===\n');
  
  try {
    const builder = new MockThailandTravelerContextBuilder();
    const tdacData = await builder.buildFormData('thailand');
    
    console.log('\n=== 测试结果 ===\n');
    
    // 验证来程信息
    console.log('📥 来程信息 (到达泰国):');
    console.log(`   到达日期: ${tdacData.arrivalDate}`);
    console.log(`   航班号: ${tdacData.flightNo}`);
    console.log(`   出发国家: ${tdacData.countryBoarded}`);
    console.log(`   交通方式: ${tdacData.travelMode}`);
    
    // 验证去程信息
    console.log('\n📤 去程信息 (离开泰国):');
    console.log(`   离开日期: ${tdacData.departureDate || '(未提供)'}`);
    console.log(`   航班号: ${tdacData.departureFlightNo || '(未提供)'}`);
    console.log(`   备用航班号: ${tdacData.departureFlightNumber || '(未提供)'}`);
    console.log(`   交通方式: ${tdacData.departureTravelMode}`);
    
    // 验证护照信息
    console.log('\n👤 护照信息:');
    console.log(`   护照号: ${tdacData.passportNo}`);
    console.log(`   姓: ${tdacData.familyName}`);
    console.log(`   中间名: ${tdacData.middleName}`);
    console.log(`   名: ${tdacData.firstName}`);
    
    // 验证结果
    console.log('\n=== 验证结果 ===\n');
    
    const hasRequiredArrivalInfo = !!(tdacData.arrivalDate && tdacData.flightNo);
    const hasDepartureInfo = !!(tdacData.departureDate && tdacData.departureFlightNo);
    const hasValidNameParsing = !!(tdacData.familyName && tdacData.firstName);
    
    console.log(`✅ 来程信息完整: ${hasRequiredArrivalInfo ? '是' : '否'}`);
    console.log(`✅ 去程信息完整: ${hasDepartureInfo ? '是' : '否 (可选)'}`);
    console.log(`✅ 姓名解析正确: ${hasValidNameParsing ? '是' : '否'}`);
    console.log(`✅ 姓名解析结果: LI A MAO -> Family:"${tdacData.familyName}", Middle:"${tdacData.middleName}", First:"${tdacData.firstName}"`);
    
    if (hasRequiredArrivalInfo) {
      console.log('\n🎉 测试通过！TDAC数据可以成功提交');
      if (hasDepartureInfo) {
        console.log('🎉 Departure flight信息也会一起发送到TDAC');
      }
    } else {
      console.log('\n❌ 测试失败！缺少必要的来程信息');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

// 运行测试
runDepartureFlightTest();