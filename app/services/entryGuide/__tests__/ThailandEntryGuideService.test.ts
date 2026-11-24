
// 泰国入境指引服务测试
import ThailandEntryGuideService from '../ThailandEntryGuideService';

describe('ThailandEntryGuideService', () => {
  let service;

  beforeEach(() => {
    service = new ThailandEntryGuideService();
  });

  test('应该正确初始化服务', () => {
    expect(service).toBeDefined();
    expect(service.guide).toBeDefined();
    expect(service.guide.country).toBe('thailand');
  });

  test('应该返回正确的步骤总数', () => {
    const progress = service.getProgress();
    expect(progress.total).toBe(6); // 泰国6步骤流程 (从落地后开始)
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('应该正确完成步骤', () => {
    const result = service.completeStep('landing_setup');
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

  test('应该返回正确的TDAC信息', () => {
    const tdacInfo = service.getTDACInfo();
    expect(tdacInfo.required).toBe(true);
    expect(tdacInfo.submissionWindow).toBe('72小时');
    expect(tdacInfo.qrCodeRequired).toBe(true);
  });

  test('应该返回正确的ATM信息', () => {
    const atmInfo = service.getATMInfo();
    expect(atmInfo).toBeDefined();
    expect(atmInfo.location).toContain('到达大厅1楼');
    expect(atmInfo.recommendedBanks).toContain('Bangkok Bank(曼谷银行)');
    expect(atmInfo.fees.atmFee).toBe(220);
  });

  test('应该返回正确的出租车信息', () => {
    const taxiInfo = service.getTaxiInfo();
    expect(taxiInfo).toBeDefined();
    expect(taxiInfo.officialCounter.location).toContain('6号门或8号门');
    expect(taxiInfo.cost.total).toBe('320-470泰铢');
  });

  test('应该正确计算预计总时间', () => {
    const timeInfo = service.getEstimatedTotalTime();
    expect(timeInfo.minutes).toBeGreaterThan(0);
    expect(timeInfo.formatted).toContain('分钟');
    expect(timeInfo.breakdown).toHaveLength(6); // 调整为6步骤
  });

  test('应该正确检查TDAC提交时间', () => {
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 48); // 48小时后

    const check = service.checkTDACSubmissionTime(futureTime.toISOString());
    expect(check.canSubmit).toBe(true);
    expect(check.hoursUntilArrival).toBe(48);
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
    expect(service.getStepStatus('immigration')).toBe('pending');

    service.setCurrentStep('immigration');
    expect(service.getStepStatus('immigration')).toBe('current');
  });

  test('应该正确获取步骤图标', () => {
    const icon = service.getStepIcon('atm_withdrawal');
    expect(icon).toBe('💰');
  });

  test('应该正确检查是否可以进入下一步', () => {
    // 第一步总是可以进入
    expect(service.canProceedToStep('landing_setup')).toBe(true);

    // 没有完成前面的步骤时不能进入
    expect(service.canProceedToStep('immigration')).toBe(false);

    // 完成前面步骤后可以进入
    service.completeStep('landing_setup');
    expect(service.canProceedToStep('immigration')).toBe(true);
  });
});
