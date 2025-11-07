/**
 * Integration test for TDACSelectionScreen EntryPack integration
 * Tests the actual screen behavior with mocked dependencies
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TDACSelectionScreen from '../TDACSelectionScreen';
import EntryPackService from '../../../services/entryPack/EntryPackService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

jest.mock('../../../services/entryPack/EntryPackService', () => ({
  createOrUpdatePack: jest.fn()
}));

// Mock navigation
const mockNavigation = {
  addListener: jest.fn((event, callback) => {
    // Simulate focus event
    if (event === 'focus') {
      setTimeout(callback, 0);
    }
    return jest.fn(); // Return unsubscribe function
  }),
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn()
};

const mockRoute = {
  params: {
    travelerInfo: {
      firstName: 'John',
      familyName: 'Doe',
      passportNo: 'P123456789',
      arrivalDate: '2024-01-15'
    }
  }
};

describe('TDACSelectionScreen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process recent TDAC submission on screen focus', async () => {
    // Mock recent submission data
    const mockSubmissionData = {
      arrCardNo: 'TEST123456',
      qrUri: 'file:///path/to/qr.pdf',
      pdfPath: 'file:///path/to/qr.pdf',
      submittedAt: new Date().toISOString(), // Recent submission
      submissionMethod: 'hybrid',
      timestamp: Date.now(),
      travelerName: 'John Doe',
      passportNo: 'P123456789'
    };

    // Mock AsyncStorage to return recent submission
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'recent_tdac_submission') {
        return Promise.resolve(JSON.stringify(mockSubmissionData));
      }
      return Promise.resolve(null);
    });

    // Mock successful EntryPackService response
    const mockEntryPack = {
      id: 'entry_pack_123',
      status: 'submitted'
    };
    EntryPackService.createOrUpdatePack.mockResolvedValue(mockEntryPack);

    // Render the screen
    render(
      <TDACSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Wait for the focus listener to be called and processed
    await waitFor(() => {
      expect(mockNavigation.addListener).toHaveBeenCalledWith('focus', expect.any(Function));
    });

    // Wait for async operations to complete
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('recent_tdac_submission');
    }, { timeout: 1000 });

    // Verify EntryPackService was called
    await waitFor(() => {
      expect(EntryPackService.createOrUpdatePack).toHaveBeenCalledWith(
        expect.any(String), // entryInfoId
        expect.objectContaining({
          arrCardNo: 'TEST123456',
          qrUri: 'file:///path/to/qr.pdf',
          pdfPath: 'file:///path/to/qr.pdf',
          submissionMethod: 'hybrid'
        }),
        expect.objectContaining({
          submissionMethod: 'hybrid'
        })
      );
    }, { timeout: 1000 });

    // Verify recent submission flag was cleared
    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('recent_tdac_submission');
    }, { timeout: 1000 });
  });

  test('should ignore old TDAC submissions', async () => {
    // Mock old submission data (more than 5 minutes ago)
    const oldTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
    const mockOldSubmissionData = {
      arrCardNo: 'OLD123456',
      qrUri: 'file:///path/to/old_qr.pdf',
      submittedAt: new Date(oldTimestamp).toISOString(),
      submissionMethod: 'api',
      timestamp: oldTimestamp
    };

    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockOldSubmissionData));

    render(
      <TDACSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('recent_tdac_submission');
    });

    // Should not call EntryPackService for old submissions
    expect(EntryPackService.createOrUpdatePack).not.toHaveBeenCalled();
  });

  test('should handle EntryPackService errors gracefully', async () => {
    const mockSubmissionData = {
      arrCardNo: 'ERROR123456',
      qrUri: 'file:///path/to/qr.pdf',
      submittedAt: new Date().toISOString(),
      submissionMethod: 'api',
      timestamp: Date.now()
    };

    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockSubmissionData));
    EntryPackService.createOrUpdatePack.mockRejectedValue(new Error('Service unavailable'));

    // Should not throw error
    expect(() => {
      render(
        <TDACSelectionScreen 
          navigation={mockNavigation} 
          route={mockRoute} 
        />
      );
    }).not.toThrow();

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('recent_tdac_submission');
    });

    // Should still clear the recent submission flag even on error
    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('recent_tdac_submission');
    }, { timeout: 1000 });
  });

  test('should handle missing or invalid submission data', async () => {
    // Test with missing data
    AsyncStorage.getItem.mockResolvedValue(null);

    render(
      <TDACSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('recent_tdac_submission');
    });

    expect(EntryPackService.createOrUpdatePack).not.toHaveBeenCalled();

    // Test with invalid JSON
    AsyncStorage.getItem.mockResolvedValue('invalid json');

    render(
      <TDACSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Should not crash
    expect(EntryPackService.createOrUpdatePack).not.toHaveBeenCalled();
  });
});