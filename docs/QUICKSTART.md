# 🚀 快速启动指南

## 第一次运行? 跟着这 3 步走!

### Step 1: 安装依赖 📦

```bash
npm install
```

**耐心等待 2-3 分钟...**

### Step 2: 启动应用 🎬

```bash
npx expo start
```

**看到这个界面说明成功了:**
```
› Metro waiting on exp://192.168.x.x:19000
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

### Step 3: 选择运行方式 📱

#### 方式 A: 使用模拟器 (推荐开发)

**iOS (仅 Mac):**
```bash
按 i 键
# 自动打开 iPhone 模拟器
```

**Android:**
```bash
按 a 键  
# 自动打开 Android 模拟器
# 需要先安装 Android Studio
```

#### 方式 B: 使用真机 (推荐测试)

1. **下载 Expo Go App**
   - iOS: App Store 搜索 "Expo Go"
   - Android: Google Play 搜索 "Expo Go"

2. **扫描二维码**
   - iOS: 打开相机 App 扫描
   - Android: 打开 Expo Go App 扫描

3. **等待加载** (首次需要 1-2 分钟)

---

## 🎉 成功! 你应该看到:

1. **登录页** - 白底，绿色大按钮
2. **点击登录** → 进入首页
3. **首页显示**:
   - 大扫描按钮 (中间)
   - 5 个国家卡片
   - 证件区域

---

## 🔥 常用命令

```bash
# 启动 (清除缓存)
npx expo start -c

# 仅 iOS
npx expo start --ios

# 仅 Android  
npx expo start --android

# Web 预览
npx expo start --web
```

---

## 😱 遇到问题?

### 问题 1: "Cannot find module"

```bash
# 解决方案: 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题 2: "Metro bundler error"

```bash
# 解决方案: 清除缓存重启
npx expo start -c
```

### 问题 3: "Port already in use"

```bash
# 解决方案: 杀掉占用进程
lsof -ti:19000 | xargs kill -9
npx expo start
```

### 问题 4: iOS 模拟器打不开

```bash
# 解决方案: 打开 Xcode 一次
open -a Xcode
# 然后关闭，再试
npx expo start --ios
```

### 问题 5: Android 找不到设备

```bash
# 解决方案: 检查模拟器
# 1. 打开 Android Studio
# 2. Tools > AVD Manager
# 3. 启动一个虚拟设备
# 4. 再运行 npx expo start -a
```

---

## 📂 主要文件说明

```
TripSecretary/
├── App.js                    ← 应用入口 (从这里开始)
├── app/
│   ├── navigation/
│   │   └── AppNavigator.js   ← 路由配置 (修改导航看这里)
│   ├── screens/              ← 所有页面 (8 个)
│   ├── components/           ← 可复用组件 (按钮、卡片等)
│   └── theme/                ← 颜色、字体、间距
├── package.json              ← 依赖列表
└── app.json                  ← Expo 配置
```

---

## 🎨 修改 UI 试试?

### 修改主题色 (从绿色改成蓝色)

```javascript
// 打开: app/theme/colors.js
export const colors = {
  primary: '#10AEFF', // 改成蓝色 (原来是 #07C160)
  // ... 其他不变
};
```

保存后自动刷新! 🎉

### 修改首页标题

```javascript
// 打开: app/screens/HomeScreen.js
// 找到第 30 行左右
<Text style={styles.greeting}>你好，张伟 👋</Text>

// 改成你的名字
<Text style={styles.greeting}>你好，小明 👋</Text>
```

---

## 📱 测试完整流程

1. **登录页** → 点击 "微信登录"
2. **首页** → 点击中间大按钮 "扫描证件"
3. **扫描页** → 点击底部 "拍照" (模拟拍照)
4. **选择目的地** → 点击 "香港"
5. **生成中** → 看进度条动画 (自动跳转)
6. **结果页** → 看成功页面 ✅

---

## 🎯 下一步?

### 如果你要开发:

1. ✅ 熟悉现有 UI 和导航
2. 📝 看 `README_APP.md` 了解架构
3. 🔌 开始集成 Cloudflare Workers API
4. 📸 接入真实相机 OCR
5. 🤖 连接阿里通义千问 AI

### 如果你要测试:

1. ✅ 走一遍完整流程
2. 📱 测试每个页面的按钮
3. 🐛 发现 Bug 记录下来
4. 💬 提出 UI/UX 改进建议

---

## 📞 需要帮助?

- **文档**: 查看 `README_APP.md`
- **代码**: 每个文件都有注释
- **问题**: 在终端查看错误信息

---

**出境通** - 5 分钟跑起来! ⚡️

开始开发: `npx expo start` 🚀
