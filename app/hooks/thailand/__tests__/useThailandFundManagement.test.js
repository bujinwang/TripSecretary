/**
 * Unit Tests for useThailandFundManagement Hook
 *
 * Tests fund item management including add, update, delete, and modal state
 */

import { renderHook, act } from '@testing-library/react-native';
import { useThailandFundManagement } from '../useThailandFundManagement';

// Mock DebouncedSave
jest.mock('../../../utils/DebouncedSave', () => ({
  default: {
    flushPendingSave: jest.fn().mockResolvedValue(true),
  },
}));

describe('useThailandFundManagement', () => {
  let mockFormState;
  let mockRefreshFundItems;
  let mockDebouncedSaveData;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock form state
    mockFormState = {
      funds: [],
      fundItemModalVisible: false,
      currentFundItem: null,
      newFundItemType: null,
      selectedFundItem: null,
      setFunds: jest.fn(),
      setFundItemModalVisible: jest.fn(),
      setCurrentFundItem: jest.fn(),
      setNewFundItemType: jest.fn(),
      setSelectedFundItem: jest.fn(),
    };

    mockRefreshFundItems = jest.fn().mockResolvedValue(true);
    mockDebouncedSaveData = jest.fn();
  });

  describe('addFund', () => {
    it('should open modal for adding new fund', () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      act(() => {
        result.current.addFund('Cash');
      });

      expect(mockFormState.setCurrentFundItem).toHaveBeenCalledWith(null);
      expect(mockFormState.setNewFundItemType).toHaveBeenCalledWith('Cash');
      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(true);
    });

    it('should set correct fund type', () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      act(() => {
        result.current.addFund('Bank Account');
      });

      expect(mockFormState.setNewFundItemType).toHaveBeenCalledWith('Bank Account');
    });
  });

  describe('handleFundItemPress', () => {
    it('should open modal with existing fund item', () => {
      const existingFund = {
        id: 'fund1',
        type: 'Cash',
        amount: 10000,
        currency: 'THB',
      };

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      act(() => {
        result.current.handleFundItemPress(existingFund);
      });

      expect(mockFormState.setCurrentFundItem).toHaveBeenCalledWith(existingFund);
      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(true);
    });
  });

  describe('handleFundItemModalClose', () => {
    it('should close modal and reset state', () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      act(() => {
        result.current.handleFundItemModalClose();
      });

      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(false);
      expect(mockFormState.setCurrentFundItem).toHaveBeenCalledWith(null);
    });
  });

  describe('handleFundItemUpdate', () => {
    it('should update selected fund item', async () => {
      const updatedFund = {
        id: 'fund1',
        type: 'Cash',
        amount: 15000,
        currency: 'THB',
      };

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemUpdate(updatedFund);
      });

      expect(mockFormState.setSelectedFundItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'fund1',
          type: 'Cash',
          amount: 15000,
          currency: 'THB',
        })
      );
    });

    it('should refresh fund items after update', async () => {
      const updatedFund = {
        id: 'fund1',
        type: 'Cash',
        amount: 15000,
        currency: 'THB',
      };

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemUpdate(updatedFund);
      });

      expect(mockRefreshFundItems).toHaveBeenCalledWith({ forceRefresh: true });
    });

    it('should trigger debounced save after update', async () => {
      const updatedFund = {
        id: 'fund1',
        type: 'Cash',
        amount: 15000,
        currency: 'THB',
      };

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemUpdate(updatedFund);
      });

      expect(mockDebouncedSaveData).toHaveBeenCalled();
    });

    it('should normalize fund item data', async () => {
      const incompleteFund = {
        id: 'fund1',
        type: 'Cash',
        amount: 15000,
        // Missing currency
      };

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemUpdate(incompleteFund);
      });

      // Should normalize and add default currency
      expect(mockFormState.setSelectedFundItem).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'THB', // Default currency
        })
      );
    });

    it('should handle null fund item gracefully', async () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemUpdate(null);
      });

      expect(mockFormState.setSelectedFundItem).not.toHaveBeenCalled();
      expect(mockRefreshFundItems).toHaveBeenCalled();
    });

    it('should handle refresh failure gracefully', async () => {
      mockRefreshFundItems.mockRejectedValueOnce(new Error('Refresh failed'));

      const updatedFund = {
        id: 'fund1',
        type: 'Cash',
        amount: 15000,
        currency: 'THB',
      };

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      // Should not throw error
      await act(async () => {
        await result.current.handleFundItemUpdate(updatedFund);
      });

      // Should have attempted refresh
      expect(mockRefreshFundItems).toHaveBeenCalled();
    });
  });

  describe('handleFundItemCreate', () => {
    it('should refresh fund items after creation', async () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemCreate();
      });

      expect(mockRefreshFundItems).toHaveBeenCalledWith({ forceRefresh: true });
    });

    it('should trigger debounced save after creation', async () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemCreate();
      });

      expect(mockDebouncedSaveData).toHaveBeenCalled();
    });

    it('should close modal after creation', async () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemCreate();
      });

      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(false);
      expect(mockFormState.setCurrentFundItem).toHaveBeenCalledWith(null);
    });

    it('should close modal even if refresh fails', async () => {
      mockRefreshFundItems.mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemCreate();
      });

      // Modal should still close
      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(false);
    });
  });

  describe('handleFundItemDelete', () => {
    it('should remove fund item from state', async () => {
      const funds = [
        { id: 'fund1', type: 'Cash', amount: 10000, currency: 'THB' },
        { id: 'fund2', type: 'Bank', amount: 20000, currency: 'THB' },
      ];
      mockFormState.funds = funds;

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemDelete('fund1');
      });

      expect(mockFormState.setFunds).toHaveBeenCalledWith(
        expect.any(Function)
      );

      // Test the filter function
      const filterFn = mockFormState.setFunds.mock.calls[0][0];
      const result_funds = filterFn(funds);
      expect(result_funds).toHaveLength(1);
      expect(result_funds[0].id).toBe('fund2');
    });

    it('should refresh fund items after deletion', async () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemDelete('fund1');
      });

      expect(mockRefreshFundItems).toHaveBeenCalledWith({ forceRefresh: true });
    });

    it('should trigger debounced save after deletion', async () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemDelete('fund1');
      });

      expect(mockDebouncedSaveData).toHaveBeenCalled();
    });

    it('should close modal after deletion', async () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemDelete('fund1');
      });

      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(false);
      expect(mockFormState.setCurrentFundItem).toHaveBeenCalledWith(null);
    });

    it('should close modal even if refresh fails', async () => {
      mockRefreshFundItems.mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFundItemDelete('fund1');
      });

      // Modal should still close
      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(false);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete fund lifecycle', async () => {
      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      // Step 1: Open modal to add new fund
      act(() => {
        result.current.addFund('Cash');
      });

      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(true);
      expect(mockFormState.setNewFundItemType).toHaveBeenCalledWith('Cash');

      // Step 2: Create fund
      await act(async () => {
        await result.current.handleFundItemCreate();
      });

      expect(mockRefreshFundItems).toHaveBeenCalled();
      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(false);

      // Step 3: Press to edit fund
      const fund = { id: 'fund1', type: 'Cash', amount: 10000, currency: 'THB' };
      act(() => {
        result.current.handleFundItemPress(fund);
      });

      expect(mockFormState.setCurrentFundItem).toHaveBeenCalledWith(fund);

      // Step 4: Update fund
      const updatedFund = { ...fund, amount: 15000 };
      await act(async () => {
        await result.current.handleFundItemUpdate(updatedFund);
      });

      expect(mockFormState.setSelectedFundItem).toHaveBeenCalled();

      // Step 5: Delete fund
      await act(async () => {
        await result.current.handleFundItemDelete('fund1');
      });

      expect(mockFormState.setFunds).toHaveBeenCalled();
      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(false);
    });

    it('should handle multiple fund items', async () => {
      const funds = [
        { id: 'fund1', type: 'Cash', amount: 10000, currency: 'THB' },
        { id: 'fund2', type: 'Bank', amount: 20000, currency: 'THB' },
        { id: 'fund3', type: 'Card', amount: 5000, currency: 'USD' },
      ];
      mockFormState.funds = funds;

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      // Delete middle item
      await act(async () => {
        await result.current.handleFundItemDelete('fund2');
      });

      const filterFn = mockFormState.setFunds.mock.calls[0][0];
      const resultFunds = filterFn(funds);
      expect(resultFunds).toHaveLength(2);
      expect(resultFunds[0].id).toBe('fund1');
      expect(resultFunds[1].id).toBe('fund3');
    });
  });

  describe('Error Handling', () => {
    it('should handle save failure during update', async () => {
      const DebouncedSave = require('../../../utils/DebouncedSave').default;
      DebouncedSave.flushPendingSave.mockRejectedValueOnce(new Error('Save failed'));

      const updatedFund = {
        id: 'fund1',
        type: 'Cash',
        amount: 15000,
        currency: 'THB',
      };

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      // Should not throw
      await act(async () => {
        await result.current.handleFundItemUpdate(updatedFund);
      });

      expect(mockRefreshFundItems).toHaveBeenCalled();
    });

    it('should handle save failure during creation', async () => {
      const DebouncedSave = require('../../../utils/DebouncedSave').default;
      DebouncedSave.flushPendingSave.mockRejectedValueOnce(new Error('Save failed'));

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      // Should not throw and should still close modal
      await act(async () => {
        await result.current.handleFundItemCreate();
      });

      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(false);
    });

    it('should handle save failure during deletion', async () => {
      const DebouncedSave = require('../../../utils/DebouncedSave').default;
      DebouncedSave.flushPendingSave.mockRejectedValueOnce(new Error('Save failed'));

      const { result } = renderHook(() =>
        useThailandFundManagement({
          formState: mockFormState,
          refreshFundItems: mockRefreshFundItems,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      // Should not throw and should still close modal
      await act(async () => {
        await result.current.handleFundItemDelete('fund1');
      });

      expect(mockFormState.setFundItemModalVisible).toHaveBeenCalledWith(false);
    });
  });
});
