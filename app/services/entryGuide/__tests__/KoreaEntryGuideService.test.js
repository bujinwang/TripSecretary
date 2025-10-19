// 韩国入境指引服务测试
import KoreaEntryGuideService from '../KoreaEntryGuideService.js';

describe('KoreaEntryGuideService', () => {
  let service;

  beforeEach(() => {
    service = new KoreaEntryGuideService();
  });

  test('应该正确初始化服务', () => {
    expect(service).toBeDefined();
    expect(service.guide).toBeDefined();
    expect(service.guide.country).toBe('korea');
  });

  test('应该返回正确的步骤总数', () => {
    const progress = service.getProgress();
    expect(progress.total).toBe(6); // 韩国6步骤流程
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('应该正确完成步骤', () => {
    const result = service.completeStep('keta_application');
    expect(result.completed).toBe(1);
    expect(result.percentage).toBe(17); // 1/6 ≈ 16.67，四舍五入为17
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

  test('应该返回正确的K-ETA信息', () => {
    const ketaInfo = service.getKETAInfo();
    expect(ketaInfo.systemName).toBe('Korea Electronic Travel Authorization');
    expect(ketaInfo.applicationWindow).toBe('72小时');
    expect(ketaInfo.cost).toBe('约20,000韩元');
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
    expect(entryCardInfo.languages).toContain('ko');
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
    expect(transportInfo.recommendations.icn).toBe('AREX地铁最快捷');
  });

  test('应该返回正确的货币信息', () => {
    const currencyInfo = service.getCurrencyInfo();
    expect(currencyInfo.code).toBe('KRW');
    expect(currencyInfo.name).toBe('韩元');
    expect(currencyInfo.denominations).toHaveLength(4);
  });

  test('应该正确检查K-ETA申请时间', () => {
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 2); // 2天后

    const check = service.checkKETAApplicationTime(futureTime.toISOString());
    expect(check.canApply).toBe(true);
    expect(check.daysUntilArrival).toBe(2);
    expect(check.windowStatus).toBe('within_window');
  });

  test('应该正确检查K-ETA状态', () => {
    const applicationDate = new Date();
    applicationDate.setHours(applicationDate.getHours() - 2); // 2小时前申请

    const status1 = service.checkKETAStatus(applicationDate.toISOString());
    expect(status1.status).toBe('processing');
    expect(status1.message).toContain('正在处理中');

    const approvalDate = new Date();
    approvalDate.setHours(approvalDate.getHours() - 1); // 1小时前批准

    const status2 = service.checkKETAStatus(applicationDate.toISOString(), approvalDate.toISOString());
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
    service.completeStep('keta_application');
    expect(service.getStepStatus('keta_application')).toBe('completed');
    expect(service.getStepStatus('immigration_biometric')).toBe('pending');

    service.setCurrentStep('immigration_biometric');
    expect(service.getStepStatus('immigration_biometric')).toBe('current');
  });

  test('应该正确获取步骤图标', () => {
    const icon = service.getStepIcon('customs_declaration');
    expect(icon).toBe('🔍');
  });

  test('应该正确检查是否可以进入下一步', () => {
    // 第一步总是可以进入
    expect(service.canProceedToStep('keta_application')).toBe(true);

    // 没有完成前面的步骤时不能进入
    expect(service.canProceedToStep('immigration_biometric')).toBe(false);

    // 完成前面步骤后可以进入
    service.completeStep('keta_application');
    service.completeStep('biometric_preparation');
    service.completeStep('landing_setup');
    expect(service.canProceedToStep('immigration_biometric')).toBe(true);
  });
});