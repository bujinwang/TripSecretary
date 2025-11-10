/**
 * QRCodeSection Component
 *
 * Displays the TDAC QR code with pinch-to-zoom, double-tap, and long-press gestures.
 * Extracted from ImmigrationOfficerViewScreen for better maintainability.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, Image, Animated } from 'react-native';
import {
  PinchGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  type PinchGestureHandlerProps,
  type HandlerStateChangeEvent,
  type PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { colors, spacing } from '../../../theme';
import { GESTURES } from '../immigrationOfficerViewConstants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QR_CODE_SIZE = Math.min(screenHeight * 0.5, screenWidth * 0.4, 400);

type EntryPackPreview = {
  qrCodeUri?: string | null;
  arrCardNo?: string | null;
  submittedAt?: string | null;
};

type TranslationFn = (key: string, defaultValue?: string) => string;

type QRCodeSectionProps = {
  entryPack?: EntryPackPreview | null;
  language: 'english' | 'thai' | 'bilingual';
  qrZoom: number;
  onZoomChange?: (value: number) => void;
  handleDoubleTap: () => void;
  handleLongPressQR: () => void;
  t: TranslationFn;
  doubleTapRef: React.RefObject<TapGestureHandler>;
  longPressRef: React.RefObject<LongPressGestureHandler>;
};

const QRCodeSection: React.FC<QRCodeSectionProps> = ({
  entryPack,
  language,
  qrZoom,
  onZoomChange,
  handleDoubleTap,
  handleLongPressQR,
  t,
  doubleTapRef,
  longPressRef,
}) => {
  const baseScale = useRef(new Animated.Value(qrZoom || 1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(qrZoom || 1);

  useEffect(() => {
    const clamped = Math.min(Math.max(qrZoom, GESTURES.MIN_PINCH_SCALE), GESTURES.MAX_PINCH_SCALE);
    lastScale.current = clamped;
    baseScale.setValue(clamped);
    pinchScale.setValue(1);
  }, [baseScale, pinchScale, qrZoom]);

  const handlePinchEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { scale: pinchScale } }], {
        useNativeDriver: true,
      }),
    [pinchScale]
  );

  const handlePinchStateChange = useCallback(
    ({ nativeEvent }: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => {
      if (
        nativeEvent.state === State.END ||
        nativeEvent.state === State.CANCELLED ||
        nativeEvent.state === State.FAILED
      ) {
        let nextScale = lastScale.current * nativeEvent.scale;
        nextScale = Math.min(Math.max(nextScale, GESTURES.MIN_PINCH_SCALE), GESTURES.MAX_PINCH_SCALE);
        lastScale.current = nextScale;
        baseScale.setValue(nextScale);
        pinchScale.setValue(1);
        onZoomChange?.(nextScale);
      }
    },
    [baseScale, onZoomChange, pinchScale]
  );

  const animatedQRStyle = useMemo(
    () => ({
      transform: [{ scale: Animated.multiply(baseScale, pinchScale) }],
    }),
    [baseScale, pinchScale]
  );

  const formatEntryCardNumber = (cardNumber: string | null | undefined): string => {
    if (!cardNumber) {
      return 'XXXX-XXXX-XXXX';
    }

    const cleanNumber = cardNumber.replace(/[^0-9A-Z]/g, '');

    if (cleanNumber.length >= 12) {
      return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4, 8)}-${cleanNumber.slice(8, 12)}`;
    }

    if (cleanNumber.length >= 8) {
      return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4, 8)}-${cleanNumber.slice(8)}`;
    }

    if (cleanNumber.length >= 4) {
      return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4)}`;
    }

    return cleanNumber || 'XXXX-XXXX-XXXX';
  };

  const formatDateForDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);

      if (language === 'thai') {
        const buddhistYear = date.getFullYear() + 543;
        const thaiMonths = [
          'มกราคม',
          'กุมภาพันธ์',
          'มีนาคม',
          'เมษายน',
          'พฤษภาคม',
          'มิถุนายน',
          'กรกฎาคม',
          'สิงหาคม',
          'กันยายน',
          'ตุลาคม',
          'พฤศจิกายน',
          'ธันวาคม',
        ];
        return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${buddhistYear}`;
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString ?? 'N/A';
    }
  };

  const getSectionTitle = (): string => {
    if (language === 'english') {
      return t('progressiveEntryFlow.immigrationOfficer.presentation.tdacQRCode');
    }

    if (language === 'thai') {
      return 'รหัส QR TDAC';
    }

    return `รหัส QR TDAC / ${t('progressiveEntryFlow.immigrationOfficer.presentation.tdacQRCode')}`;
  };

  const getSubmittedText = (): string => {
    if (language === 'english') {
      return t('progressiveEntryFlow.immigrationOfficer.presentation.submitted');
    }

    if (language === 'thai') {
      return 'ส่งเมื่อ';
    }

    return `ส่งเมื่อ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.submitted')}`;
  };

  return (
    <View style={styles.qrSection}>
      <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>

      <View style={styles.qrContainer}>
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
              <PinchGestureHandler
                onGestureEvent={handlePinchEvent as PinchGestureHandlerProps['onGestureEvent']}
                onHandlerStateChange={handlePinchStateChange}
              >
                <Animated.View style={[styles.qrCodeContainer, animatedQRStyle]}>
                  <Image
                    source={{ uri: entryPack.qrCodeUri }}
                    style={styles.qrCode}
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
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>
              {language === 'english'
                ? t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodePlaceholder')
                : language === 'thai'
                ? 'รหัส QR'
                : `รหัส QR / ${t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodePlaceholder')}`}
            </Text>
            <Text style={styles.qrPlaceholderSubtext}>
              {language === 'english'
                ? t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodeSubtext')
                : language === 'thai'
                ? 'จะปรากฏหลังส่ง TDAC'
                : 'จะปรากฏหลังส่ง TDAC'}
            </Text>
          </View>
        )}

        {qrZoom !== 1 && (
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{Math.round(qrZoom * 100)}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.entryCardNumber}>
        {formatEntryCardNumber(entryPack?.arrCardNo || 'XXXXXXXXXXXX')}
      </Text>

      <Text style={styles.submissionDate}>
        {getSubmittedText()}: {formatDateForDisplay(entryPack?.submittedAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  qrSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 20,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
    borderWidth: 4,
    borderColor: colors.white,
  },
  qrCodeContainer: {
    width: QR_CODE_SIZE,
    height: QR_CODE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCode: {
    width: '100%',
    height: '100%',
  },
  qrPlaceholder: {
    width: QR_CODE_SIZE,
    height: QR_CODE_SIZE,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  qrPlaceholderText: {
    color: colors.textSecondary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  qrPlaceholderSubtext: {
    color: colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  zoomText: {
    color: colors.white,
    fontSize: 14,
  },
  entryCardNumber: {
    color: colors.white,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  submissionDate: {
    color: colors.white,
    fontSize: 18,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
});

export default QRCodeSection;

