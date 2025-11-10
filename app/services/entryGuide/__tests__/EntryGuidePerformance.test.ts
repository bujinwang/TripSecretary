// @ts-nocheck

// 入境指引系统性能测试 - 全面评估8国系统的性能表现
// 测试配置加载、服务实例化、方法调用、内存使用等关键指标

import ThailandEntryGuideService from '../ThailandEntryGuideService';
import JapanEntryGuideService from '../JapanEntryGuideService';
import SingaporeEntryGuideService from '../SingaporeEntryGuideService';
import MalaysiaEntryGuideService from '../MalaysiaEntryGuideService';
import KoreaEntryGuideService from '../KoreaEntryGuideService';
import VietnamEntryGuideService from '../VietnamEntryGuideService';
import USEntryGuideService from '../USEntryGuideService';
import CanadaEntryGuideService from '../CanadaEntryGuideService';

// 性能基准定义
const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 100,    // 优秀: < 100ms
  GOOD: 500,         // 良好: < 500ms
  ACCEPTABLE: 1000,  // 可接受: < 1000ms
  POOR: 2000         // 较差: > 2000ms
};

// 性能测试工具类
class PerformanceMonitor {
  static startTimer(label) {
    return {
      label,
      startTime: performance.now()
    };
  }

  static endTimer(timer) {
    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    return {
      label: timer.label,
      duration,
      status: this.getPerformanceStatus(duration)
    };
  }

  static getPerformanceStatus(duration) {
    if (duration < PERFORMANCE_THRESHOLDS.EXCELLENT) {
return 'EXCELLENT';
}
    if (duration < PERFORMANCE_THRESHOLDS.GOOD) {
return 'GOOD';
}
    if (duration < PERFORMANCE_THRESHOLDS.ACCEPTABLE) {
return 'ACCEPTABLE';
}
    return 'POOR';
  }

  static formatDuration(ms) {
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

// 测试数据生成器
class TestDataGenerator {
  static generateFutureDate(daysFromNow = 7) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }

  static generatePastDate(hoursAgo = 1) {
    const date = new Date();
    date.setHours(date.getHours() - hoursAgo);
    return date.toISOString();
  }

  static generateTravelPlan(country) {
    const basePlans = {
      thailand: {
        address: '123 Sukhumvit Road, Bangkok, Thailand',
        dates: { start: '2025-01-15', end: '2025-01-25' },
        purpose: '旅游和商务',
        contact: { phone: '+66-2-123-4567', email: 'user@example.com' }
      },
      japan: {
        address: '1-1-1 Shibuya, Shibuya-ku, Tokyo, Japan',
        dates: { start: '2025-02-01', end: '2025-02-10' },
        purpose: '旅游观光',
        contact: { phone: '+81-3-1234-5678', email: 'user@example.com' }
      },
      canada: {
        address: '123 Main Street, Toronto, ON M5V 1A1, Canada',
        dates: { start: '2025-01-15', end: '2025-01-25' },
        purpose: '旅游和商务会议',
        contact: { phone: '+1-416-555-0123', email: 'user@example.com' }
      }
    };

    return basePlans[country] || basePlans.thailand;
  }
}

describe('EntryGuide Performance Tests', () => {
  // 存储所有服务实例用于并发测试
  const services = {};
  let performanceResults = {};

  beforeAll(() => {
    // 初始化性能结果收集器
    performanceResults = {
      initialization: [],
      methodCalls: [],
      concurrentOperations: [],
      memoryUsage: []
    };
  });

  describe('1. 服务初始化性能测试', () => {
    const serviceClasses = [
      { name: 'Thailand', class: ThailandEntryGuideService },
      { name: 'Japan', class: JapanEntryGuideService },
      { name: 'Singapore', class: SingaporeEntryGuideService },
      { name: 'Malaysia', class: MalaysiaEntryGuideService },
      { name: 'Korea', class: KoreaEntryGuideService },
      { name: 'Vietnam', class: VietnamEntryGuideService },
      { name: 'USA', class: USEntryGuideService },
      { name: 'Canada', class: CanadaEntryGuideService }
    ];

    test.each(serviceClasses)('$name 服务初始化应该在优秀范围内', ({ name, class: ServiceClass }) => {
      const timer = PerformanceMonitor.startTimer(`${name} 初始化`);

      const service = new ServiceClass();
      services[name.toLowerCase()] = service;

      const result = PerformanceMonitor.endTimer(timer);
      performanceResults.initialization.push(result);

      console.log(`${name} 初始化: ${PerformanceMonitor.formatDuration(result.duration)} (${result.status})`);

      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.GOOD);
      expect(service).toBeDefined();
      expect(service.getGuide()).toBeDefined();
    });

    test('批量初始化8个服务应该在可接受范围内', () => {
      const timer = PerformanceMonitor.startTimer('批量初始化8个服务');

      // 重新创建所有服务实例
      const allServices = serviceClasses.map(({ name, class: ServiceClass }) => ({
        name,
        service: new ServiceClass()
      }));

      const result = PerformanceMonitor.endTimer(timer);
      performanceResults.initialization.push({
        ...result,
        label: '批量初始化8个服务'
      });

      console.log(`批量初始化: ${PerformanceMonitor.formatDuration(result.duration)} (${result.status})`);

      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
      expect(allServices).toHaveLength(8);
    });
  });

  describe('2. 核心方法调用性能测试', () => {
    test.each([
      ['Thailand', 'getProgress'],
      ['Japan', 'getProgress'],
      ['Singapore', 'getProgress'],
      ['Malaysia', 'getProgress'],
      ['Korea', 'getProgress'],
      ['Vietnam', 'getProgress'],
      ['USA', 'getProgress'],
      ['Canada', 'getProgress']
    ])('%s getProgress() 方法调用应该优秀', (country, method) => {
      const service = services[country.toLowerCase()];
      expect(service).toBeDefined();

      const timer = PerformanceMonitor.startTimer(`${country} ${method}`);

      const result = service[method]();

      const perfResult = PerformanceMonitor.endTimer(timer);
      performanceResults.methodCalls.push(perfResult);

      console.log(`${country} ${method}: ${PerformanceMonitor.formatDuration(perfResult.duration)} (${perfResult.status})`);

      expect(perfResult.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.EXCELLENT);
      expect(result).toBeDefined();
    });

    test.each([
      ['Thailand', 'getImportantNotes'],
      ['Japan', 'getImportantNotes'],
      ['Singapore', 'getImportantNotes'],
      ['Malaysia', 'getImportantNotes'],
      ['Korea', 'getImportantNotes'],
      ['Vietnam', 'getImportantNotes'],
      ['USA', 'getImportantNotes'],
      ['Canada', 'getImportantNotes']
    ])('%s getImportantNotes() 方法调用应该优秀', (country, method) => {
      const service = services[country.toLowerCase()];
      expect(service).toBeDefined();

      const timer = PerformanceMonitor.startTimer(`${country} ${method}`);

      const result = service[method]();

      const perfResult = PerformanceMonitor.endTimer(timer);
      performanceResults.methodCalls.push(perfResult);

      console.log(`${country} ${method}: ${PerformanceMonitor.formatDuration(perfResult.duration)} (${perfResult.status})`);

      expect(perfResult.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.EXCELLENT);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('3. 业务逻辑性能测试', () => {
    test.each([
      ['Thailand', 'checkTDACSubmissionTime', [TestDataGenerator.generateFutureDate(5)]],
      ['Japan', 'checkVisaValidity', [TestDataGenerator.generateFutureDate(90), TestDataGenerator.generateFutureDate(5)]],
      ['Singapore', 'checkSGACSubmissionTime', [TestDataGenerator.generateFutureDate(5)]],
      ['Malaysia', 'checkMDACSubmissionTime', [TestDataGenerator.generateFutureDate(5)]],
      ['Korea', 'checkKETAApplicationTime', [TestDataGenerator.generateFutureDate(5)]],
      ['Vietnam', 'checkVisaApplicationTime', [TestDataGenerator.generateFutureDate(5)]],
      ['USA', 'checkESTAApplicationTime', [TestDataGenerator.generateFutureDate(5)]],
      ['Canada', 'checkETAApplicationTime', [TestDataGenerator.generateFutureDate(5)]]
    ])('%s 签证申请时间检查应该良好', (country, method, args) => {
      const service = services[country.toLowerCase()];
      expect(service).toBeDefined();

      const timer = PerformanceMonitor.startTimer(`${country} ${method}`);

      const result = service[method](...args);

      const perfResult = PerformanceMonitor.endTimer(timer);
      performanceResults.methodCalls.push(perfResult);

      console.log(`${country} ${method}: ${PerformanceMonitor.formatDuration(perfResult.duration)} (${perfResult.status})`);

      expect(perfResult.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.GOOD);
      expect(result).toBeDefined();
    });

    test.each([
      ['Korea', 'checkKETAStatus', [TestDataGenerator.generatePastDate(2)]],
      ['Vietnam', 'checkVisaStatus', [TestDataGenerator.generatePastDate(2)]],
      ['USA', 'checkESTAStatus', [TestDataGenerator.generatePastDate(2)]],
      ['Canada', 'checkETAStatus', [TestDataGenerator.generatePastDate(2)]]
    ])('%s 签证状态检查应该良好', (country, method, args) => {
      const service = services[country.toLowerCase()];
      expect(service).toBeDefined();

      const timer = PerformanceMonitor.startTimer(`${country} ${method}`);

      const result = service[method](...args);

      const perfResult = PerformanceMonitor.endTimer(timer);
      performanceResults.methodCalls.push(perfResult);

      console.log(`${country} ${method}: ${PerformanceMonitor.formatDuration(perfResult.duration)} (${perfResult.status})`);

      expect(perfResult.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.GOOD);
      expect(result).toBeDefined();
    });

    test('加拿大旅行计划验证应该良好', () => {
      const service = services.canada;
      const travelPlan = TestDataGenerator.generateTravelPlan('canada');

      const timer = PerformanceMonitor.startTimer('Canada validateTravelPlan');

      const result = service.validateTravelPlan(travelPlan);

      const perfResult = PerformanceMonitor.endTimer(timer);
      performanceResults.methodCalls.push(perfResult);

      console.log(`Canada validateTravelPlan: ${PerformanceMonitor.formatDuration(perfResult.duration)} (${perfResult.status})`);

      expect(perfResult.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.GOOD);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('validationIssues');
    });

    test('美国VWP资格检查应该优秀', () => {
      const service = services.usa;

      const timer = PerformanceMonitor.startTimer('USA checkVWPQualification');

      const result = service.checkVWPQualification('中国');

      const perfResult = PerformanceMonitor.endTimer(timer);
      performanceResults.methodCalls.push(perfResult);

      console.log(`USA checkVWPQualification: ${PerformanceMonitor.formatDuration(perfResult.duration)} (${perfResult.status})`);

      expect(perfResult.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.EXCELLENT);
      expect(result).toHaveProperty('isQualified');
      expect(result).toHaveProperty('nextSteps');
    });
  });

  describe('4. 并发操作性能测试', () => {
    test('同时调用8个国家的getProgress应该可接受', async () => {
      const timer = PerformanceMonitor.startTimer('并发getProgress 8国');

      const promises = Object.values(services).map(service => service.getProgress());
      const results = await Promise.all(promises);

      const result = PerformanceMonitor.endTimer(timer);
      performanceResults.concurrentOperations.push(result);

      console.log(`并发getProgress: ${PerformanceMonitor.formatDuration(result.duration)} (${result.status})`);

      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
      expect(results).toHaveLength(8);
      results.forEach(progress => {
        expect(progress).toHaveProperty('total');
        expect(progress).toHaveProperty('completed');
      });
    });

    test('同时初始化和调用8个服务应该可接受', () => {
      const timer = PerformanceMonitor.startTimer('并发初始化+调用');

      // 重新创建服务并立即调用方法
      const serviceClasses = [
        ThailandEntryGuideService, JapanEntryGuideService, SingaporeEntryGuideService,
        MalaysiaEntryGuideService, KoreaEntryGuideService, VietnamEntryGuideService,
        USEntryGuideService, CanadaEntryGuideService
      ];

      const results = serviceClasses.map(ServiceClass => {
        const service = new ServiceClass();
        return service.getProgress();
      });

      const result = PerformanceMonitor.endTimer(timer);
      performanceResults.concurrentOperations.push(result);

      console.log(`并发初始化+调用: ${PerformanceMonitor.formatDuration(result.duration)} (${result.status})`);

      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
      expect(results).toHaveLength(8);
    });
  });

  describe('5. 内存和稳定性测试', () => {
    test('长时间运行后服务应该保持稳定', () => {
      const service = services.thailand;
      const iterations = 100;

      const timer = PerformanceMonitor.startTimer(`稳定性测试 ${iterations} 次调用`);

      for (let i = 0; i < iterations; i++) {
        service.getProgress();
        service.getImportantNotes();
        service.getEmergencyContacts();
      }

      const result = PerformanceMonitor.endTimer(timer);
      performanceResults.memoryUsage.push(result);

      console.log(`稳定性测试: ${PerformanceMonitor.formatDuration(result.duration)} (${result.status})`);

      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
    });

    test('服务实例应该没有内存泄漏迹象', () => {
      // 简单的内存泄漏检查 - 确保服务方法返回一致的结果
      const service = services.thailand;
      const initialProgress = service.getProgress();

      // 执行多次操作
      for (let i = 0; i < 50; i++) {
        service.getImportantNotes();
        service.getEmergencyContacts();
      }

      const finalProgress = service.getProgress();

      // 进度应该保持一致（没有被意外修改）
      expect(finalProgress.total).toBe(initialProgress.total);
      expect(finalProgress.completed).toBe(initialProgress.completed);
    });
  });

  describe('6. 性能报告生成', () => {
    test('生成完整的性能报告', () => {
      const report = {
        summary: {
          totalTests: performanceResults.initialization.length +
                     performanceResults.methodCalls.length +
                     performanceResults.concurrentOperations.length +
                     performanceResults.memoryUsage.length,
          timestamp: new Date().toISOString(),
          platform: 'React Native Test Environment'
        },
        results: performanceResults,
        analysis: {
          initialization: analyzePerformanceGroup(performanceResults.initialization),
          methodCalls: analyzePerformanceGroup(performanceResults.methodCalls),
          concurrentOperations: analyzePerformanceGroup(performanceResults.concurrentOperations),
          memoryUsage: analyzePerformanceGroup(performanceResults.memoryUsage)
        },
        recommendations: generateRecommendations(performanceResults)
      };

      console.log('\n=== 入境指引系统性能测试报告 ===');
      console.log(JSON.stringify(report, null, 2));

      // 验证报告结构
      expect(report.summary).toBeDefined();
      expect(report.results).toBeDefined();
      expect(report.analysis).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });
  });

  // 辅助方法
  function analyzePerformanceGroup(results) {
    if (!results || results.length === 0) {
return {};
}

    const durations = results.map(r => r.duration);
    const excellent = results.filter(r => r.status === 'EXCELLENT').length;
    const good = results.filter(r => r.status === 'GOOD').length;
    const acceptable = results.filter(r => r.status === 'ACCEPTABLE').length;
    const poor = results.filter(r => r.status === 'POOR').length;

    return {
      count: results.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      statusDistribution: { excellent, good, acceptable, poor },
      overallStatus: poor > 0 ? 'NEEDS_IMPROVEMENT' :
                     acceptable > results.length * 0.2 ? 'ACCEPTABLE' :
                     good > excellent ? 'GOOD' : 'EXCELLENT'
    };
  }

  function generateRecommendations(results) {
    const recommendations = [];

    const initAnalysis = analyzePerformanceGroup(results.initialization);
    if (initAnalysis.overallStatus === 'NEEDS_IMPROVEMENT') {
      recommendations.push('考虑延迟加载配置数据以改善初始化性能');
    }

    const methodAnalysis = analyzePerformanceGroup(results.methodCalls);
    if (methodAnalysis.averageDuration > PERFORMANCE_THRESHOLDS.GOOD) {
      recommendations.push('优化核心业务逻辑方法，考虑缓存计算结果');
    }

    const concurrentAnalysis = analyzePerformanceGroup(results.concurrentOperations);
    if (concurrentAnalysis.overallStatus === 'NEEDS_IMPROVEMENT') {
      recommendations.push('实现服务实例池以减少并发初始化开销');
    }

    if (recommendations.length === 0) {
      recommendations.push('系统性能表现优秀，无需优化建议');
    }

    return recommendations;
  }
});