/**
 * CollapsibleSection Component Unit Tests
 * Tests expand/collapse functionality, field count badges, and completion status indicators
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import CollapsibleSection from '../CollapsibleSection';

describe('CollapsibleSection', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render title and field count badge', () => {
      const { getByText } = render(
        <CollapsibleSection
          title="Test Section"
          fieldCount={{ filled: 3, total: 5 }}
          expanded={false}
        >
          <Text>Test Content</Text>
        </CollapsibleSection>
      );

      expect(getByText('Test Section')).toBeTruthy();
      expect(getByText('3/5')).toBeTruthy();
    });

    it('should show content when expanded', () => {
      const { getByText } = render(
        <CollapsibleSection
          title="Test Section"
          fieldCount={{ filled: 3, total: 5 }}
          expanded={true}
        >
          <Text>Test Content</Text>
        </CollapsibleSection>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });

    it('should hide content when collapsed', () => {
      const { queryByText } = render(
        <CollapsibleSection
          title="Test Section"
          fieldCount={{ filled: 3, total: 5 }}
          expanded={false}
        >
          <Text>Test Content</Text>
        </CollapsibleSection>
      );

      expect(queryByText('Test Content')).toBeNull();
    });
  });

  describe('Field Count Badge Styles', () => {
    it('should show complete badge when all fields are filled', () => {
      const { getByText } = render(
        <CollapsibleSection
          title="Complete Section"
          fieldCount={{ filled: 5, total: 5 }}
          expanded={false}
        >
          <Text>Content</Text>
        </CollapsibleSection>
      );

      const badge = getByText('5/5');
      expect(badge).toBeTruthy();
    });

    it('should show incomplete badge when some fields are filled', () => {
      const { getByText } = render(
        <CollapsibleSection
          title="Incomplete Section"
          fieldCount={{ filled: 3, total: 5 }}
          expanded={false}
        >
          <Text>Content</Text>
        </CollapsibleSection>
      );

      const badge = getByText('3/5');
      expect(badge).toBeTruthy();
    });

    it('should show empty badge when no fields are filled', () => {
      const { getByText } = render(
        <CollapsibleSection
          title="Empty Section"
          fieldCount={{ filled: 0, total: 5 }}
          expanded={false}
        >
          <Text>Content</Text>
        </CollapsibleSection>
      );

      const badge = getByText('0/5');
      expect(badge).toBeTruthy();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should toggle expansion when header is pressed', () => {
      const { getByText, queryByText } = render(
        <CollapsibleSection
          title="Test Section"
          fieldCount={{ filled: 3, total: 5 }}
          expanded={false}
          onToggle={mockOnToggle}
        >
          <Text>Test Content</Text>
        </CollapsibleSection>
      );

      // Initially collapsed
      expect(queryByText('Test Content')).toBeNull();

      // Press header to expand
      const header = getByText('Test Section');
      fireEvent.press(header);

      expect(mockOnToggle).toHaveBeenCalledWith(true);
    });

    it('should call onToggle with correct expanded state', () => {
      const { getByText } = render(
        <CollapsibleSection
          title="Test Section"
          fieldCount={{ filled: 3, total: 5 }}
          expanded={true}
          onToggle={mockOnToggle}
        >
          <Text>Test Content</Text>
        </CollapsibleSection>
      );

      // Press header to collapse
      const header = getByText('Test Section');
      fireEvent.press(header);

      expect(mockOnToggle).toHaveBeenCalledWith(false);
    });

    it('should work without onToggle callback', () => {
      const { getByText } = render(
        <CollapsibleSection
          title="Test Section"
          fieldCount={{ filled: 3, total: 5 }}
          expanded={false}
        >
          <Text>Test Content</Text>
        </CollapsibleSection>
      );

      // Should not throw error when pressing header without onToggle
      const header = getByText('Test Section');
      expect(() => fireEvent.press(header)).not.toThrow();
    });
  });

  describe('Default Props', () => {
    it('should handle default fieldCount', () => {
      const { getByText } = render(
        <CollapsibleSection
          title="Test Section"
          expanded={false}
        >
          <Text>Test Content</Text>
        </CollapsibleSection>
      );

      expect(getByText('0/0')).toBeTruthy();
    });

    it('should default to collapsed state', () => {
      const { queryByText } = render(
        <CollapsibleSection
          title="Test Section"
          fieldCount={{ filled: 3, total: 5 }}
        >
          <Text>Test Content</Text>
        </CollapsibleSection>
      );

      expect(queryByText('Test Content')).toBeNull();
    });
  });
});