# GlassCard Component - Integration Guide

## Overview

The `GlassCard` component implements the modern "Liquid Glass" (translucent, frosted-glass) design style introduced in iOS 26. It provides a reusable, performant, and accessible way to add glass-effect cards to your React Native iOS application.

## Features

✅ Native iOS blur effects using `@react-native-community/blur`
✅ Automatic light/dark mode adaptation
✅ Accessibility support (Reduce Transparency fallback)
✅ Customizable blur intensity, tint color, and border styling
✅ Performance-optimized with React.memo and useMemo
✅ TypeScript support with full type definitions
✅ iOS 10+ compatibility, optimized for iOS 13+

## Installation

### Step 1: Install Dependencies

```bash
npm install @react-native-community/blur
# or
yarn add @react-native-community/blur
```

### Step 2: Install iOS Pods

```bash
cd ios && pod install && cd ..
```

### Step 3: Rebuild Your App

```bash
npx react-native run-ios
```

## Quick Start

### Basic Usage

```tsx
import { GlassCard } from './components/GlassCard';

export const MyScreen = () => {
  return (
    <GlassCard>
      <Text>Hello, Glass Effect!</Text>
    </GlassCard>
  );
};
```

### With Custom Props

```tsx
<GlassCard
  tintColor="rgba(100, 150, 255, 0.4)"
  blurAmount={90}
  cornerRadius={20}
  showShadow={true}
  borderWidth={1.5}
  style={{ margin: 20, padding: 16 }}
>
  <Text>Custom Glass Card</Text>
</GlassCard>
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | **Required** | Content to render inside the glass card |
| `tintColor` | `string` | Auto (based on theme) | Overlay tint color (e.g., `'rgba(255,255,255,0.6)'`) |
| `blurType` | `BlurType` | `'light'` / `'dark'` | iOS blur type: `'xlight'`, `'light'`, `'dark'`, `'prominent'`, etc. |
| `blurAmount` | `number` | `80` | Blur intensity (0-100) |
| `cornerRadius` | `number` | `16` | Border radius in pixels |
| `style` | `ViewStyle` | `undefined` | Additional styles (margin, size, etc.) |
| `showShadow` | `boolean` | `true` | Enable drop shadow effect |
| `borderWidth` | `number` | `1` | Border rim width (set to 0 to disable) |
| `borderColor` | `string` | Auto (based on theme) | Border rim color |

### Blur Types (iOS)

- `'xlight'` - Extra light blur
- `'light'` - Light blur (default for light mode)
- `'dark'` - Dark blur (default for dark mode)
- `'regular'` - Regular material blur
- `'prominent'` - Prominent material blur (strongest effect)
- `'chromeMaterial'` - Chrome material
- `'material'` - System material
- `'thickMaterial'` - Thick material
- `'thinMaterial'` - Thin material
- `'ultraThinMaterial'` - Ultra thin material

## Examples

### Over an Image

```tsx
<ImageBackground source={{ uri: 'your-image-url' }}>
  <GlassCard
    tintColor="rgba(255, 255, 255, 0.5)"
    blurAmount={90}
  >
    <Text>Frosted glass over image</Text>
  </GlassCard>
</ImageBackground>
```

### Dark Mode Card

```tsx
const colorScheme = useColorScheme();

<GlassCard
  tintColor={colorScheme === 'dark'
    ? 'rgba(28, 28, 30, 0.7)'
    : 'rgba(255, 255, 255, 0.6)'
  }
  blurType={colorScheme === 'dark' ? 'dark' : 'light'}
>
  <Text>Auto-adapting card</Text>
</GlassCard>
```

### Minimal Style (No Border/Shadow)

```tsx
<GlassCard
  borderWidth={0}
  showShadow={false}
  cornerRadius={12}
>
  <Text>Clean, minimal glass effect</Text>
</GlassCard>
```

## Testing

### On iOS Simulator

```bash
npx react-native run-ios
```

**Note:** Blur effects appear less pronounced in the simulator. Test on a real device for accurate results.

### On iOS Device

1. Connect your device
2. Run: `npx react-native run-ios --device "Your Device Name"`
3. Test in different scenarios:
   - Toggle light/dark mode (Control Center)
   - Enable "Reduce Transparency" (Settings → Accessibility → Display & Text Size)
   - Place cards over different backgrounds (images, gradients, scrollable content)

### Viewing the Example Screen

The package includes a full example screen demonstrating various configurations:

```tsx
import { GlassCardExampleScreen } from './components/GlassCardExampleScreen';

// Add to your navigator
<Stack.Screen
  name="GlassCardExample"
  component={GlassCardExampleScreen}
/>
```

## Performance Considerations

### ✅ Best Practices

- **Limit blur regions**: Keep glass cards reasonably sized (avoid full-screen blur)
- **Avoid deep nesting**: Don't stack multiple BlurViews on top of each other
- **Use memoization**: The component already uses React.memo; avoid unnecessary re-renders
- **Test on older devices**: Performance may vary on devices with A11 chip or older

### ⚠️ Performance Impact

Blur effects use GPU rendering and can impact performance on:
- Older iOS devices (pre-A12 Bionic chip)
- When rendering many glass cards simultaneously
- When combined with other heavy animations

**Solution**: The component automatically falls back to solid backgrounds when "Reduce Transparency" is enabled.

## Accessibility

The component automatically detects iOS accessibility settings:

- **Reduce Transparency Enabled**: Uses solid backgrounds instead of blur
- **High Contrast**: Border rim becomes more visible
- **VoiceOver**: All content remains accessible (BlurView is transparent to accessibility APIs)

## Troubleshooting

### Blur Effect Not Visible

1. **Check device**: Blur is subtle in simulator; test on real device
2. **Verify background**: Ensure there's visible content behind the card
3. **Check transparency setting**: Disable "Reduce Transparency" in iOS settings
4. **Adjust blur amount**: Try higher values (90-100)

### Build Errors

```bash
# Clear cache and rebuild
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx react-native run-ios
```

### TypeScript Errors

Ensure `@react-native-community/blur` types are installed:

```bash
npm install --save-dev @types/react-native-community__blur
```

## Trade-offs & Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Use `@react-native-community/blur`** | Most mature, performant blur library for React Native with native iOS support |
| **Layer structure (Blur → Tint → Content)** | Provides maximum control over glass appearance while maintaining performance |
| **Reduce Transparency fallback** | Ensures accessibility compliance and better performance for users who need it |
| **Default blur amount: 80** | Balances visual effect with performance; strong enough to be noticeable, light enough to be performant |
| **React.memo wrapper** | Prevents unnecessary re-renders of expensive blur calculations |
| **Absolute positioning for blur/tint** | Allows content to flow naturally while keeping effect layers behind |

## iOS Version Support

- **iOS 10+**: Basic blur support
- **iOS 13+**: Improved blur materials (recommended minimum)
- **iOS 15+**: Better performance with Metal optimizations
- **iOS 26**: Optimized for latest glass design language

## Future Enhancements

Potential improvements for future versions:

- [ ] Animated blur transitions
- [ ] Gradient tint overlays
- [ ] Android Material You vibrancy support
- [ ] Preset themes (e.g., "frosted", "crystal", "smoke")
- [ ] Dynamic blur based on content behind

## Support

For issues, questions, or contributions:

1. Check the inline code comments in `GlassCard.tsx`
2. Review the example screen implementation
3. Test with "Reduce Transparency" enabled/disabled
4. Verify `@react-native-community/blur` installation

## License

This component is part of your TripSecretary project and follows your project's license.

---

**Happy coding! 🥂 Enjoy your beautiful glass UI!**
