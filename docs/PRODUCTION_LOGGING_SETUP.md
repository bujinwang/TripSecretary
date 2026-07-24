# Production Logging Configuration

## Overview

This document describes the production logging setup that ensures debug logs are removed from production builds while maintaining error tracking capabilities.

## Implementation

### 1. LoggingService

The `LoggingService` provides a centralized logging interface with:

- **Environment-based log levels**: Automatically sets DEBUG in development, INFO in production
- **Component-based logging**: Each logger is scoped to a component/module
- **Structured logging**: Supports metadata and error objects
- **Production-safe**: Uses `__DEV__` to determine log level

**Log Levels:**
- `DEBUG` (0): Only in development
- `INFO` (1): Default in production
- `WARN` (2): Always enabled
- `ERROR` (3): Always enabled

**Usage:**
```javascript
import LoggingService from './services/LoggingService';

const logger = LoggingService.for('MyComponent');

logger.debug('Debug message', { data: 'only in dev' });
logger.info('Info message', { data: 'in production too' });
logger.warn('Warning message', { context: 'always logged' });
logger.error('Error occurred', error, { context: 'always logged' });
```

### 2. Babel Plugin Configuration

**Plugin:** `babel-plugin-transform-remove-console`

**Configuration:** `babel.config.js`

- **Production builds**: Removes `console.log`, `console.debug`, `console.info`
- **Keeps**: `console.error` and `console.warn` for critical error tracking
- **Development**: All console statements remain for debugging
- **Tests**: Console statements preserved for test output

**Benefits:**
- Reduces bundle size
- Improves runtime performance
- Maintains error tracking in production
- No code changes needed - automatic at build time

### 3. Build Configuration

**Production Build:**
```bash
# Expo automatically uses production mode
expo build:android --type apk
expo build:ios --type archive

# Or with EAS
eas build --platform android --profile production
```

**Development Build:**
```bash
# Development mode (all logs enabled)
expo start
```

## Migration Status

### ✅ Completed
- LoggingService created with environment-based log levels
- Babel plugin installed and configured
- Console statements replaced in critical files:
  - `TDACAPIService.js`: 163 → 0
  - `TDACSubmissionLogger.js`: 103 → 0

### 📋 Remaining
- Replace console statements in remaining files (~30 warnings)
- Update example/test files to use LoggingService

## Best Practices

1. **Use LoggingService instead of console statements**
   ```javascript
   // ❌ Don't
   console.log('User action', data);
   
   // ✅ Do
   logger.debug('User action', data);
   ```

2. **Use appropriate log levels**
   - `debug()`: Detailed debugging info (dev only)
   - `info()`: General information (prod too)
   - `warn()`: Warnings that need attention
   - `error()`: Errors that need investigation

3. **Include context in error logs**
   ```javascript
   logger.error('API request failed', error, {
     endpoint: '/api/users',
     method: 'POST',
     statusCode: 500
   });
   ```

4. **Use component-based loggers**
   ```javascript
   // Create logger once per component
   const logger = LoggingService.for('UserService');
   
   // Use throughout the component
   logger.debug('Fetching user', { userId });
   ```

## Verification

To verify production logging is working:

1. **Check babel config**: Ensure `transform-remove-console` is in production plugins
2. **Build production bundle**: Check that console.log statements are removed
3. **Test error logging**: Verify console.error still works in production
4. **Check bundle size**: Should see reduction from removed console statements

## Troubleshooting

**Issue**: Logs still appearing in production
- **Solution**: Ensure you're building with `--type release` or production profile
- **Check**: Verify `__DEV__` is false in production builds

**Issue**: Errors not logging in production
- **Solution**: Verify babel config excludes 'error' and 'warn' from removal
- **Check**: Ensure LoggingService.error() uses console.error

**Issue**: LoggingService not respecting log levels
- **Solution**: Check that `__DEV__` is properly set in your build environment
- **Debug**: Call `LoggingService.getLogLevel()` to verify current level

