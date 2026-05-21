/**
 * FundItemDetailModal Component Unit Tests
 * Tests rendering, mode switching, save/delete operations, and error handling
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import FundItemDetailModal from '../FundItemDetailModal';
import UserDataService from '../../services/data/UserDataService';
import * as ImagePicker from 'expo-image-picker';

// Mock dependencies
jest.mock('../../services/data/UserDataService');
jest.mock('../../i18n/LocaleContext', () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key,
    language: 'en'
  })
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('FundItemDetailModal - Unit Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnManageAll = jest.fn();

  const mockCashItem = {
    id: 'fund-1',
    userId: 'user_001',
    type: 'CASH',
    amount: 5000,
    currency: 'USD',
    details: 'Cash for immigration check',
    photoUri: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockBankCardItem = {
    id: 'fund-2',
    userId: 'user_001',
    type: 'BANK_CARD',
    amount: 10000,
    currency: 'EUR',
    details: 'Visa card',
    photoUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockDocumentItem = {
    id: 'fund-3',
    userId: 'user_001',
    type: 'DOCUMENT',
    amount: null,
    currency: null,
    details: 'Bank statement',
    photoUri: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockBankBalanceItem = {
    id: 'fund-4',
    userId: 'user_001',
    type: 'BANK_BALANCE',
    amount: '',
    currency: '',
    details: '',
    photoUri: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
  });

  describe('Rendering with Different Fund Item Types', () => {
    it('should render cash item correctly in view mode', () => {
      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      expect(getByText('Cash')).toBeTruthy();
      expect(getByText('5,000')).toBeTruthy();
      expect(getByText('USD')).toBeTruthy();
      expect(getByText('Cash for immigration check')).toBeTruthy();
    });

    it('should render bank card item correctly in view mode', () => {
      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockBankCardItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      expect(getByText('Bank Card')).toBeTruthy();
      expect(getByText('10,000')).toBeTruthy();
      expect(getByText('EUR')).toBeTruthy();
      expect(getByText('Visa card')).toBeTruthy();
    });

    it('should render document item correctly without amount', () => {
      const { getByText, queryByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockDocumentItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      expect(getByText('Supporting Document')).toBeTruthy();
      expect(getByText('Bank statement')).toBeTruthy();
      // Amount should not be displayed for document type
      expect(queryByText(/USD|EUR|THB/)).toBeNull();
    });

    it('should render bank balance item with placeholders when amount/currency missing', () => {
      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockBankBalanceItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      expect(getByText('Bank Balance')).toBeTruthy();
      expect(getByText('Not provided yet')).toBeTruthy();
    });

    it('should display photo thumbnail when photoUri exists', () => {
      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockBankCardItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      expect(getByText('Tap to view full size')).toBeTruthy();
      expect(getByText('Replace Photo')).toBeTruthy();
    });

    it('should display no photo placeholder when photoUri is null', () => {
      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      expect(getByText('No photo attached')).toBeTruthy();
      expect(getByText('Add Photo')).toBeTruthy();
    });
  });

  describe('Mode Switching', () => {
    it('should switch to edit mode when edit button is pressed', () => {
      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      const editButton = getByText('Edit');
      fireEvent.press(editButton);

      // Should show edit mode UI
      expect(getByText('Edit Fund Item')).toBeTruthy();
      expect(getByText('Save Changes')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });

    it('should switch to photo view mode when photo is pressed', () => {
      const { getByText, getByA11yHint } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockBankCardItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      const photoButton = getByA11yHint('Double tap to view full size photo');
      fireEvent.press(photoButton);

      // Should show photo view mode
      expect(getByText('Pinch to zoom, drag to pan')).toBeTruthy();
    });

    it('should return to view mode when cancel is pressed in edit mode', () => {
      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      // Switch to edit mode
      fireEvent.press(getByText('Edit'));
      expect(getByText('Edit Fund Item')).toBeTruthy();

      // Cancel edit
      fireEvent.press(getByText('Cancel'));
      
      // Should return to view mode
      expect(getByText('Fund Item Details')).toBeTruthy();
      expect(getByText('Edit')).toBeTruthy();
    });
  });

  describe('Save Operation', () => {
    it('should save changes successfully', async () => {
      const updatedItem = { ...mockCashItem, amount: 6000 };
      UserDataService.saveFundItem.mockResolvedValue(updatedItem);

      const { getByText, getByDisplayValue } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      // Switch to edit mode
      fireEvent.press(getByText('Edit'));

      // Change amount
      const amountInput = getByDisplayValue('5000');
      fireEvent.changeText(amountInput, '6000');

      // Save changes
      const saveButton = getByText('Save Changes');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(UserDataService.saveFundItem).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'fund-1',
            amount: 6000,
            currency: 'USD'
          }),
          'user_001'
        );
        expect(mockOnUpdate).toHaveBeenCalledWith(updatedItem);
      });
    });

    it('should validate amount field for cash items', async () => {
      const { getByText, getByDisplayValue } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      // Switch to edit mode
      fireEvent.press(getByText('Edit'));

      // Set invalid amount
      const amountInput = getByDisplayValue('5000');
      fireEvent.changeText(amountInput, '');

      // Try to save
      const saveButton = getByText('Save Changes');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      // Should show validation error
      await waitFor(() => {
        expect(getByText('Amount is required')).toBeTruthy();
        expect(UserDataService.saveFundItem).not.toHaveBeenCalled();
      });
    });

    it('should validate amount is positive number', async () => {
      const { getByText, getByDisplayValue } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      // Switch to edit mode
      fireEvent.press(getByText('Edit'));

      // Set negative amount
      const amountInput = getByDisplayValue('5000');
      fireEvent.changeText(amountInput, '-100');

      // Try to save
      const saveButton = getByText('Save Changes');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      // Should show validation error
      await waitFor(() => {
        expect(getByText('Amount must be greater than 0')).toBeTruthy();
        expect(UserDataService.saveFundItem).not.toHaveBeenCalled();
      });
    });

    it('should handle save errors gracefully', async () => {
      UserDataService.saveFundItem.mockRejectedValue(
        new Error('Database error')
      );

      const { getByText, getByDisplayValue } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      // Switch to edit mode
      fireEvent.press(getByText('Edit'));

      // Change amount
      const amountInput = getByDisplayValue('5000');
      fireEvent.changeText(amountInput, '6000');

      // Try to save
      const saveButton = getByText('Save Changes');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      // Should display error message
      await waitFor(() => {
        expect(getByText('Failed to save changes. Please try again.')).toBeTruthy();
        expect(mockOnUpdate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Delete Operation', () => {
    it('should show confirmation dialog when delete is pressed', () => {
      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      const deleteButton = getByText('Delete');
      fireEvent.press(deleteButton);

      // Should show confirmation alert
      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Fund Item',
        'Are you sure you want to delete this fund item?',
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should delete fund item when confirmed', async () => {
      UserDataService.deleteFundItem.mockResolvedValue();

      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      const deleteButton = getByText('Delete');
      fireEvent.press(deleteButton);

      // Get the confirm callback from Alert.alert
      const alertCall = Alert.alert.mock.calls[0];
      const confirmButton = alertCall[2].find(btn => btn.text === 'Delete');
      
      // Execute the confirm callback
      await act(async () => {
        await confirmButton.onPress();
      });

      await waitFor(() => {
        expect(UserDataService.deleteFundItem).toHaveBeenCalledWith(
          'fund-1',
          'user_001'
        );
        expect(mockOnDelete).toHaveBeenCalledWith('fund-1');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle delete errors gracefully', async () => {
      UserDataService.deleteFundItem.mockRejectedValue(
        new Error('Database error')
      );

      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      const deleteButton = getByText('Delete');
      fireEvent.press(deleteButton);

      // Get the confirm callback from Alert.alert
      const alertCall = Alert.alert.mock.calls[0];
      const confirmButton = alertCall[2].find(btn => btn.text === 'Delete');
      
      // Execute the confirm callback
      await act(async () => {
        await confirmButton.onPress();
      });

      // Should display error message
      await waitFor(() => {
        expect(getByText('Failed to delete fund item. Please try again.')).toBeTruthy();
        expect(mockOnDelete).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Display', () => {
    it('should display error message when save fails', async () => {
      UserDataService.saveFundItem.mockRejectedValue(
        new Error('Network error')
      );

      const { getByText, getByDisplayValue } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      // Switch to edit mode
      fireEvent.press(getByText('Edit'));

      // Change amount
      const amountInput = getByDisplayValue('5000');
      fireEvent.changeText(amountInput, '6000');

      // Try to save
      await act(async () => {
        fireEvent.press(getByText('Save Changes'));
      });

      // Should display error
      await waitFor(() => {
        expect(getByText('Failed to save changes. Please try again.')).toBeTruthy();
      });
    });

    it('should clear error when switching modes', async () => {
      UserDataService.saveFundItem.mockRejectedValue(
        new Error('Network error')
      );

      const { getByText, getByDisplayValue, queryByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      // Switch to edit mode
      fireEvent.press(getByText('Edit'));

      // Change amount and try to save (will fail)
      const amountInput = getByDisplayValue('5000');
      fireEvent.changeText(amountInput, '6000');
      await act(async () => {
        fireEvent.press(getByText('Save Changes'));
      });

      // Error should be displayed
      await waitFor(() => {
        expect(getByText('Failed to save changes. Please try again.')).toBeTruthy();
      });

      // Cancel edit mode
      fireEvent.press(getByText('Cancel'));

      // Error should be cleared
      await waitFor(() => {
        expect(queryByText('Failed to save changes. Please try again.')).toBeNull();
      });
    });
  });

  describe('Currency Selection', () => {
    it('should open currency picker when currency selector is pressed', () => {
      const { getByText, getByA11yHint } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      // Switch to edit mode
      fireEvent.press(getByText('Edit'));

      // Open currency picker
      const currencySelector = getByA11yHint('Opens currency picker to select a currency');
      fireEvent.press(currencySelector);

      // Should show currency picker
      expect(getByText('Select Currency')).toBeTruthy();
      expect(getByText('US Dollar')).toBeTruthy();
      expect(getByText('Euro')).toBeTruthy();
    });

    it('should select currency from picker', () => {
      const { getByText, getByA11yHint } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      // Switch to edit mode
      fireEvent.press(getByText('Edit'));

      // Open currency picker
      const currencySelector = getByA11yHint('Opens currency picker to select a currency');
      fireEvent.press(currencySelector);

      // Select EUR
      const eurOption = getByText('Euro');
      fireEvent.press(eurOption);

      // Currency picker should close and EUR should be selected
      expect(getByText('EUR')).toBeTruthy();
    });
  });

  describe('Photo Management', () => {
    it('should request permissions when adding photo', async () => {
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });

      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      const addPhotoButton = getByText('Add Photo');
      await act(async () => {
        fireEvent.press(addPhotoButton);
      });

      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should show photo options alert when permissions granted', async () => {
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });

      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      const addPhotoButton = getByText('Add Photo');
      await act(async () => {
        fireEvent.press(addPhotoButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Add Photo',
          'Choose an option',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Take Photo' }),
            expect.objectContaining({ text: 'Choose from Library' })
          ])
        );
      });
    });
  });

  describe('Manage All Funds Navigation', () => {
    it('should call onManageAll and close modal when manage all is pressed', () => {
      const { getByText } = render(
        <FundItemDetailModal
          visible={true}
          fundItem={mockCashItem}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onManageAll={mockOnManageAll}
        />
      );

      const manageAllButton = getByText('Manage All Funds');
      fireEvent.press(manageAllButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnManageAll).toHaveBeenCalled();
    });
  });
});
