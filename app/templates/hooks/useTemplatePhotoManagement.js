/**
 * Template Photo Management Hook
 *
 * Handles photo uploads for travel info fields like:
 * - Flight ticket photos
 * - Departure ticket photos
 * - Hotel reservation photos
 */

import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { useLocale } from '../../i18n/LocaleContext';

export const useTemplatePhotoManagement = ({
  config,
  formState,
  updateField,
  debouncedSave,
  t,
}) => {
  const { t: localeT } = useLocale();
  const translationFn = t || localeT;

  const savePhoto = useCallback(async (photoType, photoUri) => {
    try {
      const fieldName = {
        flightTicket: 'flightTicketPhoto',
        departureTicket: 'departureFlightTicketPhoto',
        hotelReservation: 'hotelReservationPhoto',
      }[photoType];

      if (!fieldName) {
        console.error('[Template] Unknown photo type:', photoType);
        return { success: false, error: 'Unknown photo type' };
      }

      updateField(fieldName, photoUri);
      debouncedSave();

      return { success: true };
    } catch (error) {
      console.error('[Template] Failed to save photo:', error);
      return { success: false, error };
    }
  }, [updateField, debouncedSave]);

  const handleFlightTicketPhotoUpload = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        const { success } = await savePhoto('flightTicket', photoUri);

        if (success) {
          Alert.alert(
            translationFn('common.uploadSuccess', { defaultValue: '上传成功' }),
            translationFn('common.flightTicketUploaded', { defaultValue: '机票照片已上传' })
          );
        } else {
          Alert.alert(
            translationFn('common.uploadError', { defaultValue: '上传失败' }),
            translationFn('common.uploadErrorMessage', { defaultValue: '保存失败，请重试' })
          );
        }
      }
    } catch (error) {
      console.error('[Template] Photo upload error:', error);
      Alert.alert(
        translationFn('common.uploadError', { defaultValue: '上传失败' }),
        translationFn('common.uploadErrorMessage', { defaultValue: '选择照片失败，请重试' })
      );
    }
  }, [savePhoto, translationFn]);

  const handleDepartureFlightTicketPhotoUpload = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        const { success } = await savePhoto('departureTicket', photoUri);

        if (success) {
          Alert.alert(
            translationFn('common.uploadSuccess', { defaultValue: '上传成功' }),
            translationFn('common.departureTicketUploaded', { defaultValue: '离境机票照片已上传' })
          );
        } else {
          Alert.alert(
            translationFn('common.uploadError', { defaultValue: '上传失败' }),
            translationFn('common.uploadErrorMessage', { defaultValue: '保存失败，请重试' })
          );
        }
      }
    } catch (error) {
      console.error('[Template] Photo upload error:', error);
      Alert.alert(
        translationFn('common.uploadError', { defaultValue: '上传失败' }),
        translationFn('common.uploadErrorMessage', { defaultValue: '选择照片失败，请重试' })
      );
    }
  }, [savePhoto, translationFn]);

  const handleHotelReservationPhotoUpload = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        const { success } = await savePhoto('hotelReservation', photoUri);

        if (success) {
          Alert.alert(
            translationFn('common.uploadSuccess', { defaultValue: '上传成功' }),
            translationFn('common.hotelReservationUploaded', { defaultValue: '酒店预订照片已上传' })
          );
        } else {
          Alert.alert(
            translationFn('common.uploadError', { defaultValue: '上传失败' }),
            translationFn('common.uploadErrorMessage', { defaultValue: '保存失败，请重试' })
          );
        }
      }
    } catch (error) {
      console.error('[Template] Photo upload error:', error);
      Alert.alert(
        translationFn('common.uploadError', { defaultValue: '上传失败' }),
        translationFn('common.uploadErrorMessage', { defaultValue: '选择照片失败，请重试' })
      );
    }
  }, [savePhoto, translationFn]);

  return {
    handleFlightTicketPhotoUpload,
    handleDepartureFlightTicketPhotoUpload,
    handleHotelReservationPhotoUpload,
    savePhoto,
  };
};

export default useTemplatePhotoManagement;

