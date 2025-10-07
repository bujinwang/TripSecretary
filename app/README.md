# 出国啰 - React Native UI Prototypes

这是 **出国啰** APP 的 React Native UI 原型代码，基于 `UI设计规范.md` 实现。

## 📁 项目结构

```
app/
├── theme/              # 设计系统
│   ├── colors.js       # 颜色规范
│   ├── typography.js   # 字体规范
│   ├── spacing.js      # 间距规范
│   ├── shadows.js      # 阴影规范
│   └── index.js        # 统一导出
│
├── components/         # 可复用组件
│   ├── Button.js       # 按钮组件
│   ├── Card.js         # 卡片组件
│   ├── Input.js        # 输入框组件
│   ├── CountryCard.js  # 国家选择卡片
│   └── index.js        # 统一导出
│
├── screens/            # 页面
│   ├── LoginScreen.js              # 登录页
│   ├── HomeScreen.js               # 首页
│   ├── ScanPassportScreen.js       # 扫描护照页
│   ├── SelectDestinationScreen.js  # 选择目的地页
│   └── index.js                    # 统一导出
│
└── README.md          # 本文件
```

## 🎨 设计系统

### 颜色 (colors.js)
- **主色**: `#07C160` (微信绿)
- **辅助色**: `#576B95` (微信蓝)
- **成功**: `#07C160`
- **警告**: `#FA9D3B`
- **错误**: `#F56C6C`

### 字体 (typography.js)
- **H1**: 28px Bold (页面标题)
- **H2**: 24px Bold (模块标题)
- **H3**: 20px SemiBold (小标题)
- **Body1**: 16px Regular (正文，最小)
- **Body2**: 18px Regular (强调正文)
- **Caption**: 14px Regular (辅助说明)
- **Button**: 18px SemiBold (按钮文字)

### 间距 (spacing.js)
使用 8px 网格系统:
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

## 📱 已实现的页面

### 1. LoginScreen (登录页)
- ✅ APP Logo 和标题
- ✅ 微信登录按钮（主按钮）
- ✅ 手机号登录按钮（次要按钮）
- ✅ 用户协议和隐私政策

### 2. HomeScreen (首页)
- ✅ 顶部导航栏（头像、标题、设置）
- ✅ 欢迎语
- ✅ 主要行动卡片（准备好护照）
- ✅ 扫描按钮（绿色大按钮）
- ✅ 快速选择目的地（5个国家卡片）
- ✅ 我的证件卡片

### 3. ScanPassportScreen (扫描护照页)
- ✅ 返回导航
- ✅ 相机预览区域
- ✅ 扫描框（带四个角标）
- ✅ 操作说明
- ✅ 拍照按钮
- ✅ 从相册选择链接
- ✅ 提示信息

### 4. SelectDestinationScreen (选择目的地页)
- ✅ 返回导航
- ✅ 已识别证件卡片
- ✅ 目的地选择（5个国家卡片）
- ✅ 选中状态显示

## 🧩 可复用组件

### Button
主按钮、次要按钮、文字按钮三种样式，支持加载状态和图标。

```javascript
import { Button } from './components';

<Button
  title="微信登录"
  onPress={handleLogin}
  variant="primary"  // primary, secondary, text
  size="large"       // large, medium, small
  loading={false}
  icon={<Icon />}
/>
```

### Card
标准卡片组件，支持点击交互。

```javascript
import { Card } from './components';

<Card onPress={handlePress} pressable>
  <Text>Card Content</Text>
</Card>
```

### Input
输入框组件，支持标签、错误提示、多行输入。

```javascript
import { Input } from './components';

<Input
  label="手机号"
  value={phone}
  onChangeText={setPhone}
  placeholder="请输入手机号"
  error={hasError}
  errorMessage="手机号格式不正确"
  keyboardType="phone-pad"
/>
```

### CountryCard
国家选择卡片，显示国旗、国家名和飞行时间。

```javascript
import { CountryCard } from './components';

<CountryCard
  flag="🇭🇰"
  name="香港"
  flightTime="1小时飞行"
  selected={false}
  onPress={handleSelect}
/>
```

## 🚀 如何使用

### 1. 在现有 React Native 项目中使用

```bash
# 将 app 文件夹复制到你的项目中
cp -r app /path/to/your/react-native-project/src/

# 在你的 App.js 中导入
import { LoginScreen, HomeScreen } from './src/app/screens';
import { theme } from './src/app/theme';
```

### 2. 创建新的 Expo 项目

```bash
# 创建新项目
npx create-expo-app ChuGuoLuo

# 将 app 文件夹复制进去
cp -r app ChuGuoLuo/

# 安装依赖
cd ChuGuoLuo
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# 运行
npx expo start
```

### 3. 示例 App.js

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LoginScreen,
  HomeScreen,
  ScanPassportScreen,
  SelectDestinationScreen,
} from './app/screens';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ScanPassport" component={ScanPassportScreen} />
        <Stack.Screen name="SelectDestination" component={SelectDestinationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 📝 待实现的页面

以下页面在 UI 设计规范中定义，但尚未实现代码：

- [ ] GeneratingScreen (生成中页面)
- [ ] ResultScreen (完成页)
- [ ] DocumentsScreen (证件列表)
- [ ] HistoryScreen (历史记录)
- [ ] ProfileScreen (个人中心)
- [ ] VIPUpgradeScreen (升级会员)
- [ ] SettingsScreen (设置)

## 🎯 下一步

1. **集成导航**: 使用 React Navigation 连接所有页面
2. **添加动画**: 使用 React Native Reanimated 添加过渡动画
3. **实现剩余页面**: 按照 UI 设计规范实现其他页面
4. **连接后端**: 集成 Cloudflare Workers API
5. **添加真实功能**: OCR、AI 生成、微信登录等

## 📚 参考文档

- `UI设计规范.md` - 完整的 UI/UX 设计规范
- `最终技术栈确认.md` - 技术栈决策
- `MVP技术栈最终确认.md` - MVP 开发计划

## ✨ 特色

- ✅ 完全基于官方设计规范
- ✅ 使用设计系统（颜色、字体、间距统一）
- ✅ 组件化开发（可复用）
- ✅ 响应式布局
- ✅ 支持 iOS 和 Android
- ✅ 代码注释清晰
- ✅ 易于维护和扩展

---

**版本**: v1.0  
**创建日期**: 2025-01-XX  
**状态**: ✅ 核心页面原型完成

---

## 需要帮助？

这些是可工作的 React Native 组件，你可以：
1. 直接在项目中使用
2. 根据需要修改样式
3. 添加更多功能
4. 扩展新的组件和页面

祝开发顺利！🚀
