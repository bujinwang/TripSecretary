## 目标
- 所有目的地页面与模块仅使用用户选择的语言；当前场景为简体中文（`zh-CN`）。
- 日期与时间等格式严格按用户语言展示，不再因目的地或设备地区切换到其他中文变体（如 `zh-TW`）。

## 现状研判
- 语言上下文与持久化：`app/i18n/LocaleContext.tsx`（提供 `LocaleProvider`/`useLocale`/`useTranslation`，持久化键 `@tripassistant.locale`）。
- 语言映射与翻译聚合：`app/i18n/locales.ts`、`app/i18n/translations/index.ts`；存在 `zh`→`zh-TW` 的规范化/惰性转换逻辑（OpenCC）。
- 日期格式化：统一工具在 `app/utils/DateFormatter.ts` 与 `app/utils/dateUtils.ts`，但部分组件仍直接调用 `toLocaleDateString()` 未显式传入用户语言，导致日期出现英文。
- 使用示例：`app/components/SubmissionCountdown.tsx`、`app/screens/HomeScreen.tsx`、`app/screens/HistoryScreen.tsx`、`app/screens/EntryInfoHistoryScreen.tsx`。

## 调整方案
1. 单一语言来源
   - 以 `LocaleContext.language` 作为唯一真值来源；移除/禁止任何基于目的地的语言覆盖。
   - 在 `normalizeLanguage` 仅在“未知设备语言且未选择用户语言”时使用回退；一旦用户选择 `zh-CN`，全局强制使用。
2. 翻译与中文变体
   - `translations/index.ts`：仅当用户语言为 `zh-TW` 时才触发 OpenCC 生成；用户语言为 `zh-CN` 时直接使用简体翻译，不因目的地切换。
   - 若存在 `countries.zh.json` 模糊命名，统一映射为 `zh-CN`，保持 `SUPPORTED_LANGUAGES=['en','zh-CN','zh-TW',...]` 一致。
3. 日期/时间格式化统一
   - `DateFormatter` 默认从上下文读取 `language`，对所有格式化方法显式传递 `locale=language`。
   - 搜索并替换组件中直接使用 `toLocaleDateString()/toLocaleTimeString()` 的位置，统一改为 `DateFormatter` 或传入 `locale=language`。
   - 保留 `dateUtils` 的“本地日历日”解析策略，避免跨时区误差；新增 `formatChineseDate(date, 'zh-CN')` 用于中文风格日期（如 `2025年11月15日`）。
4. 组件层审计与修复
   - 覆盖：`SubmissionCountdown.tsx`、`HomeScreen.tsx`、`HistoryScreen.tsx`、`EntryInfoHistoryScreen.tsx` 以及台湾/其他目的地的入口页组件。
   - 检查任何基于目的地代码（如 `thailand`/`taiwan`）派生语言的逻辑并移除。
5. 验证
   - 在设置页选择简体中文后，遍历各目的地页面，确认全部文案与日期均为 `zh-CN`（示例期望：`抵达日：2025年11月15日`）。
   - 添加轻量单元测试覆盖 `DateFormatter` 的 `zh-CN` 输出与倒计时文案。

## 变更影响文件
- `app/i18n/LocaleContext.tsx`
- `app/i18n/locales.ts`
- `app/i18n/translations/index.ts` 与可能的 `countries.zh*.json`
- `app/utils/DateFormatter.ts`、`app/utils/dateUtils.ts`
- 受影响组件：`app/components/SubmissionCountdown.tsx`、`app/screens/*`（Home/History/EntryInfoHistory 等）

## 交付与风险控制
- 不新增文件，优先编辑现有实现；严格避免更改翻译键结构。
- 保留 `zh-TW` 作为用户可选语言；仅当用户明确选择繁体时才使用转换。
- 逐屏验证并截图确认，确保目的地差异不会触发语言切换。