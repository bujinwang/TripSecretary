# 免签标签功能

## 功能说明

在目的地选择屏幕上，为符合免签条件的国家显示"免签"标签，帮助用户快速识别旅行便利性。

## 实现细节

### 1. 签证要求数据 (`app/data/visaRequirements.js`)

创建了签证要求数据库，包含：
- 中国护照 (CN)
- 香港特区护照 (HK)  
- 台湾护照 (TW)

每个目的地包含：
- `visaFree`: 是否免签
- `stayDays`: 免签停留天数
- `visaType`: 签证类型 (visa-free, required, eta, permit等)

### 2. CountryCard组件更新

添加了 `visaFree` 属性，当为 `true` 时显示绿色"免签"标签：
- 位置：卡片右上角
- 颜色：绿色 (#07C160)
- 文字：白色，11号字体

### 3. SelectDestinationScreen更新

- 从护照信息中获取国籍代码
- 为每个国家查询签证要求
- 将 `visaFree` 属性传递给 CountryCard

## 示例效果

对于中国护照持有者：
- ✅ 泰国 - 显示"免签"标签 (30天)
- ✅ 香港 - 显示"免签"标签 (7天)
- ✅ 新加坡 - 显示"免签"标签 (30天)
- ✅ 马来西亚 - 显示"免签"标签 (30天)
- ❌ 日本 - 不显示标签 (需要签证)
- ❌ 韩国 - 不显示标签 (需要签证)

## 使用方法

```javascript
import { getVisaRequirement } from '../data/visaRequirements';

// 获取签证要求
const visaReq = getVisaRequirement('CN', 'th'); // 中国护照去泰国
console.log(visaReq); 
// { visaFree: true, stayDays: 30, visaType: 'visa-free' }
```

## 未来扩展

可以考虑：
1. 显示免签停留天数 (如"免签30天")
2. 不同签证类型使用不同颜色标签
3. 添加更多国家的护照数据
4. 支持落地签、电子签等其他签证类型的标识
