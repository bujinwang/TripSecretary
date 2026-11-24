# 入境指引国家模板

## 概述

本模板定义了为新国家添加入境指引配置的标准格式。只需按照此模板创建配置文件，即可轻松扩展入境指引系统到新的国家/地区。

## 模板结构

### 1. 基本国家信息

### 1. 基本国家信息

````typescript
export interface CountryEntryGuide {
  country: string;                    // 国家代码，如 'japan'
  countryName: string;                // 英文国家名称
  countryNameZh: string;              // 中文国家名称
  primaryAirport: string;             // 主要机场代码，如 'NRT'
  currency: string;                   // 货币代码，如 'JPY'
  language: string[];                 // 主要语言和英语

  // 入境步骤定义
  steps: EntryGuideStep[];

  // 海关规定
  customs: {
    declarationRequired: boolean;     // 是否需要海关申报
    prohibitedItems: string[];        // 禁止携带物品列表
    dutyFree: {                       // 免税额度
      alcohol: string;
      tobacco: string;
      currency: string;
    };
  };

  // 紧急联系方式
  emergency: {
    police: string;                   // 警察
    ambulance: string;                // 急救
    embassy: string;                  // 大使馆
  };

  // 实用提示
  tips: string[];
  metadata?: {
    lastUpdated: string;
    version: string;
  };
}

export const [countryName]EntryGuide: CountryEntryGuide = {
  country: '[country_code]',
  countryName: '[Country Name]',
  countryNameZh: '[国家中文名称]',
  primaryAirport: '[AIRPORT_CODE]',
  currency: '[CURRENCY_CODE]',
  language: ['primary_lang', 'en'],

  // 入境步骤定义
  steps: [
    // 步骤数组，详见下文
  ],

  // 海关规定
### 2. 步骤定义格式

每个步骤应包含以下字段：

```typescript
export interface EntryGuideStep {
  id: string;                        // 唯一步骤标识符
  category: string;                  // 步骤分类英文名称
  categoryZh: string;                // 步骤分类中文名称
  title: string;                     // 英文标题
  titleZh: string;                   // 中文标题
  description: string;               // 英文详细描述
  descriptionZh: string;             // 中文详细描述
  priority: number;                  // 显示优先级（数字越小越靠前）
  estimatedTime: string;             // 预计耗时
  warnings: string[];                // 重要提醒
  tips: string[];                    // 实用技巧
  icon: string;                      // 步骤图标
  required: boolean;                 // 是否为必做步骤
  skippable: boolean;                // 是否可以跳过
  dependencies?: string[];           // 依赖的其他步骤ID
  location?: string;                 // 机场位置标识符
  duration?: number;                 // 预计耗时（分钟）
}

const stepExample: EntryGuideStep = {
  id: 'unique_step_id',
  category: '步骤分类',
  categoryZh: '步骤分类中文',
  title: 'Step Title',
  titleZh: '步骤标题中文',
  description: 'Detailed description of what to do in this step',
  descriptionZh: '该步骤需要做什么的详细说明',
  priority: 1,
  estimatedTime: '5分钟',
  warnings: [
    'Important warning 1',
    'Important warning 2'
  ],
  tips: [
    'Helpful tip 1',
    'Helpful tip 2'
  ],
  icon: '📱',
  required: true,
  skippable: false
};
````

customs: {
declarationRequired: true,
prohibitedItems: [
'新鲜水果',
'肉类制品',
'违禁药品'
],
dutyFree: {
alcohol: '1升',
tobacco: '200支',
currency: '等值20000元'
}
},

// 紧急联系方式
emergency: {
police: '110',
ambulance: '120',
embassy: '+86-10-12345678'
},

// 实用提示
tips: [
'机场交通：推荐使用机场快轨',
'货币兑换：在机场兑换少量现金',
'语言沟通：机场工作人员大多会英语'
]
};

```javascript
export const [countryName]EntryGuide = {
  country: '[country_code]',           // 国家代码，如 'japan'
  countryName: '[Country Name]',       // 英文国家名称
  countryNameZh: '[国家中文名称]',     // 中文国家名称
  primaryAirport: '[AIRPORT_CODE]',    // 主要机场代码，如 'NRT'
  currency: '[CURRENCY_CODE]',         // 货币代码，如 'JPY'
  language: ['primary_lang', 'en'],    // 主要语言和英语

  // 入境步骤定义
  steps: [
    // 步骤数组，详见下文
  ],

  // 海关规定
  customs: {
    declarationRequired: true,         // 是否需要海关申报
    prohibitedItems: [                 // 禁止携带物品列表
      '新鲜水果',
      '肉类制品',
      '违禁药品'
    ],
    dutyFree: {                        // 免税额度
      alcohol: '1升',
      tobacco: '200支',
      currency: '等值20000元'
    }
  },

  // 紧急联系方式
  emergency: {
    police: '110',                     // 警察
    ambulance: '120',                  // 急救
    embassy: '+86-10-12345678'         // 大使馆
  },

  // 实用提示
  tips: [
    '机场交通：推荐使用机场快轨',
    '货币兑换：在机场兑换少量现金',
    '语言沟通：机场工作人员大多会英语'
  ]
}
```

### 2. 步骤定义格式

每个步骤应包含以下字段：

```javascript
{
  id: 'unique_step_id',              // 唯一步骤标识符
  category: '步骤分类',              // 英文分类名称
  categoryZh: '步骤分类中文',        // 中文分类名称
  title: 'Step Title',               // 英文标题
  titleZh: '步骤标题中文',           // 中文标题
  description: 'Detailed description of what to do in this step',
  descriptionZh: '该步骤需要做什么的详细说明',
  priority: 1,                       // 显示优先级（数字越小越靠前）
  estimatedTime: '5分钟',            // 预计耗时
  warnings: [                        // 重要提醒
    'Important warning 1',
    'Important warning 2'
  ],
  tips: [                           // 实用技巧
    'Helpful tip 1',
    'Helpful tip 2'
  ],
  icon: '📱',                       // 步骤图标
  required: true,                   // 是否为必做步骤
  skippable: false                  // 是否可以跳过
}
```

### 3. 分类定义

常见的步骤分类：

#### 飞机内阶段 (In-Flight)

- 填写海关申报表
- 准备证件和文件
- 了解机场布局

#### 落地后阶段 (Post-Landing)

- 关闭蜂窝网络
- 设置当地eSIM卡
- 排队等候

#### 海关阶段 (Customs)

- 海关申报通道选择
- 物品申报和检查
- 违禁物品提醒

#### 移民局阶段 (Immigration)

- 移民官检查
- 指纹采集和拍照
- 签证盖章

#### 行李领取阶段 (Baggage Claim)

- 行李转盘指引
- 行李认领
- 海关二次检查

#### 出机场阶段 (Exit)

- 货币兑换
- 购买当地电话卡
- 安排机场交通

## 新增国家步骤

### 1. 创建国家配置文件

在 `app/config/entryGuide/` 目录下创建新文件：

```javascript
// app/config/entryGuide/japan.js
export const japanEntryGuide = {
  country: "japan",
  countryName: "Japan",
  countryNameZh: "日本",
  primaryAirport: "NRT",
  currency: "JPY",
  language: ["ja", "en"],

  steps: [
    {
      id: "in_flight_prep",
      category: "飞机内准备",
      categoryZh: "飞机内准备",
      title: "填写日本入境卡",
      titleZh: "填写日本入境卡",
      description: "飞机上领取黑色入境卡，用黑色或蓝色笔填写个人信息",
      descriptionZh: "飞机上领取黑色入境卡，用黑色或蓝色笔填写个人信息",
      priority: 1,
      estimatedTime: "10分钟",
      warnings: [
        "必须用黑色或蓝色笔填写",
        "字迹要清晰工整",
        "姓名必须与护照一致",
      ],
      tips: [
        "姓名格式：SURNAME, Given Name",
        "航班号格式：NH123",
        "住宿地址可填写酒店名称",
      ],
      icon: "✈️",
      required: true,
      skippable: false,
    },
    {
      id: "post_landing_1",
      category: "落地后立即",
      categoryZh: "落地后立即",
      title: "关闭蜂窝网络",
      titleZh: "关闭蜂窝网络",
      description: "飞机落地滑行时关闭手机蜂窝网络数据",
      descriptionZh: "飞机落地滑行时关闭手机蜂窝网络数据",
      priority: 2,
      estimatedTime: "1分钟",
      warnings: ["飞机滑行时请勿使用手机", "确保WiFi也已关闭"],
      tips: ["可在设置中快速关闭蜂窝数据", "落地后立即关闭节省国际漫游费"],
      icon: "📱",
      required: true,
      skippable: false,
    },
    // ... 更多日本特定步骤
  ],

  customs: {
    declarationRequired: true,
    prohibitedItems: ["新鲜肉类", "新鲜水果", "枪支弹药", "毒品"],
    dutyFree: {
      alcohol: "3瓶",
      tobacco: "400支",
      currency: "等值100万日元",
    },
  },

  emergency: {
    police: "110",
    ambulance: "119",
    embassy: "+81-3-3403-3380",
  },

  tips: [
    "机场交通：推荐使用JR成田特快或京成电铁",
    "货币兑换：在机场兑换少量现金，市中心汇率更好",
    "语言沟通：机场工作人员大多会英语和中文",
  ],
};
```

### 2. 添加语言支持

在 `app/i18n/locales.js` 中添加对应翻译：

```javascript
japan: {
  entryGuide: {
    steps: {
      step_1: {
        title: '填写日本入境卡',
        titleZh: '填写日本入境卡',
        description: '飞机上领取黑色入境卡，用黑色或蓝色笔填写个人信息',
        descriptionZh: '飞机上领取黑色入境卡，用黑色或蓝色笔填写个人信息',
        warnings: ['必须用黑色或蓝色笔填写'],
        tips: ['姓名格式：SURNAME, Given Name']
      }
      // ... 更多步骤翻译
    },
    customs: {
      prohibitedItems: ['新鲜肉类', '新鲜水果'],
      dutyFree: {
        alcohol: '3瓶',
        tobacco: '400支'
      }
    }
  }
}
```

### 3. 更新服务注册

在 `EntryGuideService.jsx` 中注册新国家：

```javascript
static SUPPORTED_COUNTRIES = {
  thailand: {
    id: 'thailand',
    name: '泰国',
    nameZh: '泰国',
    flag: '🇹🇭',
    primaryAirport: 'BKK',
    currency: 'THB',
    language: ['th', 'en'],
    guide: thailandEntryGuide
  },
  japan: {
    id: 'japan',
    name: '日本',
    nameZh: '日本',
    flag: '🇯🇵',
    primaryAirport: 'NRT',
    currency: 'JPY',
    language: ['ja', 'en'],
    guide: japanEntryGuide
  }
  // ... 更多国家
}
```

### 4. 创建国家特定组件（可选）

如果需要定制UI，可以创建特定组件：

```javascript
// app/screens/entryGuide/JapanEntryGuideScreen.jsx
import React from "react";
import ThailandEntryGuideScreen from "../ThailandEntryGuideScreen";

const JapanEntryGuideScreen = (props) => {
  return (
    <ThailandEntryGuideScreen
      {...props}
      country="japan"
      customStyles={japanSpecificStyles}
    />
  );
};

export default JapanEntryGuideScreen;
```

## 国家特色配置示例

### 日本特色

```javascript
{
  // 日本特有的生物识别步骤
  biometricRequired: true,
  forms: {
    landingCard: {
      color: '黑色',
      fields: ['姓名', '护照号', '航班号', '住宿地址']
    },
    customsDeclaration: {
      color: '黄色',
      questions: ['携带违禁品', '携带现金超过限额']
    }
  }
}
```

### 新加坡特色

```javascript
{
  // 新加坡特有的SG Arrival Card
  digitalCard: {
    required: true,
    submissionWindow: '抵达前3天',
    systemName: 'SG Arrival Card'
  },
  familySubmission: true // 支持家庭批量申报
}
```

### 美国特色

```javascript
{
  // 美国特有的ESTA和海关程序
  esta: {
    required: true,
    validity: '2年',
    applicationUrl: 'https://esta.cbp.dhs.gov'
  },
  customsForm: 'CBP Form 6059B'
}
```

## 质量检查清单

在添加新国家配置前，请确认：

- [ ] 所有步骤都有中英文翻译
- [ ] 步骤顺序符合实际入境流程
- [ ] 包含了该国特有的程序和要求
- [ ] 紧急联系方式准确有效
- [ ] 海关规定信息最新
- [ ] 实用提示具有实际价值
- [ ] 在EntryGuideService中正确注册
- [ ] 测试了步骤导航和进度跟踪

## 扩展建议

### 优先级排序

1. **亚洲热门目的地**: 日本、韩国、新加坡、越南、印尼
2. **欧洲**: 法国、德国、英国、意大利
3. **美洲**: 美国、加拿大
4. **大洋洲**: 澳大利亚、新西兰

### 特色功能

- **生物识别程序**: 日本、美国、欧盟国家
- **数字申报系统**: 新加坡、马来西亚、泰国
- **落地签服务**: 泰国、印尼、斯里兰卡
- **转机程序**: 迪拜、新加坡、香港

通过此模板，新国家可以在短时间内轻松集成到入境指引系统中，为用户提供准确、实用的入境指导。
