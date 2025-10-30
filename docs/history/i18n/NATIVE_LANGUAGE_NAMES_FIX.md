# 语言选择器原生名称显示修复 / Native Language Names Fix

## 问题 / Problem

当用户选择繁体中文后，语言选择器中的"简体中文"标签也变成了繁体字"簡體中文"。

When user selected Traditional Chinese, the "简体中文" label also changed to "簡體中文" in the language selector.

### 问题截图 / Problem Screenshot:
```
选择繁体中文（香港）后 / After selecting zh-HK:

[English] [簡體中文] [繁體中文] [繁體中文（香港）] [Français]
          ↑ 变成繁体了！Changed to Traditional!
```

---

## 原因 / Root Cause

之前的实现使用 `t('languages.${code}')` 来获取语言标签，这意味着标签会根据当前选择的语言进行翻译。

The previous implementation used `t('languages.${code}')` to get language labels, which meant labels were translated based on the currently selected language.

### 之前的代码 / Previous Code:
```javascript
export const getLanguageOptions = (t) =>
  SUPPORTED_LANGUAGES.map((code) => ({
    code,
    label: t(`languages.${code}`, { defaultValue: translations.en.languages[code] || code }),
  }));
```

**问题**: 当前语言是 zh-HK 时，所有语言名称都会用繁体中文显示。

**Problem**: When current language is zh-HK, all language names were displayed in Traditional Chinese.

---

## 解决方案 / Solution

**使用每种语言的原生名称（母语名称），不随当前语言改变。**

**Use native language names (endonyms) that don't change with the current language.**

### 新代码 / New Code:
```javascript
// Language display names - always show in their native language
const NATIVE_LANGUAGE_NAMES = {
  'en': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'zh-HK': '繁體中文（香港）',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'ja': '日本語',
  'ko': '한국어',
  'zh': '中文',
};

export const getLanguageOptions = (t) =>
  SUPPORTED_LANGUAGES.map((code) => ({
    code,
    label: NATIVE_LANGUAGE_NAMES[code] || code,
  }));
```

---

## 效果对比 / Before & After

### 之前 / Before:
当选择不同语言时，语言选择器的标签会改变：

| 当前语言 | "简体中文"显示为 | "English"显示为 |
|---------|-----------------|----------------|
| en (English) | Simplified Chinese | English |
| zh-CN (简体) | 简体中文 | English |
| zh-TW (繁体) | 簡體中文 | 英文 |
| zh-HK (香港) | 簡體中文 | 英文 |

❌ **问题**: 标签随当前语言变化，用户可能找不到自己的语言。

### 现在 / After:
无论选择什么语言，语言选择器始终显示原生名称：

| 当前语言 | 语言选择器显示 |
|---------|---------------|
| **任何语言** | [English] [简体中文] [繁體中文] [繁體中文（香港）] [Français] [Deutsch] [Español] [日本語] [한국어] |

✅ **优点**: 
- 每种语言用自己的文字显示
- 用户容易识别自己的母语
- 符合国际化最佳实践
- 不会因为选错语言而找不到回去的路

---

## 国际化最佳实践 / i18n Best Practices

### ✅ 推荐做法 / Recommended:
**语言选择器应该用每种语言的原生名称（母语）**

Language selectors should display each language in its native form (endonym).

**示例 / Examples:**
- English (not "Inglés" or "英语")
- 简体中文 (not "Simplified Chinese" or "Chinois Simplifié")
- 繁體中文 (not "Traditional Chinese" or "中国語（繁体）")
- Français (not "French" or "法语")
- 日本語 (not "Japanese" or "日语")

### 为什么？ / Why?

1. **用户能立即识别自己的语言**
   Users can immediately recognize their language

2. **不会因为当前语言设置错误而找不到正确的语言**
   Won't get lost if wrong language is selected

3. **符合 Unicode CLDR 标准**
   Follows Unicode CLDR standards

4. **主流应用都这样做**
   Major apps (Google, Apple, Microsoft) do this

---

## 参考案例 / Real-World Examples

### Google 语言选择器:
```
English
中文（简体）
中文（繁體）
日本語
한국어
Français
Deutsch
```

### iOS 设置 > 语言:
```
English
简体中文
繁体中文
日本語
한국어
Français
Deutsch
Español
```

### Chrome 浏览器语言设置:
```
English (United States)
中文（简体）
中文（繁体，香港）
日本語
한국어
Français
Deutsch
```

---

## 技术细节 / Technical Details

### 修改的文件 / Modified Files:
- `app/i18n/LocaleContext.js`

### 改动内容 / Changes:
1. 添加 `NATIVE_LANGUAGE_NAMES` 常量
2. 修改 `getLanguageOptions` 函数使用原生名称
3. 移除对 `t()` 翻译函数的依赖

### 优点 / Benefits:
- ✅ 更简单 - 不需要翻译
- ✅ 更快 - 直接返回字符串
- ✅ 更可靠 - 不依赖翻译文件
- ✅ 更符合标准 - 国际化最佳实践

---

## 测试 / Testing

### 测试步骤 / Test Steps:

1. **启动应用** `npm start`
2. **查看语言选择器** - 应该看到原生名称
3. **选择繁体中文（香港）**
4. **再次查看语言选择器** - "简体中文"应该仍然是简体字，不会变成"簡體中文"

### 预期结果 / Expected Result:

无论选择什么语言，语言选择器始终显示：
```
Row 1: [English] [简体中文] [繁體中文] [繁體中文（香港）] [Français]
Row 2: [Deutsch] [Español] [日本語] [한국어]
```

### 测试用例 / Test Cases:

| 操作 | 预期结果 |
|-----|---------|
| 选择 English | "简体中文" 保持 "简体中文" ✓ |
| 选择 简体中文 | "简体中文" 保持 "简体中文" ✓ |
| 选择 繁體中文 | "简体中文" 保持 "简体中文" ✓ |
| 选择 繁體中文（香港） | "简体中文" 保持 "简体中文" ✓ |
| 选择 Français | "简体中文" 保持 "简体中文" ✓ |

---

## 常见问题 / FAQ

### Q: 为什么不翻译语言名称？
**A**: 因为用户需要能够识别自己的母语。如果我不懂中文，当界面显示"Chinese"时，我无法知道点击后会显示什么文字。但如果显示"中文"或"简体中文"，我立即能认出这是我的语言。

### Q: Why not translate language names?
**A**: Because users need to recognize their native language. If I don't understand Chinese, when the interface shows "Chinese", I can't know what will happen after clicking. But if it shows "中文" or "简体中文", I immediately recognize it's my language.

---

### Q: 其他地方的语言名称怎么办？
**A**: 只有语言选择器使用原生名称。在应用内其他地方（如设置页面的"当前语言：简体中文"），可以根据当前语言翻译显示。

### Q: What about language names elsewhere in the app?
**A**: Only the language selector uses native names. Elsewhere in the app (like "Current language: Simplified Chinese" in settings), you can translate based on current language.

---

### Q: 如果添加新语言怎么办？
**A**: 在 `NATIVE_LANGUAGE_NAMES` 对象中添加新的条目即可：

### Q: What if I add a new language?
**A**: Just add a new entry to the `NATIVE_LANGUAGE_NAMES` object:

```javascript
const NATIVE_LANGUAGE_NAMES = {
  // ... existing languages ...
  'pt': 'Português',      // Portuguese
  'ru': 'Русский',        // Russian
  'ar': 'العربية',        // Arabic
  'th': 'ไทย',            // Thai
};
```

---

## 相关资源 / References

- [Unicode CLDR - Language Display Names](http://cldr.unicode.org/)
- [W3C Internationalization - Language Names](https://www.w3.org/International/questions/qa-choosing-language-tags)
- [ISO 639 Language Codes](https://www.iso.org/iso-639-language-codes.html)

---

**修复日期 / Fixed on**: January 2025  
**相关文档 / Related**: TWO_ROW_LANGUAGE_SELECTOR.md, LANGUAGE_SELECTOR_FIX.md
