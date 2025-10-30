# TDAC 提交日志功能使用示例

## 闪电提交日志示例

当用户选择闪电提交时，在Cloudflare验证完成后会显示以下日志：

### 控制台输出示例

```
🔍 ===== TDAC 闪电提交详细日志 =====
⏰ 提交时间: 2024-12-19 14:30:25
🌐 提交方式: 闪电提交 (Hybrid Mode)
🔑 Cloudflare Token: ✅ 已获取 (长度: 1234)

📋 === 个人信息 Personal Information ===
👤 姓名 (Name):
  - 姓 (Family Name): ZHANG → TDAC字段: familyName
  - 名 (First Name): WEI → TDAC字段: firstName
  - 中间名 (Middle Name): (空) → TDAC字段: middleName

📄 护照信息 (Passport):
  - 护照号 (Passport No): E12345678 → TDAC字段: passportNo
  - 国籍 (Nationality): China → TDAC字段: nationality
  - 出生日期 (Birth Date): 1990-01-01 → TDAC字段: birthDate
  - 性别 (Gender): MALE → TDAC字段: gender

🏠 居住信息 (Residence):
  - 居住城市 (City): Beijing → TDAC字段: cityResidence
  - 居住国家 (Country): China → TDAC字段: countryResidence
  - 职业 (Occupation): Engineer → TDAC字段: occupation

✈️ === 旅行信息 Travel Information ===
📅 日期 (Dates):
  - 到达日期 (Arrival Date): 2024-12-25 → TDAC字段: arrivalDate
  - 离开日期 (Departure Date): (未设置) → TDAC字段: departureDate

🛫 航班信息 (Flight):
  - 航班号 (Flight No): CA123 → TDAC字段: flightNo
  - 出发国家 (Country Boarded): China → TDAC字段: countryBoarded
  - 旅行方式 (Travel Mode): AIR → TDAC字段: travelMode
  - 旅行目的 (Purpose): Tourism → TDAC字段: purpose

🏨 === 住宿信息 Accommodation Information ===
🏠 住宿类型 (Type): Hotel → TDAC字段: accommodationType
📍 地址信息 (Address):
  - 省份 (Province): Bangkok → TDAC字段: province
  - 区域 (District): Bang Bon → TDAC字段: district
  - 子区域 (Sub District): Bang Bon Nuea → TDAC字段: subDistrict
  - 邮编 (Post Code): 10150 → TDAC字段: postCode
  - 详细地址 (Address): 123 Sukhumvit Road → TDAC字段: address

📞 === 联系信息 Contact Information ===
📧 邮箱 (Email): zhang.wei@example.com → TDAC字段: email
📱 电话 (Phone):
  - 国家代码 (Country Code): 86 → TDAC字段: phoneCode
  - 电话号码 (Phone Number): 13800138000 → TDAC字段: phoneNo

🆔 === 签证信息 Visa Information ===
📋 签证号 (Visa No): (免签) → TDAC字段: visaNo

🔧 === 技术信息 Technical Information ===
🔑 Cloudflare Token 预览: cf_clearance_12345abcdef...
⚙️ 传输模式ID (Trans Mode ID): (自动) → TDAC字段: tranModeId

📊 === 表单字段映射 Form Field Mappings ===
  1. 姓氏: "ZHANG" → TDAC字段ID: familyName
  2. 名字: "WEI" → TDAC字段ID: firstName
  3. 护照号: "E12345678" → TDAC字段ID: passportNo
  4. 国籍: "China" → TDAC字段ID: nationality
  5. 性别: "MALE" → TDAC字段ID: gender
  6. 出生日期: "1990-01-01" → TDAC字段ID: birthDate
  7. 职业: "Engineer" → TDAC字段ID: occupation
  8. 邮箱: "zhang.wei@example.com" → TDAC字段ID: email
  9. 电话代码: "86" → TDAC字段ID: phoneCode
  10. 电话号码: "13800138000" → TDAC字段ID: phoneNo
  11. 到达日期: "2024-12-25" → TDAC字段ID: arrivalDate
  12. 航班号: "CA123" → TDAC字段ID: flightNo
  13. 出发国家: "China" → TDAC字段ID: countryBoarded
  14. 旅行目的: "Tourism" → TDAC字段ID: purpose
  15. 住宿类型: "Hotel" → TDAC字段ID: accommodationType
  16. 省份: "Bangkok" → TDAC字段ID: province
  17. 详细地址: "123 Sukhumvit Road" → TDAC字段ID: address

⚠️ === 重要提醒 Important Notes ===
🚨 此信息将直接提交给泰国移民局 (TDAC)
🚨 提交后无法修改，请仔细核对
🚨 多次提交可能导致账户被暂时封禁
🚨 请确保所有信息与护照完全一致

🔍 ===== 日志记录完成 =====
✅ 提交日志已保存到本地存储
```

### 手动确认对话框示例

#### 第一步：基础确认
```
🛑 确认提交

🔍 即将提交的信息：

👤 个人信息：
• 姓名: ZHANG WEI
• 护照号: E12345678
• 国籍: China
• 性别: MALE
• 出生日期: 1990-01-01

✈️ 旅行信息：
• 到达日期: 2024-12-25
• 航班号: CA123
• 出发国家: China
• 旅行目的: Tourism

🏨 住宿信息：
• 住宿类型: Hotel
• 省份: Bangkok
• 地址: 123 Sukhumvit Road

📞 联系信息：
• 邮箱: zhang.wei@example.com
• 电话: +86 13800138000

⚠️ 重要提醒：
• 信息将直接提交给泰国移民局
• 提交后无法修改
• 多次提交可能被封禁
• 请确保与护照信息一致

[❌ 取消] [📝 查看详细日志] [✅ 确认提交]
```

#### 第二步：详细日志确认（如果用户点击"查看详细日志"）
```
📋 详细字段映射

🔍 TDAC 表单字段映射详情：

📋 个人信息字段：
• familyName → "ZHANG"
• firstName → "WEI"
• middleName → "(空)"
• passportNo → "E12345678"
• nationality → "China"
• gender → "MALE"
• birthDate → "1990-01-01"
• occupation → "Engineer"

📋 居住信息字段：
• cityResidence → "Beijing"
• countryResidence → "China"

📋 旅行信息字段：
• arrivalDate → "2024-12-25"
• departureDate → "(未设置)"
• flightNo → "CA123"
• countryBoarded → "China"
• travelMode → "AIR"
• purpose → "Tourism"

📋 住宿信息字段：
• accommodationType → "Hotel"
• province → "Bangkok"
• district → "Bang Bon"
• subDistrict → "Bang Bon Nuea"
• postCode → "10150"
• address → "123 Sukhumvit Road"

📋 联系信息字段：
• email → "zhang.wei@example.com"
• phoneCode → "86"
• phoneNo → "13800138000"

📋 签证信息字段：
• visaNo → "(免签)"

🔧 技术字段：
• cloudflareToken → "已获取 (1234 字符)"
• tranModeId → "(自动)"

⚠️ 这些字段将直接发送到泰国移民局系统

[❌ 取消提交] [✅ 确认无误，立即提交]
```

## WebView 自动填充日志示例

当用户在WebView模式下点击自动填充时：

### 控制台输出示例

```
🔍 ===== TDAC WebView 自动填充详细日志 =====
⏰ 填充时间: 2024-12-19 14:35:10
🌐 填充方式: WebView 自动填充
🎯 目标网站: https://tdac.immigration.go.th

📋 === 将要填充的字段信息 ===

👤 个人信息字段 (Personal Information):
  1. Family Name (姓)
     值: "ZHANG"
     搜索词: [familyName, lastName, surname, Family Name, family_name, last_name]
     目标字段ID: lastName

  2. First Name (名)
     值: "WEI"
     搜索词: [firstName, givenName, First Name, first_name, given_name]
     目标字段ID: firstName

  3. Passport Number (护照号)
     值: "E12345678"
     搜索词: [passportNo, passportNumber, Passport No, passport, passport_number]
     目标字段ID: passportNo

  4. Nationality (国籍)
     值: "China"
     搜索词: [nationalityDesc, nationality, Nationality, country, citizenship]
     目标字段ID: nationality

  5. Birth Year (出生年份)
     值: "1990"
     搜索词: [bdDateYear, birthYear, year]
     目标字段ID: bdDateYear

  6. Birth Month (出生月份)
     值: "01"
     搜索词: [bdDateMonth, birthMonth, month]
     目标字段ID: bdDateMonth

  7. Birth Day (出生日)
     值: "01"
     搜索词: [bdDateDay, birthDay, day]
     目标字段ID: bdDateDay

  8. Gender (性别)
     值: "MALE"
     搜索词: [gender, Gender, sex]
     目标字段ID: gender

  9. Occupation (职业)
     值: "Engineer"
     搜索词: [occupation, Occupation, job, profession]
     目标字段ID: occupation

✈️ 旅行信息字段 (Trip Information):
  10. Flight Number (航班号)
      值: "CA123"
      搜索词: [flightNo, flightNumber, Flight No, Vehicle No, flight]
      目标字段ID: flightNumber

  11. Arrival Date (到达日期)
      值: "2024-12-25"
      搜索词: [arrDate, arrivalDate, Date of Arrival, arrival_date, arrival]
      目标字段ID: arrivalDate

  12. Purpose of Visit (旅行目的)
      值: "Tourism"
      搜索词: [traPurposeId, purpose, Purpose of Travel, purposeOfVisit, travel_purpose]
      目标字段ID: purpose

  13. Country where you Boarded (出发国家)
      值: "China"
      搜索词: [countryBoardDesc, boardedCountry, Country where you Boarded, departure_country]
      目标字段ID: boardedCountry

🏨 住宿信息字段 (Accommodation Information):
  14. Type of Accommodation (住宿类型)
      值: "Hotel"
      搜索词: [accTypeId, accType, Type of Accommodation, accommodation_type]
      目标字段ID: accType

  15. Province (省份)
      值: "Bangkok"
      搜索词: [accProvinceDesc, province, Province]
      目标字段ID: province

  16. Phone Code (区号)
      值: "86"
      搜索词: [phoneCode, code, areaCode, countryCode]
      目标字段ID: phoneCode

  17. Phone Number (电话号码)
      值: "13800138000"
      搜索词: [phoneNo, phone, Phone No, telephone, phoneNumber]
      目标字段ID: phoneNo

  18. Address (详细地址)
      值: "123 Sukhumvit Road"
      搜索词: [accAddress, address, Address]
      目标字段ID: address

🔧 === 技术实现详情 ===
🎯 字段查找策略:
  1. Angular表单属性 (formcontrolname)
  2. ng-reflect-name 属性
  3. name 和 id 属性
  4. placeholder 文本匹配
  5. label 文本匹配
  6. 单选按钮组 (mat-radio-group)

📊 === 填充统计 ===
📝 总字段数: 18
👤 个人信息: 9 个字段
✈️ 旅行信息: 4 个字段
🏨 住宿信息: 5 个字段

⚠️ === 重要提醒 ===
🚨 这些信息将自动填入TDAC网站表单
🚨 填充后请仔细检查每个字段的准确性
🚨 确认无误后再点击提交按钮
🚨 多次提交可能导致账户被暂时封禁

🔍 ===== WebView填充日志记录完成 =====
✅ WebView填充日志已保存到本地存储
```

### WebView 手动确认对话框示例

```
🛑 确认自动填充

🔍 即将自动填充的信息：

👤 个人信息 (9个字段):
• 姓: ZHANG
• 名: WEI
• 护照号: E12345678
• 国籍: China
• 出生年份: 1990
• 出生月份: 01
• 出生日: 01
• 性别: MALE
• 职业: Engineer

✈️ 旅行信息 (4个字段):
• 航班号: CA123
• 到达日期: 2024-12-25
• 旅行目的: Tourism
• 出发国家: China

🏨 住宿信息 (5个字段):
• 住宿类型: Hotel
• 省份: Bangkok
• 区号: 86
• 电话号码: 13800138000
• 详细地址: 123 Sukhumvit Road

⚠️ 重要提醒：
• 信息将自动填入TDAC网站
• 填充后请仔细检查准确性
• 确认无误后再提交
• 避免多次提交被封禁

[❌ 取消] [📋 查看字段详情] [✅ 开始填充]
```

## 本地存储数据示例

### Hybrid 提交日志
```json
{
  "timestamp": "2024-12-19T14:30:25.000Z",
  "submissionMethod": "hybrid",
  "travelerData": {
    "familyName": "ZHANG",
    "firstName": "WEI",
    "passportNo": "E12345678",
    "nationality": "China",
    "arrivalDate": "2024-12-25",
    "flightNo": "CA123",
    "email": "zhang.wei@example.com",
    "phoneCode": "86",
    "phoneNo": "13800138000"
  },
  "additionalInfo": {
    "cloudflareToken": "cf_clearance_12345abcdef...",
    "tokenLength": 1234
  },
  "warnings": [
    "此信息将直接提交给泰国移民局 (TDAC)",
    "提交后无法修改，请仔细核对",
    "多次提交可能导致账户被暂时封禁",
    "请确保所有信息与护照完全一致"
  ]
}
```

### WebView 填充日志
```json
{
  "timestamp": "2024-12-19T14:35:10.000Z",
  "fillMethod": "webview_autofill",
  "targetUrl": "https://tdac.immigration.go.th",
  "fields": [
    {
      "label": "Family Name",
      "labelCn": "姓",
      "value": "ZHANG",
      "searchTerms": ["familyName", "lastName", "surname"],
      "fieldId": "lastName",
      "section": "personal"
    }
  ],
  "statistics": {
    "totalFields": 18,
    "personalFields": 9,
    "tripFields": 4,
    "accommodationFields": 5
  },
  "warnings": [
    "这些信息将自动填入TDAC网站表单",
    "填充后请仔细检查每个字段的准确性",
    "确认无误后再点击提交按钮",
    "多次提交可能导致账户被暂时封禁"
  ]
}
```