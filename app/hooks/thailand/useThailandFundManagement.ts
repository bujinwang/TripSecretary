// @ts-nocheck

// useThailandFundManagement.js
// Custom hook for managing fund items in Thailand Travel Info Screen
import { useCallback } from 'react';
import DebouncedSave from '../../utils/DebouncedSave';

/**
 * Normalizes a fund item to ensure consistent data structure
 */
const normalizeFundItem = (item) => {
  if (!item) {
return null;
}
  return {
    ...item,
    // Ensure all required fields exist
    id: item.id,
    type: item.type,
    amount: item.amount || 0,
    currency: item.currency || 'THB',
  };
};

/**
 * Custom hook for managing fund items (add, update, delete, modal state)
 *
 * @param {Object} formState - Form state from useThailandFormState
 * @param {Function} refreshFundItems - Function to refresh fund items list
 * @param {Function} debouncedSaveData - Function to trigger debounced save
 * @returns {Object} Fund management functions
 */
export const useThailandFundManagement = ({
  formState,
  refreshFundItems,
  debouncedSaveData
}) => {
  /**
   * Opens the fund item modal for adding a new fund item
   */
  const addFund = useCallback((type) => {
    formState.setCurrentFundItem(null);
    formState.setNewFundItemType(type);
    formState.setFundItemModalVisible(true);
  }, [formState]);

  /**
   * Opens the fund item modal for editing an existing fund item
   */
  const handleFundItemPress = useCallback((fund) => {
    formState.setNewFundItemType(null);
    formState.setCurrentFundItem(fund);
    formState.setFundItemModalVisible(true);
  }, [formState]);

  /**
   * Closes the fund item modal and resets state
   */
  const handleFundItemModalClose = useCallback(() => {
    formState.setFundItemModalVisible(false);
    formState.setCurrentFundItem(null);
    formState.setNewFundItemType(null);
  }, [formState]);

  /**
   * Handles updating an existing fund item
   * Refreshes the fund items list and triggers save
   */
  const handleFundItemUpdate = useCallback(async (updatedItem) => {
    try {
      if (updatedItem) {
        formState.setSelectedFundItem(normalizeFundItem(updatedItem));
      }
      await refreshFundItems({ forceRefresh: true });

      // Trigger save to update entry_info with new fund item associations
      console.log('💾 Triggering save after fund item update...');
      await DebouncedSave.flushPendingSave('thailand_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Failed to update fund item state:', error);
    }
  }, [formState, refreshFundItems, debouncedSaveData]);

  /**
   * Handles creating a new fund item
   * Refreshes the fund items list, triggers save, and closes modal
   */
  const handleFundItemCreate = useCallback(async () => {
    try {
      await refreshFundItems({ forceRefresh: true });

      // Trigger save to update entry_info with new fund item
      console.log('💾 Triggering save after fund item creation...');
      await DebouncedSave.flushPendingSave('thailand_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Failed to refresh fund items after creation:', error);
    } finally {
      handleFundItemModalClose();
    }
  }, [refreshFundItems, debouncedSaveData, handleFundItemModalClose]);

  /**
   * Handles deleting a fund item
   * Removes from state, refreshes list, triggers save, and closes modal
   */
  const handleFundItemDelete = useCallback(async (id) => {
    try {
      formState.setFunds((prev) => prev.filter((fund) => fund.id !== id));
      await refreshFundItems({ forceRefresh: true });

      // Trigger save to update entry_info after fund item deletion
      console.log('💾 Triggering save after fund item deletion...');
      await DebouncedSave.flushPendingSave('thailand_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Failed to refresh fund items after deletion:', error);
    } finally {
      handleFundItemModalClose();
    }
  }, [formState, refreshFundItems, debouncedSaveData, handleFundItemModalClose]);

  return {
    // Modal management
    addFund,
    handleFundItemPress,
    handleFundItemModalClose,

    // CRUD operations
    handleFundItemUpdate,
    handleFundItemCreate,
    handleFundItemDelete,
  };
};

export default useThailandFundManagement;
