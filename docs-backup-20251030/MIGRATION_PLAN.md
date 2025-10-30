# Migration Plan: Current → Tab-Based Multi-Trip Home Screen

**Date:** 2025-10-28
**Status:** Planning
**Version:** 1.0

---

## 📊 Current State Analysis

### What You Have Now (HomeScreen.js)

**Data Structure:**
```javascript
// Lines 71-73
const [activeEntryPacks, setActiveEntryPacks] = useState([]);      // Submitted DACs
const [inProgressDestinations, setInProgressDestinations] = useState([]);  // Drafts
```

**Data Loading:**
```javascript
// Line 266 - EntryInfoService.getHomeScreenData()
{
  submittedEntryPacks: [   // Has TDAC submission
    {
      id, destinationId, destinationName, status: 'submitted',
      arrivalDate, submittedAt, cardType
    }
  ],
  inProgressDestinations: [  // No submission, >0% complete
    {
      destinationId, destinationName,
      completionPercent, isReady
    }
  ]
}
```

**Current Display:**
- **No tabs** - just scrolling cards in order
- Shows submitted packs first (green left border)
- Shows in-progress destinations second (orange left border)
- No status differentiation beyond submitted/in-progress
- No cancellation support
- No auto-completion logic
- Data keyed by `entryInfoId` (submitted) or `destinationId` (in-progress)

**Current Issues:**
1. ❌ One EntryInfo per destination (can't have multiple Thailand trips)
2. ❌ No way to cancel a trip
3. ❌ No completed/archived trips view
4. ❌ No departure date sorting
5. ❌ No trip lifecycle management

---

## 🎯 Target State (From Wireframes v2.0)

### What We Want

**Data Structure:**
```javascript
{
  active: [
    {
      id: "trip_thailand_20251215",
      status: "active",
      destinationId: "th",
      lifecycle: {
        departureDate: "2025-12-15",
        cancelledAt: null,
        completedAt: null,
        cancelReason: null,
        autoCompletedReason: null
      },
      completionPercent: 85,
      tdacSubmission: { arrCardNo, submittedAt, ... }
    }
  ],
  completed: [ /* ... */ ],
  cancelled: [ /* ... */ ]
}
```

**Display:**
- ✅ 3 tabs: 进行中 / 已完成 / 已取消
- ✅ Trips sorted by departure date
- ✅ Multiple concurrent trips per destination
- ✅ Cancel/restore capability
- ✅ Auto-completion based on date + submission

---

## 🚀 Migration Phases

### Phase 1: Add Trip Lifecycle (No UI Changes)

**Goal:** Extend EntryInfo with lifecycle fields while keeping current UI

**Changes:**
1. **Update EntryInfo model** to include:
   ```javascript
   lifecycle: {
     departureDate: null,
     cancelledAt: null,
     completedAt: null,
     cancelReason: null,
     autoCompletedReason: null
   }
   ```

2. **Update EntryInfoService.getHomeScreenData()** to:
   - Populate `lifecycle.departureDate` from `entryInfo.travel.arrivalDate`
   - Add `status` field: `'active'`, `'completed'`, or `'cancelled'`
   - Keep returning same data structure (backward compatible)

3. **No UI changes** - HomeScreen.js continues to work as-is

**Files to modify:**
- `app/models/EntryInfo.js` - Add lifecycle fields
- `app/services/EntryInfoService.js:118-173` - Update getHomeScreenData()

**Testing:**
- Verify existing UI still works
- Verify lifecycle fields are saved/loaded correctly

**Estimated time:** 2-3 hours

---

### Phase 2: Add Status Filtering (Prepare for Tabs)

**Goal:** Separate data by status, but still display in single scroll

**Changes:**
1. **Update getHomeScreenData()** to return:
   ```javascript
   {
     active: [...],      // status === 'active'
     completed: [...],   // status === 'completed'
     cancelled: [...],   // status === 'cancelled'
     // Keep old structure for backward compatibility
     submittedEntryPacks: [...],
     inProgressDestinations: [...]
   }
   ```

2. **Update HomeScreen.js** to use new structure:
   ```javascript
   const [trips, setTrips] = useState({ active: [], completed: [], cancelled: [] });

   // Display all together for now
   const allTrips = [...trips.active, ...trips.completed, ...trips.cancelled];
   ```

3. **Still no tabs** - just preparing the data structure

**Files to modify:**
- `app/services/EntryInfoService.js:118-173` - Return categorized data
- `app/screens/HomeScreen.js:258-304` - Use categorized data

**Testing:**
- Verify data loads correctly
- Verify cards still display the same way

**Estimated time:** 1-2 hours

---

### Phase 3: Add Tab Navigation UI

**Goal:** Add 3-tab interface to switch between statuses

**Changes:**
1. **Create TripTabBar component** (based on TDACFilesScreen.js:244-271):
   ```javascript
   // app/components/TripTabBar.js
   <View style={styles.tabContainer}>
     <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.activeTab]}>
       <Text>进行中 ({activeTrips.length})</Text>
     </TouchableOpacity>
     {/* ... completed, cancelled tabs */}
   </View>
   ```

2. **Update HomeScreen.js** to show tabs:
   ```javascript
   const [activeTab, setActiveTab] = useState('active');

   // Filter based on active tab
   const displayTrips = trips[activeTab];
   ```

3. **Update card rendering** to show appropriate data per tab

**Files to create:**
- `app/components/TripTabBar.js` - New tab component

**Files to modify:**
- `app/screens/HomeScreen.js` - Add tabs above cards section

**Testing:**
- Verify tabs switch correctly
- Verify correct trips show in each tab
- Verify counts update correctly

**Estimated time:** 3-4 hours

---

### Phase 4: Add Departure Date Sorting

**Goal:** Sort active trips by departure date

**Changes:**
1. **Update EntryInfoService.getHomeScreenData()** to sort:
   ```javascript
   const activeTrips = allActiveTrips.sort((a, b) => {
     if (!a.lifecycle.departureDate) return 1;
     if (!b.lifecycle.departureDate) return -1;
     return new Date(a.lifecycle.departureDate) - new Date(b.lifecycle.departureDate);
   });
   ```

2. **Update UI** to show departure date prominently

**Files to modify:**
- `app/services/EntryInfoService.js:118-173` - Add sorting
- `app/screens/HomeScreen.js:506-631` - Update card display

**Testing:**
- Verify trips sort correctly by departure date
- Verify trips without dates appear last

**Estimated time:** 1-2 hours

---

### Phase 5: Add Cancel Trip Functionality

**Goal:** Allow users to cancel trips with reason

**Changes:**
1. **Add cancelTrip() to EntryInfoService**:
   ```javascript
   static async cancelTrip(entryInfoId, reason) {
     const entryInfo = await this.getEntryInfoById(entryInfoId);
     entryInfo.status = 'cancelled';
     entryInfo.lifecycle.cancelledAt = new Date().toISOString();
     entryInfo.lifecycle.cancelReason = reason;
     await entryInfo.save();
   }
   ```

2. **Add context menu (⋮) to trip cards**:
   - Long press or tap ⋮ icon
   - Show options: Cancel, Edit, Share, Details

3. **Add cancel confirmation dialog**

4. **Update HomeScreen** to reload data after cancel

**Files to modify:**
- `app/services/EntryInfoService.js` - Add cancelTrip()
- `app/screens/HomeScreen.js` - Add context menu
- `app/components/TripCard.js` (new) - Extract card to component

**Testing:**
- Verify cancel moves trip to cancelled tab
- Verify reason is saved
- Verify UI updates correctly

**Estimated time:** 4-5 hours

---

### Phase 6: Add Restore Trip Functionality

**Goal:** Allow restoring cancelled trips

**Changes:**
1. **Add restoreTrip() to EntryInfoService**:
   ```javascript
   static async restoreTrip(entryInfoId) {
     const entryInfo = await this.getEntryInfoById(entryInfoId);
     entryInfo.status = 'active';
     entryInfo.lifecycle.cancelledAt = null;
     entryInfo.lifecycle.cancelReason = null;
     await entryInfo.save();
   }
   ```

2. **Update cancelled tab cards** to show restore button

3. **Add permanent delete option** (optional)

**Files to modify:**
- `app/services/EntryInfoService.js` - Add restoreTrip()
- `app/screens/HomeScreen.js:553-631` - Update cancelled card display

**Testing:**
- Verify restore moves trip back to active
- Verify restored trips retain all data

**Estimated time:** 2-3 hours

---

### Phase 7: Add Auto-Completion Logic

**Goal:** Automatically complete trips after departure date passes

**Changes:**
1. **Add autoCompleteTripsIfNeeded()** to EntryInfoService:
   ```javascript
   static async autoCompleteTripsIfNeeded(userId) {
     const trips = await this.getAllEntryInfos(userId);
     const now = new Date();

     for (const trip of trips) {
       if (trip.status !== 'active') continue;

       const hasSubmission = trip.tdacSubmission?.submittedAt;
       const departurePassed = trip.lifecycle.departureDate &&
         new Date(trip.lifecycle.departureDate) < now;

       if (hasSubmission && departurePassed) {
         trip.status = 'completed';
         trip.lifecycle.completedAt = now.toISOString();
         trip.lifecycle.autoCompletedReason = 'Auto-completed: submission + date passed';
         await trip.save();
       }
     }
   }
   ```

2. **Call on app foreground** or in background task

3. **Show auto-completion reason** in completed tab

**Files to modify:**
- `app/services/EntryInfoService.js` - Add auto-completion
- `app/services/background/BackgroundJobService.js` - Schedule checks
- `app/screens/HomeScreen.js` - Call on mount/focus

**Testing:**
- Verify trips auto-complete after departure date
- Verify manual submissions aren't affected
- Verify reason displays correctly

**Estimated time:** 3-4 hours

---

### Phase 8: Support Multiple Trips Per Destination

**Goal:** Allow creating multiple Thailand trips (separate EntryInfos)

**Current limitation:** Lines 142-151 in EntryInfoService group by `destinationId`

**Changes:**
1. **Update data model** to treat each EntryInfo as a unique trip:
   - Change ID format from `entryInfo_th` to `trip_th_20251215_001`
   - Don't deduplicate by destinationId

2. **Update UI** to allow multiple cards per destination

3. **Update destination selector** to always create new EntryInfo

**Files to modify:**
- `app/services/EntryInfoService.js:142-151` - Remove deduplication
- `app/screens/HomeScreen.js` - Support multiple destination instances
- Navigation flows to create new trip on each selection

**Testing:**
- Verify can create 2 Thailand trips
- Verify both display correctly
- Verify both maintain separate data

**Estimated time:** 2-3 hours

---

## 📅 Recommended Implementation Order

```
Week 1: Phase 1-3 (Lifecycle + Tabs)
├─ Day 1-2: Phase 1 (Lifecycle fields)
├─ Day 3: Phase 2 (Status filtering)
└─ Day 4-5: Phase 3 (Tab UI)

Week 2: Phase 4-6 (Sorting + Cancel/Restore)
├─ Day 1: Phase 4 (Departure sorting)
├─ Day 2-3: Phase 5 (Cancel functionality)
└─ Day 4-5: Phase 6 (Restore functionality)

Week 3: Phase 7-8 (Auto-complete + Multi-trip)
├─ Day 1-2: Phase 7 (Auto-completion)
└─ Day 3-5: Phase 8 (Multiple trips per destination)
```

**Total estimated time:** 22-30 hours across 3 weeks

---

## 🔧 Key Technical Decisions

### Decision 1: Extend EntryInfo vs New Trip Model

**Option A:** Extend existing EntryInfo with lifecycle
- ✅ Minimal changes to existing code
- ✅ Works with all existing services
- ❌ EntryInfo name becomes misleading

**Option B:** Create new Trip model wrapping EntryInfo
- ✅ Cleaner separation of concerns
- ❌ Requires updating all services
- ❌ More migration work

**Recommendation:** **Option A** for faster migration

---

### Decision 2: Tab Implementation

**Use existing pattern from:**
- `TDACFilesScreen.js:244-271` - Tab bar with counts
- `NotificationLogScreen.js:353-380` - Tab switching logic

**Reusable component:**
```javascript
// app/components/TripTabBar.js
export default function TripTabBar({ tabs, activeTab, onTabChange }) {
  // Matches existing style from TDACFilesScreen
}
```

---

### Decision 3: Data Migration

**No database migration needed** - all changes are additive:
- New fields have default values
- Old data continues to work
- New lifecycle fields added on first save

---

## 🧪 Testing Strategy

### Phase Testing
- Unit test each new service method
- Integration test with SecureStorageService
- UI test each phase before moving to next

### Regression Testing
- Verify existing Thailand entry flow still works
- Verify TDAC submission still works
- Verify data persistence still works

### End-to-End Testing
- Create trip → Fill data → Submit → Auto-complete
- Create trip → Cancel → Restore → Complete
- Create 2 Thailand trips → Verify both work independently

---

## 📝 Migration Checklist

### Before Starting
- [ ] Backup current database
- [ ] Create git branch: `feature/tab-based-home-screen`
- [ ] Review wireframes (docs/wireframes/home-screen-wireframes.md)

### Phase Completion Checklist (repeat for each phase)
- [ ] Code changes complete
- [ ] Unit tests passing
- [ ] Manual testing done
- [ ] No regressions in existing features
- [ ] Git commit with clear message
- [ ] Update this doc with actual completion time

### After All Phases
- [ ] Update documentation
- [ ] Create PR for review
- [ ] Perform full regression testing
- [ ] Deploy to test environment

---

## 🚨 Risks and Mitigation

### Risk 1: Data Loss During Migration
**Mitigation:** All changes are additive, no destructive updates

### Risk 2: Breaking Existing Flows
**Mitigation:** Backward compatibility in Phase 1-2, gradual UI changes

### Risk 3: Performance Issues with Many Trips
**Mitigation:** Implement pagination/virtualization in Phase 8 if needed

---

## 📚 Reference Files

- **Wireframes:** `docs/wireframes/home-screen-wireframes.md`
- **Current HomeScreen:** `app/screens/HomeScreen.js:67-1146`
- **EntryInfoService:** `app/services/EntryInfoService.js:118-200`
- **Tab Pattern:** `app/screens/thailand/TDACFilesScreen.js:244-271`
- **Tab Pattern 2:** `app/screens/NotificationLogScreen.js:353-380`

---

**Ready to start Phase 1?** Let me know and I can help implement it!
