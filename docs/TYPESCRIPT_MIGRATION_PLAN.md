# TypeScript Migration Plan

## Current State Analysis

### ✅ Already in Place
- **TypeScript installed**: v5.9.2
- **tsconfig.json**: Configured with Expo base config
- **App source tree**: 100% `.ts`/`.tsx` as of 2025-02-14 (340 files migrated in one batch)
- **Backend**: Cloudflare backend already uses TypeScript
- **Path aliases**: Configured (`@app/*`, `@tamagui/*`)

### 📊 Migration Scope
- **Remaining `.js` in `app/`**: 0 (post-automation milestone on 2025-02-14)
- **Other JS**: Tooling/scripts/config outside `app/` remain JavaScript by design
- **Current focus**: Gradually add types, remove `@ts-nocheck`, tighten compiler options

## Benefits of TypeScript Migration

### 🎯 Immediate Benefits
1. **Type Safety**: Catch errors at compile time, not runtime
2. **Better IDE Support**: Autocomplete, refactoring, navigation
3. **Self-Documenting Code**: Types serve as inline documentation
4. **Refactoring Confidence**: Safe to rename and restructure
5. **Reduced Bugs**: Prevent common mistakes (null checks, wrong props, etc.)

### 📈 Long-term Benefits
1. **Easier Onboarding**: New developers understand code faster
2. **Better Maintainability**: Easier to understand and modify
3. **Improved Testing**: Type checking catches issues before tests
4. **Team Scalability**: Easier to work in parallel without conflicts

## Migration Strategy: Incremental Approach

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up infrastructure for gradual migration

1. **Update tsconfig.json**
   - Enable `allowJs: true` (already supported)
   - Add strict mode gradually
   - Configure path mappings

2. **Add TypeScript ESLint**
   - Install `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`
   - Configure ESLint to handle both JS and TS files

3. **Create Type Definitions**
   - Start with shared types (navigation, route params, configs)
   - Create `app/types/` directory for shared types

### Phase 2: New Code Only (Week 3-4)
**Goal**: All new code in TypeScript

1. **Policy**: All new files must be `.ts`/`.tsx`
2. **Convert as you touch**: When modifying a file, convert to TS
3. **Focus areas**: New features, bug fixes, refactoring

### Phase 3: Critical Paths (Month 2-3)
**Goal**: Migrate high-impact files

**Priority Order:**
1. **Services** (`app/services/`)
   - Most reusable code
   - High value from type safety
   - Examples: `LoggingService`, `TDACAPIService`, `UserDataService`

2. **Templates** (`app/templates/`)
   - Core reusable components
   - Complex prop types benefit from TS
   - Examples: `EnhancedTravelInfoTemplate`, `EntryFlowScreenTemplate`

3. **Hooks** (`app/hooks/`)
   - Shared logic
   - Type safety prevents hook misuse
   - Examples: Custom hooks for templates

4. **Utils** (`app/utils/`)
   - Pure functions
   - Easy to type
   - High reusability

### Phase 4: Components (Month 3-4)
**Goal**: Migrate component files

1. **Shared Components** (`app/components/shared/`)
2. **Country-specific Components** (`app/components/{country}/`)
3. **Screen Components** (`app/screens/`)

### Phase 5: Config & Data (Month 4-5)
**Goal**: Migrate configuration and data files

1. **Config files** (`app/config/`)
2. **Data files** (`app/data/`)
3. **Models** (`app/models/`)

## Recommended Approach: Start Small

### ✅ **YES, Start Migration** - But Incrementally

**Why Start Now:**
1. ✅ TypeScript already installed
2. ✅ Some TS files already exist
3. ✅ Infrastructure is ready
4. ✅ Incremental migration is low-risk
5. ✅ Can start with new code only

**Recommended First Steps:**

1. **Update tsconfig.json** for better strictness
2. **Add TypeScript ESLint** support
3. **Create shared type definitions** (navigation, route params)
4. **Migrate one service** as a proof of concept (e.g., `LoggingService`)
5. **Set policy**: All new code in TypeScript

### ⚠️ **Considerations**

**Challenges:**
- Large codebase (672 files)
- React Native type definitions can be complex
- Some libraries may need type definitions
- Team learning curve

**Mitigation:**
- Start with `allowJs: true` (can coexist)
- Migrate incrementally (no big bang)
- Focus on new code first
- Convert files as you touch them
- Use `any` temporarily if needed (migrate later)

## Implementation Plan

### Step 1: Update TypeScript Configuration

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "baseUrl": ".",
    "types": ["tamagui"],
    "paths": {
      "@app/*": ["app/*"],
      "@tamagui/*": ["app/tamagui/*"],
      "@tamaguiConfig": ["tamagui.config"]
    },
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noImplicitAny": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["app/**/*", "*.js", "*.ts", "*.tsx"],
  "exclude": ["node_modules", "android", "ios"]
}
```

### Step 2: Add TypeScript ESLint

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Update `.eslintrc.json` to support both JS and TS files.

### Step 3: Create Type Definitions

Create `app/types/` directory:
- `navigation.d.ts` - Navigation types
- `route.d.ts` - Route param types
- `config.d.ts` - Config types
- `services.d.ts` - Service types

### Step 4: Migrate First Service

Start with `LoggingService.js` → `LoggingService.ts` as proof of concept.

## Migration Checklist

- [ ] Update `tsconfig.json` with proper settings
- [ ] Add TypeScript ESLint support
- [ ] Create `app/types/` directory with shared types
- [ ] Migrate `LoggingService.js` → `LoggingService.ts` (proof of concept)
- [ ] Update imports to use new TS file
- [ ] Set policy: All new code in TypeScript
- [ ] Document migration progress
- [ ] Create migration guide for team

## Success Metrics

- **New code**: 100% TypeScript within 1 month
- **Critical paths**: Services and templates migrated within 3 months
- **Overall**: 50%+ migrated within 6 months
- **Type coverage**: Gradually increase strictness

## Recommendation

**✅ YES, start the migration incrementally**

**Start with:**
1. Foundation setup (tsconfig, ESLint)
2. Shared type definitions
3. One service migration (proof of concept)
4. Policy: All new code in TypeScript

**Benefits:**
- Low risk (incremental, can coexist)
- High value (type safety, better DX)
- Already partially set up
- Can start immediately

**Timeline:**
- **Week 1**: Foundation + first service
- **Month 1**: New code only in TS
- **Month 2-3**: Critical paths (services, templates)
- **Month 4-6**: Components and screens

This approach allows you to get immediate benefits while gradually improving the codebase without disrupting current development.
