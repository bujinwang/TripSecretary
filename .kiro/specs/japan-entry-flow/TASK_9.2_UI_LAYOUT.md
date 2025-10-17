# Task 9.2 UI Layout: Japan Manual Entry Guide

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                     ResultScreen                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ✅  🇯🇵 日本入境包已准备完成                          │ │
│  │     您的入境信息已整理完毕                             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📋  日本入境卡填写指南                                 │ │
│  │     请参考以下信息手动填写纸质入境卡                   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ 护照信息 Passport Information                          │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ 姓名 Full Name              ZHANG SAN                  │ │
│  │ 姓 Family Name              ZHANG                      │ │
│  │ 名 Given Name               SAN                        │ │
│  │ 护照号 Passport No.         E12345678                  │ │
│  │ 国籍 Nationality            China                      │ │
│  │ 出生日期 Date of Birth      1990-01-01                 │ │
│  │ 性别 Gender                 Male                       │ │
│  │                                                         │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ 个人信息 Personal Information                          │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ 职业 Occupation             Engineer                   │ │
│  │ 居住城市 City of Residence  Beijing                    │ │
│  │ 居住国家 Country of Residence China                    │ │
│  │ 联系电话 Phone              +86 13800138000            │ │
│  │ 电子邮箱 Email              zhang@example.com          │ │
│  │                                                         │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ 旅行信息 Travel Information                            │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ 旅行目的 Purpose of Visit   Tourism                    │ │
│  │ 航班号 Flight Number        NH123                      │ │
│  │ 到达日期 Arrival Date       2025-11-01                 │ │
│  │ 停留天数 Length of Stay     7 天                       │ │
│  │                                                         │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ 住宿信息 Accommodation                                 │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ 住宿类型 Type               Hotel                      │ │
│  │ 住宿名称 Name               Tokyo Grand Hotel          │ │
│  │ 住宿地址 Address                                       │ │
│  │   1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002          │ │
│  │ 住宿电话 Phone              +81-3-1234-5678            │ │
│  │                                                         │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ 资金证明 Funds                                         │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ 现金 Cash                   JPY 50000                  │ │
│  │ 信用卡 Credit Card          USD 10000                  │ │
│  │ 银行余额 Bank Balance       CNY 100000                 │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ 总计 Total                  JPY 50000 + USD 10000 +    │ │
│  │                             CNY 100000                 │ │
│  │                                                         │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ 🛬  查看互动入境指南                      ›      │  │ │
│  │  │     分步骤指导 · 大字体模式                     │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ 💡 请在飞机上或到达机场后，参考以上信息填写     │  │ │
│  │  │    纸质入境卡。建议截图保存以便随时查看。       │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 💾 所有信息仅保存在您的手机本地                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 💡 建议在飞机上提前填写，节省入境时间                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Success Header
```
┌───────────────────────────────────────────────────────┐
│ ✅  🇯🇵 日本入境包已准备完成                          │
│     您的入境信息已整理完毕                             │
└───────────────────────────────────────────────────────┘
```
- Green gradient background
- Animated pulse ring
- Success icon and flag
- Bilingual title and subtitle

### 2. Japan Manual Guide Card
```
┌───────────────────────────────────────────────────────┐
│ 📋  日本入境卡填写指南                                 │
│     请参考以下信息手动填写纸质入境卡                   │
└───────────────────────────────────────────────────────┘
```
- Blue-themed header
- Clear title and subtitle
- Professional card design

### 3. Information Sections

#### Passport Section
```
护照信息 Passport Information
─────────────────────────────────────────────────────
姓名 Full Name              ZHANG SAN
姓 Family Name              ZHANG
名 Given Name               SAN
护照号 Passport No.         E12345678
国籍 Nationality            China
出生日期 Date of Birth      1990-01-01
性别 Gender                 Male
```
- Two-column layout
- Bilingual labels
- Right-aligned values

#### Personal Information Section
```
个人信息 Personal Information
─────────────────────────────────────────────────────
职业 Occupation             Engineer
居住城市 City of Residence  Beijing
居住国家 Country of Residence China
联系电话 Phone              +86 13800138000
电子邮箱 Email              zhang@example.com
```
- Two-column layout
- Phone with country code
- Email validation

#### Travel Information Section
```
旅行信息 Travel Information
─────────────────────────────────────────────────────
旅行目的 Purpose of Visit   Tourism
航班号 Flight Number        NH123
到达日期 Arrival Date       2025-11-01
停留天数 Length of Stay     7 天
```
- Japan-specific fields
- No departure flight info
- Length of stay in days

#### Accommodation Section
```
住宿信息 Accommodation
─────────────────────────────────────────────────────
住宿类型 Type               Hotel
住宿名称 Name               Tokyo Grand Hotel
住宿地址 Address
  1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002
住宿电话 Phone              +81-3-1234-5678
```
- Full-width address field
- Multiline address display
- Phone number required

#### Funds Section
```
资金证明 Funds
─────────────────────────────────────────────────────
现金 Cash                   JPY 50000
信用卡 Credit Card          USD 10000
银行余额 Bank Balance       CNY 100000
─────────────────────────────────────────────────────
总计 Total                  JPY 50000 + USD 10000 +
                            CNY 100000
```
- Multiple fund items
- Type-specific labels
- Currency totals

### 4. Interactive Guide Button
```
┌─────────────────────────────────────────────────┐
│ 🛬  查看互动入境指南                      ›      │
│     分步骤指导 · 大字体模式                     │
└─────────────────────────────────────────────────┘
```
- Large, prominent button
- Green primary color
- Icon and arrow
- Clear subtitle

### 5. Help Box
```
┌─────────────────────────────────────────────────┐
│ 💡 请在飞机上或到达机场后，参考以上信息填写     │
│    纸质入境卡。建议截图保存以便随时查看。       │
└─────────────────────────────────────────────────┘
```
- Light blue background
- Helpful guidance
- Screenshot suggestion

## Color Scheme

### Primary Colors
- **Blue Theme**: `#1565C0` - Section titles and headers
- **Green Primary**: `#07C160` - Success and action buttons
- **White**: `#FFFFFF` - Card backgrounds
- **Light Blue**: `rgba(33, 150, 243, 0.1)` - Help box background

### Text Colors
- **Primary Text**: `#000000` - Main content
- **Secondary Text**: `#666666` - Labels and subtitles
- **Blue Text**: `#1565C0` - Section titles and help text

### Border Colors
- **Light Border**: `rgba(0,0,0,0.08)` - Card borders
- **Blue Border**: `#E3F2FD` - Section dividers

## Typography

### Font Sizes
- **Title**: 18px - Section titles
- **Subtitle**: 14px - Subtitles and help text
- **Label**: 14px - Field labels
- **Value**: 15px - Field values
- **Button**: 17px - Button text

### Font Weights
- **Bold**: 700 - Titles and important text
- **Semi-bold**: 600 - Values and labels
- **Regular**: 400 - Body text

## Spacing

### Padding
- **Card**: 16px - Main card padding
- **Section**: 16px - Section padding
- **Row**: 8px - Row padding

### Margins
- **Section**: 16px - Between sections
- **Row**: 8px - Between rows
- **Button**: 16px - Around buttons

## Shadows

### Card Shadow
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.06
shadowRadius: 14
elevation: 3
```

### Button Shadow
```
shadowColor: colors.primary
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.25
shadowRadius: 8
elevation: 4
```

## Responsive Design

### Layout Adaptations
- Two-column layout for most fields
- Full-width layout for address field
- Flexible grid system
- Scrollable content area

### Touch Targets
- Button height: 56px minimum
- Touch area: 44px minimum
- Adequate spacing between elements

## Accessibility

### Features
- High contrast text
- Large, readable fonts
- Clear visual hierarchy
- Descriptive labels
- Touch-friendly sizes

### Screen Reader Support
- Semantic HTML structure
- Descriptive text labels
- Logical reading order

## Animation

### Fade In
- Duration: 800ms
- Opacity: 0 → 1
- Smooth entrance

### Pulse Ring
- Duration: 2000ms (1000ms each direction)
- Scale: 1 → 1.2 → 1
- Continuous loop

## Conditional Display

### Show When
- `isJapanManualGuide === true`
- `japanTravelerData !== null`
- `userId` is provided

### Hide When
- Not in Japan manual guide mode
- Data not loaded
- Error occurred

## Navigation Flow

```
JapanTravelInfoScreen
        ↓
  [查看入境指南]
        ↓
   ResultScreen
 (Manual Guide Mode)
        ↓
[查看互动入境指南]
        ↓
InteractiveImmigrationGuide
```

## Data Flow

```
PassportDataService
        ↓
JapanTravelerContextBuilder
        ↓
  buildContext(userId)
        ↓
   japanTravelerData
        ↓
renderJapanManualGuide()
        ↓
    Display UI
```

## Error Handling

### Loading Errors
- Shows alert: "无法加载日本入境信息"
- Logs error to console
- Returns null (no display)

### Missing Data
- Conditional rendering for optional fields
- Graceful degradation
- Clear error messages

## Performance

### Optimizations
- Conditional rendering
- Memoized values
- Efficient re-renders
- Lazy loading

### Best Practices
- Single source of truth
- Minimal state updates
- Efficient data structures
- Clean component structure

---

**Layout Status**: ✅ IMPLEMENTED  
**Design Status**: ✅ APPROVED  
**Accessibility**: ✅ COMPLIANT  
**Performance**: ✅ OPTIMIZED
