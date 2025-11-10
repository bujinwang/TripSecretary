// TDAC WebView填写助手 - 浮动复制助手
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import BackButton from '../../components/BackButton';
import { useLocale } from '../../i18n/LocaleContext';
import { colors } from '../../theme';
import type { RootStackScreenProps } from '../../types/navigation';
import type { TDACTravelerInfo } from '../../types/thailand';

const TDAC_URL = 'https://tdac.immigration.go.th';

type TDACWebViewScreenProps = RootStackScreenProps<'TDACWebView'>;

type TDACFieldSection = 'personal' | 'trip' | 'accommodation';

type TDACFieldDefinition = {
  id: string;
  section: TDACFieldSection;
  label: string;
  value: string;
  searchTerms: string[];
};

type TDACWebViewStage = 'loading' | 'ready';

const buildAutoFillScript = (fields: TDACFieldDefinition[]): string => {
  const payload = fields
    .filter((field) => field.value.trim().length > 0)
    .map((field) => ({
      value: field.value,
      searchTerms: field.searchTerms,
    }));

  const jsonPayload = JSON.stringify(payload)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  return `
    (function() {
      try {
        const fields = JSON.parse("${jsonPayload}");

        const getCandidateText = (element) => {
          const parts = [
            element.name,
            element.id,
            element.getAttribute('aria-label'),
            element.placeholder,
            element.getAttribute('data-field'),
            element.getAttribute('data-name'),
            element.getAttribute('formcontrolname'),
          ];

          const label = element.closest('label');
          if (label) {
            parts.push(label.innerText);
          }

          const groupLabel = element.closest('mat-form-field, .form-group, .input-group');
          if (groupLabel) {
            parts.push(groupLabel.innerText);
          }

          return parts
            .filter(Boolean)
            .map((text) => String(text).toLowerCase())
            .join(' | ');
        };

        const setValue = (element, value) => {
          const tag = element.tagName.toLowerCase();
          if (tag === 'select') {
            const normalized = value.toLowerCase();
            for (const option of Array.from(element.options)) {
              if (option.value.toLowerCase() === normalized || option.text.toLowerCase() === normalized) {
                option.selected = true;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          } else {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          return false;
        };

        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));

        fields.forEach(({ value, searchTerms }) => {
          const lowerTerms = searchTerms.map((term) => term.toLowerCase());
          for (const element of inputs) {
            const candidateText = getCandidateText(element);
            const hasMatch = lowerTerms.some((term) => candidateText.includes(term));
            if (hasMatch) {
              if (setValue(element, value)) {
                break;
              }
            }
          }
        });
      } catch (error) {
        console.warn('TDAC autofill failed:', error);
      }
    })();
  `;
};

const buildFieldDefinitions = (travelerInfo: TDACTravelerInfo): TDACFieldDefinition[] => {
  const birthDate = typeof travelerInfo.birthDate === 'string' ? travelerInfo.birthDate : undefined;
  const [birthYear = '', birthMonth = '', birthDay = ''] = birthDate ? birthDate.split('-') : ['', '', ''];

  return [
    {
      id: 'familyName',
      section: 'personal',
      label: 'Family Name',
      value: travelerInfo.familyName ?? '',
      searchTerms: ['familyname', 'lastname', 'surname'],
    },
    {
      id: 'givenName',
      section: 'personal',
      label: 'First Name',
      value: travelerInfo.firstName ?? '',
      searchTerms: ['firstname', 'givenname'],
    },
    {
      id: 'middleName',
      section: 'personal',
      label: 'Middle Name',
      value: travelerInfo.middleName ?? '',
      searchTerms: ['middlename', 'secondname'],
    },
    {
      id: 'passportNo',
      section: 'personal',
      label: 'Passport Number',
      value: travelerInfo.passportNo ?? '',
      searchTerms: ['passportnumber', 'passportno'],
    },
    {
      id: 'nationality',
      section: 'personal',
      label: 'Nationality',
      value: travelerInfo.nationalityDesc ?? travelerInfo.nationality ?? '',
      searchTerms: ['nationality', 'citizenship'],
    },
    {
      id: 'birthYear',
      section: 'personal',
      label: 'Birth Year',
      value: birthYear,
      searchTerms: ['birthyear', 'year'],
    },
    {
      id: 'birthMonth',
      section: 'personal',
      label: 'Birth Month',
      value: birthMonth,
      searchTerms: ['birthmonth', 'month'],
    },
    {
      id: 'birthDay',
      section: 'personal',
      label: 'Birth Day',
      value: birthDay,
      searchTerms: ['birthday', 'day'],
    },
    {
      id: 'gender',
      section: 'personal',
      label: 'Gender',
      value: (travelerInfo.gender ?? '').toUpperCase(),
      searchTerms: ['gender', 'sex'],
    },
    {
      id: 'occupation',
      section: 'personal',
      label: 'Occupation',
      value: travelerInfo.occupation ?? '',
      searchTerms: ['occupation', 'job', 'profession'],
    },
    {
      id: 'flightNumber',
      section: 'trip',
      label: 'Flight Number',
      value: travelerInfo.flightNo ?? '',
      searchTerms: ['flightno', 'flightnumber', 'vehicle'],
    },
    {
      id: 'arrivalDate',
      section: 'trip',
      label: 'Arrival Date',
      value: travelerInfo.arrivalDate ?? '',
      searchTerms: ['arrivaldate', 'dateofarrival'],
    },
    {
      id: 'travelPurpose',
      section: 'trip',
      label: 'Purpose of Visit',
      value: travelerInfo.purpose ?? '',
      searchTerms: ['purpose', 'visitpurpose'],
    },
    {
      id: 'countryBoarded',
      section: 'trip',
      label: 'Country Boarded',
      value: travelerInfo.countryBoarded ?? travelerInfo.countryBoardedCode ?? '',
      searchTerms: ['countryboard', 'boardingcountry'],
    },
    {
      id: 'phoneNumber',
      section: 'trip',
      label: 'Phone Number',
      value: travelerInfo.phoneNo ?? travelerInfo.phoneNumber ?? '',
      searchTerms: ['phoneno', 'phonenumber', 'mobile'],
    },
    {
      id: 'accommodationAddress',
      section: 'accommodation',
      label: 'Accommodation Address',
      value: travelerInfo.address ?? travelerInfo.accommodationAddress ?? '',
      searchTerms: ['address', 'accommodation'],
    },
    {
      id: 'province',
      section: 'accommodation',
      label: 'Province',
      value: travelerInfo.province ?? '',
      searchTerms: ['province'],
    },
    {
      id: 'district',
      section: 'accommodation',
      label: 'District',
      value: travelerInfo.district ?? '',
      searchTerms: ['district'],
    },
    {
      id: 'subDistrict',
      section: 'accommodation',
      label: 'Sub-district',
      value: travelerInfo.subDistrict ?? '',
      searchTerms: ['subdistrict', 'sub-district', 'tambon'],
    },
    {
      id: 'postCode',
      section: 'accommodation',
      label: 'Post Code',
      value: travelerInfo.postCode ?? '',
      searchTerms: ['postcode', 'postalcode'],
    },
  ];
};

const TDACWebViewScreen: React.FC<TDACWebViewScreenProps> = ({ navigation, route }) => {
  const { t } = useLocale();
  const travelerInfo = useMemo<TDACTravelerInfo>(
    () => ({ ...(route.params?.travelerInfo ?? {}) }),
    [route.params?.travelerInfo]
  );

  const [stage, setStage] = useState<TDACWebViewStage>('loading');
  const [showHelper, setShowHelper] = useState<boolean>(false);
  const webViewRef = useRef<WebView>(null);

  const fields = useMemo(() => buildFieldDefinitions(travelerInfo), [travelerInfo]);
  const autoFillScript = useMemo(() => buildAutoFillScript(fields), [fields]);

  const handleLoadEnd = useCallback(() => {
    setStage('ready');
    webViewRef.current?.injectJavaScript(autoFillScript);
  }, [autoFillScript]);

  const handleReloadAutofill = useCallback(() => {
    webViewRef.current?.injectJavaScript(autoFillScript);
  }, [autoFillScript]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (payload.type === 'debug_log') {
        // Ignore debug logs from injected scripts
        return;
      }
    } catch {
      // Ignore malformed messages
    }
  }, []);

  const handleCopy = useCallback((text: string) => {
    Clipboard.setString(text);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} label="返回" />
        <Text style={styles.headerTitle}>{t('thailand.selection.webview.title', '手动填写助手')}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ uri: TDAC_URL }}
          onMessage={handleMessage}
          onLoadEnd={handleLoadEnd}
          injectedJavaScript={autoFillScript}
        />

        {stage === 'loading' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>正在加载入境卡页面...</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleReloadAutofill}>
          <Text style={styles.primaryButtonText}>重新自动填充</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowHelper((prev) => !prev)}>
          <Text style={styles.secondaryButtonText}>{showHelper ? '隐藏字段' : '显示字段'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showHelper} animationType="slide" transparent>
        <View style={styles.helperOverlay}>
          <View style={styles.helperContainer}>
            <View style={styles.helperHeader}>
              <Text style={styles.helperTitle}>字段快速复制</Text>
              <TouchableOpacity onPress={() => setShowHelper(false)}>
                <Text style={styles.helperClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.helperContent}>
              {fields.map((field) => (
                <View key={field.id} style={styles.helperField}>
                  <View style={styles.helperFieldHeader}>
                    <Text style={styles.helperFieldLabel}>{field.label}</Text>
                    <Text style={styles.helperFieldSection}>{field.section.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.helperFieldValue}>{field.value || '（空）'}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopy(field.value)}
                    disabled={!field.value}
                  >
                    <Text style={styles.copyButtonText}>{field.value ? '复制' : '无数据'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  helperOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  helperContainer: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  helperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  helperTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  helperClose: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  helperContent: {
    padding: 16,
    gap: 16,
  },
  helperField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  helperFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  helperFieldSection: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  helperFieldValue: {
    fontSize: 14,
    color: colors.text,
  },
  copyButton: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  copyButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TDACWebViewScreen;
