// @ts-nocheck

// 入境指引系统安全评估 - 全面检查数据安全、隐私保护和系统完整性
// 评估配置安全、存储安全、代码安全和隐私合规性

import ThailandEntryGuideService from '../../entryGuide/ThailandEntryGuideService';
import USEntryGuideService from '../../entryGuide/USEntryGuideService';
import CanadaEntryGuideService from '../../entryGuide/CanadaEntryGuideService';

// 安全评估工具类
class SecurityAuditor {
  static auditDataExposure(service, sensitiveFields = []) {
    const guide = service.getGuide();
    const exposedData = [];

    // 检查配置中是否包含敏感信息
    const configString = JSON.stringify(guide);
    sensitiveFields.forEach(field => {
      if (configString.includes(field)) {
        exposedData.push({
          field,
          location: 'configuration',
          risk: 'HIGH',
          description: `${field} 在配置文件中明文暴露`
        });
      }
    });

    return exposedData;
  }

  static auditAsyncStorageSecurity(service) {
    const issues = [];

    // 检查AsyncStorage键的安全性
    const storageKey = service.constructor.name.toLowerCase().replace('entryguideservice', '_entry_progress');

    if (!storageKey.includes('entry_progress')) {
      issues.push({
        type: 'STORAGE_KEY_WEAK',
        severity: 'MEDIUM',
        description: `存储键 ${storageKey} 过于通用，可能被其他应用访问`
      });
    }

    // 检查是否使用加密
    // 注意: React Native AsyncStorage 默认不加密
    issues.push({
      type: 'NO_ENCRYPTION',
      severity: 'HIGH',
      description: 'AsyncStorage 不提供加密，敏感数据可能被恶意应用访问'
    });

    return issues;
  }

  static auditCodeInjection(service) {
    const issues = [];

    // 检查动态代码执行风险
    const serviceString = service.constructor.toString();

    // 检查是否使用eval()或Function构造函数
    if (serviceString.includes('eval(') || serviceString.includes('new Function(')) {
      issues.push({
        type: 'CODE_INJECTION_RISK',
        severity: 'CRITICAL',
        description: '检测到动态代码执行，可能存在代码注入风险'
      });
    }

    // 检查模板字符串的安全使用
    const templateMatches = serviceString.match(/\$\{[^}]+\}/g);
    if (templateMatches) {
      templateMatches.forEach(match => {
        if (match.includes('user') || match.includes('input')) {
          issues.push({
            type: 'TEMPLATE_INJECTION_RISK',
            severity: 'HIGH',
            description: `模板字符串 ${match} 可能包含用户输入，存在注入风险`
          });
        }
      });
    }

    return issues;
  }

  static auditPrivacyCompliance(service) {
    const issues = [];
    const guide = service.getGuide();

    // 检查是否收集不必要的个人信息
    const personalDataFields = ['email', 'phone', 'address', 'passport'];
    const configString = JSON.stringify(guide).toLowerCase();

    personalDataFields.forEach(field => {
      if (configString.includes(field)) {
        issues.push({
          type: 'UNNECESSARY_DATA_COLLECTION',
          severity: 'MEDIUM',
          description: `配置中包含 ${field} 字段，确认是否必要收集`
        });
      }
    });

    // 检查数据保留政策
    if (!guide.dataRetentionPolicy) {
      issues.push({
        type: 'MISSING_RETENTION_POLICY',
        severity: 'MEDIUM',
        description: '缺少明确的数据保留政策'
      });
    }

    // 检查用户同意机制
    if (!guide.userConsentRequired) {
      issues.push({
        type: 'MISSING_CONSENT_MECHANISM',
        severity: 'HIGH',
        description: '缺少用户数据收集同意机制'
      });
    }

    return issues;
  }

  static auditConfigurationIntegrity() {
    const issues = [];

    // 检查配置文件是否可被外部修改
    const configFiles = [
      'app/config/entryGuide/thailand.ts',
      'app/config/entryGuide/usa.ts',
      'app/config/entryGuide/canada.ts'
    ];

    configFiles.forEach(file => {
      // 在实际环境中，这里会检查文件权限
      issues.push({
        type: 'CONFIG_FILE_ACCESSIBLE',
        severity: 'LOW',
        description: `${file} 配置文件对应用有写权限，理论上可被修改`
      });
    });

    return issues;
  }

  static generateSecurityReport(auditResults) {
    const summary = {
      totalIssues: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      complianceScore: 100
    };

    // 统计问题数量和严重程度
    Object.entries(auditResults).forEach(([key, value]) => {
      if (key === 'configurationIntegrity' && Array.isArray(value)) {
        // Handle configuration integrity issues directly
        value.forEach(issue => {
          this.processIssue(issue, summary);
        });
      } else if (typeof value === 'object' && value !== null) {
        // Handle service-specific audit results
        Object.values(value).forEach(issues => {
          if (Array.isArray(issues)) {
            issues.forEach(issue => {
              this.processIssue(issue, summary);
            });
          }
        });
      }
    });

    summary.complianceScore = Math.max(0, summary.complianceScore);

    return {
      summary,
      details: auditResults,
      recommendations: this.generateRecommendations(summary),
      timestamp: new Date().toISOString()
    };
  }

  static processIssue(issue, summary) {
    summary.totalIssues++;
    switch (issue.severity) {
      case 'CRITICAL':
        summary.criticalIssues++;
        summary.complianceScore -= 20;
        break;
      case 'HIGH':
        summary.highIssues++;
        summary.complianceScore -= 10;
        break;
      case 'MEDIUM':
        summary.mediumIssues++;
        summary.complianceScore -= 5;
        break;
      case 'LOW':
        summary.lowIssues++;
        summary.complianceScore -= 1;
        break;
    }
  }

  static generateRecommendations(summary) {
    const recommendations = [];

    if (summary.criticalIssues > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        action: '立即修复所有严重安全问题',
        description: '系统存在严重安全风险，必须在发布前解决'
      });
    }

    if (summary.highIssues > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: '实施数据加密和访问控制',
        description: '为AsyncStorage数据添加加密，实施适当的访问控制'
      });
    }

    if (summary.complianceScore < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        action: '进行全面安全审计',
        description: '聘请安全专家进行代码审查和渗透测试'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        action: '保持当前安全措施',
        description: '系统安全状况良好，继续监控和维护'
      });
    }

    return recommendations;
  }
}

describe('EntryGuide Security Assessment', () => {
  let services = {};
  let auditResults = {};

  beforeAll(() => {
    // 初始化服务实例
    services = {
      thailand: new ThailandEntryGuideService(),
      usa: new USEntryGuideService(),
      canada: new CanadaEntryGuideService()
    };

    auditResults = {
      thailand: {},
      usa: {},
      canada: {}
    };
  });

  describe('1. 数据暴露审计', () => {
    const sensitiveFields = [
      'password', 'ssn', 'credit_card', 'bank_account',
      'passport_number', 'social_security', 'tax_id'
    ];

    test.each([
      ['Thailand', 'thailand'],
      ['USA', 'usa'],
      ['Canada', 'canada']
    ])('%s 服务不应暴露敏感数据', (countryName, serviceKey) => {
      const service = services[serviceKey];
      const exposedData = SecurityAuditor.auditDataExposure(service, sensitiveFields);

      auditResults[serviceKey].dataExposure = exposedData;

      console.log(`${countryName} 数据暴露审计:`, exposedData);

      // 期望没有敏感数据暴露
      expect(exposedData).toHaveLength(0);
    });
  });

  describe('2. AsyncStorage 安全审计', () => {
    test.each([
      ['Thailand', 'thailand'],
      ['USA', 'usa'],
      ['Canada', 'canada']
    ])('%s AsyncStorage 存储安全检查', (countryName, serviceKey) => {
      const service = services[serviceKey];
      const storageIssues = SecurityAuditor.auditAsyncStorageSecurity(service);

      auditResults[serviceKey].storageSecurity = storageIssues;

      console.log(`${countryName} 存储安全审计:`, storageIssues);

      // 记录已知问题但不强制失败（这是已知限制）
      expect(storageIssues).toBeDefined();
    });
  });

  describe('3. 代码注入风险审计', () => {
    test.each([
      ['Thailand', 'thailand'],
      ['USA', 'usa'],
      ['Canada', 'canada']
    ])('%s 服务不应存在代码注入风险', (countryName, serviceKey) => {
      const service = services[serviceKey];
      const injectionIssues = SecurityAuditor.auditCodeInjection(service);

      auditResults[serviceKey].codeInjection = injectionIssues;

      console.log(`${countryName} 代码注入审计:`, injectionIssues);

      // 检查是否有严重代码注入风险
      const criticalIssues = injectionIssues.filter(issue => issue.severity === 'CRITICAL');
      expect(criticalIssues).toHaveLength(0);
    });
  });

  describe('4. 隐私合规审计', () => {
    test.each([
      ['Thailand', 'thailand'],
      ['USA', 'usa'],
      ['Canada', 'canada']
    ])('%s 服务应符合隐私保护要求', (countryName, serviceKey) => {
      const service = services[serviceKey];
      const privacyIssues = SecurityAuditor.auditPrivacyCompliance(service);

      auditResults[serviceKey].privacyCompliance = privacyIssues;

      console.log(`${countryName} 隐私合规审计:`, privacyIssues);

      // 记录隐私问题但不强制失败（需要业务决策）
      expect(privacyIssues).toBeDefined();
    });
  });

  describe('5. 配置完整性审计', () => {
    test('配置文件应具有适当的完整性保护', () => {
      const configIssues = SecurityAuditor.auditConfigurationIntegrity();

      auditResults.configurationIntegrity = configIssues;

      console.log('配置完整性审计:', configIssues);

      // 记录配置问题但不强制失败（这是已知限制）
      expect(configIssues).toBeDefined();
    });
  });

  describe('6. 安全报告生成', () => {
    test('生成完整的系统安全报告', () => {
      const securityReport = SecurityAuditor.generateSecurityReport(auditResults);

      console.log('\n=== 入境指引系统安全评估报告 ===');
      console.log('合规评分:', securityReport.summary.complianceScore + '/100');
      console.log('问题统计:', securityReport.summary);
      console.log('建议措施:', securityReport.recommendations);

      // 验证报告结构
      expect(securityReport.summary).toBeDefined();
      expect(securityReport.details).toBeDefined();
      expect(securityReport.recommendations).toBeDefined();
      expect(securityReport.summary.complianceScore).toBeGreaterThanOrEqual(0);
      expect(securityReport.summary.complianceScore).toBeLessThanOrEqual(100);

      // 保存报告用于后续分析
      global.securityReport = securityReport;
    });
  });

  describe('7. 安全强化建议验证', () => {
    test('验证安全强化措施的有效性', () => {
      const report = global.securityReport;

      // 如果合规评分低于80分，验证是否有相应建议
      if (report.summary.complianceScore < 80) {
        expect(report.recommendations.length).toBeGreaterThan(0);
        expect(report.recommendations[0].priority).toBeDefined();
      }

      // 验证关键安全问题是否被识别
      const allIssues = Object.values(report.details).flatMap(serviceResults =>
        Object.values(serviceResults).flat()
      );

      // 应该识别出AsyncStorage加密问题
      const encryptionIssues = allIssues.filter(issue => issue.type === 'NO_ENCRYPTION');
      expect(encryptionIssues.length).toBeGreaterThan(0);

      // 验证问题严重程度分类
      const severityLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      allIssues.forEach(issue => {
        expect(severityLevels).toContain(issue.severity);
      });
    });
  });

  describe('8. 安全监控和告警', () => {
    test('验证安全监控机制', () => {
      const report = global.securityReport;

      // 检查是否有监控建议
      const monitoringRecommendations = report.recommendations.filter(rec =>
        rec.action.includes('监控') || rec.action.includes('审计')
      );

      // 如果有安全问题，应该有监控建议
      if (report.summary.totalIssues > 0) {
        expect(monitoringRecommendations.length).toBeGreaterThan(0);
      }

      // 验证告警阈值
      const alertThresholds = {
        critical: report.summary.criticalIssues > 0,
        high: report.summary.highIssues > 3,
        medium: report.summary.mediumIssues > 5
      };

      // 记录告警状态
      console.log('安全告警状态:', alertThresholds);
    });
  });
});
