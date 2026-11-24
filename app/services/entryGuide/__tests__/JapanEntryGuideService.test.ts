
// 日本入境指引服务测试
import JapanEntryGuideService from '../JapanEntryGuideService';

describe('JapanEntryGuideService', () => {
  let service;

  beforeEach(() => {
    service = new JapanEntryGuideService();
  });

  test('应该正确初始化服务', () => {
    expect(service).toBeDefined();
    expect(service.guide).toBeDefined();
    expect(service.guide.country).toBe('japan');
  });

  test('应该返回正确的步骤总数', () => {
    const progress = service.getProgress();
    expect(progress.total).toBe(7); // 日本7步骤流程
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('应该正确完成步骤', () => {
    const result = service.completeStep('visa_check');
    expect(result.completed).toBe(1);
    expect(result.percentage).toBe(14); // 1/7 ≈ 14.29，四舍五入为14
  });

  test('应该正确设置和获取当前步骤', () => {
    const step = service.setCurrentStep('biometric_preparation');
    expect(step.id).toBe('biometric_preparation');
    expect(service.currentStep).toBe('biometric_preparation');
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

  test('应该返回正确的签证信息', () => {
    const visaInfo = service.getVisaInfo();
    expect(visaInfo.required).toBe(true);
    expect(visaInfo.types).toContain('evisa');
    expect(visaInfo.checkUrl).toContain('mofa.go.jp');
  });

  test('应该返回正确的生物识别信息', () => {
    const biometricInfo = service.getBiometricInfo();
    expect(biometricInfo.required).toBe(true);
    expect(biometricInfo.types).toContain('fingerprint');
    expect(biometricInfo.types).toContain('facial_recognition');
  });

  test('应该返回正确的入境卡信息', () => {
    const entryCardInfo = service.getEntryCardInfo();
    expect(entryCardInfo.required).toBe(true);
    expect(entryCardInfo.sections).toContain('personal_information');
    expect(entryCardInfo.languages).toContain('ja');
    expect(entryCardInfo.languages).toContain('en');
  });

  test('应该返回正确的海关信息', () => {
    const customsInfo = service.getCustomsInfo();
    expect(customsInfo.declarationRequired).toBe(true);
    expect(customsInfo.prohibitedItems).toContain('新鲜水果和蔬菜');
    expect(customsInfo.dutyFree.alcohol).toBe('3瓶760ml以下的酒类');
  });

  test('应该返回正确的交通信息', () => {
    const transportInfo = service.getTransportInfo();
    expect(transportInfo.options).toHaveLength(3);
    expect(transportInfo.recommendations.nrt).toBe('Narita Express最方便快捷');
  });

  test('应该返回正确的货币信息', () => {
    const currencyInfo = service.getCurrencyInfo();
    expect(currencyInfo.code).toBe('JPY');
    expect(currencyInfo.name).toBe('日元');
    expect(currencyInfo.denominations).toHaveLength(4);
  });

  test('应该正确计算预计总时间', () => {
    const timeInfo = service.getEstimatedTotalTime();
    expect(timeInfo.minutes).toBeGreaterThan(0);
    expect(timeInfo.formatted).toMatch(/(分钟|小时)/);
    expect(timeInfo.breakdown).toHaveLength(7);
  });

  test('应该正确检查签证有效性', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90); // 90天后

    const check = service.checkVisaValidity(futureDate.toISOString(), new Date().toISOString());
    expect(check.isValid).toBe(true);
    expect(check.daysUntilExpiry).toBeGreaterThanOrEqual(90);
    expect(check.daysUntilExpiry).toBeLessThanOrEqual(91);
  });

  test('应该返回正确的推荐行动', () => {
    const actions = service.getRecommendedActions();
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0]).toHaveProperty('type');
    expect(actions[0]).toHaveProperty('title');
    expect(actions[0]).toHaveProperty('priority');
  });

  test('应该正确获取步骤状态', () => {
    service.completeStep('visa_check');
    expect(service.getStepStatus('visa_check')).toBe('completed');
    expect(service.getStepStatus('biometric_preparation')).toBe('pending');

    service.setCurrentStep('biometric_preparation');
    expect(service.getStepStatus('biometric_preparation')).toBe('current');
  });

  test('应该正确获取步骤图标', () => {
    const icon = service.getStepIcon('immigration_biometric');
    expect(icon).toBe('🛂');
  });

  test('应该正确检查是否可以进入下一步', () => {
    // 第一步总是可以进入
    expect(service.canProceedToStep('visa_check')).toBe(true);

    // 没有完成前面的步骤时不能进入
    expect(service.canProceedToStep('immigration_biometric')).toBe(false);

    // 完成前面步骤后可以进入
    service.completeStep('visa_check');
    service.completeStep('biometric_preparation');
    service.completeStep('landing_setup');
    expect(service.canProceedToStep('immigration_biometric')).toBe(true);
  });
});