import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import type { ShareContent } from 'react-native';
import EntryInfoService from '../../services/EntryInfoService';
import UserDataService from '../../services/data/UserDataService';
import BiometricAuthService from '../../services/security/BiometricAuthService';
import EntryPackStatusBanner from '../../components/EntryPackStatusBanner';
import TDACInfoCard from '../../components/TDACInfoCard';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { RootStackScreenProps } from '../../types/navigation';
import type { EntryInfoStatus } from '../../models/EntryInfo';
import type { SerializablePassport, AllUserData } from '../../types/data';

const USER_FALLBACK_ID = 'user_001';

export type SubmissionMethod = 'api' | 'webview' | 'hybrid' | 'unknown';

type DigitalArrivalCardView = {
  id?: string;
  entryInfoId?: string;
  cardType: string;
  arrCardNo?: string | null;
  qrUri?: string | null;
  pdfUrl?: string | null;
  submittedAt?: string | null;
  submissionMethod: SubmissionMethod;
  status?: string | null;
};

type EntryInfoDocumentView = {
  pdfDocument?: string | null;
  qrCodeImage?: string | null;
};

type PassportSnapshot = {
  fullName?: string | null;
  passportNumber?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
  [key: string]: unknown;
};

type PersonalInfoSnapshot = {
  occupation?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  [key: string]: unknown;
};

type TravelSnapshot = {
  arrivalDate?: string | null;
  arrivalFlightNumber?: string | null;
  travelPurpose?: string | null;
  accommodation?: string | null;
  flightNumber?: string | null;
  [key: string]: unknown;
};

type FundSnapshot = {
  id?: string | null;
  type?: string | null;
  currency?: string | null;
  amount?: number | null;
  [key: string]: unknown;
};

type EntryInfoSnapshot = {
  id: string;
  userId: string | null;
  destinationId: string | null;
  destinationName?: string | null;
  status?: EntryInfoStatus | null;
  lastUpdatedAt?: string | null;
  displayStatus?: unknown;
  documents?: EntryInfoDocumentView;
};

type EntryInfoDetailView = {
  entryInfo: EntryInfoSnapshot;
  passport: PassportSnapshot | null;
  personalInfo: PersonalInfoSnapshot | null;
  travel: TravelSnapshot | null;
  funds: FundSnapshot[];
  digitalCard: DigitalArrivalCardView | null;
  documents: EntryInfoDocumentView;
};

type EntryInfoDetailScreenProps = RootStackScreenProps<'EntryInfoDetail'>;

const toNullableString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
};

const toPlainObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown> & { toJSON?: () => unknown };
  if (typeof record.toJSON === 'function') {
    const jsonValue = record.toJSON();
    if (jsonValue && typeof jsonValue === 'object') {
      return jsonValue as Record<string, unknown>;
    }
  }
  return record;
};

const pickString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    if (key in record) {
      const value = toNullableString(record[key]);
      if (value) {
        return value;
      }
    }
  }
  return null;
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

const normalizeDigitalArrivalCard = (value: unknown): DigitalArrivalCardView | null => {
  const record = toPlainObject(value);
  if (!record) {
    return null;
  }
  const cardType = pickString(record, ['cardType', 'card_type']) ?? 'TDAC';
  return {
    id: pickString(record, ['id']),
    entryInfoId: pickString(record, ['entryInfoId', 'entry_info_id']),
    cardType,
    arrCardNo: pickString(record, ['arrCardNo', 'arr_card_no']),
    qrUri: pickString(record, ['qrUri', 'qr_uri']),
    pdfUrl: pickString(record, ['pdfUrl', 'pdf_url']),
    submittedAt: pickString(record, ['submittedAt', 'submitted_at']),
    submissionMethod: normalizeSubmissionMethod(record.submissionMethod ?? record.submission_method),
    status: pickString(record, ['status']),
  };
};

const normalizeDocuments = (value: unknown): EntryInfoDocumentView => {
  const initial: EntryInfoDocumentView = {
    pdfDocument: null,
    qrCodeImage: null,
  };

  const assignFromRecord = (record: Record<string, unknown>): void => {
    initial.pdfDocument = initial.pdfDocument ?? pickString(record, ['pdfDocument', 'pdf_document', 'pdfUrl', 'pdf_url']);
    initial.qrCodeImage = initial.qrCodeImage ?? pickString(record, ['qrCodeImage', 'qr_code_image', 'qrUri', 'qr_uri']);
  };

  if (Array.isArray(value)) {
    value.forEach((item) => {
      const record = toPlainObject(item);
      if (record) {
        assignFromRecord(record);
      }
    });
    return initial;
  }

  const record = toPlainObject(value);
  if (record) {
    assignFromRecord(record);
  }
  return initial;
};

const toPassportSnapshot = (value: unknown): PassportSnapshot | null => {
  const record = toPlainObject(value);
  if (!record) {
    return null;
  }
  return {
    fullName: pickString(record, ['fullName', 'name', 'full_name']),
    passportNumber: pickString(record, ['passportNumber', 'passport_no', 'number']),
    nationality: pickString(record, ['nationality', 'nationalityCode']),
    dateOfBirth: pickString(record, ['dateOfBirth', 'dob', 'birthDate', 'birth_date']),
  };
};

const toPersonalInfoSnapshot = (value: unknown): PersonalInfoSnapshot | null => {
  const record = toPlainObject(value);
  if (!record) {
    return null;
  }
  return {
    occupation: pickString(record, ['occupation', 'jobTitle']),
    phoneNumber: pickString(record, ['phoneNumber', 'phone', 'mobile', 'phone_number']),
    email: pickString(record, ['email']),
  };
};

const toTravelSnapshot = (value: unknown): TravelSnapshot | null => {
  const record = toPlainObject(value);
  if (!record) {
    return null;
  }
  return {
    arrivalDate: pickString(record, ['arrivalDate', 'arrival_date']),
    arrivalFlightNumber: pickString(record, ['arrivalFlightNumber', 'arrival_flight_number']),
    travelPurpose: pickString(record, ['travelPurpose', 'purpose']),
    accommodation: pickString(record, ['accommodation', 'hotelName', 'hotel']),
    flightNumber: pickString(record, ['flightNumber', 'flight_number']),
  };
};

const normalizeFunds = (value: unknown): FundSnapshot[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): FundSnapshot | null => {
      const record = toPlainObject(item);
      if (!record) {
        return null;
      }
      let amountValue: number | null = null;
      if (typeof record.amount === 'number' && Number.isFinite(record.amount)) {
        amountValue = record.amount;
      } else if (typeof record.amount === 'string') {
        const parsed = Number.parseFloat(record.amount);
        if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
          amountValue = parsed;
        }
      } else {
        const amountString = pickString(record, ['amount']);
        if (amountString) {
          const parsed = Number.parseFloat(amountString);
          if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
            amountValue = parsed;
          }
        }
      }
      return {
        id: pickString(record, ['id']),
        type: pickString(record, ['type', 'fundType']),
        currency: pickString(record, ['currency']),
        amount: amountValue,
      };
    })
    .filter((item): item is FundSnapshot => item !== null);
};

const buildEntryInfoSnapshot = (entryInfo: Record<string, unknown>): EntryInfoSnapshot => {
  const id = pickString(entryInfo, ['id']);
  return {
    id: id ?? `entry_${Date.now()}`,
    userId: pickString(entryInfo, ['userId', 'user_id']),
    destinationId: pickString(entryInfo, ['destinationId', 'destination_id']),
    destinationName: pickString(entryInfo, ['destinationName', 'destination_name']),
    status: (entryInfo.status as EntryInfoStatus | undefined) ?? null,
    lastUpdatedAt: pickString(entryInfo, ['lastUpdatedAt', 'last_updated_at']),
    displayStatus: entryInfo.displayStatus ?? entryInfo.display_status ?? null,
  };
};

const deriveEntryPackStatus = (
  status: EntryInfoStatus | null | undefined,
  digitalCard: DigitalArrivalCardView | null
):
  | 'submitted'
  | 'superseded'
  | 'expired'
  | 'archived'
  | 'completed'
  | 'cancelled'
  | 'in_progress' => {
  if (!status) {
    return digitalCard ? 'submitted' : 'in_progress';
  }
  switch (status) {
    case 'archived':
      return 'archived';
    case 'expired':
      return 'expired';
    case 'superseded':
      return 'superseded';
    case 'submitted':
      return 'submitted';
    case 'ready':
    case 'incomplete':
      return digitalCard ? 'submitted' : 'in_progress';
    default:
      return 'in_progress';
  }
};

const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return '未知时间';
  }

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const formatSubmissionMethod = (method: SubmissionMethod | null | undefined): string => {
  switch (method) {
    case 'api':
      return 'API自动提交';
    case 'webview':
      return 'WebView填表';
    case 'hybrid':
      return '混合模式';
    default:
      return '未知方式';
  }
};

const buildShareText = (view: EntryInfoDetailView): string => {
  const lines: string[] = ['🇹🇭 泰国入境信息', '='.repeat(20), ''];

  if (view.digitalCard) {
    lines.push('📋 入境卡信息:');
    lines.push(`入境卡号: ${view.digitalCard.arrCardNo || '未知'}`);
    lines.push(`提交时间: ${formatDateTime(view.digitalCard.submittedAt)}`);
    lines.push(`提交方式: ${formatSubmissionMethod(view.digitalCard.submissionMethod)}`);
    lines.push('');
  }

  if (view.passport) {
    lines.push('🛂 护照信息:');
    lines.push(`姓名: ${view.passport.fullName || '未填写'}`);
    lines.push(`护照号: ${view.passport.passportNumber || '未填写'}`);
    lines.push(`国籍: ${view.passport.nationality || '未填写'}`);
    lines.push(`出生日期: ${view.passport.dateOfBirth || '未填写'}`);
    lines.push('');
  }

  if (view.personalInfo) {
    lines.push('👤 个人信息:');
    lines.push(`职业: ${view.personalInfo.occupation || '未填写'}`);
    lines.push(`电话: ${view.personalInfo.phoneNumber || '未填写'}`);
    lines.push(`邮箱: ${view.personalInfo.email || '未填写'}`);
    lines.push('');
  }

  if (view.travel) {
    lines.push('✈️ 行程信息:');
    lines.push(`目的地: ${view.entryInfo.destinationName || view.entryInfo.destinationId || '泰国'}`);
    lines.push(`入境日期: ${view.travel.arrivalDate || '未填写'}`);
    lines.push(`航班号: ${view.travel.arrivalFlightNumber || view.travel.flightNumber || '未填写'}`);
    lines.push(`旅行目的: ${view.travel.travelPurpose || '未填写'}`);
    lines.push(`住宿: ${view.travel.accommodation || '未填写'}`);
    lines.push('');
  }

  if (view.funds.length > 0) {
    lines.push('💰 资金证明:');
    view.funds.forEach((fund, index) => {
      lines.push(`${index + 1}. ${fund.type || '未知类型'}: ${fund.currency ?? ''} ${fund.amount ?? '0'}`);
    });
    lines.push('');
  }

  lines.push('📱 由出境通App生成');
  return lines.join('\n');
};

const snapshotToSerializablePassport = (
  snapshot: PassportSnapshot | null,
  userId: string | null
): SerializablePassport | null => {
  if (!snapshot) {
    return null;
  }

  const resolvedUserId = userId ?? USER_FALLBACK_ID;

  return {
    userId: resolvedUserId,
    id: undefined,
    passportNumber: snapshot.passportNumber ?? undefined,
    fullName: snapshot.fullName ?? undefined,
    nationality: snapshot.nationality ?? undefined,
    dateOfBirth: snapshot.dateOfBirth ?? undefined,
  };
};

const EntryInfoDetailScreen: React.FC<EntryInfoDetailScreenProps> = ({ route, navigation }) => {
  const { entryInfoId } = route.params ?? {};

  const [viewModel, setViewModel] = useState<EntryInfoDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticationRequired, setAuthenticationRequired] = useState(false);

  const getUserFriendlyError = useCallback((err: unknown): string => {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('Network')) {
      return '网络连接失败，请检查网络设置后重试';
    }
    if (message.includes('Permission')) {
      return '权限不足，请检查应用权限设置';
    }
    if (message.includes('Storage')) {
      return '存储空间不足，请清理设备存储后重试';
    }
    if (message.includes('Authentication')) {
      return '身份验证失败，请重新验证';
    }
    if (message.includes('不存在') || message.includes('已被删除')) {
      return message;
    }
    return `加载失败: ${message}`;
  }, []);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      if (!entryInfoId) {
        throw new Error('缺少入境信息ID');
      }

      const authResult = await BiometricAuthService.authenticateForEntryPackView(entryInfoId);
      if (!authResult.success && !authResult.skipped) {
        setAuthenticationRequired(true);
        setIsAuthenticated(false);
        setError(authResult.error || '查看入境信息需要身份验证');
        return;
      }

      setIsAuthenticated(true);
      setAuthenticationRequired(false);

      const rawEntryInfo = await EntryInfoService.getEntryInfoById(entryInfoId);
      if (!rawEntryInfo) {
        throw new Error('入境信息数据不存在或已被删除');
      }

      const entryInfoRecord = toPlainObject(rawEntryInfo) ?? {};
      const entrySnapshot = buildEntryInfoSnapshot(entryInfoRecord);
      const userId = entrySnapshot.userId ?? USER_FALLBACK_ID;

      await UserDataService.initialize(userId);

      let allUserData: AllUserData | null = null;
      try {
        allUserData = await UserDataService.getAllUserData(userId);
      } catch (getAllErr) {
        console.warn('无法获取完整用户数据:', getAllErr);
      }

      const passportModel = allUserData?.passport ?? (entryInfoRecord.passport as unknown);
      const passportSnapshot = toPassportSnapshot(
        UserDataService.toSerializablePassport(passportModel ? (passportModel as SerializablePassport) : null)
      );

      const personalInfoSnapshot = toPersonalInfoSnapshot(allUserData?.personalInfo ?? entryInfoRecord.personalInfo);

      const travelFromData =
        allUserData?.travel ?? entryInfoRecord.travel ??
        (await UserDataService.getTravelInfo(userId, entrySnapshot.destinationId ?? null).catch(() => null));
      const travelSnapshot = toTravelSnapshot(travelFromData);

      const fundsFromData =
        allUserData?.funds ?? entryInfoRecord.funds ?? (await UserDataService.getFundItems(userId).catch(() => []));
      const fundsSnapshot = normalizeFunds(fundsFromData);

      const digitalCardRaw =
        entryInfoRecord.digitalArrivalCard ??
        (await EntryInfoService.getLatestSuccessfulDigitalArrivalCard(entryInfoId, 'TDAC').catch(() => null));
      const digitalCardSnapshot = normalizeDigitalArrivalCard(digitalCardRaw);

      const documentsSnapshot = normalizeDocuments(entryInfoRecord.documents);

      setViewModel({
        entryInfo: { ...entrySnapshot, documents: documentsSnapshot },
        passport: passportSnapshot,
        personalInfo: personalInfoSnapshot,
        travel: travelSnapshot,
        funds: fundsSnapshot,
        digitalCard: digitalCardSnapshot,
        documents: documentsSnapshot,
      });
    } catch (err) {
      console.error('Error loading entry info detail:', err);
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [entryInfoId, getUserFriendlyError]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handleResubmit = useCallback(() => {
    if (!viewModel) {
      return;
    }

    Alert.alert('重新提交入境卡', '修改信息后需要重新提交入境卡，确认要修改吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: () => {
          navigation.navigate('ThailandTravelInfo', {
            entryInfoId: viewModel.entryInfo.id,
            destinationId: viewModel.entryInfo.destinationId ?? undefined,
            resubmissionMode: true,
          });
        },
      },
    ]);
  }, [navigation, viewModel]);

  const handleArchive = useCallback(() => {
    Alert.alert('归档入境信息', '确认要将此入境信息移至历史记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '归档',
        onPress: () => navigation.goBack(),
      },
    ]);
  }, [navigation]);

  const handleDownloadPDF = useCallback(async () => {
    if (!viewModel?.documents.pdfDocument) {
      Alert.alert('提示', 'PDF文件不可用');
      return;
    }

    const pdfPath = viewModel.documents.pdfDocument;

    try {
      const pdfInfo = await FileSystem.getInfoAsync(pdfPath);
      if (!pdfInfo.exists) {
        Alert.alert('错误', 'PDF文件不存在，可能已被删除');
        return;
      }

      Alert.alert('PDF操作', '请选择要执行的操作', [
        { text: '取消', style: 'cancel' },
        {
          text: '分享PDF',
          onPress: async () => {
            try {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(pdfPath, {
                  mimeType: 'application/pdf',
                  dialogTitle: '分享泰国入境卡PDF',
                });
              } else {
                const sharePayload: ShareContent = {
                  title: '泰国入境卡PDF',
                  message: `入境卡号: ${viewModel.digitalCard?.arrCardNo || '未知'}`,
                  url: Platform.OS === 'ios' ? pdfPath : `file://${pdfPath}`,
                };
                await Share.share(sharePayload);
              }
            } catch (shareErr) {
              console.error('Error sharing PDF:', shareErr);
              Alert.alert('错误', '分享PDF失败');
            }
          },
        },
        {
          text: '保存到相册',
          onPress: async () => {
            try {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('权限不足', '需要相册权限才能保存PDF');
                return;
              }

              const asset = await MediaLibrary.createAssetAsync(pdfPath);
              await MediaLibrary.createAlbumAsync('入境卡', asset, false);
              Alert.alert('成功', 'PDF已保存到相册');
            } catch (saveErr) {
              console.error('Error saving PDF to album:', saveErr);
              Alert.alert('错误', '保存PDF到相册失败');
            }
          },
        },
      ]);
    } catch (err) {
      console.error('Error handling PDF:', err);
      Alert.alert('错误', 'PDF操作失败');
    }
  }, [viewModel]);

  const shareQRCode = useCallback(async () => {
    if (!viewModel?.documents.qrCodeImage) {
      Alert.alert('提示', 'QR码不可用');
      return;
    }

    const shareContent: ShareContent = Platform.OS === 'ios'
      ? {
          title: '泰国入境卡QR码',
          message: `入境卡号: ${viewModel.digitalCard?.arrCardNo || '未知'}\n提交时间: ${formatDateTime(viewModel.digitalCard?.submittedAt)}`,
          url: viewModel.documents.qrCodeImage,
        }
      : {
          title: '泰国入境卡QR码',
          message: `入境卡号: ${viewModel.digitalCard?.arrCardNo || '未知'}\n提交时间: ${formatDateTime(viewModel.digitalCard?.submittedAt)}`,
        };

    await Share.share(shareContent);
  }, [viewModel]);

  const shareEntryInfo = useCallback(async () => {
    if (!viewModel) {
      return;
    }
    const textContent = buildShareText(viewModel);
    await Share.share({
      title: '泰国入境信息',
      message: textContent,
    });
  }, [viewModel]);

  const shareCompletePackage = useCallback(async () => {
    if (!viewModel) {
      return;
    }

    const textContent = buildShareText(viewModel);
    const fileName = `thailand_entry_info_${viewModel.digitalCard?.arrCardNo || Date.now()}.txt`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, textContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/plain',
        dialogTitle: '分享完整入境包',
      });
    } else {
      await Share.share({
        title: '泰国入境包',
        message: textContent,
      });
    }
  }, [viewModel]);

  const checkSharingAvailability = useCallback(async () => {
    try {
      const expoSharing = await Sharing.isAvailableAsync();
      return { expoSharing, nativeShare: true };
    } catch (err) {
      console.warn('Error checking sharing availability:', err);
      return { expoSharing: false, nativeShare: true };
    }
  }, []);

  const handleShareWithFallback = useCallback(
    async (shareFn: () => Promise<void>, fallbackMessage: string) => {
      try {
        const availability = await checkSharingAvailability();
        if (!availability.expoSharing && !availability.nativeShare) {
          Alert.alert('分享不可用', '您的设备不支持分享功能');
          return;
        }

        await shareFn();
      } catch (err) {
        console.error('Error in share operation:', err);
        Alert.alert('分享失败', fallbackMessage, [
          { text: '取消', style: 'cancel' },
          {
            text: '复制到剪贴板',
            onPress: () => {
              if (!viewModel) {
                return;
              }
              const textContent = buildShareText(viewModel);
              Alert.alert('提示', `请手动复制以下信息：\n\n${textContent}`);
            },
          },
        ]);
      }
    },
    [checkSharingAvailability, viewModel]
  );

  const handleViewImmigrationGuide = useCallback(() => {
    if (!viewModel?.digitalCard) {
      Alert.alert('提示', '请先完成数字入境卡提交');
      return;
    }

    navigation.navigate('ThailandInteractiveImmigrationGuide', {
      entryInfoId: viewModel.entryInfo.id,
      destinationId: viewModel.entryInfo.destinationId ?? undefined,
      cardType: viewModel.digitalCard.cardType,
    });
  }, [navigation, viewModel]);

  const handleShowToOfficer = useCallback(async () => {
    if (!viewModel?.digitalCard) {
      Alert.alert('提示', '请先完成数字入境卡提交');
      return;
    }

    try {
      const userId = viewModel.entryInfo.userId ?? USER_FALLBACK_ID;
      await UserDataService.initialize(userId);

      const passportModel = await UserDataService.getPassport(userId).catch(() => null);
      const passportData =
        UserDataService.toSerializablePassport(passportModel) ??
        snapshotToSerializablePassport(viewModel.passport, viewModel.entryInfo.userId);

      const entryPackForPresentation = viewModel.digitalCard
        ? {
            id: viewModel.entryInfo.id,
            cardType: viewModel.digitalCard.cardType,
            qrCodeUri: viewModel.documents.qrCodeImage,
            arrCardNo: viewModel.digitalCard.arrCardNo,
            submittedAt: viewModel.digitalCard.submittedAt,
            submissionMethod: viewModel.digitalCard.submissionMethod ?? 'unknown',
            status: deriveEntryPackStatus(viewModel.entryInfo.status ?? null, viewModel.digitalCard),
          }
        : null;

      navigation.navigate('ImmigrationOfficerView', {
        entryPack: entryPackForPresentation,
        entryInfo: viewModel.entryInfo,
        passportData,
        travelData: viewModel.travel,
        fundData: viewModel.funds,
        cardType: viewModel.digitalCard.cardType,
      });
    } catch (err) {
      console.error('Error loading data for presentation mode:', err);
      Alert.alert('错误', '加载数据失败，请稍后重试');
    }
  }, [navigation, viewModel]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>入境信息详情</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (authenticationRequired && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>入境信息详情</Text>
        </View>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>身份验证</Text>
          <Text style={styles.authMessage}>查看入境包详情需要验证您的身份</Text>
          <Button
            title="验证身份"
            onPress={() => void loadData()}
            style={styles.authButton}
          />
          <Button
            title="取消"
            onPress={() => navigation.goBack()}
            style={[styles.authButton, styles.cancelButton]}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>入境信息详情</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="重试" onPress={() => void loadData()} style={styles.retryButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (!viewModel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>入境信息详情</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>未找到入境包数据</Text>
        </View>
      </SafeAreaView>
    );
  }

  const entryPackStatus = deriveEntryPackStatus(
    viewModel.entryInfo.status ?? null,
    viewModel.digitalCard
  );
  const isReadOnly = entryPackStatus === 'archived' || entryPackStatus === 'expired';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>{isReadOnly ? '历史记录详情' : '入境信息详情'}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {isReadOnly ? (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>这是历史记录的快照，无法修改</Text>
          </View>
        ) : null}

        <EntryPackStatusBanner
          status={entryPackStatus}
          submissionDate={viewModel.digitalCard?.submittedAt}
          arrivalDate={viewModel.travel?.arrivalDate}
          isReadOnly={isReadOnly}
        />

        {viewModel.digitalCard ? (
          <>
            <View style={styles.primaryCardNotice}>
              <Text style={styles.primaryCardNoticeText}>
                🎫 这是您的泰国数字入境卡，请在入境时出示QR码
              </Text>
            </View>
            <TDACInfoCard tdacSubmission={viewModel.digitalCard} isReadOnly={isReadOnly} />
          </>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 详细信息</Text>
          <Text style={styles.sectionSubtitle}>提交时的完整旅行信息记录</Text>

          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>护照信息</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>姓名:</Text>
              <Text style={styles.dataValue}>{viewModel.passport?.fullName || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>护照号:</Text>
              <Text style={styles.dataValue}>{viewModel.passport?.passportNumber || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>国籍:</Text>
              <Text style={styles.dataValue}>{viewModel.passport?.nationality || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>出生日期:</Text>
              <Text style={styles.dataValue}>{viewModel.passport?.dateOfBirth || '未填写'}</Text>
            </View>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>个人信息</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>职业:</Text>
              <Text style={styles.dataValue}>{viewModel.personalInfo?.occupation || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>电话:</Text>
              <Text style={styles.dataValue}>{viewModel.personalInfo?.phoneNumber || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>邮箱:</Text>
              <Text style={styles.dataValue}>{viewModel.personalInfo?.email || '未填写'}</Text>
            </View>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>旅行信息</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>入境日期:</Text>
              <Text style={styles.dataValue}>{viewModel.travel?.arrivalDate || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>航班号:</Text>
              <Text style={styles.dataValue}>
                {viewModel.travel?.arrivalFlightNumber || viewModel.travel?.flightNumber || '未填写'}
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>旅行目的:</Text>
              <Text style={styles.dataValue}>{viewModel.travel?.travelPurpose || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>住宿:</Text>
              <Text style={styles.dataValue}>{viewModel.travel?.accommodation || '未填写'}</Text>
            </View>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>资金证明</Text>
            {viewModel.funds.length > 0 ? (
              viewModel.funds.map((fund, index) => (
                <View key={`${fund.id ?? index}`} style={styles.fundItem}>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>类型:</Text>
                    <Text style={styles.dataValue}>{fund.type || '未知'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>金额:</Text>
                    <Text style={styles.dataValue}>
                      {fund.currency ?? ''} {fund.amount ?? '0'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.dataValue}>未添加资金证明</Text>
            )}
          </View>
        </View>

        <View style={styles.actionSection}>
          {viewModel.digitalCard ? (
            <Button
              title="向海关展示"
              onPress={() => void handleShowToOfficer()}
              style={[styles.actionButton, styles.presentationButton]}
            />
          ) : null}

          {!isReadOnly && viewModel.digitalCard ? (
            <Button
              title="开始入境指引"
              onPress={handleViewImmigrationGuide}
              style={[styles.actionButton, styles.primaryButton]}
            />
          ) : null}

          {viewModel.documents.pdfDocument ? (
            <Button
              title="下载PDF"
              onPress={() => void handleDownloadPDF()}
              style={[styles.actionButton, styles.secondaryButton]}
            />
          ) : null}

          {!isReadOnly ? (
            <>
              <Button
                title="重新提交"
                onPress={handleResubmit}
                style={[styles.actionButton, styles.warningButton]}
              />
              <Button
                title="归档"
                onPress={handleArchive}
                style={[styles.actionButton, styles.secondaryButton]}
              />
            </>
          ) : null}

          <Button
            title="分享给旅伴"
            onPress={() =>
              handleShareWithFallback(
                () => shareEntryInfo(),
                '分享入境信息失败，请检查网络连接或稍后重试'
              )
            }
            style={[styles.actionButton, styles.secondaryButton]}
          />

          <Button
            title="分享QR码"
            onPress={() =>
              handleShareWithFallback(
                () => shareQRCode(),
                '分享QR码失败，请检查网络连接或稍后重试'
              )
            }
            style={[styles.actionButton, styles.secondaryButton]}
          />

          <Button
            title="分享完整包"
            onPress={() =>
              handleShareWithFallback(
                () => shareCompletePackage(),
                '分享完整包失败，请检查网络连接或稍后重试'
              )
            }
            style={[styles.actionButton, styles.secondaryButton]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    marginLeft: spacing.sm,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    minWidth: 140,
  },
  readOnlyBanner: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 8,
  },
  readOnlyText: {
    ...typography.body,
    color: colors.surface,
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryCardNotice: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  primaryCardNoticeText: {
    ...typography.body,
    color: '#1565C0',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  dataCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dataCardTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dataLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  dataValue: {
    ...typography.body,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  fundItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  actionSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  presentationButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningButton: {
    backgroundColor: colors.warning,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  authTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  authMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  authButton: {
    minWidth: 200,
    marginBottom: spacing.md,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
  },
});

export default EntryInfoDetailScreen;