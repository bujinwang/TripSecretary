
/**
 * TDAC Submission Logger Service
 * 统一管理TDAC提交的详细日志记录
 * 
 * 功能：
 * - 记录所有提交信息和字段映射
 * - 生成详细的调试日志
 * - 保存提交历史记录
 * - 支持多种提交方式（Hybrid, WebView, API）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class TDACSubmissionLogger {
  
  /**
   * 记录Hybrid模式提交的详细日志
   * @param {Object} travelerData - 旅行者数据
   * @param {string} cloudflareToken - Cloudflare token
   */
  static async logHybridSubmission(travelerData: Record<string, unknown>, cloudflareToken: string) {
    try {
      console.log('\n🔍 ===== TDAC 闪电提交详细日志 =====');
      console.log('⏰ 提交时间:', new Date().toLocaleString('zh-CN'));
      console.log('🌐 提交方式: 闪电提交 (Hybrid Mode)');
      console.log('🔑 Cloudflare Token: ✅ 已获取 (长度:', cloudflareToken?.length, ')');
      
      // 记录个人信息
      this.logPersonalInfo(travelerData);
      
      // 记录旅行信息
      this.logTravelInfo(travelerData);
      
      // 记录住宿信息
      this.logAccommodationInfo(travelerData);
      
      // 记录联系信息
      this.logContactInfo(travelerData);
      
      // 记录技术信息
      this.logTechnicalInfo(travelerData, cloudflareToken);
      
      // 记录字段映射
      this.logFieldMappings(travelerData);
      
      // 显示重要提醒
      this.logImportantWarnings();
      
      // 保存到本地存储
      await this.saveSubmissionLog('hybrid', travelerData, {
        cloudflareToken: `${cloudflareToken?.substring(0, 50)  }...`,
        tokenLength: cloudflareToken?.length
      });
      
      console.log('\n🔍 ===== 日志记录完成 =====\n');
      
    } catch (error) {
      console.error('❌ Hybrid提交日志记录失败:', error);
    }
  }
  
  /**
   * 记录WebView模式填充的详细日志
   * @param {Array} formFields - 表单字段数组
   */
  static async logWebViewFill(formFields: Record<string, unknown>[]) {
    try {
      console.log('\n🔍 ===== TDAC WebView 自动填充详细日志 =====');
      console.log('⏰ 填充时间:', new Date().toLocaleString('zh-CN'));
      console.log('🌐 填充方式: WebView 自动填充');
      console.log('🎯 目标网站: https://tdac.immigration.go.th');
      
      // 按分组记录字段
      const personalFields = formFields.filter((f: Record<string, unknown>) => f.section === 'personal');
      const tripFields = formFields.filter((f: Record<string, unknown>) => f.section === 'trip');
      const accommodationFields = formFields.filter((f: Record<string, unknown>) => f.section === 'accommodation');
      
      this.logWebViewFieldGroup('👤 个人信息字段', personalFields);
      this.logWebViewFieldGroup('✈️ 旅行信息字段', tripFields);
      this.logWebViewFieldGroup('🏨 住宿信息字段', accommodationFields);
      
      // 记录技术实现详情
      this.logWebViewTechnicalDetails();
      
      // 记录统计信息
      this.logWebViewStatistics(formFields, personalFields, tripFields, accommodationFields);
      
      // 显示重要提醒
      this.logWebViewWarnings();
      
      // 保存到本地存储
      await this.saveWebViewFillLog(formFields);
      
      console.log('\n🔍 ===== WebView填充日志记录完成 =====\n');
      
    } catch (error) {
      console.error('❌ WebView填充日志记录失败:', error);
    }
  }
  
  /**
   * 记录个人信息
   */
  static logPersonalInfo(travelerData: Record<string, unknown>) {
    console.log('\n📋 === 个人信息 Personal Information ===');
    console.log('👤 姓名 (Name):');
    console.log('  - 姓 (Family Name):', travelerData.familyName, '→ TDAC字段: familyName');
    console.log('  - 名 (First Name):', travelerData.firstName, '→ TDAC字段: firstName');
    console.log('  - 中间名 (Middle Name):', travelerData.middleName || '(空)', '→ TDAC字段: middleName');
    
    console.log('📄 护照信息 (Passport):');
    console.log('  - 护照号 (Passport No):', travelerData.passportNo, '→ TDAC字段: passportNo');
    console.log('  - 国籍 (Nationality):', travelerData.nationality, '→ TDAC字段: nationality');
    console.log('  - 出生日期 (Birth Date):', travelerData.birthDate, '→ TDAC字段: birthDate');
    console.log('  - 性别 (Gender):', travelerData.gender, '→ TDAC字段: gender');
    
    console.log('🏠 居住信息 (Residence):');
    console.log('  - 居住城市 (City):', travelerData.cityResidence, '→ TDAC字段: cityResidence');
    console.log('  - 居住国家 (Country):', travelerData.countryResidence, '→ TDAC字段: countryResidence');
    console.log('  - 职业 (Occupation):', travelerData.occupation, '→ TDAC字段: occupation');
  }
  
  /**
   * 记录旅行信息
   */
  static logTravelInfo(travelerData: Record<string, unknown>) {
    console.log('\n✈️ === 旅行信息 Travel Information ===');
    console.log('📅 日期 (Dates):');
    console.log('  - 到达日期 (Arrival Date):', travelerData.arrivalDate, '→ TDAC字段: arrivalDate');
    console.log('  - 离开日期 (Departure Date):', travelerData.departureDate || '(未设置)', '→ TDAC字段: departureDate');
    
    console.log('🛫 航班信息 (Flight):');
    console.log('  - 航班号 (Flight No):', travelerData.flightNo, '→ TDAC字段: flightNo');
    console.log('  - 出发国家 (Country Boarded):', travelerData.countryBoarded, '→ TDAC字段: countryBoarded');
    console.log('  - 最近停留国家 (Recent Stay Country):', travelerData.recentStayCountry || '(未填写)', '→ TDAC字段: recentStayCountry');
    console.log('  - 旅行方式 (Travel Mode):', travelerData.travelMode, '→ TDAC字段: travelMode');
    console.log('  - 旅行目的 (Purpose):', travelerData.purpose, '→ TDAC字段: purpose');
  }
  
  /**
   * 记录住宿信息
   */
  static logAccommodationInfo(travelerData: Record<string, unknown>) {
    console.log('\n🏨 === 住宿信息 Accommodation Information ===');
    const accommodationDisplay = travelerData.accommodationTypeDisplay || travelerData.accommodationType;
    console.log(
      '🏠 住宿类型 (Type):',
      accommodationDisplay,
      '→ TDAC字段: accommodationType',
      travelerData.accommodationType ? `(ID: ${travelerData.accommodationType})` : ''
    );
    console.log('📍 地址信息 (Address):');
    const provinceDisplay = travelerData.provinceDisplay || travelerData.province;
    const districtDisplay = travelerData.districtDisplay || travelerData.district;
    const subDistrictDisplay = travelerData.subDistrictDisplay || travelerData.subDistrict;
    console.log(
      '  - 省份 (Province):',
      provinceDisplay,
      '→ TDAC字段: province',
      travelerData.province ? `(Code: ${travelerData.province})` : ''
    );
    console.log(
      '  - 区域 (District):',
      districtDisplay || '(未填写)',
      '→ TDAC字段: district',
      travelerData.district ? `(Code: ${travelerData.district})` : ''
    );
    console.log(
      '  - 子区域 (Sub District):',
      subDistrictDisplay || '(未填写)',
      '→ TDAC字段: subDistrict',
      travelerData.subDistrict ? `(Code: ${travelerData.subDistrict})` : ''
    );
    console.log('  - 邮编 (Post Code):', travelerData.postCode, '→ TDAC字段: postCode');
    console.log('  - 详细地址 (Address):', travelerData.address, '→ TDAC字段: address');
  }
  
  /**
   * 记录联系信息
   */
  static logContactInfo(travelerData: Record<string, unknown>) {
    console.log('\n📞 === 联系信息 Contact Information ===');
    console.log('📧 邮箱 (Email):', travelerData.email, '→ TDAC字段: email');
    console.log('📱 电话 (Phone):');
    console.log('  - 国家代码 (Country Code):', travelerData.phoneCode, '→ TDAC字段: phoneCode');
    console.log('  - 电话号码 (Phone Number):', travelerData.phoneNo, '→ TDAC字段: phoneNo');
  }
  
  /**
   * 记录技术信息
   */
  static logTechnicalInfo(travelerData: Record<string, unknown>, cloudflareToken: string) {
    console.log('\n🔧 === 技术信息 Technical Information ===');
    console.log('🔑 Cloudflare Token 预览:', `${cloudflareToken?.substring(0, 50)  }...`);
    console.log('⚙️ 传输模式ID (Trans Mode ID):', travelerData.tranModeId || '(自动)', '→ TDAC字段: tranModeId');
    console.log('\n🆔 === 签证信息 Visa Information ===');
    console.log('📋 签证号 (Visa No):', travelerData.visaNo || '(免签)', '→ TDAC字段: visaNo');
  }

  /**
   * 记录TDAC解析后的下拉选项ID
   * 在TDACAPIService完成下拉匹配后调用，展示最终提交给TDAC的编码
   * @param {Object} originalTravelerData - 原始旅行者数据
   * @param {Object} payload - 提交给TDAC的最终payload
   * @param {Object} dynamicData - TDACAPIService匹配到的行数据
   */
  static async logResolvedSelectMappings(originalTravelerData: Record<string, unknown>, payload: Record<string, unknown>, dynamicData: Record<string, Record<string, string>> = {}) {
    try {
      if (!payload) {
        console.log('ℹ️ logResolvedSelectMappings called without payload, skipping');
        return;
      }

      const tripInfo = (payload.tripInfo || {}) as Record<string, string>;
      const resolvedInfo = {
        tranModeId: tripInfo.tranModeId || '',
        tranModeDesc: dynamicData.tranModeRow?.value || '',
        accTypeId: tripInfo.accTypeId || '',
        accProvinceId: tripInfo.accProvinceId || dynamicData.provinceRow?.key || '',
        accProvinceDesc: tripInfo.accProvinceDesc || dynamicData.provinceRow?.value || '',
        accDistrictId: tripInfo.accDistrictId || dynamicData.districtRow?.key || '',
        accDistrictDesc: tripInfo.accDistrictDesc || dynamicData.districtRow?.value || '',
        accSubDistrictId: tripInfo.accSubDistrictId || dynamicData.subDistrictRow?.key || '',
        accSubDistrictDesc: tripInfo.accSubDistrictDesc || dynamicData.subDistrictRow?.value || '',
        accPostCode: tripInfo.accPostCode || dynamicData.districtRow?.code || ''
      };

      console.log('\n🔁 === TDAC 解析后的下拉选项编码 ===');
      console.log('   • 住宿类型 ID:', resolvedInfo.accTypeId);
      console.log('   • 省份 ID:', resolvedInfo.accProvinceId, '→', resolvedInfo.accProvinceDesc);
      console.log('   • 区域 ID:', resolvedInfo.accDistrictId, '→', resolvedInfo.accDistrictDesc);
      console.log('   • 子区域 ID:', resolvedInfo.accSubDistrictId, '→', resolvedInfo.accSubDistrictDesc);
      console.log('   • 邮编:', resolvedInfo.accPostCode);
      console.log('   • 交通方式 ID:', resolvedInfo.tranModeId, resolvedInfo.tranModeDesc ? `→ ${resolvedInfo.tranModeDesc}` : '');

      // 保存解析后的信息，便于事后审计
      await this.saveSubmissionLog('hybrid_resolved', originalTravelerData || {}, {
        resolvedSelectItems: resolvedInfo,
        payloadPreview: {
          tranModeId: tripInfo.tranModeId,
          accTypeId: tripInfo.accTypeId,
          accProvinceId: tripInfo.accProvinceId,
          accProvinceDesc: tripInfo.accProvinceDesc,
          accDistrictId: tripInfo.accDistrictId,
          accDistrictDesc: tripInfo.accDistrictDesc,
          accSubDistrictId: tripInfo.accSubDistrictId,
          accSubDistrictDesc: tripInfo.accSubDistrictDesc,
          accPostCode: tripInfo.accPostCode
        }
      });
    } catch (error) {
      console.error('❌ 记录解析后的TDAC编码失败:', error);
    }
  }
  
  /**
   * 记录字段映射
   */
  static logFieldMappings(travelerData: Record<string, unknown>) {
    console.log('\n📊 === 表单字段映射 Form Field Mappings ===');
    const fieldMappings = [
      { label: '姓氏', field: 'familyName', value: travelerData.familyName, tdacId: 'familyName' },
      { label: '名字', field: 'firstName', value: travelerData.firstName, tdacId: 'firstName' },
      { label: '护照号', field: 'passportNo', value: travelerData.passportNo, tdacId: 'passportNo' },
      { label: '国籍', field: 'nationality', value: travelerData.nationality, tdacId: 'nationality' },
      { label: '性别', field: 'gender', value: travelerData.gender, tdacId: 'gender' },
      { label: '出生日期', field: 'birthDate', value: travelerData.birthDate, tdacId: 'birthDate' },
      { label: '职业', field: 'occupation', value: travelerData.occupation, tdacId: 'occupation' },
      { label: '邮箱', field: 'email', value: travelerData.email, tdacId: 'email' },
      { label: '电话代码', field: 'phoneCode', value: travelerData.phoneCode, tdacId: 'phoneCode' },
      { label: '电话号码', field: 'phoneNo', value: travelerData.phoneNo, tdacId: 'phoneNo' },
      { label: '到达日期', field: 'arrivalDate', value: travelerData.arrivalDate, tdacId: 'arrivalDate' },
      { label: '航班号', field: 'flightNo', value: travelerData.flightNo, tdacId: 'flightNo' },
      { label: '出发国家', field: 'countryBoarded', value: travelerData.countryBoarded, tdacId: 'countryBoarded' },
      { label: '最近停留国家', field: 'recentStayCountry', value: travelerData.recentStayCountry, tdacId: 'recentStayCountry' },
      { label: '旅行目的', field: 'purpose', value: travelerData.purpose, tdacId: 'purpose' },
      { label: '住宿类型', field: 'accommodationType', value: travelerData.accommodationTypeDisplay || travelerData.accommodationType, tdacId: 'accommodationType' },
      { label: '省份', field: 'province', value: travelerData.provinceDisplay || travelerData.province, tdacId: 'province' },
      { label: '区域', field: 'district', value: travelerData.districtDisplay || travelerData.district, tdacId: 'district' },
      { label: '子区域', field: 'subDistrict', value: travelerData.subDistrictDisplay || travelerData.subDistrict, tdacId: 'subDistrict' },
      { label: '详细地址', field: 'address', value: travelerData.address, tdacId: 'address' }
    ];
    
    fieldMappings.forEach((mapping, index) => {
      console.log(`  ${index + 1}. ${mapping.label}: "${mapping.value}" → TDAC字段ID: ${mapping.tdacId}`);
    });
  }
  
  /**
   * 记录重要提醒
   */
  static logImportantWarnings() {
    console.log('\n⚠️ === 重要提醒 Important Notes ===');
    console.log('🚨 此信息将直接提交给泰国移民局 (TDAC)');
    console.log('🚨 提交后无法修改，请仔细核对');
    console.log('🚨 多次提交可能导致账户被暂时封禁');
    console.log('🚨 请确保所有信息与护照完全一致');
  }
  
  /**
   * 记录WebView字段组
   */
  static logWebViewFieldGroup(title: string, fields: Record<string, unknown>[]) {
    console.log(`\n${title}:`);
    fields.forEach((field: Record<string, unknown>, index: number) => {
      console.log(`  ${index + 1}. ${field.label} (${field.labelCn})`);
      console.log(`     值: "${field.value}"`);
      console.log(`     搜索词: [${field.searchTerms.join(', ')}]`);
      console.log(`     目标字段ID: ${field.field}`);
      console.log('');
    });
  }
  
  /**
   * 记录WebView技术详情
   */
  static logWebViewTechnicalDetails() {
    console.log('\n🔧 === 技术实现详情 ===');
    console.log('🎯 字段查找策略:');
    console.log('  1. Angular表单属性 (formcontrolname)');
    console.log('  2. ng-reflect-name 属性');
    console.log('  3. name 和 id 属性');
    console.log('  4. placeholder 文本匹配');
    console.log('  5. label 文本匹配');
    console.log('  6. 单选按钮组 (mat-radio-group)');
  }
  
  /**
   * 记录WebView统计信息
   */
  static logWebViewStatistics(formFields: Record<string, unknown>[], personalFields: Record<string, unknown>[], tripFields: Record<string, unknown>[], accommodationFields: Record<string, unknown>[]) {
    console.log('\n📊 === 填充统计 ===');
    console.log(`📝 总字段数: ${formFields.length}`);
    console.log(`👤 个人信息: ${personalFields.length} 个字段`);
    console.log(`✈️ 旅行信息: ${tripFields.length} 个字段`);
    console.log(`🏨 住宿信息: ${accommodationFields.length} 个字段`);
  }
  
  /**
   * 记录WebView重要提醒
   */
  static logWebViewWarnings() {
    console.log('\n⚠️ === 重要提醒 ===');
    console.log('🚨 这些信息将自动填入TDAC网站表单');
    console.log('🚨 填充后请仔细检查每个字段的准确性');
    console.log('🚨 确认无误后再点击提交按钮');
    console.log('🚨 多次提交可能导致账户被暂时封禁');
  }
  
  /**
   * 保存提交日志到本地存储
   */
  static async saveSubmissionLog(method: string, travelerData: Record<string, unknown>, additionalInfo: Record<string, unknown> = {}) {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        submissionMethod: method,
        travelerData: {
          familyName: travelerData.familyName,
          firstName: travelerData.firstName,
          passportNo: travelerData.passportNo,
          nationality: travelerData.nationality,
          arrivalDate: travelerData.arrivalDate,
          flightNo: travelerData.flightNo,
          email: travelerData.email,
          phoneCode: travelerData.phoneCode,
          phoneNo: travelerData.phoneNo
        },
        additionalInfo,
        warnings: [
          '此信息将直接提交给泰国移民局 (TDAC)',
          '提交后无法修改，请仔细核对',
          '多次提交可能导致账户被暂时封禁',
          '请确保所有信息与护照完全一致'
        ]
      };
      
      const storageKey = `tdac_submission_log_${method}_${Date.now()}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(logData));
      console.log(`✅ ${method}提交日志已保存到本地存储:`, storageKey);
      
      // 同时保存到通用日志
      await this.saveToGeneralLog(logData);
      
    } catch (error) {
      console.error('❌ 保存提交日志失败:', error);
    }
  }
  
  /**
   * 保存WebView填充日志
   */
  static async saveWebViewFillLog(formFields: Record<string, unknown>[]) {
    try {
      const personalFields = formFields.filter((f: Record<string, unknown>) => f.section === 'personal');
      const tripFields = formFields.filter((f: Record<string, unknown>) => f.section === 'trip');
      const accommodationFields = formFields.filter((f: Record<string, unknown>) => f.section === 'accommodation');
      
      const logData = {
        timestamp: new Date().toISOString(),
        fillMethod: 'webview_autofill',
        targetUrl: 'https://tdac.immigration.go.th',
        fields: formFields.map((field: Record<string, unknown>) => ({
          label: field.label,
          labelCn: field.labelCn,
          value: field.value,
          searchTerms: field.searchTerms,
          fieldId: field.field,
          section: field.section
        })),
        statistics: {
          totalFields: formFields.length,
          personalFields: personalFields.length,
          tripFields: tripFields.length,
          accommodationFields: accommodationFields.length
        },
        warnings: [
          '这些信息将自动填入TDAC网站表单',
          '填充后请仔细检查每个字段的准确性',
          '确认无误后再点击提交按钮',
          '多次提交可能导致账户被暂时封禁'
        ]
      };
      
      const storageKey = `tdac_webview_fill_log_${Date.now()}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(logData));
      console.log('✅ WebView填充日志已保存到本地存储:', storageKey);
      
      // 同时保存到通用日志
      await this.saveToGeneralLog(logData);
      
    } catch (error) {
      console.error('❌ 保存WebView填充日志失败:', error);
    }
  }
  
  /**
   * 保存到通用日志历史
   */
  static async saveToGeneralLog(logData: Record<string, unknown>) {
    try {
      const historyKey = 'tdac_submission_history';
      const historyJson = await AsyncStorage.getItem(historyKey);
      const history = historyJson ? JSON.parse(historyJson) : [];
      
      // 添加到历史记录开头
      history.unshift(logData);
      
      // 保持最近100条记录
      if (history.length > 100) {
        history.splice(100);
      }
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
      console.log('✅ 已添加到通用提交历史记录');
      
    } catch (error) {
      console.error('❌ 保存到通用日志失败:', error);
    }
  }
  
  /**
   * 获取提交历史记录
   */
  static async getSubmissionHistory() {
    try {
      const historyJson = await AsyncStorage.getItem('tdac_submission_history');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('❌ 获取提交历史失败:', error);
      return [];
    }
  }
  
  /**
   * 清理旧的日志记录
   */
  static async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const history = await this.getSubmissionHistory();
      const filteredHistory = history.filter((log: Record<string, unknown>) => {
        const logDate = new Date(log.timestamp);
        return logDate > cutoffDate;
      });
      
      await AsyncStorage.setItem('tdac_submission_history', JSON.stringify(filteredHistory));
      console.log(`✅ 已清理${daysToKeep}天前的日志记录，保留${filteredHistory.length}条记录`);
      
    } catch (error) {
      console.error('❌ 清理日志记录失败:', error);
    }
  }
}

export default TDACSubmissionLogger;
