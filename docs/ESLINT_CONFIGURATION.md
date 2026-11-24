# ESLint Configuration

## Overview

This document describes the ESLint configuration for the TripSecretary application, including strict rules for code quality and React best practices.

## Configuration Highlights

### Core Rules

**Code Quality:**
- `eqeqeq`: Enforces strict equality (`===` and `!==`)
- `curly`: Requires braces for all control statements
- `brace-style`: Enforces 1TBS (One True Brace Style)
- `prefer-const`: Requires `const` for variables that are never reassigned
- `no-var`: Disallows `var` declarations
- `camelcase`: Enforces camelCase naming (with exceptions for constants)

**Error Prevention:**
- `no-debugger`: Disallows `debugger` statements
- `no-eval`: Disallows `eval()`
- `no-implied-eval`: Disallows implied `eval()`
- `no-throw-literal`: Requires throwing Error objects
- `no-async-promise-executor`: Prevents async promise executors
- `no-promise-executor-return`: Prevents returning values from promise executors

**Modern JavaScript:**
- `prefer-template`: Encourages template literals over string concatenation
- `prefer-arrow-callback`: Encourages arrow functions for callbacks
- `arrow-body-style`: Enforces concise arrow function bodies
- `object-shorthand`: Encourages object method shorthand
- `prefer-destructuring`: Encourages destructuring for objects

### React Rules

**Component Best Practices:**
- `react/prop-types`: Warns on missing PropTypes
- `react/display-name`: Warns on missing display names
- `react/jsx-key`: Errors on missing keys in lists
- `react/jsx-no-duplicate-props`: Errors on duplicate props
- `react/jsx-no-undef`: Errors on undefined JSX elements

**React Hooks:**
- `react-hooks/rules-of-hooks`: **ERROR** - Enforces Rules of Hooks
- `react-hooks/exhaustive-deps`: Warns on missing dependencies

### Logging

- `no-console`: Warns on console statements (allows `console.error` and `console.warn`)
- Use `LoggingService` instead of direct console statements

### File-Specific Overrides

**Test Files:**
- Relaxed rules for `require-await`, `no-await-in-loop`, `prefer-arrow-callback`
- Jest environment enabled

**Security Files:**
- Relaxed camelcase rules for database schema compatibility

**Scripts:**
- Relaxed camelcase rules for script compatibility

## Key Rules Explained

### `react-hooks/rules-of-hooks: "error"`

**Critical:** This rule ensures hooks are called in the correct order. Violations can cause runtime errors.

**Example:**
```javascript
// ❌ ERROR: Hook called conditionally
function Component({ config }) {
  if (!config) return null;
  const { t } = useLocale(); // ERROR: Hook after conditional return
}

// ✅ CORRECT: All hooks before any returns
function Component({ config }) {
  const { t } = useLocale(); // Hook first
  if (!config) return null; // Return after hooks
}
```

### `curly: ["error", "all"]`

**Enforces:** All control statements must use braces, even for single-line blocks.

**Example:**
```javascript
// ❌ ERROR: Missing braces
if (condition) return value;

// ✅ CORRECT: Braces required
if (condition) {
  return value;
}
```

### `no-promise-executor-return: "error"`

**Prevents:** Returning values from promise executor functions (which are ignored).

**Example:**
```javascript
// ❌ ERROR: setTimeout returns a value
await new Promise(resolve => setTimeout(resolve, 10));

// ✅ CORRECT: Wrap in arrow function
await new Promise(resolve => {
  setTimeout(() => resolve(), 10);
});
```

### `no-console: ["warn", { "allow": ["warn", "error"] }]`

**Enforces:** Use `LoggingService` instead of `console.log`, but allows `console.error` and `console.warn` for critical error tracking.

**Example:**
```javascript
// ❌ WARNING: Use LoggingService
console.log('User action', data);

// ✅ CORRECT: Use LoggingService
logger.debug('User action', data);

// ✅ ALLOWED: Critical errors
console.error('Critical error', error);
```

## Migration Guide

### Replacing console.log

```javascript
// Before
console.log('Debug info', data);

// After
import LoggingService from './services/LoggingService';
const logger = LoggingService.for('ComponentName');
logger.debug('Debug info', data);
```

### Fixing Missing Braces

```javascript
// Before
if (condition) return value;

// After
if (condition) {
  return value;
}
```

### Fixing Promise Executors

```javascript
// Before
await new Promise(resolve => setTimeout(resolve, 100));

// After
await new Promise(resolve => {
  setTimeout(() => resolve(), 100);
});
```

## Running ESLint

**Check for errors:**
```bash
npm run lint
```

**Auto-fix issues:**
```bash
npm run lint:fix
```

**Check specific files:**
```bash
npx eslint app/components/Button.js
```

## IDE Integration

Most IDEs support ESLint integration:

**VS Code:**
- Install "ESLint" extension
- Errors and warnings will show inline
- Auto-fix on save available

**WebStorm/IntelliJ:**
- Built-in ESLint support
- Enable in Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint

## Common Issues and Solutions

### Issue: "Hook called conditionally"
**Solution:** Move all hooks to the top of the component, before any conditional returns.

### Issue: "Missing braces"
**Solution:** Add braces around all control statement bodies.

### Issue: "no-promise-executor-return"
**Solution:** Wrap setTimeout/setInterval in an arrow function that doesn't return a value.

### Issue: "no-console warning"
**Solution:** Replace with `LoggingService` methods.

## Best Practices

1. **Fix errors immediately** - Don't ignore ESLint errors
2. **Use auto-fix** - Run `npm run lint:fix` before committing
3. **Review warnings** - Address warnings when possible
4. **Keep config updated** - Review and update rules as the codebase evolves
5. **Document exceptions** - Use `eslint-disable` comments sparingly and document why

## Future Enhancements

- Consider adding TypeScript-specific rules when migrating
- Add accessibility rules (`eslint-plugin-jsx-a11y`)
- Add import ordering rules (`eslint-plugin-import`)
- Add performance rules for React Native

