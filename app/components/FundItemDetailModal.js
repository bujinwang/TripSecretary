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
} from 'react-native';
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
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  ];

  // Reset state when modal opens/closes or fundItem changes
  useEffect(() => {
    if (visible && fundItem) {
      setMode('view');
      setError(null);
      setValidationErrors({ amount: '', currency: '' });
      setEditedAmount(fundItem.amount ? fundItem.amount.toString() : '');
      setEditedCurrency(fundItem.currency || 'USD');
      // Handle both 'description' and 'details' fields
      setEditedDescription(fundItem.description || fundItem.details || '');
      // Reset photo view transforms
      photoScale.setValue(1);
      photoTranslateX.setValue(0);
      photoTranslateY.setValue(0);
    }
  }, [visible, fundItem]);

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

  if (!fundItem) {
    return null;
  }

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
    setMode('edit');
    setError(null);
    setValidationErrors({ amount: '', currency: '' });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setMode('view');
    setError(null);
    setValidationErrors({ amount: '', currency: '' });
    // Reset to original values
    setEditedAmount(fundItem.amount ? fundItem.amount.toString() : '');
    setEditedCurrency(fundItem.currency || 'USD');
    // Handle both 'description' and 'details' fields
    setEditedDescription(fundItem.description || fundItem.details || '');
  };

  // Handle save
  const handleSave = async () => {
    // Get the item type - handle both 'type' and 'itemType' fields
    const itemType = fundItem.itemType || fundItem.type;
    
    // Validate for CASH and BANK_CARD types
    if (itemType === 'CASH' || itemType === 'BANK_CARD' || itemType === 'cash' || itemType === 'credit_card') {
      const amountError = validateAmount(editedAmount);
      const currencyError = validateCurrency(editedCurrency);
      
      if (amountError || currencyError) {
        setValidationErrors({
          amount: amountError,
          currency: currencyError,
        });
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Import PassportDataService
      const PassportDataService = require('../services/data/PassportDataService').default;
      
      // Prepare updated data - use 'type' field for the model, 'details' instead of 'description'
      const shouldUpdateAmount = itemType === 'CASH' || itemType === 'BANK_CARD' || 
                                  itemType === 'cash' || itemType === 'credit_card';
      
      const fundData = {
        id: fundItem.id,
        type: fundItem.type || fundItem.itemType, // Use the original type field
        amount: shouldUpdateAmount ? parseFloat(editedAmount) : fundItem.amount,
        currency: shouldUpdateAmount ? editedCurrency.toUpperCase() : fundItem.currency,
        details: editedDescription, // Map description to details
        photoUri: fundItem.photoUri || fundItem.photo,
      };

      // Get userId from fundItem or use default
      const userId = fundItem.userId || 'default_user';
      
      // Save the updated fund item using PassportDataService
      const updatedFundItem = await PassportDataService.saveFundItem(fundData, userId);
      
      console.log('Fund item updated successfully:', updatedFundItem.id);
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        await onUpdate(updatedFundItem);
      }
      
      setMode('view');
    } catch (err) {
      console.error('Failed to save fund item:', err);
      setError(t('fundItem.errors.updateFailed', { 
        defaultValue: 'Failed to save changes. Please try again.' 
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
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
        },
        {
          text: t('fundItem.deleteConfirm.confirm', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setError(null);

            try {
              // Import PassportDataService
              const PassportDataService = require('../services/data/PassportDataService').default;
              
              // Get userId from fundItem or use default
              const userId = fundItem.userId || 'default_user';
              
              // Delete the fund item using PassportDataService
              await PassportDataService.deleteFundItem(fundItem.id, userId);
              
              console.log('Fund item deleted successfully:', fundItem.id);
              
              // Call onDelete callback if provided
              if (onDelete) {
                await onDelete(fundItem.id);
              }
              
              // Close the modal
              onClose();
            } catch (err) {
              console.error('Failed to delete fund item:', err);
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
    setEditedCurrency(currencyCode);
    setShowCurrencyPicker(false);
    setValidationErrors({ ...validationErrors, currency: '' });
  };

  // Handle photo press to open full-screen view
  const handlePhotoPress = () => {
    if (fundItem.photoUri) {
      setMode('photo');
      // Reset transforms
      photoScale.setValue(1);
      photoTranslateX.setValue(0);
      photoTranslateY.setValue(0);
    }
  };

  // Handle close photo view
  const handleClosePhotoView = () => {
    setMode('view');
  };

  // PanResponder for photo zoom and pan
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
          
          if (!panResponder.current.initialDistance) {
            panResponder.current.initialDistance = distance;
          } else {
            const scale = (distance / panResponder.current.initialDistance) * lastScale.current;
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
        panResponder.current.initialDistance = null;
        
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

  // Get fund item type display
  const getItemTypeDisplay = () => {
    // Handle both 'type' and 'itemType' fields, and both uppercase and lowercase values
    const itemType = (fundItem.itemType || fundItem.type || '').toUpperCase();
    
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
  const formatAmount = () => {
    if (!fundItem.amount) return null;
    return `${fundItem.amount.toLocaleString()} ${fundItem.currency || ''}`;
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
        />
        <View style={styles.currencyPickerContent}>
          <View style={styles.currencyPickerHeader}>
            <Text style={styles.currencyPickerTitle}>
              {t('fundItem.fields.selectCurrency', { defaultValue: 'Select Currency' })}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCurrencyPicker(false)}
              style={styles.currencyPickerClose}
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
    // Get the item type - handle both 'type' and 'itemType' fields
    const itemType = fundItem.itemType || fundItem.type;
    const shouldShowAmountFields = itemType === 'CASH' || itemType === 'BANK_CARD' || 
                                    itemType === 'cash' || itemType === 'credit_card';
    
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Type Display (read-only) */}
        <View style={styles.section}>
          <View style={styles.itemTypeContainer}>
            <Text style={styles.itemTypeIcon}>{itemTypeDisplay.icon}</Text>
            <Text style={styles.itemTypeLabel}>{itemTypeDisplay.label}</Text>
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
            >
              <Text style={styles.currencySelectorText}>
                {editedCurrency || t('fundItem.fields.selectCurrency', { defaultValue: 'Select Currency' })}
              </Text>
              <Text style={styles.currencySelectorArrow}>▼</Text>
            </TouchableOpacity>
            {validationErrors.currency && (
              <Text style={styles.errorText}>{validationErrors.currency}</Text>
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
          />
        </View>

        {/* Photo Display (read-only in edit mode for now) */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>
            {t('fundItem.detail.photo', { defaultValue: 'Photo' })}
          </Text>
          {fundItem.photoUri ? (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: fundItem.photoUri }}
                style={styles.photoThumbnail}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.noPhotoContainer}>
              <Text style={styles.noPhotoIcon}>📷</Text>
              <Text style={styles.noPhotoText}>
                {t('fundItem.detail.noPhoto', { defaultValue: 'No photo attached' })}
              </Text>
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Save Button */}
        <View style={styles.section}>
          <Button
            title={t('fundItem.detail.save', { defaultValue: 'Save Changes' })}
            onPress={handleSave}
            loading={loading}
            disabled={loading}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            title={t('fundItem.detail.cancel', { defaultValue: 'Cancel' })}
            onPress={handleCancelEdit}
            variant="secondary"
            disabled={loading}
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
    // Get the item type - handle both 'type' and 'itemType' fields
    const itemType = fundItem.itemType || fundItem.type;
    const shouldShowAmount = (itemType === 'CASH' || itemType === 'BANK_CARD' || 
                              itemType === 'cash' || itemType === 'credit_card') && fundItem.amount;
    
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Type Display */}
        <View style={styles.section}>
          <View style={styles.itemTypeContainer}>
            <Text style={styles.itemTypeIcon}>{itemTypeDisplay.icon}</Text>
            <Text style={styles.itemTypeLabel}>{itemTypeDisplay.label}</Text>
          </View>
        </View>

        {/* Amount Display (for CASH and BANK_CARD) */}
        {shouldShowAmount && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>
              {t('fundItem.fields.amount', { defaultValue: 'Amount' })}
            </Text>
            <Text style={styles.fieldValue}>{formatAmount()}</Text>
          </View>
        )}

        {/* Description Display */}
        {(fundItem.description || fundItem.details) && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>
              {t('fundItem.fields.description', { defaultValue: 'Description' })}
            </Text>
            <Text style={styles.fieldValue}>{fundItem.description || fundItem.details}</Text>
          </View>
        )}

        {/* Photo Display */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>
            {t('fundItem.detail.photo', { defaultValue: 'Photo' })}
          </Text>
          {fundItem.photoUri ? (
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={handlePhotoPress}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('fundItem.detail.viewPhoto', { defaultValue: 'Tap to view full size' })}
            >
              <Image
                source={{ uri: fundItem.photoUri }}
                style={styles.photoThumbnail}
                resizeMode="cover"
              />
              <Text style={styles.photoHint}>
                {t('fundItem.detail.viewPhoto', { defaultValue: 'Tap to view full size' })}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.noPhotoContainer}>
              <Text style={styles.noPhotoIcon}>📷</Text>
              <Text style={styles.noPhotoText}>
                {t('fundItem.detail.noPhoto', { defaultValue: 'No photo attached' })}
              </Text>
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.buttonRow}>
            <View style={styles.buttonHalf}>
              <Button
                title={t('fundItem.detail.edit', { defaultValue: 'Edit' })}
                onPress={handleEdit}
                variant="secondary"
                size="medium"
              />
            </View>
            <View style={styles.buttonHalf}>
              <Button
                title={t('fundItem.detail.delete', { defaultValue: 'Delete' })}
                onPress={handleDelete}
                variant="secondary"
                size="medium"
                style={styles.deleteButton}
                textStyle={styles.deleteButtonText}
              />
            </View>
          </View>
        </View>

        {/* Manage All Funds Link */}
        <TouchableOpacity
          style={styles.manageAllLink}
          onPress={() => {
            onClose();
            if (onManageAll) {
              onManageAll();
            }
          }}
          accessibilityRole="button"
        >
          <Text style={styles.manageAllText}>
            {t('fundItem.detail.manageAll', { defaultValue: 'Manage All Funds' })}
          </Text>
          <Text style={styles.manageAllArrow}>→</Text>
        </TouchableOpacity>
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
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={mode === 'edit' ? handleCancelEdit : onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mode === 'edit' 
                ? t('fundItem.detail.editTitle', { defaultValue: 'Edit Fund Item' })
                : t('fundItem.detail.title', { defaultValue: 'Fund Item Details' })
              }
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Render based on mode */}
          {mode === 'photo' ? renderPhotoView() : mode === 'edit' ? renderEditMode() : renderViewMode()}

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
  manageAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
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
    maxHeight: '60%',
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
});

export default FundItemDetailModal;
