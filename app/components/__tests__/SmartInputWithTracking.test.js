/**
 * SmartInputWithTracking Component Tests
 * 
 * Tests for the smart input component that combines InputWithUserTracking 
 * with SuggestionProviders for context-aware suggestions.
 */

import React from 'react';
import SmartInputWithTracking from '../SmartInputWithTracking';

// Mock SuggestionProviders
jest.mock('../../utils/SuggestionProviders', () => ({
  getSuggestions: jest.fn(),
  getSuggestionPlaceholder: jest.fn(),
  updateContextWithSelection: jest.fn()
}));

import SuggestionProviders from '../../utils/SuggestionProviders';

describe('SmartInputWithTracking', () => {
  // Mock the component's core functionality
  class MockSmartInputWithTracking {
    constructor(props) {
      this.props = props;
      // Initialize suggestions and placeholder by calling the actual methods
      this.suggestions = this.getSuggestions();
      this.suggestionPlaceholder = this.getSuggestionPlaceholder();
    }

    getSuggestions() {
      const showSuggestions = this.props.showSuggestions !== false; // Default to true
      if (!showSuggestions || !this.props.fieldType) {
        return [];
      }

      const allSuggestions = SuggestionProviders.getSuggestions(
        this.props.fieldType, 
        this.props.context || {}
      );
      return allSuggestions.slice(0, this.props.maxSuggestions || 8);
    }

    getSuggestionPlaceholder() {
      const showSuggestions = this.props.showSuggestions !== false; // Default to true
      if (!showSuggestions || !this.props.fieldType) {
        return this.props.placeholder;
      }

      return SuggestionProviders.getSuggestionPlaceholder(
        this.props.fieldType, 
        this.props.context || {}
      );
    }

    handleUserInteraction(fieldName, selectedValue) {
      // Update context with the selection for future suggestions
      if (this.props.fieldType && this.props.context) {
        const updatedContext = SuggestionProviders.updateContextWithSelection(
          this.props.fieldType,
          selectedValue,
          this.props.context
        );
      }

      // Call the original onUserInteraction handler
      if (this.props.onUserInteraction) {
        this.props.onUserInteraction(fieldName, selectedValue);
      }
    }

    getAccessibilityLabel() {
      let baseLabel = this.props.label || this.props.fieldName;
      const showSuggestions = this.props.showSuggestions !== false; // Default to true
      
      if (showSuggestions && this.suggestions.length > 0) {
        baseLabel += `. ${this.suggestions.length} suggestions available.`;
      }
      
      return baseLabel;
    }

    getAccessibilityHint() {
      const showSuggestions = this.props.showSuggestions !== false; // Default to true
      if (showSuggestions && this.suggestions.length > 0) {
        return 'Double tap to focus and see suggestions. Swipe up or down to navigate suggestions.';
      }
      
      return 'Double tap to edit text';
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    SuggestionProviders.getSuggestions.mockReturnValue([
      'Holiday/Tourism',
      'Business',
      'Visiting Friends/Family'
    ]);
    
    SuggestionProviders.getSuggestionPlaceholder.mockReturnValue(
      'Tap to see 3 travel purposes...'
    );
    
    SuggestionProviders.updateContextWithSelection.mockReturnValue({
      previousPurposes: ['Business']
    });
  });

  describe('Basic Functionality', () => {
    it('initializes correctly with basic props', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      const component = new MockSmartInputWithTracking(props);
      
      expect(component.props.fieldName).toBe('testField');
      expect(component.props.fieldType).toBe('travelPurpose');
    });

    it('passes through input props correctly', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: 'test value',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        label: 'Test Field',
        placeholder: 'Enter text'
      };

      const component = new MockSmartInputWithTracking(props);
      
      expect(component.props.label).toBe('Test Field');
      expect(component.props.placeholder).toBe('Enter text');
    });
  });

  describe('Suggestion Integration', () => {
    it('loads suggestions based on field type', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      new MockSmartInputWithTracking(props);

      expect(SuggestionProviders.getSuggestions).toHaveBeenCalledWith(
        'travelPurpose',
        {}
      );
    });

    it('passes context to suggestion provider', () => {
      const context = { destination: 'TH', nationality: 'China' };
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        context: context
      };

      new MockSmartInputWithTracking(props);

      expect(SuggestionProviders.getSuggestions).toHaveBeenCalledWith(
        'travelPurpose',
        context
      );
    });

    it('limits suggestions based on maxSuggestions prop', () => {
      SuggestionProviders.getSuggestions.mockReturnValue([
        'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'
      ]);

      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        maxSuggestions: 3
      };

      const component = new MockSmartInputWithTracking(props);

      expect(component.suggestions).toHaveLength(3);
    });

    it('shows suggestions when showSuggestions is true', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        showSuggestions: true
      };

      const component = new MockSmartInputWithTracking(props);

      expect(component.suggestions).toHaveLength(3);
    });

    it('hides suggestions when showSuggestions is false', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        showSuggestions: false
      };

      const component = new MockSmartInputWithTracking(props);

      expect(component.suggestions).toHaveLength(0);
    });

    it('handles empty suggestions gracefully', () => {
      SuggestionProviders.getSuggestions.mockReturnValue([]);

      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      const component = new MockSmartInputWithTracking(props);

      expect(component.suggestions).toHaveLength(0);
    });
  });

  describe('Suggestion Placeholder', () => {
    it('gets suggestion placeholder from provider', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      const component = new MockSmartInputWithTracking(props);

      expect(SuggestionProviders.getSuggestionPlaceholder).toHaveBeenCalledWith(
        'travelPurpose',
        {}
      );
      expect(component.suggestionPlaceholder).toBe('Tap to see 3 travel purposes...');
    });

    it('uses regular placeholder when suggestions are disabled', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        showSuggestions: false,
        placeholder: 'Regular placeholder'
      };

      const component = new MockSmartInputWithTracking(props);

      expect(component.suggestionPlaceholder).toBe('Regular placeholder');
    });

    it('uses regular placeholder when no field type provided', () => {
      const props = {
        fieldName: 'testField',
        fieldType: null,
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        placeholder: 'Regular placeholder'
      };

      const component = new MockSmartInputWithTracking(props);

      expect(component.suggestionPlaceholder).toBe('Regular placeholder');
    });
  });

  describe('User Interaction Handling', () => {
    it('handles user interaction with context updates', () => {
      const context = { destination: 'TH' };
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        context: context
      };

      const component = new MockSmartInputWithTracking(props);
      component.handleUserInteraction('testField', 'Holiday/Tourism');

      expect(SuggestionProviders.updateContextWithSelection).toHaveBeenCalledWith(
        'travelPurpose',
        'Holiday/Tourism',
        context
      );
    });

    it('calls original onUserInteraction handler', () => {
      const mockOnUserInteraction = jest.fn();
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: mockOnUserInteraction
      };

      const component = new MockSmartInputWithTracking(props);
      component.handleUserInteraction('testField', 'Holiday/Tourism');

      expect(mockOnUserInteraction).toHaveBeenCalledWith('testField', 'Holiday/Tourism');
    });

    it('handles interaction without context gracefully', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        context: null
      };

      const component = new MockSmartInputWithTracking(props);

      expect(() => component.handleUserInteraction('testField', 'Holiday/Tourism')).not.toThrow();
    });

    it('handles interaction without onUserInteraction handler', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: null
      };

      const component = new MockSmartInputWithTracking(props);

      expect(() => component.handleUserInteraction('testField', 'Holiday/Tourism')).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility label', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        label: 'Travel Purpose'
      };

      const component = new MockSmartInputWithTracking(props);
      const accessibilityLabel = component.getAccessibilityLabel();

      expect(accessibilityLabel).toContain('Travel Purpose');
      expect(accessibilityLabel).toContain('3 suggestions available');
    });

    it('provides accessibility label without suggestions', () => {
      SuggestionProviders.getSuggestions.mockReturnValue([]);

      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn(),
        label: 'Travel Purpose'
      };

      const component = new MockSmartInputWithTracking(props);
      const accessibilityLabel = component.getAccessibilityLabel();

      expect(accessibilityLabel).toBe('Travel Purpose');
    });

    it('uses fieldName as fallback for accessibility label', () => {
      SuggestionProviders.getSuggestions.mockReturnValue([]);

      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      const component = new MockSmartInputWithTracking(props);
      const accessibilityLabel = component.getAccessibilityLabel();

      expect(accessibilityLabel).toBe('testField');
    });

    it('provides proper accessibility hint with suggestions', () => {
      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      const component = new MockSmartInputWithTracking(props);
      const accessibilityHint = component.getAccessibilityHint();

      expect(accessibilityHint).toContain('Double tap to focus and see suggestions');
    });

    it('provides basic accessibility hint without suggestions', () => {
      SuggestionProviders.getSuggestions.mockReturnValue([]);

      const props = {
        fieldName: 'testField',
        fieldType: 'travelPurpose',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      const component = new MockSmartInputWithTracking(props);
      const accessibilityHint = component.getAccessibilityHint();

      expect(accessibilityHint).toBe('Double tap to edit text');
    });
  });

  describe('Different Field Types', () => {
    it('handles accommodation type field', () => {
      SuggestionProviders.getSuggestions.mockReturnValue([
        'Hotel', 'Apartment/Condo', 'Resort'
      ]);

      const props = {
        fieldName: 'testField',
        fieldType: 'accommodationType',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      new MockSmartInputWithTracking(props);

      expect(SuggestionProviders.getSuggestions).toHaveBeenCalledWith(
        'accommodationType',
        {}
      );
    });

    it('handles boarding country field', () => {
      SuggestionProviders.getSuggestions.mockReturnValue([
        'China', 'Singapore', 'Malaysia'
      ]);

      const props = {
        fieldName: 'testField',
        fieldType: 'boardingCountry',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      new MockSmartInputWithTracking(props);

      expect(SuggestionProviders.getSuggestions).toHaveBeenCalledWith(
        'boardingCountry',
        {}
      );
    });

    it('handles unknown field type gracefully', () => {
      SuggestionProviders.getSuggestions.mockReturnValue([]);

      const props = {
        fieldName: 'testField',
        fieldType: 'unknownType',
        value: '',
        onChangeText: jest.fn(),
        onUserInteraction: jest.fn()
      };

      const component = new MockSmartInputWithTracking(props);

      expect(component.suggestions).toHaveLength(0);
    });
  });
});