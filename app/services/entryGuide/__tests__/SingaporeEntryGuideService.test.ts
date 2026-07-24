
// 新加坡入境指引服务测试
import SingaporeEntryGuideService from '../SingaporeEntryGuideService';

describe('SingaporeEntryGuideService', () => {
  let service;

  beforeEach(() => {
    service = new SingaporeEntryGuideService();
  });

  test('应该正确初始化服务', () => {
    expect(service).toBeDefined();
    expect(service.guide).toBeDefined();
    expect(service.guide.country).toBe('singapore');
  });

  test('应该返回正确的步骤总数', () => {
    const progress = service.getProgress();
    expect(progress.total).toBe(6); // 新加坡6步骤流程
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('应该正确完成步骤', () => {
    const result = service.completeStep('sgac_submission');
    expect(result.completed).toBe(1);
    expect(result.percentage).toBe(17); // 1/6 ≈ 16.67，四舍五入为17
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

  test('应该返回正确的SGAC信息', () => {
    const sgacInfo = service.getSGACInfo();
    expect(sgacInfo.systemName).toBe('Singapore Arrival Card');
    expect(sgacInfo.submissionWindow.before).toBe('3天');
    expect(sgacInfo.submissionWindow.after).toBe('15天');
    expect(sgacInfo.cost).toBe('免费');
  });

  test('应该返回正确的资金证明要求', () => {
    const fundingReq = service.getFundingRequirements();
    expect(fundingReq.minimumAmount.perPerson).toBe(30000);
    expect(fundingReq.minimumAmount.family).toBe(50000);
    expect(fundingReq.acceptedProofs).toContain('银行存款证明');
  });

  test('应该返回正确的地址要求', () => {
    const addressReq = service.getAddressRequirements();
    expect(addressReq.required).toBe(true);
    expect(addressReq.formats).toContain('酒店名称和地址');
    expect(addressReq.validation).toContain('地址必须具体到门牌号');
  });

  test('应该返回正确的海关信息', () => {
    const customsInfo = service.getCustomsInfo();
    expect(customsInfo.declarationRequired).toBe(true);
    expect(customsInfo.prohibitedItems).toContain('毒品及其制品');
    expect(customsInfo.dutyFree.alcohol).toBe('1升');
  });

  test('应该返回正确的交通信息', () => {
    const transportInfo = service.getTransportInfo();
    expect(transportInfo.options).toHaveLength(4);
    expect(transportInfo.recommendations.budget).toBe('地铁MRT最经济');
  });

  test('应该返回正确的货币信息', () => {
    const currencyInfo = service.getCurrencyInfo();
    expect(currencyInfo.code).toBe('SGD');
    expect(currencyInfo.name).toBe('新加坡元');
    expect(currencyInfo.denominations).toHaveLength(4);
  });

  test('应该正确检查资金证明是否充足', () => {
    const check1 = service.checkFundingAdequacy(35000, 1);
    expect(check1.isAdequate).toBe(true);
    expect(check1.message).toContain('资金证明充足');

    const check2 = service.checkFundingAdequacy(25000, 1);
    expect(check2.isAdequate).toBe(false);
    expect(check2.shortfall).toBe(5000);
    expect(check2.message).toContain('资金证明不足');
  });

  test('应该正确检查SGAC提交时间', () => {
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 2); // 2天后

    const check = service.checkSGACSubmissionTime(futureTime.toISOString());
    expect(check.canSubmit).toBe(true);
    expect(check.daysUntilArrival).toBe(2);
    expect(check.windowStatus).toBe('within_window');
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
    service.completeStep('sgac_submission');
    expect(service.getStepStatus('sgac_submission')).toBe('completed');
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
    expect(service.canProceedToStep('sgac_submission')).toBe(true);

    // 没有完成前面的步骤时不能进入
    expect(service.canProceedToStep('immigration')).toBe(false);

    // 完成前面步骤后可以进入
    service.completeStep('sgac_submission');
    service.completeStep('preparation');
    service.completeStep('landing_setup');
    expect(service.canProceedToStep('immigration')).toBe(true);
  });
});