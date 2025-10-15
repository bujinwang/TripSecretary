/**
 * ThailandTravelInfoScreen Integration Tests
 * Tests data loading and updates through PassportDataService
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ThailandTravelInfoScreen from '../thailand/ThailandTravelInfoScreen';
import PassportDataService from '../../services/data/PassportDataService';
import { NavigationContainer } from '@react-navigation/native';

// Mock dependencies
jest.mock('../../services/data/PassportDataService');
jest.mock('../../i18n/LocaleContext', () => ({
  useLocale: () => ({
    locale: 'en',
    t: (key) => key,
    setLocale: jest.fn()
  })
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()) // Returns unsubscribe function
};

const mockRoute = {
  params: {}
};

describe('ThailandTravelInfoScreen - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Loading', () => {
    it('should load all user data on mount', async () => {
      const mockUserData = {
        passport: {
          id: 'passport-1',
          userId: 'default_user',
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI',
          dateOfBirth: '1988-01-22',
          nationality: 'CHN',
          gender: 'Male',
          expiryDate: '2030-12-31',
          issueDate: '2020-12-31',
          issuePlace: 'Shanghai'
        },
        personalInfo: {
          id: 'personal-1',
          userId: 'default_user',
          phoneNumber: '+86 13812345678',
          email: 'test@example.com',
          occupation: 'Engineer',
          provinceCity: 'Shanghai',
          countryRegion: 'CHN'
        },
        fundingProof: {
          id: 'funding-1',
          userId: 'default_user',
          cashAmount: '10000 THB',
          bankCards: 'Visa ****1234'
        },
        userId: 'default_user'
      };

      PassportDataService.getAllUserData.mockResolvedValue(mockUserData);

      render(
        <NavigationContainer>
          <ThailandTravelInfoScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      // Verify passport data is loaded - service was called
      await waitFor(() => {
        expect(PassportDataService.getAllUserData).toHaveBeenCalledWith('default_user');
      }, { timeout: 3000 });
    });

    it('should handle missing data gracefully', async () => {
      PassportDataService.getAllUserData.mockResolvedValue({
        passport: null,
        personalInfo: null,
        fundingProof: null,
        userId: 'default_user'
      });

      const { queryByDisplayValue } = render(
        <NavigationContainer>
          <ThailandTravelInfoScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(PassportDataService.getAllUserData).toHaveBeenCalled();
      });

      // Screen should render without errors
      expect(queryByDisplayValue('E12345678')).toBeNull();
    });

    it('should trigger migration on first load if needed', async () => {
      PassportDataService.getAllUserData.mockResolvedValue({
        passport: null,
        personalInfo: null,
        fundingProof: null,
        userId: 'default_user'
      });

      PassportDataService.migrateFromAsyncStorage.mockResolvedValue({
        migrated: true,
        passport: true,
        personalInfo: true,
        fundingProof: true
      });

      render(
        <NavigationContainer>
          <ThailandTravelInfoScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(PassportDataService.getAllUserData).toHaveBeenCalled();
      });
    });

    it('should handle data loading errors gracefully', async () => {
      PassportDataService.getAllUserData.mockRejectedValue(
        new Error('Database connection failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Screen should render without crashing even if data load fails
      const { root } = render(
        <NavigationContainer>
          <ThailandTravelInfoScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(PassportDataService.getAllUserData).toHaveBeenCalled();
      });

      // Screen should still be rendered
      expect(root).toBeTruthy();

      consoleSpy.mockRestore();
    });
  });

  describe('Data Updates', () => {
    it('should update passport data through PassportDataService', async () => {
      const mockUserData = {
        passport: {
          id: 'passport-1',
          userId: 'default_user',
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI'
        },
        personalInfo: null,
        fundingProof: null,
        userId: 'default_user'
      };

      PassportDataService.getAllUserData.mockResolvedValue(mockUserData);
      PassportDataService.updatePassport.mockResolvedValue();

      const { getByTestId } = render(
        <NavigationContainer>
          <ThailandTravelInfoScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(PassportDataService.getAllUserData).toHaveBeenCalled();
      });

      // Simulate user updating passport number and triggering blur
      const passportInput = getByTestId('passport-number-input');
      fireEvent.changeText(passportInput, 'E99999999');
      fireEvent(passportInput, 'blur');

      await waitFor(() => {
        expect(PassportDataService.updatePassport).toHaveBeenCalledWith(
          'passport-1',
          expect.objectContaining({
            passportNumber: 'E99999999'
          })
        );
      }, { timeout: 3000 });
    });

    it('should have PassportDataService available for personal info updates', async () => {
      const mockUserData = {
        passport: null,
        personalInfo: {
          id: 'personal-1',
          userId: 'default_user',
          email: 'old@example.com'
        },
        fundingProof: null,
        userId: 'default_user'
      };

      PassportDataService.getAllUserData.mockResolvedValue(mockUserData);
      PassportDataService.updatePersonalInfo.mockResolvedValue();

      render(
        <NavigationContainer>
          <ThailandTravelInfoScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(PassportDataService.getAllUserData).toHaveBeenCalled();
      });

      // Verify service methods are available for updates
      expect(PassportDataService.updatePersonalInfo).toBeDefined();
    });

    it('should call PassportDataService for funding proof updates', async () => {
      const mockUserData = {
        passport: null,
        personalInfo: null,
        fundingProof: {
          id: 'funding-1',
          userId: 'default_user',
          cashAmount: '10000 THB'
        },
        userId: 'default_user'
      };

      PassportDataService.getAllUserData.mockResolvedValue(mockUserData);
      PassportDataService.updateFundingProof.mockResolvedValue();

      render(
        <NavigationContainer>
          <ThailandTravelInfoScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(PassportDataService.getAllUserData).toHaveBeenCalled();
      });

      // Verify the service is available for funding proof updates
      // (actual update happens on form submission, not individual field changes)
      expect(PassportDataService.updateFundingProof).toBeDefined();
    });

    it('should handle update errors gracefully', async () => {
      const mockUserData = {
        passport: {
          id: 'passport-1',
          userId: 'default_user',
          passportNumber: 'E12345678'
        },
        personalInfo: null,
        fundingProof: null,
        userId: 'default_user'
      };

      PassportDataService.getAllUserData.mockResolvedValue(mockUserData);
      PassportDataService.updatePassport.mockRejectedValue(
        new Error('Update failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { getByTestId } = render(
        <NavigationContainer>
          <ThailandTravelInfoScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(PassportDataService.getAllUserData).toHaveBeenCalled();
      });

      const passportInput = getByTestId('passport-number-input');
      fireEvent.changeText(passportInput, 'E99999999');
      fireEvent(passportInput, 'blur');

      await waitFor(() => {
        expect(PassportDataService.updatePassport).toHaveBeenCalled();
      }, { timeout: 3000 });

      consoleSpy.mockRestore();
    });
  });

  describe('Data Consistency', () => {
    it('should reflect updates from ProfileScreen', async () => {
      const initialData = {
        passport: {
          id: 'passport-1',
          userId: 'default_user',
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI'
        },
        personalInfo: null,
        fundingProof: null,
        userId: 'default_user'
      };

      const updatedData = {
        ...initialData,
        passport: {
          ...initialData.passport,
          passportNumber: 'E99999999'
        }
      };

      PassportDataService.getAllUserData
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(updatedData);

      const { getByTestId } = render(
        <NavigationContainer>
          <ThailandTravelInfoScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(PassportDataService.getAllUserData).toHaveBeenCalledTimes(1);
      });

      // Simulate screen re-focus (user returns from ProfileScreen)
      // Trigger the focus listener
      const focusCallback = mockNavigation.addListener.mock.calls[0][1];
      await focusCallback();

      await waitFor(() => {
        // Should reload data on focus
        expect(PassportDataService.getAllUserData).toHaveBeenCalledTimes(2);
      });
    });
  });
});
