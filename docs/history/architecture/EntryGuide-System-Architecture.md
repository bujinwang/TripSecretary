# 入境指引系统架构设计文档

## 概述

本文档描述了全球数字入境生态系统的统一平台架构设计，采用数据驱动 + 组件复用的设计模式，支持多国家入境指引的统一管理和扩展。

## 核心架构原则

### 1. 数据驱动设计 (Data-Driven Architecture)
- 各国差异通过配置文件定义，无需修改代码
- 支持实时政策更新，无需重新发布应用
- 集中管理各国差异，易于维护和扩展

### 2. 组件复用 + 动态渲染 (Component Reuse + Dynamic Rendering)
- 通用组件处理所有国家的步骤显示
- 根据步骤类型动态选择合适组件
- 统一的用户体验和交互模式

### 3. 云端配置分发 (Cloud Configuration Distribution)
- 核心国家配置内置应用
- 新增国家配置云端分发
- 支持增量更新和智能缓存

## 架构层次

### 1. 数据层 (Data Layer)

```
📁 app/config/entryGuide/
├── bundled/           # 应用内置核心国家配置
│   ├── thailand.v1.json
│   ├── japan.v1.json
│   └── singapore.v1.json
├── remote/            # 云端动态配置
│   ├── malaysia.v1.json
│   ├── vietnam.v1.json
│   └── config-manifest.json
└── shared/            # 共享配置模块
    ├── atm-withdrawal.json
    └── taxi-booking.json
```

### 2. 服务层 (Service Layer)

```
📁 app/services/entryGuide/
├── EntryGuideService.js           # 通用多国家管理服务
├── ThailandEntryGuideService.js   # 泰国专用逻辑
├── JapanEntryGuideService.js      # 日本专用逻辑
├── MobileConfigManager.js         # 移动端配置管理
├── ConfigDistributionService.js   # 云端配置分发
└── __tests__/                     # 测试覆盖
```

### 3. 组件层 (Component Layer)

```
📁 app/components/entryGuide/
├── UniversalStepRenderer.js       # 通用步骤渲染器
├── ATMStep.js                     # ATM专用组件
├── TaxiStep.js                    # 出租车专用组件
├── BiometricStep.js               # 生物识别专用组件
├── CountrySelector.js             # 国家选择器
└── ConfigLoader.js                # 配置加载器
```

### 4. 页面层 (Screen Layer)

```
📁 app/screens/entryGuide/
├── EntryGuideMainScreen.js        # 通用主屏幕（支持所有国家）
├── CountrySelectionScreen.js      # 国家选择
├── StepDetailScreen.js            # 通用步骤详情页
└── ConfigUpdateScreen.js          # 配置更新管理
```

## 核心机制

### 1. 动态步骤渲染机制

```javascript
// 一个屏幕处理所有国家的所有步骤
const EntryGuideMainScreen = ({ country }) => {
  const guide = useEntryGuide(country);

  return (
    <ScrollView>
      {guide.steps.map(step => (
        <UniversalStepRenderer
          key={step.id}
          step={step}
          country={country}
          onStepPress={(stepId) => navigateToStepDetail(stepId)}
        />
      ))}
    </ScrollView>
  );
};
```

### 2. 智能组件分发系统

```javascript
// 根据步骤类型自动选择合适组件
const UniversalStepRenderer = ({ step, country }) => {
  const Component = getStepComponent(step.type);
  return <Component step={step} country={country} />;
};

const getStepComponent = (stepType) => {
  const components = {
    'tdac': TDACStep,
    'atm': ATMStep,
    'taxi': TaxiStep,
    'biometric': BiometricStep,
    'immigration': ImmigrationStep,
    'baggage': BaggageStep,
    'customs': CustomsStep,
    'default': GenericStep
  };
  return components[stepType] || components.default;
};
```

### 3. 云端配置分发机制

```javascript
// 智能配置加载策略
class MobileConfigManager {
  async loadCountryConfig(country) {
    // 1. 检查本地缓存
    const cached = await this.getCachedConfig(country);
    if (cached && this.isValid(cached)) {
      return cached;
    }

    // 2. 检查应用内置配置
    const bundled = await this.getBundledConfig(country);
    if (bundled) {
      // 异步检查云端更新
      this.checkForUpdates(country);
      return bundled;
    }

    // 3. 从云端下载
    return await this.downloadFromCloud(country);
  }
}
```

## 配置包结构

### 标准化配置包格式

```javascript
{
  metadata: {
    country: 'thailand',
    version: '2.1.0',
    lastUpdated: '2024-10-19T02:00:00Z',
    size: '15KB',
    checksum: 'sha256:...',
    dependencies: ['thailand-atm', 'thailand-taxi']
  },
  content: {
    steps: [/* 步骤定义 */],
    atm: {/* ATM信息 */},
    taxi: {/* 出租车信息 */},
    customs: {/* 海关规则 */},
    emergency: {/* 紧急联系 */}
  },
  localization: {
    'zh-CN': {/* 中文翻译 */},
    'en': {/* 英文翻译 */},
    'th': {/* 泰文翻译 */}
  },
  assets: {
    images: ['atm-locations.jpg', 'taxi-counters.jpg'],
    icons: ['step-icons.svg']
  }
}
```

## 扩展性优势

### 新增国家成本对比

| 项目 | 传统方式 | 统一平台架构 |
|------|---------|-------------|
| 新增泰国 | 创建8个页面 + 逻辑代码 | 1个配置文件(280行) |
| 新增日本 | 创建7个页面 + 逻辑代码 | 1个配置文件(220行) |
| 新增新加坡 | 创建6个页面 + 逻辑代码 | 1个配置文件(~200行) |
| 维护成本 | 高（页面间逻辑重复） | 低（集中配置管理） |

### 全球扩展路径

**第一阶段：亚洲国家** (已实现泰国和日本框架)
```
泰国 → 日本 → 新加坡 → 马来西亚 → 韩国 → 越南
├── 数字入境卡国家 (TDAC, SGAC, MDAC)
├── 生物识别国家 (日本指纹面部识别)
└── 纸质表格国家 (传统海关申报)
```

**第二阶段：全球覆盖**
```
欧洲 → 北美 → 大洋洲 → 南美 → 非洲
├── ETIAS (欧盟) → ESTA (美国) → eTA (加拿大)
├── NZeTA (新西兰) → ETA (英国) → DPD (澳大利亚)
└── 各国特色入境程序统一管理
```

## 技术创新点

### 1. 配置驱动的UI生成
- 步骤顺序、图标、颜色、布局都通过配置定义
- 支持国家特色功能的动态显示
- 实时政策更新无需重新发布应用

### 2. 智能内容适配
```javascript
// 根据用户位置和进度智能显示内容
const getContextualContent = (country, currentLocation, progress) => {
  const guide = getGuide(country);
  return guide.steps.filter(step =>
    isRelevantToLocation(step, currentLocation) &&
    shouldShowBasedOnProgress(step, progress)
  );
};
```

### 3. 渐进式功能解锁
- 根据用户完成进度解锁高级功能
- 国家特色功能按需显示
- 个性化推荐基于使用历史

## 未来扩展能力

### 政府API集成
```javascript
// 为支持API的国家动态添加实时功能
const enhancedFeatures = {
  thailand: ['TDAC_API', 'RealTimeATM'],
  japan: ['BiometricStatus', 'JRPassIntegration'],
  singapore: ['SGAC_API', 'MRTIntegration']
};
```

### AI智能推荐
- 基于用户历史和当前位置推荐下一步行动
- 智能语言切换基于用户位置
- 个性化提示基于用户习惯

## 架构优势总结

**🔥 零页面复制**: 一个主屏幕支持全球所有国家
**⚡ 快速扩展**: 新增国家只需添加配置文件
**🛠️ 易于维护**: 集中管理各国差异和政策更新
**🌍 全球一致**: 统一的用户体验和交互模式
**📱 实时更新**: 政策变化通过配置更新，无需发版
**🧪 易于测试**: 每个国家可独立测试，互不影响

这种架构设计不仅解决了多国家支持的问题，还建立了一个可扩展的全球数字入境生态系统基础设施，为未来支持50+国家奠定了坚实的技术基础。