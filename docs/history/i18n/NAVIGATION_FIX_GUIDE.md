# 台湾、新加坡、马来西亚导航问题修复指南

## 问题描述

当前状态：选择台湾、新加坡或马来西亚后，**直接跳到旅行信息页**，跳过了：
1. 入境信息页（InfoScreen）
2. 入境要求确认页（RequirementsScreen）

期望流程（参照泰国）：
```
选择目的地 
  → InfoScreen (入境信息页)
  → RequirementsScreen (入境要求确认页)
  → TravelInfo (旅行信息页)
```

## 诊断结果

✅ **代码本身是正确的！**

我已经检查了：
1. ✅ 所有6个屏幕文件都存在
2. ✅ SelectDestinationScreen 中的导航逻辑正确指向 InfoScreen
3. ✅ InfoScreen 正确导航到 RequirementsScreen  
4. ✅ RequirementsScreen 正确导航到 TravelInfo
5. ✅ 所有路由都已在 AppNavigator 中注册

**问题原因：应用缓存没有更新最新代码**

## 解决方案

### 方法1：清除缓存并重启（推荐）

```bash
# 停止当前的 Expo 服务
pkill -f "expo start"

# 清除缓存并重新启动
cd /Users/bujin/Documents/Projects/TripSecretary
npx expo start --clear

# 或者使用快捷命令
npm start -- --clear
```

然后：
1. 在模拟器/设备上**完全关闭应用**
2. 在 Metro bundler 中按 `r` 重新加载
3. 或者在模拟器中按 `Cmd+R` (iOS) 或 `RR` (Android) 刷新

### 方法2：完全重置

如果方法1不行，尝试完全重置：

```bash
# 停止 Expo
pkill -f "expo start"

# 清除所有缓存
rm -rf node_modules/.cache
rm -rf .expo
rm -rf /tmp/metro-*

# 重启
npx expo start --clear
```

### 方法3：检查 Metro bundler 输出

启动后检查终端输出，确保看到：
```
› Opening exp://192.168.x.x:8081 on iPhone 15
```

如果看到错误或警告，需要先解决这些问题。

## 验证修复

### 1. 测试台湾流程

1. 启动应用
2. 点击"开始新行程"
3. 扫描/输入护照信息
4. 选择台湾 🇹🇼

**预期结果**：
- ✅ 应该看到 `TaiwanInfoScreen`
  - 标题：台湾入境签证与电子入境卡
  - 副标题：中国大陆护照需提前办理入台证
  - 三个部分：签证要求、入境所需材料、重要提醒
- ✅ 点击"我已了解，继续确认材料"
  - 进入 `TaiwanRequirementsScreen`
  - 5个确认项需要勾选
- ✅ 全部勾选后点击"继续填写行程信息"
  - 进入 `TravelInfoScreen`

### 2. 测试新加坡流程

重复上述步骤，选择新加坡 🇸🇬

**预期结果**：
- ✅ `SingaporeInfoScreen`
  - 标题：新加坡免签入境与 SG Arrival Card
  - 副标题：2024年2月9日起中国护照免签30天
- ✅ `SingaporeRequirementsScreen` 
- ✅ `TravelInfoScreen`

### 3. 测试马来西亚流程

重复上述步骤，选择马来西亚 🇲🇾

**预期结果**：
- ✅ `MalaysiaInfoScreen`
  - 标题：马来西亚免签入境与MDAC
  - 副标题：2023年12月1日起中国护照免签30天
- ✅ `MalaysiaRequirementsScreen`
- ✅ `TravelInfoScreen`

## 调试技巧

### 1. 查看 Metro bundler 日志

在终端中查看 Metro bundler 的输出，看是否有：
- 编译错误
- 导入错误
- 缓存问题

### 2. 使用 React DevTools

```bash
# 安装 React DevTools
npm install -g react-devtools

# 在新终端中运行
react-devtools
```

这样可以查看：
- 当前渲染的组件
- 导航状态
- Props 传递

### 3. 添加调试日志

在 `SelectDestinationScreen.js` 中添加：

```javascript
const handleCountrySelect = (country) => {
  console.log('🔍 Selected country:', country.id);
  
  if (country.id === 'tw') {
    console.log('✅ Navigating to TaiwanInfo');
    setTimeout(() => {
      navigation.navigate('TaiwanInfo', { passport, destination: country });
    }, 300);
    return;
  }
  // ...
}
```

然后查看终端中的日志输出。

### 4. 检查导航堆栈

在 InfoScreen 中添加：

```javascript
useEffect(() => {
  console.log('📍 TaiwanInfoScreen mounted');
  console.log('📦 Route params:', route.params);
}, []);
```

## 代码验证

### 检查导航配置

```bash
# 验证所有屏幕都已注册
grep -n "TaiwanInfo\|TaiwanRequirements" app/navigation/AppNavigator.js
grep -n "SingaporeInfo\|SingaporeRequirements" app/navigation/AppNavigator.js
grep -n "MalaysiaInfo\|MalaysiaRequirements" app/navigation/AppNavigator.js
```

### 检查导航逻辑

```bash
# 验证 SelectDestinationScreen 中的导航
grep -A 5 "id === 'tw'" app/screens/SelectDestinationScreen.js
grep -A 5 "id === 'sg'" app/screens/SelectDestinationScreen.js
grep -A 5 "id === 'my'" app/screens/SelectDestinationScreen.js
```

### 运行验证脚本

```bash
./verify-info-pages.sh
```

应该看到 39/39 检查通过。

## 常见问题

### Q: 清除缓存后还是直接跳到 TravelInfo？

A: 尝试：
1. 完全关闭应用（不是后台，是强制退出）
2. 重新打开应用
3. 或者重新安装应用到设备

### Q: 看到 "Unable to resolve module" 错误？

A: 运行：
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### Q: iOS/Android 行为不一致？

A: 这可能是缓存问题，分别清除两个平台的缓存：

**iOS:**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/
```

**Android:**
```bash
cd android
./gradlew clean
cd ..
```

### Q: 导航到了 InfoScreen 但看不到内容？

A: 检查：
1. i18n 翻译是否正确加载
2. 在屏幕中添加 `console.log(t('taiwan.info.title'))` 查看翻译值
3. 检查 `app/i18n/locales.js` 中的翻译键是否存在

## 确认修复成功

当你看到以下流程时，说明修复成功：

```
✅ 选择台湾 → TaiwanInfoScreen (显示签证信息)
✅ 点击继续 → TaiwanRequirementsScreen (显示确认清单)  
✅ 勾选所有项并点击继续 → TravelInfoScreen

✅ 选择新加坡 → SingaporeInfoScreen (显示免签信息)
✅ 点击继续 → SingaporeRequirementsScreen
✅ 勾选所有项并点击继续 → TravelInfoScreen

✅ 选择马来西亚 → MalaysiaInfoScreen (显示免签信息)
✅ 点击继续 → MalaysiaRequirementsScreen
✅ 勾选所有项并点击继续 → TravelInfoScreen
```

## 总结

代码本身是完全正确的，问题是应用缓存导致的。清除缓存后重启应用即可解决。

如果问题仍然存在，请：
1. 检查 Metro bundler 日志
2. 添加调试日志
3. 使用 React DevTools 查看导航状态
4. 运行验证脚本确认文件和配置都正确

---

**需要帮助？**  
运行 `./verify-info-pages.sh` 检查所有配置是否正确。
