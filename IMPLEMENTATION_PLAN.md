# 出境通 - 完整实现计划

## 📋 总览

**目标**: 将 MVP UI 原型转换为完整可用的应用
**时间**: 4-6 周
**状态**: 准备开始

---

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    用户设备                          │
│  ┌──────────────────────────────────────────────┐  │
│  │   React Native App (Expo)                    │  │
│  │   - UI/UX (已完成 ✅)                        │  │
│  │   - 导航 (已完成 ✅)                         │  │
│  │   - 状态管理 (待实现)                       │  │
│  │   - API 客户端 (待实现)                     │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↕ HTTPS
┌─────────────────────────────────────────────────────┐
│              Cloudflare Workers                      │
│  ┌──────────────────────────────────────────────┐  │
│  │   API 路由                                   │  │
│  │   - /api/auth/*        (登录/注册)          │  │
│  │   - /api/ocr/*         (OCR 识别)           │  │
│  │   - /api/generate/*    (AI 生成)            │  │
│  │   - /api/history/*     (历史记录)           │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           ↕              ↕              ↕
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ D1 数据库 │   │ R2 存储  │   │ 外部 API │
    │          │   │          │   │          │
    │ - users  │   │ - PDFs   │   │ - 阿里OCR│
    │ - docs   │   │ - images │   │ - 通义千问│
    │ - history│   │ - backups│   │ - 微信SDK│
    └──────────┘   └──────────┘   └──────────┘
```

---

## 🚀 Phase 1: 后端基础设施 (Week 1-2)

### Week 1: Cloudflare Workers 设置

#### 1.1 项目初始化
```bash
# 创建 Workers 项目
mkdir cloudflare-backend
cd cloudflare-backend
npm create cloudflare@latest

# 选择:
# - Template: "Hello World" worker
# - TypeScript: Yes
# - Git: Yes
```

#### 1.2 项目结构
```
cloudflare-backend/
├── src/
│   ├── index.ts              # 主入口
│   ├── routes/
│   │   ├── auth.ts           # 认证路由
│   │   ├── ocr.ts            # OCR 路由
│   │   ├── generate.ts       # AI 生成路由
│   │   └── history.ts        # 历史记录路由
│   ├── services/
│   │   ├── alibaba-ocr.ts    # 阿里云 OCR
│   │   ├── qwen-ai.ts        # 通义千问 AI
│   │   ├── wechat.ts         # 微信 SDK
│   │   └── pdf.ts            # PDF 生成
│   ├── db/
│   │   ├── schema.sql        # D1 数据库架构
│   │   └── queries.ts        # 数据库查询
│   └── utils/
│       ├── auth.ts           # JWT 认证
│       └── validation.ts     # 数据验证
├── wrangler.toml             # Cloudflare 配置
└── package.json
```

#### 1.3 D1 数据库架构

**文件**: `src/db/schema.sql`

```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wechat_openid TEXT UNIQUE,
  phone TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 护照表
CREATE TABLE passports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'china_passport', 'hk_passport', 'hk_permit', 'tw_permit'
  passport_no TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  gender TEXT,
  birth_date TEXT,
  nationality TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  issue_place TEXT,
  ocr_data TEXT, -- JSON 存储完整 OCR 结果
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 生成记录表
CREATE TABLE generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  passport_id INTEGER NOT NULL,
  destination_id TEXT NOT NULL, -- 'hk', 'tw', 'th', 'us', etc.
  destination_name TEXT NOT NULL,
  flight_number TEXT,
  arrival_date TEXT,
  hotel_name TEXT,
  hotel_address TEXT,
  contact_phone TEXT,
  stay_duration TEXT,
  travel_purpose TEXT,
  additional_data TEXT, -- JSON 存储额外信息
  status TEXT DEFAULT 'completed', -- 'processing', 'completed', 'failed'
  result_data TEXT, -- JSON 存储生成的表格数据
  pdf_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (passport_id) REFERENCES passports(id)
);

-- 生成历史索引
CREATE INDEX idx_generations_user ON generations(user_id, created_at DESC);
CREATE INDEX idx_generations_duplicate ON generations(passport_id, destination_id, flight_number, arrival_date);

-- 家庭成员表 (V1.1)
CREATE TABLE family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL, -- 'owner', 'assistant', 'viewer'
  added_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 1.4 创建 D1 数据库

```bash
# 创建 D1 数据库
npx wrangler d1 create chujingtong-db

# 输出会给你一个 database_id，添加到 wrangler.toml

# 执行 schema
npx wrangler d1 execute chujingtong-db --file=./src/db/schema.sql
```

**wrangler.toml** 配置:

```toml
name = "chujingtong-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 数据库
[[d1_databases]]
binding = "DB"
database_name = "chujingtong-db"
database_id = "your-database-id-here"

# R2 存储
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "chujingtong-storage"

# 环境变量
[vars]
ENVIRONMENT = "production"

# 密钥 (使用 wrangler secret 设置)
# - ALIBABA_OCR_KEY
# - ALIBABA_OCR_SECRET
# - QWEN_API_KEY
# - WECHAT_APP_ID
# - WECHAT_APP_SECRET
# - JWT_SECRET
```

---

### Week 2: 核心 API 实现

#### 2.1 认证 API

**文件**: `src/routes/auth.ts`

```typescript
// POST /api/auth/wechat
// 微信登录
export async function wechatLogin(request: Request, env: Env) {
  const { code } = await request.json();
  
  // 1. 使用 code 换取 openid
  const wechatResponse = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?` +
    `appid=${env.WECHAT_APP_ID}&` +
    `secret=${env.WECHAT_APP_SECRET}&` +
    `js_code=${code}&` +
    `grant_type=authorization_code`
  );
  
  const { openid, session_key } = await wechatResponse.json();
  
  // 2. 查找或创建用户
  let user = await env.DB.prepare(
    'SELECT * FROM users WHERE wechat_openid = ?'
  ).bind(openid).first();
  
  if (!user) {
    // 创建新用户
    const result = await env.DB.prepare(
      'INSERT INTO users (wechat_openid) VALUES (?) RETURNING *'
    ).bind(openid).first();
    user = result;
  }
  
  // 3. 生成 JWT token
  const token = await generateJWT(user.id, env.JWT_SECRET);
  
  return new Response(JSON.stringify({
    token,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar_url,
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/auth/phone
// 手机号登录
export async function phoneLogin(request: Request, env: Env) {
  const { phone, code } = await request.json();
  
  // TODO: 验证短信验证码
  
  // 查找或创建用户
  let user = await env.DB.prepare(
    'SELECT * FROM users WHERE phone = ?'
  ).bind(phone).first();
  
  if (!user) {
    const result = await env.DB.prepare(
      'INSERT INTO users (phone) VALUES (?) RETURNING *'
    ).bind(phone).first();
    user = result;
  }
  
  const token = await generateJWT(user.id, env.JWT_SECRET);
  
  return new Response(JSON.stringify({ token, user }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### 2.2 OCR API

**文件**: `src/routes/ocr.ts`

```typescript
import { AlibabaOCR } from '../services/alibaba-ocr';

// POST /api/ocr/passport
// 识别护照
export async function recognizePassport(request: Request, env: Env) {
  const formData = await request.formData();
  const imageFile = formData.get('image');
  
  if (!imageFile) {
    return new Response('Missing image', { status: 400 });
  }
  
  // 1. 上传到 R2 临时存储
  const imageBuffer = await imageFile.arrayBuffer();
  const imageKey = `temp/passport-${Date.now()}.jpg`;
  await env.STORAGE.put(imageKey, imageBuffer);
  
  // 2. 调用阿里云 OCR
  const ocr = new AlibabaOCR(env.ALIBABA_OCR_KEY, env.ALIBABA_OCR_SECRET);
  const result = await ocr.recognizePassport(imageBuffer);
  
  // 3. 解析结果
  const passportData = {
    type: result.type,
    passportNo: result.passport_no,
    name: result.name,
    nameEn: result.name_en,
    gender: result.gender,
    birthDate: result.birth_date,
    nationality: result.nationality,
    issueDate: result.issue_date,
    expiryDate: result.expiry_date,
    issuePlace: result.issue_place,
    raw: result,
  };
  
  return new Response(JSON.stringify(passportData), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/ocr/ticket
// 识别机票
export async function recognizeTicket(request: Request, env: Env) {
  const formData = await request.formData();
  const imageFile = formData.get('image');
  
  const imageBuffer = await imageFile.arrayBuffer();
  const ocr = new AlibabaOCR(env.ALIBABA_OCR_KEY, env.ALIBABA_OCR_SECRET);
  const result = await ocr.recognizeTicket(imageBuffer);
  
  return new Response(JSON.stringify({
    flightNumber: result.flight_number,
    arrivalDate: result.arrival_date,
    departureCity: result.departure_city,
    arrivalCity: result.arrival_city,
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/ocr/hotel
// 识别酒店预订单
export async function recognizeHotel(request: Request, env: Env) {
  const formData = await request.formData();
  const imageFile = formData.get('image');
  
  const imageBuffer = await imageFile.arrayBuffer();
  const ocr = new AlibabaOCR(env.ALIBABA_OCR_KEY, env.ALIBABA_OCR_SECRET);
  const result = await ocr.recognizeHotel(imageBuffer);
  
  return new Response(JSON.stringify({
    hotelName: result.hotel_name,
    address: result.address,
    phone: result.phone,
    checkIn: result.check_in,
    checkOut: result.check_out,
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### 2.3 AI 生成 API

**文件**: `src/routes/generate.ts`

```typescript
import { QwenAI } from '../services/qwen-ai';
import { generatePDF } from '../services/pdf';

// POST /api/generate
// 生成入境表格
export async function generateEntryForm(request: Request, env: Env) {
  const userId = request.headers.get('X-User-ID'); // 从 JWT 提取
  const {
    passportId,
    destination,
    travelInfo,
  } = await request.json();
  
  // 1. 获取护照信息
  const passport = await env.DB.prepare(
    'SELECT * FROM passports WHERE id = ? AND user_id = ?'
  ).bind(passportId, userId).first();
  
  if (!passport) {
    return new Response('Passport not found', { status: 404 });
  }
  
  // 2. 检查重复
  const duplicate = await env.DB.prepare(
    `SELECT * FROM generations 
     WHERE passport_id = ? AND destination_id = ? 
     AND flight_number = ? AND arrival_date = ?
     LIMIT 1`
  ).bind(
    passportId,
    destination.id,
    travelInfo.flightNumber,
    travelInfo.arrivalDate
  ).first();
  
  if (duplicate) {
    return new Response(JSON.stringify({
      duplicate: true,
      existingId: duplicate.id,
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 3. 调用 AI 生成
  const ai = new QwenAI(env.QWEN_API_KEY);
  const entryForm = await ai.generateEntryForm({
    passport,
    destination,
    travelInfo,
  });
  
  // 4. 生成 PDF
  const pdfBuffer = await generatePDF(entryForm);
  const pdfKey = `pdfs/${userId}/${Date.now()}-${destination.id}.pdf`;
  await env.STORAGE.put(pdfKey, pdfBuffer);
  const pdfUrl = `https://storage.chujingtong.com/${pdfKey}`;
  
  // 5. 保存到数据库
  const generation = await env.DB.prepare(
    `INSERT INTO generations (
      user_id, passport_id, destination_id, destination_name,
      flight_number, arrival_date, hotel_name, hotel_address,
      contact_phone, stay_duration, travel_purpose,
      additional_data, status, result_data, pdf_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *`
  ).bind(
    userId,
    passportId,
    destination.id,
    destination.name,
    travelInfo.flightNumber,
    travelInfo.arrivalDate,
    travelInfo.hotelName,
    travelInfo.hotelAddress,
    travelInfo.contactPhone,
    travelInfo.stayDuration,
    travelInfo.travelPurpose,
    JSON.stringify(travelInfo),
    'completed',
    JSON.stringify(entryForm),
    pdfUrl
  ).first();
  
  return new Response(JSON.stringify({
    id: generation.id,
    entryForm,
    pdfUrl,
    createdAt: generation.created_at,
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## 📱 Phase 2: 前端集成 (Week 3-4)

### Week 3: API 客户端和状态管理

#### 3.1 创建 API 客户端

**文件**: `app/services/api.js`

```javascript
const API_BASE_URL = 'https://api.chujingtong.com';

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // 认证
  async wechatLogin(code) {
    return this.request('/api/auth/wechat', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // OCR
  async recognizePassport(imageUri) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'passport.jpg',
    });

    return this.request('/api/ocr/passport', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: formData,
    });
  }

  async recognizeTicket(imageUri) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'ticket.jpg',
    });

    return this.request('/api/ocr/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: formData,
    });
  }

  // 生成
  async generateEntryForm(data) {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 历史记录
  async getHistory() {
    return this.request('/api/history');
  }
}

export default new ApiClient();
```

#### 3.2 实现相机功能

**文件**: `app/screens/ScanPassportScreen.js` (更新)

```javascript
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const [hasPermission, setHasPermission] = useState(null);
const [scanning, setScanning] = useState(false);
const cameraRef = useRef(null);

// 请求权限
useEffect(() => {
  (async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  })();
}, []);

const handleCapture = async () => {
  if (!cameraRef.current) return;
  
  setScanning(true);
  try {
    // 拍照
    const photo = await cameraRef.current.takePictureAsync({
      quality: 1,
      base64: false,
    });
    
    // OCR 识别
    const result = await api.recognizePassport(photo.uri);
    
    // 跳转到下一步
    navigation.navigate('SelectDestination', {
      passport: result,
    });
  } catch (error) {
    Alert.alert('识别失败', error.message);
  } finally {
    setScanning(false);
  }
};

const handleGallery = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });
  
  if (!result.canceled) {
    setScanning(true);
    try {
      const ocrResult = await api.recognizePassport(result.assets[0].uri);
      navigation.navigate('SelectDestination', { passport: ocrResult });
    } catch (error) {
      Alert.alert('识别失败', error.message);
    } finally {
      setScanning(false);
    }
  }
};

return (
  <View style={styles.container}>
    <Camera
      ref={cameraRef}
      style={styles.camera}
      type={Camera.Constants.Type.back}
    >
      {/* 扫描框 */}
      <View style={styles.scanFrame} />
    </Camera>
    
    {scanning && (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#07C160" />
        <Text>识别中...</Text>
      </View>
    )}
    
    <View style={styles.controls}>
      <Button title="拍照" onPress={handleCapture} />
      <Button title="相册" onPress={handleGallery} />
    </View>
  </View>
);
```

---

## 📦 所需的依赖包

### 后端 (Cloudflare Workers)

```json
{
  "dependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "hono": "^4.0.0",
    "jose": "^5.0.0"
  }
}
```

### 前端 (React Native)

```json
{
  "dependencies": {
    "expo-camera": "~13.4.4",
    "expo-image-picker": "~14.3.2",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "expo-file-system": "~15.4.0",
    "expo-sharing": "~11.5.0"
  }
}
```

---

## 🎯 下一步行动

我现在可以开始创建:

1. **Cloudflare Workers 后端项目** - 完整的 API 实现
2. **阿里云 OCR 集成** - 护照、机票、酒店识别
3. **通义千问 AI 集成** - 表格生成
4. **前端 API 客户端** - 完整连接
5. **相机功能实现** - expo-camera 集成

你希望我从哪一部分开始？或者一次性创建所有文件？
