# Progressive Entry Info Flow – Design

## 1. Overview

The Progressive Entry Info Flow introduces a staged experience that lets travelers capture, review, and finalize immigration data across multiple sessions without losing context. The flow centers around Thailand travelers (first destination adopting the pattern) but establishes reusable patterns for other destinations. This design explains how we:

- Persist partially completed entry information and surface progress indicators.
- Present a preparation dashboard (ThailandEntryFlowScreen) with actionable completion status.
- Manage TDAC submission timing, document packaging, notifications, and archival workflows.
- Maintain destination-specific progress and entry pack lifecycle across the app.

## 2. Goals and Success Metrics

- **Enable progressive completion**: Users can leave any screen and return without losing edits (Requirements 1, 8, 12, 13).
- **Provide actionable status**: Readable completion, warnings, and deadlines on the preparation screen (Requirements 2, 3, 5, 12).
- **Strengthen submission workflow**: Countdowns, resubmission alerts, and entry pack management keep TDAC valid (Requirements 3, 10, 11, 13, 16).
- **Scale to multiple destinations**: Track progress independently per trip (Requirement 15).
- **Improve re-engagement**: Timely notifications drive task completion (Requirement 9). Success metric: ≥60% of users respond to reminders within 12h.
- **Reduce support incidents**: Lower tickets about lost data or missed TDAC window by ≥30% within one release cycle.

## 3. Scope and Non-Goals

**In scope**
- Thailand entry preparation screens (TravelInfo, EntryFlow, TDAC submission surfaces).
- Local persistence updates (AsyncStorage / SecureStorage hybrids) and PassportDataService enhancements.
- Countdown calculations, superseded submission handling, entry pack creation and archival logic.
- Notification scheduling, destination home screen cards, progressive navigation controls.

**Out of scope**
- Server-side changes to TDAC API, PDF generation, or notification infrastructure (assumed existing endpoints/services).
- Redesign of other destination flows beyond aligning with shared abstractions.
- Major refactors of profile/fund management (covered by separate specs).

## 4. Personas and Primary Journeys

1. **Prepared Planner**: Sets trip months in advance, fills details gradually, expects reminders as submission window nears.
2. **Reactive Traveler**: Starts close to departure, needs immediate visibility into missing fields and countdowns.
3. **Frequent Traveler**: Manages multiple destinations concurrently; must switch contexts without data loss.

Primary journeys derived from requirements:
- Save partial data → view preparation dashboard → return later to complete.
- Receive reminders → reopen app → finalize and submit TDAC.
- Edit after submission → acknowledge resubmission warning → resubmit.
- Post-trip → automatic archival to history with ability to review read-only pack.

## 5. System Context

| Component | Role | Notes |
|-----------|------|-------|
| `ThailandTravelInfoScreen` | Data entry surface for travel portion; launches preparation dashboard. | Replaces disabled submit CTA with “查看准备状态”. |
| `ThailandEntryFlowScreen` | Central dashboard showing completion, countdowns, TDAC actions, and entry pack. | Consumes aggregated status service. |
| `PassportDataService` | Persists entry info data and TDAC submission metadata. | Gains partial-save awareness and snapshot APIs. |
| `EntryPackService` (new module) | Orchestrates entry pack lifecycle, superseded states, archival. | Wraps persistence adapters and notification scheduler. |
| `NotificationScheduler` | Schedules local reminders for incomplete data, submission windows, and archival events. | Uses platform local notifications. |
| `CountdownCalculator` (extension of `ArrivalWindowCalculator`) | Computes 72h/24h messages, submission availability. | Shareable across destinations. |
| `HomeScreen` modules | Surfacing upcoming trips and history cards. | Consumes entry pack snapshot summaries. |

## 6. Requirements-to-Design Mapping

| Requirement | Design Responses |
|-------------|-----------------|
| Req 1, 8 | Auto-save on navigation, undo-safe store updates, non-blocking validation on TravelInfo → EntryFlow transitions. |
| Req 2 | Dashboard cards with completion states computed per data category; total completion displayed using aggregated metrics. |
| Req 3 | Countdown service calculates messages and triggers UI states; ties into notification scheduling. |
| Req 4/5 (from requirements doc) | Dashboard includes TDAC submission controls, superseded messaging, and entry pack states. |
| Req 9 | Local notification scheduler listens to state changes and reprograms reminders. |
| Req 10 & 11 | EntryPackService composes PDFs, QR codes, metadata, surfaces to dashboard and home screen. |
| Req 12 | Destination selection funnel routes to EntryFlow with proper messaging for incomplete data. |
| Req 13 | Resubmission guard with confirmation dialog and state transitions. |
| Req 14 & 16 | Automatic archival job moves completed/expired packs to history, optionally triggered by notifications. |
| Req 15 | Progress tracked per destination; data store keyed by destination & trip identifiers. |
| Req 17 | History filtering & search logic implemented within Home/History module using entry pack snapshots. |

## 7. Data Model and Persistence

### 7.1 Core Entities

- **EntryInfoRecord** (existing, extended):
  - `id`, `destinationId`, `tripId`, `passport`, `personalInfo`, `funds`, `travel`, `lastUpdatedAt`.
  - Add `completionMetrics` (cached counts per category) and `status` (`incomplete`, `ready`, `submitted`, `superseded`, `expired`, `archived`).
- **EntryPack** (new or extended):
  - `entryInfoId`, `tdacSubmission` (arrCardNo, qrUri, pdfPath, submittedAt, submissionMethod).
  - `submissionHistory` array tracking all TDAC attempts with timestamps and status.
  - `documents` array for attachments.
  - `displayStatus` map for UI: `completionPercent`, `categoryStates[]`, `countdownMessage`, `ctaState`.
- **EntryPackSnapshot** (Requirements 11-15, 19-28):
  - `snapshotId`, `entryPackId`, `userId`, `destinationId`, `status`, `createdAt`, `arrivalDate`.
  - Complete data copies: `passport`, `personalInfo`, `funds`, `travel`.
  - `tdacSubmission` (most recent successful submission or null).
  - `completenessIndicator` showing which sections were filled.
  - `version` number for audit trail.
  - `metadata`: app version, device info, creation method (auto/manual).
  - `photoManifest` array of copied photo paths in snapshot storage.

Persist via `PassportDataService` updates and `EntryPackService` orchestrations. Use AsyncStorage-backed persistence with SecureStorage for sensitive fields (passport, funds). Snapshots stored read-only in separate namespace `snapshots/`.

### 7.1.1 Snapshot Lifecycle Management

**Creation Triggers:**
1. User marks entry pack as completed in InteractiveImmigrationGuide
2. Automatic archival when `now > arrivalDate + 24h` and status is `in_progress`
3. User manually cancels entry pack
4. User explicitly archives from swipe action

**Snapshot Creation Process:**
```ts
async function createSnapshot(entryPackId: string, reason: 'completed' | 'expired' | 'cancelled'): Promise<Snapshot> {
  // 1. Load current entry pack data
  const entryPack = await EntryPackService.load(entryPackId);
  
  // 2. Copy fund item photos to snapshot storage
  const photoManifest = await copyPhotosToSnapshotStorage(entryPack.funds, snapshotId);
  
  // 3. Create immutable snapshot record
  const snapshot = {
    snapshotId: generateId(),
    entryPackId,
    userId: entryPack.userId,
    destinationId: entryPack.destinationId,
    status: reason,
    createdAt: new Date().toISOString(),
    arrivalDate: entryPack.travel.arrivalDate,
    version: 1,
    metadata: {
      appVersion: getAppVersion(),
      deviceInfo: getDeviceInfo(),
      creationMethod: reason === 'completed' ? 'manual' : 'auto'
    },
    // Deep copy all data
    passport: { ...entryPack.passport },
    personalInfo: { ...entryPack.personalInfo },
    funds: entryPack.funds.map(f => ({ ...f })),
    travel: { ...entryPack.travel },
    tdacSubmission: entryPack.submissionHistory.find(s => s.status === 'success') || null,
    completenessIndicator: calculateCompleteness(entryPack),
    photoManifest
  };
  
  // 4. Store in read-only namespace
  await SecureStorageService.setItem(`snapshots/${snapshot.snapshotId}`, JSON.stringify(snapshot));
  
  // 5. Create audit log entry
  await AuditLog.record('snapshot_created', { snapshotId: snapshot.snapshotId, reason });
  
  return snapshot;
}
```

**Immutability Guarantees:**
- Snapshots stored in separate storage namespace (`snapshots/`) from active data
- All read operations return deep clones to prevent accidental mutations
- UI displays read-only banner: "这是历史记录的快照，无法修改"
- Edit controls disabled when viewing snapshot data
- API layer rejects any write operations to snapshot namespace

**Version Control and Audit Trail (Requirement 28):**

Each snapshot has comprehensive audit trail:

```ts
interface SnapshotAuditLog {
  snapshotId: string;
  version: number;  // v1, v2, etc.
  events: AuditEvent[];
}

interface AuditEvent {
  timestamp: string;
  eventType: 'created' | 'viewed' | 'status_changed' | 'deleted' | 'exported';
  metadata: {
    appVersion?: string;
    deviceInfo?: string;
    creationMethod?: 'auto' | 'manual';
    viewCount?: number;
    statusFrom?: string;
    statusTo?: string;
    exportFormat?: string;
  };
}
```

**Audit Log Storage:**
- Stored separately from snapshot data in `audit_logs/` namespace
- Immutable: events can only be appended, never modified or deleted
- Indexed by snapshotId for fast lookup

**Tracked Events:**
1. **Creation**: timestamp, app version, device info, creation method
2. **View**: each time snapshot opened, increment view count
3. **Status Change**: transitions between completed/cancelled/expired
4. **Export**: when user exports snapshot data
5. **Deletion**: final event before snapshot removed

**Developer Debug Mode:**
- Hidden menu in Profile settings (tap version number 7 times)
- "View Audit Trails" option appears
- Shows complete audit log for all snapshots
- Useful for troubleshooting and support

```tsx
function DebugAuditTrailView({ snapshotId }: Props) {
  const auditLog = useAuditLog(snapshotId);
  
  return (
    <ScrollView>
      <Text>Snapshot ID: {snapshotId}</Text>
      <Text>Version: v{auditLog.version}</Text>
      <Text>Total Views: {auditLog.events.filter(e => e.eventType === 'viewed').length}</Text>
      
      <Text style={styles.header}>Event Timeline:</Text>
      {auditLog.events.map((event, i) => (
        <View key={i} style={styles.event}>
          <Text>{formatTimestamp(event.timestamp)}</Text>
          <Text>{event.eventType}</Text>
          <Text>{JSON.stringify(event.metadata, null, 2)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

### 7.2 Photo and File Management Strategy

**Active Data Storage:**
- Fund proof photos stored in `FileSystem.documentDirectory + 'funds/'`
- Naming convention: `fund_{fundItemId}_{timestamp}.jpg`
- Photos persist across app restarts and entry pack lifecycle changes

**Snapshot Photo Management:**
- On snapshot creation, copy all fund photos to `FileSystem.documentDirectory + 'snapshots/{snapshotId}/'`
- Snapshot photo naming: `snapshot_{snapshotId}_{fundItemId}_{timestamp}.jpg`
- Photo manifest stored in snapshot record for reference integrity
- If original photo deleted, snapshot retains copy for historical accuracy

**Storage Quota Management:**
```ts
interface StorageQuota {
  activeData: number;  // Current entry pack photos
  snapshots: number;   // Historical snapshot photos
  total: number;       // Combined usage
  limit: number;       // Platform-specific limit
}

async function checkStorageQuota(): Promise<StorageQuota> {
  const activeSize = await calculateDirectorySize('funds/');
  const snapshotSize = await calculateDirectorySize('snapshots/');
  return {
    activeData: activeSize,
    snapshots: snapshotSize,
    total: activeSize + snapshotSize,
    limit: await getAvailableStorage()
  };
}
```

**Low Storage Handling:**
- When storage > 80% of limit, show warning in Profile settings
- Suggest deleting old snapshots: "历史记录占用空间较大，建议删除 X 个月前的记录"
- Provide storage usage breakdown: "历史记录占用: X MB"
- Auto-cleanup policy (configurable): delete snapshots older than retention period

**Snapshot Deletion:**
- User-initiated deletion shows confirmation: "删除后无法恢复，确定删除吗？"
- Deletion removes snapshot record AND all associated photos
- Audit log records deletion event with timestamp

### 7.3 Partial Save Strategy

- Use `debouncedSave(delay=300ms)` triggered on field change within entry screens.
- On navigation actions (Next/Back, card tap, notifications), call `flushPendingSave()` to guarantee persistence before route transition.
- Persist `dirtySections` metadata to highlight incomplete categories on return.

### 7.4 Completion Calculations

Create `EntryCompletionCalculator` utility:

```ts
type CategoryState = 'complete' | 'partial' | 'missing';

function computeCategoryState(fields: FieldResult[]): CategoryState {
  const completed = fields.filter(f => f.isValid).length;
  if (completed === fields.length) return 'complete';
  if (completed === 0) return 'missing';
  return 'partial';
}
```

- Each category defines its required fields meta (passport, personal, funds, travel).
- Utility returns `categoryStates` with `completedCount` and `totalCount`.
- `totalCompletionPercent` = sum(completed) / sum(total) × 100 (rounded to nearest whole percent).
- Cache results in `EntryInfoRecord.completionMetrics` to avoid recomputation on each render; recompute when dependent data changes.

## 8. Internationalization (i18n) Design

### 8.1 Translation Key Structure

All progressive entry flow strings organized under `progressiveEntryFlow` namespace in translation files (`app/i18n/translations/countries.{locale}.json`):

```json
{
  "progressiveEntryFlow": {
    "status": {
      "completed": "已完成",
      "cancelled": "已取消",
      "expired": "已过期",
      "inProgress": "进行中",
      "needsResubmission": "需要重新提交"
    },
    "snapshot": {
      "readOnlyBanner": "这是历史记录的快照，无法修改",
      "viewTitle": "历史记录 - 只读",
      "legacyBadge": "这是旧版本的历史记录",
      "incompleteNotice": "此入境包未完成提交",
      "completenessIndicator": "护照 {{passport}}, 个人信息 {{personal}}, 资金 {{funds}}, 旅行信息 {{travel}}"
    },
    "history": {
      "title": "历史记录",
      "filterOptions": {
        "all": "全部",
        "completed": "已完成",
        "cancelled": "已取消",
        "expired": "已过期"
      },
      "timeGroups": {
        "today": "今天",
        "yesterday": "昨天",
        "thisWeek": "本周",
        "thisMonth": "本月",
        "earlier": "更早"
      },
      "resultCount": "显示 {{count}} 个结果",
      "deleteConfirm": "删除后无法恢复，确定删除吗？",
      "storageUsage": "历史记录占用: {{size}} MB"
    },
    "notifications": {
      "autoArchived": "您的 {{destination}} 入境包已自动归档",
      "reminderTitle": "完成入境信息",
      "reminderBody": "您的 {{destination}} 旅程还有未完成的信息",
      "submissionWindow": "可以提交泰国入境卡了",
      "urgentReminder": "距离截止还有 {{hours}} 小时"
    },
    "entryFlow": {
      "viewStatus": "查看准备状态",
      "submitTDAC": "自动提交 TDAC",
      "resubmitTDAC": "重新提交入境卡",
      "continueEditing": "返回继续填写",
      "startGuide": "开始入境指引",
      "manualCopy": "手动抄写",
      "webviewFill": "WebView 自动填表",
      "incompleteMessage": "这个旅程还未完成，请继续填写信息",
      "resubmissionWarning": "修改信息后需要重新提交入境卡，确认要修改吗？",
      "completionPercent": "已完成 {{percent}}%"
    },
    "countdown": {
      "noDate": "未设置泰国入境日期，无法提交入境卡",
      "preWindow": "还有 {{days}} 天 {{hours}}:{{minutes}} 可以提交入境卡",
      "withinWindow": "距离截止还有 {{hours}}:{{minutes}}，请尽快提交",
      "urgent": "距离截止还有 {{hours}} 小时 {{minutes}} 分钟"
    },
    "categories": {
      "passport": "护照信息",
      "personal": "个人信息",
      "funds": "资金证明",
      "travel": "旅行信息",
      "fieldsComplete": "{{filled}}/{{total}} 字段已完成"
    }
  }
}
```

### 8.2 Localized Date and Time Formatting

Use `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` for locale-aware formatting:

```ts
function formatDate(date: Date, locale: string): string {
  const formats = {
    'zh-CN': { year: 'numeric', month: 'long', day: 'numeric' }, // 2024年10月20日
    'en': { year: 'numeric', month: 'short', day: 'numeric' },   // Oct 20, 2024
    'es': { day: 'numeric', month: 'numeric', year: 'numeric' }  // 20/10/2024
  };
  return new Intl.DateTimeFormat(locale, formats[locale]).format(date);
}

function formatRelativeTime(date: Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffDays = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return rtf.format(diffDays, 'day'); // "2 days ago" / "2天前" / "hace 2 días"
}
```

### 8.3 Multi-Language Notification Content

Notifications use user's preferred language from app settings:

```ts
async function scheduleLocalizedNotification(type: string, data: any) {
  const locale = await getUserPreferredLocale();
  const translations = await loadTranslations(locale);
  
  const notification = {
    title: translations.progressiveEntryFlow.notifications[`${type}Title`],
    body: interpolate(translations.progressiveEntryFlow.notifications[`${type}Body`], data),
    data: { deepLink: `entryFlow/${data.destinationId}` }
  };
  
  await Notifications.scheduleNotificationAsync({ content: notification, trigger: data.trigger });
}
```

### 8.4 Translation File Organization

- Add `progressiveEntryFlow` namespace to existing files: `countries.zh.json`, `countries.en.json`, `countries.es.json`, etc.
- Group related translations: `status`, `snapshot`, `history`, `notifications`, `entryFlow`, `countdown`, `categories`
- Include translator comments for context:
  ```json
  {
    "_comment_status_completed": "Status shown when user successfully completes immigration",
    "status": { "completed": "已完成" }
  }
  ```
- Maintain alphabetical key ordering within each namespace
- Validation script ensures all locales have matching key structure

### 8.5 Fallback Strategy

- Default to English if translation missing for user's locale
- Log missing translation keys for future addition
- Use key name as fallback display if English also missing (development mode only)

## 9. Navigation and UX Flows

### 9.1 Travel Info → Entry Flow

1. User taps `"查看准备状态"` from `ThailandTravelInfoScreen`.
2. `handleViewStatus` triggers `FlushSaveCommand`.
3. Navigation kicks to `ThailandEntryFlowScreen` without blocking validations.
4. `EntryFlowScreen` queries `EntryPackService.getSummary(destinationId, tripId)` for current metrics & countdown.
5. Returning to Travel Info via card tap rehydrates form from persisted store with expansion anchored to tapped section.

### 9.2 Entry Flow Dashboard States

- **Header**: shows `totalCompletionPercent`, textual message (complete/incomplete), and `countdownMessage`.
- **Category Cards**: icon state (✓, ⚠, ❌), field counts, CTA arrow.
- **Primary CTA**:
  - `"提交入境卡"` when `categoryStates` all complete and TDAC not yet submitted.
  - `"查看准备状态"` when incomplete (mirrors TravelInfo screen for consistency).
  - `"重新提交入境卡"` when status `superseded`.
- **Secondary CTA**: `"开始入境指引"` visible only when valid TDAC submission available.
- **Superseded banner**: When user edits post-submission, show message and disable QR/PDF until resubmission.

### 9.3 Destination Selection Funnel

- After selecting Thailand, user flows: `ThailandInfoScreen` (requirements) → `ThailandRequirementsScreen` → `ThailandEntryFlowScreen`.
- Entry flow initial state:
  - Incomplete message `"这个旅程还未完成，请继续填写信息"`.
  - Highlights first incomplete category.
  - `"继续填写"` CTA launches TravelInfo screen with relevant section expanded.

## 10. Immigration Officer Presentation Mode

### 10.1 Overview

The Immigration Officer View provides a dedicated full-screen presentation mode optimized for showing entry documents to immigration officers. This addresses Requirements 30-37 for bilingual display, quick access, offline support, and security.

### 10.2 Access and Entry Points

- Accessible from InteractiveImmigrationGuide via "Show to Officer" button
- Also available from entry pack detail view when TDAC successfully submitted
- Requires biometric authentication (Face ID/Touch ID) or PIN before displaying
- Deep link support for quick access: `app://immigration-view/{entryPackId}`

### 10.3 UI Layout and Content Sections

**Full-screen layout with sections:**

1. **QR Code Section** (top, prominent)
   - Large QR code display (300x300px minimum)
   - TDAC confirmation number (arrCardNo) in 24pt font
   - Submission date/time
   - "Show PDF" button for fallback if scanning fails

2. **Passport Section**
   - Passport photo (if available)
   - Full name in English (uppercase)
   - Passport number
   - Nationality (3-letter code + full name)
   - Date of birth (YYYY-MM-DD format)
   - Passport expiry date
   - Gender

3. **Travel Section**
   - Arrival flight number and date/time
   - Departure flight number and date/time
   - Accommodation type and name
   - Accommodation address and phone
   - Purpose of visit
   - Duration of stay (calculated days)

4. **Funds Section**
   - Total funds by currency (e.g., "THB 50,000 + USD 1,000")
   - List of fund items with type, amount, thumbnail photo
   - "Tap to enlarge" hint for photos
   - Photo gallery modal for detailed view

5. **Contact Section**
   - Phone number in Thailand (with country code)
   - Email address
   - Emergency contact (if provided)
   - Thai address (accommodation address)

**Visual Design:**
- High-contrast color scheme: black text on white background
- Minimum font sizes: 16pt body, 20pt headers, 24pt key info
- Visual separators (cards or lines) between sections
- Icons next to section headers for quick identification
- Clean, professional layout optimized for arm's length reading

### 10.4 Bilingual Display (Thailand)

For Thailand destination, display field labels in both Thai and English:

```
ชื่อเต็ม / Full Name: ZHANG, WEI
หมายเลขหนังสือเดินทาง / Passport Number: E12345678
สัญชาติ / Nationality: CHN (China)
วันเกิด / Date of Birth: 1988-01-22 (22 มกราคม 1988)
```

**Language Toggle:**
- Header button: "TH/EN" or "EN/TH"
- Three modes: "Bilingual" (default), "Thai Only", "English Only"
- Smooth animation on language switch
- Remember preference per destination for future sessions

### 10.5 Quick Access Actions

**Bottom action bar with buttons:**
- "Show QR" - Jump to QR code section
- "Show Passport" - Jump to passport section
- "Show Funds" - Jump to funds section
- "Show Hotel" - Jump to accommodation details
- "Show Return Ticket" - Jump to departure flight info

**Gesture Navigation:**
- Swipe left/right to move between sections
- Floating "Back to QR" button visible while scrolling
- Pinch-to-zoom support for photos and QR code

### 10.6 Offline Support

- All data loaded from local storage (no network required)
- Pre-cache QR code image, PDF document, fund photos on entry pack creation
- Display subtle "Offline Mode" indicator when no network
- Identical functionality in offline and online modes
- Translations pre-cached for presentation mode

### 10.7 Security and Privacy

**Authentication:**
- Biometric auth (Face ID/Touch ID) or PIN required before display
- Auto-lock after 2 minutes of inactivity
- Manual "Lock Screen" button in header

**Information Protection:**
- Blur sensitive info (passport number, phone) until user taps "Show Full Details"
- Prevent screenshots (platform permitting via `UIScreen.isCaptured` / FLAG_SECURE)
- Audit log records each access with timestamp
- No data transmitted over network during presentation

**Screen Management:**
- Keep screen awake while view active (prevent auto-lock)
- "Boost Brightness" toggle for outdoor/bright conditions
- "Large Text Mode" toggle (150% font size increase)

### 10.8 Destination-Specific Language Mapping

```ts
const destinationLanguages = {
  thailand: { primary: 'th', secondary: 'en', display: 'bilingual' },
  japan: { primary: 'ja', secondary: 'en', display: 'bilingual' },
  singapore: { primary: 'en', secondary: null, display: 'single' },
  malaysia: { primary: 'en', secondary: 'ms', display: 'bilingual' },
  taiwan: { primary: 'zh-TW', secondary: 'en', display: 'bilingual' },
  hongkong: { primary: 'zh-HK', secondary: 'en', display: 'bilingual' }
};
```

Automatically select appropriate language configuration based on destination.

### 10.9 Accessibility

- VoiceOver/TalkBack support for screen readers
- High-contrast mode option
- Adjustable text sizes
- Clear visual hierarchy with adequate spacing
- Touch targets minimum 44x44pt

### 10.10 Exit and Navigation

- Prominent "Exit Presentation Mode" button in header
- Swipe down gesture to exit (iOS pattern)
- Back button returns to previous screen
- Confirmation if exiting during active presentation

### 10.11 Translation Quality

- Use official immigration terminology for each destination
- Formal language appropriate for official documents
- Consistency with government forms
- Include disclaimer: "This is a traveler-prepared document. Please verify with official systems."

## 11. Countdown and Window Logic

Extend `ArrivalWindowCalculator` with `getSubmissionWindow(arrivalDate)` returning:

```ts
{
  state: 'no-date' | 'pre-window' | 'within-window' | 'urgent' | 'past-deadline',
  message: string,
  timeRemaining: Duration | null,
  submissionOpensAt: Date | null
}
```

- **No date**: message `"未设置泰国入境日期，无法提交入境卡"`.
- **Pre-window (>72h)**: message `"还有 X 天 HH:MM 可以提交入境卡"`.
- **Within window (72h-24h)**: message `"距离截止还有 HH:MM，请尽快提交"`.
- **Urgent (<24h)**: message shows hours/minutes, uses red accent.
- **Past deadline**: message indicates expiration, EntryPack flagged for urgent resubmission.

Countdown updates every minute while screen active; background updates rely on Timer service (already used in other countdown contexts).

## 12. TDAC Submission and Resubmission Flow

- Submission triggered by CTA; gather validated data and call TDAC API.
- On success:
  - Store PDF path & QR image path (generate/receive from API).
  - Update `EntryPack.status = 'submitted'`, `EntryInfo.status = 'ready'`.
  - Enable `"开始入境指引"` and home screen card.
- On failure:
  - Keep `EntryPack.status = 'ready'` (not submitted).
  - Show error toast and log analytic event.
- Post-submission edits:
  - Editing any field triggers confirmation dialog (Requirement 13).
  - On confirm, mark `EntryPack.status = 'superseded'`, hide QR/PDF, update CTA to `"重新提交入境卡"`.

## 13. Notification Strategy (Requirement 9)

- Use `NotificationScheduler.scheduleEntryPrepReminders(entryInfoId, arrivalDate, completionPercent, status)`.
- Reminders:
  - Incomplete info + arrival date set: schedule daily at 9 AM local until completion or window opens.
  - Window open (72h) with completion = 100% but not submitted: schedule notifications at 72h/48h/24h/12h/6h.
  - Include deep links to `ThailandEntryFlowScreen` with optional highlight of `"自动提交 TDAC"` button.
- Cancel notifications when:
  - TDAC submitted successfully.
  - Arrival date removed.
  - Entry pack archived.
- Cloudflare verification reminder: notification includes instructions and ensures app opens to submission flow (Requirement 9.6).
- Respect profile settings toggle to disable reminders (`NotificationPreferences.entryPrep`).

## 14. Entry Pack Lifecycle

### 14.1 Creation (Requirement 10)

- On successful TDAC submission, call `EntryPackService.createOrUpdatePack()`:
  - Persist `tdacSubmission`, store documents, set `displayStatus`.
  - Emit event `ENTRY_PACK_UPDATED` for UI refresh.

### 14.2 Home Screen Display (Requirement 11)

- `HomeScreen` subscribes to `EntryPackRepository.watchUpcoming(userId)`.
- Card data includes flag asset (from `locales.js` mapping), arrival date, QR thumbnail, status label.
- Sorting by arrival date ascending; move to history on `arrivalDate + 1 day`.

### 14.3 Reuse Historical Data for New Entry Packs (Requirement 22)

**Feature:** Allow users to create new entry packs based on previous trips to save time.

**UI Flow:**
1. When viewing a historical snapshot, display button: "基于此记录创建新入境包"
2. On tap, show confirmation dialog explaining what will be copied
3. Copy passport, personal info, and fund items to new entry pack
4. Exclude travel information (dates, flights, accommodation)
5. Navigate to TravelInfoScreen with prompt: "请更新您的旅行信息（航班、日期、酒店）"
6. New entry pack marked as `in_progress` and appears on Home screen

**Implementation:**
```ts
async function createEntryPackFromSnapshot(snapshotId: string): Promise<EntryPack> {
  const snapshot = await SnapshotService.load(snapshotId);
  
  const newEntryPack = {
    id: generateId(),
    userId: snapshot.userId,
    destinationId: snapshot.destinationId,
    tripId: generateTripId(),
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    sourceSnapshotId: snapshotId, // Audit trail reference
    
    // Copy from snapshot
    passport: { ...snapshot.passport },
    personalInfo: { ...snapshot.personalInfo },
    funds: snapshot.funds.map(f => ({ ...f })),
    
    // Reset travel info
    travel: {
      travelPurpose: null,
      arrivalDate: null,
      departureDate: null,
      flightNumber: null,
      accommodation: null
    },
    
    completionMetrics: calculateInitialMetrics()
  };
  
  await EntryPackService.save(newEntryPack);
  return newEntryPack;
}
```

**Audit Trail:**
- Maintain `sourceSnapshotId` reference in new entry pack
- Log event: `entry_pack.created_from_snapshot` with both IDs
- Display subtle indicator in UI: "基于 [日期] 的旅程创建"

### 14.4 Archival and History (Requirements 14, 16, 17)

- Automatic archival job runs on:
  - App foreground event.
  - Local scheduled notification triggers.
- Logic:
  1. If `now > arrivalDate + 1 day`: mark `EntryPack.status = 'archived'`.
  2. Create snapshot with complete data.
  3. Move record from `upcoming` list to `history`.
  4. Send optional notification `"您的 [目的地] 入境包已自动归档"`.
- Manual archival: swipe action triggers `EntryPackService.archive(entryPackId, reason='user')`.
- History filter/search:
  - In-memory index keyed by `destination`, `status`, `arrivalDate`.
  - Filter states `"全部"`, `"已完成"`, `"已取消"`, `"已过期"` mapped to status sets.
  - Search box matches destination name substring or date string; show result count.
- Archived packs read-only: disable edit CTAs, show documents only.

## 15. Multi-Destination Support (Requirement 15)

- Data keyed by `tripId` + `destinationId`. `PassportDataService` loads contexts separately.
- `EntryPackService` ensures operations scoped to selected destination; watchers return aggregated list for home screen.
- UI surfaces (home, notifications) include destination context to avoid confusion.
- `CompletionCalculator` accepts destination-specific field schemas to allow customizing requirements.

## 16. Data Privacy and User Control

### 16.1 Data Export

**Export Functionality:**
- Profile settings include "历史记录管理" section
- "导出历史记录" generates JSON file with all snapshots
- Optional encryption and password protection
- "下载我的数据" creates ZIP file with snapshots, photos, and metadata

```ts
async function exportUserData(userId: string, options: ExportOptions): Promise<string> {
  const snapshots = await SnapshotService.getAllSnapshots(userId);
  const photos = await collectSnapshotPhotos(snapshots);
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    userId,
    snapshots,
    photoManifest: photos.map(p => ({ id: p.id, path: p.path, size: p.size }))
  };
  
  let output = JSON.stringify(exportData, null, 2);
  
  if (options.encrypt) {
    output = await encryptData(output, options.password);
  }
  
  if (options.includePhotos) {
    return await createZipArchive(output, photos);
  }
  
  return output;
}
```

### 16.2 Snapshot Retention Policy

**Configurable Retention:**
- Default: retain indefinitely
- Options: 30 days, 90 days, 1 year, never delete
- Setting stored in user preferences
- Background job checks retention policy daily

**Manual Deletion:**
- Swipe-to-delete on history items
- Confirmation dialog: "删除后无法恢复，确定删除吗？"
- Bulk delete option: "永久删除所有历史记录" with password confirmation
- Deletion removes snapshot record AND all associated photos

### 16.3 Storage Usage Display

Profile settings show:
- "历史记录占用: X MB"
- Breakdown by active data vs snapshots
- Oldest snapshot date
- Recommendation to delete if storage > 80% capacity

### 16.4 Legacy Data Migration (Requirement 22)

**Challenge:** Existing users may have historical entry packs created before snapshot feature deployment.

**Strategy:**
- Do NOT attempt to create snapshots for existing historical data
- Distinguish legacy records from new records in UI
- Gracefully handle mixed history (legacy + snapshot-based)

**Implementation:**
```ts
interface HistoryItem {
  id: string;
  type: 'legacy' | 'snapshot';
  displayData: any;
  isReadOnly: boolean;
}

function renderHistoryItem(item: HistoryItem) {
  if (item.type === 'legacy') {
    return (
      <HistoryCard>
        <LegacyBadge>这是旧版本的历史记录</LegacyBadge>
        {/* Display available data */}
        {/* No "基于此记录创建新入境包" button */}
      </HistoryCard>
    );
  } else {
    return (
      <HistoryCard>
        {/* Full snapshot features */}
        <Button>基于此记录创建新入境包</Button>
      </HistoryCard>
    );
  }
}
```

**Migration Timeline:**
- Phase 1: Deploy snapshot feature for new entry packs only
- Phase 2: Monitor adoption and storage usage
- Phase 3: Optional: Offer one-time migration tool for users to convert legacy records (if requested)

### 16.5 Notification Preferences (Requirements 23, 27)

**Settings UI in Profile:**

```
通知设置
├─ 入境准备提醒
│  ├─ 立即通知 (default)
│  ├─ 每日摘要
│  └─ 关闭通知
├─ 72小时提交窗口提醒
│  ├─ 开启 (default)
│  └─ 关闭
├─ 自动归档通知
│  ├─ 立即通知 (default)
│  ├─ 每日摘要
│  └─ 关闭通知
└─ 入境完成提醒
   ├─ 开启 (default)
   └─ 关闭
```

**Daily Digest Implementation:**
- When "每日摘要" selected, batch notifications
- Send single notification at 9 AM local time
- Content: "您有 X 个待办事项：[list]"
- Include deep links to each relevant entry pack

**Do Not Disturb Respect:**
- Check device DND status before sending
- Queue notifications if DND active
- Deliver when DND ends or next scheduled time

**In-App Badges:**
- Even when notifications disabled, show badges in app
- Home screen badge count for pending actions
- History tab badge for new archived items

### 16.6 GPS-Based Automatic Completion (Requirement 20 - Future Enhancement)

**Note:** This is a future enhancement, not included in initial release.

**Design Considerations:**
- Request location permissions with clear explanation: "用于自动确认您已抵达目的地"
- Geofencing around destination airports (5km radius)
- Trigger prompt when user enters geofence: "检测到您已抵达 [目的地]，是否标记入境包为已完成？"
- Store location metadata with snapshot for audit
- Settings toggle to disable: "自动检测到达"
- Schedule automatic archival 24 hours after GPS-detected arrival

**Privacy Considerations:**
- Location data never transmitted to servers
- Used only for local geofence detection
- Deleted after archival complete
- Opt-in feature with clear privacy explanation

### 16.7 Cloud Sync Preparation (Requirement 21)

**Current Implementation:**
- All photos stored locally in device file system
- Snapshot photos copied to dedicated directory
- No cloud sync in initial release

**Future-Ready Architecture:**
```ts
interface PhotoStorageAdapter {
  savePhoto(photo: Photo): Promise<string>;  // Returns local URI
  loadPhoto(uri: string): Promise<Photo>;
  syncToCloud?(uri: string): Promise<CloudURI>;  // Future
  downloadFromCloud?(cloudUri: CloudURI): Promise<string>;  // Future
}

// Current: LocalPhotoStorage
// Future: CloudPhotoStorage (paid version)
```

**Preparation Steps:**
- Use abstraction layer for photo storage
- Store both local and cloud URIs in data model (cloud URI null for now)
- Design sync queue for future implementation
- Plan for conflict resolution (local vs cloud versions)

### 16.8 Privacy Controls

- Toggle for automatic archival notifications
- Option to disable GPS-based arrival detection (future)
- Control over what data included in exports
- Audit log access for security-conscious users (developer mode)

## 17. Error Handling and Edge Cases

- **Network loss during save**: Auto-save uses local persistence; network required only for TDAC submission/PDF download. Show offline banner if submission attempted offline.
- **Countdown drift**: Use device time; on resume, recalc using fresh `Date.now()`. If user changes arrival date to past time, mark as urgent/past-deadline and prompt for update.
- **Missing documents**: If PDF/QR fetch fails, store error state and allow retry; keep pack in `submitted` but mark `documentsMissing` to prompt manual download.
- **Notification permission revoked**: Record flag in user settings; show inline reminder on dashboard to re-enable for timely alerts.
- **Concurrent edits**: Debounce updates; if manual archival occurs while editing, lock forms and show toast `"此旅程已归档，无法继续编辑"` with navigation back.

## 18. Analytics and Logging

- Events:
  - `entry_flow.viewed` (screen + completion percent).
  - `entry_flow.category_tapped` (category, completion state).
  - `entry_flow.submit_attempt` / `submit_success` / `submit_failure` (with error code).
  - `entry_flow.superseded_warning_shown` / `confirmed`.
  - `entry_pack.archived_auto` / `archived_manual`.
  - `notification.entry_prep_opened`.
- Error logs include TDAC submission failures, storage write errors, countdown calculation anomalies.
- Dashboard displays subtle progress indicator near CTA (Requirement 8.5); log impressions for usage tracking.

## 19. Testing Strategy

- **Unit tests**
  - `EntryCompletionCalculator` states per category.
  - Countdown message formatting for each window state.
  - Entry pack status transitions (submitted → superseded → resubmitted).
  - Notification scheduling (mock scheduler ensures correct cadence).
  - Snapshot creation verifies data integrity.
- **Integration tests**
  - `ThailandTravelInfoScreen.integration.test.js`: navigation persists data, warnings non-blocking.
  - `ThailandEntryFlowScreen.integration.test.js`: displays correct icons and CTAs for various data states.
  - `PassportDataService` tests: ensure partial save and snapshot operations maintain data.
  - Home screen tests: upcoming vs history sorting, filtering, search results count.
- **Manual QA scenarios**
  - End-to-end TDAC submission with resubmission after edit.
  - Arrival date adjustments affecting countdown & notifications.
  - Offline automatic archival triggered after device time change.

## 20. Rollout Plan

- Feature flag `progressiveEntryFlow.thailand` gating dashboard entry and new CTAs.
- Beta with internal testers and select user cohort (20%) for two weeks; monitor crash-free rate and submission completion metrics.
- Gradual ramp to 100% once acceptance metrics met.
- Provide fallback: if flag disabled, revert to legacy flow with blocking validation.

## 21. Open Questions

1. Do we have a centralized place to store PDF/QR assets cross-platform, or should we duplicate per platform path conventions?
2. Should arrival date countdown use server time sync for accuracy near deadlines?
3. How do we reconcile notifications if user deletes trip or destination from profile?
4. Are there legal/privacy considerations for long-term snapshot retention beyond 12 months?

## 22. Dependencies and Risks

- Dependence on stable TDAC submission API and PDF asset availability.
- Accurate local notification scheduling required; platform differences (iOS vs Android) must be verified.
- Large snapshots could impact storage; need pruning policy (e.g., keep last 10 snapshots per user).
- Manual archival interactions need careful UX to avoid accidental loss of active packs.

## 23. Appendix

- **Iconography**: use existing icon set for ✓, ⚠, ❌; ensure accessibility contrast.
- **Localization notes**: Strings provided in requirements are baseline Chinese copy; additional locales needed for app languages.
- **Performance considerations**: Batch writes to storage, throttle re-render of dashboard on heavy fund data sets.
