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
import logger from '../LoggingService';

// Type definitions
interface TravelerData {
  familyName?: string;
  firstName?: string;
  middleName?: string;
  passportNo?: string;
  nationality?: string;
  birthDate?: string | { year: number; month: number; day: number };
  gender?: string;
  cityResidence?: string;
  countryResidence?: string;
  occupation?: string;
  email?: string;
  phoneCode?: string;
  phoneNo?: string;
  arrivalDate?: string;
  departureDate?: string;
  flightNo?: string;
  countryBoarded?: string;
  recentStayCountry?: string;
  travelMode?: string;
  purpose?: string;
  accommodationType?: string;
  accommodationTypeDisplay?: string;
  province?: string;
  provinceDisplay?: string;
  district?: string;
  districtDisplay?: string;
  subDistrict?: string;
  subDistrictDisplay?: string;
  postCode?: string;
  address?: string;
  tranModeId?: string;
  visaNo?: string;
  [key: string]: any;
}

interface FormField {
  label: string;
  labelCn?: string;
  value: any;
  searchTerms?: string[];
  field: string;
  section: 'personal' | 'trip' | 'accommodation';
}

interface ResolvedSelectInfo {
  tranModeId: string;
  tranModeDesc: string;
  accTypeId: string;
  accProvinceId: string;
  accProvinceDesc: string;
  accDistrictId: string;
  accDistrictDesc: string;
  accSubDistrictId: string;
  accSubDistrictDesc: string;
  accPostCode: string;
}

interface DynamicDataRow {
  key?: string;
  value?: string;
  code?: string;
}

interface DynamicData {
  tranModeRow?: DynamicDataRow;
  provinceRow?: DynamicDataRow;
  districtRow?: DynamicDataRow;
  subDistrictRow?: DynamicDataRow;
  [key: string]: any;
}

interface TripInfo {
  tranModeId?: string;
  accTypeId?: string;
  accProvinceId?: string;
  accProvinceDesc?: string;
  accDistrictId?: string;
  accDistrictDesc?: string;
  accSubDistrictId?: string;
  accSubDistrictDesc?: string;
  accPostCode?: string;
  [key: string]: any;
}

interface TDACPayload {
  tripInfo?: TripInfo;
  [key: string]: any;
}

interface SubmissionLogData {
  timestamp: string;
  submissionMethod: string;
  travelerData: {
    familyName?: string;
    firstName?: string;
    passportNo?: string;
    nationality?: string;
    arrivalDate?: string;
    flightNo?: string;
    email?: string;
    phoneCode?: string;
    phoneNo?: string;
  };
  additionalInfo?: Record<string, any>;
  warnings?: string[];
}

interface WebViewFillLogData {
  timestamp: string;
  fillMethod: string;
  targetUrl: string;
  fields: Array<{
    label: string;
    labelCn?: string;
    value: any;
    searchTerms?: string[];
    fieldId: string;
    section: string;
  }>;
  statistics: {
    totalFields: number;
    personalFields: number;
    tripFields: number;
    accommodationFields: number;
  };
  warnings?: string[];
}

class TDACSubmissionLogger {
  
  /**
   * 记录Hybrid模式提交的详细日志
   * @param travelerData - 旅行者数据
   * @param cloudflareToken - Cloudflare token
   */
  static async logHybridSubmission(travelerData: TravelerData, cloudflareToken: string): Promise<void> {
    try {
      logger.debug('TDACSubmissionLogger', '\n🔍 ===== TDAC 闪电提交详细日志 =====');
      logger.debug('TDACSubmissionLogger', '⏰ 提交时间:', { time: new Date().toLocaleString('zh-CN') });
      logger.debug('TDACSubmissionLogger', '🌐 提交方式: 闪电提交 (Hybrid Mode)');
      logger.debug('TDACSubmissionLogger', '🔑 Cloudflare Token: ✅ 已获取', { tokenLength: cloudflareToken?.length });
      
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
        cloudflareToken: cloudflareToken?.substring(0, 50) + '...',
        tokenLength: cloudflareToken?.length
      });
      
      logger.debug('TDACSubmissionLogger', '\n🔍 ===== 日志记录完成 =====\n');
      
    } catch (error: any) {
      logger.error('TDACSubmissionLogger', error, { operation: 'logHybridSubmission' });
    }
  }
  
  /**
   * 记录WebView模式填充的详细日志
   * @param formFields - 表单字段数组
   */
  static async logWebViewFill(formFields: FormField[]): Promise<void> {
    try {
      logger.debug('TDACSubmissionLogger', '\n🔍 ===== TDAC WebView 自动填充详细日志 =====');
      logger.debug('TDACSubmissionLogger', '⏰ 填充时间:', { time: new Date().toLocaleString('zh-CN') });
      logger.debug('TDACSubmissionLogger', '🌐 填充方式: WebView 自动填充');
      logger.debug('TDACSubmissionLogger', '🎯 目标网站: https://tdac.immigration.go.th');
      
      // 按分组记录字段
      const personalFields = formFields.filter(f => f.section === 'personal');
      const tripFields = formFields.filter(f => f.section === 'trip');
      const accommodationFields = formFields.filter(f => f.section === 'accommodation');
      
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
      
      logger.debug('TDACSubmissionLogger', '\n🔍 ===== WebView填充日志记录完成 =====\n');
      
    } catch (error: any) {
      logger.error('TDACSubmissionLogger', error, { operation: 'logWebViewFill' });
    }
  }
  
  /**
   * 记录个人信息
   */
  static logPersonalInfo(travelerData: TravelerData): void {
    logger.debug('TDACSubmissionLogger', '\n📋 === 个人信息 Personal Information ===');
    logger.debug('TDACSubmissionLogger', '👤 姓名 (Name):', {
      familyName: travelerData.familyName,
      firstName: travelerData.firstName,
      middleName: travelerData.middleName || '(空)'
    });
    logger.debug('TDACSubmissionLogger', '📄 护照信息 (Passport):', {
      passportNo: travelerData.passportNo,
      nationality: travelerData.nationality,
      birthDate: travelerData.birthDate,
      gender: travelerData.gender
    });
    logger.debug('TDACSubmissionLogger', '🏠 居住信息 (Residence):', {
      cityResidence: travelerData.cityResidence,
      countryResidence: travelerData.countryResidence,
      occupation: travelerData.occupation
    });
  }
  
  /**
   * 记录旅行信息
   */
  static logTravelInfo(travelerData: TravelerData): void {
    logger.debug('TDACSubmissionLogger', '\n✈️ === 旅行信息 Travel Information ===');
    logger.debug('TDACSubmissionLogger', '📅 日期 (Dates):', {
      arrivalDate: travelerData.arrivalDate,
      departureDate: travelerData.departureDate || '(未设置)'
    });
    logger.debug('TDACSubmissionLogger', '🛫 航班信息 (Flight):', {
      flightNo: travelerData.flightNo,
      countryBoarded: travelerData.countryBoarded,
      recentStayCountry: travelerData.recentStayCountry || '(未填写)',
      travelMode: travelerData.travelMode,
      purpose: travelerData.purpose
    });
  }
  
  /**
   * 记录住宿信息
   */
  static logAccommodationInfo(travelerData: TravelerData): void {
    logger.debug('TDACSubmissionLogger', '\n🏨 === 住宿信息 Accommodation Information ===');
    const accommodationDisplay = travelerData.accommodationTypeDisplay || travelerData.accommodationType;
    const provinceDisplay = travelerData.provinceDisplay || travelerData.province;
    const districtDisplay = travelerData.districtDisplay || travelerData.district;
    const subDistrictDisplay = travelerData.subDistrictDisplay || travelerData.subDistrict;
    
    logger.debug('TDACSubmissionLogger', '住宿信息', {
      accommodationType: accommodationDisplay,
      accommodationTypeId: travelerData.accommodationType,
      province: provinceDisplay,
      provinceCode: travelerData.province,
      district: districtDisplay || '(未填写)',
      districtCode: travelerData.district,
      subDistrict: subDistrictDisplay || '(未填写)',
      subDistrictCode: travelerData.subDistrict,
      postCode: travelerData.postCode,
      address: travelerData.address
    });
  }
  
  /**
   * 记录联系信息
   */
  static logContactInfo(travelerData: TravelerData): void {
    logger.debug('TDACSubmissionLogger', '\n📞 === 联系信息 Contact Information ===');
    logger.debug('TDACSubmissionLogger', '联系信息', {
      email: travelerData.email,
      phoneCode: travelerData.phoneCode,
      phoneNo: travelerData.phoneNo
    });
  }
  
  /**
   * 记录技术信息
   */
  static logTechnicalInfo(travelerData: TravelerData, cloudflareToken: string): void {
    logger.debug('TDACSubmissionLogger', '\n🔧 === 技术信息 Technical Information ===');
    logger.debug('TDACSubmissionLogger', '技术信息', {
      cloudflareTokenPreview: cloudflareToken?.substring(0, 50) + '...',
      tranModeId: travelerData.tranModeId || '(自动)',
      visaNo: travelerData.visaNo || '(免签)'
    });
  }

  /**
   * 记录TDAC解析后的下拉选项ID
   * 在TDACAPIService完成下拉匹配后调用，展示最终提交给TDAC的编码
   * @param originalTravelerData - 原始旅行者数据
   * @param payload - 提交给TDAC的最终payload
   * @param dynamicData - TDACAPIService匹配到的行数据
   */
  static async logResolvedSelectMappings(
    originalTravelerData: TravelerData,
    payload: TDACPayload,
    dynamicData: DynamicData = {}
  ): Promise<void> {
    try {
      if (!payload) {
        logger.info('TDACSubmissionLogger', 'logResolvedSelectMappings called without payload, skipping');
        return;
      }

      const tripInfo = payload.tripInfo || {};
      const resolvedInfo: ResolvedSelectInfo = {
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

      logger.debug('TDACSubmissionLogger', '\n🔁 === TDAC 解析后的下拉选项编码 ===', resolvedInfo);

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
    } catch (error: any) {
      logger.error('TDACSubmissionLogger', error, { operation: 'logResolvedSelectMappings' });
    }
  }
  
  /**
   * 记录字段映射
   */
  static logFieldMappings(travelerData: TravelerData): void {
    logger.debug('TDACSubmissionLogger', '\n📊 === 表单字段映射 Form Field Mappings ===');
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
    
    logger.debug('TDACSubmissionLogger', '字段映射详情', { fieldMappings });
  }
  
  /**
   * 记录重要提醒
   */
  static logImportantWarnings(): void {
    logger.warn('TDACSubmissionLogger', '\n⚠️ === 重要提醒 Important Notes ===');
    logger.warn('TDACSubmissionLogger', '此信息将直接提交给泰国移民局 (TDAC)');
    logger.warn('TDACSubmissionLogger', '提交后无法修改，请仔细核对');
    logger.warn('TDACSubmissionLogger', '多次提交可能导致账户被暂时封禁');
    logger.warn('TDACSubmissionLogger', '请确保所有信息与护照完全一致');
  }
  
  /**
   * 记录WebView字段组
   */
  static logWebViewFieldGroup(title: string, fields: FormField[]): void {
    logger.debug('TDACSubmissionLogger', `\n${title}:`, { fields });
  }
  
  /**
   * 记录WebView技术详情
   */
  static logWebViewTechnicalDetails(): void {
    logger.debug('TDACSubmissionLogger', '\n🔧 === 技术实现详情 ===');
    logger.debug('TDACSubmissionLogger', '字段查找策略', {
      strategies: [
        'Angular表单属性 (formcontrolname)',
        'ng-reflect-name 属性',
        'name 和 id 属性',
        'placeholder 文本匹配',
        'label 文本匹配',
        '单选按钮组 (mat-radio-group)'
      ]
    });
  }
  
  /**
   * 记录WebView统计信息
   */
  static logWebViewStatistics(
    formFields: FormField[],
    personalFields: FormField[],
    tripFields: FormField[],
    accommodationFields: FormField[]
  ): void {
    logger.debug('TDACSubmissionLogger', '\n📊 === 填充统计 ===', {
      totalFields: formFields.length,
      personalFields: personalFields.length,
      tripFields: tripFields.length,
      accommodationFields: accommodationFields.length
    });
  }
  
  /**
   * 记录WebView重要提醒
   */
  static logWebViewWarnings(): void {
    logger.warn('TDACSubmissionLogger', '\n⚠️ === 重要提醒 ===');
    logger.warn('TDACSubmissionLogger', '这些信息将自动填入TDAC网站表单');
    logger.warn('TDACSubmissionLogger', '填充后请仔细检查每个字段的准确性');
    logger.warn('TDACSubmissionLogger', '确认无误后再点击提交按钮');
    logger.warn('TDACSubmissionLogger', '多次提交可能导致账户被暂时封禁');
  }
  
  /**
   * 保存提交日志到本地存储
   */
  static async saveSubmissionLog(
    method: string,
    travelerData: TravelerData,
    additionalInfo: Record<string, any> = {}
  ): Promise<void> {
    try {
      const logData: SubmissionLogData = {
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
      logger.success('TDACSubmissionLogger', `${method}提交日志已保存到本地存储`, { storageKey });
      
      // 同时保存到通用日志
      await this.saveToGeneralLog(logData);
      
    } catch (error: any) {
      logger.error('TDACSubmissionLogger', error, { operation: 'saveSubmissionLog' });
    }
  }
  
  /**
   * 保存WebView填充日志
   */
  static async saveWebViewFillLog(formFields: FormField[]): Promise<void> {
    try {
      const personalFields = formFields.filter(f => f.section === 'personal');
      const tripFields = formFields.filter(f => f.section === 'trip');
      const accommodationFields = formFields.filter(f => f.section === 'accommodation');
      
      const logData: WebViewFillLogData = {
        timestamp: new Date().toISOString(),
        fillMethod: 'webview_autofill',
        targetUrl: 'https://tdac.immigration.go.th',
        fields: formFields.map(field => ({
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
      logger.success('TDACSubmissionLogger', 'WebView填充日志已保存到本地存储', { storageKey });
      
      // 同时保存到通用日志
      await this.saveToGeneralLog(logData);
      
    } catch (error: any) {
      logger.error('TDACSubmissionLogger', error, { operation: 'saveWebViewFillLog' });
    }
  }
  
  /**
   * 保存到通用日志历史
   */
  static async saveToGeneralLog(logData: SubmissionLogData | WebViewFillLogData): Promise<void> {
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
      logger.success('TDACSubmissionLogger', '已添加到通用提交历史记录');
      
    } catch (error: any) {
      logger.error('TDACSubmissionLogger', error, { operation: 'saveToGeneralLog' });
    }
  }
  
  /**
   * 获取提交历史记录
   */
  static async getSubmissionHistory(): Promise<Array<SubmissionLogData | WebViewFillLogData>> {
    try {
      const historyJson = await AsyncStorage.getItem('tdac_submission_history');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error: any) {
      logger.error('TDACSubmissionLogger', error, { operation: 'getSubmissionHistory' });
      return [];
    }
  }
  
  /**
   * 清理旧的日志记录
   */
  static async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const history = await this.getSubmissionHistory();
      const filteredHistory = history.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate > cutoffDate;
      });
      
      await AsyncStorage.setItem('tdac_submission_history', JSON.stringify(filteredHistory));
      logger.success('TDACSubmissionLogger', `已清理${daysToKeep}天前的日志记录，保留${filteredHistory.length}条记录`);
      
    } catch (error: any) {
      logger.error('TDACSubmissionLogger', error, { operation: 'cleanupOldLogs' });
    }
  }
}

export default TDACSubmissionLogger;
export type {
  TravelerData,
  FormField,
  ResolvedSelectInfo,
  DynamicData,
  TDACPayload,
  SubmissionLogData,
  WebViewFillLogData
};

