## Problem Summary
- The back button occasionally becomes unclickable on several screens, including the Entry Preparation template.
- Primary cause: full-screen overlays (especially loading overlays) intercept touch events above the header, or headers lack elevation to sit above transient views.

## Root Causes Identified
- WebView screens use absolute-fill loading overlays that can block touches while `loading` is true: `MDACWebViewScreen.tsx:175-180`, `SGArrivalWebViewScreen.tsx:175-180`, `TWArrivalWebViewScreen.tsx:161-166`, `HDACWebViewScreen.tsx:177-180`.
- Template headers render inside the same React tree as content; if any overlay is mounted at a higher z-order, header taps can be intercepted. The template loading indicators currently don’t set `pointerEvents` and may occasionally overlap due to layout changes: `app/templates/EntryFlowScreenTemplate.tsx:1364-1377`, `app/templates/TravelInfoScreenTemplate.tsx:392-405`.
- Back button hit area is small by default (`8px` each side), making tap failures more likely when overlays compete for touches: `app/components/BackButton.tsx:16, 61-77`.

## Fix Strategy
1. Non-blocking overlays globally
- Set `pointerEvents="none"` on all purely informational loading overlays so they never intercept taps.
- Keep overlays scoped to content containers (below headers) as already done in WebView screens.

2. Elevate headers above content
- Add `zIndex: 10` (and `elevation: 10` for Android) to template header containers so headers sit above transient views.
- Files: `EntryFlowScreenTemplate.Header` (`app/templates/EntryFlowScreenTemplate.tsx:418-435`), `TravelInfoScreenTemplate.Header` (`app/templates/TravelInfoScreenTemplate.tsx:142-159`).

3. Increase back button tap target
- Raise default `hitSlop` from `8` to `16` on all sides and ensure it’s applied consistently: `app/components/BackButton.tsx:16`.

4. WebView-specific overlays
- Add `pointerEvents: 'none'` to `styles.loadingOverlay` and keep overlays mounted only within `webViewContainer` so headers remain interactive.
- Files: `MDACWebViewScreen.tsx:175-180`, `SGArrivalWebViewScreen.tsx:175-180`, `TWArrivalWebViewScreen.tsx:161-166`, `HDACWebViewScreen.tsx:177-180`, plus `TDACWebViewScreen.styles.ts:53`.

## Implementation Outline
- Update BackButton default `hitSlop` to `{ top: 16, bottom: 16, left: 16, right: 16 }`.
- In both templates’ header containers, add `zIndex` and `elevation` styles.
- In both templates’ `LoadingIndicator` components, set `pointerEvents="none"` on the outer container.
- In each WebView screen’s `loadingOverlay` style, add `pointerEvents: 'none'`.

## Verification Plan
- Manual navigation through these screens while forcing loading states:
  - Entry Flow screens for Vietnam, Taiwan, Malaysia, Singapore, Hong Kong, USA, Japan, Korea: navigate into the screen while data is loading (`EntryFlowScreenTemplate.AutoContent` renders loading). Confirm the back button responds.
  - WebView screens: while `loading` is true, verify header back button remains clickable.
- Regression checks:
  - Ensure content area taps are still blocked as needed by WebView itself (WebView ignores taps until ready), while headers remain responsive.
  - Confirm no visual layering issues from added `zIndex`.

## Risks & Mitigations
- Making overlays non-blocking can allow taps on underlying content. Mitigation: overlays remain scoped to content containers below the header; WebView itself already limits interactivity during load.
- Header elevation changes may need parity on Android; include `elevation: 10` for Android style parity.

## Next Steps
- I will implement the changes across the listed files, run the app, and validate behavior on each target screen to ensure the back button is consistently clickable.

Please confirm and I’ll proceed with the implementation.