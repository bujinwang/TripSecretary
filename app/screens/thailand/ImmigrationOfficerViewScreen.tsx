// 入境通 - Immigration Officer View Screen (Presentation Mode)
// Full-screen presentation mode optimized for showing to immigration officers
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  PanResponder,
  Platform,
  ActivityIndicator,
  type PanResponderInstance,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { TapGestureHandler, LongPressGestureHandler } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import { colors, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { QR_CODE, IMAGE_SIZES, TYPOGRAPHY as IOV_TYPOGRAPHY } from './immigrationOfficerViewConstants';
import BiometricAuthService from '../../services/security/BiometricAuthService';
import EntryInfoService from '../../services/EntryInfoService';
import UserDataService from '../../services/data/UserDataService';
import QRCodeSection from './components/QRCodeSection';
import PassportInfoSection from './components/PassportInfoSection';
import FundsInfoSection from './components/FundsInfoSection';
import TravelInfoSection from './components/TravelInfoSection';
import ContactInfoSection from './components/ContactInfoSection';
import type { RootStackScreenProps } from '../../types/navigation';
import type {
  EntryPackPresentation,
  EntryPackPresentationStatus,
  EntryInfoPresentation,
  FundPresentation,
  ImmigrationOfficerViewParams,
  PassportPresentation,
  PresentationLanguage,
  SubmissionMethod,
  TravelPresentation,
} from '../../types/thailand';
import type { SerializablePassport } from '../../types/data';
import type { EntryInfoStatus } from '../../models/EntryInfo';

type ImmigrationOfficerViewScreenProps = RootStackScreenProps<'ImmigrationOfficerView'>;

type CleanupState = {
  orientation?: ScreenOrientation.Orientation | ScreenOrientation.OrientationLock;
  brightness?: number | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toPlainRecord = (value: unknown): Record<string, unknown> | null => {
  if (isRecord(value)) {
    return value;
  }

  if (value && typeof value === 'object' && typeof (value as { toJSON?: unknown }).toJSON === 'function') {
    const jsonValue = (value as { toJSON: () => unknown }).toJSON();
    if (isRecord(jsonValue)) {
      return jsonValue;
    }
  }

  return null;
};

const pickString = (record: Record<string, unknown> | null | undefined, keys: string[]): string | undefined => {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return undefined;
};

const normalizeSubmissionMethod = (value: unknown): SubmissionMethod => {
  if (typeof value !== 'string') {
    return 'unknown';
  }

  const normalized = value.toLowerCase();
  if (normalized === 'api' || normalized === 'webview' || normalized === 'hybrid') {
    return normalized;
  }

  return 'unknown';
};

const deriveEntryPackStatus = (
  status: EntryInfoStatus | EntryPackPresentationStatus | string | null | undefined,
  defaultStatus: EntryPackPresentationStatus = 'unknown'
): EntryPackPresentationStatus => {
  if (!status) {
    return defaultStatus;
  }

  const normalized = String(status).toLowerCase();
  switch (normalized) {
    case 'submitted':
      return 'submitted';
    case 'in_progress':
    case 'ready':
    case 'incomplete':
      return 'in_progress';
    case 'superseded':
      return 'superseded';
    case 'expired':
      return 'expired';
    case 'archived':
      return 'archived';
    default:
      return defaultStatus;
  }
};

const buildEntryPackFromDocuments = (
  documents: unknown,
  cardType: string | null | undefined
): EntryPackPresentation | null => {
  const records: Record<string, unknown>[] = [];

  if (Array.isArray(documents)) {
    documents.forEach((doc) => {
      const record = toPlainRecord(doc);
      if (record) {
        records.push(record);
      }
    });
  } else {
    const record = toPlainRecord(documents);
    if (record) {
      records.push(record);
    }
  }

  if (records.length === 0) {
    return null;
  }

  const desiredCardType = cardType ?? pickString(records[0], ['cardType', 'card_type']) ?? 'TDAC';
  const selectedDoc =
    records.find((record) => pickString(record, ['cardType', 'card_type']) === desiredCardType) ?? records[0];

  const submissionMethod = normalizeSubmissionMethod(
    selectedDoc.submissionMethod ?? selectedDoc.submission_method
  );

  return {
    id: pickString(selectedDoc, ['id']),
    cardType: pickString(selectedDoc, ['cardType', 'card_type']) ?? desiredCardType,
    qrCodeUri: pickString(selectedDoc, ['qrCodeUri', 'qrUri', 'qr_code_uri']),
    arrCardNo: pickString(selectedDoc, ['arrCardNo', 'arr_card_no']),
    submittedAt: pickString(selectedDoc, ['submittedAt', 'submitted_at']),
    submissionMethod,
    status: deriveEntryPackStatus(pickString(selectedDoc, ['status']), 'unknown'),
  };
};

const buildEntryPackFromEntryInfo = (
  entryInfo: EntryInfoPresentation | Record<string, unknown> | null | undefined,
  cardType: string | null | undefined
): EntryPackPresentation | null => {
  if (!entryInfo) {
    return null;
  }

  const record = isRecord(entryInfo) ? entryInfo : toPlainRecord(entryInfo);
  const documentsSource =
    (entryInfo as EntryInfoPresentation | null | undefined)?.documents ??
    record?.documents;

  const entryPackFromDocuments = buildEntryPackFromDocuments(documentsSource, cardType);

  if (!entryPackFromDocuments) {
    return null;
  }

  const entryStatus =
    (entryInfo as EntryInfoPresentation | null | undefined)?.status ??
    (record?.status as EntryInfoStatus | string | undefined);

  return {
    ...entryPackFromDocuments,
    id: entryPackFromDocuments.id ?? pickString(record, ['id']),
    status: deriveEntryPackStatus(entryStatus, entryPackFromDocuments.status ?? 'unknown'),
  };
};

const mergeEntryPack = (
  primary: EntryPackPresentation | null | undefined,
  secondary: EntryPackPresentation | null | undefined
): EntryPackPresentation | null => {
  if (!primary && !secondary) {
    return null;
  }

  const result: EntryPackPresentation = {};

  const pickField = <K extends keyof EntryPackPresentation>(field: K): EntryPackPresentation[K] | undefined =>
    primary?.[field] ?? secondary?.[field];

  result.id = pickField('id');
  result.cardType = pickField('cardType') ?? null;
  result.qrCodeUri = pickField('qrCodeUri') ?? null;
  result.arrCardNo = pickField('arrCardNo') ?? null;
  result.submittedAt = pickField('submittedAt') ?? null;
  result.submissionMethod = pickField('submissionMethod') ?? 'unknown';
  result.status = pickField('status') ?? 'unknown';

  return result;
};

const buildPassportPresentation = (value: unknown): PassportPresentation | null => {
  const record = toPlainRecord(value);
  if (!record) {
    return null;
  }

  return {
    ...record,
    fullName: pickString(record, ['fullName', 'name']),
    passportNumber: pickString(record, ['passportNumber', 'passport_no', 'number']),
    nationality: pickString(record, ['nationality', 'nationalityCode']),
    dateOfBirth: pickString(record, ['dateOfBirth', 'dob', 'birthDate']),
    expiryDate: pickString(record, ['expiryDate', 'expirationDate']),
    gender: pickString(record, ['gender', 'sex']),
    photoUri: pickString(record, ['photoUri', 'photo_uri']),
    email: pickString(record, ['email']),
    phoneNumber: pickString(record, ['phoneNumber', 'phone', 'mobile']),
  } as PassportPresentation;
};

const buildTravelPresentation = (value: unknown): TravelPresentation => {
  const record = toPlainRecord(value);
  if (!record) {
    return null;
  }

  return {
    ...record,
    arrivalDate: pickString(record, ['arrivalDate', 'arrival_date']),
    arrivalFlightNumber: pickString(record, ['arrivalFlightNumber', 'arrival_flight_number', 'flightNumber']),
    travelPurpose: pickString(record, ['travelPurpose', 'purpose']),
    accommodation: pickString(record, ['accommodation']),
    accommodationAddress: pickString(record, ['accommodationAddress', 'address']),
    phoneNumber: pickString(record, ['phoneNumber', 'phone']),
  };
};

const buildFundPresentation = (value: unknown): FundPresentation => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => toPlainRecord(item))
    .filter((record): record is Record<string, unknown> => !!record)
    .map((record) => {
      const amountValue =
        typeof record.amount === 'number'
          ? record.amount
          : pickString(record, ['amount']);

      return {
        ...record,
        id: pickString(record, ['id']),
        type: pickString(record, ['type', 'fundType']),
        currency: pickString(record, ['currency']),
        amount: amountValue ?? null,
        photoUri: pickString(record, ['photoUri', 'photo_uri']),
      };
    }) as FundPresentation;
};

const normalizeEntryInfoStatus = (value: unknown): EntryInfoStatus | null => {
  if (typeof value !== 'string') {
    return null;
  }

  switch (value) {
    case 'incomplete':
    case 'ready':
    case 'submitted':
    case 'superseded':
    case 'expired':
    case 'archived':
      return value;
    default:
      return null;
  }
};

const buildEntryInfoPresentationFromRecord = (record: Record<string, unknown>): EntryInfoPresentation => ({
  id: pickString(record, ['id']) ?? '',
  status: normalizeEntryInfoStatus(record.status),
  destinationId: pickString(record, ['destinationId', 'destination_id']) ?? null,
  destinationName: pickString(record, ['destinationName', 'destination_name']) ?? null,
  userId: pickString(record, ['userId', 'user_id']) ?? null,
  documents: record.documents,
});

const ImmigrationOfficerViewScreen: React.FC<ImmigrationOfficerViewScreenProps> = ({ navigation, route }) => {
  const { t } = useLocale();

  const {
    entryPack: initialEntryPack,
    passportData: initialPassportData,
    travelData: initialTravelData,
    fundData: initialFundData,
    entryPackId,
    fromImmigrationGuide,
    cardType,
    entryInfo: initialEntryInfo,
  } = (route.params as ImmigrationOfficerViewParams | undefined) ?? {};

  const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false);
  const [qrZoom, setQrZoom] = useState<number>(1);
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authenticationRequired, setAuthenticationRequired] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [language, setLanguage] = useState<PresentationLanguage>('bilingual');
  const [brightnessBoost, setBrightnessBoost] = useState<boolean>(true);
  const [showHelpHints, setShowHelpHints] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const doubleTapRef = useRef<TapGestureHandler>(null);
  const longPressRef = useRef<LongPressGestureHandler>(null);

  const isMountedRef = useRef(true);
  const cleanupRef = useRef<CleanupState>({});

  const [entryPack, setEntryPack] = useState<EntryPackPresentation | null>(
    mergeEntryPack(initialEntryPack ?? null, buildEntryPackFromEntryInfo(initialEntryInfo ?? null, cardType ?? null))
  );
  const [passportData, setPassportData] = useState<PassportPresentation | null>(
    buildPassportPresentation(initialPassportData ?? null)
  );
  const [travelData, setTravelData] = useState<TravelPresentation>(
    buildTravelPresentation(initialTravelData ?? null)
  );
  const [fundData, setFundData] = useState<FundPresentation>(
    buildFundPresentation(initialFundData ?? null)
  );
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  const fetchEntryPackData = useCallback(async () => {
    if (!fromImmigrationGuide || !entryPackId || entryPack) {
      return;
    }

    setDataLoading(true);

    try {
      const loadedEntryInfo = await EntryInfoService.getEntryInfoById(entryPackId);
      const entryInfoRecord = toPlainRecord(loadedEntryInfo);

      if (!entryInfoRecord) {
        throw new Error('Entry pack data not found');
      }

      const entryInfoPresentation = buildEntryInfoPresentationFromRecord(entryInfoRecord);
      const builtEntryPack = buildEntryPackFromEntryInfo(entryInfoPresentation, cardType ?? null);
      if (builtEntryPack) {
        setEntryPack((previous) => mergeEntryPack(builtEntryPack, previous));
      }

      const { userId } = entryInfoPresentation;

      if (userId) {
        await UserDataService.initialize(userId);

        const passportModel = await UserDataService.getPassport(userId).catch(() => null);
        const serializedPassport =
          UserDataService.toSerializablePassport(passportModel) ??
          (toPlainRecord(passportModel) as SerializablePassport | null);
        setPassportData(buildPassportPresentation(serializedPassport));

        const travelInfo = await UserDataService.getTravelInfo(
          userId,
          entryInfoPresentation.destinationId ?? null
        ).catch(() => null);
        setTravelData(buildTravelPresentation(travelInfo));

        const funds = await UserDataService.getFundItems(userId).catch(() => []);
        setFundData(buildFundPresentation(funds));
      }
    } catch (error) {
      console.error('Error loading data for immigration officer view:', error);
      setAuthError('Failed to load entry pack data');
    } finally {
      setDataLoading(false);
    }
  }, [cardType, entryPack, entryPackId, fromImmigrationGuide]);

  useEffect(() => {
    const setupPresentationMode = async () => {
      try {
        // Authenticate user for immigration officer view
        const authResult = await BiometricAuthService.authenticateForImmigrationView();
        
        if (!authResult.success && !authResult.skipped) {
          setAuthenticationRequired(true);
          setAuthError(authResult.error || 'Authentication required for immigration officer view');
          return;
        }
        
        setIsAuthenticated(true);
        setAuthenticationRequired(false);

        // Load data if called from immigration guide with just entryPackId
        if (fromImmigrationGuide && entryPackId && !entryPack) {
          await fetchEntryPackData();
        }
        
        const currentOrientation = await ScreenOrientation.getOrientationAsync();

        // Lock to landscape orientation for presentation mode
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

        // Hide status bar for full-screen experience
        StatusBar.setHidden(true);

        // Keep screen awake during presentation mode
        activateKeepAwake('ImmigrationOfficerView');

        // Store original brightness and boost to maximum
        const currentBrightness = await Brightness.getBrightnessAsync();
        setOriginalBrightness(currentBrightness);
        await Brightness.setBrightnessAsync(1.0); // Maximum brightness

        // Store cleanup values in ref for synchronous cleanup
        cleanupRef.current = {
          orientation: currentOrientation,
          brightness: currentBrightness,
        };
      } catch (error) {
        console.warn('Failed to set up presentation mode:', error);
      }
    };

    setupPresentationMode();

    // Synchronous cleanup to avoid async issues on unmount
    return () => {
      isMountedRef.current = false;

      try {
        // Restore original orientation (fire-and-forget with error handling)
        if (cleanupRef.current?.orientation) {
          ScreenOrientation.unlockAsync().catch(err =>
            console.warn('Failed to unlock orientation:', err)
          );
        }

        // Restore status bar (synchronous)
        StatusBar.setHidden(false);

        // Deactivate keep awake (synchronous)
        deactivateKeepAwake('ImmigrationOfficerView');

        // Restore original brightness (fire-and-forget with error handling)
        if (cleanupRef.current?.brightness !== null && cleanupRef.current?.brightness !== undefined) {
          Brightness.setBrightnessAsync(cleanupRef.current.brightness).catch(err =>
            console.warn('Failed to restore brightness:', err)
          );
        }
      } catch (error) {
        console.warn('Failed to cleanup presentation mode:', error);
      }
    };
  }, [fetchEntryPackData, entryPack, entryPackId, fromImmigrationGuide]);

  // Pinch gesture handler for QR code zoom
  // Pan responder for swipe-down to exit
  const panResponder: PanResponderInstance = PanResponder.create({
    onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) =>
      gestureState.dy > 10 && evt.nativeEvent.pageY < 100,
    onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      // Handle swipe down from top to exit
      if (gestureState.dy > 50 && evt.nativeEvent.pageY < 100) {
        handleExitPresentation();
      }
    },
  });

  const handleExitPresentation = useCallback((): void => {
    Alert.alert(
      t('progressiveEntryFlow.immigrationOfficer.presentation.exitTitle'),
      t('progressiveEntryFlow.immigrationOfficer.presentation.exitMessage'),
      [
        { 
          text: t('progressiveEntryFlow.immigrationOfficer.presentation.cancel'), 
          style: 'cancel' 
        },
        {
          text: t('progressiveEntryFlow.immigrationOfficer.presentation.exit'),
          onPress: async () => {
            try {
              // Restore orientation before navigating back
              await ScreenOrientation.unlockAsync();
              StatusBar.setHidden(false);
              
              // Deactivate keep awake
              deactivateKeepAwake('ImmigrationOfficerView');
              
              // Restore original brightness
              if (originalBrightness !== null) {
                await Brightness.setBrightnessAsync(originalBrightness);
              }
              
              navigation.goBack();
            } catch (error) {
              console.warn('Failed to restore settings on exit:', error);
              navigation.goBack();
            }
          }
        }
      ]
    );
  }, [navigation, originalBrightness, t]);

  const toggleLanguage = useCallback((): void => {
    const languages: PresentationLanguage[] = ['bilingual', 'thai', 'english'];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
    
    // Provide haptic feedback for language switching
    if (Platform.OS === 'ios') {
      // Could add haptic feedback here if react-native-haptic-feedback is available
    }
  }, [language]);

  const toggleBrightness = useCallback(async () => {
    try {
      if (brightnessBoost) {
        // Restore original brightness
        if (originalBrightness !== null) {
          await Brightness.setBrightnessAsync(originalBrightness);
        }
      } else {
        // Boost to maximum brightness
        await Brightness.setBrightnessAsync(1.0);
      }
      setBrightnessBoost(!brightnessBoost);
    } catch (error) {
      console.warn('Failed to toggle brightness:', error);
    }
  }, [brightnessBoost, originalBrightness]);

  const handleLongPressQR = useCallback((): void => {
    try {
      // Save QR code to album (requires expo-media-library)
      Alert.alert(
        t('progressiveEntryFlow.immigrationOfficer.presentation.saveQRCode'),
        t('progressiveEntryFlow.immigrationOfficer.presentation.saveQRMessage'),
        [
          { 
            text: t('progressiveEntryFlow.immigrationOfficer.presentation.cancel'), 
            style: 'cancel' 
          },
          { 
            text: t('progressiveEntryFlow.immigrationOfficer.presentation.save'), 
            onPress: () => {
              // Implementation would require expo-media-library
              Alert.alert(
                t('progressiveEntryFlow.immigrationOfficer.presentation.saved'),
                t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodeSaved')
              );
            }
          }
        ]
      );
    } catch (error) {
      console.warn('Failed to save QR code:', error);
    }
  }, [t]);

  const handleShowHelp = useCallback((): void => {
    setShowHelpHints(true);
  }, []);

  const toggleInfoDisplay = useCallback((): void => {
    setShowMoreInfo((previous) => !previous);
  }, []);

  const handleDoubleTap = useCallback((): void => {
    toggleInfoDisplay();
  }, [toggleInfoDisplay]);

  const hideHelpHints = useCallback((): void => {
    setShowHelpHints(false);
  }, []);

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

  const renderQRSection = () => (
    <QRCodeSection
      entryPack={entryPack}
      language={language}
      qrZoom={qrZoom}
      onZoomChange={setQrZoom}
      handleDoubleTap={handleDoubleTap}
      handleLongPressQR={handleLongPressQR}
      t={t}
      doubleTapRef={doubleTapRef}
      longPressRef={longPressRef}
    />
  );

  const renderPassportSection = () => (
    <PassportInfoSection
      passportData={passportData}
      language={language}
      formatDateForDisplay={formatDateForDisplay}
      t={t}
    />
  );

  const renderFundsSection = () => (
    <FundsInfoSection
      fundData={fundData}
      language={language}
      t={t}
    />
  );

  const renderTravelSection = () => (
    <TravelInfoSection
      travelData={travelData}
      language={language}
      formatDateForDisplay={formatDateForDisplay}
      t={t}
    />
  );

  const renderContactSection = () => (
    <ContactInfoSection
      passportData={passportData}
      travelData={travelData}
      language={language}
      t={t}
    />
  );

  // Handle authentication required
  if (authenticationRequired && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authContent}>
          <Text style={styles.authTitle}>
            {t('progressiveEntryFlow.immigrationOfficer.authentication.title')}
          </Text>
          <Text style={styles.authMessage}>
            {t('progressiveEntryFlow.immigrationOfficer.authentication.message')}
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={async () => {
              const authResult = await BiometricAuthService.authenticateForImmigrationView();
              if (authResult.success || authResult.skipped) {
                setIsAuthenticated(true);
                setAuthenticationRequired(false);
              } else {
                setAuthError(authResult.error);
              }
            }}
          >
            <Text style={styles.authButtonText}>
              {t('progressiveEntryFlow.immigrationOfficer.authentication.authenticate')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>
              {t('progressiveEntryFlow.immigrationOfficer.authentication.cancel')}
            </Text>
          </TouchableOpacity>
          {authError && (
            <Text style={styles.authErrorText}>{authError}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Handle data loading
  if (dataLoading) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.authTitle}>加载中...</Text>
          <Text style={styles.authMessage}>正在准备展示数据</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <View style={styles.leftControls}>
          <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
            <Text style={styles.languageToggleText}>
              {language === 'bilingual' ? 'ไทย/EN' : language === 'thai' ? 'ไทย' : 'EN'}
            </Text>
            <Text style={styles.languageSubtext}>
              {language === 'bilingual'
                ? 'Bilingual'
                : language === 'thai'
                ? 'Thai Only'
                : 'English Only'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.brightnessToggle, { opacity: brightnessBoost ? 1 : 0.6 }]}
            onPress={toggleBrightness}
          >
            <Text style={styles.brightnessToggleText}>☀️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightControls}>
          <TouchableOpacity style={styles.helpButton} onPress={handleShowHelp}>
            <Text style={styles.helpButtonText}>?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitButton} onPress={handleExitPresentation}>
            <Text style={styles.exitButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderQRSection()}

        {showMoreInfo && (
          <>
            {renderPassportSection()}
            {renderFundsSection()}
            {renderTravelSection()}
            {renderContactSection()}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleInfoDisplay}>
          <Text style={styles.toggleButtonText}>
            {showMoreInfo
              ? language === 'english'
                ? 'Show Less Info'
                : language === 'thai'
                ? 'แสดงน้อยลง'
                : 'แสดงน้อยลง / Show Less Info'
              : language === 'english'
              ? 'Show More Info'
              : language === 'thai'
              ? 'แสดงเพิ่มเติม'
              : 'แสดงเพิ่มเติม / Show More Info'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.exitHint}>
          {language === 'english'
            ? 'Swipe down to exit'
            : language === 'thai'
            ? 'เลื่อนลงเพื่อออก'
            : 'เลื่อนลงเพื่อออก / Swipe down to exit'}
        </Text>

        <Text style={styles.disclaimer}>
          {language === 'english'
            ? 'This is a traveler-prepared document. Please verify with official systems.'
            : language === 'thai'
            ? 'นี่คือเอกสารที่นักเดินทางเตรียมไว้ กรุณาตรวจสอบกับระบบทางการ'
            : 'นี่คือเอกสารที่นักเดินทางเตรียมไว้ / This is a traveler-prepared document'}
        </Text>
      </View>

      {showHelpHints && (
        <View style={styles.helpModal}>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>
              {language === 'english'
                ? 'Gesture Help'
                : language === 'thai'
                ? 'คำแนะนำการใช้งาน'
                : 'คำแนะนำการใช้งาน / Gesture Help'}
            </Text>

            <View style={styles.helpItem}>
              <Text style={styles.helpGesture}>🤏</Text>
              <Text style={styles.helpText}>
                {language === 'english'
                  ? 'Pinch to zoom QR code (50% - 200%)'
                  : language === 'thai'
                  ? 'หยิกเพื่อซูมรหัส QR (50% - 200%)'
                  : 'หยิกเพื่อซูมรหัส QR / Pinch to zoom QR code'}
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpGesture}>👆👆</Text>
              <Text style={styles.helpText}>
                {language === 'english'
                  ? 'Double tap to toggle information display'
                  : language === 'thai'
                  ? 'แตะสองครั้งเพื่อแสดง/ซ่อนข้อมูล'
                  : 'แตะสองครั้งเพื่อแสดง/ซ่อนข้อมูล'}
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpGesture}>👆⏰</Text>
              <Text style={styles.helpText}>
                {language === 'english'
                  ? 'Long press QR code to save to album'
                  : language === 'thai'
                  ? 'กดค้างรหัส QR เพื่อบันทึกลงอัลบั้ม'
                  : 'กดค้างรหัส QR เพื่อบันทึกลงอัลบั้ม'}
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpGesture}>⬇️</Text>
              <Text style={styles.helpText}>
                {language === 'english'
                  ? 'Swipe down from top to exit'
                  : language === 'thai'
                  ? 'เลื่อนลงจากด้านบนเพื่อออก'
                  : 'เลื่อนลงจากด้านบนเพื่อออก'}
              </Text>
            </View>

            <TouchableOpacity style={styles.helpCloseButton} onPress={hideHelpHints}>
              <Text style={styles.helpCloseText}>
                {language === 'english'
                  ? 'Got it'
                  : language === 'thai'
                  ? 'เข้าใจแล้ว'
                  : 'เข้าใจแล้ว / Got it'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Dark background for high contrast
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  languageToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 80,
    alignItems: 'center',
  },
  languageToggleText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  languageSubtext: {
    color: colors.white,
    fontSize: 10,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 2,
  },
  brightnessToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brightnessToggleText: {
    fontSize: 18,
  },
  exitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  helpButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
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
    // Enhanced shadow effects for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    // White border effect
    borderWidth: 4,
    borderColor: colors.white,
  },
  qrCodeContainer: {
    // Container for the animated QR code
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: {
    // Large QR code - 50-60% of screen width, optimized for landscape
    width: QR_CODE.getSize(),
    height: QR_CODE.getSize(),
  },
  qrPlaceholder: {
    // Match QR code size for consistency
    width: QR_CODE.getSize(),
    height: QR_CODE.getSize(),
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
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  qrPlaceholderSubtext: {
    color: colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
  },
  entryCardNumber: {
    color: colors.white,
    fontSize: IOV_TYPOGRAPHY.ENTRY_CARD_NUMBER.fontSize, // Extra large font for easy reading
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', // Monospace font
    letterSpacing: IOV_TYPOGRAPHY.ENTRY_CARD_NUMBER.letterSpacing, // Increased letter spacing for clarity
    marginBottom: spacing.sm,
    textAlign: 'center',
    // High contrast with text shadow for better visibility
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  submissionDate: {
    color: colors.white,
    fontSize: 16,
    opacity: 0.8,
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  passportPhotoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  passportPhoto: {
    width: IMAGE_SIZES.PASSPORT_PHOTO.width,
    height: IMAGE_SIZES.PASSPORT_PHOTO.height,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.white,
  },
  infoGroup: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  groupTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  infoValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  passportNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
    fontSize: 20,
  },
  bottomControls: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
    marginBottom: spacing.sm,
  },
  toggleButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  exitHint: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.6,
  },
  zoomIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  zoomText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  helpModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  helpContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    maxWidth: 400,
    width: '100%',
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  helpGesture: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 40,
    textAlign: 'center',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  helpCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  helpCloseText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Authentication styles
  authContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  authContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  authMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  authButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: 25,
    marginBottom: spacing.md,
    minWidth: 200,
  },
  authButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 200,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  authErrorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  // Funds section styles
  fundAmount: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fundItemsContainer: {
    marginTop: spacing.md,
  },
  fundItemsTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  fundItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  fundItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fundItemType: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  fundItemAmounts: {
    alignItems: 'flex-end',
  },
  fundItemAmount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fundItemConvertedAmount: {
    color: colors.white,
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  totalFundsContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  totalFundsLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  totalFundsAmount: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textAlign: 'center',
  },
  fundPhotoContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  fundPhoto: {
    width: 120,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fundPhotoHint: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.6,
    marginTop: spacing.xs,
  },
  phoneNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
    fontSize: 18,
  },
  disclaimer: {
    color: colors.white,
    fontSize: 10,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  // Document photo styles
  documentPhotoContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.md,
    borderRadius: 8,
  },
  documentPhotoLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  documentPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  documentPhotoHint: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.6,
    marginTop: spacing.xs,
  },
});

export default ImmigrationOfficerViewScreen;