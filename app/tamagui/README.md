# Tamagui Integration

This directory contains the Tamagui setup and exports for the TripSecretary app.

## Phase 0 - Tamagui Enablement ✅

Phase 0 setup is complete! The following items have been implemented:

### ✅ Installation & Configuration

- **Dependencies**: Tamagui v1.135.4 + all required peer dependencies installed
- **Babel**: Configured with `@tamagui/babel-plugin` for optimized builds
- **Metro**: Configured with `watchTamaguiConfig` for hot reloading
- **App Entry**: Wrapped with `TamaguiProvider` in `App.js`

### ✅ Design System Tokens

All existing TripSecretary design tokens have been mapped to Tamagui:

#### Colors (from `app/theme/colors.js`)
- Primary colors: `$primary`, `$primaryDark`, `$primaryLight`
- Secondary: `$secondary`
- Status: `$success`, `$warning`, `$danger`
- Backgrounds: `$background`, `$backgroundLight`, `$card`, `$white`
- Borders: `$borderColor`, `$divider`
- Text: `$text`, `$textSecondary`, `$textTertiary`, `$textDisabled`
- Overlays: `$overlay`, `$overlayStrong`
- Shadow: `$shadowColor`

#### Spacing (from `app/theme/spacing.js`)
- Space tokens: `$xs` (4px), `$sm` (8px), `$md` (16px), `$lg` (24px), `$xl` (32px), `$xxl` (48px)
- Border radius: `$sm` (8px), `$md` (12px), `$lg` (16px), `$xl` (24px), `$full` (9999px)

#### Typography (from `app/theme/typography.js`)
- Font families: `$body`, `$heading`, `$mono`
- Font sizes: `$1` (14px caption), `$2` (16px body1), `$3` (18px body2), `$4` (20px h3), `$5` (24px h2)
- Font weights: Configured for regular, medium, semiBold, bold

### ✅ Theme Variants

- **Light theme**: Default theme using existing design tokens
- **Dark theme**: Prepared for future dark mode support

### ✅ Base Primitives

All base Tamagui primitives are exported from `app/tamagui/index.ts`:

```typescript
import {
  // Layout
  Stack, XStack, YStack,

  // Typography
  Text, Heading, Paragraph, SizableText,

  // Components
  Button, Card, Input, Label,

  // Utilities
  Separator, ScrollView, Spinner,

  // Hooks & Context
  Theme, useTheme, TamaguiProvider,
} from './app/tamagui';
```

## Usage

### Importing Components

```typescript
// Import from the centralized tamagui module
import { YStack, Text, Button, Card } from './app/tamagui';

// Use Tamagui design tokens
<YStack space="$md" padding="$lg" backgroundColor="$background">
  <Text fontSize="$3" color="$text">Hello World</Text>
  <Button theme="active">Click Me</Button>
</YStack>
```

### Using Design Tokens

Tamagui tokens can be used directly in component props:

```typescript
// Spacing
<YStack padding="$md" margin="$lg" space="$sm">

// Colors
<Text color="$primary">Primary text</Text>
<YStack backgroundColor="$card" borderColor="$borderColor">

// Typography
<Text fontSize="$3" fontWeight="600">Emphasized text</Text>
```

### Theme Access

```typescript
import { useTheme } from './app/tamagui';

function MyComponent() {
  const theme = useTheme();

  // Access theme values programmatically
  console.log(theme.primary.val); // #07C160
}
```

## Testing

A test screen is available at `app/tamagui/TamaguiTestScreen.tsx` that demonstrates:
- All color tokens
- Spacing system
- Form elements (Input, Label, Button)
- Typography sizes
- Card component with elevation

To test Tamagui in your app, you can temporarily navigate to this screen.

## Next Steps - Phase 1

Phase 1 will convert Thailand-specific UI components to Tamagui:
- Input & InputWithValidation
- OptionSelector & GenderSelector
- CollapsibleSection
- ProgressOverviewCard
- Form utility styling (error states, validation, focus glow)

## Resources

- [Tamagui Documentation](https://tamagui.dev)
- [Tamagui Tokens Guide](https://tamagui.dev/docs/core/configuration)
- [TripSecretary Design Spec](../docs/UI设计规范.md)

## Configuration Files

- Main config: `/tamagui.config.ts`
- Babel config: `/babel.config.js`
- Metro config: `/metro.config.js`
- App entry: `/App.js`
