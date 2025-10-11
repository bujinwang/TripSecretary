# 出境通 - 智能出入境助手 📱

一款专为 50-70 岁中老年用户设计的出国通关助手 APP，使用 AI 自动生成入境表格和海关问答卡。

## ✨ 功能特点

- 📸 **智能扫描**: 自动识别护照信息
- 🌍 **热门目的地**: 支持香港、台湾、泰国、美国、加拿大等
- 🤖 **AI 生成**: 自动填写入境表格和海关问答
- 💾 **历史记录**: 保存所有生成记录，随时查看
- 👨‍👩‍👧 **家庭协助**: 子女可远程帮父母准备材料 (V1.1)

## 🚀 快速开始

### 环境要求

- Node.js 16+ 
- npm 或 yarn
- Expo CLI
- iOS Simulator (Mac) 或 Android Emulator

### 安装步骤

```bash
# 1. 安装依赖
npm install

# 或使用 yarn
yarn install

# 2. 启动开发服务器
npm start

# 或
npx expo start
```

### 运行应用

启动后会打开 Expo Dev Tools，选择运行平台：

- **iOS**: 按 `i` (需要 Mac + Xcode)
- **Android**: 按 `a` (需要 Android Studio)
- **Web**: 按 `w` (浏览器预览)
- **物理设备**: 扫描二维码 (需安装 Expo Go App)

## 📁 项目结构

```
TripSecretary/
├── app/
│   ├── components/        # 可复用组件
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Input.js
│   │   └── CountryCard.js
│   ├── screens/           # 页面
│   │   ├── LoginScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ScanPassportScreen.js
│   │   ├── SelectDestinationScreen.js
│   │   ├── GeneratingScreen.js
│   │   ├── ResultScreen.js
│   │   ├── HistoryScreen.js
│   │   └── ProfileScreen.js
│   ├── navigation/        # 导航配置
│   │   └── AppNavigator.js
│   └── theme/            # 设计系统
│       ├── colors.js
│       ├── typography.js
│       ├── spacing.js
│       └── shadows.js
├── App.js                # 应用入口
├── app.json             # Expo 配置
├── package.json         # 依赖管理
└── babel.config.js      # Babel 配置
```

## 🎨 设计系统

### 主题色

- **主色**: `#07C160` (微信绿)
- **次色**: `#10AEFF` (蓝色)
- **错误**: `#FA5151` (红色)

### 字体大小

- **H1**: 32px - 主标题
- **H2**: 24px - 副标题
- **Body1**: 16px - 正文
- **Caption**: 12px - 辅助文字

### 间距

采用 8px 网格系统:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

## 🧭 导航结构

```
Login Screen (登录)
    ↓
Main Tabs (底部导航)
├── Home (首页)
│   ├── Scan Passport (扫描护照)
│   ├── Select Destination (选择目的地)
│   ├── Generating (生成中)
│   └── Result (结果)
├── History (历史记录)
└── Profile (个人中心)
```

## 📱 主要页面

### 1. 登录页 (LoginScreen)
- 微信一键登录
- 手机号登录
- 大按钮设计，适合老年人

### 2. 首页 (HomeScreen)
- 大扫描按钮
- 热门目的地快捷入口
- 已保存的证件
- 最近生成记录

### 3. 扫描证件 (ScanPassportScreen)
- 相机预览
- 扫描框引导
- 拍照提示

### 4. 选择目的地 (SelectDestinationScreen)
- 国家/地区网格
- 显示护照信息
- 入境要求提示

### 5. 生成中 (GeneratingScreen)
- 进度条动画
- 步骤显示:
  - ✅ 识别证件信息
  - ✅ 验证有效期
  - 🔄 生成入境表格
  - ⏳ 生成海关问答卡
  - ⏳ 翻译为当地语言
- 预计时间

### 6. 结果页 (ResultScreen)
- 成功图标 ✅
- 入境表格预览
- 海关问答卡
- 下载 PDF
- 分享功能

### 7. 历史记录 (HistoryScreen)
- 按时间分组 (今天/昨天/本周)
- 快速查看
- 重新下载

### 8. 个人中心 (ProfileScreen)
- 用户信息
- 我的证件
- 云端备份
- 设置
- 帮助中心

## 🔌 API 集成 (待实现)

```javascript
// Cloudflare Workers API 端点

// 1. OCR 识别护照
POST /api/ocr/passport
Body: { image: "base64..." }

// 2. 生成通关包
POST /api/generate
Body: {
  passportId: 123,
  destination: "HK"
}

// 3. 获取历史记录
GET /api/history?userId=123

// 4. 下载 PDF
GET /api/download/:generationId
```

## 🧪 开发调试

### 模拟数据

当前使用模拟数据进行开发，实际 API 集成在 MVP 阶段完成。

### 修改代码

1. 编辑任何 `.js` 文件
2. 保存后自动热重载
3. 在设备/模拟器上查看变化

### 调试技巧

```javascript
// 使用 console.log
console.log('Debug info:', data);

// 使用 React Native Debugger
// 在应用中按 Cmd+D (iOS) 或 Cmd+M (Android)
// 选择 "Debug"
```

## 📦 打包发布

### iOS

```bash
# 1. 构建 iOS 版本
expo build:ios

# 2. 上传到 App Store
# 使用 Xcode 或 Application Loader
```

### Android

```bash
# 1. 构建 Android 版本
expo build:android

# 2. 上传到 Google Play
# 使用 Google Play Console
```

## 🔧 常见问题

### Q1: npm install 失败

```bash
# 清除缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q2: Metro bundler 错误

```bash
# 重启 Metro
npx expo start -c
```

### Q3: iOS 模拟器无法打开

```bash
# 重置模拟器
xcrun simctl erase all
```

### Q4: Android 构建失败

```bash
# 清理 Gradle
cd android && ./gradlew clean
cd .. && npx expo start -c
```

## 🛣️ Roadmap

### ✅ V1.0 (当前 - MVP)
- [x] 基础 UI 框架
- [x] 页面导航
- [x] 扫描护照界面
- [x] 生成流程
- [ ] API 集成
- [ ] 微信登录
- [ ] PDF 生成

### 🔄 V1.1 (计划中)
- [ ] 家庭账号功能
- [ ] 远程协助 (双向发起)
- [ ] 证件管理
- [ ] 云端备份
- [ ] 本地 AI 模型 (可选)

### 🚀 V2.0 (未来)
- [ ] 语音指导
- [ ] 视频协助
- [ ] 多语言支持
- [ ] 离线模式增强
- [ ] Apple Watch 版本

## 👥 团队

- **产品设计**: TripSecretary Team
- **技术架构**: Cloudflare Workers + D1 + R2
- **AI 模型**: 阿里通义千问 Qwen-Max
- **UI 框架**: React Native + Expo

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🙏 致谢

- Expo 团队
- React Navigation 团队
- 所有开源贡献者

---

**出境通** - 让出国更简单 🌏✈️

如有问题，请联系: support@tripsecretary.com
