# TDAC 测试数据

## 完整测试数据集

### 测试人员 1 - 中国游客

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
    "visaNo": "TH2024123456",
    "visaType": "Tourist Visa",
    "visaTypeCode": "TR",
    "issueDate": "2024-01-01",
    "expiryDate": "2024-07-01"
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

### 测试人员 2 - 商务访问

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
    "visaNo": "TH2024654321",
    "visaType": "Business Visa",
    "visaTypeCode": "B",
    "issueDate": "2024-01-05",
    "expiryDate": "2024-07-05"
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

### 测试人员 3 - 免签入境

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
    "visaNo": "",
    "visaType": "Visa Exemption",
    "visaTypeCode": "VE",
    "issueDate": "",
    "expiryDate": ""
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

## 签证号格式说明

### 泰国签证号格式

```
格式: THYYYYNNNNNN
TH - 国家代码 (Thailand)
YYYY - 年份
NNNNNN - 6位流水号

示例:
TH2024123456
TH2024654321
TH2023987654
```

### 常见签证类型

| 类型 | 代码 | 说明 | 示例签证号 |
|-----|------|------|-----------|
| Tourist Visa | TR | 旅游签证 | TH2024123456 |
| Business Visa | B | 商务签证 | TH2024654321 |
| Transit Visa | TS | 过境签证 | TH2024111222 |
| Non-Immigrant Visa | O | 非移民签证 | TH2024333444 |
| Visa Exemption | VE | 免签 | (空) |
| Visa on Arrival | VOA | 落地签 | (入境时获得) |

---

## 表单填写完整示例

### 使用测试人员1的数据

```javascript
// Step 1: Personal Information
familyName: "WANG"
firstName: "BUJIN"
passportNo: "E12345678"
nationality: "China"  // 从下拉选择或自动完成
birthYear: "1985"
birthMonth: "06"
birthDay: "15"
gender: "MALE"  // 单选按钮
occupation: "Software Engineer"

// Step 2: Visa Information (如果有)
visaNo: "TH2024123456"
visaType: "Tourist Visa"  // 或从下拉选择

// Step 3: Travel Information
flightNo: "CA123"
arrivalDate: "2024-01-20"
purposeOfVisit: "Tourism"  // 下拉选择
boardedCountry: "China"
departureDate: "2024-01-27"  // 有些表单需要

// Step 4: Accommodation
accommodationType: "Hotel"  // 下拉选择
hotelName: "Bangkok Grand Hotel"
address: "123 Sukhumvit Road, Watthana"
province: "Bangkok"  // 下拉选择或自动完成
district: "Watthana"
postalCode: "10110"
phoneCode: "86"
phoneNumber: "13800138000"

// Step 5: Health Declaration
hasSymptoms: false  // 复选框或单选
hasContact: false   // 复选框或单选
visitedCountries: "China"  // 可能是多选
vaccinationStatus: "Fully Vaccinated"  // 单选
```

---

## cURL 测试命令模板

```bash
# 替换成实际的API URL和token
curl -X POST \
  'https://tdac.immigration.go.th/api/v1/arrival-card/submit' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Cookie: cf_clearance=YOUR_CF_TOKEN_HERE' \
  -H 'Origin: https://tdac.immigration.go.th' \
  -H 'Referer: https://tdac.immigration.go.th/arrival-card/' \
  -d '{
  "familyName": "WANG",
  "firstName": "BUJIN",
  "passportNo": "E12345678",
  "nationality": "CHN",
  "birthYear": "1985",
  "birthMonth": "06",
  "birthDay": "15",
  "gender": "MALE",
  "occupation": "Software Engineer",
  "visaNo": "TH2024123456",
  "flightNo": "CA123",
  "arrivalDate": "2024-01-20",
  "purposeId": "1",
  "boardedCountry": "CHN",
  "accommodationType": "1",
  "address": "123 Sukhumvit Road, Watthana",
  "province": "Bangkok",
  "phoneCode": "86",
  "phoneNo": "13800138000",
  "hasSymptoms": false,
  "hasContact": false
}'
```

---

## Postman 导入格式

```json
{
  "info": {
    "name": "TDAC API Test",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Submit Arrival Card",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Accept",
            "value": "application/json"
          },
          {
            "key": "Cookie",
            "value": "cf_clearance={{cf_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"familyName\": \"WANG\",\n  \"firstName\": \"BUJIN\",\n  \"passportNo\": \"E12345678\",\n  \"nationality\": \"CHN\",\n  \"birthYear\": \"1985\",\n  \"birthMonth\": \"06\",\n  \"birthDay\": \"15\",\n  \"gender\": \"MALE\",\n  \"occupation\": \"Software Engineer\",\n  \"visaNo\": \"TH2024123456\",\n  \"flightNo\": \"CA123\",\n  \"arrivalDate\": \"2024-01-20\",\n  \"purposeId\": \"1\",\n  \"boardedCountry\": \"CHN\",\n  \"accommodationType\": \"1\",\n  \"address\": \"123 Sukhumvit Road, Watthana\",\n  \"province\": \"Bangkok\",\n  \"phoneCode\": \"86\",\n  \"phoneNo\": \"13800138000\",\n  \"hasSymptoms\": false,\n  \"hasContact\": false\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/v1/arrival-card/submit",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "arrival-card", "submit"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://tdac.immigration.go.th"
    },
    {
      "key": "cf_token",
      "value": "YOUR_CLOUDFLARE_TOKEN_HERE"
    }
  ]
}
```

---

## App中使用

### 更新 TripSecretary 测试数据

在 `app/screens/TDACWebViewScreen.js` 中的测试数据：

```javascript
// 测试数据
const testPassport = {
  nameEn: 'BUJIN WANG',
  familyName: 'WANG',
  firstName: 'BUJIN',
  passportNo: 'E12345678',
  nationality: 'China',
  birthDate: '1985-06-15',
  gender: 'Male',
  visaNo: 'TH2024123456'  // 添加签证号
};

const testTravelInfo = {
  flightNumber: 'CA123',
  arrivalDate: '2024-01-20',
  departureDate: '2024-01-27',
  travelPurpose: 'Tourism',
  departureCountry: 'China',
  occupation: 'Software Engineer',
  accommodationType: 'Hotel',
  accommodationName: 'Bangkok Grand Hotel',
  accommodationAddress: '123 Sukhumvit Road, Watthana',
  province: 'Bangkok',
  phoneNumber: '13800138000'
};
```

---

## 快速填写指南

### 在TDAC网站手动填写时使用：

**复制以下数据（可直接粘贴）：**

```
Family Name: WANG
First Name: BUJIN
Passport No: E12345678
Nationality: China
Birth Year: 1985
Birth Month: 06
Birth Day: 15
Gender: Male
Occupation: Software Engineer

Visa No: TH2024123456
Visa Type: Tourist Visa

Flight No: CA123
Arrival Date: 2024-01-20
Purpose: Tourism
Boarded Country: China

Accommodation Type: Hotel
Hotel Name: Bangkok Grand Hotel
Address: 123 Sukhumvit Road, Watthana
Province: Bangkok
District: Watthana
Postal Code: 10110
Phone: +86 13800138000

Health Declaration:
☐ No symptoms
☐ No contact with COVID-19
Visited Countries: China
```

---

## 注意事项

### ⚠️ 测试数据说明

1. **这些是测试数据，不是真实信息**
2. 护照号格式：E + 8位数字（中国护照）
3. 签证号格式：TH + 年份 + 6位数字
4. 电话号格式：国家码(86) + 11位手机号
5. 日期格式：YYYY-MM-DD

### 🔒 真实使用时

1. 使用真实的护照信息
2. 使用真实的签证号（如果有签证）
3. 使用真实的航班号和日期
4. 使用真实的泰国住宿地址
5. 使用可以接收邮件的真实邮箱

### 📝 签证信息查询

- 如果有签证，签证号在签证贴纸上
- 如果免签入境，签证号留空
- 落地签在入境时获得，提前填写时留空

---

## 生成更多测试数据

```javascript
// 随机生成函数
function generateTestData() {
  const surnames = ['WANG', 'ZHANG', 'LI', 'ZHAO', 'CHEN'];
  const firstNames = ['WEI', 'MING', 'JUN', 'LEI', 'FANG'];
  const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomPassport = 'E' + Math.floor(10000000 + Math.random() * 90000000);
  const randomVisa = 'TH2024' + Math.floor(100000 + Math.random() * 900000);
  
  return {
    familyName: randomSurname,
    firstName: randomFirstName,
    passportNo: randomPassport,
    visaNo: randomVisa
  };
}

// 生成5组测试数据
for (let i = 0; i < 5; i++) {
  console.log(generateTestData());
}
```

这些测试数据可以用于抓包和API测试！🚀
