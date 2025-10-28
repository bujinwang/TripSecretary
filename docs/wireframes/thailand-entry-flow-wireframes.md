# Thailand Entry Flow - Detailed Wireframes & UX Specification
**Version:** 2.0
**Date:** 2025-10-28
**Author:** Sally (UX Expert)
**Status:** Draft for Review

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Flow Improvements Summary](#flow-improvements-summary)
4. [Detailed Wireframes](#detailed-wireframes)
5. [Component Specifications](#component-specifications)
6. [Interaction Patterns](#interaction-patterns)
7. [Implementation Notes](#implementation-notes)

---

## 1. Overview

This document provides detailed wireframes and specifications for the improved Thailand Entry Flow. The redesign addresses key friction points identified in the UX evaluation, focusing on:

- **Reduced navigation complexity** (5 levels → 3 levels)
- **Improved context awareness** (breadcrumbs, smart navigation)
- **Inline editing capabilities** (modals instead of full navigation)
- **Clearer action hierarchy** (primary/secondary/tertiary structure)
- **Persistent progress visibility** (across all screens)

### Target User Journey
```
Entry Point → Hub (Prepare) → Submit → Success View
     ↓           ↓               ↓          ↓
  1 tap      Quick edits     2 options   Actions
```

**Goal:** Complete Thailand entry preparation in < 5 minutes with minimal friction.

---

## 2. Design Principles

These principles guide all design decisions in this flow:

1. **Context Over Clicks** - Show where users are and where they can go
2. **Edit in Place** - Avoid navigation when possible; use modals for quick changes
3. **Progressive Confidence** - Build user confidence with clear progress indicators
4. **Escape Hatches** - Always provide a clear way back to safety
5. **Action Clarity** - One obvious next step at any given time

---

## 3. Flow Improvements Summary

### Before (Current State)
```
┌──────────────────────────────────────────────────────────┐
│  Screen Stack Depth: 5 levels                            │
│  Navigation: Linear (back button only)                   │
│  Editing: Full navigation required                       │
│  Progress: Hidden on some screens                        │
│  Actions: Multiple equal-weight buttons                  │
└──────────────────────────────────────────────────────────┘

Flow: Entry → Edit → Preview → Selection → Method → Result → Officer View
      ├─ Alert → Navigate back → Fix → Try again...
      └─ 6-8 steps with multiple decision points
```

### After (Improved State)
```
┌──────────────────────────────────────────────────────────┐
│  Screen Stack Depth: 3 levels                            │
│  Navigation: Hub-and-spoke with breadcrumbs              │
│  Editing: Inline modals for quick fixes                  │
│  Progress: Persistent across all screens                 │
│  Actions: Clear hierarchy (1 primary, rest secondary)    │
└──────────────────────────────────────────────────────────┘

Flow: Hub → Quick Edit Modal OR Submit → Success → Actions
      ├─ Pre-validated before submission
      └─ 3-4 steps with clear guidance
```

---

## 4. Detailed Wireframes

### 4.1 Screen: ThailandEntryFlowScreen (Hub) - IMPROVED

**File:** `app/screens/thailand/ThailandEntryFlowScreen.js`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                                  │ │
│ │ ← My Trips        Thailand Journey 🇹🇭         ⚙️     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PROGRESS BAR (Persistent across all Thailand screens)  │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░ │ │
│ │ 85% Ready to go! Just 2 more things...                 │ │
│ │ [Quick Fix Missing Items ⚡]                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HERO SECTION                                            │ │
│ │                        🌺                                │ │
│ │           Ready for Your Thailand Adventure?            │ │
│ │      Let's make sure you have everything ready!         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ QUICK STATUS CARDS (Collapsible)                       │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │ │
│ │ │ 📘       │ │ 👤       │ │ 💰       │ │ ✈️       │  │ │
│ │ │ Passport │ │ Personal │ │ Funds    │ │ Travel   │  │ │
│ │ │ ✅ 5/5   │ │ ⚠️ 3/4   │ │ ✅ 1/1   │ │ ✅ 4/4   │  │ │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │ │
│ │      ↓ Tap any to expand inline quick fix              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ COUNTDOWN & SUBMISSION WINDOW                           │ │
│ │ 📅 Arrival in 12 days                                   │ │
│ │ ⏰ Submission window: OPEN (7-90 days before)          │ │
│ │                                                          │ │
│ │ [🚀 Submit My Entry Card]  ← PRIMARY ACTION (Large)    │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SECONDARY ACTIONS (Smaller, grouped)                    │ │
│ │                                                          │ │
│ │ [📋 Preview My Info]    [📚 Entry Guide]              │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HELPFUL LINKS (Text links, de-emphasized)               │ │
│ │ • What happens after I submit?                          │ │
│ │ • Can I change my info later?                           │ │
│ │ • Thailand entry requirements FAQ                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Key Improvements:
1. **Persistent Progress Bar** - Shows completion % on every Thailand screen
2. **Quick Fix Button** - Opens inline modal instead of navigating away
3. **Collapsible Status Cards** - Tap to expand and edit inline
4. **Clear Action Hierarchy** - One large primary button, smaller secondary actions
5. **Contextual Breadcrumb** - "← My Trips" shows where you came from

---

### 4.2 Component: Quick Fix Modal (NEW)

**Purpose:** Allow users to fix missing information without leaving the hub screen

#### Modal Structure
```
┌─────────────────────────────────────────────────────────────┐
│                     Modal Overlay (Slide Up)                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Quick Fix - Personal Info              [✕ Close]   │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │ │
│ │ You're missing 1 item:                                 │ │ │
│ │                                                         │ │ │
│ │ ┌─────────────────────────────────────────────────────┐│ │
│ │ │ Gender                                              ││ │
│ │ │ ⚠️ Required for Thailand entry                     ││ │
│ │ │                                                     ││ │
│ │ │ ○ Male    ○ Female    ○ Other                     ││ │
│ │ │                                                     ││ │
│ │ └─────────────────────────────────────────────────────┘│ │
│ │                                                         │ │ │
│ │ [Save & Continue]                    [Edit Full Form] │ │ │
│ │   ↑ Primary                          ↑ Text link      │ │ │
│ │                                                         │ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Interaction Flow:
1. User taps "Quick Fix Missing Items ⚡" or incomplete status card
2. Modal slides up from bottom (iOS style) or fades in (Android)
3. Shows ONLY the missing fields with context
4. "Save & Continue" updates and closes modal
5. "Edit Full Form" navigates to full editing screen (escape hatch)

#### States:
- **Loading:** Skeleton screen while fetching data
- **Single Field:** Simple input as shown above
- **Multiple Fields:** Grouped by category with clear labels
- **Error:** Inline validation with helpful messages
- **Success:** Brief checkmark animation before closing

---

### 4.3 Screen: TDACSelectionScreen - IMPROVED

**File:** `app/screens/thailand/TDACSelectionScreen.js`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                                  │ │
│ │ ← Back to Journey    Choose Submission Method          │ │
│ │                                                         │ │
│ │ Breadcrumb: My Journey > Submit Entry Card             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PROGRESS BAR (Still visible)                            │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│ │
│ │ 100% Ready! Choose how to submit →                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HERO                                                    │ │
│ │                        ⚡                                │ │
│ │            Choose Your Submission Method                │ │
│ │     Both methods work great - pick what you prefer!     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ RECOMMENDED OPTION (Emphasized)                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │                [⚡ RECOMMENDED]                      │ │ │
│ │ │                                                      │ │ │
│ │ │  ⚡ Lightning Submit                                │ │ │
│ │ │  We fill everything for you automatically           │ │ │
│ │ │                                                      │ │ │
│ │ │  ✅ 2 minutes     ✅ 98% success     ✅ Auto-fill  │ │ │
│ │ │                                                      │ │ │
│ │ │  Perfect for: Quick submission with no hassle       │ │ │
│ │ │                                                      │ │ │
│ │ │  [Use Lightning Submit →]  ← Large, prominent      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ALTERNATIVE OPTION (De-emphasized)                      │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │  🌐 Manual Submit                                   │ │ │
│ │ │  You fill the form yourself                         │ │ │
│ │ │                                                      │ │ │
│ │ │  ⏱️ 5-8 minutes     ✅ Official site    👁️ You see │ │ │
│ │ │                                          everything  │ │ │
│ │ │                                                      │ │ │
│ │ │  Perfect for: Those who prefer manual control       │ │ │
│ │ │                                                      │ │ │
│ │ │  [Use Manual Submit →]  ← Smaller, outlined button │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ INFO TIP                                                │ │
│ │ 💡 Both methods submit to the official Thai government │ │
│ │    system. Your data is equally secure either way.      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Key Improvements:
1. **Breadcrumb Navigation** - Shows "My Journey > Submit Entry Card"
2. **Visual Hierarchy** - Recommended option is clearly larger and emphasized
3. **Clearer Benefits** - Side-by-side comparison with icons
4. **Progress Still Visible** - Maintains context throughout
5. **Simplified Language** - "Lightning" vs "Manual" instead of "Hybrid" vs "WebView"

---

### 4.4 Screen: EntryInfoDetailScreen - IMPROVED

**File:** `app/screens/thailand/EntryInfoDetailScreen.js`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                                  │ │
│ │ ← Back to Journey    My Entry Card                     │ │
│ │                                                         │ │
│ │ Breadcrumb: My Journey > Entry Card Details             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SUCCESS BANNER                                          │ │
│ │ ✅ Entry card submitted successfully!                   │ │
│ │ Card #: TH2025XXXXXX | Submitted: Oct 28, 2025 14:32   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PRIMARY ACTION (Large, obvious)                         │ │
│ │                                                          │ │
│ │    [👮 Show to Immigration Officer]  ← HERO BUTTON     │ │
│ │    This opens the full-screen presentation view         │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ QR CODE & KEY INFO (Collapsible card)                   │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │          ┌───────────┐                              │ │ │
│ │ │          │  QR Code  │                              │ │ │
│ │ │          │  [IMAGE]  │                              │ │ │
│ │ │          └───────────┘                              │ │ │
│ │ │                                                      │ │ │
│ │ │  Card Number: TH2025XXXXXX                          │ │ │
│ │ │  Valid Until: Nov 27, 2025                          │ │ │
│ │ │  Status: Active ✅                                  │ │ │
│ │ │                                                      │ │ │
│ │ │  [↓ Download PDF]  [📤 Share]                      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ENTRY INFO SUMMARY (Collapsible sections)               │ │
│ │                                                          │ │
│ │ ▼ Passport Information                                  │ │
│ │   [Collapsed view with key details]                     │ │
│ │                                                          │ │
│ │ ▼ Travel Information                                    │ │
│ │   [Collapsed view with key details]                     │ │
│ │                                                          │ │
│ │ ▼ Personal Information                                  │ │
│ │   [Collapsed view with key details]                     │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ MORE ACTIONS (Collapsed menu)                           │ │
│ │ [⋯ More Options ▼]                                      │ │
│ │                                                          │ │
│ │ When expanded:                                           │ │
│ │ • 📚 View Entry Guide                                   │ │
│ │ • 📤 Share with Travel Companion                        │ │
│ │ • 🔄 Update Information                                 │ │
│ │ • 📦 Archive                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Key Improvements:
1. **Single Primary Action** - "Show to Immigration Officer" is the hero
2. **Collapsed Sections** - Reduces visual clutter, user expands what they need
3. **More Options Menu** - Secondary actions hidden until needed
4. **Clear Status Indicators** - Visual confirmation of success
5. **Reduced Button Count** - From 6 buttons to 1 primary + collapsed menu

---

### 4.5 Component: Breadcrumb Navigation (NEW)

**Purpose:** Provide context and quick navigation across the flow

#### Structure
```
┌─────────────────────────────────────────────────────────────┐
│ My Trips > Thailand > Entry Preparation                      │
│    ↑         ↑           ↑ Current page                     │
│    └─────────┴─────────── All clickable                     │
└─────────────────────────────────────────────────────────────┘
```

#### Behavior:
- Shows up to 3 levels of hierarchy
- Current page is NOT clickable, shown in different color
- Previous levels are clickable and navigate directly
- On mobile: May collapse to "← Parent Page" to save space
- Updates automatically based on navigation context

#### Implementation Notes:
- Add to all screens after ThailandEntryFlowScreen
- Position: Below header, above main content
- Style: Small text, subtle color, clear hierarchy
- File: Create `app/components/Breadcrumb.js`

---

### 4.6 Component: Persistent Progress Bar (NEW)

**Purpose:** Keep users informed of completion status across all Thailand screens

#### Desktop/Tablet View
```
┌─────────────────────────────────────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░ │
│ 85% Ready to go! Just add your arrival date →  [Quick Fix] │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile View (Compact)
```
┌───────────────────────────────────┐
│ 85% ━━━━━━━━━━━━━━━━━━░░░░      │
│ Add arrival date [Fix]            │
└───────────────────────────────────┘
```

#### States:
- **0-40%**: Red/Orange with "Let's get started!"
- **41-79%**: Yellow/Amber with "You're making progress!"
- **80-99%**: Light green with "Almost there!"
- **100%**: Green with "Ready to submit! 🎉"

#### Behavior:
- Pinned to top of screen (below header)
- Shows on ALL Thailand-related screens
- Updates in real-time as user completes sections
- Tapping bar opens quick fix modal
- Animates smoothly when progress changes

---

### 4.7 Component: Collapsible Status Cards (ENHANCED)

**Purpose:** Show category completion at a glance with ability to edit inline

#### Collapsed State
```
┌────────────────────────────────────────────────────────────┐
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│ │ 📘        │ │ 👤        │ │ 💰        │ │ ✈️        │  │
│ │ Passport  │ │ Personal  │ │ Funds     │ │ Travel    │  │
│ │ ✅ 5/5    │ │ ⚠️ 3/4    │ │ ✅ 1/1    │ │ ✅ 4/4    │  │
│ │ Complete  │ │ Missing 1 │ │ Complete  │ │ Complete  │  │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │
│      ↓ Tap to expand                                       │
└────────────────────────────────────────────────────────────┘
```

#### Expanded State (when incomplete)
```
┌────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 👤 Personal Information                    [✕ Close] │   │
│ │                                                      │   │
│ │ ✅ Occupation: Software Engineer                    │   │
│ │ ✅ Phone: +1 (555) 123-4567                         │   │
│ │ ✅ Email: user@example.com                          │   │
│ │ ⚠️  Gender: Not provided                            │   │
│ │                                                      │   │
│ │ [Quick Add Gender]         [Edit All Personal Info]│   │
│ │  ↑ Opens modal             ↑ Full navigation       │   │
│ └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

#### Behavior:
- Cards expand in place when tapped
- Complete cards show checkmarks, can still be tapped to view
- Incomplete cards show missing item count and warning icon
- "Quick Add" opens minimal modal for single missing field
- "Edit All" navigates to full form (escape hatch)

---

## 5. Component Specifications

### 5.1 Button Hierarchy System

Define clear visual hierarchy for all buttons in the flow:

#### Primary Actions
```javascript
// Style properties
{
  height: 56px,
  borderRadius: 16px,
  backgroundColor: colors.primary,
  fontSize: 18px,
  fontWeight: 'bold',
  shadow: 'large',
  // Full width on mobile, max 400px on desktop
}
```
**Usage:** Main call-to-action on each screen (max 1 per screen)
**Examples:** "Submit My Entry Card", "Show to Immigration Officer"

#### Secondary Actions
```javascript
// Style properties
{
  height: 48px,
  borderRadius: 12px,
  backgroundColor: colors.white,
  borderWidth: 2,
  borderColor: colors.primary,
  fontSize: 16px,
  fontWeight: '600',
  shadow: 'medium',
}
```
**Usage:** Alternative actions that are still important (2-3 per screen)
**Examples:** "Preview My Info", "Edit Information"

#### Tertiary Actions
```javascript
// Style properties
{
  height: 'auto',
  backgroundColor: 'transparent',
  fontSize: 15px,
  fontWeight: 'normal',
  textDecoration: 'underline',
  color: colors.textSecondary,
}
```
**Usage:** Less common actions, links to more info
**Examples:** "View FAQ", "Contact Support"

---

### 5.2 Modal Component Specifications

#### Slide-Up Modal (Mobile)
```javascript
{
  animation: 'slide-up',
  duration: 300,
  easing: 'ease-out',
  backdrop: 'rgba(0,0,0,0.5)',
  maxHeight: '80vh',
  borderRadius: '24px 24px 0 0',
}
```

#### Center Modal (Desktop)
```javascript
{
  animation: 'fade-in',
  duration: 200,
  backdrop: 'rgba(0,0,0,0.4)',
  maxWidth: '600px',
  borderRadius: '16px',
  shadow: 'xlarge',
}
```

#### Close Behaviors:
- Tap backdrop to close (with unsaved changes warning)
- Swipe down to close (mobile only)
- ESC key to close (desktop)
- [✕] button always visible in header

---

### 5.3 Progress Bar Component

**File:** `app/components/ProgressBar.js` (to be created)

```javascript
<ProgressBar
  percent={85}
  status="almost_ready"  // incomplete | in_progress | almost_ready | complete
  missingItems={["Arrival date"]}
  onQuickFix={() => openQuickFixModal()}
  showOnAllScreens={true}
  screenContext="thailand"
/>
```

**Props:**
- `percent`: 0-100 completion percentage
- `status`: Determines color scheme and messaging
- `missingItems`: Array of what's missing (for tooltip/message)
- `onQuickFix`: Callback when user taps "Quick Fix" button
- `showOnAllScreens`: Pin to top across related screens
- `screenContext`: Used for filtering which screens show it

---

### 5.4 Breadcrumb Component

**File:** `app/components/Breadcrumb.js` (to be created)

```javascript
<Breadcrumb
  path={[
    { label: 'My Trips', screen: 'MyTrips' },
    { label: 'Thailand', screen: 'ThailandInfo' },
    { label: 'Entry Preparation', screen: 'ThailandEntryFlow' },
  ]}
  currentIndex={2}
  onNavigate={(screen) => navigation.navigate(screen)}
/>
```

**Behavior:**
- Auto-generates from navigation stack
- Collapses on mobile to "← Parent" if too long
- Updates current page styling automatically
- Handles navigation with proper state preservation

---

## 6. Interaction Patterns

### 6.1 Quick Fix Flow

**Trigger Points:**
1. User taps "Quick Fix Missing Items" button on progress bar
2. User taps incomplete status card (e.g., "Personal ⚠️ 3/4")
3. User taps specific missing item in expanded card

**Flow:**
```
User Action → Determine Missing Fields → Open Modal
                                            ↓
                      Single Field? ─────── Show simple input
                                            ↓
                      Multiple Fields? ──── Show grouped inputs
                                            ↓
                      User Fills ─────────→ Validate
                                            ↓
                      Valid? ──────────────→ Save & Close
                                            ↓
                      Invalid? ────────────→ Show inline error
                                            ↓
                      User Fixes ──────────→ Save & Close
                                            ↓
                      Update Progress Bar
                                            ↓
                      Show Success Toast
```

**Success Toast:**
```
┌─────────────────────────────────────┐
│ ✅ Personal info updated!          │
│ You're now 90% ready to submit     │
└─────────────────────────────────────┘
```

---

### 6.2 Navigation Pattern

**Rule:** Every screen must answer:
1. Where am I? (Breadcrumb + title)
2. Where did I come from? (Back button label)
3. What can I do here? (Primary action)
4. How do I get back to safety? (Back to Journey button)

**Implementation:**
```javascript
// Add to navigation config
{
  screenName: 'TDACSelection',
  breadcrumb: 'My Journey > Submit Entry Card',
  backLabel: 'Back to Journey',
  backDestination: 'ThailandEntryFlow',
  floatingHomeButton: true,  // Show "Return to Journey" FAB
}
```

---

### 6.3 Error Handling Pattern

**Instead of Alerts:**
```
❌ DON'T:
Alert.alert('Error', 'Missing arrival date. Please go back and add it.')

✅ DO:
Show inline banner:
┌─────────────────────────────────────────────────────┐
│ ⚠️ Missing arrival date                            │
│ Thailand requires this for entry card submission   │
│ [Add Arrival Date]                                  │
└─────────────────────────────────────────────────────┘
```

**Error Display Rules:**
- Inline errors next to the field/section
- Banner errors for page-level issues
- Toast for temporary status updates
- NO ALERTS unless critical/blocking (like network failure)

---

### 6.4 Loading States

**Skeleton Screens > Spinners:**

```
Loading progress bar:
┌─────────────────────────────────────┐
│ ▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯   │
│ Loading your preparation status...  │
└─────────────────────────────────────┘

Loading status cards:
┌──────────┐ ┌──────────┐ ┌──────────┐
│ ▯▯▯      │ │ ▯▯▯      │ │ ▯▯▯      │
│ ▯▯▯▯▯    │ │ ▯▯▯▯▯    │ │ ▯▯▯▯▯    │
│ ▯▯ ▯/▯   │ │ ▯▯ ▯/▯   │ │ ▯▯ ▯/▯   │
└──────────┘ └──────────┘ └──────────┘
```

**Benefits:**
- Shows structure while loading
- No jarring blank screen
- Users understand what's coming
- Perceived performance improvement

---

## 7. Implementation Notes

### 7.1 Phase 1: Foundation (Week 1)

**Priority: High - Reduces navigation complexity**

1. **Create Breadcrumb Component**
   - File: `app/components/Breadcrumb.js`
   - Add to all screens after ThailandEntryFlowScreen
   - Integration points: ThailandEntryFlowScreen.js:28-48

2. **Create Persistent Progress Bar**
   - File: `app/components/ProgressBar.js`
   - Integrate with existing completion calculation (EntryCompletionCalculator)
   - Show on all Thailand screens

3. **Update Back Button Labels**
   - Make contextual: "← Back to My Journey" instead of "← Back"
   - Add to BackButton component props
   - File: `app/components/BackButton.js`

### 7.2 Phase 2: Quick Fix Modals (Week 2)

**Priority: High - Reduces friction significantly**

1. **Create Quick Fix Modal Component**
   - File: `app/components/QuickFixModal.js`
   - Handle single field and multi-field scenarios
   - Integrate with UserDataService for saves

2. **Update Status Cards**
   - Make collapsible/expandable
   - Add "Quick Add" buttons for incomplete items
   - File: Already in PreparedState component, enhance it

3. **Add Quick Fix Trigger to Progress Bar**
   - Detect missing items from completion calculator
   - Open appropriate modal based on missing data
   - File: `app/components/ProgressBar.js`

### 7.3 Phase 3: Action Hierarchy (Week 3)

**Priority: Medium - Improves clarity**

1. **Update Button Styles**
   - Create button size variants in Button component
   - Apply hierarchy to all Thailand screens
   - File: `app/components/Button.js`

2. **Simplify EntryInfoDetailScreen**
   - Create collapsible "More Options" menu
   - Make "Show to Officer" the primary hero button
   - File: `app/screens/thailand/EntryInfoDetailScreen.js`

3. **Simplify TDACSelectionScreen**
   - Emphasize recommended option visually
   - De-emphasize alternative option
   - File: `app/screens/thailand/TDACSelectionScreen.js`

### 7.4 Phase 4: Polish & Testing (Week 4)

**Priority: Medium**

1. **Replace Alerts with Inline Errors**
   - Create inline error banner component
   - Replace Alert.alert calls throughout flow
   - Test all error scenarios

2. **Add Skeleton Loading States**
   - Create skeleton components for main screens
   - Replace spinners with skeletons
   - Test on slow networks

3. **Add Success Toasts**
   - Create toast notification component
   - Add confirmations for all save operations
   - File: `app/components/Toast.js`

---

### 7.5 Files to Create

```
app/
├── components/
│   ├── Breadcrumb.js                    [NEW]
│   ├── ProgressBar.js                   [NEW]
│   ├── QuickFixModal.js                 [NEW]
│   ├── CollapsibleCard.js               [NEW]
│   ├── Toast.js                         [NEW]
│   └── InlineErrorBanner.js             [NEW]
```

### 7.6 Files to Modify

```
app/
├── components/
│   ├── BackButton.js                    [ENHANCE: Add contextual labels]
│   ├── Button.js                        [ENHANCE: Add size variants]
│   └── thailand/
│       └── PreparedState.js             [ENHANCE: Add collapsible cards]
├── screens/thailand/
│   ├── ThailandEntryFlowScreen.js       [ENHANCE: Add progress bar, quick fix]
│   ├── TDACSelectionScreen.js           [ENHANCE: Visual hierarchy]
│   └── EntryInfoDetailScreen.js         [ENHANCE: Action hierarchy, collapse menu]
```

---

## 8. Success Metrics

Track these metrics before and after implementation:

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| **Time to Complete** | ~8-10 min | < 5 min | Analytics timing |
| **Navigation Depth** | 5 levels | ≤ 3 levels | Navigation tracking |
| **Back Button Usage** | High | Reduced 50% | Event tracking |
| **Drop-off Rate** | Unknown | < 15% | Funnel analysis |
| **Quick Fix Usage** | N/A | > 60% | Event tracking |
| **Alert Dismissals** | High | 0 (use inline) | Error tracking |
| **Completion Rate** | Unknown | > 85% | Completion funnel |

---

## 9. Next Steps

### Immediate Actions:
1. **Review wireframes with product team** - Get feedback on proposed changes
2. **Validate with development team** - Ensure technical feasibility
3. **Create visual mockups in Figma** - High-fidelity designs for key screens
4. **Plan implementation sprints** - Break into manageable chunks

### Questions to Resolve:
- [ ] Should Quick Fix modal save automatically or require user confirmation?
- [ ] How do we handle network errors during inline saves?
- [ ] Should progress bar be dismissible or always visible?
- [ ] What's the behavior when user backs out of modal with unsaved changes?

---

**End of Wireframe Specification**

This document will be updated as we refine the designs and gather feedback. Next version will include high-fidelity mockups and detailed animation specifications.
