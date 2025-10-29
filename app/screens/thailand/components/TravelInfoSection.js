import React from 'react';
import { Alert } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from '../../../components/tamagui';
import OptimizedImage from '../../../components/OptimizedImage';
import { safeGet, safeString } from '../helpers';

/**
 * TravelInfoSection Component
 * Displays travel information including flight details, accommodation, and visit purpose
 * for immigration officer presentation mode
 */
const TravelInfoSection = ({ travelData, language, formatDateForDisplay, t }) => {
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
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.travelInformation') :
         language === 'thai' ? 'ข้อมูลการเดินทาง' :
         `ข้อมูลการเดินทาง / ${t('progressiveEntryFlow.immigrationOfficer.presentation.travelInformation')}`}
      </TamaguiText>

      {/* Flight Information Group */}
      <YStack marginBottom="$lg">
        <TamaguiText fontSize={18} fontWeight="600" color="$text" marginBottom="$sm">
          ✈️ {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.flightDetails') :
               language === 'thai' ? 'รายละเอียดเที่ยวบิน' :
               `รายละเอียดเที่ยวบิน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.flightDetails')}`}
        </TamaguiText>

        <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
          <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalFlight') :
             language === 'thai' ? 'เที่ยวบินมา' :
             `เที่ยวบินมา / ${t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalFlight')}`}:
          </TamaguiText>
          <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
            {safeGet(travelData, 'arrivalFlight', null) || safeGet(travelData, 'flightNumber', 'N/A')}
          </TamaguiText>
        </XStack>

        <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
          <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalDateTime') :
             language === 'thai' ? 'วันและเวลาที่มาถึง' :
             `วันและเวลาที่มาถึง / ${t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalDateTime')}`}:
          </TamaguiText>
          <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
            {formatDateForDisplay(travelData?.arrivalDate)}
          </TamaguiText>
        </XStack>

        {travelData?.departureDate && (
          <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
            <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
              {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.departureDate') :
               language === 'thai' ? 'วันที่เดินทางกลับ' :
               `วันที่เดินทางกลับ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.departureDate')}`}:
            </TamaguiText>
            <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
              {formatDateForDisplay(travelData.departureDate)}
            </TamaguiText>
          </XStack>
        )}

        {/* Flight Ticket Photo */}
        {travelData?.arrivalFlightTicketPhotoUri && (
          <YStack
            marginTop="$md"
            marginBottom="$sm"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius={8}
            overflow="hidden"
            backgroundColor="$background"
            onPress={() => {
              Alert.alert(
                language === 'english' ? 'Flight Ticket' :
                language === 'thai' ? 'ตั๋วเครื่องบิน' :
                'ตั๋วเครื่องบิน / Flight Ticket',
                language === 'english' ? 'Tap to view larger image' :
                language === 'thai' ? 'แตะเพื่อดูภาพขนาดใหญ่' :
                'แตะเพื่อดูภาพขนาดใหญ่ / Tap to view larger image'
              );
            }}
            cursor="pointer"
            pressStyle={{ opacity: 0.8 }}
          >
            <TamaguiText fontSize={14} fontWeight="600" color="$text" padding="$sm" backgroundColor="$primaryLight">
              🎫 {language === 'english' ? 'Flight Ticket' :
                  language === 'thai' ? 'ตั๋วเครื่องบิน' :
                  'ตั๋วเครื่องบิน / Flight Ticket'}
            </TamaguiText>
            <OptimizedImage
              uri={travelData.arrivalFlightTicketPhotoUri}
              style={{ width: '100%', height: 200, backgroundColor: '$background' }}
              resizeMode="contain"
              lazy={true}
              lazyLoadDelay={200}
              placeholder="🎫"
              showLoadingText={false}
            />
            <TamaguiText fontSize={12} color="$textSecondary" padding="$xs" textAlign="center" fontStyle="italic">
              {language === 'english' ? 'Tap to enlarge' :
               language === 'thai' ? 'แตะเพื่อขยาย' :
               'แตะเพื่อขยาย'}
            </TamaguiText>
          </YStack>
        )}
      </YStack>

      {/* Accommodation Information Group */}
      <YStack marginBottom="$lg">
        <TamaguiText fontSize={18} fontWeight="600" color="$text" marginBottom="$sm">
          🏨 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.accommodation') :
               language === 'thai' ? 'ที่พัก' :
               `ที่พัก / ${t('progressiveEntryFlow.immigrationOfficer.presentation.accommodation')}`}
        </TamaguiText>

        <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
          <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.hotelName') :
             language === 'thai' ? 'ชื่อโรงแรม' :
             `ชื่อโรงแรม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.hotelName')}`}:
          </TamaguiText>
          <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
            {safeGet(travelData, 'accommodationName', null) || safeGet(travelData, 'hotelName', 'N/A')}
          </TamaguiText>
        </XStack>

        <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
          <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.address') :
             language === 'thai' ? 'ที่อยู่' :
             `ที่อยู่ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.address')}`}:
          </TamaguiText>
          <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
            {safeGet(travelData, 'accommodationAddress', null) || safeGet(travelData, 'address', 'N/A')}
          </TamaguiText>
        </XStack>

        {safeGet(travelData, 'accommodationPhone') && (
          <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
            <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
              {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.phone') :
               language === 'thai' ? 'โทรศัพท์' :
               `โทรศัพท์ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.phone')}`}:
            </TamaguiText>
            <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
              {safeString(safeGet(travelData, 'accommodationPhone'), 'N/A')}
            </TamaguiText>
          </XStack>
        )}

        {/* Hotel Booking Photo */}
        {travelData?.hotelBookingPhotoUri && (
          <YStack
            marginTop="$md"
            marginBottom="$sm"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius={8}
            overflow="hidden"
            backgroundColor="$background"
            onPress={() => {
              Alert.alert(
                language === 'english' ? 'Hotel Booking' :
                language === 'thai' ? 'การจองโรงแรม' :
                'การจองโรงแรม / Hotel Booking',
                language === 'english' ? 'Tap to view larger image' :
                language === 'thai' ? 'แตะเพื่อดูภาพขนาดใหญ่' :
                'แตะเพื่อดูภาพขนาดใหญ่ / Tap to view larger image'
              );
            }}
            cursor="pointer"
            pressStyle={{ opacity: 0.8 }}
          >
            <TamaguiText fontSize={14} fontWeight="600" color="$text" padding="$sm" backgroundColor="$primaryLight">
              🏨 {language === 'english' ? 'Hotel Booking' :
                  language === 'thai' ? 'การจองโรงแรม' :
                  'การจองโรงแรม / Hotel Booking'}
            </TamaguiText>
            <OptimizedImage
              uri={travelData.hotelBookingPhotoUri}
              style={{ width: '100%', height: 200, backgroundColor: '$background' }}
              resizeMode="contain"
              lazy={true}
              lazyLoadDelay={250}
              placeholder="🏨"
              showLoadingText={false}
            />
            <TamaguiText fontSize={12} color="$textSecondary" padding="$xs" textAlign="center" fontStyle="italic">
              {language === 'english' ? 'Tap to enlarge' :
               language === 'thai' ? 'แตะเพื่อขยาย' :
               'แตะเพื่อขยาย'}
            </TamaguiText>
          </YStack>
        )}
      </YStack>

      {/* Visit Purpose Group */}
      <YStack marginBottom="$lg">
        <TamaguiText fontSize={18} fontWeight="600" color="$text" marginBottom="$sm">
          🎯 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.visitPurpose') :
               language === 'thai' ? 'จุดประสงค์การเยือน' :
               `จุดประสงค์การเยือน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.visitPurpose')}`}
        </TamaguiText>

        <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
          <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.purpose') :
             language === 'thai' ? 'จุดประสงค์' :
             `จุดประสงค์ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.purpose')}`}:
          </TamaguiText>
          <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
            {safeGet(travelData, 'purposeOfVisit', null) || safeGet(travelData, 'purpose', 'N/A')}
          </TamaguiText>
        </XStack>

        <XStack justifyContent="space-between" paddingVertical="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
          <TamaguiText fontSize={14} color="$textSecondary" flex={1}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.durationOfStay') :
             language === 'thai' ? 'ระยะเวลาพำนัก' :
             `ระยะเวลาพำนัก / ${t('progressiveEntryFlow.immigrationOfficer.presentation.durationOfStay')}`}:
          </TamaguiText>
          <TamaguiText fontSize={14} fontWeight="500" color="$text" flex={1} textAlign="right">
            {travelData?.durationOfStay || 'N/A'}
          </TamaguiText>
        </XStack>
      </YStack>
    </YStack>
  );
};

export default TravelInfoSection;
