**What’s Wrong**

* The privacy note under the hero renders Chinese while the rest is English.

* Root cause: missing translation key; code calls `t('common.privacy.localStorage', { defaultValue: '所有信息仅保存在您的手机本地' })` in `app/templates/EnhancedTravelInfoTemplate.tsx:1898`, but `app/i18n/locales.ts` defines `privacyNote`/`privacyNotice` instead, so the Chinese `defaultValue` is shown.

**Target Scope**

* Fix the Thailand Entry Preparation Guide screen to show English-only when the app is in English.

* Normalize the privacy note key and remove Chinese fallbacks that can leak into English.

**Changes**

* Add `common.privacy.localStorage` to `app/i18n/locales.ts` for EN and ZH: `"All information is saved locally on your device only"` / `"所有信息仅保存在您的手机本地"`.

* Keep `EnhancedTravelInfoTemplate.tsx` as-is; it will resolve the new key and stop using the Chinese `defaultValue` in English.

* Unify other usages to the same key:

  * Replace `t('result.infoBox', ...)` in `app/screens/ResultScreen.tsx:1351` with `t('common.privacy.localStorage')`.

* Convert remaining Chinese literals on the Entry Guide screen to i18n keys:

  * In `app/screens/entryGuide/ThailandEntryGuideScreen.tsx` (e.g., `243–244`, `287`, `307–341`, `362`, `371–372`, `382`, `389`, `405`), create keys under `thailand.entryGuide.*` and replace inline text with `t()`.

* Remove Chinese `defaultValue` fallbacks in English-facing components; use English as `defaultValue` to prevent leakage if a key is missing.

**Verification**

* Run the app with language set to English; open the Thailand Entry Preparation Guide and confirm no Chinese text remains.

* Add a unit test for the i18n lookup ensuring English fallback when a key is missing.

**Notes**

* No feature behavior changes; only i18n correctness and consistency.

* This approach is minimal-risk and aligns with existing i18n structure (`LocaleContext`, `locales.ts`).

