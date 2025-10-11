# ✅ Validation Checklist – Feature-Complete MVP

## Current Status (Authoritative)
- Frontend and Cloudflare Workers backend are implemented end-to-end according to `IMPLEMENTATION_STATUS.md`.
- Real OCR (Alibaba Cloud), Qwen AI generation, and WeChat login work once credentials are supplied; the app ships with safe mock fallbacks enabled by default.
- This checklist supersedes earlier “UI-only” guidance and is the single source for validation expectations as of 2025‑01. Use it alongside the Phase 1 integration guide when moving from mocks to production services.

---

## 0. Preflight Setup
- ☐ Install dependencies: `npm install` (app) and `npm install` in `cloudflare-backend/`.
- ☐ Start backend: `npm run dev` inside `cloudflare-backend/`; confirm it serves on `http://localhost:8787`.
- ☐ Start Expo: `npm start` (or `npx expo start`) inside the project root.
- ☐ Choose data mode:
  - Mock (default): no env changes required; ideal for UI smoke tests.
  - Live services: create `.dev.vars` in `cloudflare-backend/` with Alibaba OCR, Qwen, and WeChat credentials, then set `USE_MOCK_SERVICES=false`.
- ☐ Verify `app/services/api.js` points to the correct backend: `http://localhost:8787` for local, or production URL after deployment.

---

## 1. Smoke Validation (Mock Mode – run every build)
- ☐ Launch app, walk through Login → Home → Scan Passport → Select Destination → Travel Info → Generating → Result without crashes.
- ☐ Confirm mock OCR populates passport, flight, and hotel data placeholders.
- ☐ Download/share buttons surface the expected mock confirmation (no crashes) in `ResultScreen`.
- ☐ History tab lists generated entries from mock service; check grouping and timestamps.
- ☐ Profile tab renders user info and service shortcuts without layout issues.
- ☐ Elderly assistance buttons appear on the Result screen and navigate correctly to:
  - ☐ `CopyWriteModeScreen` (keeps screen awake, font scaling works).
  - ☐ `PIKGuideScreen` (step content and answers render).
- ☐ TDAC Hybrid selector shows recommended hybrid path plus WebView fallback; both routes load in mock mode.
- ☐ App remains responsive while Generating screen runs animated progress.

---

## 2. Integration Validation (Live Services – run after provisioning credentials)
> Requires `USE_MOCK_SERVICES=false` and real API keys.

- OCR
  - ☐ Capture passport photo via device camera; data matches document.
  - ☐ Import passport from gallery; results consistent with camera capture.
  - ☐ Scan airline ticket and hotel confirmation; relevant fields auto-fill.
  - ☐ Retry path surfaces friendly errors on poor-quality images.
- AI Generation
  - ☐ `POST /api/generate` returns structured data for target destinations.
  - ☐ Qwen response populates customs Q&A and entry form fields.
  - ☐ Error handling surfaces retry CTA when Qwen times out or rate limits.
- WeChat / Phone Login
  - ☐ WeChat OAuth round-trip succeeds; tokens stored securely.
  - ☐ Phone login (SMS/mock) continues as fallback.
- PDF & Sharing
  - ☐ `expo-print` outputs PDF and saves via `expo-file-system`.
  - ☐ Share sheet opens on iOS + Android; exported PDF opens externally.
- Persistence & History
  - ☐ AsyncStorage caches recent generations locally.
  - ☐ Deleting an item removes it from D1 and local cache.
- Backend
  - ☐ Cloudflare Worker logs (`wrangler tail`) show successful OCR, AI, and history requests.
  - ☐ D1 tables (`users`, `passports`, `generations`) reflect new data; timestamps correct.

---

## 3. Device & Accessibility Matrix
- iOS: ☐ iPhone SE / 8 (small), ☐ iPhone 14/15 (medium), ☐ iPhone Plus/Max (large).
- Android: ☐ Pixel 6/7, ☐ Samsung A/M series (mid/low end), ☐ Chinese OEM device (per `React-Native国产手机兼容性分析.md` guidance).
- Tablets (optional but recommended): ☐ iPad, ☐ large Android tablet.
- Accessibility:
  - ☐ Dynamic font scaling ≥200% renders key flows.
  - ☐ VoiceOver/TalkBack reads core buttons.
  - ☐ High-contrast mode checks (Android) show compliant colors.

---

## 4. Backend Deployment Gate (Cloudflare Production)
- ☐ `wrangler.toml` contains production D1 database ID and R2 bucket binding.
- ☐ Schema applied: `npx wrangler d1 execute <db> --file=src/db/schema.sql`.
- ☐ Secrets set via `wrangler secret put` for OCR, Qwen, WeChat, JWT.
- ☐ `npm run deploy` succeeds; Worker accessible at `https://api.chujingtong.com` (or chosen domain).
- ☐ CORS permits Expo dev origins and production app bundle.
- ☐ R2 receives generated PDFs when live services enabled.
- ☐ Monitor set up (Cloudflare Analytics / Sentry or equivalent).

---

## 5. Feature-Specific Regression
- Elderly Features (`PIKGuideScreen`, `CopyWriteModeScreen`):
  - ☐ Font size controls clamp within expected range.
  - ☐ Keep-awake toggles off when leaving CopyWrite mode.
  - ☐ Travel info answers reflect latest user input.
- TDAC Hybrid Workflow:
  - ☐ Hidden WebView obtains Cloudflare token within 5‑8 s.
  - ☐ API path completes all TDAC steps; QR code + reference number returned.
  - ☐ WebView fallback still operational for troubleshooting.
  - ☐ R2 stores TDAC PDFs when live services active.
- History & Profile:
  - ☐ Grouped history sections match local timezone.
  - ☐ Profile edits persist and sync to backend.
- Error Messaging:
  - ☐ Offline mode shows cached data with reconnect banner.
  - ☐ Server failures display localized message + retry button.

---

## 6. Release Gate Summary

| Stage | Requirements | Status Owner |
|-------|--------------|--------------|
| **Smoke (Mock)** | Section 1 complete on latest build | Mobile QA |
| **Integration** | Section 2 passed using live services | Backend & Mobile |
| **Device Matrix** | Section 3 covered across target hardware | QA Lead |
| **Production Deploy** | Section 4 verified post-`wrangler deploy` | Infra |
| **Feature Regression** | Section 5 passes after each major change | Feature owner |

Only promote to beta/production after all rows are checked.

---

## Support & References
- Implementation details: `IMPLEMENTATION_STATUS.md`
- API bring-up: `PHASE1_API_INTEGRATION_GUIDE.md`
- TDAC specifics: `TDAC_DUAL_MODE.md`
- Elderly UX: `ELDERLY_USER_FEATURES.md`
- Contact: support@tripsecretary.com

*Last reviewed: 2025‑01*
