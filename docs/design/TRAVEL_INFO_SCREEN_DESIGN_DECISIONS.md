# Travel Info Screen - Design Decisions

This document records key UX and design decisions for Travel Info Screens across all countries.

---

## ❌ Decision: No Completion Progress Overview Card

**Date**: 2025-10-30
**Status**: ✅ Implemented
**Reference**: ADR 9 in `docs/architecture/Architecture-Decision-Records.md`

### Decision

**We do NOT include the Completion Progress Overview Card at the top of travel info screens.**

### What It Looked Like

```
┌─────────────────────────────────────┐
│  Completion Progress                │
│  / (0%)                             │
│                                      │
│  Complete all fields to continue.   │
│                                      │
│  護照信息 - Passport Information  ⭕  │
│  個人信息 - Personal Information  ⭕  │
│  資金證明 - Proof of Funds        ⭕  │
│  旅行詳情 - Travel Details        ⭕  │
└─────────────────────────────────────┘
```

### Why We Removed It

1. **Space Optimization**
   - Mobile screen space is precious
   - The card takes up ~200px of vertical space
   - Better to show actual form fields

2. **Redundant Information**
   - Each section header already shows completion (e.g., "7/7")
   - The overall progress doesn't add much value
   - Users focus on one section at a time

3. **Better UX**
   - Reduces visual clutter
   - Less cognitive load
   - No pressure from seeing "0%" at start
   - Cleaner, more focused interface

4. **Consistency**
   - Many successful government forms don't show overall progress
   - Section-level progress is sufficient

### What We Keep Instead

Each collapsible section header shows its own progress:

```
📘 護照信息 - Passport Information        [7/7] ✓
```

This provides enough feedback without cluttering the screen.

### Code References

- **Screen**: `app/screens/vietnam/VietnamTravelInfoScreen.js:325-339`
- **Config**: `app/config/destinations/vietnam/travelInfoConfig.js:168`
- **ADR**: `docs/architecture/Architecture-Decision-Records.md` (ADR 9)

### Impact

- ✅ Vietnam Travel Info Screen - Implemented
- 📋 Future countries - Follow this pattern by default
- 🔧 `ProgressOverviewCard` component remains available for other use cases

### If You Need Progress Overview

If a future use case requires the progress overview card:

1. Check if it's truly needed (consider the reasons above)
2. Get UX team approval

### If You Need Progress Overview

If a future use case requires the progress overview card:

```typescript
interface CountryConfig {
  features: {
    showProgressOverview?: boolean;
  };
  // ... other config properties
}

const vietnamConfig: CountryConfig = {
  features: {
    showProgressOverview: true // Enable for this country
  },
  // ... other config
};

// Usage in component
const ProgressOverviewCard: React.FC<{ config: CountryConfig }> = ({ config }) => {
  if (!config.features.showProgressOverview) {
    return null; // Don't render if disabled
  }

  return (
    <View style={styles.progressCard}>
      {/* Progress card implementation */}
    </View>
  );
};
```

1. Check if it's truly needed (consider the reasons above)
2. Get UX team approval
3. Set `features.showProgressOverview: true` in country config
4. Document the exception and reasoning
5. Set `features.showProgressOverview: true` in country config
6. Document the exception and reasoning

---

## Future Decisions

Additional design decisions for Travel Info Screens will be added here.
