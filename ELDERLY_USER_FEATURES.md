# 老年用户友好功能 (Elderly User Features)

## 概述 (Overview)

为了帮助老年用户顺利通过加拿大边境的自助通关机（PIK - Primary Inspection Kiosk），我们添加了两个专门的辅助屏幕。

---

## 新增功能 (New Features)

### 1. 🤖 自助通关机操作指南 (PIK Guide)

**文件**: `app/screens/PIKGuideScreen.js`

**功能**:
- 分步图文指南，教老人如何使用PIK机器
- 6个详细步骤，从找机器到完成入境
- **预填答案**：根据用户在TravelInfo填写的信息，显示每个海关问题的答案
- 大字体显示，可调整字号（16pt - 24pt）
- 常用英文短语卡（给工作人员看）
- 求助建议（如何找工作人员帮忙）
- 安心提示（告诉老人不用紧张）

**核心价值**:
- 老人最怕的是"看不懂英文问题，不知道该怎么回答"
- 这个屏幕提前把所有答案准备好，老人只需要"照着点"就行了

**使用场景**:
```
ResultScreen → 点击"🤖 自助通关机指南" → PIKGuideScreen
```

**关键特性**:
- ✅ 答案高亮显示（如果回答"是"，会特别标注）
- ✅ 中英对照（每个问题都有英文和中文）
- ✅ 字体可调（适应不同视力）
- ✅ 图片占位符（未来可添加真实PIK机器照片）

---

### 2. ✍️ 抄写模式 (Copy Write Mode)

**文件**: `app/screens/CopyWriteModeScreen.js`

**功能**:
- 超大字体显示所有表格信息（24pt - 32pt）
- 按照E311表格的实际顺序排列字段
- 屏幕保持常亮（使用 expo-keep-awake）
- 每个字段都有：
  - 中文标签 + 英文标签
  - 超大字体的值（加粗、高对比度）
  - 填写说明（例如：格式、大小写要求）
- 重要字段高亮标注（如海关申报）
- 分组显示（旅客信息、地址、旅行详情、海关申报）

**核心价值**:
- 老人可以在飞机上或入境大厅，对照手机屏幕，用笔抄写到纸质E311表格上
- 不需要懂英文，只需要"照着抄"
- 避免了打印、分享等复杂操作

**使用场景**:
```
在飞机上:
1. 拿一张空白E311表格（飞机上有）
2. 打开App → ResultScreen → 点击"✍️ 抄写模式"
3. 对照手机屏幕，用笔抄写
4. 到达后直接交给海关官员
```

**关键特性**:
- ✅ 屏幕常亮（不会抄到一半黑屏）
- ✅ 超大字体（老花眼也能看清）
- ✅ 高对比度（黑字白底）
- ✅ 字段编号（1.1, 1.2 清晰明了）
- ✅ 填写说明（告诉老人格式要求）
- ✅ 底部提示（检查清单）

---

## 技术实现 (Technical Implementation)

### 依赖包

已添加到 `package.json`:
```json
{
  "expo-keep-awake": "~12.3.0"
}
```

**安装方法**:
```bash
cd /Users/bujin/Documents/Projects/TripSecretary
npm install
```

### 导航配置

已更新 `app/navigation/AppNavigator.js`:
```javascript
import PIKGuideScreen from '../screens/PIKGuideScreen';
import CopyWriteModeScreen from '../screens/CopyWriteModeScreen';

// 添加路由
<Stack.Screen name="PIKGuide" component={PIKGuideScreen} />
<Stack.Screen name="CopyWrite" component={CopyWriteModeScreen} />
```

### 入口按钮

已更新 `app/screens/ResultScreen.js`:
```javascript
<Button
  title="✍️ 抄写模式（适合老人）"
  onPress={() => navigation.navigate('CopyWrite', { passport, destination, travelInfo })}
/>

<Button
  title="🤖 自助通关机指南"
  onPress={() => navigation.navigate('PIKGuide', { passport, destination, travelInfo })}
/>
```

---

## 数据流 (Data Flow)

```
TravelInfoScreen
    ↓ (用户填写旅行信息)
ResultScreen
    ↓ (传递 passport, destination, travelInfo)
PIKGuideScreen / CopyWriteModeScreen
    ↓ (根据用户数据生成预设答案)
显示个性化的表格内容
```

---

## 使用示例 (Usage Examples)

### 场景1: 老人不会用PIK机器

```
用户: 我妈妈不会用那个机器，怎么办？
App: 
1. 打开"自助通关机指南"
2. 手把手教她每一步
3. 每个问题都有预设答案，告诉她点"是"还是"否"
4. 如果还是不会，告诉她可以找工作人员帮忙
```

### 场景2: 老人想手写表格

```
用户: 我爸爸不信任手机，想用纸笔填表格
App:
1. 在飞机上打开"抄写模式"
2. 拿一张空白E311表格
3. 对照手机屏幕，用笔抄写
4. 字体超大，看得清楚
5. 屏幕不会黑屏，可以慢慢抄
```

### 场景3: 子女远程指导

```
子女在国内，父母在加拿大入境:
1. 子女提前帮父母准备好App
2. 视频通话时，打开"自助通关机指南"
3. 子女看着指南，远程指导父母操作
4. 每个步骤都有编号，方便沟通
```

---

## 未来优化 (Future Improvements)

### 短期 (V1.1)
- [ ] 添加真实的PIK机器照片
- [ ] 添加E311表格样式图片
- [ ] 支持语音播报（给视力不好的老人）
- [ ] 添加放大镜功能（局部放大字体）

### 中期 (V1.2)
- [ ] 录制PIK操作视频教程
- [ ] 支持离线下载指南（飞机上无网络也能看）
- [ ] 家庭成员远程协助模式
- [ ] 打印友好版PDF（A4纸大小，适合打印出来带着）

### 长期 (V2.0)
- [ ] AR增强现实指引（用相机扫描PIK机器，显示操作提示）
- [ ] 多语言版本（粤语、闽南语等方言）
- [ ] 智能客服（AI回答老人的问题）

---

## 文件清单 (File List)

### 新增文件
- `app/screens/PIKGuideScreen.js` - PIK操作指南
- `app/screens/CopyWriteModeScreen.js` - 抄写模式

### 修改文件
- `app/navigation/AppNavigator.js` - 添加路由
- `app/screens/ResultScreen.js` - 添加入口按钮
- `package.json` - 添加依赖

### 依赖的现有文件
- `app/components/Card.js` - 卡片组件
- `app/components/Button.js` - 按钮组件
- `app/theme/index.js` - 主题配置

---

## 测试建议 (Testing Recommendations)

### 功能测试
1. ✅ 字体调整功能正常
2. ✅ 屏幕保持常亮（抄写模式）
3. ✅ 导航流程顺畅
4. ✅ 数据正确传递
5. ✅ 预设答案正确匹配

### 用户测试
1. 找真实的老年用户测试
2. 观察他们是否能看清字体
3. 确认指南是否容易理解
4. 收集反馈并改进

### 边缘案例
1. 用户没有填写某些字段（显示默认值或"留空"）
2. 字段值过长（自动换行）
3. 多行字段（地址）的显示

---

## 常见问题 (FAQ)

**Q: 为什么不直接填好表格让老人打印？**
A: 很多老人不会打印，或者在飞机上/机场无法打印。抄写模式解决了这个问题。

**Q: PIK机器有中文吗？**
A: 有些机场的PIK有中文选项，但不是所有都有。我们的指南假设没有中文，提供英文+中文对照。

**Q: 如果老人完全不会用怎么办？**
A: 指南里有"求助方案"，教他们如何找工作人员帮忙，或者去人工柜台。

**Q: 这些功能增加了多少代码？**
A: 
- PIKGuideScreen: ~800行
- CopyWriteModeScreen: ~650行
- 总共约1450行，包含完整的样式和注释

**Q: 性能影响？**
A: 几乎没有。这些屏幕只是展示静态内容，不涉及复杂计算或网络请求。

---

## 总结 (Summary)

这两个功能专门为老年用户设计，解决了他们在加拿大边境自助通关的两大痛点：
1. **不会用机器** → PIK操作指南手把手教
2. **不会打印** → 抄写模式让他们手写

设计原则：
- 🔤 **超大字体** - 看得清
- 🎨 **高对比度** - 认得出
- 📝 **分步指引** - 跟得上
- 🌐 **中英对照** - 看得懂
- 💡 **预设答案** - 不用想

这些功能体现了对老年用户的关怀，让他们也能独立、自信地使用您的App完成出入境手续。

---

**创建日期**: 2025-01-XX  
**版本**: 1.0  
**维护者**: TripSecretary Team
