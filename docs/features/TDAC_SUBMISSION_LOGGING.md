# TDAC 提交详细日志和手动确认功能

## 概述

为了满足开发调试需求，在闪电提交选项中，我们在验证完Cloudflare robot check之后、最终submit给TDAC之前，添加了详细的日志记录和手动确认功能。

## 功能特点

### 🔍 详细日志记录

- **完整信息记录**: 记录所有将要提交给TDAC的信息
- **字段映射**: 显示入境信息与TDAC表单字段的对应关系
- **ID值记录**: 记录dropdown和radiobutton的ID值
- **时间戳**: 记录提交时间和操作历史
- **本地存储**: 保存日志到本地存储供调试使用

### 🛑 手动确认机制

- **提交前确认**: 在最终提交前显示确认对话框
- **详细信息展示**: 显示所有将要提交的信息
- **取消选项**: 用户可以取消提交避免被TDAC封禁
- **二次确认**: 提供查看详细日志的选项

## 支持的提交方式

### 1. 闪电提交 (Hybrid Mode)
- **文件**: `app/screens/thailand/TDACHybridScreen.js`
- **触发时机**: Cloudflare验证完成后，API提交前
- **日志内容**: 完整的travelerData和字段映射

### 2. WebView 自动填充
- **文件**: `app/screens/thailand/TDACWebViewScreen.js`
- **触发时机**: 自动填充执行前
- **日志内容**: 表单字段、搜索词、目标ID

## 技术实现

### 核心服务
```javascript
// 统一日志服务
import TDACSubmissionLogger from '../../services/tdac/TDACSubmissionLogger';

// Hybrid模式日志
await TDACSubmissionLogger.logHybridSubmission(travelerData, cloudflareToken);

// WebView模式日志
await TDACSubmissionLogger.logWebViewFill(formFields);
```

### 日志格式

#### Hybrid模式日志
```
🔍 ===== TDAC 闪电提交详细日志 =====
⏰ 提交时间: 2024-12-19 14:30:25
🌐 提交方式: 闪电提交 (Hybrid Mode)
🔑 Cloudflare Token: ✅ 已获取 (长度: 1234)

📋 === 个人信息 Personal Information ===
👤 姓名 (Name):
  - 姓 (Family Name): ZHANG → TDAC字段: familyName
  - 名 (First Name): WEI → TDAC字段: firstName
  
📄 护照信息 (Passport):
  - 护照号 (Passport No): E12345678 → TDAC字段: passportNo
  - 国籍 (Nationality): China → TDAC字段: nationality
  
... (更多详细信息)

📊 === 表单字段映射 Form Field Mappings ===
  1. 姓氏: "ZHANG" → TDAC字段ID: familyName
  2. 名字: "WEI" → TDAC字段ID: firstName
  3. 护照号: "E12345678" → TDAC字段ID: passportNo
  
⚠️ === 重要提醒 Important Notes ===
🚨 此信息将直接提交给泰国移民局 (TDAC)
🚨 提交后无法修改，请仔细核对
🚨 多次提交可能导致账户被暂时封禁
🚨 请确保所有信息与护照完全一致
```

#### WebView模式日志
```
🔍 ===== TDAC WebView 自动填充详细日志 =====
⏰ 填充时间: 2024-12-19 14:30:25
🌐 填充方式: WebView 自动填充
🎯 目标网站: https://tdac.immigration.go.th

👤 个人信息字段 (Personal Information):
  1. Family Name (姓)
     值: "ZHANG"
     搜索词: [familyName, lastName, surname]
     目标字段ID: familyName

🔧 === 技术实现详情 ===
🎯 字段查找策略:
  1. Angular表单属性 (formcontrolname)
  2. ng-reflect-name 属性
  3. name 和 id 属性
  4. placeholder 文本匹配
  5. label 文本匹配
  6. 单选按钮组 (mat-radio-group)
```

### 手动确认对话框

#### 基础确认
```javascript
Alert.alert(
  '🛑 确认提交',
  `
🔍 即将提交的信息：

👤 个人信息：
• 姓名: ZHANG WEI
• 护照号: E12345678
• 国籍: China

✈️ 旅行信息：
• 到达日期: 2024-12-25
• 航班号: CA123

⚠️ 重要提醒：
• 信息将直接提交给泰国移民局
• 提交后无法修改
• 多次提交可能被封禁
  `,
  [
    { text: '❌ 取消', onPress: () => resolve(false) },
    { text: '📝 查看详细日志', onPress: () => showDetailedLog() },
    { text: '✅ 确认提交', onPress: () => resolve(true) }
  ]
);
```

#### 详细日志确认
```javascript
Alert.alert(
  '📋 详细字段映射',
  `
🔍 TDAC 表单字段映射详情：

📋 个人信息字段：
• familyName → "ZHANG"
• firstName → "WEI"
• passportNo → "E12345678"

🔧 技术字段：
• cloudflareToken → "已获取 (1234 字符)"

⚠️ 这些字段将直接发送到泰国移民局系统
  `,
  [
    { text: '❌ 取消提交', onPress: () => resolve(false) },
    { text: '✅ 确认无误，立即提交', onPress: () => resolve(true) }
  ]
);
```

## 本地存储

### 存储键值
- `tdac_submission_log_hybrid_[timestamp]`: Hybrid模式提交日志
- `tdac_webview_fill_log_[timestamp]`: WebView填充日志
- `tdac_submission_history`: 通用提交历史记录

### 数据结构
```javascript
{
  timestamp: "2024-12-19T14:30:25.000Z",
  submissionMethod: "hybrid",
  travelerData: { /* 旅行者数据 */ },
  additionalInfo: { /* 额外信息 */ },
  warnings: [ /* 警告信息 */ ]
}
```

## 防止误操作

### 多重确认机制
1. **基础确认**: 显示关键信息摘要
2. **详细确认**: 显示完整字段映射
3. **取消选项**: 每个步骤都可以取消

### 警告提示
- 🚨 信息将直接提交给泰国移民局
- 🚨 提交后无法修改
- 🚨 多次提交可能被封禁
- 🚨 请确保信息与护照一致

## 调试支持

### 日志查看
```javascript
// 获取提交历史
const history = await TDACSubmissionLogger.getSubmissionHistory();

// 清理旧日志
await TDACSubmissionLogger.cleanupOldLogs(30); // 保留30天
```

### 控制台输出
所有日志都会输出到控制台，方便开发调试：
- 使用emoji图标便于识别
- 结构化输出便于阅读
- 包含时间戳和操作类型

## 使用场景

### 开发调试
- 验证数据映射正确性
- 检查字段ID匹配
- 调试提交流程

### 用户保护
- 防止意外提交
- 避免多次提交被封禁
- 提供详细信息确认

### 问题排查
- 保存完整提交记录
- 支持历史查询
- 便于问题复现

## 注意事项

1. **性能影响**: 日志记录会增加少量处理时间
2. **存储空间**: 定期清理旧日志避免占用过多空间
3. **隐私保护**: 敏感信息仅存储在本地
4. **用户体验**: 确认对话框可能增加操作步骤

## 未来改进

- [ ] 添加日志导出功能
- [ ] 支持自定义日志级别
- [ ] 添加可视化日志查看器
- [ ] 支持远程日志上传（可选）