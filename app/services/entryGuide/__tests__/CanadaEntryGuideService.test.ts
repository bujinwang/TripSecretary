
// 加拿大入境指引服务测试
import CanadaEntryGuideService from '../CanadaEntryGuideService';

describe('CanadaEntryGuideService', () => {
  let service;

  beforeEach(() => {
    service = new CanadaEntryGuideService();
  });

  test('应该正确初始化服务', () => {
    expect(service).toBeDefined();
    expect(service.guide).toBeDefined();
    expect(service.guide.country).toBe('canada');
  });

  test('应该返回正确的步骤总数', () => {
    const progress = service.getProgress();
    expect(progress.total).toBe(6); // 加拿大6步骤流程
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('应该正确完成步骤', () => {
    const result = service.completeStep('eta_application');
    expect(result.completed).toBe(1);
    expect(result.percentage).toBe(17); // 1/6 ≈ 16.67，四舍五入为17
  });

  test('应该正确设置和获取当前步骤', () => {
    const step = service.setCurrentStep('immigration_check');
    expect(step.id).toBe('immigration_check');
    expect(service.currentStep).toBe('immigration_check');
  });

  test('应该返回正确的下一步', () => {
    service.setCurrentStep('landing_setup');
    const nextStep = service.getNextStep();
    expect(nextStep.id).toBe('immigration_check');
  });

  test('应该返回正确的上一步', () => {
    service.setCurrentStep('immigration_check');
    const prevStep = service.getPreviousStep();
    expect(prevStep.id).toBe('landing_setup');
  });

  test('应该返回正确的eTA信息', () => {
    const etaInfo = service.getETAInfo();
    expect(etaInfo.systemName).toBe('Electronic Travel Authorization');
    expect(etaInfo.applicationWindow).toBe('72小时');
    expect(etaInfo.cost).toBe('7加元');
  });

  test('应该返回正确的免签证计划信息', () => {
    const visaExemptInfo = service.getVisaExemptInfo();
    expect(visaExemptInfo.countries).toContain('美国');
    expect(visaExemptInfo.countries).toContain('日本');
    expect(visaExemptInfo.benefits).toContain('免签证入境加拿大');
  });

  test('应该正确检查免签证资格', () => {
    const check1 = service.checkVisaExemptQualification('美国');
    expect(check1.isQualified).toBe(true);
    expect(check1.message).toContain('属于免签证计划国家');

    const check2 = service.checkVisaExemptQualification('中国');
    expect(check2.isQualified).toBe(false);
    expect(check2.message).toContain('不属于免签证计划国家');
    expect(check2.nextSteps).toContain('申请加拿大签证');
  });

  test('应该返回正确的旅行计划要求', () => {
    const travelPlanReq = service.getTravelPlanRequirements();
    expect(travelPlanReq.required).toBe(true);
    expect(travelPlanReq.documents).toContain('酒店预订确认');
    expect(travelPlanReq.validation).toContain('地址必须具体');
  });

  test('应该返回正确的资金证明要求', () => {
    const fundingReq = service.getFundingRequirements();
    expect(fundingReq.minimumAmount.perPerson).toBe(2500);
    expect(fundingReq.minimumAmount.family).toBe(4000);
    expect(fundingReq.acceptedProofs).toContain('银行存款证明');
  });

  test('应该返回正确的海关信息', () => {
    const customsInfo = service.getCustomsInfo();
    expect(customsInfo.declarationRequired).toBe(true);
    expect(customsInfo.prohibitedItems).toContain('新鲜水果和蔬菜');
    expect(customsInfo.dutyFree.alcohol).toBe('1.5升');
  });

  test('应该返回正确的交通信息', () => {
    const transportInfo = service.getTransportInfo();
    expect(transportInfo.options).toHaveLength(4);
    expect(transportInfo.recommendations.yyz).toBe('机场快轨最快捷');
  });

  test('应该返回正确的货币信息', () => {
    const currencyInfo = service.getCurrencyInfo();
    expect(currencyInfo.code).toBe('CAD');
    expect(currencyInfo.name).toBe('加拿大元');
    expect(currencyInfo.denominations).toHaveLength(4);
  });

  test('应该正确检查eTA申请时间', () => {
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 2); // 2天后

    const check = service.checkETAApplicationTime(futureTime.toISOString());
    expect(check.canApply).toBe(true);
    expect(check.daysUntilArrival).toBe(2);
    expect(check.windowStatus).toBe('within_window');
  });

  test('应该正确检查eTA状态', () => {
    const applicationDate = new Date();
    applicationDate.setHours(applicationDate.getHours() - 1); // 1小时前申请

    const status1 = service.checkETAStatus(applicationDate.toISOString());
    expect(status1.status).toBe('processing');
    expect(status1.message).toContain('正在处理中');

    const approvalDate = new Date();
    approvalDate.setHours(approvalDate.getHours() - 1); // 1小时前批准

    const status2 = service.checkETAStatus(applicationDate.toISOString(), approvalDate.toISOString());
    expect(status2.status).toBe('approved');
    expect(status2.message).toContain('已批准');
  });

  test('应该正确检查资金证明是否充足', () => {
    const check1 = service.checkFundingAdequacy(3000, 1);
    expect(check1.isAdequate).toBe(true);
    expect(check1.message).toContain('资金证明充足');

    const check2 = service.checkFundingAdequacy(2000, 1);
    expect(check2.isAdequate).toBe(false);
    expect(check2.shortfall).toBe(500);
    expect(check2.message).toContain('资金证明不足');
  });

  test('应该正确验证旅行计划', () => {
    const validPlan = {
      address: '123 Main Street, Toronto, ON M5V 1A1, Canada',
      dates: { start: '2025-01-15', end: '2025-01-25' },
      purpose: '旅游和商务会议',
      contact: { phone: '+1-416-555-0123', email: 'john@example.com' },
      '酒店预订确认': 'Hilton Toronto 预订确认号: HTL123456',
      '详细行程安排': '第1天：抵达多伦多，第2天：参观CN塔...',
      '返程机票': 'AC 101 返程航班确认',
      '访问目的说明': '旅游和商务会议',
      '联系人信息': '+1-416-555-0123, john@example.com'
    };

    const validation = service.validateTravelPlan(validPlan);
    expect(validation.isValid).toBe(true);
    expect(validation.missingDocuments).toHaveLength(0);
    expect(validation.validationIssues).toHaveLength(0);

    const invalidPlan = {
      address: 'Toronto',
      purpose: '旅游'
    };

    const invalidValidation = service.validateTravelPlan(invalidPlan);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.validationIssues.length).toBeGreaterThan(0);
  });

  test('应该正确计算预计总时间', () => {
    const timeInfo = service.getEstimatedTotalTime();
    expect(timeInfo.minutes).toBeGreaterThan(0);
    expect(timeInfo.formatted).toContain('分钟');
    expect(timeInfo.breakdown).toHaveLength(6);
  });

  test('应该返回正确的推荐行动', () => {
    const actions = service.getRecommendedActions();
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0]).toHaveProperty('type');
    expect(actions[0]).toHaveProperty('title');
    expect(actions[0]).toHaveProperty('priority');
  });

  test('应该正确获取步骤状态', () => {
    service.completeStep('eta_application');
    expect(service.getStepStatus('eta_application')).toBe('completed');
    expect(service.getStepStatus('immigration_check')).toBe('pending');

    service.setCurrentStep('immigration_check');
    expect(service.getStepStatus('immigration_check')).toBe('current');
  });

  test('应该正确获取步骤图标', () => {
    const icon = service.getStepIcon('customs_declaration');
    expect(icon).toBe('🔍');
  });

  test('应该正确检查是否可以进入下一步', () => {
    // 第一步总是可以进入
    expect(service.canProceedToStep('eta_application')).toBe(true);

    // 没有完成前面的步骤时不能进入
    expect(service.canProceedToStep('immigration_check')).toBe(false);

    // 完成前面步骤后可以进入
    service.completeStep('eta_application');
    service.completeStep('travel_plan_prep');
    service.completeStep('landing_setup');
    expect(service.canProceedToStep('immigration_check')).toBe(true);
  });
});