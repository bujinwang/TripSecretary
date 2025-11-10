# 入境指引模板设计文档

## 概述

入境指引是旅客在飞机落地后需要遵循的多步骤指导系统。从关闭蜂窝网络、设置eSIM卡开始，到海关申报、移民局检查、领取行李等完整流程。本文档定义了通用模板结构，以泰国为例进行实现，并为日本等其他国家提供扩展框架。

## 设计目标

### 用户体验目标

- **渐进式指引**: 一步步引导用户完成入境流程
- **情境感知**: 根据当前位置和进度显示相关信息
- **防错设计**: 防止用户遗漏重要步骤
- **多语言支持**: 支持中英双语，易于扩展到其他语言
- **离线可用**: 核心指引信息应在离线状态下可用

### 技术目标

- **模块化设计**: 每个国家有独立的配置，易于维护和扩展
- **数据驱动**: 通过配置文件定义步骤和内容
- **状态管理**: 跟踪用户进度和偏好设置
- **可扩展性**: 新增国家只需添加配置文件

## 通用模板结构

### 1. 步骤分类

入境指引分为以下主要阶段：

#### 飞机内阶段 (In-Flight)

- 填写海关申报表
- 准备证件和文件
- 了解机场布局

#### 落地后阶段 (Post-Landing)

- 关闭蜂窝网络
- 设置eSIM卡
- 排队等候

#### 海关阶段 (Customs)

- 海关申报
- 物品检查
- 禁止物品提醒

#### 移民局阶段 (Immigration)

- 移民官检查
- 指纹采集
- 签证盖章

#### 行李领取阶段 (Baggage Claim)

- 行李转盘指引
- 行李认领
- 海关二次检查

#### 出机场阶段 (Exit)

- 货币兑换
- 交通指引
- 紧急联系方式

### 2. 数据结构设计

### 2. 数据结构设计

#### 步骤定义

```typescript
interface EntryGuideStep {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  category:
    | "in-flight"
    | "post-landing"
    | "customs"
    | "immigration"
    | "baggage"
    | "exit";
  priority: number;
  estimatedTime: string;
  warnings: string[];
  tips: string[];
  icon: string;
  required: boolean;
  skippable: boolean;
  dependencies?: string[]; // Other step IDs this depends on
  location?: string; // Airport location identifier
  duration?: number; // Estimated duration in minutes
}

const stepExample: EntryGuideStep = {
  id: "step_1",
  title: "关闭蜂窝网络",
  titleZh: "关闭蜂窝网络",
  description: "飞机落地滑行时，请关闭手机的蜂窝网络数据",
  descriptionZh: "飞机落地滑行时，请关闭手机的蜂窝网络数据",
  category: "post-landing",
  priority: 1,
  estimatedTime: "1分钟",
  warnings: ["请勿在飞机滑行时使用手机", "确保WiFi也已关闭"],
  tips: ["可以在设置中快速关闭蜂窝数据", "落地后立即关闭可节省国际漫游费用"],
  icon: "📱",
  required: true,
  skippable: false,
};
```

#### 国家配置

```typescript
interface CountryCustoms {
  declarationRequired: boolean;
  prohibitedItems: string[];
  dutyFree: {
    alcohol: string;
    tobacco: string;
    [key: string]: string;
  };
}

interface EmergencyInfo {
  police: string;
  ambulance: string;
  embassy: string;
  [key: string]: string; // Additional emergency contacts
}

interface CountryEntryGuide {
  country: string;
  countryName: string;
  countryNameZh: string;
  airport: string; // Primary airport code
  currency: string;
  language: string[];
  steps: EntryGuideStep[];
  customs: CountryCustoms;
  emergency: EmergencyInfo;
  features?: {
    digitalArrivalCard?: boolean;
    visaOnArrival?: boolean;
    fastTrack?: boolean;
  };
  metadata?: {
    lastUpdated: string;
    version: string;
    author: string;
  };
}

const thailandConfig: CountryEntryGuide = {
  country: "thailand",
  countryName: "Thailand",
  countryNameZh: "泰国",
  airport: "BKK", // 主要机场代码
  currency: "THB",
  language: ["th", "en"],
  steps: [
    // 泰国特定的步骤配置
  ],
  customs: {
    declarationRequired: true,
    prohibitedItems: ["新鲜水果", "肉类制品", "香烟超过规定数量"],
    dutyFree: {
      alcohol: "1升",
      tobacco: "200支",
    },
  },
  emergency: {
    police: "191",
    ambulance: "1669",
    embassy: "+66-2-245-7033",
  },
};
```

#### 步骤定义

```javascript
{
  id: 'step_1',
  title: '关闭蜂窝网络',
  titleZh: '关闭蜂窝网络',
  description: '飞机落地滑行时，请关闭手机的蜂窝网络数据',
  descriptionZh: '飞机落地滑行时，请关闭手机的蜂窝网络数据',
  category: 'post-landing',
  priority: 1,
  estimatedTime: '1分钟',
  warnings: [
    '请勿在飞机滑行时使用手机',
    '确保WiFi也已关闭'
  ],
  tips: [
    '可以在设置中快速关闭蜂窝数据',
    '落地后立即关闭可节省国际漫游费用'
  ],
  icon: '📱',
  required: true,
  skippable: false
}
```

#### 国家配置

```javascript
{
  country: 'thailand',
  countryName: '泰国',
  countryNameZh: '泰国',
  airport: 'BKK', // 主要机场代码
  currency: 'THB',
  language: ['th', 'en'],
  steps: [
    // 泰国特定的步骤配置
  ],
  customs: {
    declarationRequired: true,
    prohibitedItems: [
      '新鲜水果',
      '肉类制品',
      '香烟超过规定数量'
    ],
    dutyFree: {
      alcohol: '1升',
      tobacco: '200支'
    }
  },
  emergency: {
    police: '191',
    ambulance: '1669',
    embassy: '+66-2-245-7033'
  }
}
```

### 3. 泰国具体实现

#### 泰国入境步骤顺序 (廊曼机场DMK完整流程)

1. **抵达前准备** (Pre-Arrival Preparation)
   - 提交TDAC数字入境卡 (72小时内)
   - 生成入境通通关包
   - 准备TDAC QR码和证明材料
   - 检查必备物品：护照、手机、入境通APP、银行卡

### 语言文件结构

```typescript
// i18n/locales.ts
interface EntryGuideStepTranslations {
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  warnings: string[];
  warningsZh: string[];
  tips: string[];
  tipsZh: string[];
}

interface CustomTranslations {
  prohibitedItems: string[];
  prohibitedItemsZh: string[];
  dutyFree: {
    alcohol: string;
    alcoholZh: string;
    tobacco: string;
    tobaccoZh: string;
  };
}

interface CountryEntryGuideTranslations {
  steps: Record<string, EntryGuideStepTranslations>;
  customs: CustomTranslations;
  emergency: {
    [key: string]: string; // Emergency contact names
  };
  cultural: {
    [key: string]: string; // Cultural notes
  };
}

interface EntryGuideTranslations {
  thailand: CountryEntryGuideTranslations;
  japan: CountryEntryGuideTranslations;
  singapore: CountryEntryGuideTranslations;
  // Other countries...
}

export const entryGuideTranslations: EntryGuideTranslations = {
  thailand: {
    steps: {
      step_1: {
        title: "关闭蜂窝网络",
        titleZh: "关闭蜂窝网络",
        description: "飞机落地滑行时，请关闭手机的蜂窝网络数据",
        descriptionZh: "飞机落地滑行时，请关闭手机的蜂窝网络数据",
        warnings: ["请勿在飞机滑行时使用手机"],
        warningsZh: ["请勿在飞机滑行时使用手机"],
        tips: ["可以在设置中快速关闭蜂窝数据"],
        tipsZh: ["可以在设置中快速关闭蜂窝数据"],
      },
      // ... 更多步骤
    },
    customs: {
      prohibitedItems: ["新鲜水果", "肉类制品"],
      prohibitedItemsZh: ["新鲜水果", "肉类制品"],
      dutyFree: {
        alcohol: "1升",
        alcoholZh: "1升",
        tobacco: "200支",
        tobaccoZh: "200支",
      },
    },
  },
};

// Type-safe language service
export class EntryGuideI18nService {
  private translations: EntryGuideTranslations;

  constructor(translations: EntryGuideTranslations) {
    this.translations = translations;
  }

  getStepTranslation(
    country: string,
    stepId: string,
    language: "en" | "zh",
  ): EntryGuideStepTranslations {
    const countryTranslations = this.translations[country];
    if (!countryTranslations) {
      throw new Error(`No translations found for country: ${country}`);
    }

    const step = countryTranslations.steps[stepId];
    if (!step) {
      throw new Error(`No translation found for step: ${stepId}`);
    }

    return step;
  }

  getLocalizedString(
    country: string,
    key: string,
    language: "en" | "zh",
  ): string {
    // Implementation for localized string lookup
    return "";
  }
}
```

2. **飞机内准备** (In-Flight Preparation)
   - 准备通关包出示材料
   - 确认TDAC QR码可用
   - 整理护照和相关文件
   - 了解机场布局和标识

3. **落地前准备** (Pre-Landing Setup)
   - 关闭蜂窝网络数据 📱
   - 激活泰国eSIM卡 🌐
   - 准备手机离线模式
   - 跟着人群走，看"Arrivals"或"Immigration"标识

4. **移民局检查** (Immigration Check)
   - 出示通关包和TDAC QR码
   - 核验护照和入境信息
   - 指纹采集和面部识别
   - 盖章放行
   - 保持入境通APP开启

5. **行李领取** (Baggage Claim)
   - 找到行李转盘
   - 认领行李
   - 海关检查行李

6. **海关物品检查** (Customs Inspection)
   - 行李X光机检查
   - 如需人工检查配合进行
   - 检查完成后离开

7. **ATM取泰铢现金** (ATM Withdrawal)
   - 找到ATM机位置（到达大厅1楼）
   - 推荐银行：Bangkok Bank、Krungsri、Kasikorn Bank
   - 插入银行卡，选择英语界面
   - 输入密码，选择储蓄账户
   - 建议取款：3,000-5,000泰铢
   - 手续费约220泰铢/次
   - 注意安全，保护密码和现金

8. **打出租车去酒店** (Taxi to Hotel)
   - 使用入境通APP的"给出租车司机看的页面"
   - 找到官方"Public Taxi"柜台
   - 出示酒店地址（泰文+英文双语）
   - 拿到排队号码单
   - 确认司机打表（Meter）
   - 费用：约320-470泰铢（打表+50泰铢机场费+高速费）
   - 支付现金，准备小额钞票

#### 泰国特色步骤

- **TDAC数字入境卡**: 泰国推出的数字入境申报系统，必须在抵达前72小时内提交
- **通关包出示**: 在移民局检查时出示包含TDAC QR码的通关包
- **落地签办理**: 符合条件的旅客可现场办理签证
- **VAT退税**: 购物退税办理
- **机场快轨**: 曼谷机场快轨ARL指引

## 用户界面设计

### 1. 主屏幕设计

```
┌─────────────────────────────────────┐
│ ← 返回                              泰国入境指引 (TDAC) 🇹🇭
├─────────────────────────────────────┤
│ 🚨 重要提醒：抵达前72小时内提交TDAC获得QR码
│ 📍 当前位置：抵达前准备阶段
│ ⏱️ 预计用时：60-90分钟 (含ATM和打车)
├─────────────────────────────────────┤
│ 📋 入境步骤清单 (廊曼机场DMK)
│
│ 1. 🔄 TDAC数字入境卡 (进行中)
│ 2. ⏳ 飞机内准备通关包 (待完成)
│ 3. ⏳ 落地前准备 (待完成)
│ 4. ⏳ 移民局检查 (待完成)
│ 5. ⏳ 行李领取 (待完成)
│ 6. ⏳ ATM取泰铢现金 (待完成)
│ 7. ⏳ 官方出租车到酒店 (待完成)
│
│ 📱 提交TDAC数字入境卡
│    在抵达前72小时内提交，获得重要QR码
│    ⚠️ 必须保存QR码，入境时出示
│    💡 TDAC替代了纸质入境卡TM6
│
│ 💰 ATM取款准备
│    推荐银行：Bangkok Bank、Krungsri、Kasikorn Bank
│    建议金额：3,000-5,000泰铢
│    手续费：约220泰铢/次
│
│ 🚕 打车准备
│    使用入境通APP"给司机看的页面"
│    找官方Public Taxi柜台
│    费用：约320-470泰铢(含机场费和高速费)
│
│ [下一步：移民局检查]     [查看完整清单]
└─────────────────────────────────────┘
```

### 2. 步骤详情设计

每个步骤提供：

- **清晰的标题和图标**
- **步骤描述和操作指引**
- **重要提醒和警告**
- **实用提示和小技巧**
- **预计耗时**
- **相关图片或示意图**
- **下一步行动指引**

### 3. 进度跟踪

- **视觉进度条**: 显示总体完成进度
- **步骤状态指示器**: ✅已完成 🔄进行中 ⏳待完成 ❌跳过
- **时间估算**: 显示剩余时间和总用时
- **位置感知**: 根据当前位置显示相关步骤

## 多语言支持框架

### 语言文件结构

```javascript
// i18n/locales.js
export const entryGuide = {
  thailand: {
    steps: {
      step_1: {
        title: "关闭蜂窝网络",
        titleZh: "关闭蜂窝网络",
        description: "飞机落地滑行时，请关闭手机的蜂窝网络数据",
        descriptionZh: "飞机落地滑行时，请关闭手机的蜂窝网络数据",
        warnings: ["请勿在飞机滑行时使用手机"],
        tips: ["可以在设置中快速关闭蜂窝数据"],
      },
      // ... 更多步骤
    },
    customs: {
      prohibitedItems: ["新鲜水果", "肉类制品"],
      dutyFree: {
        alcohol: "1升",
        tobacco: "200支",
      },
    },
  },
};
```

## 国家扩展框架

### 新增国家配置步骤

1. **创建国家配置文件**

   ```javascript
   // app/config/entryGuide/japan.js
   export const japanEntryGuide = {
     country: "japan",
     steps: [
       /* 日本特定步骤 */
     ],
     customs: {
       /* 日本海关规则 */
     },
     emergency: {
       /* 日本紧急联系方式 */
     },
   };
   ```

2. **添加语言文件**

   ```javascript
   // i18n/locales.js
   export const entryGuide = {
     japan: {
       steps: {
         /* 日本步骤翻译 */
       },
       customs: {
         /* 日本海关翻译 */
       },
     },
   };
   ```

3. **创建国家特定组件**
   ```javascript
   // app/screens/entryGuide/JapanEntryGuideScreen.js
   // 日本特定的UI定制和逻辑
   ```

### 通用配置接口

```javascript
// app/services/entryGuide/EntryGuideService.js
class EntryGuideService {
  static getGuide(country) {
    const guides = {
      thailand: thailandEntryGuide,
      japan: japanEntryGuide,
      // 其他国家...
    };
    return guides[country] || thailandEntryGuide;
  }

  static getStep(country, stepId) {
    const guide = this.getGuide(country);
    return guide.steps.find((step) => step.id === stepId);
  }
}
```

## 泰国特色功能

### 1. TDAC数字入境卡填写指引

- 72小时提交窗口说明
- QR码生成和保存方法
- 通关包出示要求
- 常见填写错误避免

### 2. 通关包使用说明

- 通关包包含内容说明
- 出示时机和方法
- 移民官检查要点
- 备用方案准备

### 3. 落地签办理

- 资格检查和确认
- 所需文件清单
- 办理流程和等候时间
- 费用支付方式

### 4. ATM取泰铢现金指引

- ATM机位置和推荐银行（Bangkok Bank、Krungsri、Kasikorn Bank）
- 取款步骤和手续费说明（约220泰铢/次）
- 建议取款金额：3,000-5,000泰铢
- 安全提示和注意事项
- 钞票面额说明和小额找零准备

### 5. 机场交通指引（官方出租车）

- 官方"Public Taxi"柜台位置和使用方法
- 入境通APP"给出租车司机看的页面"功能
- 酒店地址双语显示（泰文+英文）
- 排队号码单和打表确认
- 费用构成：打表费（200-350泰铢）+机场服务费（50泰铢）+高速费（约70泰铢）
- 现金支付和小额钞票准备
- 安全提示：避免黑车，确认打表

### 5. ATM取款详细指引

- ATM机位置：到达大厅1楼，多台ATM机清晰可见
- 推荐银行和操作步骤
- 手续费说明：泰国ATM费220泰铢 + 银行境外取款费
- 建议取款金额和用途分配
- 安全提示：保护密码、注意周边环境、拒绝"帮助"
- 钞票面额：1,000泰铢（粉红色）、500泰铢（紫色）、100泰铢（红色）
- 小额找零准备：为打车和小型消费准备零钱

### 6. 官方出租车完整指南

- 官方"Public Taxi"柜台位置：1楼6号门或8号门附近
- 入境通APP"给出租车司机看的页面"功能详解
- 酒店地址双语显示优势：泰文+英文，司机易懂
- 排队号码单使用方法和注意事项
- 打表确认和费用构成详解
- 现金支付准备：小额钞票兑换建议
- 安全提示：避免黑车、确认打表、系安全带
- 司机沟通技巧：直接出示APP页面，无需自己翻译

### 7. 泰国文化提示

- 微笑文化和礼仪提醒
- 寺庙着装和行为建议
- 沟通技巧和基本泰语
- 货币和消费习惯
- 机场服务人员和司机礼仪

## 技术实现计划

### 第一阶段：泰国模板 (融入TDAC完整流程)

1. 创建通用数据模型和配置结构（支持8步骤流程）
2. 实现TDAC数字入境卡集成（72小时窗口提醒）
3. 设计通关包出示流程（移民局检查要点）
4. 实现ATM取款详细指引（银行推荐、手续费说明、安全提示）
5. 设计官方出租车指南（入境通APP司机页面、费用构成）
6. 实现泰国入境指引主屏幕（8步骤清单显示）
7. 添加步骤详情和导航逻辑（廊曼机场DMK特定内容）
8. 集成多语言支持（泰文+英文双语显示）

### 第二阶段：扩展框架

1. 创建国家配置管理系统
2. 实现动态国家切换
3. 添加新国家模板
4. 优化性能和缓存

### 第三阶段：高级功能

1. 离线模式支持
2. 进度同步和备份
3. 个性化推荐
4. 语音播报功能

## 质量保证

### 测试策略

- **功能测试**: 确保所有步骤按正确顺序显示
- **语言测试**: 验证中英文切换和显示
- **兼容性测试**: 不同设备和屏幕尺寸
- **离线测试**: 确保核心功能离线可用

### 用户反馈收集

- 使用情况统计
- 步骤完成率分析
- 用户行为模式研究
- 痛点和改进建议收集

## 总结

本设计文档定义了完整的入境指引系统模板，以泰国为例进行实现，特别融入了TDAC（泰国数字入境卡）和通关包的概念，并基于实际机场体验优化了完整8步骤流程。该系统具有以下特点：

1. **TDAC集成**: 支持泰国数字入境卡的72小时提交窗口和QR码出示
2. **通关包管理**: 统一管理所有入境证明材料，便于移民局检查
3. **ATM取款指引**: 详细的ATM机位置、银行推荐、手续费说明和安全提示
4. **官方出租车指南**: 入境通APP司机页面、酒店地址双语显示、费用构成详解
5. **机场特定内容**: 专为廊曼机场DMK设计的完整入境到酒店流程
6. **用户友好**: 渐进式指引，情境感知，防错设计
7. **技术先进**: 模块化架构，数据驱动，可扩展性强
8. **文化适配**: 考虑各国入境特色和文化差异
9. **实用性极强**: 涵盖落地后的完整流程，包括现金提取和酒店交通

该模板为未来扩展到日本、韩国、新加坡等其他国家奠定了坚实的基础，并已为各国特色数字入境系统做好了架构准备。特别优化了泰国廊曼机场的完整入境体验，从TDAC提交到酒店抵达的每一个细节都经过精心设计。
