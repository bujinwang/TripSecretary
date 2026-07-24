# Pre-commit Hooks Setup

## Overview

This project uses **husky** and **lint-staged** to automatically run linting and formatting checks before commits, ensuring code quality and consistency.

## What It Does

When you commit code, the pre-commit hook automatically:

1. **Runs ESLint** on staged `.js` and `.jsx` files
2. **Auto-fixes** fixable issues (formatting, missing braces, etc.)
3. **Blocks commits** if there are linting errors or warnings
4. **Formats** JSON and Markdown files with Prettier

## Configuration

### Husky

Located in `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### Lint-staged

Configured in `package.json`:
```json
{
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix --max-warnings=0"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

## How It Works

1. **You stage files** with `git add`
2. **You commit** with `git commit`
3. **Pre-commit hook runs** automatically
4. **Lint-staged** runs ESLint on staged files only
5. **Auto-fixes** are applied automatically
6. **If errors remain**, the commit is blocked

## Behavior

### ✅ Commit Succeeds When:
- All staged files pass ESLint (no errors, no warnings)
- Auto-fixes are applied successfully
- Files are formatted correctly

### ❌ Commit Fails When:
- ESLint finds errors in staged files
- ESLint finds warnings in staged files (with `--max-warnings=0`)
- Auto-fix cannot resolve all issues

## Usage

### Normal Workflow

```bash
# Stage your changes
git add app/components/Button.js

# Commit (pre-commit hook runs automatically)
git commit -m "Update Button component"

# If linting fails, fix issues and try again
```

### Bypassing Hooks (Not Recommended)

If you need to bypass hooks (e.g., for emergency fixes):

```bash
git commit --no-verify -m "Emergency fix"
```

**Warning:** Only use `--no-verify` when absolutely necessary. It bypasses all quality checks.

### Testing the Hook

Test the pre-commit hook without committing:

```bash
# Stage a test file
git add app/components/Button.js

# Run lint-staged manually
npx lint-staged

# Or test the full hook
.husky/pre-commit
```

## Troubleshooting

### Issue: Hook Not Running

**Solution:**
```bash
# Reinstall husky hooks
npm run prepare

# Or manually initialize
npx husky install
```

### Issue: ESLint Errors Blocking Commit

**Solution:**
1. Run `npm run lint:fix` to auto-fix issues
2. Manually fix remaining errors
3. Stage the fixed files
4. Try committing again

### Issue: Too Many Warnings

**Solution:**
- Fix warnings in staged files
- Or temporarily adjust `--max-warnings` in `package.json` (not recommended)

### Issue: Hook Takes Too Long

**Solution:**
- Lint-staged only runs on staged files, so it should be fast
- If slow, check if you're staging too many files
- Consider using `.gitignore` to exclude large files

## Customization

### Adjusting Warnings Threshold

Edit `package.json`:
```json
{
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix --max-warnings=10"  // Allow up to 10 warnings
    ]
  }
}
```

### Adding More Checks

Add to `lint-staged` in `package.json`:
```json
{
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix --max-warnings=0",
      "jest --findRelatedTests"  // Run tests for changed files
    ]
  }
}
```

### Running Tests Before Commit

Add to `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm test -- --findRelatedTests
```

## Best Practices

1. **Fix issues immediately** - Don't bypass hooks
2. **Run lint:fix locally** - Fix issues before committing
3. **Commit small changes** - Easier to fix issues
4. **Keep hooks enabled** - Ensures code quality
5. **Review auto-fixes** - Check what ESLint changed

## Benefits

✅ **Prevents bad code** from entering the repository
✅ **Enforces consistency** across the codebase
✅ **Catches errors early** before they reach CI/CD
✅ **Auto-fixes issues** automatically when possible
✅ **Saves time** by catching issues before review

## Related Documentation

- [ESLint Configuration](./ESLINT_CONFIGURATION.md)
- [Code Review](./CODE_REVIEW.md)
- [Production Logging](./PRODUCTION_LOGGING_SETUP.md)

