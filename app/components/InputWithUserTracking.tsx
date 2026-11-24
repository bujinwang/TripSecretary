import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  type ListRenderItemInfo,
} from 'react-native';
import type { StyleProp, ViewStyle, TextInput } from 'react-native';
import Input, { type InputProps } from './Input';
import { colors, typography, spacing, borderRadius } from '../theme';

export interface InputWithUserTrackingProps
  extends Omit<InputProps, 'value' | 'onChangeText'> {
  fieldName: string;
  value: string;
  onChangeText: (value: string) => void;
  onUserInteraction?: (fieldName: string, value: string) => void;
  showSuggestions?: boolean;
  suggestions?: string[];
  suggestionPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
  lastEditedField?: string | null;
  userInteractionTracker?: unknown;
}

const MAX_VISIBLE_SUGGESTIONS = 4;
const SUGGESTION_ITEM_HEIGHT = 44;

const InputWithUserTracking = forwardRef<TextInput, InputWithUserTrackingProps>(
  (
    {
      fieldName,
      value,
      onChangeText,
      onUserInteraction,
      showSuggestions = false,
      suggestions = [],
      suggestionPlaceholder,
      style,
      onBlur,
      lastEditedField,
      userInteractionTracker: _userInteractionTracker,
      ...restProps
    },
    ref,
  ) => {
    const [showSuggestionList, setShowSuggestionList] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const suggestionHeight = useRef(new Animated.Value(0)).current;
    const userInteractionRef = useRef(false);

    const filteredSuggestions = useMemo(() => {
      const query = (value ?? '').toLowerCase();
      return suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(query),
      );
    }, [suggestions, value]);

    const handleTextChange = useCallback(
      (text: string) => {
        if (!userInteractionRef.current) {
          userInteractionRef.current = true;
          setHasUserInteracted(true);
          onUserInteraction?.(fieldName, text);
        }

        onChangeText(text);
      },
      [fieldName, onChangeText, onUserInteraction],
    );

    const handleFocus = useCallback(() => {
      if (showSuggestions && suggestions.length > 0) {
        setShowSuggestionList(true);
        Animated.timing(suggestionHeight, {
          toValue: Math.min(suggestions.length, MAX_VISIBLE_SUGGESTIONS) * SUGGESTION_ITEM_HEIGHT,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    }, [showSuggestions, suggestions.length, suggestionHeight]);

    const handleBlur = useCallback(() => {
      setTimeout(() => {
        setShowSuggestionList(false);
        Animated.timing(suggestionHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }, 150);

      if (onBlur) {
        onBlur(value);
      }
    }, [onBlur, suggestionHeight, value]);

    const handleSuggestionSelect = useCallback(
      (suggestion: string) => {
        if (!userInteractionRef.current) {
          userInteractionRef.current = true;
          setHasUserInteracted(true);
        }

        onUserInteraction?.(fieldName, suggestion);
        onChangeText(suggestion);
        setShowSuggestionList(false);
        Animated.timing(suggestionHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      },
      [fieldName, onChangeText, onUserInteraction, suggestionHeight],
    );

    useEffect(() => {
      if (value === '' || value === null || value === undefined) {
        userInteractionRef.current = false;
        setHasUserInteracted(false);
      }
    }, [value]);

    const renderSuggestionItem = useCallback(
      ({ item }: ListRenderItemInfo<string>) => (
        <TouchableOpacity
          style={styles.suggestionItem}
          onPress={() => handleSuggestionSelect(item)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${item}`}
        >
          <Text style={styles.suggestionText}>{item}</Text>
        </TouchableOpacity>
      ),
      [handleSuggestionSelect],
    );

    const basePlaceholder = restProps.placeholder;
    const effectivePlaceholder =
      showSuggestions && !hasUserInteracted && suggestions.length > 0
        ? suggestionPlaceholder ?? 'Tap to see suggestions...'
        : basePlaceholder;

    return (
      <View style={[styles.container, style]}>
        <Input
          ref={ref}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={effectivePlaceholder}
        isLastEdited={lastEditedField === fieldName}
          {...restProps}
        />

        {showSuggestions ? (
          <Animated.View
            style={[
              styles.suggestionContainer,
              {
                height: suggestionHeight,
                opacity: showSuggestionList ? 1 : 0,
              },
            ]}
          >
            {showSuggestionList && filteredSuggestions.length > 0 ? (
              <FlatList
                data={filteredSuggestions}
                renderItem={renderSuggestionItem}
                keyExtractor={(item, index) => `${item}-${index}`}
                style={styles.suggestionList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              />
            ) : null}

            {showSuggestionList && filteredSuggestions.length === 0 && suggestions.length > 0 ? (
              <View style={styles.noSuggestionsContainer}>
                <Text style={styles.noSuggestionsText}>No matching suggestions</Text>
              </View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    );
  },
);

InputWithUserTracking.displayName = 'InputWithUserTracking';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  suggestionContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: borderRadius.sm,
    borderBottomRightRadius: borderRadius.sm,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  suggestionList: {
    flex: 1,
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  suggestionText: {
    ...typography.body1,
    color: colors.text,
  },
  noSuggestionsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  noSuggestionsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default InputWithUserTracking;
export type { InputWithUserTrackingProps as Props };

