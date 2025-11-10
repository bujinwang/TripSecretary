// @ts-nocheck

// 越南入境指引服务测试
import VietnamEntryGuideService from '../VietnamEntryGuideService';

describe('VietnamEntryGuideService', () => {
  let service;

  beforeEach(() => {
    service = new VietnamEntryGuideService();
  });

  test('应该正确初始化服务', () => {
    expect(service).toBeDefined();
    expect(service.guide).toBeDefined();
    expect(service.guide.country).toBe('vietnam');
  });

  test('应该返回正确的步骤总数', () => {
    const progress = service.getProgress();
    expect(progress.total).toBe(6); // 越南6步骤流程
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('应该正确完成步骤', () => {
    const result = service.completeStep('visa_application');
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

  test('应该返回正确的签证信息', () => {
    const visaInfo = service.getVisaInfo();
    expect(visaInfo.types).toHaveLength(3);
    expect(visaInfo.cost).toBe('25-80美元（视类型而定）');
  });

  test('应该返回正确的健康要求', () => {
    const healthReq = service.getHealthRequirements();
    expect(healthReq.yellowFever.required).toBe(true);
    expect(healthReq.healthDeclaration.required).toBe(true);
  });

  test('应该返回正确的资金证明要求', () => {
    const fundingReq = service.getFundingRequirements();
    expect(fundingReq.minimumAmount.perPerson).toBe(2000);
    expect(fundingReq.minimumAmount.family).toBe(3000);
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
    expect(transportInfo.recommendations.han).toBe('Grab打车最方便');
  });

  test('应该返回正确的货币信息', () => {
    const currencyInfo = service.getCurrencyInfo();
    expect(currencyInfo.code).toBe('VND');
    expect(currencyInfo.name).toBe('越南盾');
    expect(currencyInfo.denominations).toHaveLength(4);
  });

  test('应该正确检查签证申请时间', () => {
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 5); // 5天后

    const check = service.checkVisaApplicationTime(futureTime.toISOString());
    expect(check.canApply).toBe(true);
    expect(check.daysUntilArrival).toBe(5);
    expect(check.windowStatus).toBe('within_window');
  });

  test('应该正确检查签证状态', () => {
    const applicationDate = new Date();
    applicationDate.setHours(applicationDate.getHours() - 24); // 24小时前申请

    const status1 = service.checkVisaStatus(applicationDate.toISOString());
    expect(status1.status).toBe('processing');
    expect(status1.message).toContain('正在处理中');

    const approvalDate = new Date();
    approvalDate.setHours(approvalDate.getHours() - 1); // 1小时前批准

    const status2 = service.checkVisaStatus(applicationDate.toISOString(), approvalDate.toISOString());
    expect(status2.status).toBe('approved');
    expect(status2.message).toContain('已批准');
  });

  test('应该正确检查资金证明是否充足', () => {
    const check1 = service.checkFundingAdequacy(2500, 1);
    expect(check1.isAdequate).toBe(true);
    expect(check1.message).toContain('资金证明充足');

    const check2 = service.checkFundingAdequacy(1500, 1);
    expect(check2.isAdequate).toBe(false);
    expect(check2.shortfall).toBe(500);
    expect(check2.message).toContain('资金证明不足');
  });

  test('应该正确检查黄热病疫苗要求', () => {
    const travelHistory1 = ['Brazil', 'Argentina'];
    const check1 = service.checkYellowFeverRequirement(travelHistory1);
    expect(check1.required).toBe(true);
    expect(check1.message).toContain('需要黄热病疫苗');

    const travelHistory2 = ['Japan', 'Singapore'];
    const check2 = service.checkYellowFeverRequirement(travelHistory2);
    expect(check2.required).toBe(false);
    expect(check2.message).toContain('无需黄热病疫苗');
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
    service.completeStep('visa_application');
    expect(service.getStepStatus('visa_application')).toBe('completed');
    expect(service.getStepStatus('immigration_check')).toBe('pending');

    service.setCurrentStep('immigration_check');
    expect(service.getStepStatus('immigration_check')).toBe('current');
  });

  test('应该正确获取步骤图标', () => {
    const icon = service.getStepIcon('customs_inspection');
    expect(icon).toBe('🔍');
  });

  test('应该正确检查是否可以进入下一步', () => {
    // 第一步总是可以进入
    expect(service.canProceedToStep('visa_application')).toBe(true);

    // 没有完成前面的步骤时不能进入
    expect(service.canProceedToStep('immigration_check')).toBe(false);

    // 完成前面步骤后可以进入
    service.completeStep('visa_application');
    service.completeStep('health_declaration');
    service.completeStep('landing_setup');
    expect(service.canProceedToStep('immigration_check')).toBe(true);
  });
});