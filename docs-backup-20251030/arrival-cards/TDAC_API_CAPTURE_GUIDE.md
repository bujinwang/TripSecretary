# TDAC API 抓包完整指南

## 🎯 目标
抓取TDAC提交表单时的真实API请求，包括：
- API URL
- 请求方法（POST）
- Headers（包括认证信息）
- Request Body（表单数据格式）
- Response（包含QR码）

---

## 方法1: Chrome DevTools（最简单）

### 步骤1: 打开开发者工具

```bash
1. 打开 Chrome 浏览器
2. 访问 https://tdac.immigration.go.th/arrival-card/#/home
3. 按 F12 或 Cmd+Option+I (Mac) 打开 DevTools
4. 切换到 "Network" 标签
5. ✅ 勾选 "Preserve log" (保留日志)
6. ✅ 勾选 "Disable cache" (禁用缓存)
```

### 步骤2: 过滤关键请求

```bash
在 Filter 输入框中输入:
- method:POST
- XHR
- Fetch/XHR
```

### 步骤3: 操作网站

```bash
1. 完成 Cloudflare 验证
2. 填写所有表单字段:
   - 护照信息
   - 旅行信息
   - 住宿信息
   - 健康声明
3. 点击 "提交" 或 "Submit"
```

### 步骤4: 找到提交请求

在Network列表中查找：
```bash
关键词:
✅ submit
✅ arrival-card
✅ api/v1/
✅ POST 方法
✅ 状态码 200 或 201
```

### 步骤5: 查看请求详情

点击找到的请求，查看：

#### Headers 标签
```
General:
  Request URL: https://tdac.immigration.go.th/api/xxx
  Request Method: POST
  Status Code: 200

Request Headers:
  Content-Type: application/json
  Accept: application/json
  Authorization: Bearer xxx... (如果有)
  X-CSRF-Token: xxx... (如果有)
  Cookie: cf_clearance=xxx...
  Origin: https://tdac.immigration.go.th
  Referer: https://tdac.immigration.go.th/arrival-card/
  User-Agent: Mozilla/5.0...
```

#### Payload 标签
```json
{
  "familyName": "WANG",
  "firstName": "BUJIN",
  "passportNo": "G12345678",
  "nationalityDesc": "China",
  "bdDateYear": "1980",
  "bdDateMonth": "01",
  "bdDateDay": "01",
  "gender": "MALE",
  ...
}
```

#### Response 标签
```json
{
  "success": true,
  "data": {
    "confirmationNumber": "TH2024010112345",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expiryDate": "2024-01-15",
    "arrivalCardId": "12345"
  }
}
```

### 步骤6: 导出数据

```bash
1. 右键点击请求
2. 选择 "Copy" > "Copy as cURL"
3. 或选择 "Copy" > "Copy as fetch"
4. 粘贴到文本编辑器保存
```

---

## 方法2: 使用我们的拦截器App

### 步骤1: 在App中添加拦截器

```javascript
// 在 AppNavigator.js 中添加
import TDACAPIInterceptScreen from '../screens/TDACAPIInterceptScreen';

// 添加路由
<Stack.Screen 
  name="TDACAPIIntercept" 
  component={TDACAPIInterceptScreen}
  options={{ title: 'TDAC API分析器' }}
/>
```

### 步骤2: 导航到拦截器

```javascript
// 在 SelectDestinationScreen.js 中添加临时按钮
<TouchableOpacity 
  onPress={() => navigation.navigate('TDACAPIIntercept')}
  style={{ padding: 10, backgroundColor: '#FF0000' }}
>
  <Text style={{ color: '#fff' }}>🔍 抓取API</Text>
</TouchableOpacity>
```

### 步骤3: 使用拦截器

```bash
1. 打开 BorderBuddy App
2. 点击 "🔍 抓取API" 按钮
3. 在 WebView 中完成 Cloudflare 验证
4. 手动填写表单并提交
5. 查看底部 API 列表
6. 点击 "导出" 复制所有数据
7. 发送给开发者分析
```

---

## 方法3: Charles Proxy（专业工具）

### 安装 Charles

```bash
# Mac
brew install --cask charles

# 或下载
https://www.charlesproxy.com/download/
```

### 配置 Charles

```bash
1. 启动 Charles
2. Proxy > macOS Proxy (启用)
3. Proxy > SSL Proxying Settings
4. 添加 Location:
   Host: tdac.immigration.go.th
   Port: 443
5. 安装 SSL 证书:
   Help > SSL Proxying > Install Charles Root Certificate
```

### 抓包流程

```bash
1. 确保 Charles 正在运行
2. 在浏览器访问 TDAC 网站
3. 完成验证和提交
4. 在 Charles 中找到请求:
   Structure > tdac.immigration.go.th > 找到 POST 请求
5. 右键 > Export Session (导出所有数据)
```

---

## 预期的API格式（推测）

### 提交API（推测）

```bash
POST https://tdac.immigration.go.th/api/v1/arrival-card/submit
或
POST https://tdac.immigration.go.th/api/arrival-card
或
POST https://tdac.immigration.go.th/submit
```

### Headers（推测）

```http
POST /api/v1/arrival-card/submit HTTP/1.1
Host: tdac.immigration.go.th
Content-Type: application/json
Accept: application/json
Accept-Language: en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7
Origin: https://tdac.immigration.go.th
Referer: https://tdac.immigration.go.th/arrival-card/
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
Cookie: cf_clearance=xxx...; session_id=xxx...
X-Requested-With: XMLHttpRequest
X-CSRF-Token: xxx... (可能需要)
Authorization: Bearer xxx... (可能需要)
```

### Request Body（推测）

```json
{
  "passport": {
    "familyName": "WANG",
    "firstName": "BUJIN",
    "passportNo": "G12345678",
    "nationality": "CHN",
    "nationalityDesc": "China"
  },
  "personal": {
    "gender": "M",
    "birthDate": {
      "year": "1980",
      "month": "01",
      "day": "01"
    },
    "occupation": "Engineer"
  },
  "travel": {
    "flightNo": "CA123",
    "arrivalDate": "2024-01-15",
    "purpose": "Tourism",
    "purposeId": 1,
    "boardedCountry": "China",
    "boardedCountryCode": "CHN"
  },
  "accommodation": {
    "type": "Hotel",
    "typeId": 1,
    "province": "Bangkok",
    "address": "123 Sukhumvit Road",
    "phone": {
      "countryCode": "86",
      "number": "13800138000"
    }
  },
  "health": {
    "hasSymptoms": false,
    "hasContact": false,
    "visitedCountries": ["CHN"]
  }
}
```

### Response（预期）

```json
{
  "status": "success",
  "code": 200,
  "data": {
    "arrivalCardId": "AC2024010112345",
    "confirmationNumber": "TH-2024-01-01-12345",
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "qrCodeUrl": "https://tdac.immigration.go.th/qr/AC2024010112345.png",
    "expiryDate": "2024-01-15T23:59:59Z",
    "createdAt": "2024-01-12T10:30:00Z",
    "traveler": {
      "name": "BUJIN WANG",
      "passportNo": "G12345678",
      "nationality": "China"
    },
    "downloadUrl": "https://tdac.immigration.go.th/download/AC2024010112345.pdf"
  },
  "message": "Arrival card submitted successfully"
}
```

---

## 📝 数据收集清单

抓包时请记录以下信息：

### ✅ 基本信息
- [ ] API完整URL
- [ ] HTTP方法 (POST/PUT)
- [ ] Content-Type
- [ ] 状态码

### ✅ 认证信息
- [ ] Cookie (特别是 cf_clearance)
- [ ] Authorization Header
- [ ] CSRF Token
- [ ] Session ID

### ✅ 请求数据
- [ ] 完整的Request Body (JSON格式)
- [ ] 字段名称（精确拼写，区分大小写）
- [ ] 字段类型（string, number, boolean）
- [ ] 必填字段 vs 可选字段

### ✅ 响应数据
- [ ] 完整的Response Body
- [ ] QR码格式（Base64, URL, 还是什么？）
- [ ] 确认号格式
- [ ] 错误响应格式

### ✅ 其他
- [ ] Rate Limiting (频率限制)
- [ ] 请求顺序（是否需要先调用其他API？）
- [ ] Cloudflare如何传递token

---

## 🚀 抓包后的下一步

### 1. 分析数据

```bash
# 整理成文档
API_URL=xxx
HEADERS=xxx
BODY_FORMAT=xxx
RESPONSE_FORMAT=xxx
```

### 2. 测试API

```bash
# 使用 curl 测试
curl -X POST \
  'https://tdac.immigration.go.th/api/xxx' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: cf_clearance=xxx' \
  -d '{"familyName":"WANG",...}'
```

### 3. 实现代码

```javascript
// services/tdacAPI.js
const response = await fetch(API_URL, {
  method: 'POST',
  headers: {...},
  body: JSON.stringify({...})
});
```

### 4. 集成到App

```javascript
// 替换WebView自动化
const qrCode = await tdacService.submitDirect(passport, travelInfo);
```

---

## ⚠️ 常见问题

### Q: 找不到POST请求？
A: 可能是：
- 请求被过滤了，取消所有过滤器
- 使用了WebSocket，查看WS标签
- 请求在iframe中，切换到iframe的context

### Q: 请求返回401/403？
A: 缺少认证信息：
- 检查Cookie（特别是cf_clearance）
- 检查CSRF Token
- 检查Authorization Header

### Q: QR码在哪里？
A: 可能在：
- Response Body的qrCode字段（Base64）
- Response Header的Location（重定向到QR码图片）
- 需要额外的API调用获取

### Q: 如何获取Cloudflare token？
A: 在验证成功后：
```javascript
// 从Cookie
document.cookie.match(/cf_clearance=([^;]+)/)[1]

// 从localStorage
localStorage.getItem('cf_token')

// 从页面元素
document.querySelector('[name="cf-turnstile-response"]').value
```

---

## 📞 需要帮助？

如果抓包遇到问题，请提供：
1. 截图（Network面板）
2. 导出的cURL命令
3. 错误信息
4. 浏览器Console的日志

我会帮你分析并实现API调用！🚀
