# 老年用户功能安装指南

## 快速开始

### 1. 安装依赖

```bash
cd /Users/bujin/Documents/Projects/BorderBuddy
npm install
```

这会安装新增的 `expo-keep-awake` 包（保持屏幕常亮）。

### 2. 启动应用

```bash
npm start
```

然后选择：
- 按 `i` 打开 iOS 模拟器
- 按 `a` 打开 Android 模拟器
- 扫描二维码在真机上运行

### 3. 测试流程

#### 测试 PIK 操作指南:
```
1. 启动应用 → 登录
2. 点击"开始新旅程"
3. 扫描护照（或使用测试数据）
4. 选择"加拿大"
5. 填写旅行信息（特别是海关申报部分）
6. 点击"开始生成通关包"
7. 在结果页面，点击"🤖 自助通关机指南"
8. ✅ 查看是否显示预设答案
9. ✅ 测试字体调整按钮
10. ✅ 检查所有6个步骤是否完整
```

#### 测试抄写模式:
```
1. 从结果页面，点击"✍️ 抄写模式（适合老人）"
2. ✅ 检查字体是否够大（24pt起）
3. ✅ 测试字体调整功能
4. ✅ 检查屏幕是否保持常亮（等待30秒不黑屏）
5. ✅ 滚动查看所有表格字段
6. ✅ 确认字段顺序符合E311表格
7. ✅ 查看高亮字段（海关申报）
```

---

## 文件结构

新增的文件：
```
app/screens/
├── PIKGuideScreen.js          # PIK操作指南
└── CopyWriteModeScreen.js     # 抄写模式

修改的文件：
app/navigation/AppNavigator.js  # 添加路由
app/screens/ResultScreen.js     # 添加入口按钮
package.json                    # 添加依赖

文档：
`docs/features/ELDERLY_USER_FEATURES.md`        # 功能详细文档
`docs/features/SETUP_ELDERLY_FEATURES.md`       # 本文件
```

---

## 功能检查清单

### PIKGuideScreen 功能检查

- [ ] 页面正常渲染
- [ ] 返回按钮工作
- [ ] 字体调整按钮（A- / A+）工作
- [ ] 显示6个步骤（找机器 → 完成入境）
- [ ] 预设答案正确显示（根据用户数据）
- [ ] 高亮显示"是"的答案（橙色背景）
- [ ] 求助建议卡片显示
- [ ] 常用短语卡片显示
- [ ] 可以跳转到"查看我的信息"
- [ ] 可以跳转到"抄写模式"

### CopyWriteModeScreen 功能检查

- [ ] 页面正常渲染
- [ ] 返回按钮工作
- [ ] 字体调整按钮工作
- [ ] 屏幕保持常亮（测试30秒+）
- [ ] 显示4个部分（旅客信息、地址、旅行详情、海关申报）
- [ ] 字段按E311顺序排列
- [ ] 超大字体清晰可读
- [ ] 海关申报字段高亮显示（橙色）
- [ ] 显示填写说明
- [ ] 显示重要提示卡片
- [ ] 滚动流畅

### ResultScreen 入口检查

- [ ] 显示"下载PDF"按钮
- [ ] 显示"分享"按钮
- [ ] 显示"✍️ 抄写模式（适合老人）"按钮
- [ ] 显示"🤖 自助通关机指南"按钮
- [ ] 所有按钮点击后正确导航

---

## 常见问题排查

### 问题1: npm install 失败

**症状**: 
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**解决方法**:
```bash
npm install --legacy-peer-deps
```

或者：
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### 问题2: expo-keep-awake 不工作（屏幕还是会黑）

**症状**: 在抄写模式下，屏幕过一会儿就黑了

**检查**:
1. 确认已安装 expo-keep-awake:
```bash
npm list expo-keep-awake
```

2. 检查代码是否正确导入:
```javascript
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
```

3. 真机测试（模拟器可能不支持）

**临时解决方法**:
手动调整手机设置 → 显示 → 自动锁定 → 永不

---

### 问题3: 导航错误 "undefined is not an object"

**症状**: 
```
TypeError: undefined is not an object (evaluating 'navigation.navigate')
```

**检查**:
1. 确认 AppNavigator.js 已正确导入新屏幕
2. 确认路由名称拼写正确（PIKGuide, CopyWrite）
3. 重启 Metro bundler:
```bash
# 按 Ctrl+C 停止
npm start --reset-cache
```

---

### 问题4: 字体太小/太大

**调整**:
打开 `CopyWriteModeScreen.js` 或 `PIKGuideScreen.js`，修改默认字体大小：

```javascript
const [fontSize, setFontSize] = useState(24); // 改成你想要的大小
```

---

### 问题5: 数据没有传递过来（passport, destination, travelInfo 是 undefined）

**检查**:
1. 确认从 ResultScreen 导航时传递了参数:
```javascript
navigation.navigate('PIKGuide', { passport, destination, travelInfo })
```

2. 确认目标屏幕正确获取参数:
```javascript
const { passport, destination, travelInfo } = route.params || {};
```

3. 打印调试信息:
```javascript
console.log('Received data:', { passport, destination, travelInfo });
```

---

## 性能优化建议

### 1. 图片优化（未来）
当添加真实PIK机器照片时：
- 压缩图片到合理大小（< 200KB）
- 使用 WebP 格式
- 实现懒加载

### 2. 字体性能
大字体可能导致重绘，建议：
- 限制字体大小范围（16pt - 32pt）
- 使用 `useMemo` 缓存样式对象
- 避免频繁调整字体

### 3. 屏幕常亮
expo-keep-awake 会影响电池：
- 只在必要时激活
- 离开页面时记得 deactivate
- 提醒用户充电

---

## 用户测试建议

### 测试用户画像
- 年龄: 60-75岁
- 视力: 老花眼或轻度近视
- 技术水平: 会用微信，但不熟悉其他App
- 英语水平: 基本不会

### 测试场景
1. **场景A: 老人独自使用**
   - 给老人一部手机，已经打开到ResultScreen
   - 观察他们能否找到并使用新功能
   - 记录困惑点

2. **场景B: 子女协助**
   - 子女帮忙打开到PIKGuide
   - 老人自己操作
   - 子女在旁边观察，不主动帮助

3. **场景C: 实际环境模拟**
   - 打印一张空白E311表格
   - 让老人用抄写模式抄写
   - 计时并观察完成度

### 收集反馈
- 字体大小是否合适？
- 说明是否容易理解？
- 颜色对比度是否清晰？
- 是否有遗漏的信息？
- 操作流程是否顺畅？

---

## 下一步

完成基本功能测试后，可以考虑：

1. **添加真实内容**
   - PIK机器的实际照片
   - E311表格的样式图
   - 操作视频教程

2. **多语言支持**
   - 粤语版本（很多老人说粤语）
   - 闽南语版本
   - 繁体中文版本

3. **离线支持**
   - 将指南内容缓存到本地
   - 飞机上无网络也能使用

4. **家人协助功能**
   - 远程查看老人的进度
   - 视频通话内置指引

5. **其他目的地**
   - 美国（类似的自助通关）
   - 澳大利亚（SmartGate）
   - 欧洲国家（自助护照扫描）

---

## 联系支持

如果遇到问题：
1. 查看 `docs/features/ELDERLY_USER_FEATURES.md` 详细文档
2. 检查控制台错误信息
3. 使用 `console.log` 调试数据流
4. 重启 Metro bundler 和应用

---

**祝测试顺利！** 🎉

这些功能会让很多老年用户受益，让出国旅行变得更轻松！
