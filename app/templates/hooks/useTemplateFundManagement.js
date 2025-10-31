/**
 * useTemplateFundManagement Hook
 *
 * Ported from Thailand's useThailandFundManagement
 * Manages fund item CRUD operations and modal state.
 *
 * Features:
 * - Fund modal state management
 * - Add fund handler (opens modal for new fund)
 * - Edit fund handler (opens modal with existing fund)
 * - Delete fund handler
 * - Update fund handler
 * - Create fund handler
 * - Integration with data persistence
 */

import { useCallback } from 'react';
import UserDataService from '../../services/data/UserDataService';

/**
 * useTemplateFundManagement Hook
 *
 * @param {Object} params - Hook parameters
 * @param {Object} params.config - Template configuration
 * @param {Object} params.formState - Form state
 * @param {Function} params.setFormState - Set form state function
 * @param {Function} params.debouncedSave - Debounced save function
 * @param {string} params.userId - User ID
 * @returns {Object} Fund management methods
 */
export const useTemplateFundManagement = ({
  config,
  formState,
  setFormState,
  debouncedSave,
  userId,
}) => {
  /**
   * Add new fund (opens modal)
   */
  const addFund = useCallback((fundType) => {
    if (!config.sections?.funds?.enabled) return;

    setFormState(prev => ({
      ...prev,
      fundItemModalVisible: true,
      currentFundItem: null,
      newFundItemType: fundType,
    }));
  }, [config.sections, setFormState]);

  /**
   * Edit existing fund (opens modal)
   */
  const handleFundItemPress = useCallback((fundItem) => {
    if (!config.sections?.funds?.enabled) return;

    setFormState(prev => ({
      ...prev,
      fundItemModalVisible: true,
      currentFundItem: fundItem,
      newFundItemType: null,
    }));
  }, [config.sections, setFormState]);

  /**
   * Close fund modal
   */
  const handleFundItemModalClose = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      fundItemModalVisible: false,
      currentFundItem: null,
      newFundItemType: null,
    }));
  }, [setFormState]);

  /**
   * Update existing fund item
   */
  const handleFundItemUpdate = useCallback(async (updatedFundItem) => {
    try {
      // Update in UserDataService
      await UserDataService.updateFundItem(updatedFundItem, userId);

      // Update local state
      setFormState(prev => ({
        ...prev,
        funds: prev.funds.map(f => f.id === updatedFundItem.id ? updatedFundItem : f),
        fundItemModalVisible: false,
        currentFundItem: null,
      }));

      debouncedSave();
    } catch (error) {
      console.error('[FundManagement] Error updating fund item:', error);
      throw error;
    }
  }, [userId, setFormState, debouncedSave]);

  /**
   * Create new fund item
   */
  const handleFundItemCreate = useCallback(async (newFundItem) => {
    try {
      // Create in UserDataService
      const created = await UserDataService.createFundItem(newFundItem, userId);

      // Update local state
      setFormState(prev => ({
        ...prev,
        funds: [...(prev.funds || []), created],
        fundItemModalVisible: false,
        newFundItemType: null,
      }));

      debouncedSave();
    } catch (error) {
      console.error('[FundManagement] Error creating fund item:', error);
      throw error;
    }
  }, [userId, setFormState, debouncedSave]);

  /**
   * Delete fund item
   */
  const handleFundItemDelete = useCallback(async (fundItemId) => {
    try {
      // Delete from UserDataService
      await UserDataService.deleteFundItem(fundItemId, userId);

      // Update local state
      setFormState(prev => ({
        ...prev,
        funds: prev.funds.filter(f => f.id !== fundItemId),
        fundItemModalVisible: false,
        currentFundItem: null,
      }));

      debouncedSave();
    } catch (error) {
      console.error('[FundManagement] Error deleting fund item:', error);
      throw error;
    }
  }, [userId, setFormState, debouncedSave]);

  /**
   * Refresh fund items from database
   */
  const refreshFundItems = useCallback(async () => {
    try {
      await UserDataService.initialize(userId);
      const funds = await UserDataService.getFundItems(userId);

      setFormState(prev => ({
        ...prev,
        funds: funds || [],
      }));
    } catch (error) {
      console.error('[FundManagement] Error refreshing fund items:', error);
    }
  }, [userId, setFormState]);

  return {
    // Handlers
    addFund,
    handleFundItemPress,
    handleFundItemModalClose,
    handleFundItemUpdate,
    handleFundItemCreate,
    handleFundItemDelete,
    refreshFundItems,
  };
};

export default useTemplateFundManagement;
