/**
 * QRCodeSection Component
 *
 * Displays the TDAC QR code with pinch-to-zoom, double-tap, and long-press gestures
 * Extracted from ImmigrationOfficerViewScreen for better maintainability
 */

import React from 'react';
import { Image, Platform, Dimensions } from 'react-native';
import {
  PinchGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { YStack, Text as TamaguiText } from '../../../components/tamagui';
import { GESTURES } from '../immigrationOfficerViewConstants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const QR_CODE_SIZE = Math.min(screenHeight * 0.5, screenWidth * 0.4, 400);

/**
 * QR Code Section Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.entryPack - Entry pack data containing QR code URI
 * @param {string} props.language - Display language ('english', 'thai', 'bilingual')
 * @param {number} props.qrZoom - Current zoom level
 * @param {Object} props.scale - Animated scale value
 * @param {Function} props.pinchGestureHandler - Pinch gesture handler
 * @param {Object} props.animatedQRStyle - Animated style for QR code
 * @param {Function} props.handleDoubleTap - Double tap handler
 * @param {Function} props.handleLongPressQR - Long press handler
 * @param {Function} props.t - Translation function
 * @param {Object} props.doubleTapRef - Ref for double tap gesture
 * @param {Object} props.longPressRef - Ref for long press gesture
 */
const QRCodeSection = ({
  entryPack,
  language,
  qrZoom,
  scale,
  pinchGestureHandler,
  animatedQRStyle,
  handleDoubleTap,
  handleLongPressQR,
  t,
  doubleTapRef,
  longPressRef,
}) => {
  const formatEntryCardNumber = (cardNumber) => {
    if (!cardNumber) return 'XXXX-XXXX-XXXX';

    const cleanNumber = cardNumber.replace(/[^0-9A-Z]/g, '');

    if (cleanNumber.length >= 12) {
      return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4, 8)}-${cleanNumber.slice(8, 12)}`;
    } else if (cleanNumber.length >= 8) {
      return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4, 8)}-${cleanNumber.slice(8)}`;
    } else if (cleanNumber.length >= 4) {
      return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4)}`;
    } else {
      return cleanNumber || 'XXXX-XXXX-XXXX';
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);

      if (language === 'thai') {
        const buddhistYear = date.getFullYear() + 543;
        const thaiMonths = [
          'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${buddhistYear}`;
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      return dateString;
    }
  };

  const getSectionTitle = () => {
    if (language === 'english') {
      return t('progressiveEntryFlow.immigrationOfficer.presentation.tdacQRCode');
    } else if (language === 'thai') {
      return 'รหัส QR TDAC';
    } else {
      return `รหัส QR TDAC / ${t('progressiveEntryFlow.immigrationOfficer.presentation.tdacQRCode')}`;
    }
  };

  const getSubmittedText = () => {
    if (language === 'english') {
      return t('progressiveEntryFlow.immigrationOfficer.presentation.submitted');
    } else if (language === 'thai') {
      return 'ส่งเมื่อ';
    } else {
      return `ส่งเมื่อ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.submitted')}`;
    }
  };

  return (
    <YStack alignItems="center" marginBottom="$xl">
      <TamaguiText color="white" fontSize={24} fontWeight="bold" marginBottom="$lg" textAlign="center">
        {getSectionTitle()}
      </TamaguiText>

      <YStack
        backgroundColor="white"
        padding="$xl"
        borderRadius={20}
        marginBottom="$lg"
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={0.4}
        shadowRadius={16}
        elevation={12}
        borderWidth={4}
        borderColor="white"
      >
        {entryPack?.qrCodeUri ? (
          <LongPressGestureHandler
            ref={longPressRef}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.ACTIVE) {
                handleLongPressQR();
              }
            }}
            minDurationMs={GESTURES.LONG_PRESS_DURATION}
          >
            <TapGestureHandler
              ref={doubleTapRef}
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.ACTIVE) {
                  handleDoubleTap();
                }
              }}
              numberOfTaps={2}
              waitFor={longPressRef}
            >
              <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
                <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animatedQRStyle]}>
                  <Image
                    source={{ uri: entryPack.qrCodeUri }}
                    style={{ width: QR_CODE_SIZE, height: QR_CODE_SIZE }}
                    resizeMode="contain"
                    resizeMethod="scale"
                    fadeDuration={0}
                    blurRadius={0}
                  />
                </Animated.View>
              </PinchGestureHandler>
            </TapGestureHandler>
          </LongPressGestureHandler>
        ) : (
          <YStack
            width={QR_CODE_SIZE}
            height={QR_CODE_SIZE}
            backgroundColor="$background"
            justifyContent="center"
            alignItems="center"
            borderRadius={12}
            borderWidth={2}
            borderColor="$borderColor"
            borderStyle="dashed"
          >
            <TamaguiText color="$textSecondary" fontSize={18} fontWeight="600" marginBottom="$xs">
              {language === 'english'
                ? t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodePlaceholder')
                : language === 'thai'
                ? 'รหัส QR'
                : `รหัส QR / ${t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodePlaceholder')}`}
            </TamaguiText>
            <TamaguiText color="$textTertiary" fontSize={14} textAlign="center">
              {language === 'english'
                ? t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodeSubtext')
                : language === 'thai'
                ? 'จะปรากฏหลังส่ง TDAC'
                : 'จะปรากฏหลังส่ง TDAC'}
            </TamaguiText>
          </YStack>
        )}

        {/* Zoom indicator */}
        {qrZoom !== 1 && (
          <YStack
            position="absolute"
            top="$sm"
            right="$sm"
            backgroundColor="rgba(0, 0, 0, 0.7)"
            paddingHorizontal="$sm"
            paddingVertical="$xs"
            borderRadius={12}
          >
            <TamaguiText color="white" fontSize={12} fontWeight="600">
              {Math.round(qrZoom * 100)}%
            </TamaguiText>
          </YStack>
        )}
      </YStack>

      <TamaguiText
        color="white"
        fontSize={40}
        fontWeight="bold"
        fontFamily={Platform.OS === 'ios' ? 'Courier New' : 'monospace'}
        letterSpacing={3}
        marginBottom="$sm"
        textAlign="center"
        textShadowColor="rgba(0, 0, 0, 0.8)"
        textShadowOffset={{ width: 2, height: 2 }}
        textShadowRadius={4}
      >
        {formatEntryCardNumber(entryPack?.arrCardNo || 'XXXXXXXXXXXX')}
      </TamaguiText>

      <TamaguiText color="white" fontSize={16} opacity={0.8}>
        {getSubmittedText()}: {formatDateForDisplay(entryPack?.submittedAt)}
      </TamaguiText>
    </YStack>
  );
};

export default QRCodeSection;
