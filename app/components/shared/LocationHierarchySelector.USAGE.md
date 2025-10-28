# LocationHierarchySelector - Usage Guide

## Overview

`LocationHierarchySelector` is a generic, country-agnostic component for selecting locations at any hierarchy level. It replaces country-specific selectors like `ProvinceSelector`, `DistrictSelector`, and `SubDistrictSelector` with a single, flexible component.

## Features

- ✅ Works with any location hierarchy (Province → District → SubDistrict)
- ✅ Supports bilingual/multilingual display
- ✅ Optional postal code display
- ✅ Parent-child relationships
- ✅ Custom display formatting
- ✅ Full backwards compatibility
- ✅ Built on BaseSearchableSelector (modal picker with search)

---

## Basic Usage

### 1. Top-Level Selection (Province/State/Region)

```javascript
import { LocationHierarchySelector } from '../../components/shared';
import { thailandProvinces } from '../../data/thailandProvinces';

<LocationHierarchySelector
  dataSource={thailandProvinces}
  label="选择省份"
  placeholder="请选择省份"
  value={provinceCode}
  onValueChange={(code) => setProvinceCode(code)}
  modalTitle="选择省份"
  searchPlaceholder="搜索省份（中文或英文）"
  displayFormat="bilingual"
/>
```

### 2. Child-Level Selection (District/City)

```javascript
import { getDistrictsByProvince } from '../../data/thailandLocations';

<LocationHierarchySelector
  getDataByParent={getDistrictsByProvince}
  parentId={provinceCode}
  label="选择区（地区）"
  placeholder="请选择区（地区）"
  value={districtId}
  selectedId={selectedDistrictId}
  onSelect={(district) => {
    setDistrictId(district.id);
    setDistrictName(district.nameEn);
  }}
  modalTitle="选择区（地区）"
  searchPlaceholder="搜索区（中文或英文）"
  displayFormat="bilingual"
  parentRequiredMessage="请先选择省份"
/>
```

### 3. With Postal Codes (SubDistrict/Ward)

```javascript
import { getSubDistrictsByDistrictId } from '../../data/thailandLocations';

<LocationHierarchySelector
  getDataByParent={getSubDistrictsByDistrictId}
  parentId={districtId}
  label="选择乡 / 街道"
  placeholder="请选择乡 / 街道"
  value={subDistrictId}
  selectedId={selectedSubDistrictId}
  onSelect={(subDistrict) => {
    setSubDistrictId(subDistrict.id);
    setPostalCode(subDistrict.postalCode);
  }}
  showPostalCode={true}
  modalTitle="选择乡 / 街道"
  searchPlaceholder="搜索乡 / 街道（名称或邮编）"
  displayFormat="bilingual"
  parentRequiredMessage="请先选择区（地区）"
/>
```

---

## Country Examples

### Thailand (3-Level Hierarchy)

```javascript
// Level 1: Provinces
<LocationHierarchySelector
  dataSource={thailandProvinces}
  label="จังหวัด (Province)"
  value={province}
  onValueChange={setProvince}
  displayFormat="bilingual"
/>

// Level 2: Districts
<LocationHierarchySelector
  getDataByParent={getDistrictsByProvince}
  parentId={province}
  label="อำเภอ/เขต (District)"
  selectedId={districtId}
  onSelect={(d) => setDistrict(d)}
  displayFormat="bilingual"
/>

// Level 3: SubDistricts with Postal
<LocationHierarchySelector
  getDataByParent={getSubDistrictsByDistrict}
  parentId={districtId}
  label="ตำบล/แขวง (Subdistrict)"
  selectedId={subDistrictId}
  onSelect={(s) => setSubDistrict(s)}
  showPostalCode={true}
  displayFormat="bilingual"
/>
```

### China (2-Level Hierarchy)

```javascript
// Level 1: Provinces
<LocationHierarchySelector
  dataSource={chinaProvinces}
  label="省份"
  value={province}
  onValueChange={setProvince}
  displayFormat="native"  // Chinese only
  locale="zh"
/>

// Level 2: Cities
<LocationHierarchySelector
  getDataByParent={getCitiesByProvince}
  parentId={province}
  label="城市"
  value={city}
  onValueChange={setCity}
  displayFormat="native"
  locale="zh"
/>
```

### Singapore (1-Level - Districts Only)

```javascript
// Single level: Districts
<LocationHierarchySelector
  dataSource={singaporeDistricts}
  label="District"
  value={district}
  onValueChange={setDistrict}
  displayFormat="english"
  locale="en"
/>
```

### Malaysia (2-Level Hierarchy)

```javascript
// Level 1: States
<LocationHierarchySelector
  dataSource={malaysiaStates}
  label="Negeri (State)"
  value={state}
  onValueChange={setState}
  displayFormat="bilingual"
/>

// Level 2: Districts
<LocationHierarchySelector
  getDataByParent={getDistrictsByState}
  parentId={state}
  label="Daerah (District)"
  value={district}
  onValueChange={setDistrict}
  displayFormat="bilingual"
/>
```

### Hong Kong (1-Level - Districts)

```javascript
<LocationHierarchySelector
  dataSource={hongKongDistricts}
  label="區 (District)"
  value={district}
  onValueChange={setDistrict}
  displayFormat="bilingual"
  locale="zh"
/>
```

---

## Data Format Requirements

Your location data should follow this structure:

```javascript
// Minimal required fields
{
  name: "Bangkok",           // Required: Primary name
  code: "BKK",              // Recommended: Unique code
  id: "10",                 // Optional: Unique ID (preferred over code)
}

// Full bilingual format (recommended)
{
  id: "10",
  code: "BKK",
  name: "Bangkok",          // English name
  nameEn: "Bangkok",        // Explicit English
  nameZh: "曼谷",           // Chinese name
  nameTh: "กรุงเทพมหานคร",  // Thai name (or any local language)
  nameLocal: "กรุงเทพมหานคร", // Alternative to nameTh
  postalCode: "10200",      // Optional: for showPostalCode
  flag: "🇹🇭",              // Optional: for icon display
  parentCode: "TH",         // Optional: for parent reference
}
```

### Getter Function Format

```javascript
/**
 * Returns locations based on parent ID
 * @param {string} parentId - Parent location ID/code
 * @returns {Array} - Array of location objects
 */
export function getDistrictsByProvince(provinceCode) {
  return districts.filter(d => d.provinceCode === provinceCode);
}
```

---

## Display Formats

### `displayFormat="bilingual"` (Default)
Shows: `"Bangkok - 曼谷"`
- Primary name in English
- Secondary name in Chinese (or local language)
- Falls back gracefully if one is missing

### `displayFormat="native"`
Shows: `"曼谷"` (based on locale)
- Shows only local language name
- Uses `nameZh` for Chinese locale
- Uses `nameTh`/`nameLocal` for other locales

### `displayFormat="english"`
Shows: `"Bangkok"`
- English name only
- Uses `nameEn` or falls back to `name`

### `showPostalCode={true}`
Shows: `"Bangkok - 曼谷 (10200)"`
- Appends postal code if available
- Works with any display format

### Custom Display Format
```javascript
<LocationHierarchySelector
  getDisplayLabel={(location, isChinese) => {
    // Your custom format
    return isChinese
      ? `${location.nameZh} (${location.code})`
      : `${location.nameEn} - ${location.code}`;
  }}
/>
```

---

## Props Reference

### Core Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | string | No | Field label |
| `value` | string | No | Current value (code or name) |
| `selectedId` | string | No | Current value by ID (preferred over `value`) |
| `onSelect` | function | No | Callback with full location object: `(location) => void` |
| `onValueChange` | function | No | Simple callback: `(code) => void` |

### Data Source Props (provide ONE)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `dataSource` | array | Conditional | Static array of locations (for top level) |
| `getDataByParent` | function | Conditional | Function that returns locations by parent ID |
| `parentId` | string | Conditional | Required if using `getDataByParent` |

### Display Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `displayFormat` | string | `'bilingual'` | `'bilingual'` \| `'native'` \| `'english'` \| `'custom'` |
| `getDisplayLabel` | function | null | Custom label function: `(location, isChinese) => string` |
| `showPostalCode` | boolean | `false` | Append postal code to label |
| `locale` | string | null | Override locale (defaults to context) |

### Message Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | string | `'请选择'` | Placeholder text |
| `emptyMessage` | string | `'没有可用的选项'` | Shown when no data |
| `parentRequiredMessage` | string | `'请先选择上级'` | Shown when parent not selected |

### BaseSearchableSelector Props

All props from `BaseSearchableSelector` are supported:

| Prop | Type | Default |
|------|------|---------|
| `error` | boolean | `false` |
| `errorMessage` | string | - |
| `helpText` | string | - |
| `showSearch` | boolean | `true` |
| `searchPlaceholder` | string | `'搜索...'` |
| `modalTitle` | string | `'请选择'` |
| `style` | object | - |

---

## Migration from Old Selectors

### From ProvinceSelector

**Before:**
```javascript
<ProvinceSelector
  label="选择省份"
  value={province}
  onValueChange={setProvince}
  regionsData={thailandProvinces}
  getDisplayNameFunc={getProvinceDisplayName}
/>
```

**After:**
```javascript
<LocationHierarchySelector
  label="选择省份"
  value={province}
  onValueChange={setProvince}
  dataSource={thailandProvinces}
  displayFormat="bilingual"
/>
```

### From DistrictSelector

**Before:**
```javascript
<DistrictSelector
  label="选择区"
  provinceCode={provinceCode}
  value={district}
  selectedDistrictId={districtId}
  onSelect={(district) => handleSelectDistrict(district)}
/>
```

**After:**
```javascript
<LocationHierarchySelector
  label="选择区"
  getDataByParent={getDistrictsByProvince}
  parentId={provinceCode}
  value={district}
  selectedId={districtId}
  onSelect={(district) => handleSelectDistrict(district)}
  displayFormat="bilingual"
/>
```

### From SubDistrictSelector

**Before:**
```javascript
<SubDistrictSelector
  label="选择街道"
  districtId={districtId}
  value={subDistrict}
  selectedSubDistrictId={subDistrictId}
  onSelect={(sd) => handleSelectSubDistrict(sd)}
/>
```

**After:**
```javascript
<LocationHierarchySelector
  label="选择街道"
  getDataByParent={getSubDistrictsByDistrictId}
  parentId={districtId}
  value={subDistrict}
  selectedId={subDistrictId}
  onSelect={(sd) => handleSelectSubDistrict(sd)}
  showPostalCode={true}
  displayFormat="bilingual"
/>
```

---

## Advanced Use Cases

### Custom Filter Function

```javascript
<LocationHierarchySelector
  dataSource={locations}
  // Add custom search that includes postal codes
  filterOptions={(options, searchText) => {
    const search = searchText.toLowerCase();
    return options.filter(opt =>
      opt.label.toLowerCase().includes(search) ||
      opt._locationData?.postalCode?.includes(search)
    );
  }}
/>
```

### Conditional Display Format

```javascript
const [displayMode, setDisplayMode] = useState('bilingual');

<LocationHierarchySelector
  dataSource={provinces}
  displayFormat={displayMode}
  // User can toggle between English/Chinese/Both
/>
```

### With Icons/Flags

```javascript
<LocationHierarchySelector
  dataSource={countries}
  getDisplayLabel={(location) =>
    `${location.flag} ${location.name}`
  }
/>
```

---

## Testing

```javascript
// Test component
import { LocationHierarchySelector } from '../components/shared';

// Mock data
const mockProvinces = [
  { id: '1', code: 'BKK', name: 'Bangkok', nameZh: '曼谷' },
  { id: '2', code: 'CNX', name: 'Chiang Mai', nameZh: '清迈' },
];

// Test render
<LocationHierarchySelector
  dataSource={mockProvinces}
  label="Test Selector"
  value={selectedProvince}
  onValueChange={setSelectedProvince}
/>
```

---

## Best Practices

1. **Always provide either `dataSource` OR `getDataByParent` + `parentId`**
   - Don't provide both
   - Don't provide neither

2. **Use `selectedId` for ID-based selection, `value` for code/name-based**
   - Prefer `selectedId` when working with database IDs
   - Use `value` for simple code-based lookups

3. **Provide both `onSelect` and `onValueChange` when you need the full object**
   - `onSelect` gives you the complete location data
   - `onValueChange` gives you just the code/ID

4. **Set appropriate empty state messages**
   - Helps users understand why the selector is disabled
   - Improves UX for hierarchical selections

5. **Use consistent display format across your app**
   - Stick to one format per country for consistency
   - Thailand/Malaysia: `bilingual`
   - China: `native`
   - Singapore: `english`

---

## Troubleshooting

### Selector shows "没有可用的选项"
- Check that `dataSource` or `getDataByParent` returns a valid array
- Verify data structure matches expected format
- Check console for error logs

### Selected value not displaying correctly
- Ensure `value` or `selectedId` matches a location in your data
- Check that location objects have `id`, `code`, or `name` fields
- Verify `getDisplayLabel` or `displayFormat` is working correctly

### Parent-child relationship not working
- Confirm `parentId` is being passed and is valid
- Check that `getDataByParent` filters correctly by parent ID
- Ensure child data has `parentCode` or equivalent field

---

## Performance Notes

- Component memoizes options and display functions
- Search filtering is optimized for large datasets
- No unnecessary re-renders when parent data changes
- Works efficiently with 1000+ locations per level
