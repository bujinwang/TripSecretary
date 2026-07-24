/**
 * Tamagui Component Library
 *
 * Shared, reusable components built on Tamagui for use across all country screens.
 * These components follow the TripSecretary design system and provide consistent
 * UI patterns.
 *
 * @module components/tamagui
 */

// Base Components
export { BaseCard } from './BaseCard';
export type { BaseCardProps } from './BaseCard';

export { BaseButton } from './BaseButton';
export type { BaseButtonProps } from './BaseButton';

export { BaseInput } from './BaseInput';
export type { BaseInputProps } from './BaseInput';

// Layout Components
export { CollapsibleSection } from './CollapsibleSection';
export type { CollapsibleSectionProps } from './CollapsibleSection';

export { ProgressOverviewCard } from './ProgressOverviewCard';
export type { ProgressOverviewCardProps, ProgressSection } from './ProgressOverviewCard';

// Selector Components
export { default as BaseSearchableSelector } from './BaseSearchableSelector';
export type {
  BaseSearchableSelectorProps,
  SearchableOption,
  FilterOptionsFn,
  GetDisplayValueFn,
} from './BaseSearchableSelector';

// Re-export commonly used Tamagui primitives for convenience
export {
  YStack,
  XStack,
  Stack,
  Text,
  Heading,
  Paragraph,
  ScrollView,
  Separator,
  Spinner,
  Input,
  useTheme,
} from 'tamagui';
