// @ts-nocheck

// 马来西亚入境指引服务测试
import MalaysiaEntryGuideService from '../MalaysiaEntryGuideService';

describe('MalaysiaEntryGuideService', () => {
  let service;

  beforeEach(() => {
    service = new MalaysiaEntryGuideService();
  });

  test('应该正确初始化服务', () => {
    expect(service).toBeDefined();
    expect(service.guide).toBeDefined();
    expect(service.guide.country).toBe('malaysia');
  });

  test('应该返回正确的步骤总数', () => {
    const progress = service.getProgress();
    expect(progress.total).toBe(7); // 马来西亚7步骤流程
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('应该正确完成步骤', () => {
    const result = service.completeStep('mdac_submission');
    expect(result.completed).toBe(1);
    expect(result.percentage).toBe(14); // 1/7 ≈ 14.29，四舍五入为14
  });

  test('应该正确设置和获取当前步骤', () => {
    const step = service.setCurrentStep('immigration');
    expect(step.id).toBe('immigration');
    expect(service.currentStep).toBe('immigration');
  });

  test('应该返回正确的下一步', () => {
    service.setCurrentStep('landing_setup');
    const nextStep = service.getNextStep();
    expect(nextStep.id).toBe('immigration');
  });

  test('应该返回正确的上一步', () => {
    service.setCurrentStep('immigration');
    const prevStep = service.getPreviousStep();
    expect(prevStep.id).toBe('landing_setup');
  });

  test('应该返回正确的MDAC信息', () => {
    const mdacInfo = service.getMDACInfo();
    expect(mdacInfo.systemName).toBe('Malaysia Digital Arrival Card');
    expect(mdacInfo.submissionWindow).toBe('3天');
    expect(mdacInfo.cost).toBe('免费');
  });

  test('应该返回正确的资金证明要求', () => {
    const fundingReq = service.getFundingRequirements();
    expect(fundingReq.minimumAmount.perPerson).toBe(350);
    expect(fundingReq.minimumAmount.family).toBe(500);
    expect(fundingReq.acceptedProofs).toContain('银行存款证明');
  });

  test('应该返回正确的地区差异信息', () => {
    const regionalDiff = service.getRegionalDifferences();
    expect(regionalDiff.westMalaysia.name).toBe('西马来西亚');
    expect(regionalDiff.eastMalaysia.name).toBe('东马来西亚');
  });

  test('应该正确检查地区特定要求', () => {
    const westCheck = service.checkRegionalRequirements('KUL');
    expect(westCheck.region).toBe('west');
    expect(westCheck.name).toBe('西马来西亚');
    expect(westCheck.additionalCheck).toBe(false);

    const eastCheck = service.checkRegionalRequirements('BKI');
    expect(eastCheck.region).toBe('east');
    expect(eastCheck.name).toBe('东马来西亚');
    expect(eastCheck.additionalCheck).toBe(true);
  });

  test('应该返回正确的海关信息', () => {
    const customsInfo = service.getCustomsInfo();
    expect(customsInfo.declarationRequired).toBe(true);
    expect(customsInfo.prohibitedItems).toContain('猪肉及其制品');
    expect(customsInfo.dutyFree.alcohol).toBe('1升');
  });

  test('应该返回正确的交通信息', () => {
    const transportInfo = service.getTransportInfo();
    expect(transportInfo.options).toHaveLength(4);
    expect(transportInfo.recommendations.kul).toBe('KLIA Express最快捷');
  });

  test('应该返回正确的货币信息', () => {
    const currencyInfo = service.getCurrencyInfo();
    expect(currencyInfo.code).toBe('MYR');
    expect(currencyInfo.name).toBe('马来西亚林吉特');
    expect(currencyInfo.denominations).toHaveLength(4);
  });

  test('应该正确检查资金证明是否充足', () => {
    const check1 = service.checkFundingAdequacy(400, 1);
    expect(check1.isAdequate).toBe(true);
    expect(check1.message).toContain('资金证明充足');

    const check2 = service.checkFundingAdequacy(300, 1);
    expect(check2.isAdequate).toBe(false);
    expect(check2.shortfall).toBe(50);
    expect(check2.message).toContain('资金证明不足');
  });

  test('应该正确检查MDAC提交时间', () => {
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 2); // 2天后

    const check = service.checkMDACSubmissionTime(futureTime.toISOString());
    expect(check.canSubmit).toBe(true);
    expect(check.daysUntilArrival).toBe(2);
    expect(check.windowStatus).toBe('within_window');
  });

  test('应该正确计算预计总时间', () => {
    const timeInfo = service.getEstimatedTotalTime();
    expect(timeInfo.minutes).toBeGreaterThan(0);
    expect(timeInfo.formatted).toContain('分钟');
    expect(timeInfo.breakdown).toHaveLength(7);
  });

  test('应该返回正确的推荐行动', () => {
    const actions = service.getRecommendedActions();
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0]).toHaveProperty('type');
    expect(actions[0]).toHaveProperty('title');
    expect(actions[0]).toHaveProperty('priority');
  });

  test('应该正确获取步骤状态', () => {
    service.completeStep('mdac_submission');
    expect(service.getStepStatus('mdac_submission')).toBe('completed');
    expect(service.getStepStatus('immigration')).toBe('pending');

    service.setCurrentStep('immigration');
    expect(service.getStepStatus('immigration')).toBe('current');
  });

  test('应该正确获取步骤图标', () => {
    const icon = service.getStepIcon('customs_inspection');
    expect(icon).toBe('🔍');
  });

  test('应该正确检查是否可以进入下一步', () => {
    // 第一步总是可以进入
    expect(service.canProceedToStep('mdac_submission')).toBe(true);

    // 没有完成前面的步骤时不能进入
    expect(service.canProceedToStep('immigration')).toBe(false);

    // 完成前面步骤后可以进入
    service.completeStep('mdac_submission');
    service.completeStep('visa_check');
    service.completeStep('preparation');
    service.completeStep('landing_setup');
    expect(service.canProceedToStep('immigration')).toBe(true);
  });
});