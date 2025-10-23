/**
 * InputWithUserTracking Component
 * 
 * Enhanced input component that integrates with UserInteractionTracker
 * to track first user interaction and display smart suggestions.
 * 
 * Features:
 * - Tracks first user interaction vs programmatic changes
 * - Displays suggestions instead of pre-filled values
 * - Integrates with existing Input component styling and validation
 * - Supports accessibility for suggestion selection
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
} from 'react-native';
import Input from './Input';
import { colors, typography, spacing, borderRadius } from '../theme';

const InputWithUserTracking = React.forwardRef(({
  fieldName,
  value,
  onChangeText,
  onUserInteraction,
  showSuggestions = false,
  suggestions = [],
  placeholder,
  suggestionPlaceholder,
  label,
  error,
  errorMessage,
  helpText,
  style,
  ...inputProps
}, ref) => {
  const [showSuggestionList, setShowSuggestionList] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const suggestionHeight = useRef(new Animated.Value(0)).current;
  const userInteractionRef = useRef(false);

  // Filter suggestions based on current input
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes((value || '').toLowerCase())
  );

  /**
   * Handle text change from user input
   */
  const handleTextChange = useCallback((text) => {
    // Mark as user interaction if this is the first change
    if (!userInteractionRef.current) {
      userInteractionRef.current = true;
      setHasUserInteracted(true);
      
      // Notify parent component about user interaction
      if (onUserInteraction) {
        onUserInteraction(fieldName, text);
      }
    }

    // Call parent's onChange handler
    if (onChangeText) {
      onChangeText(text);
    }
  }, [fieldName, onChangeText, onUserInteraction]);

  /**
   * Handle input focus
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    
    // Show suggestions if available and no value or user wants to see options
    if (showSuggestions && suggestions.length > 0) {
      setShowSuggestionList(true);
      
      // Animate suggestion list appearance
      Animated.timing(suggestionHeight, {
        toValue: Math.min(suggestions.length * 44, 176), // Max 4 items visible
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [showSuggestions, suggestions.length, suggestionHeight]);

  /**
   * Handle input blur
   */
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Hide suggestions after a short delay to allow for selection
    setTimeout(() => {
      setShowSuggestionList(false);
      Animated.timing(suggestionHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, 150);
  }, [suggestionHeight]);

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = useCallback((suggestion) => {
    // Mark as user interaction
    if (!userInteractionRef.current) {
      userInteractionRef.current = true;
      setHasUserInteracted(true);
    }

    // Notify parent component about user interaction
    if (onUserInteraction) {
      onUserInteraction(fieldName, suggestion);
    }

    // Update value
    if (onChangeText) {
      onChangeText(suggestion);
    }

    // Hide suggestions
    setShowSuggestionList(false);
    Animated.timing(suggestionHeight, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [fieldName, onChangeText, onUserInteraction, suggestionHeight]);

  /**
   * Reset user interaction state when value is programmatically cleared
   */
  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      userInteractionRef.current = false;
      setHasUserInteracted(false);
    }
  }, [value]);

  /**
   * Render suggestion item
   */
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item}`}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  // Determine placeholder text
  const effectivePlaceholder = showSuggestions && !hasUserInteracted && suggestions.length > 0
    ? suggestionPlaceholder || `Tap to see suggestions...`
    : placeholder;

  return (
    <View style={[styles.container, style]}>
      <Input
        ref={ref}
        label={label}
        value={value}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={effectivePlaceholder}
        error={error}
        errorMessage={errorMessage}
        helpText={helpText}
        {...inputProps}
      />
      
      {/* Suggestion List */}
      {showSuggestions && (
        <Animated.View
          style={[
            styles.suggestionContainer,
            {
              height: suggestionHeight,
              opacity: showSuggestionList ? 1 : 0,
            }
          ]}
        >
          {showSuggestionList && filteredSuggestions.length > 0 && (
            <FlatList
              data={filteredSuggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              style={styles.suggestionList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            />
          )}
          
          {showSuggestionList && filteredSuggestions.length === 0 && suggestions.length > 0 && (
            <View style={styles.noSuggestionsContainer}>
              <Text style={styles.noSuggestionsText}>No matching suggestions</Text>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
});

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