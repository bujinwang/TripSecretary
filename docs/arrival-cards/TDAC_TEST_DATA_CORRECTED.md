# TDAC 测试数据（修正版） - 针对中国游客

## 🇨🇳 中国护照持有者 - 免签入境（最常用）

### 测试人员 1 - 免签游客（推荐使用）⭐

```json
{
  "personal": {
    "familyName": "WANG",
    "firstName": "BUJIN",
    "passportNo": "E12345678",
    "nationality": "China",
    "nationalityCode": "CHN",
    "gender": "MALE",
    "birthDate": {
      "year": "1985",
      "month": "06",
      "day": "15"
    },
    "occupation": "Software Engineer"
  },
  "visa": {
    "visaNo": "",
    "visaType": "Visa Exemption",
    "visaTypeCode": "VE",
    "issueDate": "",
    "expiryDate": ""
  },
  "travel": {
    "flightNo": "CA123",
    "carrierCode": "CA",
    "arrivalDate": "2024-01-20",
    "departureDate": "2024-01-27",
    "purposeOfVisit": "Tourism",
    "purposeId": "1",
    "boardedCountry": "China",
    "boardedCountryCode": "CHN",
    "port": "Suvarnabhumi Airport",
    "portCode": "BKK"
  },
  "accommodation": {
    "type": "Hotel",
    "typeId": "1",
    "name": "Bangkok Grand Hotel",
    "address": "123 Sukhumvit Road, Watthana",
    "province": "Bangkok",
    "provinceCode": "BKK",
    "district": "Watthana",
    "postalCode": "10110",
    "phone": {
      "countryCode": "86",
      "number": "13800138000"
    }
  },
  "health": {
    "hasSymptoms": false,
    "hasContact": false,
    "temperature": "36.5",
    "visitedCountries": ["CHN"],
    "vaccinationStatus": "Fully Vaccinated"
  }
}
```

### 测试人员 2 - 免签商务访问

```json
{
  "personal": {
    "familyName": "ZHANG",
    "firstName": "WEI",
    "passportNo": "E87654321",
    "nationality": "China",
    "nationalityCode": "CHN",
    "gender": "FEMALE",
    "birthDate": {
      "year": "1990",
      "month": "03",
      "day": "22"
    },
    "occupation": "Business Manager"
  },
  "visa": {
    "visaNo": "",
    "visaType": "Visa Exemption",
    "visaTypeCode": "VE",
    "issueDate": "",
    "expiryDate": ""
  },
  "travel": {
    "flightNo": "MU567",
    "carrierCode": "MU",
    "arrivalDate": "2024-01-22",
    "departureDate": "2024-01-25",
    "purposeOfVisit": "Business",
    "purposeId": "2",
    "boardedCountry": "China",
    "boardedCountryCode": "CHN",
    "port": "Don Mueang Airport",
    "portCode": "DMK"
  },
  "accommodation": {
    "type": "Hotel",
    "typeId": "1",
    "name": "Siam Business Hotel",
    "address": "456 Rama IV Road, Pathum Wan",
    "province": "Bangkok",
    "provinceCode": "BKK",
    "district": "Pathum Wan",
    "postalCode": "10330",
    "phone": {
      "countryCode": "86",
      "number": "13900139000"
    }
  },
  "health": {
    "hasSymptoms": false,
    "hasContact": false,
    "temperature": "36.6",
    "visitedCountries": ["CHN"],
    "vaccinationStatus": "Fully Vaccinated"
  }
}
```

---

## 🎫 已办理签证的情况（特殊情况）

### 测试人员 3 - 持旅游签证

```json
{
  "personal": {
    "familyName": "LI",
    "firstName": "MING",
    "passportNo": "E11223344",
    "nationality": "China",
    "nationalityCode": "CHN",
    "gender": "MALE",
    "birthDate": {
      "year": "1988",
      "month": "12",
      "day": "10"
    },
    "occupation": "Teacher"
  },
  "visa": {
    "visaNo": "TH2024123456",
    "visaType": "Tourist Visa",
    "visaTypeCode": "TR",
    "issueDate": "2024-01-01",
    "expiryDate": "2024-07-01"
  },
  "travel": {
    "flightNo": "TG615",
    "carrierCode": "TG",
    "arrivalDate": "2024-01-25",
    "departureDate": "2024-02-08",
    "purposeOfVisit": "Tourism",
    "purposeId": "1",
    "boardedCountry": "China",
    "boardedCountryCode": "CHN",
    "port": "Phuket International Airport",
    "portCode": "HKT"
  },
  "accommodation": {
    "type": "Resort",
    "typeId": "2",
    "name": "Phuket Beach Resort",
    "address": "789 Beach Road, Patong",
    "province": "Phuket",
    "provinceCode": "PHU",
    "district": "Kathu",
    "postalCode": "83150",
    "phone": {
      "countryCode": "86",
      "number": "13700137000"
    }
  },
  "health": {
    "hasSymptoms": false,
    "hasContact": false,
    "temperature": "36.4",
    "visitedCountries": ["CHN"],
    "vaccinationStatus": "Fully Vaccinated"
  }
}
```

---

## 📋 在TDAC网站手动填写指南

### 免签情况（最常用）✅

```
=== Personal Information ===
Family Name: WANG
First Name: BUJIN
Passport No: E12345678
Nationality: China
Birth Year: 1985
Birth Month: 06
Birth Day: 15
Gender: Male
Occupation: Software Engineer

=== Visa Information ===
Do you have a visa? NO ☑️
或
Visa Type: Visa Exemption ☑️
Visa No: [留空或填 EXEMPT]

=== Travel Information ===
Flight No: CA123
Arrival Date: 2024-01-20
Purpose: Tourism
Boarded Country: China

=== Accommodation ===
Type: Hotel
Hotel Name: Bangkok Grand Hotel
Address: 123 Sukhumvit Road, Watthana
Province: Bangkok
Phone: +86 13800138000

=== Health Declaration ===
☐ No symptoms
☐ No contact with COVID-19
Visited Countries: China
```

### 有签证情况

```
=== Visa Information ===
Do you have a visa? YES ☑️
Visa Type: Tourist Visa
Visa No: TH2024123456
Issue Date: 2024-01-01
Expiry Date: 2024-07-01

[其他字段同上]
```

---

## 🔍 TDAC表单中的签证字段可能形式

### 形式1: 下拉选择

```html
<select name="visaType">
  <option value="VE">Visa Exemption</option>
  <option value="VOA">Visa on Arrival</option>
  <option value="TR">Tourist Visa</option>
  <option value="B">Business Visa</option>
  <option value="O">Non-Immigrant Visa</option>
</select>
```

### 形式2: 单选按钮

```html
Do you have a visa?
( ) Yes  (○) No

[如果选No，签证号字段隐藏]
```

### 形式3: 条件显示

```javascript
if (hasVisa === true) {
  // 显示签证号输入框
  <input name="visaNo" required />
} else {
  // 隐藏或显示 "EXEMPT"
  <input name="visaNo" value="EXEMPT" disabled />
}
```

---

## 🎯 抓包时的注意事项

### 场景A: 使用免签（推荐）

```
优点:
✅ 最常见的情况
✅ 不需要签证号
✅ 简化字段

填写时:
- Visa字段留空或选择 "Visa Exemption"
- 观察API请求中签证相关字段的格式
```

### 场景B: 使用有效签证

```
优点:
✅ 可以看到完整的签证字段

填写时:
- Visa No: TH2024123456
- 观察API如何处理签证信息
```

---

## 🤔 常见问题

### Q1: 中国护照真的免签吗？

**A: 是的！** 

2024年起：
- 停留时间: 60天（之前是30天）
- 免签证费
- 可以多次往返（每次60天）
- 适用于旅游和商务

### Q2: 免签和落地签的区别？

| 类型 | 中国护照 | 费用 | 停留时间 | 提前办理 |
|------|----------|------|----------|----------|
| 免签 | ✅ 适用 | 免费 | 60天 | 不需要 |
| 落地签 | ❌ 不适用 | 2000฿ | 15天 | 不需要 |
| 旅游签 | ✅ 可办理 | ~300元 | 60天 | 需要 |

### Q3: TDAC表单必须填签证号吗？

**A: 不一定！**

```javascript
// 免签情况
visaNo: "" // 留空
或
visaNo: "EXEMPT" // 明确标识免签
或
visaType: "VE" // 只选类型，不填号码
```

### Q4: 抓包时应该选哪种情况？

**A: 两种都抓！**

```
第一次: 使用免签（visaNo留空）
  → 看看API如何处理空的签证号

第二次: 使用有签证（visaNo: TH2024123456）
  → 看看API如何处理有签证的情况
  → 确保我们的实现支持两种情况
```

---

## 📦 修正后的App测试数据

```javascript
// app/screens/TDACWebViewScreen.js

// 免签测试数据（推荐）
const testPassportVE = {
  nameEn: 'BUJIN WANG',
  familyName: 'WANG',
  firstName: 'BUJIN',
  passportNo: 'E12345678',
  nationality: 'China',
  birthDate: '1985-06-15',
  gender: 'Male',
  visaNo: '',  // 免签留空
  visaType: 'Visa Exemption'
};

// 有签证测试数据（备选）
const testPassportVisa = {
  nameEn: 'BUJIN WANG',
  familyName: 'WANG',
  firstName: 'BUJIN',
  passportNo: 'E12345678',
  nationality: 'China',
  birthDate: '1985-06-15',
  gender: 'Male',
  visaNo: 'TH2024123456',  // 有签证填号码
  visaType: 'Tourist Visa'
};
```

---

## 🎬 抓包建议

### 方案1: 只抓免签情况（快速）

```
时间: 10分钟
数据: 免签的完整流程
优点: 符合大多数中国游客的实际情况
```

### 方案2: 两种都抓（完整）

```
时间: 20分钟
数据: 
  - 第一次: 免签流程
  - 第二次: 有签证流程
优点: 确保支持所有情况
```

---

## ✅ 总结

**对于中国游客使用BorderBuddy App**：

1. **默认情况**: 免签（Visa No留空）
2. **特殊情况**: 用户已办理签证（填写签证号）
3. **App应支持**: 两种情况的自动填充

**抓包时推荐**：
- 先用免签数据抓一次（最重要）
- 有时间的话用有签证数据再抓一次（确保兼容性）

现在继续进行抓包操作吧！使用**免签**的测试数据（Visa No留空）最符合实际使用场景。🚀✨
