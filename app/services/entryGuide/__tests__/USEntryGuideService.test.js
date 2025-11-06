// 美国入境指引服务测试
import USEntryGuideService from '../USEntryGuideService.js';

describe('USEntryGuideService', () => {
  let service;

  beforeEach(() => {
    service = new USEntryGuideService();
  });

  test('应该正确初始化服务', () => {
    expect(service).toBeDefined();
    expect(service.guide).toBeDefined();
    expect(service.guide.country).toBe('usa');
  });

  test('应该返回正确的步骤总数', () => {
    const progress = service.getProgress();
    expect(progress.total).toBe(5); // 美国5步骤流程
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('应该正确完成步骤', () => {
    const result = service.completeStep('landing_setup');
    expect(result.completed).toBe(1);
    expect(result.percentage).toBe(20); // 1/5 = 20%
  });

  test('应该正确设置和获取当前步骤', () => {
    const step = service.setCurrentStep('immigration_biometric');
    expect(step.id).toBe('immigration_biometric');
    expect(service.currentStep).toBe('immigration_biometric');
  });

  test('应该返回正确的下一步', () => {
    service.setCurrentStep('landing_setup');
    const nextStep = service.getNextStep();
    expect(nextStep.id).toBe('immigration_biometric');
  });

  test('应该返回正确的上一步', () => {
    service.setCurrentStep('immigration_biometric');
    const prevStep = service.getPreviousStep();
    expect(prevStep.id).toBe('landing_setup');
  });

  test('应该返回正确的ESTA信息', () => {
    const estaInfo = service.getESTAInfo();
    expect(estaInfo.systemName).toBe('Electronic System for Travel Authorization');
    expect(estaInfo.applicationWindow).toBe('72小时');
    expect(estaInfo.cost).toBe('21美元');
  });

  test('应该返回正确的VWP信息', () => {
    const vwpInfo = service.getVWPInfo();
    expect(vwpInfo.countries).toContain('日本');
    expect(vwpInfo.countries).toContain('韩国');
    expect(vwpInfo.benefits).toContain('免签证入境美国');
  });

  test('应该正确检查VWP资格', () => {
    const check1 = service.checkVWPQualification('日本');
    expect(check1.isQualified).toBe(true);
    expect(check1.message).toContain('属于VWP免签证计划国家');

    const check2 = service.checkVWPQualification('中国');
    expect(check2.isQualified).toBe(false);
    expect(check2.message).toContain('不属于VWP免签证计划国家');
    expect(check2.nextSteps).toContain('申请B1/B2签证');
  });

  test('应该返回正确的生物识别信息', () => {
    const biometricInfo = service.getBiometricInfo();
    expect(biometricInfo.required).toBe(true);
    expect(biometricInfo.types).toContain('fingerprint');
    expect(biometricInfo.types).toContain('iris_scan');
  });

  test('应该返回正确的入境卡信息', () => {
    const entryCardInfo = service.getEntryCardInfo();
    expect(entryCardInfo.required).toBe(true);
    expect(entryCardInfo.sections).toContain('personal_information');
    expect(entryCardInfo.languages).toContain('en');
  });

  test('应该返回正确的海关信息', () => {
    const customsInfo = service.getCustomsInfo();
    expect(customsInfo.declarationRequired).toBe(true);
    expect(customsInfo.prohibitedItems).toContain('新鲜水果和蔬菜');
    expect(customsInfo.dutyFree.alcohol).toBe('1升');
  });

  test('应该返回正确的交通信息', () => {
    const transportInfo = service.getTransportInfo();
    expect(transportInfo.options).toHaveLength(4);
    expect(transportInfo.recommendations.jfk).toBe('地铁或巴士最经济');
  });

  test('应该返回正确的货币信息', () => {
    const currencyInfo = service.getCurrencyInfo();
    expect(currencyInfo.code).toBe('USD');
    expect(currencyInfo.name).toBe('美元');
    expect(currencyInfo.denominations).toHaveLength(4);
  });

  test('应该正确检查ESTA申请时间', () => {
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 2); // 2天后

    const check = service.checkESTAApplicationTime(futureTime.toISOString());
    expect(check.canApply).toBe(true);
    expect(check.daysUntilArrival).toBe(2);
    expect(check.windowStatus).toBe('within_window');
  });

  test('应该正确检查ESTA状态', () => {
    const applicationDate = new Date();
    applicationDate.setHours(applicationDate.getHours() - 1); // 1小时前申请

    const status1 = service.checkESTAStatus(applicationDate.toISOString());
    expect(status1.status).toBe('processing');
    expect(status1.message).toContain('正在处理中');

    const approvalDate = new Date();
    approvalDate.setHours(approvalDate.getHours() - 1); // 1小时前批准

    const status2 = service.checkESTAStatus(applicationDate.toISOString(), approvalDate.toISOString());
    expect(status2.status).toBe('approved');
    expect(status2.message).toContain('已批准');
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
    service.completeStep('landing_setup');
    expect(service.getStepStatus('landing_setup')).toBe('completed');
    expect(service.getStepStatus('immigration_biometric')).toBe('pending');

    service.setCurrentStep('immigration_biometric');
    expect(service.getStepStatus('immigration_biometric')).toBe('current');
  });

  test('应该正确获取步骤图标', () => {
    const icon = service.getStepIcon('customs_inspection');
    expect(icon).toBe('🔍');
  });

  test('应该正确检查是否可以进入下一步', () => {
    // 第一步总是可以进入
    expect(service.canProceedToStep('emergency_contacts')).toBe(true);

    // 没有完成前面的步骤时不能进入
    expect(service.canProceedToStep('immigration_biometric')).toBe(false);

    // 完成前面步骤后可以进入
    service.completeStep('emergency_contacts');
    service.completeStep('landing_setup');
    expect(service.canProceedToStep('immigration_biometric')).toBe(true);
  });
});