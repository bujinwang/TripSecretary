# Task 9: Japan Manual Entry Guide UI Layout

## Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│  ← ResultScreen                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ✅  🇯🇵 日本入境包已准备完成                      │ │
│  │      您的入境信息已整理完毕                        │ │
│  │      ━━━ ● ● ● ━━━                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  📋  日本入境卡填写指南                            │ │
│  │      请参考以下信息手动填写纸质入境卡              │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │  护照信息 Passport Information                     │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  姓名 Full Name              ZHANG SAN            │ │
│  │  姓 Family Name              ZHANG                │ │
│  │  名 Given Name               SAN                  │ │
│  │  护照号 Passport No.         E12345678            │ │
│  │  国籍 Nationality            CHN                  │ │
│  │  出生日期 Date of Birth      1990-01-01           │ │
│  │  性别 Gender                 Male                 │ │
│  │                                                     │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │  个人信息 Personal Information                     │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  职业 Occupation             Engineer             │ │
│  │  居住城市 City               Beijing              │ │
│  │  居住国家 Country            China                │ │
│  │  联系电话 Phone              +86 13800138000      │ │
│  │  电子邮箱 Email              zhang@example.com    │ │
│  │                                                     │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │  旅行信息 Travel Information                       │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  旅行目的 Purpose            Tourism              │ │
│  │  航班号 Flight Number        NH920                │ │
│  │  到达日期 Arrival Date       2025-11-01           │ │
│  │  停留天数 Length of Stay     7 天                 │ │
│  │                                                     │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │  住宿信息 Accommodation                            │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  住宿类型 Type               Hotel                │ │
│  │  住宿名称 Name               Tokyo Grand Hotel    │ │
│  │  住宿地址 Address                                 │ │
│  │  1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002       │ │
│  │  住宿电话 Phone              +81-3-1234-5678      │ │
│  │                                                     │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │  资金证明 Funds                                    │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  现金 Cash                   JPY 50000            │ │
│  │  信用卡 Credit Card          USD 5000             │ │
│  │  银行余额 Bank Balance       CNY 30000            │ │
│  │  ─────────────────────────────────────────────   │ │
│  │  总计 Total                  JPY 50000 +          │ │
│  │                              USD 5000 +           │ │
│  │                              CNY 30000            │ │
│  │                                                     │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  🛬  查看互动入境指南                    ›   │ │ │
│  │  │      分步骤指导 · 大字体模式                 │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  💡  请在飞机上或到达机场后，参考以上信息   │ │ │
│  │  │      填写纸质入境卡。建议截图保存以便随时   │ │ │
│  │  │      查看。                                   │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
ResultScreen
├── ScrollView
│   ├── SuccessCard (✅ 日本入境包已准备完成)
│   │   └── Animation (pulse ring, fade in)
│   │
│   └── JapanManualGuideCard (📋 日本入境卡填写指南)
│       ├── Header
│       │   ├── Icon (📋)
│       │   ├── Title (日本入境卡填写指南)
│       │   └── Subtitle (请参考以下信息手动填写纸质入境卡)
│       │
│       ├── PassportInfoSection
│       │   ├── SectionTitle (护照信息 Passport Information)
│       │   └── InfoGrid
│       │       ├── InfoRow (Full Name)
│       │       ├── InfoRow (Family Name)
│       │       ├── InfoRow (Given Name)
│       │       ├── InfoRow (Passport No.)
│       │       ├── InfoRow (Nationality)
│       │       ├── InfoRow (Date of Birth)
│       │       └── InfoRow (Gender) [optional]
│       │
│       ├── PersonalInfoSection
│       │   ├── SectionTitle (个人信息 Personal Information)
│       │   └── InfoGrid
│       │       ├── InfoRow (Occupation)
│       │       ├── InfoRow (City of Residence)
│       │       ├── InfoRow (Country of Residence)
│       │       ├── InfoRow (Phone)
│       │       └── InfoRow (Email)
│       │
│       ├── TravelInfoSection
│       │   ├── SectionTitle (旅行信息 Travel Information)
│       │   └── InfoGrid
│       │       ├── InfoRow (Purpose of Visit)
│       │       ├── InfoRow (Flight Number)
│       │       ├── InfoRow (Arrival Date)
│       │       └── InfoRow (Length of Stay)
│       │
│       ├── AccommodationSection
│       │   ├── SectionTitle (住宿信息 Accommodation)
│       │   └── InfoGrid
│       │       ├── InfoRow (Type)
│       │       ├── InfoRow (Name)
│       │       ├── InfoRow (Address) [multi-line]
│       │       └── InfoRow (Phone)
│       │
│       ├── FundsSection [conditional]
│       │   ├── SectionTitle (资金证明 Funds)
│       │   └── InfoGrid
│       │       ├── InfoRow (Fund Item 1)
│       │       ├── InfoRow (Fund Item 2)
│       │       ├── InfoRow (Fund Item N)
│       │       └── InfoRow (Total) [highlighted]
│       │
│       ├── InteractiveGuideButton
│       │   ├── Icon (🛬)
│       │   ├── Title (查看互动入境指南)
│       │   ├── Subtitle (分步骤指导 · 大字体模式)
│       │   └── Arrow (›)
│       │
│       └── HelpBox
│           ├── Icon (💡)
│           └── Text (使用提示)
```

## Color Scheme

### Primary Colors
- **Blue Primary**: `#1565C0` - Section titles, headers
- **Blue Light**: `#F5F9FF` - Header background
- **Blue Border**: `#E3F2FD` - Section borders, underlines
- **Green Primary**: `#07C160` - Interactive guide button
- **White**: `#FFFFFF` - Card background

### Text Colors
- **Primary Text**: `colors.text` - Main content
- **Secondary Text**: `colors.textSecondary` - Labels
- **White Text**: `#FFFFFF` - Button text

### Accent Colors
- **Info Blue**: `rgba(33, 150, 243, 0.1)` - Help box background
- **Info Blue Border**: `rgba(33, 150, 243, 0.2)` - Help box border

## Typography

### Headers
- **Main Title**: 18px, Bold (700), #1565C0
- **Subtitle**: 14px, Regular, textSecondary
- **Section Title**: 16px, Bold (700), #1565C0

### Content
- **Label**: 14px, Regular, textSecondary
- **Value**: 15px, Semi-bold (600), text
- **Button Title**: 17px, Bold (700), white
- **Button Subtitle**: 13px, Regular, rgba(255,255,255,0.9)

### Help Text
- **Help Text**: 13px, Regular, #1565C0

## Spacing

### Margins
- **Card Horizontal**: `spacing.lg` (16px)
- **Card Vertical**: `spacing.md` (12px)
- **Section Padding**: `spacing.lg` (16px)

### Gaps
- **Info Grid**: `spacing.sm` (8px)
- **Row Padding**: `spacing.xs` (4px)

## Interactive Elements

### Button States
- **Default**: Green background, white text, shadow
- **Active**: 85% opacity
- **Pressed**: Scale animation

### Navigation
- **Target**: 'ImmigrationGuide' screen
- **Params**: passport, destination, travelInfo, japanTravelerData

## Conditional Display

### Show When
- `isJapan === true` (destination.id === 'jp' || 'japan')
- `context === 'manual_entry_guide'`
- `japanTravelerData !== null`

### Hide When
- Not Japan destination
- Not manual entry guide context
- Data not loaded

### Hidden Elements (when Japan manual guide active)
- Digital info card (TDAC/MDAC)
- Standard entry pack card
- History banner
- Action buttons row

## Accessibility

### Features
- Large, readable text (15-18px)
- High contrast colors
- Clear visual hierarchy
- Bilingual labels (Chinese/English)
- Touch-friendly button sizes (min 44px height)
- Scrollable content
- Screenshot-friendly layout

### Labels
- All fields have bilingual labels
- Clear section titles
- Descriptive button text
- Helpful usage tips

## Data Flow

```
JapanTravelInfoScreen
    ↓ (navigation.navigate)
    ↓ params: { userId, destination: 'japan', context: 'manual_entry_guide' }
    ↓
ResultScreen
    ↓ (useEffect)
    ↓ loadJapanTravelerData()
    ↓
JapanTravelerContextBuilder.buildContext(userId)
    ↓ (loads from PassportDataService)
    ↓ (validates and formats)
    ↓
japanTravelerData (state)
    ↓
renderJapanManualGuide()
    ↓
Japan Manual Entry Guide UI
    ↓ (user taps button)
    ↓
InteractiveImmigrationGuide Screen
```

## Error Handling

### Scenarios
1. **Data Loading Failure**: Alert with error message
2. **Missing Required Fields**: Validation errors in builder
3. **Navigation Failure**: Graceful fallback

### User Feedback
- Loading state during data fetch
- Error alerts with clear messages
- Validation feedback from builder

## Performance

### Optimizations
- Conditional rendering (only when needed)
- Memoized values where applicable
- Efficient data loading (single call)
- Lazy loading of builder service

### Memory
- Single data load per screen mount
- Cleanup on unmount
- No memory leaks from listeners

## Future Enhancements

### Planned
1. Print/Export functionality
2. QR code generation
3. Language toggle
4. Sample form images
5. Offline mode
6. Share functionality

### Localization
- Add full i18n support
- Japanese translation
- English translation
- Dynamic language switching
