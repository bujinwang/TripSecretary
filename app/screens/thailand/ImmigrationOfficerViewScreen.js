// 入境通 - Immigration Officer View Screen (Presentation Mode)
// Full-screen presentation mode optimized for showing to immigration officers
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  PanResponder,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { 
  PinchGestureHandler, 
  TapGestureHandler, 
  LongPressGestureHandler,
  State 
} from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedGestureHandler,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import BiometricAuthService from '../../services/security/BiometricAuthService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImmigrationOfficerViewScreen = ({ navigation, route }) => {
  const { t } = useLocale();
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [qrZoom, setQrZoom] = useState(1);
  const [brightness, setBrightness] = useState(null);
  
  // Animated values for pinch-to-zoom
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const [originalBrightness, setOriginalBrightness] = useState(null);
  const [originalOrientation, setOriginalOrientation] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticationRequired, setAuthenticationRequired] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [language, setLanguage] = useState('bilingual'); // 'bilingual', 'thai', 'english'
  const [brightnessBoost, setBrightnessBoost] = useState(true);
  const [showHelpHints, setShowHelpHints] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Gesture handler refs
  const doubleTapRef = useRef(null);
  const longPressRef = useRef(null);
  const threeFingerTapRef = useRef(null);

  // Entry pack data from route params
  const entryPackId = route.params?.entryPackId;
  const fromImmigrationGuide = route.params?.fromImmigrationGuide;
  const [entryPack, setEntryPack] = useState(route.params?.entryPack);
  const [passportData, setPassportData] = useState(route.params?.passportData);
  const [travelData, setTravelData] = useState(route.params?.travelData);
  const [fundData, setFundData] = useState(route.params?.fundData);
  const [dataLoading, setDataLoading] = useState(false);

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
          setDataLoading(true);
          try {
            const EntryInfoService = require('../../services/EntryInfoService').default;
            const UserDataService = require('../../services/data/UserDataService').default;

            const loadedEntryInfo = await EntryInfoService.getEntryInfoById(entryPackId);
            const loadedPassportData = await UserDataService.getPassportInfo();
            const loadedTravelData = await UserDataService.getTravelInfo();
            const loadedFundData = await UserDataService.getFundItems();

            // Convert entry info to entry pack format for compatibility
            const loadedEntryPack = loadedEntryInfo ? {
              id: loadedEntryInfo.id,
              qrCodeUri: loadedEntryInfo.documents?.find(d => d.cardType === 'TDAC')?.qrUri,
              arrCardNo: loadedEntryInfo.documents?.find(d => d.cardType === 'TDAC')?.arrCardNo,
              submittedAt: loadedEntryInfo.documents?.find(d => d.cardType === 'TDAC')?.submittedAt,
              status: loadedEntryInfo.displayStatus?.tdacSubmitted ? 'submitted' : 'in_progress'
            } : null;
            
            setEntryPack(loadedEntryPack);
            setPassportData(loadedPassportData);
            setTravelData(loadedTravelData);
            setFundData(loadedFundData);
          } catch (error) {
            console.error('Error loading data for immigration officer view:', error);
            setAuthError('Failed to load entry pack data');
            return;
          } finally {
            setDataLoading(false);
          }
        }
        
        // Store original orientation
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        setOriginalOrientation(currentOrientation);
        
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
      } catch (error) {
        console.warn('Failed to set up presentation mode:', error);
      }
    };

    setupPresentationMode();
    
    return () => {
      // Restore original settings on exit
      const cleanup = async () => {
        try {
          // Restore original orientation
          if (originalOrientation) {
            await ScreenOrientation.unlockAsync();
          }
          
          // Restore status bar
          StatusBar.setHidden(false);
          
          // Deactivate keep awake
          deactivateKeepAwake('ImmigrationOfficerView');
          
          // Restore original brightness
          if (originalBrightness !== null) {
            await Brightness.setBrightnessAsync(originalBrightness);
          }
        } catch (error) {
          console.warn('Failed to cleanup presentation mode:', error);
        }
      };
      
      cleanup();
    };
  }, [originalOrientation]);

  // Pinch gesture handler for QR code zoom
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      const newScale = Math.max(0.5, Math.min(2.0, context.startScale * event.scale));
      scale.value = newScale;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    },
    onEnd: () => {
      // Snap back to bounds if needed
      if (scale.value < 0.8) {
        scale.value = withSpring(1);
      } else if (scale.value > 1.8) {
        scale.value = withSpring(2);
      }
      
      // Update the zoom state for other components
      runOnJS(setQrZoom)(scale.value);
    },
  });

  // Animated style for QR code
  const animatedQRStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
      ],
    };
  });

  // Pan responder for swipe-down to exit
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Handle swipe down from top for exit
      return gestureState.dy > 10 && evt.nativeEvent.pageY < 100;
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Handle swipe down from top to exit
      if (gestureState.dy > 50 && evt.nativeEvent.pageY < 100) {
        handleExitPresentation();
      }
    },
  });

  const handleExitPresentation = async () => {
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
  };

  const toggleLanguage = () => {
    const languages = ['bilingual', 'thai', 'english'];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
    
    // Provide haptic feedback for language switching
    if (Platform.OS === 'ios') {
      // Could add haptic feedback here if react-native-haptic-feedback is available
    }
  };

  const toggleBrightness = async () => {
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
  };

  const handleLongPressQR = async () => {
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
  };

  const handleDoubleTap = () => {
    toggleInfoDisplay();
  };

  const handleThreeFingerTap = () => {
    setShowHelpHints(true);
  };

  const hideHelpHints = () => {
    setShowHelpHints(false);
  };

  const toggleInfoDisplay = () => {
    setShowMoreInfo(!showMoreInfo);
  };

  const formatEntryCardNumber = (cardNumber) => {
    if (!cardNumber) return 'XXXX-XXXX-XXXX';
    
    // Remove any existing separators and format with dashes
    const cleanNumber = cardNumber.replace(/[^0-9A-Z]/g, '');
    
    // Format as XXXX-XXXX-XXXX pattern
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
        // Thai Buddhist calendar (add 543 years)
        const buddhistYear = date.getFullYear() + 543;
        const thaiMonths = [
          'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${buddhistYear}`;
      } else {
        // Western calendar
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

  const renderQRSection = () => (
    <View style={styles.qrSection}>
      <Text style={styles.sectionTitle}>
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.tdacQRCode') : 
         language === 'thai' ? 'รหัส QR TDAC' : 
         `รหัส QR TDAC / ${t('progressiveEntryFlow.immigrationOfficer.presentation.tdacQRCode')}`}
      </Text>
      
      <View style={styles.qrContainer}>
        {entryPack?.qrCodeUri ? (
          <LongPressGestureHandler
            ref={longPressRef}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.ACTIVE) {
                handleLongPressQR();
              }
            }}
            minDurationMs={800}
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
                <Animated.View style={[styles.qrCodeContainer, animatedQRStyle]}>
                  <Image 
                    source={{ uri: entryPack.qrCodeUri }}
                    style={styles.qrCode}
                    resizeMode="contain"
                    // High resolution settings for better scanning
                    resizeMethod="scale"
                    fadeDuration={0}
                    // Ensure crisp rendering
                    blurRadius={0}
                  />
                </Animated.View>
              </PinchGestureHandler>
            </TapGestureHandler>
          </LongPressGestureHandler>
        ) : (
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>
              {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodePlaceholder') : 
               language === 'thai' ? 'รหัส QR' : 
               `รหัส QR / ${t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodePlaceholder')}`}
            </Text>
            <Text style={styles.qrPlaceholderSubtext}>
              {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.qrCodeSubtext') : 
               language === 'thai' ? 'จะปรากฏหลังส่ง TDAC' : 
               'จะปรากฏหลังส่ง TDAC'}
            </Text>
          </View>
        )}
        
        {/* Zoom indicator */}
        {qrZoom !== 1 && (
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>
              {Math.round(qrZoom * 100)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.entryCardNumber}>
        {formatEntryCardNumber(entryPack?.arrCardNo || 'XXXXXXXXXXXX')}
      </Text>
      
      <Text style={styles.submissionDate}>
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.submitted') : 
         language === 'thai' ? 'ส่งเมื่อ' : 
         `ส่งเมื่อ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.submitted')}`}: {formatDateForDisplay(entryPack?.submittedAt)}
      </Text>
    </View>
  );

  const renderPassportSection = () => (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.passportInformation') : 
         language === 'thai' ? 'ข้อมูลหนังสือเดินทาง' : 
         `ข้อมูลหนังสือเดินทาง / ${t('progressiveEntryFlow.immigrationOfficer.presentation.passportInformation')}`}
      </Text>
      
      {/* Passport photo if available */}
      {passportData?.photoUri && (
        <View style={styles.passportPhotoContainer}>
          <Image 
            source={{ uri: passportData.photoUri }}
            style={styles.passportPhoto}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>
          {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.fullName') : 
           language === 'thai' ? 'ชื่อเต็ม' : 
           `ชื่อเต็ม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.fullName')}`}:
        </Text>
        <Text style={styles.infoValue}>
          {passportData?.fullName || passportData?.firstName + ' ' + passportData?.lastName || 'N/A'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>
          {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.passportNumber') : 
           language === 'thai' ? 'หมายเลขหนังสือเดินทาง' : 
           `หมายเลขหนังสือเดินทาง / ${t('progressiveEntryFlow.immigrationOfficer.presentation.passportNumber')}`}:
        </Text>
        <Text style={[styles.infoValue, styles.passportNumber]}>
          {passportData?.passportNumber || 'N/A'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>
          {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.nationality') : 
           language === 'thai' ? 'สัญชาติ' : 
           `สัญชาติ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.nationality')}`}:
        </Text>
        <Text style={styles.infoValue}>
          {passportData?.nationality || 'N/A'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>
          {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.dateOfBirth') : 
           language === 'thai' ? 'วันเกิด' : 
           `วันเกิด / ${t('progressiveEntryFlow.immigrationOfficer.presentation.dateOfBirth')}`}:
        </Text>
        <Text style={styles.infoValue}>
          {formatDateForDisplay(passportData?.dateOfBirth)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>
          {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.gender') : 
           language === 'thai' ? 'เพศ' : 
           `เพศ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.gender')}`}:
        </Text>
        <Text style={styles.infoValue}>
          {passportData?.gender || 'N/A'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>
          {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.passportExpiry') : 
           language === 'thai' ? 'วันหมดอายุหนังสือเดินทาง' : 
           `วันหมดอายุหนังสือเดินทาง / ${t('progressiveEntryFlow.immigrationOfficer.presentation.passportExpiry')}`}:
        </Text>
        <Text style={styles.infoValue}>
          {formatDateForDisplay(passportData?.expiryDate)}
        </Text>
      </View>
    </View>
  );

  const renderFundsSection = () => (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.fundsInformation') : 
         language === 'thai' ? 'ข้อมูลเงินทุน' : 
         `ข้อมูลเงินทุน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.fundsInformation')}`}
      </Text>
      
      {/* Total Funds Summary */}
      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          💰 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.totalFunds') : 
               language === 'thai' ? 'เงินทุนรวม' : 
               `เงินทุนรวม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.totalFunds')}`}
        </Text>
        
        {fundData && fundData.length > 0 ? (
          <>
            {/* Calculate and display total by currency */}
            {(() => {
              const totals = {};
              fundData.forEach(fund => {
                const currency = fund.currency || 'THB';
                const amount = parseFloat(fund.amount) || 0;
                totals[currency] = (totals[currency] || 0) + amount;
              });
              
              return Object.entries(totals).map(([currency, total]) => (
                <View key={currency} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.totalAmount') : 
                     language === 'thai' ? 'จำนวนรวม' : 
                     `จำนวนรวม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.totalAmount')}`} ({currency}):
                  </Text>
                  <Text style={[styles.infoValue, styles.fundAmount]}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(total)}
                  </Text>
                </View>
              ));
            })()}
            
            {/* Individual Fund Items */}
            <View style={styles.fundItemsContainer}>
              <Text style={styles.fundItemsTitle}>
                {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.fundItems') : 
                 language === 'thai' ? 'รายการเงินทุน' : 
                 `รายการเงินทุน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.fundItems')}`}:
              </Text>
              
              {fundData.map((fund, index) => (
                <View key={index} style={styles.fundItem}>
                  <View style={styles.fundItemHeader}>
                    <Text style={styles.fundItemType}>
                      {fund.type || 'Cash'}
                    </Text>
                    <Text style={styles.fundItemAmount}>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: fund.currency || 'THB',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(parseFloat(fund.amount) || 0)}
                    </Text>
                  </View>
                  
                  {fund.photoUri && (
                    <TouchableOpacity 
                      style={styles.fundPhotoContainer}
                      onPress={() => {
                        // Could implement photo enlargement modal here
                        Alert.alert(
                          language === 'english' ? 'Fund Proof Photo' : 
                          language === 'thai' ? 'รูปหลักฐานเงินทุน' : 
                          'รูปหลักฐานเงินทุน / Fund Proof Photo',
                          language === 'english' ? 'Tap to view larger image' : 
                          language === 'thai' ? 'แตะเพื่อดูภาพขนาดใหญ่' : 
                          'แตะเพื่อดูภาพขนาดใหญ่ / Tap to view larger image'
                        );
                      }}
                    >
                      <Image 
                        source={{ uri: fund.photoUri }}
                        style={styles.fundPhoto}
                        resizeMode="cover"
                      />
                      <Text style={styles.fundPhotoHint}>
                        {language === 'english' ? 'Tap to enlarge' : 
                         language === 'thai' ? 'แตะเพื่อขยาย' : 
                         'แตะเพื่อขยาย'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {language === 'english' ? 'No fund information available' : 
               language === 'thai' ? 'ไม่มีข้อมูลเงินทุน' : 
               'ไม่มีข้อมูลเงินทุน / No fund information available'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderTravelSection = () => (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.travelInformation') : 
         language === 'thai' ? 'ข้อมูลการเดินทาง' : 
         `ข้อมูลการเดินทาง / ${t('progressiveEntryFlow.immigrationOfficer.presentation.travelInformation')}`}
      </Text>
      
      {/* Flight Information Group */}
      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          ✈️ {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.flightDetails') :
               language === 'thai' ? 'รายละเอียดเที่ยวบิน' :
               `รายละเอียดเที่ยวบิน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.flightDetails')}`}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalFlight') :
             language === 'thai' ? 'เที่ยวบินมา' :
             `เที่ยวบินมา / ${t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalFlight')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {travelData?.arrivalFlight || travelData?.flightNumber || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalDateTime') :
             language === 'thai' ? 'วันและเวลาที่มาถึง' :
             `วันและเวลาที่มาถึง / ${t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalDateTime')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {formatDateForDisplay(travelData?.arrivalDate)}
          </Text>
        </View>

        {travelData?.departureDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.departureDate') :
               language === 'thai' ? 'วันที่เดินทางกลับ' :
               `วันที่เดินทางกลับ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.departureDate')}`}:
            </Text>
            <Text style={styles.infoValue}>
              {formatDateForDisplay(travelData.departureDate)}
            </Text>
          </View>
        )}

        {/* Flight Ticket Photo */}
        {travelData?.arrivalFlightTicketPhotoUri && (
          <TouchableOpacity
            style={styles.documentPhotoContainer}
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
          >
            <Text style={styles.documentPhotoLabel}>
              🎫 {language === 'english' ? 'Flight Ticket' :
                  language === 'thai' ? 'ตั๋วเครื่องบิน' :
                  'ตั๋วเครื่องบิน / Flight Ticket'}
            </Text>
            <Image
              source={{ uri: travelData.arrivalFlightTicketPhotoUri }}
              style={styles.documentPhoto}
              resizeMode="contain"
            />
            <Text style={styles.documentPhotoHint}>
              {language === 'english' ? 'Tap to enlarge' :
               language === 'thai' ? 'แตะเพื่อขยาย' :
               'แตะเพื่อขยาย'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Accommodation Information Group */}
      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          🏨 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.accommodation') :
               language === 'thai' ? 'ที่พัก' :
               `ที่พัก / ${t('progressiveEntryFlow.immigrationOfficer.presentation.accommodation')}`}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.hotelName') :
             language === 'thai' ? 'ชื่อโรงแรม' :
             `ชื่อโรงแรม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.hotelName')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {travelData?.accommodationName || travelData?.hotelName || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.address') :
             language === 'thai' ? 'ที่อยู่' :
             `ที่อยู่ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.address')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {travelData?.accommodationAddress || travelData?.address || 'N/A'}
          </Text>
        </View>

        {travelData?.accommodationPhone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.phone') :
               language === 'thai' ? 'โทรศัพท์' :
               `โทรศัพท์ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.phone')}`}:
            </Text>
            <Text style={styles.infoValue}>
              {travelData.accommodationPhone}
            </Text>
          </View>
        )}

        {/* Hotel Booking Photo */}
        {travelData?.hotelBookingPhotoUri && (
          <TouchableOpacity
            style={styles.documentPhotoContainer}
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
          >
            <Text style={styles.documentPhotoLabel}>
              🏨 {language === 'english' ? 'Hotel Booking' :
                  language === 'thai' ? 'การจองโรงแรม' :
                  'การจองโรงแรม / Hotel Booking'}
            </Text>
            <Image
              source={{ uri: travelData.hotelBookingPhotoUri }}
              style={styles.documentPhoto}
              resizeMode="contain"
            />
            <Text style={styles.documentPhotoHint}>
              {language === 'english' ? 'Tap to enlarge' :
               language === 'thai' ? 'แตะเพื่อขยาย' :
               'แตะเพื่อขยาย'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Visit Purpose Group */}
      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          🎯 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.visitPurpose') : 
               language === 'thai' ? 'จุดประสงค์การเยือน' : 
               `จุดประสงค์การเยือน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.visitPurpose')}`}
        </Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.purpose') : 
             language === 'thai' ? 'จุดประสงค์' : 
             `จุดประสงค์ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.purpose')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {travelData?.purposeOfVisit || travelData?.purpose || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.durationOfStay') : 
             language === 'thai' ? 'ระยะเวลาพำนัก' : 
             `ระยะเวลาพำนัก / ${t('progressiveEntryFlow.immigrationOfficer.presentation.durationOfStay')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {travelData?.durationOfStay || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderContactSection = () => (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.contactInformation') : 
         language === 'thai' ? 'ข้อมูลติดต่อ' : 
         `ข้อมูลติดต่อ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.contactInformation')}`}
      </Text>
      
      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          📞 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.contactDetails') : 
               language === 'thai' ? 'รายละเอียดการติดต่อ' : 
               `รายละเอียดการติดต่อ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.contactDetails')}`}
        </Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.phoneInThailand') : 
             language === 'thai' ? 'โทรศัพท์ในประเทศไทย' : 
             `โทรศัพท์ในประเทศไทย / ${t('progressiveEntryFlow.immigrationOfficer.presentation.phoneInThailand')}`}:
          </Text>
          <Text style={[styles.infoValue, styles.phoneNumber]}>
            {passportData?.phoneNumber || travelData?.phoneNumber || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.email') : 
             language === 'thai' ? 'อีเมล' : 
             `อีเมล / ${t('progressiveEntryFlow.immigrationOfficer.presentation.email')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {passportData?.email || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.thaiAddress') : 
             language === 'thai' ? 'ที่อยู่ในประเทศไทย' : 
             `ที่อยู่ในประเทศไทย / ${t('progressiveEntryFlow.immigrationOfficer.presentation.thaiAddress')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {travelData?.accommodationAddress || travelData?.address || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
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
    <TapGestureHandler
      ref={threeFingerTapRef}
      onHandlerStateChange={({ nativeEvent }) => {
        if (nativeEvent.state === State.ACTIVE) {
          handleThreeFingerTap();
        }
      }}
      numberOfTaps={1}
      numberOfPointers={3}
    >
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Header with controls */}
      <View style={styles.header}>
        <View style={styles.leftControls}>
          <TouchableOpacity 
            style={styles.languageToggle}
            onPress={toggleLanguage}
          >
            <Text style={styles.languageToggleText}>
              {language === 'bilingual' ? 'ไทย/EN' : 
               language === 'thai' ? 'ไทย' : 'EN'}
            </Text>
            <Text style={styles.languageSubtext}>
              {language === 'bilingual' ? 'Bilingual' : 
               language === 'thai' ? 'Thai Only' : 'English Only'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.brightnessToggle, { opacity: brightnessBoost ? 1 : 0.6 }]}
            onPress={toggleBrightness}
          >
            <Text style={styles.brightnessToggleText}>☀️</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.exitButton}
          onPress={handleExitPresentation}
        >
          <Text style={styles.exitButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code Section - Always visible */}
        {renderQRSection()}

        {/* Additional Information - Toggleable */}
        {showMoreInfo && (
          <>
            {renderPassportSection()}
            {renderFundsSection()}
            {renderTravelSection()}
            {renderContactSection()}
          </>
        )}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={toggleInfoDisplay}
        >
          <Text style={styles.toggleButtonText}>
            {showMoreInfo ? 
              (language === 'english' ? 'Show Less Info' : 
               language === 'thai' ? 'แสดงน้อยลง' : 
               'แสดงน้อยลง / Show Less Info') :
              (language === 'english' ? 'Show More Info' : 
               language === 'thai' ? 'แสดงเพิ่มเติม' : 
               'แสดงเพิ่มเติม / Show More Info')
            }
          </Text>
        </TouchableOpacity>

        <Text style={styles.exitHint}>
          {language === 'english' ? 'Swipe down to exit' : 
           language === 'thai' ? 'เลื่อนลงเพื่อออก' : 
           'เลื่อนลงเพื่อออก / Swipe down to exit'}
        </Text>
        
        <Text style={styles.disclaimer}>
          {language === 'english' ? 'This is a traveler-prepared document. Please verify with official systems.' : 
           language === 'thai' ? 'นี่คือเอกสารที่นักเดินทางเตรียมไว้ กรุณาตรวจสอบกับระบบทางการ' : 
           'นี่คือเอกสารที่นักเดินทางเตรียมไว้ / This is a traveler-prepared document'}
        </Text>
      </View>

      {/* Help Hints Modal */}
      {showHelpHints && (
        <View style={styles.helpModal}>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>
              {language === 'english' ? 'Gesture Help' : 
               language === 'thai' ? 'คำแนะนำการใช้งาน' : 
               'คำแนะนำการใช้งาน / Gesture Help'}
            </Text>
            
            <View style={styles.helpItem}>
              <Text style={styles.helpGesture}>🤏</Text>
              <Text style={styles.helpText}>
                {language === 'english' ? 'Pinch to zoom QR code (50% - 200%)' : 
                 language === 'thai' ? 'หยิกเพื่อซูมรหัส QR (50% - 200%)' : 
                 'หยิกเพื่อซูมรหัส QR / Pinch to zoom QR code'}
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpGesture}>👆👆</Text>
              <Text style={styles.helpText}>
                {language === 'english' ? 'Double tap to toggle information display' : 
                 language === 'thai' ? 'แตะสองครั้งเพื่อแสดง/ซ่อนข้อมูล' : 
                 'แตะสองครั้งเพื่อแสดง/ซ่อนข้อมูล'}
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpGesture}>👆⏰</Text>
              <Text style={styles.helpText}>
                {language === 'english' ? 'Long press QR code to save to album' : 
                 language === 'thai' ? 'กดค้างรหัส QR เพื่อบันทึกลงอัลบั้ม' : 
                 'กดค้างรหัส QR เพื่อบันทึกลงอัลบั้ม'}
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpGesture}>⬇️</Text>
              <Text style={styles.helpText}>
                {language === 'english' ? 'Swipe down from top to exit' : 
                 language === 'thai' ? 'เลื่อนลงจากด้านบนเพื่อออก' : 
                 'เลื่อนลงจากด้านบนเพื่อออก'}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.helpCloseButton}
              onPress={hideHelpHints}
            >
              <Text style={styles.helpCloseText}>
                {language === 'english' ? 'Got it' : 
                 language === 'thai' ? 'เข้าใจแล้ว' : 
                 'เข้าใจแล้ว / Got it'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  </TapGestureHandler>
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
    width: Math.min(screenHeight * 0.5, screenWidth * 0.4, 400),
    height: Math.min(screenHeight * 0.5, screenWidth * 0.4, 400),
  },
  qrPlaceholder: {
    // Match QR code size for consistency
    width: Math.min(screenHeight * 0.5, screenWidth * 0.4, 400),
    height: Math.min(screenHeight * 0.5, screenWidth * 0.4, 400),
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
    fontSize: 40, // Extra large font for easy reading
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', // Monospace font
    letterSpacing: 3, // Increased letter spacing for clarity
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
    width: 120,
    height: 150,
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
  fundItemAmount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
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