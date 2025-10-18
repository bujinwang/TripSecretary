// 入境通 - Fund Item Detail Modal Component
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Animated,
  Alert,
  ActivityIndicator,
  PanResponder,
  Dimensions,
  BackHandler,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';
import Button from './Button';
import Input from './Input';

const FundItemDetailModal = ({
  visible,
  fundItem,
  onClose,
  onUpdate,
  onDelete,
  onManageAll,
  isCreateMode = false,
  createItemType = null,
  onCreate = null,
}) => {
  const { t } = useTranslation();
  const [slideAnim] = useState(new Animated.Value(0));
  const [mode, setMode] = useState('view'); // 'view', 'edit', 'photo'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Photo view state
  const [photoScale] = useState(new Animated.Value(1));
  const [photoTranslateX] = useState(new Animated.Value(0));
  const [photoTranslateY] = useState(new Animated.Value(0));
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const initialDistance = useRef(null);

  // PanResponder for photo zoom and pan (must be registered before any early returns)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store current values when gesture starts
        lastScale.current = photoScale._value;
        lastTranslateX.current = photoTranslateX._value;
        lastTranslateY.current = photoTranslateY._value;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Handle pinch zoom with two fingers
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          if (!initialDistance.current) {
            initialDistance.current = distance;
          } else {
            const scale = (distance / initialDistance.current) * lastScale.current;
            const clampedScale = Math.max(1, Math.min(scale, 4)); // Limit zoom between 1x and 4x
            photoScale.setValue(clampedScale);
          }
        } else if (lastScale.current > 1) {
          // Handle pan only when zoomed in
          photoTranslateX.setValue(lastTranslateX.current + gestureState.dx);
          photoTranslateY.setValue(lastTranslateY.current + gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        initialDistance.current = null;
        
        // Reset zoom if scale is close to 1
        if (photoScale._value < 1.1) {
          Animated.parallel([
            Animated.spring(photoScale, {
              toValue: 1,
              useNativeDriver: true,
            }),
            Animated.spring(photoTranslateX, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(photoTranslateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
          ]).start();
          lastScale.current = 1;
          lastTranslateX.current = 0;
          lastTranslateY.current = 0;
        }
      },
    })
  ).current;
  
  // Edit mode state
  const [editedAmount, setEditedAmount] = useState('');
  const [editedCurrency, setEditedCurrency] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState({
    amount: '',
    currency: '',
  });

  // Common currencies
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '\u20AC', name: 'Euro' },
    { code: 'GBP', symbol: '\u00A3', name: 'British Pound' },
    { code: 'CNY', symbol: '\u00A5', name: 'Chinese Yuan' },
    { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen' },
    { code: 'THB', symbol: '\u0E3F', name: 'Thai Baht' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'KRW', symbol: '\u20A9', name: 'South Korean Won' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  ];

  // Reset state when modal opens/closes or fundItem changes
  useEffect(() => {
    if (visible && fundItem && !isCreateMode) {
      try {
        console.log('[FundItemDetailModal] Modal opened with fund item:', {
          fundItemId: fundItem.id,
          type: fundItem.type || fundItem.itemType,
          hasPhoto: !!(fundItem.photoUri || fundItem.photo),
          photoUri: fundItem.photoUri,
          photo: fundItem.photo,
          allKeys: Object.keys(fundItem),
        });
        
        setMode('view');
        setError(null);
        setValidationErrors({ amount: '', currency: '' });
        setEditedAmount(fundItem.amount ? fundItem.amount.toString() : '');
        setEditedCurrency(fundItem.currency || 'THB');
        // Handle both 'description' and 'details' fields
        setEditedDescription(fundItem.description || fundItem.details || '');
        // Reset photo view transforms
        photoScale.setValue(1);
        photoTranslateX.setValue(0);
        photoTranslateY.setValue(0);
        
        console.log('[FundItemDetailModal] Modal state initialized successfully');
      } catch (err) {
        console.error('[FundItemDetailModal] Error initializing modal state:', {
          error: err.message,
          stack: err.stack,
          fundItemId: fundItem?.id,
        });
        setError(t('fundItem.errors.loadFailed', { 
          defaultValue: 'Failed to load fund item details' 
        }));
      }
    } else if (!visible) {
      console.log('[FundItemDetailModal] Modal closed');
    }
  }, [visible, fundItem]);

  // Initialize state for create mode
  useEffect(() => {
    if (visible && isCreateMode && createItemType) {
      try {
        console.log('[FundItemDetailModal] Initializing create mode:', {
          createItemType,
        });
        
        setMode('edit'); // Start in edit mode for creation
        setError(null);
        setValidationErrors({ amount: '', currency: '' });
        setEditedAmount('');
        setEditedCurrency('THB');
        setEditedDescription('');
        // Reset photo view transforms
        photoScale.setValue(1);
        photoTranslateX.setValue(0);
        photoTranslateY.setValue(0);
        
        console.log('[FundItemDetailModal] Create mode initialized successfully');
      } catch (err) {
        console.error('[FundItemDetailModal] Error initializing create mode:', {
          error: err.message,
          stack: err.stack,
          createItemType,
        });
        setError(t('fundItem.errors.loadFailed', { 
          defaultValue: 'Failed to initialize create mode' 
        }));
      }
    }
  }, [visible, isCreateMode, createItemType]);

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mode === 'photo') {
        // Close photo view and return to detail view
        handleClosePhotoView();
        return true;
      } else if (mode === 'edit') {
        // Cancel edit mode and return to view mode
        handleCancelEdit();
        return true;
      } else if (showCurrencyPicker) {
        // Close currency picker
        setShowCurrencyPicker(false);
        return true;
      } else {
        // Close modal
        onClose();
        return true;
      }
    });

    return () => backHandler.remove();
  }, [visible, mode, showCurrencyPicker]);

  // Animate modal entrance/exit
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Allow null fundItem when in create mode
  if (!fundItem && !isCreateMode) {
    console.log('[FundItemDetailModal] No fund item provided, modal will not render');
    return null;
  }

  const isAmountBasedType = (value) => {
    if (!value) return false;
    const normalized = value.toString().toLowerCase();
    return normalized === 'cash' ||
      normalized === 'bank_card' ||
      normalized === 'credit_card' ||
      normalized === 'bank_balance' ||
      normalized === 'investment';
  };

  // Validation functions
  const validateAmount = (value) => {
    if (!value || value.trim() === '') {
      return t('fundItem.validation.amountRequired', { 
        defaultValue: 'Amount is required' 
      });
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return t('fundItem.validation.amountInvalid', { 
        defaultValue: 'Amount must be a valid number' 
      });
    }
    if (numValue <= 0) {
      return t('fundItem.validation.amountPositive', { 
        defaultValue: 'Amount must be greater than 0' 
      });
    }
    return '';
  };

  const validateCurrency = (value) => {
    if (!value || value.trim() === '') {
      return t('fundItem.validation.currencyRequired', { 
        defaultValue: 'Currency is required' 
      });
    }
    if (value.length !== 3) {
      return t('fundItem.validation.currencyFormat', { 
        defaultValue: 'Currency must be a 3-letter code' 
      });
    }
    return '';
  };

  // Handle edit mode
  const handleEdit = () => {
    try {
      console.log('[FundItemDetailModal] Switching to edit mode...', {
        fundItemId: fundItem?.id,
      });
      
      setMode('edit');
      setError(null);
      setValidationErrors({ amount: '', currency: '' });
      
      console.log('[FundItemDetailModal] Edit mode activated');
    } catch (err) {
      console.error('[FundItemDetailModal] Error switching to edit mode:', {
        error: err.message,
        stack: err.stack,
        fundItemId: fundItem?.id,
      });
      setError(t('fundItem.errors.editModeFailed', { 
        defaultValue: 'Failed to enter edit mode. Please try again.' 
      }));
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    try {
      console.log('[FundItemDetailModal] Cancelling edit mode...', {
        fundItemId: fundItem?.id,
      });
      
      setMode('view');
      setError(null);
      setValidationErrors({ amount: '', currency: '' });
      // Reset to original values
      setEditedAmount(fundItem.amount ? fundItem.amount.toString() : '');
      setEditedCurrency(fundItem.currency || 'THB');
      // Handle both 'description' and 'details' fields
      setEditedDescription(fundItem.description || fundItem.details || '');
      
      console.log('[FundItemDetailModal] Edit cancelled, returned to view mode');
    } catch (err) {
      console.error('[FundItemDetailModal] Error cancelling edit mode:', {
        error: err.message,
        stack: err.stack,
        fundItemId: fundItem?.id,
      });
      // Still try to return to view mode even if there's an error
      setMode('view');
    }
  };

  // Handle save
  const handleSave = async () => {
    console.log('[FundItemDetailModal] Starting save operation...', {
      fundItemId: fundItem?.id,
      mode,
      isCreateMode,
    });
    
    // Get the item type - handle both 'type' and 'itemType' fields
    const itemType = isCreateMode ? createItemType : (fundItem.itemType || fundItem.type);
    
    // Validate for amount-based types
    if (isAmountBasedType(itemType)) {
      console.log('[FundItemDetailModal] Validating amount and currency fields...');
      
      const amountError = validateAmount(editedAmount);
      const currencyError = validateCurrency(editedCurrency);
      
      if (amountError || currencyError) {
        console.warn('[FundItemDetailModal] Validation failed:', {
          amountError,
          currencyError,
        });
        setValidationErrors({
          amount: amountError,
          currency: currencyError,
        });
        return;
      }
      
      console.log('[FundItemDetailModal] Validation passed');
    }

    setLoading(true);
    setError(null);

    try {
      // Import PassportDataService
      const PassportDataService = require('../services/data/PassportDataService').default;
      
      if (isCreateMode) {
        // Create new fund item
        const shouldUpdateAmount = isAmountBasedType(itemType);
        
        const fundData = {
          type: createItemType,
          amount: shouldUpdateAmount ? parseFloat(editedAmount) : null,
          currency: shouldUpdateAmount ? editedCurrency.toUpperCase() : null,
          details: editedDescription,
          photoUri: null, // No photo on initial creation
        };

        console.log('[FundItemDetailModal] Prepared fund data for creation:', {
          type: fundData.type,
          amount: fundData.amount,
          currency: fundData.currency,
        });

        // Get userId - use default for new items
        const userId = 'default_user';
        
        // Create the new fund item using PassportDataService
        console.log('[FundItemDetailModal] Calling PassportDataService.saveFundItem for creation...');
        const newFundItem = await PassportDataService.saveFundItem(fundData, userId);
        
        console.log('[FundItemDetailModal] Fund item created successfully:', {
          fundItemId: newFundItem.id,
          timestamp: new Date().toISOString(),
        });
        
        // Call onCreate callback if provided
        if (onCreate) {
          console.log('[FundItemDetailModal] Calling onCreate callback...');
          await onCreate(newFundItem);
        }
        
        console.log('[FundItemDetailModal] Create operation completed');
      } else {
        // Update existing fund item
        const shouldUpdateAmount = isAmountBasedType(itemType);
        
        const fundData = {
          id: fundItem.id,
          type: fundItem.type || fundItem.itemType, // Use the original type field
          amount: shouldUpdateAmount ? parseFloat(editedAmount) : fundItem.amount,
          currency: shouldUpdateAmount ? editedCurrency.toUpperCase() : fundItem.currency,
          details: editedDescription, // Map description to details
          photoUri: fundItem.photoUri || fundItem.photo,
        };

        console.log('[FundItemDetailModal] Prepared fund data for save:', {
          fundItemId: fundData.id,
          type: fundData.type,
          amount: fundData.amount,
          currency: fundData.currency,
          hasPhoto: !!fundData.photoUri,
        });

        // Get userId from fundItem or use default
        const userId = fundItem.userId || 'default_user';
        
        // Save the updated fund item using PassportDataService
        console.log('[FundItemDetailModal] Calling PassportDataService.saveFundItem...');
        const updatedFundItem = await PassportDataService.saveFundItem(fundData, userId);
        
        console.log('[FundItemDetailModal] Fund item updated successfully:', {
          fundItemId: updatedFundItem.id,
          timestamp: new Date().toISOString(),
        });
        
        // Call onUpdate callback if provided
        if (onUpdate) {
          console.log('[FundItemDetailModal] Calling onUpdate callback...');
          await onUpdate(updatedFundItem);
          console.log('[FundItemDetailModal] onUpdate callback completed');
        } else {
          console.warn('[FundItemDetailModal] No onUpdate callback provided');
        }
        
        setMode('view');
        console.log('[FundItemDetailModal] Save operation completed, switched to view mode');
      }
    } catch (err) {
      console.error('[FundItemDetailModal] Failed to save fund item:', {
        error: err.message,
        stack: err.stack,
        fundItemId: fundItem?.id,
        isCreateMode,
        editedData: {
          amount: editedAmount,
          currency: editedCurrency,
          description: editedDescription,
        },
      });
      setError(t(isCreateMode ? 'fundItem.errors.createFailed' : 'fundItem.errors.updateFailed', { 
        defaultValue: isCreateMode ? 'Failed to create fund item. Please try again.' : 'Failed to save changes. Please try again.' 
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    console.log('[FundItemDetailModal] Delete button pressed, showing confirmation dialog...', {
      fundItemId: fundItem?.id,
    });
    
    // Show confirmation dialog
    Alert.alert(
      t('fundItem.deleteConfirm.title', { defaultValue: 'Delete Fund Item' }),
      t('fundItem.deleteConfirm.message', { 
        defaultValue: 'Are you sure you want to delete this fund item?' 
      }),
      [
        {
          text: t('fundItem.deleteConfirm.cancel', { defaultValue: 'Cancel' }),
          style: 'cancel',
          onPress: () => {
            console.log('[FundItemDetailModal] Delete cancelled by user');
          },
        },
        {
          text: t('fundItem.deleteConfirm.confirm', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            console.log('[FundItemDetailModal] Delete confirmed, starting deletion...', {
              fundItemId: fundItem?.id,
            });
            
            setLoading(true);
            setError(null);

            try {
              // Import PassportDataService
              const PassportDataService = require('../services/data/PassportDataService').default;
              
              // Get userId from fundItem or use default
              const userId = fundItem.userId || 'default_user';
              
              console.log('[FundItemDetailModal] Calling PassportDataService.deleteFundItem...', {
                fundItemId: fundItem.id,
                userId,
              });
              
              // Delete the fund item using PassportDataService
              await PassportDataService.deleteFundItem(fundItem.id, userId);
              
              console.log('[FundItemDetailModal] Fund item deleted successfully:', {
                fundItemId: fundItem.id,
                timestamp: new Date().toISOString(),
              });
              
              // Call onDelete callback if provided
              if (onDelete) {
                console.log('[FundItemDetailModal] Calling onDelete callback...');
                await onDelete(fundItem.id);
              }
              
              // Close the modal
              console.log('[FundItemDetailModal] Closing modal after successful deletion');
              onClose();
            } catch (err) {
              console.error('[FundItemDetailModal] Failed to delete fund item:', {
                error: err.message,
                stack: err.stack,
                fundItemId: fundItem?.id,
              });
              setError(t('fundItem.errors.deleteFailed', { 
                defaultValue: 'Failed to delete fund item. Please try again.' 
              }));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Handle currency selection
  const handleCurrencySelect = (currencyCode) => {
    try {
      console.log('[FundItemDetailModal] Currency selected:', {
        currencyCode,
        fundItemId: fundItem?.id,
      });
      
      setEditedCurrency(currencyCode);
      setShowCurrencyPicker(false);
      setValidationErrors({ ...validationErrors, currency: '' });
      
      console.log('[FundItemDetailModal] Currency updated successfully');
    } catch (err) {
      console.error('[FundItemDetailModal] Error selecting currency:', {
        error: err.message,
        stack: err.stack,
        currencyCode,
        fundItemId: fundItem?.id,
      });
      setError(t('fundItem.errors.currencySelectFailed', { 
        defaultValue: 'Failed to select currency. Please try again.' 
      }));
    }
  };

  // Handle photo press to open full-screen view
  const handlePhotoPress = () => {
    try {
      if (fundItem.photoUri) {
        console.log('[FundItemDetailModal] Opening full-screen photo view...', {
          fundItemId: fundItem?.id,
        });
        
        setMode('photo');
        // Reset transforms
        photoScale.setValue(1);
        photoTranslateX.setValue(0);
        photoTranslateY.setValue(0);
        
        console.log('[FundItemDetailModal] Photo view opened');
      } else {
        console.warn('[FundItemDetailModal] Attempted to open photo view but no photo exists');
      }
    } catch (err) {
      console.error('[FundItemDetailModal] Error opening photo view:', {
        error: err.message,
        stack: err.stack,
        fundItemId: fundItem?.id,
      });
      setError(t('fundItem.errors.photoViewFailed', { 
        defaultValue: 'Failed to open photo view. Please try again.' 
      }));
    }
  };

  // Handle close photo view
  const handleClosePhotoView = () => {
    try {
      console.log('[FundItemDetailModal] Closing photo view...', {
        fundItemId: fundItem?.id,
      });
      
      setMode('view');
      
      console.log('[FundItemDetailModal] Photo view closed');
    } catch (err) {
      console.error('[FundItemDetailModal] Error closing photo view:', {
        error: err.message,
        stack: err.stack,
        fundItemId: fundItem?.id,
      });
      // Still try to return to view mode even if there's an error
      setMode('view');
    }
  };

  // Handle add/replace photo
  const handleAddPhoto = async () => {
    try {
      console.log('[FundItemDetailModal] Requesting photo library permissions...');
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      console.log('[FundItemDetailModal] Photo library permission status:', status);
      
      if (status !== 'granted') {
        console.warn('[FundItemDetailModal] Photo library permission denied');
        Alert.alert(
          t('fundItem.errors.permissionTitle', { defaultValue: 'Permission Required' }),
          t('fundItem.errors.permissionMessage', { 
            defaultValue: 'Please grant permission to access your photo library.' 
          })
        );
        return;
      }

      // Show options: Take Photo or Choose from Library
      console.log('[FundItemDetailModal] Showing photo source options');
      Alert.alert(
        t('fundItem.detail.addPhoto', { defaultValue: 'Add Photo' }),
        t('fundItem.detail.photoOptions', { defaultValue: 'Choose an option' }),
        [
          {
            text: t('fundItem.detail.takePhoto', { defaultValue: 'Take Photo' }),
            onPress: () => handleTakePhoto(),
          },
          {
            text: t('fundItem.detail.chooseFromLibrary', { defaultValue: 'Choose from Library' }),
            onPress: () => handlePickImage(),
          },
          {
            text: t('common.cancel', { defaultValue: 'Cancel' }),
            style: 'cancel',
          },
        ]
      );
    } catch (err) {
      console.error('[FundItemDetailModal] Error requesting photo permissions:', {
        error: err.message,
        stack: err.stack,
        fundItemId: fundItem?.id,
      });
      setError(t('fundItem.errors.photoFailed', { 
        defaultValue: 'Failed to access photos. Please try again.' 
      }));
    }
  };

  // Handle take photo with camera
  const handleTakePhoto = async () => {
    try {
      console.log('[FundItemDetailModal] Requesting camera permissions...');
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      console.log('[FundItemDetailModal] Camera permission status:', status);
      
      if (status !== 'granted') {
        console.warn('[FundItemDetailModal] Camera permission denied');
        Alert.alert(
          t('fundItem.errors.permissionTitle', { defaultValue: 'Permission Required' }),
          t('fundItem.errors.cameraPermissionMessage', { 
            defaultValue: 'Please grant permission to access your camera.' 
          })
        );
        return;
      }

      console.log('[FundItemDetailModal] Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('[FundItemDetailModal] Photo captured successfully');
        await handlePhotoSelected(result.assets[0]);
      } else {
        console.log('[FundItemDetailModal] Photo capture cancelled by user');
      }
    } catch (err) {
      console.error('[FundItemDetailModal] Error taking photo:', {
        error: err.message,
        stack: err.stack,
        fundItemId: fundItem?.id,
      });
      setError(t('fundItem.errors.photoFailed', { 
        defaultValue: 'Failed to take photo. Please try again.' 
      }));
    }
  };

  // Handle pick image from library
  const handlePickImage = async () => {
    try {
      console.log('[FundItemDetailModal] Launching image library...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('[FundItemDetailModal] Image selected successfully');
        await handlePhotoSelected(result.assets[0]);
      } else {
        console.log('[FundItemDetailModal] Image selection cancelled by user');
      }
    } catch (err) {
      console.error('[FundItemDetailModal] Error picking image:', {
        error: err.message,
        stack: err.stack,
        fundItemId: fundItem?.id,
      });
      setError(t('fundItem.errors.photoFailed', { 
        defaultValue: 'Failed to select photo. Please try again.' 
      }));
    }
  };

  // Handle photo selected (compression and base64 conversion)
  const handlePhotoSelected = async (asset) => {
    try {
      console.log('[FundItemDetailModal] Processing selected photo...', {
        fundItemId: fundItem?.id,
        isCreateMode,
        hasBase64: !!asset.base64,
        hasUri: !!asset.uri,
      });
      
      setLoading(true);
      setError(null);

      // Convert to base64 data URI
      let photoUri;
      if (asset.base64) {
        // Image picker already provided base64
        photoUri = `data:image/jpeg;base64,${asset.base64}`;
        console.log('[FundItemDetailModal] Using base64 photo data');
      } else if (asset.uri) {
        // Fallback to URI if base64 not available
        photoUri = asset.uri;
        console.log('[FundItemDetailModal] Using photo URI:', asset.uri);
      } else {
        throw new Error('No image data available');
      }

      if (isCreateMode) {
        // In create mode, just store the photo URI temporarily
        // It will be saved when the user saves the fund item
        console.log('[FundItemDetailModal] Storing photo for new fund item');
        // We can't update fundItem directly in create mode, so we'll need to handle this differently
        // For now, just show a message that photo will be saved with the item
        Alert.alert(
          t('fundItem.success.photoSelected', { defaultValue: 'Photo Selected' }),
          t('fundItem.success.photoSelectedMessage', { 
            defaultValue: 'Photo will be saved when you create the fund item.' 
          })
        );
      } else {
        // Import PassportDataService
        const PassportDataService = require('../services/data/PassportDataService').default;
        
        // Update fund item with new photo
        const fundData = {
          id: fundItem.id,
          type: fundItem.type || fundItem.itemType,
          amount: fundItem.amount,
          currency: fundItem.currency,
          details: fundItem.description || fundItem.details,
          photoUri: photoUri,
        };

        // Get userId from fundItem or use default
        const userId = fundItem.userId || 'default_user';
        
        console.log('[FundItemDetailModal] Saving fund item with new photo...', {
          fundItemId: fundData.id,
          userId,
        });
        
        // Save the updated fund item
        const updatedFundItem = await PassportDataService.saveFundItem(fundData, userId);
        
        console.log('[FundItemDetailModal] Fund item photo updated successfully:', {
          fundItemId: updatedFundItem.id,
          hasPhoto: !!updatedFundItem.photoUri,
        });
        
        // Call onUpdate callback if provided
        if (onUpdate) {
          console.log('[FundItemDetailModal] Calling onUpdate callback...');
          await onUpdate(updatedFundItem);
        }
        
        // Show success message
        Alert.alert(
          t('fundItem.success.photoUpdated', { defaultValue: 'Success' }),
          t('fundItem.success.photoUpdatedMessage', { 
            defaultValue: 'Photo has been updated successfully.' 
          })
        );
      }
    } catch (err) {
      console.error('[FundItemDetailModal] Failed to update photo:', {
        error: err.message,
        stack: err.stack,
        fundItemId: fundItem?.id,
        isCreateMode,
      });
      setError(t('fundItem.errors.photoFailed', { 
        defaultValue: 'Failed to update photo. Please try again.' 
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle replace photo
  const handleReplacePhoto = () => {
    handleAddPhoto(); // Same flow as add photo
  };

  // Get fund item type display
  const getItemTypeDisplay = () => {
    // Handle both 'type' and 'itemType' fields, and both uppercase and lowercase values
    const itemType = isCreateMode 
      ? (createItemType || '').toUpperCase()
      : (fundItem?.itemType || fundItem?.type || '').toUpperCase();
    
    const typeMap = {
      CASH: {
        icon: '💵',
        label: t('fundItem.types.CASH', { defaultValue: 'Cash' }),
      },
      BANK_CARD: {
        icon: '💳',
        label: t('fundItem.types.BANK_CARD', { defaultValue: 'Bank Card' }),
      },
      CREDIT_CARD: {
        icon: '💳',
        label: t('fundItem.types.BANK_CARD', { defaultValue: 'Bank Card' }),
      },
      DOCUMENT: {
        icon: '📄',
        label: t('fundItem.types.DOCUMENT', { defaultValue: 'Supporting Document' }),
      },
      OTHER: {
        icon: '💰',
        label: t('fundItem.types.OTHER', { defaultValue: 'Other' }),
      },
      BANK_BALANCE: {
        icon: '🏦',
        label: t('fundItem.types.BANK_BALANCE', { defaultValue: 'Bank Balance' }),
      },
      INVESTMENT: {
        icon: '📈',
        label: t('fundItem.types.INVESTMENT', { defaultValue: 'Investment' }),
      },
    };
    return typeMap[itemType] || { icon: '💰', label: itemType };
  };

  const itemTypeDisplay = getItemTypeDisplay();

  // Format amount display
  const formatAmountValue = () => {
    if (!fundItem || fundItem.amount === null || fundItem.amount === undefined || fundItem.amount === '') {
      return null;
    }

    if (typeof fundItem.amount === 'number' && Number.isFinite(fundItem.amount)) {
      return fundItem.amount.toLocaleString();
    }

    const parsedAmount = Number(
      typeof fundItem.amount === 'string'
        ? fundItem.amount.replace(/,/g, '').trim()
        : fundItem.amount
    );

    if (!Number.isNaN(parsedAmount) && Number.isFinite(parsedAmount)) {
      return parsedAmount.toLocaleString();
    }

    return `${fundItem.amount}`;
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  // Render currency picker
  const renderCurrencyPicker = () => {
    if (!showCurrencyPicker) return null;

    return (
      <View style={styles.currencyPickerOverlay}>
        <TouchableOpacity
          style={styles.currencyPickerBackdrop}
          activeOpacity={1}
          onPress={() => setShowCurrencyPicker(false)}
          accessibilityRole="button"
          accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
        />
        <View 
          style={styles.currencyPickerContent}
          accessibilityViewIsModal={true}
        >
          <View style={styles.currencyPickerHeader}>
            <Text style={styles.currencyPickerTitle}>
              {t('fundItem.fields.selectCurrency', { defaultValue: 'Select Currency' })}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCurrencyPicker(false)}
              style={styles.currencyPickerClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
              accessibilityHint={t('fundItem.accessibility.closeCurrencyPickerHint', { 
                defaultValue: 'Closes the currency picker' 
              })}
            >
              <Text style={styles.currencyPickerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.currencyPickerList}>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyOption,
                  editedCurrency === currency.code && styles.currencyOptionSelected,
                ]}
                onPress={() => handleCurrencySelect(currency.code)}
                accessibilityRole="button"
                accessibilityLabel={`${currency.name}, ${currency.code}`}
                accessibilityState={{ selected: editedCurrency === currency.code }}
                accessibilityHint={t('fundItem.accessibility.selectCurrencyHint', { 
                  defaultValue: 'Selects this currency' 
                })}
              >
                <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyCode}>{currency.code}</Text>
                  <Text style={styles.currencyName}>{currency.name}</Text>
                </View>
                {editedCurrency === currency.code && (
                  <Text style={styles.currencyCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  // Render edit mode
  const renderEditMode = () => {
    // Get the item type - handle both 'type' and 'itemType' fields, or use createItemType in create mode
    const itemType = isCreateMode ? createItemType : (fundItem?.itemType || fundItem?.type);
    const shouldShowAmountFields = isAmountBasedType(itemType);
    
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Type Display (read-only) */}
        <View style={styles.section}>
          <View 
            style={styles.itemTypeContainer}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${t('fundItem.fields.type', { defaultValue: 'Type' })}: ${itemTypeDisplay.label}`}
          >
            <Text style={styles.itemTypeIcon} accessible={false}>{itemTypeDisplay.icon}</Text>
            <Text style={styles.itemTypeLabel} accessible={false}>{itemTypeDisplay.label}</Text>
          </View>
        </View>

        {/* Amount Input (for CASH and BANK_CARD) */}
        {shouldShowAmountFields && (
          <View style={styles.section}>
            <Input
              label={t('fundItem.fields.amount', { defaultValue: 'Amount' }) + ' *'}
              value={editedAmount}
              onChangeText={(text) => {
                setEditedAmount(text);
                setValidationErrors({ ...validationErrors, amount: '' });
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={!!validationErrors.amount}
              errorMessage={validationErrors.amount}
              accessibilityLabel={t('fundItem.fields.amount', { defaultValue: 'Amount' })}
              accessibilityHint={t('fundItem.accessibility.amountHint', { 
                defaultValue: 'Enter the amount of money for this fund item' 
              })}
              returnKeyType="next"
            />
          </View>
        )}

        {/* Currency Picker (for CASH and BANK_CARD) */}
        {shouldShowAmountFields && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>
              {t('fundItem.fields.currency', { defaultValue: 'Currency' })} *
            </Text>
            <TouchableOpacity
              style={[
                styles.currencySelector,
                validationErrors.currency && styles.currencySelectorError,
              ]}
              onPress={() => setShowCurrencyPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={t('fundItem.fields.currency', { defaultValue: 'Currency' })}
              accessibilityHint={t('fundItem.accessibility.currencyHint', { 
                defaultValue: 'Opens currency picker to select a currency' 
              })}
              accessibilityValue={{ text: editedCurrency }}
            >
              <Text style={styles.currencySelectorText}>
                {editedCurrency || t('fundItem.fields.selectCurrency', { defaultValue: 'Select Currency' })}
              </Text>
              <Text style={styles.currencySelectorArrow}>▼</Text>
            </TouchableOpacity>
            {validationErrors.currency && (
              <Text 
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {validationErrors.currency}
              </Text>
            )}
          </View>
        )}

        {/* Description Input */}
        <View style={styles.section}>
          <Input
            label={t('fundItem.fields.description', { defaultValue: 'Description' })}
            value={editedDescription}
            onChangeText={setEditedDescription}
            placeholder={t('fundItem.fields.descriptionPlaceholder', { 
              defaultValue: 'Add a description (optional)' 
            })}
            multiline
            accessibilityLabel={t('fundItem.fields.description', { defaultValue: 'Description' })}
            accessibilityHint={t('fundItem.accessibility.descriptionHint', { 
              defaultValue: 'Enter an optional description for this fund item' 
            })}
            returnKeyType="done"
          />
        </View>

        {/* Photo Management */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>
            {t('fundItem.detail.photo', { defaultValue: 'Photo' })}
          </Text>
          {!isCreateMode && fundItem?.photoUri ? (
            <View style={styles.photoContainer}>
              <TouchableOpacity
                onPress={handlePhotoPress}
                activeOpacity={0.8}
                accessibilityRole="imagebutton"
                accessibilityLabel={t('fundItem.accessibility.photoPreview', { 
                  defaultValue: 'Fund item photo preview' 
                })}
                accessibilityHint={t('fundItem.accessibility.photoPreviewHint', { 
                  defaultValue: 'Double tap to view full size photo' 
                })}
              >
                <Image
                  source={{ uri: fundItem.photoUri }}
                  style={styles.photoThumbnail}
                  resizeMode="cover"
                  accessible={false}
                />
              </TouchableOpacity>
              <Button
                title={t('fundItem.detail.replacePhoto', { defaultValue: 'Replace Photo' })}
                onPress={handleReplacePhoto}
                variant="secondary"
                size="small"
                style={styles.photoButton}
                disabled={loading}
                accessibilityLabel={t('fundItem.detail.replacePhoto', { defaultValue: 'Replace Photo' })}
                accessibilityHint={t('fundItem.accessibility.replacePhotoHint', { 
                  defaultValue: 'Opens options to take a new photo or choose from library' 
                })}
              />
            </View>
          ) : (
            <View>
              <View style={styles.noPhotoContainer}>
                <Text style={styles.noPhotoIcon}>📷</Text>
                <Text style={styles.noPhotoText}>
                  {isCreateMode 
                    ? t('fundItem.detail.noPhotoCreate', { defaultValue: 'Add a photo (optional)' })
                    : t('fundItem.detail.noPhoto', { defaultValue: 'No photo attached' })
                  }
                </Text>
              </View>
              <Button
                title={t('fundItem.detail.addPhoto', { defaultValue: 'Add Photo' })}
                onPress={handleAddPhoto}
                variant="secondary"
                size="small"
                style={styles.photoButton}
                disabled={loading}
                accessibilityLabel={t('fundItem.detail.addPhoto', { defaultValue: 'Add Photo' })}
                accessibilityHint={t('fundItem.accessibility.addPhotoHint', { 
                  defaultValue: 'Opens options to take a photo or choose from library' 
                })}
              />
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text 
              style={styles.errorText}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          </View>
        )}

        {/* Save Button */}
        <View style={styles.section}>
          <Button
            title={t('fundItem.detail.save', { defaultValue: 'Save Changes' })}
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            accessibilityLabel={t('fundItem.detail.save', { defaultValue: 'Save Changes' })}
            accessibilityHint={t('fundItem.accessibility.saveHint', { 
              defaultValue: 'Saves your changes and returns to view mode' 
            })}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            title={t('fundItem.detail.cancel', { defaultValue: 'Cancel' })}
            onPress={handleCancelEdit}
            variant="secondary"
            disabled={loading}
            accessibilityLabel={t('fundItem.detail.cancel', { defaultValue: 'Cancel' })}
            accessibilityHint={t('fundItem.accessibility.cancelHint', { 
              defaultValue: 'Discards your changes and returns to view mode' 
            })}
          />
        </View>
      </ScrollView>
    );
  };

  // Render full-screen photo view
  const renderPhotoView = () => {
    if (!fundItem.photoUri) return null;

    return (
      <View style={styles.photoViewContainer}>
        <Animated.View
          style={[
            styles.photoViewImageContainer,
            {
              transform: [
                { scale: photoScale },
                { translateX: photoTranslateX },
                { translateY: photoTranslateY },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: fundItem.photoUri }}
            style={styles.photoViewImage}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Close Button */}
        <TouchableOpacity
          style={styles.photoViewCloseButton}
          onPress={handleClosePhotoView}
          accessibilityRole="button"
          accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
        >
          <View style={styles.photoViewCloseButtonCircle}>
            <Text style={styles.photoViewCloseButtonText}>✕</Text>
          </View>
        </TouchableOpacity>

        {/* Zoom hint */}
        <View style={styles.photoViewHintContainer}>
          <Text style={styles.photoViewHint}>
            {t('fundItem.detail.photoHint', { defaultValue: 'Pinch to zoom, drag to pan' })}
          </Text>
        </View>
      </View>
    );
  };

  // Render view mode
  const renderViewMode = () => {
    console.log('[FundItemDetailModal] Rendering view mode...');
    
    // Safety check - should not render view mode without a fundItem
    if (!fundItem) {
      console.error('[FundItemDetailModal] renderViewMode called without fundItem');
      return null;
    }
    
    // Get the item type - handle both 'type' and 'itemType' fields
    const itemType = fundItem.itemType || fundItem.type;
    const supportsAmountFields = isAmountBasedType(itemType);
    const missingValueLabel = t('fundItem.detail.notProvided', { defaultValue: 'Not provided yet' });
    const formattedAmount = formatAmountValue();
    const amountValueDisplay = formattedAmount ?? missingValueLabel;
    const currencyValueDisplay = fundItem.currency
      ? fundItem.currency.toUpperCase()
      : missingValueLabel;
    const descriptionValue = fundItem.description || fundItem.details || missingValueLabel;
    const hasDescription = Boolean(fundItem.description || fundItem.details);
    
    console.log('[FundItemDetailModal] View mode data:', {
      itemType,
      supportsAmountFields,
      hasPhotoUri: !!fundItem.photoUri,
      photoUriLength: fundItem.photoUri?.length,
    });
    
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Type Display */}
        <View style={styles.section}>
          <View 
            style={styles.itemTypeContainer}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${t('fundItem.fields.type', { defaultValue: 'Type' })}: ${itemTypeDisplay.label}`}
          >
            <Text style={styles.itemTypeIcon} accessible={false}>{itemTypeDisplay.icon}</Text>
            <Text style={styles.itemTypeLabel} accessible={false}>{itemTypeDisplay.label}</Text>
          </View>
        </View>

        {/* Amount Display (for CASH / BANK_CARD / CREDIT_CARD) - Tappable */}
        {supportsAmountFields && (
          <TouchableOpacity 
            style={styles.tappableSection}
            onPress={handleEdit}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${t('fundItem.fields.amount', { defaultValue: 'Amount' })}: ${amountValueDisplay}`}
            accessibilityHint={t('fundItem.accessibility.tapToEdit', { defaultValue: 'Tap to edit' })}
          >
            <Text style={styles.fieldLabel} accessible={false}>
              {t('fundItem.fields.amount', { defaultValue: 'Amount' })}
            </Text>
            <Text style={styles.fieldValue} accessible={false}>{amountValueDisplay}</Text>
          </TouchableOpacity>
        )}

        {/* Currency Display (for CASH / BANK_CARD / CREDIT_CARD) - Tappable */}
        {supportsAmountFields && (
          <TouchableOpacity 
            style={styles.tappableSection}
            onPress={handleEdit}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${t('fundItem.fields.currency', { defaultValue: 'Currency' })}: ${currencyValueDisplay}`}
            accessibilityHint={t('fundItem.accessibility.tapToEdit', { defaultValue: 'Tap to edit' })}
          >
            <Text style={styles.fieldLabel} accessible={false}>
              {t('fundItem.fields.currency', { defaultValue: 'Currency' })}
            </Text>
            <Text style={styles.fieldValue} accessible={false}>{currencyValueDisplay}</Text>
          </TouchableOpacity>
        )}

        {/* Description Display - Tappable */}
        <TouchableOpacity 
          style={styles.tappableSection}
          onPress={handleEdit}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${t('fundItem.fields.description', { defaultValue: 'Description' })}: ${descriptionValue}`}
          accessibilityHint={t('fundItem.accessibility.tapToEdit', { defaultValue: 'Tap to edit' })}
        >
          <Text style={styles.fieldLabel} accessible={false}>
            {t('fundItem.fields.description', { defaultValue: 'Description' })}
          </Text>
          <Text
            style={[
              styles.fieldValue,
              !hasDescription && styles.fieldValuePlaceholder,
            ]}
            accessible={false}
          >
            {descriptionValue}
          </Text>
        </TouchableOpacity>

        {/* Photo Display */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>
            {t('fundItem.detail.photo', { defaultValue: 'Photo' })}
          </Text>
          {fundItem.photoUri ? (
            <View>
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={handlePhotoPress}
                activeOpacity={0.8}
                accessibilityRole="imagebutton"
                accessibilityLabel={t('fundItem.accessibility.photoPreview', { 
                  defaultValue: 'Fund item photo preview' 
                })}
                accessibilityHint={t('fundItem.accessibility.photoPreviewHint', { 
                  defaultValue: 'Double tap to view full size photo' 
                })}
              >
                <Image
                  source={{ uri: fundItem.photoUri }}
                  style={styles.photoThumbnail}
                  resizeMode="cover"
                  accessible={false}
                  onError={(error) => {
                    console.error('[FundItemDetailModal] Image load error:', error.nativeEvent);
                  }}
                  onLoad={() => {
                    console.log('[FundItemDetailModal] Image loaded successfully');
                  }}
                />
                <Text style={styles.photoHint}>
                  {t('fundItem.detail.viewPhoto', { defaultValue: 'Tap to view full size' })}
                </Text>
              </TouchableOpacity>
              <Button
                title={t('fundItem.detail.replacePhoto', { defaultValue: 'Replace Photo' })}
                onPress={handleReplacePhoto}
                variant="secondary"
                size="small"
                style={styles.photoButton}
                disabled={loading}
                accessibilityLabel={t('fundItem.detail.replacePhoto', { defaultValue: 'Replace Photo' })}
                accessibilityHint={t('fundItem.accessibility.replacePhotoHint', { 
                  defaultValue: 'Opens options to take a new photo or choose from library' 
                })}
              />
            </View>
          ) : (
            <View>
              <View style={styles.noPhotoContainer}>
                <Text style={styles.noPhotoIcon}>📷</Text>
                <Text style={styles.noPhotoText}>
                  {t('fundItem.detail.noPhoto', { defaultValue: 'No photo attached' })}
                </Text>
              </View>
              <Button
                title={t('fundItem.detail.addPhoto', { defaultValue: 'Add Photo' })}
                onPress={handleAddPhoto}
                variant="secondary"
                size="small"
                style={styles.photoButton}
                disabled={loading}
                accessibilityLabel={t('fundItem.detail.addPhoto', { defaultValue: 'Add Photo' })}
                accessibilityHint={t('fundItem.accessibility.addPhotoHint', { 
                  defaultValue: 'Opens options to take a photo or choose from library' 
                })}
              />
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text 
              style={styles.errorText}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          </View>
        )}

        {/* Manage All Funds Link */}
        {!isCreateMode && (
          <TouchableOpacity
            style={styles.manageAllLink}
            onPress={() => {
              onClose();
              if (onManageAll) {
                onManageAll();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={t('fundItem.detail.manageAll', { defaultValue: 'Manage All Funds' })}
            accessibilityHint={t('fundItem.accessibility.manageAllHint', { 
              defaultValue: 'Navigates to the full fund management screen' 
            })}
          >
            <Text style={styles.manageAllText}>
              {t('fundItem.detail.manageAll', { defaultValue: 'Manage All Funds' })}
            </Text>
            <Text style={styles.manageAllArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Delete Button - hide in create mode */}
        {!isCreateMode && (
          <View style={styles.actionButtons}>
            <Button
              title={t('fundItem.detail.delete', { defaultValue: 'Delete' })}
              onPress={handleDelete}
              variant="secondary"
              size="medium"
              style={styles.deleteButton}
              textStyle={styles.deleteButtonText}
              accessibilityLabel={t('fundItem.detail.delete', { defaultValue: 'Delete' })}
              accessibilityHint={t('fundItem.accessibility.deleteHint', { 
                defaultValue: 'Deletes this fund item after confirmation' 
              })}
            />
          </View>
        )}


      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal={true}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
          accessibilityHint={t('fundItem.accessibility.closeModalHint', { 
            defaultValue: 'Closes the fund item detail modal' 
          })}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }],
            },
          ]}
          accessibilityViewIsModal={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={mode === 'edit' ? handleCancelEdit : onClose}
              accessibilityRole="button"
              accessibilityLabel={mode === 'edit' 
                ? t('fundItem.detail.cancel', { defaultValue: 'Cancel' })
                : t('common.back', { defaultValue: 'Back' })
              }
              accessibilityHint={mode === 'edit'
                ? t('fundItem.accessibility.cancelHint', { 
                    defaultValue: 'Discards your changes and returns to view mode' 
                  })
                : t('fundItem.accessibility.backHint', { 
                    defaultValue: 'Returns to the previous screen' 
                  })
              }
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text 
              style={styles.headerTitle}
              accessibilityRole="header"
            >
              {isCreateMode
                ? t('fundItem.create.title', { defaultValue: 'Add Fund Item' })
                : mode === 'edit' 
                  ? t('fundItem.detail.editTitle', { defaultValue: 'Edit Fund Item' })
                  : t('fundItem.detail.title', { defaultValue: 'Fund Item Details' })
              }
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
              accessibilityHint={t('fundItem.accessibility.closeModalHint', { 
                defaultValue: 'Closes the fund item detail modal' 
              })}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Render based on mode */}
          {mode === 'photo' ? renderPhotoView() : mode === 'edit' ? renderEditMode() : (fundItem ? renderViewMode() : null)}

          {/* Currency Picker Modal */}
          {renderCurrencyPicker()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '90%',
    minHeight: '50%',
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  tappableSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  itemTypeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  itemTypeLabel: {
    ...typography.h3,
    color: colors.text,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldValue: {
    ...typography.body2,
    color: colors.text,
  },
  fieldValuePlaceholder: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  photoContainer: {
    marginTop: spacing.sm,
  },
  photoThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  photoHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  photoButton: {
    marginTop: spacing.md,
  },
  noPhotoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  noPhotoIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
    opacity: 0.5,
  },
  noPhotoText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  actionButtons: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonHalf: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: colors.white,
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
  },
  // Currency Selector Styles
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  currencySelectorError: {
    borderColor: colors.error,
  },
  currencySelectorText: {
    ...typography.body1,
    color: colors.text,
  },
  currencySelectorArrow: {
    ...typography.body1,
    color: colors.textSecondary,
    fontSize: 12,
  },
  // Currency Picker Styles
  currencyPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  currencyPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  currencyPickerContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    height: '60%',
    ...shadows.card,
  },
  currencyPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currencyPickerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  currencyPickerClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPickerCloseText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  currencyPickerList: {
    flex: 1,
    minHeight: 200,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currencyOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  currencySymbol: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 40,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  currencyName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  currencyCheckmark: {
    fontSize: 20,
    color: colors.primary,
  },
  // Error Container
  errorContainer: {
    backgroundColor: colors.errorLight || '#fee',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  // Photo View Styles
  photoViewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewImage: {
    width: '100%',
    height: '100%',
  },
  photoViewCloseButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  photoViewCloseButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewCloseButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '600',
  },
  photoViewHintContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoViewHint: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  manageAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  manageAllText: {
    ...typography.body1,
    color: colors.secondary,
    marginRight: spacing.xs,
  },
  manageAllArrow: {
    ...typography.body1,
    color: colors.secondary,
  },
});

export default FundItemDetailModal;
