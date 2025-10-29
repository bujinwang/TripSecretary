/**
 * PassportInfoSection Component
 *
 * Displays passport information including photo, name, passport number, nationality, etc.
 * Extracted from ImmigrationOfficerViewScreen for better maintainability
 */

import React from 'react';
import { Platform } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from '../../../components/tamagui';
import OptimizedImage from '../../../components/OptimizedImage';
import { getFullName as getFullNameHelper, safeString } from '../helpers';

/**
 * Passport Information Section Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.passportData - Passport data object
 * @param {string} props.language - Display language ('english', 'thai', 'bilingual')
 * @param {Function} props.formatDateForDisplay - Date formatting function
 * @param {Function} props.t - Translation function
 */
const PassportInfoSection = ({ passportData, language, formatDateForDisplay, t }) => {
  /**
   * Safely get full name from passport data using centralized helper
   */
  const getFullName = () => {
    if (!passportData) return 'N/A';

    // If fullName is already provided, use it
    if (passportData.fullName) {
      return passportData.fullName;
    }

    // Otherwise construct from individual parts using helper
    // Note: Helper expects surname, middleName, givenName
    // but data might have firstName, middleName, lastName
    const nameData = {
      surname: passportData.lastName || passportData.surname,
      middleName: passportData.middleName,
      givenName: passportData.firstName || passportData.givenName,
    };

    return getFullNameHelper(nameData, 'N/A');
  };

  const getLabel = (englishKey, thaiText) => {
    if (language === 'english') {
      return t(`progressiveEntryFlow.immigrationOfficer.presentation.${englishKey}`);
    } else if (language === 'thai') {
      return thaiText;
    } else {
      return `${thaiText} / ${t(`progressiveEntryFlow.immigrationOfficer.presentation.${englishKey}`)}`;
    }
  };

  const getSectionTitle = () => {
    return getLabel('passportInformation', 'ข้อมูลหนังสือเดินทาง');
  };

  return (
    <YStack backgroundColor="rgba(255, 255, 255, 0.1)" padding="$lg" borderRadius={12} marginBottom="$lg">
      <TamaguiText color="white" fontSize={24} fontWeight="bold" marginBottom="$lg" textAlign="center">
        {getSectionTitle()}
      </TamaguiText>

      {/* Passport photo if available */}
      {passportData?.photoUri && (
        <YStack alignItems="center" marginBottom="$lg">
          <OptimizedImage
            uri={passportData.photoUri}
            style={{
              width: 120,
              height: 150,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: 'white',
            }}
            resizeMode="cover"
            lazy={false}
            placeholder="🛂"
            showLoadingText={false}
          />
        </YStack>
      )}

      <YStack marginBottom="$md">
        <TamaguiText color="white" fontSize={16} fontWeight="600" marginBottom="$xs" opacity={0.9}>
          {getLabel('fullName', 'ชื่อเต็ม')}:
        </TamaguiText>
        <TamaguiText color="white" fontSize={18} fontWeight="bold">
          {getFullName()}
        </TamaguiText>
      </YStack>

      <YStack marginBottom="$md">
        <TamaguiText color="white" fontSize={16} fontWeight="600" marginBottom="$xs" opacity={0.9}>
          {getLabel('passportNumber', 'หมายเลขหนังสือเดินทาง')}:
        </TamaguiText>
        <TamaguiText
          color="white"
          fontSize={20}
          fontWeight="bold"
          fontFamily={Platform.OS === 'ios' ? 'Courier New' : 'monospace'}
          letterSpacing={1}
        >
          {passportData?.passportNumber || 'N/A'}
        </TamaguiText>
      </YStack>

      <YStack marginBottom="$md">
        <TamaguiText color="white" fontSize={16} fontWeight="600" marginBottom="$xs" opacity={0.9}>
          {getLabel('nationality', 'สัญชาติ')}:
        </TamaguiText>
        <TamaguiText color="white" fontSize={18} fontWeight="bold">
          {passportData?.nationality || 'N/A'}
        </TamaguiText>
      </YStack>

      <YStack marginBottom="$md">
        <TamaguiText color="white" fontSize={16} fontWeight="600" marginBottom="$xs" opacity={0.9}>
          {getLabel('dateOfBirth', 'วันเกิด')}:
        </TamaguiText>
        <TamaguiText color="white" fontSize={18} fontWeight="bold">
          {formatDateForDisplay(passportData?.dateOfBirth)}
        </TamaguiText>
      </YStack>

      <YStack marginBottom="$md">
        <TamaguiText color="white" fontSize={16} fontWeight="600" marginBottom="$xs" opacity={0.9}>
          {getLabel('gender', 'เพศ')}:
        </TamaguiText>
        <TamaguiText color="white" fontSize={18} fontWeight="bold">
          {passportData?.gender || 'N/A'}
        </TamaguiText>
      </YStack>

      <YStack marginBottom="$md">
        <TamaguiText color="white" fontSize={16} fontWeight="600" marginBottom="$xs" opacity={0.9}>
          {getLabel('passportExpiry', 'วันหมดอายุหนังสือเดินทาง')}:
        </TamaguiText>
        <TamaguiText color="white" fontSize={18} fontWeight="bold">
          {formatDateForDisplay(passportData?.expiryDate)}
        </TamaguiText>
      </YStack>
    </YStack>
  );
};

export default PassportInfoSection;
