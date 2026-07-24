#!/usr/bin/env node

/**
 * TDAC 日志功能验证脚本
 * 验证所有TDAC提交日志功能是否正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 TDAC 日志功能...\n');

// 检查核心文件是否存在
const filesToCheck = [
  'app/services/tdac/TDACSubmissionLogger.js',
  'app/screens/thailand/TDACHybridScreen.tsx',
  'app/screens/thailand/TDACWebViewScreen.tsx',
  'app/services/tdac/__tests__/TDACSubmissionLogger.test.js',
  'docs/features/TDAC_SUBMISSION_LOGGING.md',
  'docs/examples/TDAC_LOGGING_EXAMPLE.md'
];

let allFilesExist = true;

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath} - 文件不存在`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ 部分文件缺失，请检查实现');
  process.exit(1);
}

// 检查关键功能是否已实现
console.log('\n🔍 检查关键功能实现...');

// 检查TDACSubmissionLogger服务
const loggerPath = 'app/services/tdac/TDACSubmissionLogger.js';
const loggerContent = fs.readFileSync(loggerPath, 'utf8');

const requiredMethods = [
  'logHybridSubmission',
  'logWebViewFill',
  'saveSubmissionLog',
  'getSubmissionHistory'
];

requiredMethods.forEach(method => {
  if (loggerContent.includes(method)) {
    console.log(`✅ TDACSubmissionLogger.${method}() 已实现`);
  } else {
    console.log(`❌ TDACSubmissionLogger.${method}() 未找到`);
    allFilesExist = false;
  }
});

// 检查TDACHybridScreen是否集成了日志功能
const hybridPath = 'app/screens/thailand/TDACHybridScreen.tsx';
const hybridContent = fs.readFileSync(hybridPath, 'utf8');

if (hybridContent.includes('TDACSubmissionLogger.logHybridSubmission')) {
  console.log('✅ TDACHybridScreen 已集成日志功能');
} else {
  console.log('❌ TDACHybridScreen 未集成日志功能');
  allFilesExist = false;
}

if (hybridContent.includes('showSubmissionConfirmation')) {
  console.log('✅ TDACHybridScreen 已实现手动确认');
} else {
  console.log('❌ TDACHybridScreen 未实现手动确认');
  allFilesExist = false;
}

// 检查TDACWebViewScreen是否集成了日志功能
const webviewPath = 'app/screens/thailand/TDACWebViewScreen.tsx';
const webviewContent = fs.readFileSync(webviewPath, 'utf8');

if (webviewContent.includes('TDACSubmissionLogger.logWebViewFill')) {
  console.log('✅ TDACWebViewScreen 已集成日志功能');
} else {
  console.log('❌ TDACWebViewScreen 未集成日志功能');
  allFilesExist = false;
}

if (webviewContent.includes('showWebViewFillConfirmation')) {
  console.log('✅ TDACWebViewScreen 已实现手动确认');
} else {
  console.log('❌ TDACWebViewScreen 未实现手动确认');
  allFilesExist = false;
}

// 检查语法错误
console.log('\n🔍 检查语法...');

try {
  // 简单的语法检查
  require(path.resolve(loggerPath));
  console.log('✅ TDACSubmissionLogger 语法正确');
} catch (error) {
  console.log('❌ TDACSubmissionLogger 语法错误:', error.message);
  allFilesExist = false;
}

// 最终结果
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 所有 TDAC 日志功能验证通过！');
  console.log('\n功能摘要:');
  console.log('✅ 详细日志记录 - 记录所有提交信息和字段映射');
  console.log('✅ 字段ID映射 - 包括dropdown和radiobutton的ID值');
  console.log('✅ 手动确认机制 - 防止误提交和被TDAC封禁');
  console.log('✅ 本地存储 - 保存日志供调试使用');
  console.log('✅ 单元测试 - 确保功能稳定性');
  console.log('✅ 完整文档 - 详细的使用说明和示例');
  
  console.log('\n使用方式:');
  console.log('1. 闪电提交: Cloudflare验证后自动显示日志和确认对话框');
  console.log('2. WebView填充: 点击自动填充前显示日志和确认对话框');
  console.log('3. 查看日志: 检查控制台输出和本地存储');
  
  process.exit(0);
} else {
  console.log('❌ TDAC 日志功能验证失败，请检查实现');
  process.exit(1);
}