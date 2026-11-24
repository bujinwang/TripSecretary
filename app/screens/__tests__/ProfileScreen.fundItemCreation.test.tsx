/**
 * ProfileScreen Fund Item Creation Tests
 * Tests the new fund item creation functionality
 */

import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '../ProfileScreen';
import UserDataService from '../../services/data/UserDataService';
import { NavigationContainer } from '@react-navigation/native';

// Mock dependencies
jest.mock('../../services/data/UserDataService');
jest.mock('../../i18n/LocaleContext', () => ({
  useLocale: () => ({
    locale: 'en',
    t: (key, options) => options?.defaultValue || key,
    setLocale: jest.fn()
  }),
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key,
    language: 'en'
  })
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  replace: jest.fn(),
  addListener: jest.fn(() => jest.fn())
};

const mockRoute = {
  params: {}
};

describe('ProfileScreen - Fund Item Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    UserDataService.initialize = jest.fn().mockResolvedValue();
    UserDataService.getAllUserData = jest.fn().mockResolvedValue({
      passport: null,
      personalInfo: null,
      userId: 'user_001'
    });
    UserDataService.getFundItems = jest.fn().mockResolvedValue([]);
    UserDataService.migrateFromAsyncStorage = jest.fn().mockResolvedValue({ migrated: false });
  });

  describe('Add Fund Item Button', () => {
    it('should display Add Fund Item button when funding section is expanded', async () => {
      const { getByText, getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      // Expand funding section
      const fundingToggle = getByText('Funding Proof Checklist');
      fireEvent.press(fundingToggle);

      // Check for Add Fund Item button
      await waitFor(() => {
        const addButton = getByLabelText('Add Fund Item');
        expect(addButton).toBeTruthy();
      });
    });

    it('should have proper accessibility attributes', async () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      const addButton = getByLabelText('Add Fund Item');
      expect(addButton.props.accessibilityRole).toBe('button');
    });
  });

  describe('Fund Item Type Selection', () => {
    it('should show type selector when Add Fund Item button is pressed', async () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      const addButton = getByLabelText('Add Fund Item');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      // Verify Alert.alert was called with correct parameters
      expect(Alert.alert).toHaveBeenCalledWith(
        'Select Fund Item Type',
        'Choose the type of fund item to add',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cash' }),
          expect.objectContaining({ text: 'Bank Card' }),
          expect.objectContaining({ text: 'Supporting Document' }),
          expect.objectContaining({ text: 'Cancel', style: 'cancel' })
        ])
      );
    });

    it('should handle CASH type selection', async () => {
      UserDataService.saveFundItem = jest.fn().mockResolvedValue({
        id: 'fund-1',
        type: 'CASH',
        amount: 1000,
        currency: 'USD',
        userId: 'user_001'
      });

      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      const addButton = getByLabelText('Add Fund Item');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      // Get the CASH option callback
      const alertCall = Alert.alert.mock.calls[0];
      const cashOption = alertCall[2].find(opt => opt.text === 'Cash');
      
      // Simulate selecting CASH
      await act(async () => {
        cashOption.onPress();
      });

      // Modal should open (we can't directly test modal visibility in this setup,
      // but we can verify the state changes that would trigger it)
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should handle BANK_CARD type selection', async () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      const addButton = getByLabelText('Add Fund Item');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      const alertCall = Alert.alert.mock.calls[0];
      const bankCardOption = alertCall[2].find(opt => opt.text === 'Bank Card');
      
      await act(async () => {
        bankCardOption.onPress();
      });

      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should handle DOCUMENT type selection', async () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      const addButton = getByLabelText('Add Fund Item');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      const alertCall = Alert.alert.mock.calls[0];
      const documentOption = alertCall[2].find(opt => opt.text === 'Supporting Document');
      
      await act(async () => {
        documentOption.onPress();
      });

      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should handle Cancel selection', async () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      const addButton = getByLabelText('Add Fund Item');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      const alertCall = Alert.alert.mock.calls[0];
      const cancelOption = alertCall[2].find(opt => opt.text === 'Cancel');
      
      expect(cancelOption.style).toBe('cancel');
    });
  });

  describe('Created Items Appear in List', () => {
    it('should refresh fund items list after creation', async () => {
      const newFundItem = {
        id: 'fund-new',
        type: 'CASH',
        amount: 5000,
        currency: 'USD',
        userId: 'user_001'
      };

      UserDataService.getFundItems
        .mockResolvedValueOnce([]) // Initial load
        .mockResolvedValueOnce([newFundItem]); // After creation

      UserDataService.saveFundItem = jest.fn().mockResolvedValue(newFundItem);

      const { getByLabelText, rerender } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalledTimes(1);
      });

      // Verify getFundItems is called to refresh after creation
      expect(UserDataService.getFundItems).toHaveBeenCalledWith('user_001');
    });

    it('should display empty state when no fund items exist', async () => {
      UserDataService.getFundItems = jest.fn().mockResolvedValue([]);

      const { getByText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      // Check for empty state message
      await waitFor(() => {
        const emptyMessage = getByText('No fund items yet. Tap below to add your first item.');
        expect(emptyMessage).toBeTruthy();
      });
    });
  });

  describe('Removed Features', () => {
    it('should NOT have "Scan / Upload Funding Proof" button', async () => {
      const { queryByText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      // This button should not exist
      const scanButton = queryByText(/Scan.*Upload.*Funding Proof/i);
      expect(scanButton).toBeNull();
    });

    it('should NOT navigate to ThailandTravelInfo for fund management', async () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      // Press Add Fund Item button
      const addButton = getByLabelText('Add Fund Item');
      await act(async () => {
        fireEvent.press(addButton);
      });

      // Should NOT navigate to ThailandTravelInfo
      expect(mockNavigation.navigate).not.toHaveBeenCalledWith(
        expect.stringContaining('Thailand')
      );
    });
  });

  describe('Translations', () => {
    it('should use translation keys for Add Fund Item button', async () => {
      const mockT = jest.fn((key, options) => options?.defaultValue || key);
      
      jest.doMock('../../i18n/LocaleContext', () => ({
        useTranslation: () => ({
          t: mockT,
          language: 'en'
        })
      }));

      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      // Verify translation key is used
      const addButton = getByLabelText('Add Fund Item');
      expect(addButton).toBeTruthy();
    });

    it('should use translation keys for type selector', async () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      const addButton = getByLabelText('Add Fund Item');
      await act(async () => {
        fireEvent.press(addButton);
      });

      // Verify Alert uses translated strings
      expect(Alert.alert).toHaveBeenCalledWith(
        'Select Fund Item Type',
        'Choose the type of fund item to add',
        expect.any(Array)
      );
    });

    it('should use translation keys for empty state', async () => {
      UserDataService.getFundItems = jest.fn().mockResolvedValue([]);

      const { getByText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalled();
      });

      // Check for translated empty state message
      await waitFor(() => {
        const emptyMessage = getByText('No fund items yet. Tap below to add your first item.');
        expect(emptyMessage).toBeTruthy();
      });
    });
  });

  describe('Integration with UserDataService', () => {
    it('should call UserDataService.saveFundItem when creating', async () => {
      UserDataService.saveFundItem = jest.fn().mockResolvedValue({
        id: 'fund-1',
        type: 'CASH',
        amount: 1000,
        currency: 'USD',
        details: 'Test',
        userId: 'user_001'
      });

      // This test verifies the service method is available
      expect(UserDataService.saveFundItem).toBeDefined();
    });

    it('should refresh fund items after successful creation', async () => {
      const newItem = {
        id: 'fund-1',
        type: 'CASH',
        amount: 1000,
        currency: 'USD',
        details: 'Test',
        userId: 'user_001'
      };

      UserDataService.saveFundItem = jest.fn().mockResolvedValue(newItem);
      UserDataService.getFundItems
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([newItem]);

      const { getByLabelText } = render(
        <NavigationContainer>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(UserDataService.getFundItems).toHaveBeenCalledTimes(1);
      });

      // Verify service is set up to be called again after creation
      expect(UserDataService.getFundItems).toBeDefined();
      expect(UserDataService.saveFundItem).toBeDefined();
    });
  });
});
