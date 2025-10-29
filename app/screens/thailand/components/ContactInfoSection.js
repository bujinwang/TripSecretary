import React from 'react';
import { YStack, XStack, Text as TamaguiText } from '../../../components/tamagui';
import { safeGet, safeString } from '../helpers';

/**
 * ContactInfoSection Component
 * Displays contact information including phone, email, and Thai address
 * for immigration officer presentation mode
 */
const ContactInfoSection = ({ passportData, travelData, language, t }) => {
  return (
    <YStack backgroundColor="white" padding="$lg" marginBottom="$md" borderRadius={12}>
      <TamaguiText
        fontSize={22}
        fontWeight="bold"
        color="$text"
        marginBottom="$md"
        borderBottomWidth={2}
        borderBottomColor="$primary"
        paddingBottom="$sm"
      >
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.contactInformation') :
         language === 'thai' ? 'ข้อมูลติดต่อ' :
         `ข้อมูลติดต่อ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.contactInformation')}`}
      </TamaguiText>

      <YStack marginBottom="$lg">
        <TamaguiText fontSize={18} fontWeight="600" color="$text" marginBottom="$sm">
          📞 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.contactDetails') :
               language === 'thai' ? 'รายละเอียดการติดต่อ' :
               `รายละเอียดการติดต่อ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.contactDetails')}`}
        </TamaguiText>

        <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
          <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.phoneInThailand') :
             language === 'thai' ? 'โทรศัพท์ในประเทศไทย' :
             `โทรศัพท์ในประเทศไทย / ${t('progressiveEntryFlow.immigrationOfficer.presentation.phoneInThailand')}`}:
          </TamaguiText>
          <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right" fontFamily="monospace">
            {safeGet(passportData, 'phoneNumber', null) || safeGet(travelData, 'phoneNumber', 'N/A')}
          </TamaguiText>
        </XStack>

        <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
          <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.email') :
             language === 'thai' ? 'อีเมล' :
             `อีเมล / ${t('progressiveEntryFlow.immigrationOfficer.presentation.email')}`}:
          </TamaguiText>
          <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
            {safeString(safeGet(passportData, 'email'), 'N/A')}
          </TamaguiText>
        </XStack>

        <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
          <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.thaiAddress') :
             language === 'thai' ? 'ที่อยู่ในประเทศไทย' :
             `ที่อยู่ในประเทศไทย / ${t('progressiveEntryFlow.immigrationOfficer.presentation.thaiAddress')}`}:
          </TamaguiText>
          <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
            {safeGet(travelData, 'accommodationAddress', null) || safeGet(travelData, 'address', 'N/A')}
          </TamaguiText>
        </XStack>
      </YStack>
    </YStack>
  );
};

export default ContactInfoSection;
