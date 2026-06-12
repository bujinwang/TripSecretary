import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import logger from '../../services/LoggingService';
import { compressDocumentPhoto } from '../../utils/imageCompression';
import { useLocale } from '../../i18n/LocaleContext';

interface PhotoManagementParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formState: any;
  updateField: (fieldName: string, value: unknown) => void;
  debouncedSave: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t?: (key: string, options?: any) => string;
}

interface PhotoResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}

interface PhotoManagementResult {
  handleFlightTicketPhotoUpload: () => Promise<void>;
  handleDepartureFlightTicketPhotoUpload: () => Promise<void>;
  handleHotelReservationPhotoUpload: () => Promise<void>;
  savePhoto: (photoType: string, photoUri: string) => Promise<PhotoResult>;
}

export const useTemplatePhotoManagement = ({
  config: _config,
  formState: _formState,
  updateField,
  debouncedSave,
  t,
}: PhotoManagementParams): PhotoManagementResult => {
  const localeContext = useLocale();
  const localeT = localeContext?.t;
  const translationFn = t || localeT;

  const savePhoto = useCallback(async (photoType, photoUri) => {
    try {
      const fieldName = {
        flightTicket: 'flightTicketPhoto',
        departureTicket: 'departureFlightTicketPhoto',
        hotelReservation: 'hotelReservationPhoto',
      }[photoType];

      if (!fieldName) {
        logger.error('[Template] Unknown photo type:', photoType);
        return { success: false, error: 'Unknown photo type' };
      }

      updateField(fieldName, photoUri);
      debouncedSave();

      return { success: true };
    } catch (error) {
      logger.error('[Template] Failed to save photo:', error);
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
        let photoUri = result.assets[0].uri;
        try {
          const compressed = await compressDocumentPhoto(photoUri);
          photoUri = compressed.uri;
        } catch (e) { /* use original if compression fails */ }
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
      logger.error('[Template] Photo upload error:', error);
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
        let photoUri = result.assets[0].uri;
        try {
          const compressed = await compressDocumentPhoto(photoUri);
          photoUri = compressed.uri;
        } catch (e) { /* use original if compression fails */ }
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
      logger.error('[Template] Photo upload error:', error);
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
        let photoUri = result.assets[0].uri;
        try {
          const compressed = await compressDocumentPhoto(photoUri);
          photoUri = compressed.uri;
        } catch (e) { /* use original if compression fails */ }
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
      logger.error('[Template] Photo upload error:', error);
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

