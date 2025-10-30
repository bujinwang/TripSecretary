# Chinese Localization Strategy

## Overview

This project supports three Chinese language variants:
- **zh-CN**: Simplified Chinese (Mainland China)
- **zh-TW**: Traditional Chinese (Taiwan)
- **zh-HK**: Traditional Chinese (Hong Kong)

## Implementation Approach

We use **runtime conversion** with lazy loading to maintain a single source of truth for Chinese translations while supporting all three variants.

### Why This Approach?

1. **Single Source of Truth**: Only maintain `countries.zh.json` (Simplified Chinese)
2. **Automatic Conversion**: Uses OpenCC for accurate character and phrase conversion
3. **Performance**: Lazy loading with caching ensures minimal overhead
4. **Maintainability**: No need to manually sync three separate translation files
5. **Accuracy**: OpenCC handles dialect-specific phrase differences (e.g., 台灣 vs 臺灣)

## Architecture

### Components

1. **`app/i18n/chineseConverter.js`**
   - Core conversion utility using OpenCC
   - Deep object traversal for nested translation structures
   - Memoization cache for performance

2. **`app/i18n/translations/index.js`**
   - Country-specific translations loader
   - Lazy getters for zh-TW and zh-HK that trigger conversion on first access

3. **`app/i18n/locales.js`**
   - Main translations file (3270+ lines)
   - Extended with Traditional Chinese variants via lazy getters
   - Merges country-specific translations

### How It Works

```javascript
// First access to zh-TW
const twTranslations = translations['zh-TW'];
// → Triggers conversion from zh-CN → zh-TW
// → Caches result for subsequent access

// Second access
const twTranslations2 = translations['zh-TW'];
// → Returns cached result (instant)
```

## Conversion Examples

| Simplified (zh-CN) | Traditional (zh-TW/zh-HK) | Context |
|-------------------|---------------------------|---------|
| 护照 | 護照 | Passport |
| 签证 | 簽證 | Visa |
| 信息 | 資訊 | Information |
| 马来西亚 | 馬來西亞 | Malaysia |
| 简体中文 | 繁體中文 | Simplified Chinese |

## Performance

- **First access**: ~0-2ms (conversion + caching)
- **Subsequent access**: <1ms (cached)
- **Bundle size**: +~200KB (opencc-js)

## Adding New Translations

### To add new Chinese content:

1. **Only edit the Simplified Chinese file**:
   - `app/i18n/translations/countries.zh.json` for country-specific
   - `app/i18n/locales.js` (the `zh:` section) for main translations

2. **Traditional variants are generated automatically**:
   - zh-TW and zh-HK will be converted on first access
   - No need to manually update multiple files

3. **Example**:
   ```json
   // app/i18n/translations/countries.zh.json
   {
     "japan": {
       "info": {
         "title": "日本入境指南"  // ← Edit this only
       }
     }
   }
   ```
   
   The system automatically creates:
   - zh-TW: "日本入境指南" (same)
   - zh-HK: "日本入境指南" (same)

## Testing

Run the test scripts to verify conversions:

```bash
# Test country-specific translations
node test-chinese-conversion.js

# Test full translation system
node test-full-translations.js
```

### Expected Results:
- All three variants (zh-CN, zh-TW, zh-HK) should exist ✓
- Characters should be properly converted (护照 → 護照) ✓
- Lazy loading should work (cached access) ✓

## Manual Overrides (Future)

If you need to manually override specific translations for Taiwan or Hong Kong:

1. Create the specific file:
   ```bash
   # For Taiwan-specific overrides
   cp app/i18n/translations/countries.zh.json app/i18n/translations/countries.zh-TW.json
   ```

2. Edit only the specific phrases that need different wording

3. Update `translations/index.js` to prefer manual file over auto-conversion:
   ```javascript
   const countriesZhTWManual = require('./countries.zh-TW.json');
   
   get 'zh-TW'() {
     return {
       ...convertToTraditional(countriesZh, 'zh-TW'),
       ...countriesZhTWManual  // Manual overrides take precedence
     };
   }
   ```

## Troubleshooting

### Issue: Module resolution errors
**Solution**: Ensure imports use explicit `.js` extension:
```javascript
import { convertToTraditional } from './chineseConverter.js';
```

### Issue: Conversions not happening
**Solution**: 
1. Check OpenCC is installed: `npm list opencc-js`
2. Verify converter is initialized: Check console for errors
3. Clear cache: Restart dev server

### Issue: Same text in all variants
**Solution**: Some characters are the same in both scripts (e.g., "日本"). This is expected. Check with characters that differ (e.g., "护照").

## Dependencies

- **opencc-js** (^1.x): Open Chinese Convert library
  - MIT License
  - Battle-tested, used by millions
  - Handles both character and phrase conversion

## Future Enhancements

1. **Add Japanese (ja) and Korean (ko) variants** when content is ready
2. **Locale detection improvements** based on user's region
3. **Manual override system** for brand-specific terminology
4. **Build-time generation option** if bundle size becomes an issue

---

**Maintainer Notes**: 
- Only edit Simplified Chinese files
- Traditional variants are auto-generated
- Test after major translation updates
