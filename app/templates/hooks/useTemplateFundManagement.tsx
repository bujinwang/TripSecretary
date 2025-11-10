// @ts-nocheck

import { useCallback } from 'react';
import logger from '../../services/LoggingService';
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
    if (__DEV__) {
      logger.info('[FundManagement] addFund called with type:', fundType);
    }
    
    if (!config.sections?.funds?.enabled) {
      logger.warn('[FundManagement] Funds section is not enabled');
      return;
    }

    if (!setFormState || typeof setFormState !== 'function') {
      logger.error('[FundManagement] setFormState is not a function:', setFormState);
      return;
    }

    if (__DEV__) {
      logger.info('[FundManagement] Setting modal visible for fund type:', fundType);
    }
    
    // updateFormState expects an object, not a function
    setFormState({
      fundItemModalVisible: true,
      currentFundItem: null,
      newFundItemType: fundType,
    });
  }, [config.sections, setFormState]);

  /**
   * Edit existing fund (opens modal)
   */
  const handleFundItemPress = useCallback((fundItem) => {
    if (!config.sections?.funds?.enabled) {
return;
}

    setFormState({
      fundItemModalVisible: true,
      currentFundItem: fundItem,
      newFundItemType: null,
    });
  }, [config.sections, setFormState]);

  /**
   * Close fund modal
   */
  const handleFundItemModalClose = useCallback(() => {
    setFormState({
      fundItemModalVisible: false,
      currentFundItem: null,
      newFundItemType: null,
    });
  }, [setFormState]);

  /**
   * Update existing fund item
   */
  const handleFundItemUpdate = useCallback(async (updatedFundItem) => {
    try {
      // Update in UserDataService using saveFundItem (it handles both create and update)
      const saved = await UserDataService.saveFundItem(updatedFundItem, userId);

      // Update local state
      setFormState({
        funds: (formState.funds || []).map(f => f.id === updatedFundItem.id ? saved : f),
        fundItemModalVisible: false,
        currentFundItem: null,
      });

      debouncedSave();
    } catch (error) {
      logger.error('[FundManagement] Error updating fund item:', error);
      throw error;
    }
  }, [userId, formState.funds, setFormState, debouncedSave]);

  /**
   * Create new fund item
   */
  const handleFundItemCreate = useCallback(async (newFundItem) => {
    try {
      // Create in UserDataService using saveFundItem
      const created = await UserDataService.saveFundItem(newFundItem, userId);

      // Update local state
      setFormState({
        funds: [...(formState.funds || []), created],
        fundItemModalVisible: false,
        newFundItemType: null,
      });

      debouncedSave();
    } catch (error) {
      logger.error('[FundManagement] Error creating fund item:', error);
      throw error;
    }
  }, [userId, formState.funds, setFormState, debouncedSave]);

  /**
   * Delete fund item
   */
  const handleFundItemDelete = useCallback(async (fundItemId) => {
    try {
      // Delete from UserDataService
      await UserDataService.deleteFundItem(fundItemId, userId);

      // Update local state
      setFormState({
        funds: (formState.funds || []).filter(f => f.id !== fundItemId),
        fundItemModalVisible: false,
        currentFundItem: null,
      });

      debouncedSave();
    } catch (error) {
      logger.error('[FundManagement] Error deleting fund item:', error);
      throw error;
    }
  }, [userId, formState.funds, setFormState, debouncedSave]);

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
      logger.error('[FundManagement] Error refreshing fund items:', error);
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
