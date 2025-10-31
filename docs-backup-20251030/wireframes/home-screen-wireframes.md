# 首页 (HomeScreen) - 详细 Wireframes
**Version:** 2.0 - Tab-based Design
**Date:** 2025-10-28
**Author:** Sally (UX Expert)
**Status:** Updated with Tab Navigation

---

## 📝 更新说明 (Version 2.0)

本版本采用 **Tab 切换设计** 替代了原有的折叠/展开设计，基于项目现有的 Tab 组件模式（参考 TDACFilesScreen.js 和 NotificationLogScreen.js）。

### 主要变更：
1. ✅ **Tab 导航** - 三个 Tab：进行中 / 已完成 / 已取消
2. ✅ **出发日期排序** - 进行中行程按出发日期排序（近到远）
3. ✅ **多行程并发** - 支持同时准备多个目的地
4. ✅ **取消与恢复** - 可以取消行程并从历史中恢复
5. ✅ **自动完成** - 根据提交状态 + 出发日期自动完成
6. ✅ **数据模型升级** - Trip 对象包含完整的 lifecycle 信息

---

## 📋 目录

1. [设计原则](#设计原则)
2. [状态场景](#状态场景)
3. [详细 Wireframes](#详细-wireframes)
4. [组件规格](#组件规格)
5. [交互说明](#交互说明)
6. [实现注意事项](#实现注意事项)

---

## 1. 设计原则

### 核心目标
```
新用户：清晰的起点 → 选择目的地 → 了解需求 → 开始准备
回访用户：一眼看到进度 → 一键继续 → 快速完成
```

### 设计原则
1. **进度优先** - 进行中的任务永远在最上面
2. **一键继续** - 减少用户思考，直接行动
3. **进度可见** - 用视觉化方式显示完成度
4. **降低焦虑** - 明确告诉用户还需要做什么
5. **激励完成** - 接近完成时给予积极反馈

---

## 2. 状态场景

首页需要处理以下场景：

| 场景 | 用户类型 | 显示内容 |
|------|---------|---------|
| **场景 1** | 新用户，无任务 | 欢迎界面 + 选择目的地 |
| **场景 2** | 有 1 个进行中任务 | 任务卡片突出显示 |
| **场景 3** | 有多个进行中任务 | 任务列表，按出发日期排序 |
| **场景 4** | 有已完成/已提交任务 | 使用 Tab 切换：进行中 / 已完成 / 已取消 |
| **场景 5** | 有即将到期的任务 | 添加紧急提醒 |

---

## 3. 详细 Wireframes

### 3.1 场景 1: 新用户首页（无任务）

```
┌─────────────────────────────────────────────────────────────┐
│ ═══════════════════════════════════════════════════════════ │
│                        STATUS BAR                            │
│ ═══════════════════════════════════════════════════════════ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER - 60px height                                    │ │
│ │ ┌────────────────────────────────────────────────────┐  │ │
│ │ │ 🧳 TripSecretary                   🔔 [3]  👤 [头像]│  │ │
│ │ │    16px font, bold                  Icons 24x24    │  │ │
│ │ └────────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HERO SECTION - 180px height                             │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │                                                      │ │ │
│ │ │                      ✈️                              │ │ │
│ │ │                   48px emoji                         │ │ │
│ │ │                                                      │ │ │
│ │ │            准备你的下一次旅行                          │ │ │
│ │ │            24px, bold, center                        │ │ │
│ │ │                                                      │ │ │
│ │ │        轻松搞定入境准备，安心享受旅程                    │ │ │
│ │ │        16px, regular, gray, center                   │ │ │
│ │ │                                                      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CTA SECTION - 80px height                               │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │                                                      │ │ │
│ │ │   [+ 准备新的目的地入境]                             │ │ │
│ │ │   Primary button, 56px height, full width           │ │ │
│ │ │   Background: colors.primary                         │ │ │
│ │ │   Text: 18px, bold, white                           │ │ │
│ │ │                                                      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ POPULAR DESTINATIONS - Dynamic height                   │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 热门目的地                                           │ │ │
│ │ │ 18px, semi-bold, margin-bottom: 16px                │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │ │
│ │ │              │ │              │ │              │    │ │
│ │ │     🇹🇭      │ │     🇯🇵      │ │     🇰🇷      │    │ │
│ │ │   40px emoji │ │   40px emoji │ │   40px emoji │    │ │
│ │ │              │ │              │ │              │    │ │
│ │ │    泰国      │ │    日本      │ │    韩国      │    │ │
│ │ │  16px, bold  │ │  16px, bold  │ │  16px, bold  │    │ │
│ │ │              │ │              │ │              │    │ │
│ │ │  需要TDAC    │ │  需要入境卡  │ │  K-ETA      │    │ │
│ │ │  14px, gray  │ │  14px, gray  │ │  14px, gray  │    │ │
│ │ │              │ │              │ │              │    │ │
│ │ │   [准备 →]   │ │   [准备 →]   │ │   [准备 →]   │    │ │
│ │ │  Button 40px │ │  Button 40px │ │  Button 40px │    │ │
│ │ │              │ │              │ │              │    │ │
│ │ └──────────────┘ └──────────────┘ └──────────────┘    │ │
│ │ 120px width    120px width     120px width           │ │
│ │ 160px height   160px height    160px height          │ │
│ │ 8px gap between cards                                 │ │
│ │                                                          │ │
│ │ [查看全部目的地 →]                                       │ │
│ │ Text link, 15px, colors.primary                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ INFO SECTION - Optional                                 │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 💡 提示                                              │ │ │
│ │ │ 我们会帮你准备所有需要的入境文件，包括：              │ │ │
│ │ │ • 数字入境卡                                         │ │ │
│ │ │ • 入境指南                                           │ │ │
│ │ │ • 海关展示模式                                       │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│                     [Bottom padding: 24px]                   │
└─────────────────────────────────────────────────────────────┘
```

#### 关键尺寸：
- **Header**: 60px 高度
- **Hero Section**: 180px 高度
- **Destination Card**: 120px 宽 × 160px 高
- **Button Primary**: 56px 高度
- **Padding**:
  - Screen horizontal: 16px
  - Section vertical: 24px
  - Card internal: 16px

---

### 3.2 场景 2: 有一个进行中任务（重点状态）

```
┌─────────────────────────────────────────────────────────────┐
│ ═══════════════════════════════════════════════════════════ │
│                        STATUS BAR                            │
│ ═══════════════════════════════════════════════════════════ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                                  │ │
│ │ 🧳 TripSecretary                   🔔 [3]  👤          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HERO SECTION - Smaller, 120px                           │ │
│ │                      ✈️                                  │ │
│ │               继续你的入境准备                            │ │
│ │               18px, bold                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ IN PROGRESS SECTION                                      │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 进行中 (1)                                           │ │ │
│ │ │ 16px, semi-bold, margin-bottom: 12px                │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ PREPARATION CARD - 200px height                     │ │ │
│ │ │ ┌─────────────────────────────────────────────────┐ │ │ │
│ │ │ │ ┌────────┐                                      │ │ │ │
│ │ │ │ │  🇹🇭   │  泰国入境准备                       │ │ │ │
│ │ │ │ │ 32px   │  18px, bold                         │ │ │ │
│ │ │ │ └────────┘                                      │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ ──────────────────────────────                  │ │ │ │
│ │ │ │ Divider, 1px, colors.border                     │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ 进度                                             │ │ │ │
│ │ │ │ ████████████████░░░░ 85%                        │ │ │ │
│ │ │ │ Progress bar: 8px height, rounded               │ │ │ │
│ │ │ │ Fill: colors.primary, Background: colors.border │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ 📅 到达日期：12月15日 (14天后)                   │ │ │ │
│ │ │ │ 14px, colors.text, icon 16px                    │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ ⚠️  还缺：旅行 - 到达时间                        │ │ │ │
│ │ │ │ 14px, colors.warning, icon 16px                 │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ 📝 最后编辑：2小时前                             │ │ │ │
│ │ │ │ 13px, colors.textSecondary, icon 14px           │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ ──────────────────────────────                  │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ [Quick Fix ⚡]        [继续准备 →]              │ │ │ │
│ │ │ │  Secondary btn         Primary btn              │ │ │ │
│ │ │ │  40px height           48px height              │ │ │ │
│ │ │ │  Auto width            Flex: 1                  │ │ │ │
│ │ │ └─────────────────────────────────────────────────┘ │ │ │
│ │ │                                                      │ │ │
│ │ │ Card styling:                                        │ │ │
│ │ │ - Background: colors.white                           │ │ │
│ │ │ - Border: 2px solid colors.primary (active state)   │ │ │
│ │ │ - Border radius: 16px                                │ │ │
│ │ │ - Shadow: large elevation                            │ │ │
│ │ │ - Padding: 20px                                      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ NEW DESTINATION CTA - 72px height                       │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │                                                      │ │ │
│ │ │ [+ 准备另一个目的地]                                 │ │ │
│ │ │ Secondary button, 48px height, full width           │ │ │
│ │ │ Border: 2px, colors.primary                         │ │ │
│ │ │ Background: transparent                              │ │ │
│ │ │ Text: 16px, colors.primary                          │ │ │
│ │ │                                                      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ COMPLETED SECTION (Collapsed)                           │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ▼ 已完成 (2)                           [展开 →]    │ │ │
│ │ │ 16px, semi-bold, colors.textSecondary               │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 交互说明：

**准备卡片交互：**
1. **点击卡片主体** → 导航到 `ThailandEntryFlowScreen`
2. **点击 [继续准备]** → 导航到 `ThailandEntryFlowScreen`
3. **点击 [Quick Fix]** → 打开 `QuickFixModal`（仅当缺失1-2个字段时显示此按钮）
4. **长按卡片** → 显示上下文菜单（删除草稿、查看详情等）

**状态指示器：**
- **< 50%**: 进度条橙色，显示"刚刚开始"
- **50-79%**: 进度条黄色，显示"进展不错"
- **80-99%**: 进度条浅绿，显示"快完成了！"
- **100%**: 进度条绿色，显示"✅ 准备就绪"

---

### 3.3 场景 3: 多个进行中任务（Tab 切换设计）

```
┌─────────────────────────────────────────────────────────────┐
│ ═══════════════════════════════════════════════════════════ │
│                        STATUS BAR                            │
│ ═══════════════════════════════════════════════════════════ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                                  │ │
│ │ 🧳 TripSecretary                   🔔  👤              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HERO SECTION - Minimal, 100px                           │ │
│ │               我的入境准备                               │ │
│ │               20px, bold                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TAB BAR - 56px height                                   │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ┌─────────────┬──────────────┬──────────────┐      │ │ │
│ │ │ │ 进行中 (3)  │  已完成 (2) │  已取消 (1) │      │ │ │
│ │ │ │  Active     │              │              │      │ │ │
│ │ │ │ ═══════════ │              │              │      │ │ │
│ │ │ └─────────────┴──────────────┴──────────────┘      │ │ │
│ │ │ Background: colors.white                            │ │ │
│ │ │ Border bottom: 1px, colors.border                   │ │ │
│ │ │ Active tab: 2px bottom border, colors.primary       │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TRIP LIST - Active Trips (Sorted by departure date)    │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ CARD 1: 泰国 - 85% (出发：12月15日 - 14天后)       │ │ │
│ │ │ 🇹🇭 泰国入境准备                    ⋮ (context)    │ │ │
│ │ │ ████████████████░░░░ 85%                            │ │ │
│ │ │ 📅 12月15日 (14天后) | ⚠️ 还缺1项                 │ │ │
│ │ │ [Quick Fix ⚡] [继续准备 →]                        │ │ │
│ │ │                                                      │ │ │
│ │ │ 160px height, 16px gap to next card                 │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ CARD 2: 日本 - 95% (出发：1月10日 - 40天后)        │ │ │
│ │ │ 🇯🇵 日本入境准备                    ⋮              │ │ │
│ │ │ ███████████████████░ 95%                            │ │ │
│ │ │ 📅 1月10日 (40天后) | ✅ 几乎完成                  │ │ │
│ │ │ [完成准备 →]                                        │ │ │
│ │ │                                                      │ │ │
│ │ │ 140px height (no quick fix button)                  │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ CARD 3: 韩国 - 30% (出发：未设置)                  │ │ │
│ │ │ 🇰🇷 韩国入境准备                    ⋮              │ │ │
│ │ │ ██████░░░░░░░░░░░░░░ 30%                            │ │ │
│ │ │ 📅 未设置出发日期 | ⚠️ 还缺多项                    │ │ │
│ │ │ [继续准备 →]                                        │ │ │
│ │ │                                                      │ │ │
│ │ │ 140px height                                         │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [+ 准备另一个目的地]                                    │ │
│ │ Secondary button, 48px                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 卡片排序逻辑：

**默认排序：按出发日期（近到远）**
```javascript
// 按出发日期排序，未设置日期的排在最后
trips.sort((a, b) => {
  if (!a.departureDate) return 1;
  if (!b.departureDate) return -1;
  return new Date(a.departureDate) - new Date(b.departureDate);
});
```

#### Context Menu (长按或点击 ⋮)：
```
┌──────────────────────┐
│ 📝 编辑信息          │
│ ❌ 取消行程          │
│ 📤 分享给旅伴        │
│ 🗂️ 查看详情         │
└──────────────────────┘
```

#### 视觉层次：

1. **完成度 80%+** → 绿色边框 + 放大效果（scale: 1.02）
2. **完成度 50-79%** → 默认样式
3. **完成度 < 50%** → 灰色边框 + 略微透明（opacity: 0.9）

---

### 3.4 场景 4: 已完成 Tab（切换到已完成标签）

```
┌─────────────────────────────────────────────────────────────┐
│ ═══════════════════════════════════════════════════════════ │
│                        STATUS BAR                            │
│ ═══════════════════════════════════════════════════════════ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                                  │ │
│ │ 🧳 TripSecretary                   🔔  👤              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TAB BAR - 56px height                                   │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ┌─────────────┬──────────────┬──────────────┐      │ │ │
│ │ │ │ 进行中 (3)  │  已完成 (2) │  已取消 (1) │      │ │ │
│ │ │ │             │   Active    │              │      │ │ │
│ │ │ │             │ ═══════════ │              │      │ │ │
│ │ │ └─────────────┴──────────────┴──────────────┘      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ COMPLETED TRIPS LIST                                    │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ COMPLETED CARD - Compact, 120px height              │ │ │
│ │ │ ┌─────────────────────────────────────────────────┐ │ │ │
│ │ │ │ 🇹🇭 泰国入境准备              ✅                 │ │ │ │
│ │ │ │ 18px, colors.textSecondary    Success icon       │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ 已提交：10月25日 | 自动完成                     │ │ │ │
│ │ │ │ 14px, colors.textSecondary                       │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ 卡号：TH2025XXXXXX                              │ │ │ │
│ │ │ │ 13px, monospace, colors.textSecondary           │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ [查看详情 →]                [恢复行程]          │ │ │ │
│ │ │ │ Text link, 14px              Optional           │ │ │ │
│ │ │ └─────────────────────────────────────────────────┘ │ │ │
│ │ │                                                      │ │ │
│ │ │ Card styling:                                        │ │ │
│ │ │ - Background: colors.backgroundSecondary             │ │ │
│ │ │ - Border: 1px solid colors.border                   │ │ │
│ │ │ - Opacity: 0.8                                       │ │ │
│ │ │ - No shadow                                          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 🇯🇵 日本入境准备              ✅                     │ │ │
│ │ │ 已提交：9月10日 | 自动完成                          │ │ │
│ │ │ 卡号：JP2024YYYYYY                                  │ │ │
│ │ │ [查看详情 →]                                         │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 场景 5: 已取消 Tab（切换到已取消标签）

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TAB BAR - 56px height                                   │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ┌─────────────┬──────────────┬──────────────┐      │ │ │
│ │ │ │ 进行中 (3)  │  已完成 (2) │  已取消 (1) │      │ │ │
│ │ │ │             │              │   Active    │      │ │ │
│ │ │ │             │              │ ═══════════ │      │ │ │
│ │ │ └─────────────┴──────────────┴──────────────┘      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CANCELLED TRIPS LIST                                    │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ CANCELLED CARD - Compact, 120px height              │ │ │
│ │ │ ┌─────────────────────────────────────────────────┐ │ │ │
│ │ │ │ 🇰🇷 韩国入境准备              ❌                 │ │ │ │
│ │ │ │ 18px, colors.textSecondary    Cancelled icon     │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ 取消时间：11月5日                                │ │ │ │
│ │ │ │ 14px, colors.textSecondary                       │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ 取消原因：改变旅行计划                           │ │ │ │
│ │ │ │ 13px, italic, colors.textSecondary              │ │ │ │
│ │ │ │                                                  │ │ │ │
│ │ │ │ [恢复行程]               [永久删除]             │ │ │ │
│ │ │ │ Primary action           Secondary/Danger        │ │ │ │
│ │ │ └─────────────────────────────────────────────────┘ │ │ │
│ │ │                                                      │ │ │
│ │ │ Card styling:                                        │ │ │
│ │ │ - Background: colors.backgroundSecondary             │ │ │
│ │ │ - Border: 1px dashed colors.border                  │ │ │
│ │ │ - Opacity: 0.7                                       │ │ │
│ │ │ - No shadow                                          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Tab 卡片特点对比：

| 特性 | 进行中 | 已完成 | 已取消 |
|------|--------|--------|--------|
| **背景色** | colors.white | colors.backgroundSecondary | colors.backgroundSecondary |
| **边框** | 2px solid | 1px solid | 1px dashed |
| **透明度** | 1.0 | 0.8 | 0.7 |
| **阴影** | Large | None | None |
| **图标** | 🚀 | ✅ | ❌ |
| **主操作** | 继续准备 | 查看详情 | 恢复行程 |
| **次操作** | Quick Fix | 恢复行程(可选) | 永久删除 |

---

### 3.6 紧急提醒（到达日期临近）

当出发日期 < 7天时，卡片顶部添加紧急横幅：

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PREPARATION CARD with URGENT BANNER                     │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ╔═══════════════════════════════════════════════════╗│ │ │
│ │ │ ║ ⚠️  紧急：5天后到达！请尽快完成准备              ║│ │ │
│ │ │ ║ Background: colors.warning                        ║│ │ │
│ │ │ ║ Text: 14px, bold, white                           ║│ │ │
│ │ │ ║ Height: 36px, no border-radius at top            ║│ │ │
│ │ │ ╚═══════════════════════════════════════════════════╝│ │ │
│ │ │                                                      │ │ │
│ │ │ 🇹🇭 泰国入境准备                                     │ │ │
│ │ │ ████████████████░░░░ 85%                            │ │ │
│ │ │ ... rest of card ...                                │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 紧急状态判定：

```javascript
const daysUntilArrival = calculateDaysUntil(preparation.arrivalDate);

if (daysUntilArrival <= 7 && preparation.completionPercent < 100) {
  showUrgentBanner = true;
  bannerMessage = `⚠️ 紧急：${daysUntilArrival}天后到达！请尽快完成准备`;
} else if (daysUntilArrival <= 3 && preparation.completionPercent < 100) {
  showUrgentBanner = true;
  bannerMessage = `🚨 非常紧急：${daysUntilArrival}天后到达！`;
  bannerColor = colors.error; // Red instead of warning orange
}
```

---

## 4. 组件规格

### 4.1 TripCard 组件（Tab-aware）

**Component:** `app/components/TripCard.js`

#### Props:
```javascript
<TripCard
  trip={{
    id: "trip_thailand_20251215",
    destination: { id: "thailand", name: "Thailand", flagEmoji: "🇹🇭" },
    status: "active",  // active | completed | cancelled
    completionPercent: 85,
    departureDate: "2025-12-15",
    missingFields: ["travel.arrivalTime"],
    lastEditedAt: "2025-10-28T12:30:00Z",
    lifecycle: {
      departureDate: "2025-12-15",
      cancelledAt: null,
      completedAt: null,
      cancelReason: null,
      autoCompletedReason: null,
    },
    tdacSubmission: {
      arrCardNo: "TH2025XXXXXX",
      submittedAt: "2025-10-25T10:00:00Z",
    }
  }}
  variant="active"          // active | completed | cancelled
  onContinue={handleContinue}
  onQuickFix={handleQuickFix}
  onCancel={handleCancel}
  onRestore={handleRestore}
  onDelete={handleDelete}
  showContextMenu={true}
/>
```

#### Variants:

**1. Active (进行中 Tab)**
```javascript
{
  borderColor: colors.primary,
  borderWidth: 2,
  borderStyle: 'solid',
  backgroundColor: colors.white,
  elevation: 4,
  opacity: 1.0,
  showProgressBar: true,
  showActions: true,
  actions: ['quickFix', 'continue'],
  contextMenuItems: ['edit', 'cancel', 'share', 'details'],
}
```

**2. Completed (已完成 Tab)**
```javascript
{
  borderColor: colors.border,
  borderWidth: 1,
  borderStyle: 'solid',
  backgroundColor: colors.backgroundSecondary,
  elevation: 0,
  opacity: 0.8,
  showProgressBar: false,
  showActions: true,
  actions: ['viewDetails', 'restore?'],
  statusIcon: '✅',
  showCardNumber: true,
  showAutoCompletionReason: true,
}
```

**3. Cancelled (已取消 Tab)**
```javascript
{
  borderColor: colors.border,
  borderWidth: 1,
  borderStyle: 'dashed',
  backgroundColor: colors.backgroundSecondary,
  elevation: 0,
  opacity: 0.7,
  showProgressBar: false,
  showActions: true,
  actions: ['restore', 'delete'],
  statusIcon: '❌',
  showCancelReason: true,
  showCancelledAt: true,
}
```

### 4.2 TabBar 组件

**Component:** `app/components/TripTabBar.js`

```javascript
<TripTabBar
  tabs={[
    { key: 'active', label: '进行中', count: 3 },
    { key: 'completed', label: '已完成', count: 2 },
    { key: 'cancelled', label: '已取消', count: 1 },
  ]}
  activeTab="active"
  onTabChange={(tabKey) => setActiveTab(tabKey)}
  style={styles.tabBar}
/>
```

#### Styling (based on existing pattern):
```javascript
const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
```

---

### 4.3 ProgressBar 组件（嵌入在卡片中）

**Component:** `app/components/ProgressBar.js`

#### Props:
```javascript
<ProgressBar
  percent={85}
  height={8}
  showLabel={true}
  labelPosition="right"  // left | right | top | bottom
  animated={true}
/>
```

#### 颜色映射：
```javascript
const getProgressColor = (percent) => {
  if (percent < 50) return colors.warning; // Orange
  if (percent < 80) return colors.info;    // Yellow
  if (percent < 100) return '#4CAF50';     // Light green
  return colors.success;                    // Dark green
};
```

---

### 4.4 DestinationSelector (新目的地选择)

**Component:** `app/components/DestinationSelector.js`

点击 [+ 准备新的目的地] 后弹出的界面：

```
┌─────────────────────────────────────────────────────────────┐
│ MODAL or NEW SCREEN                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [✕ Close]           选择目的地                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔍 搜索目的地...                                         │ │
│ │ Search input, 48px height                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 热门目的地                                               │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 🇹🇭 泰国                        需要 TDAC    [选择]│ │ │
│ │ │ 东南亚 • 落地签/免签                                │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 🇯🇵 日本                        需要入境卡   [选择]│ │ │
│ │ │ 东亚 • 需要签证/免签                                │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 🇰🇷 韩国                        需要 K-ETA   [选择]│ │ │
│ │ │ 东亚 • 需要电子签证                                 │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │ [查看全部 120+ 个目的地 →]                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

点击 [选择] 后：
1. 创建新的 Preparation 记录
2. 导航到目的地介绍页
3. 然后进入 ThailandEntryFlowScreen（或相应目的地的 Hub）

---

## 5. 交互说明

### 5.1 导航流程

```
HomeScreen
    ↓ 点击 [+ 准备新的目的地]
DestinationSelector (Modal/Screen)
    ↓ 选择"泰国"
ThailandIntroScreen (介绍页 - 可选)
    ↓ 点击 [开始准备]
ThailandEntryFlowScreen (Hub)


HomeScreen
    ↓ 点击进行中卡片的 [继续准备]
ThailandEntryFlowScreen (Hub)
    resumeMode: true


HomeScreen
    ↓ 点击进行中卡片的 [Quick Fix]
QuickFixModal (叠加层)
    ↓ 修复完成
HomeScreen (刷新数据)
```

### 5.2 手势交互

**PreparationCard 支持的手势：**

1. **Tap（点击）** → 导航到 Hub
2. **Long Press（长按）** → 显示上下文菜单
   ```
   ┌──────────────────────┐
   │ • 编辑信息           │
   │ • 删除草稿           │
   │ • 分享给旅伴         │
   │ • 复制到...          │
   └──────────────────────┘
   ```
3. **Swipe Left（左滑）** → 显示快捷操作
   ```
   [卡片主体]  [📝 编辑] [🗑️ 删除]
   ```

### 5.3 下拉刷新

**Pull to Refresh:**
```
用户在首页顶部下拉
    ↓
显示刷新指示器
    ↓
重新加载所有 Preparations
    ↓
更新卡片数据（进度、最后编辑时间等）
    ↓
显示 Toast: "✅ 已更新"
```

---

## 6. 实现注意事项

### 6.1 数据模型

**Trip Model (更新后的数据结构)**

```javascript
// Trip object structure with lifecycle management
const Trip = {
  id: "trip_thailand_20251215",
  userId: "user_123",

  // Destination info
  destination: {
    id: "thailand",
    name: "Thailand",
    flagEmoji: "🇹🇭",
    requiresTDAC: true,
  },

  // Trip status and lifecycle
  status: "active",  // active | completed | cancelled | archived
  lifecycle: {
    departureDate: "2025-12-15",      // ISO date string
    arrivalDate: null,                 // Optional
    cancelledAt: null,                 // ISO timestamp when cancelled
    completedAt: null,                 // ISO timestamp when auto-completed
    cancelReason: null,                // User-provided reason
    autoCompletedReason: null,         // e.g., "Submission + departure date passed"
    canRestore: true,                  // Whether trip can be restored
  },

  // Preparation progress
  completionPercent: 85,
  missingFields: ["travel.arrivalTime"],
  entryInfo: { /* user's filled data */ },

  // Submission info (if completed)
  tdacSubmission: {
    arrCardNo: "TH2025XXXXXX",
    submittedAt: "2025-10-25T10:00:00Z",
    pdfFilePath: "/path/to/saved.pdf",
    qrImagePath: "/path/to/qr.png",
  },

  // Metadata
  createdAt: "2025-10-20T08:00:00Z",
  lastEditedAt: "2025-10-28T12:30:00Z",
};
```

**TripService.js (新增)**

```javascript
class TripService {
  /**
   * 获取用户所有行程，按 tab 分类
   */
  static async getAllTrips(userId) {
    const trips = await storage.getAllTrips(userId);

    // Auto-complete trips if needed
    await this.autoCompleteTripsIfNeeded(trips);

    return {
      active: trips.filter(t => t.status === 'active').sort(this.sortByDepartureDate),
      completed: trips.filter(t => t.status === 'completed').sort(this.sortByCompletedAt),
      cancelled: trips.filter(t => t.status === 'cancelled').sort(this.sortByCancelledAt),
    };
  }

  /**
   * 创建新的行程
   */
  static async createTrip(userId, destinationId) {
    const trip = {
      id: `trip_${destinationId}_${Date.now()}`,
      userId,
      destination: await DestinationService.getDestination(destinationId),
      status: 'active',
      completionPercent: 0,
      entryInfo: {},
      lifecycle: {
        departureDate: null,
        cancelledAt: null,
        completedAt: null,
        cancelReason: null,
        autoCompletedReason: null,
        canRestore: true,
      },
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
    };

    await storage.saveTrip(trip);
    return trip;
  }

  /**
   * 更新行程
   */
  static async updateTrip(tripId, updates) {
    const trip = await storage.getTrip(tripId);

    Object.assign(trip, updates, {
      lastEditedAt: new Date().toISOString(),
    });

    // 重新计算完成度
    if (updates.entryInfo) {
      const completion = EntryCompletionCalculator.getCompletionSummary(trip.entryInfo);
      trip.completionPercent = completion.totalPercent;
      trip.missingFields = completion.missingFields;
    }

    await storage.saveTrip(trip);
    return trip;
  }

  /**
   * 取消行程
   */
  static async cancelTrip(tripId, reason = null) {
    const trip = await storage.getTrip(tripId);

    trip.status = 'cancelled';
    trip.lifecycle.cancelledAt = new Date().toISOString();
    trip.lifecycle.cancelReason = reason;
    trip.lifecycle.canRestore = true;

    await storage.saveTrip(trip);
    return trip;
  }

  /**
   * 恢复行程
   */
  static async restoreTrip(tripId) {
    const trip = await storage.getTrip(tripId);

    if (!trip.lifecycle.canRestore) {
      throw new Error('Trip cannot be restored');
    }

    trip.status = 'active';
    trip.lifecycle.cancelledAt = null;
    trip.lifecycle.completedAt = null;
    trip.lifecycle.cancelReason = null;
    trip.lifecycle.autoCompletedReason = null;

    await storage.saveTrip(trip);
    return trip;
  }

  /**
   * 永久删除行程
   */
  static async deleteTrip(tripId) {
    await storage.deleteTrip(tripId);
  }

  /**
   * 自动完成符合条件的行程
   */
  static async autoCompleteTripsIfNeeded(trips) {
    const now = new Date();

    for (const trip of trips) {
      if (trip.status !== 'active') continue;

      // Check if should auto-complete
      const hasSubmission = trip.tdacSubmission?.submittedAt;
      const departurePassed = trip.lifecycle.departureDate &&
        new Date(trip.lifecycle.departureDate) < now;

      if (hasSubmission && departurePassed) {
        trip.status = 'completed';
        trip.lifecycle.completedAt = new Date().toISOString();
        trip.lifecycle.autoCompletedReason = 'Submission completed and departure date passed';
        await storage.saveTrip(trip);
      }
    }
  }

  /**
   * Sort functions
   */
  static sortByDepartureDate(a, b) {
    if (!a.lifecycle.departureDate) return 1;
    if (!b.lifecycle.departureDate) return -1;
    return new Date(a.lifecycle.departureDate) - new Date(b.lifecycle.departureDate);
  }

  static sortByCompletedAt(a, b) {
    return new Date(b.lifecycle.completedAt) - new Date(a.lifecycle.completedAt);
  }

  static sortByCancelledAt(a, b) {
    return new Date(b.lifecycle.cancelledAt) - new Date(a.lifecycle.cancelledAt);
  }
}
```

### 6.2 状态管理

**建议使用 Context + Reducer:**

```javascript
// TripContext.js
const TripContext = createContext();

const tripReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TRIPS':
      return {
        ...state,
        active: action.payload.active,
        completed: action.payload.completed,
        cancelled: action.payload.cancelled,
      };
    case 'UPDATE_TRIP':
      const updatedTrip = action.payload;
      const targetList = updatedTrip.status === 'active' ? 'active' :
                        updatedTrip.status === 'completed' ? 'completed' : 'cancelled';
      return {
        ...state,
        [targetList]: state[targetList].map(t =>
          t.id === updatedTrip.id ? updatedTrip : t
        ),
      };
    case 'CANCEL_TRIP':
      return {
        ...state,
        active: state.active.filter(t => t.id !== action.payload.id),
        cancelled: [...state.cancelled, action.payload],
      };
    case 'RESTORE_TRIP':
      return {
        ...state,
        cancelled: state.cancelled.filter(t => t.id !== action.payload.id),
        completed: state.completed.filter(t => t.id !== action.payload.id),
        active: [...state.active, action.payload],
      };
    case 'DELETE_TRIP':
      return {
        ...state,
        cancelled: state.cancelled.filter(t => t.id !== action.payload),
      };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    default:
      return state;
  }
};

export const TripProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tripReducer, {
    active: [],
    completed: [],
    cancelled: [],
    activeTab: 'active',
    loading: false,
  });

  const loadTrips = async (userId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const trips = await TripService.getAllTrips(userId);
    dispatch({ type: 'SET_TRIPS', payload: trips });
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const cancelTrip = async (tripId, reason) => {
    const trip = await TripService.cancelTrip(tripId, reason);
    dispatch({ type: 'CANCEL_TRIP', payload: trip });
  };

  const restoreTrip = async (tripId) => {
    const trip = await TripService.restoreTrip(tripId);
    dispatch({ type: 'RESTORE_TRIP', payload: trip });
  };

  return (
    <TripContext.Provider value={{ state, dispatch, loadTrips, cancelTrip, restoreTrip }}>
      {children}
    </TripContext.Provider>
  );
};
```

### 6.3 性能优化

**Tab-based 卡片列表优化：**

```javascript
import { FlatList, View } from 'react-native';
import { TripTabBar } from '../components/TripTabBar';
import { TripCard } from '../components/TripCard';

const HomeScreen = () => {
  const { state, loadTrips, cancelTrip, restoreTrip } = useTripContext();
  const [activeTab, setActiveTab] = useState('active');

  // Get data for active tab
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'active': return state.active;
      case 'completed': return state.completed;
      case 'cancelled': return state.cancelled;
      default: return [];
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <TripTabBar
        tabs={[
          { key: 'active', label: '进行中', count: state.active.length },
          { key: 'completed', label: '已完成', count: state.completed.length },
          { key: 'cancelled', label: '已取消', count: state.cancelled.length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Trip List */}
      <FlatList
        data={getCurrentTabData()}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            variant={activeTab}
            onContinue={() => handleContinue(item)}
            onQuickFix={() => handleQuickFix(item)}
            onCancel={(reason) => cancelTrip(item.id, reason)}
            onRestore={() => restoreTrip(item.id)}
            onDelete={() => handleDelete(item.id)}
            showContextMenu={activeTab === 'active'}
          />
        )}
        keyExtractor={item => item.id}
        // 性能优化
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={3}
        windowSize={5}
        // 下拉刷新
        refreshControl={
          <RefreshControl
            refreshing={state.loading}
            onRefresh={() => loadTrips(userId)}
          />
        }
        // 空状态
        ListEmptyComponent={<EmptyState tabName={activeTab} />}
        // 间距
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};
```

### 6.4 文件结构

```
app/
├── screens/
│   ├── HomeScreen.js                    [NEW - 首页，带 Tab 切换]
│   ├── DestinationSelectorScreen.js     [NEW - 目的地选择]
│   ├── thailand/
│   │   ├── ThailandIntroScreen.js       [NEW - 泰国介绍]
│   │   └── ThailandEntryFlowScreen.js   [EXISTING - Hub]
├── components/
│   ├── TripCard.js                      [NEW - 行程卡片，支持3种状态]
│   ├── TripTabBar.js                    [NEW - Tab 切换组件]
│   ├── ProgressBar.js                   [NEW - 进度条]
│   ├── EmptyState.js                    [NEW - 空状态]
│   └── ContextMenu.js                   [NEW - 上下文菜单]
├── services/
│   ├── TripService.js                   [NEW - 行程服务，含生命周期管理]
│   ├── DestinationService.js            [NEW - 目的地服务]
│   └── TripCompletionChecker.js         [NEW - 自动完成检测]
├── contexts/
│   └── TripContext.js                   [NEW - 行程上下文，管理3个tab状态]
└── models/
    └── Trip.js                          [NEW - 行程模型，含lifecycle]
```

---

## 7. 响应式设计

### 7.1 移动端 (< 768px)

- 卡片全宽显示
- 目的地卡片 2 列布局
- 按钮全宽

### 7.2 平板 (768px - 1024px)

- 卡片最大宽度 600px，居中
- 目的地卡片 3 列布局
- 按钮最大宽度 400px

### 7.3 桌面 (> 1024px)

- 卡片最大宽度 800px，居中
- 目的地卡片 4 列布局
- 侧边栏导航（可选）

---

## 8. 可访问性

### 8.1 语义化标签

```javascript
<View
  accessible={true}
  accessibilityLabel="泰国入境准备卡片"
  accessibilityRole="button"
  accessibilityHint="点击继续准备泰国入境"
  accessibilityState={{ disabled: false, selected: false }}
>
```

### 8.2 焦点顺序

1. Header → 通知 → 个人中心
2. 进行中任务卡片（按顺序）
3. [+ 准备新目的地] 按钮
4. 已完成区域（如果展开）

### 8.3 屏幕阅读器支持

**卡片内容朗读顺序：**
```
"泰国入境准备，完成度85%，还缺旅行到达时间，
到达日期12月15日，距离14天，最后编辑2小时前，
继续准备按钮，快速修复按钮"
```

---

## 9. 下一步

### 9.1 立即行动

1. **Review 这个 wireframe** - 确认方向是否正确
2. **确定数据模型** - Preparation 对象的完整结构
3. **开始实现基础组件** - PreparationCard, ProgressBar

### 9.2 需要讨论的问题

- [x] 使用 Tab 切换设计替代折叠/展开设计
- [x] 行程按出发日期排序（进行中）
- [x] 支持多个并发行程准备
- [x] 取消行程功能，带恢复能力
- [x] 自动完成逻辑（提交 + 日期过期）
- [ ] TripCard 的变体是否足够？还需要其他状态吗？
- [ ] Quick Fix 按钮的显示逻辑：只有1-2个缺失字段时显示？
- [ ] 已完成/已取消是否需要分页？（如果用户有很多）
- [ ] 是否需要额外的筛选/排序功能？
- [ ] 多目的地数量是否有限制？

### 9.3 待设计页面

基于这个首页 wireframe，还需要设计：
1. ✅ 首页 (HomeScreen) - 本文档
2. ⏳ 目的地选择器 (DestinationSelector)
3. ⏳ 目的地介绍页 (ThailandIntroScreen)
4. ⏳ Hub 页面改进 (ThailandEntryFlowScreen)

---

**首页 Wireframe 完成！准备好实现了吗？** 🎨✨

有任何需要调整的地方，请告诉我！
