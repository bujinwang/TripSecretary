# 组件复用和动态渲染系统架构设计

## 概述

本文档详细描述了多国家入境指引系统的组件复用和动态渲染架构，采用通用组件库 + 动态组件分发 + 主题化系统的设计，实现一个组件库支持全球50+国家的特色功能展示。

## 核心架构模式

### 1. 通用组件库 (Universal Component Library)

#### 基础组件继承体系
```javascript
// 基础步骤组件 - 所有步骤组件的基类
class BaseStep extends React.Component {
  render() {
    const { step, country, theme } = this.props;
    return (
      <View style={this.getContainerStyle(theme)}>
        <Icon name={step.icon} style={this.getIconStyle(theme)} />
        <Text style={this.getTitleStyle(theme)}>{this.getLocalizedTitle(step, country)}</Text>
        <Text style={this.getDescriptionStyle(theme)}>{this.getLocalizedDescription(step, country)}</Text>
        {this.renderStepSpecificContent()}
        {this.renderActionButtons()}
      </View>
    );
  }

  // 子类重写特定内容渲染
  renderStepSpecificContent() {
    return null;
  }

  // 统一的按钮渲染
  renderActionButtons() {
    const { step, onComplete, onSkip } = this.props;
    return (
      <View style={styles.buttonContainer}>
        {step.canSkip && (
          <Button variant="secondary" onPress={onSkip}>
            {this.getLocalizedText('skip', step.country)}
          </Button>
        )}
        <Button variant="primary" onPress={onComplete}>
          {this.getLocalizedText('complete', step.country)}
        </Button>
      </View>
    );
  }
}
```

#### 专用步骤组件实现
```javascript
// ATM取款步骤组件
class ATMStep extends BaseStep {
  renderStepSpecificContent() {
    const { step, country } = this.props;
    const atmInfo = step.atm;

    return (
      <View style={styles.atmContainer}>
        <ATMMap location={atmInfo.location} />
        <BankList banks={atmInfo.banks} />
        <FeeCalculator amount={atmInfo.recommendedAmount} fee={atmInfo.fee} />
        <SafetyTips tips={atmInfo.safetyTips} />
        <CurrencyConverter amount={atmInfo.recommendedAmount} />
      </View>
    );
  }
}

// 出租车步骤组件
class TaxiStep extends BaseStep {
  renderStepSpecificContent() {
    const { step, country } = this.props;
    const taxiInfo = step.taxi;

    return (
      <View style={styles.taxiContainer}>
        <DriverPagePreview address={this.getUserHotelAddress()} />
        <CounterLocation location={taxiInfo.officialCounter} />
        <CostBreakdown cost={taxiInfo.cost} />
        <PaymentTips tips={taxiInfo.payment} />
        <SafetyWarnings warnings={taxiInfo.safety} />
      </View>
    );
  }
}

// 生物识别步骤组件
class BiometricStep extends BaseStep {
  renderStepSpecificContent() {
    const { step, country } = this.props;
    const bioInfo = step.biometric;

    return (
      <View style={styles.biometricContainer}>
        <BiometricGuide procedures={bioInfo.procedures} />
        <PreparationTips tips={bioInfo.preparation} />
        <ProcessFlow steps={bioInfo.steps} />
        <CommonQuestions faq={bioInfo.faq} />
      </View>
    );
  }
}
```

### 2. 动态组件分发系统 (Dynamic Component Distribution)

#### 组件注册和发现机制
```javascript
// 全局组件注册表
const ComponentRegistry = {
  // 基础组件
  base: {
    StepContainer: () => import('../components/base/StepContainer'),
    ProgressIndicator: () => import('../components/base/ProgressIndicator'),
    ActionButtons: () => import('../components/base/ActionButtons')
  },

  // 步骤专用组件
  steps: {
    tdac: () => import('../components/steps/TDACStep'),
    atm: () => import('../components/steps/ATMStep'),
    taxi: () => import('../components/steps/TaxiStep'),
    biometric: () => import('../components/steps/BiometricStep'),
    immigration: () => import('../components/steps/ImmigrationStep'),
    baggage: () => import('../components/steps/BaggageStep'),
    customs: () => import('../components/steps/CustomsStep'),
    default: () => import('../components/steps/GenericStep')
  },

  // 国家特色组件
  countrySpecific: {
    thailand: {
      driverPage: () => import('../components/thailand/DriverPagePreview'),
      atmMap: () => import('../components/thailand/ATMMap')
    },
    japan: {
      biometricGuide: () => import('../components/japan/BiometricGuide'),
      formTemplates: () => import('../components/japan/FormTemplates')
    }
  }
};
```

#### 动态组件加载器
```javascript
// 运行时动态加载组件
class DynamicComponentLoader {
  constructor() {
    this.loadedComponents = new Map();
    this.loadingPromises = new Map();
  }

  async loadComponent(componentKey, category = 'steps') {
    const cacheKey = `${category}:${componentKey}`;

    // 检查缓存
    if (this.loadedComponents.has(cacheKey)) {
      return this.loadedComponents.get(cacheKey);
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // 开始加载
    const loadPromise = this._loadComponentFromRegistry(componentKey, category);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const component = await loadPromise;
      this.loadedComponents.set(cacheKey, component);
      this.loadingPromises.delete(cacheKey);
      return component;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      throw error;
    }
  }

  async _loadComponentFromRegistry(componentKey, category) {
    const registry = ComponentRegistry[category];
    if (!registry || !registry[componentKey]) {
      throw new Error(`Component ${componentKey} not found in category ${category}`);
    }

    const importFunction = registry[componentKey];
    const module = await importFunction();
    return module.default;
  }

  // 预加载常用组件
  async preloadCommonComponents() {
    const commonComponents = [
      'StepContainer',
      'ProgressIndicator',
      'ActionButtons',
      'tdac',
      'atm',
      'taxi',
      'immigration'
    ];

    const promises = commonComponents.map(key =>
      this.loadComponent(key, key.length > 10 ? 'base' : 'steps')
    );

    return Promise.all(promises);
  }
}
```

#### 智能组件选择器
```javascript
// 根据步骤类型和国家选择最合适的组件
class SmartComponentSelector {
  async selectComponent(step, country) {
    const { type, features } = step;

    // 1. 检查是否有国家特色组件
    const countrySpecific = await this.checkCountrySpecificComponent(type, country);
    if (countrySpecific) {
      return countrySpecific;
    }

    // 2. 检查是否有功能增强组件
    const enhanced = await this.checkEnhancedComponent(type, features);
    if (enhanced) {
      return enhanced;
    }

    // 3. 返回标准组件
    return await this.getStandardComponent(type);
  }

  async checkCountrySpecificComponent(type, country) {
    const countryComponents = ComponentRegistry.countrySpecific[country];
    if (countryComponents && countryComponents[type]) {
      return await dynamicLoader.loadComponent(type, `countrySpecific.${country}`);
    }
    return null;
  }

  async checkEnhancedComponent(type, features) {
    if (features && features.includes('interactive')) {
      return await dynamicLoader.loadComponent(`${type}Interactive`, 'steps');
    }
    return null;
  }

  async getStandardComponent(type) {
    return await dynamicLoader.loadComponent(type, 'steps');
  }
}
```

### 3. 主题化和样式系统 (Theming System)

#### 国家主题配置
```javascript
// 国家特色主题系统
const countryThemes = {
  thailand: {
    colors: {
      primary: '#FF6B35',      // 橙红色
      secondary: '#F7931E',    // 金色
      accent: '#00A896',       // 青色
      background: '#FFFFFF',
      surface: '#F8F9FA'
    },
    typography: {
      fontFamily: 'ThaiSans',
      titleSize: 20,
      bodySize: 16,
      captionSize: 14
    },
    icons: {
      set: 'thai-icons',
      style: 'rounded'
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24
    },
    borders: {
      radius: 12,
      width: 1
    }
  },

  japan: {
    colors: {
      primary: '#BC002D',      // 红色
      secondary: '#FFFFFF',    // 白色
      accent: '#000000',       // 黑色
      background: '#F5F5F5',
      surface: '#FFFFFF'
    },
    typography: {
      fontFamily: 'JapaneseSans',
      titleSize: 18,
      bodySize: 15,
      captionSize: 13
    },
    icons: {
      set: 'japanese-icons',
      style: 'minimal'
    }
  }
};
```

#### 动态主题应用
```javascript
// 运行时应用国家主题
class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.themeCache = new Map();
  }

  async applyCountryTheme(country) {
    const theme = await this.loadTheme(country);
    this.currentTheme = theme;

    // 应用到全局样式
    this.applyGlobalStyles(theme);

    // 更新组件主题
    this.updateComponentThemes(theme);

    // 缓存主题
    this.themeCache.set(country, theme);
  }

  async loadTheme(country) {
    // 检查缓存
    if (this.themeCache.has(country)) {
      return this.themeCache.get(country);
    }

    // 从配置加载主题
    const themeConfig = countryThemes[country];
    if (!themeConfig) {
      return this.getDefaultTheme();
    }

    // 处理主题继承和覆盖
    const baseTheme = await this.getBaseTheme();
    return this.mergeThemes(baseTheme, themeConfig);
  }

  applyGlobalStyles(theme) {
    // 更新全局CSS变量
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(theme.typography).forEach(([key, value]) => {
      root.style.setProperty(`--typography-${key}`, value);
    });
  }

  updateComponentThemes(theme) {
    // 通知所有活动组件更新主题
    EventEmitter.emit('themeChanged', theme);
  }
}
```

### 4. 响应式布局系统 (Responsive Layout System)

#### 自适应组件布局
```javascript
// 根据设备和内容动态调整布局
class ResponsiveLayoutManager {
  getLayoutForStep(step, deviceInfo) {
    const { type, contentSize } = step;
    const { screenWidth, screenHeight, orientation } = deviceInfo;

    // 根据步骤类型选择布局策略
    switch (type) {
      case 'atm':
        return this.getATMLayout(contentSize, deviceInfo);
      case 'taxi':
        return this.getTaxiLayout(contentSize, deviceInfo);
      case 'biometric':
        return this.getBiometricLayout(contentSize, deviceInfo);
      default:
        return this.getDefaultLayout(contentSize, deviceInfo);
    }
  }

  getATMLayout(contentSize, deviceInfo) {
    if (deviceInfo.screenWidth < 375) {
      // 小屏幕：垂直布局
      return {
        direction: 'column',
        mapHeight: 200,
        bankListHeight: 'auto',
        feeCalculatorHeight: 120
      };
    } else {
      // 大屏幕：水平布局
      return {
        direction: 'row',
        mapHeight: 300,
        bankListHeight: 300,
        feeCalculatorHeight: 300
      };
    }
  }
}
```

#### 内容优先级排序
```javascript
// 根据屏幕空间动态调整内容显示优先级
class ContentPrioritizer {
  prioritizeContent(step, availableSpace) {
    const { type, content } = step;
    const priorities = this.getContentPriorities(type);

    // 根据可用空间分配内容
    return this.allocateContentSpace(content, priorities, availableSpace);
  }

  getContentPriorities(stepType) {
    const priorities = {
      atm: ['map', 'banks', 'fees', 'safety', 'converter'],
      taxi: ['driverPage', 'counter', 'cost', 'payment', 'safety'],
      biometric: ['guide', 'preparation', 'flow', 'faq']
    };

    return priorities[stepType] || ['description', 'tips'];
  }

  allocateContentSpace(content, priorities, availableSpace) {
    const allocated = [];
    let remainingSpace = availableSpace;

    for (const priority of priorities) {
      if (remainingSpace <= 0) break;

      const contentItem = content[priority];
      if (contentItem) {
        const spaceNeeded = this.calculateSpaceNeeded(contentItem);
        if (spaceNeeded <= remainingSpace) {
          allocated.push({
            key: priority,
            content: contentItem,
            space: spaceNeeded
          });
          remainingSpace -= spaceNeeded;
        }
      }
    }

    return allocated;
  }
}
```

### 5. 性能优化策略

#### 组件懒加载
```javascript
// 按需加载组件
const LazyStepComponents = {
  ATMStep: lazy(() => import('../components/steps/ATMStep')),
  TaxiStep: lazy(() => import('../components/steps/TaxiStep')),
  BiometricStep: lazy(() => import('../components/steps/BiometricStep'))
};

// 条件渲染
const renderStepComponent = (stepType) => {
  const Component = LazyStepComponents[stepType];
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Component />
    </Suspense>
  );
};
```

#### 组件预加载策略
```javascript
// 预测性预加载
class PredictiveComponentLoader {
  async preloadNextComponents(currentStep, country) {
    const nextSteps = await this.predictNextSteps(currentStep, country);
    const components = nextSteps.map(step => step.type);

    // 预加载相关组件
    return Promise.all(
      components.map(type => dynamicLoader.loadComponent(type))
    );
  }

  async predictNextSteps(currentStep, country) {
    // 基于用户行为和配置预测下一步
    const guide = await configManager.getGuide(country);
    const currentIndex = guide.steps.findIndex(s => s.id === currentStep);

    if (currentIndex < guide.steps.length - 1) {
      return [guide.steps[currentIndex + 1]];
    }

    return [];
  }
}
```

### 6. 可访问性和国际化

#### 无障碍支持
```javascript
// 组件无障碍增强
class AccessibilityEnhancer {
  enhanceComponent(Component, step, country) {
    return React.forwardRef((props, ref) => (
      <Component
        {...props}
        ref={ref}
        accessibilityLabel={this.getAccessibilityLabel(step, country)}
        accessibilityHint={this.getAccessibilityHint(step, country)}
        accessibilityRole={this.getAccessibilityRole(step)}
      />
    ));
  }

  getAccessibilityLabel(step, country) {
    return `${step.title} - ${this.getLocalizedText('step', country)} ${step.order}`;
  }

  getAccessibilityHint(step, country) {
    return this.getLocalizedText('tapToViewDetails', country);
  }
}
```

#### 国际化支持
```javascript
// 动态语言包加载
class InternationalizationManager {
  async loadLanguagePack(country, language) {
    const pack = await this.fetchLanguagePack(country, language);
    i18n.addResourceBundle(language, 'entryGuide', pack);
    return pack;
  }

  async getLocalizedText(key, country, language = null) {
    const lng = language || this.getCurrentLanguage();
    const countryNamespace = `entryGuide.${country}`;

    return i18n.t(key, { ns: countryNamespace, lng });
  }
}
```

## 架构优势总结

### 1. 组件复用效率
- **零重复代码**: 一个组件支持所有国家
- **快速扩展**: 新国家只需配置，无需新组件
- **维护简化**: 统一更新所有国家受益

### 2. 动态渲染灵活性
- **运行时适配**: 根据国家特色动态选择组件
- **性能优化**: 懒加载和预加载平衡性能
- **用户体验**: 流畅的组件切换和加载

### 3. 主题化系统完整性
- **视觉一致性**: 国家特色主题统一应用
- **品牌识别**: 每个国家独特的视觉风格
- **用户偏好**: 支持主题切换和自定义

### 4. 响应式布局智能性
- **设备适配**: 自动调整布局适应屏幕
- **内容优先级**: 智能显示重要信息
- **空间优化**: 最大化利用屏幕空间

### 5. 性能优化全面性
- **加载速度**: 组件懒加载减少初始包大小
- **缓存策略**: 多级缓存提升重复访问速度
- **预测加载**: 智能预加载提升用户体验

### 6. 可访问性国际化
- **无障碍支持**: 完整的屏幕阅读器支持
- **多语言覆盖**: 支持全球主流语言
- **文化适配**: 考虑不同文化的使用习惯

这种组件复用和动态渲染架构为全球50+国家的入境指引提供了统一、高效、可扩展的技术基础，确保了优秀的产品体验和卓越的技术性能。