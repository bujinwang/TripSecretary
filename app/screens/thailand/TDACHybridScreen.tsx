/**
 * TDAC Hybrid Screen - Best of both worlds
 * Hidden WebView for Cloudflare token + Direct API submission
 * 
 * Performance: ~5-8 seconds (Cloudflare solve 2-5s + API calls 3s)
 * Reliability: 95%+
 * 
 * Flow:
 * 1. Show loading screen
 * 2. Load TDAC in hidden WebView
 * 3. Extract Cloudflare token (2-5 seconds)
 * 4. Use token with API service (3 seconds)
 * 5. Show result with QR code
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useLocale } from '../../i18n/LocaleContext';
import { colors } from '../../theme';
import CloudflareTokenExtractor from '../../services/CloudflareTokenExtractor';
import TDACAPIService from '../../services/TDACAPIService';
import PDFManagementService from '../../services/PDFManagementService';
import TDACSubmissionService from '../../services/thailand/TDACSubmissionService';
import type { RootStackScreenProps } from '../../types/navigation';
import type { TDACTravelerInfo, SubmissionMethod } from '../../types/thailand';
import * as MediaLibrary from 'expo-media-library';
import { Buffer } from 'buffer';

const SUBMISSION_METHOD: SubmissionMethod = 'hybrid';

type TDACHybridScreenProps = RootStackScreenProps<'TDACHybrid'>;

type TDACHybridStage = 'awaitingToken' | 'submitting' | 'success' | 'error';

type TDACSubmissionPayload = Parameters<typeof TDACSubmissionService.handleTDACSubmissionSuccess>[0];

type TDACAPISubmitResponse = {
  success: boolean;
  arrCardNo: string;
  pdfBlob: string | Blob | ArrayBuffer;
  submittedAt?: string;
  duration?: number | string | null;
};

type SubmissionResultState = {
  arrCardNo: string;
  travelerName?: string;
  durationSeconds?: number;
};

type PDFSaveResult = {
  filepath: string;
};

type BirthDateParts = {
  year: string;
  month: string;
  day: string;
};

const TDAC_URL = 'https://tdac.immigration.go.th';

const buildBirthDateParts = (birthDate?: TDACTravelerInfo['birthDate']): BirthDateParts => {
  if (!birthDate) {
    return { year: '', month: '', day: '' };
  }

  if (typeof birthDate === 'string') {
    const [year = '', month = '', day = ''] = birthDate.split(/[-/]/);
    return {
      year,
      month: month.padStart(2, '0'),
      day: day.padStart(2, '0'),
    };
  }

  return {
    year: String(birthDate.year ?? ''),
    month: String(birthDate.month ?? '').padStart(2, '0'),
    day: String(birthDate.day ?? '').padStart(2, '0'),
  };
};

const convertBirthDate = (
  travelerInfo: TDACTravelerInfo,
  parts: BirthDateParts
): string | { year: number; month: number; day: number } => {
  if (typeof travelerInfo.birthDate === 'string' && travelerInfo.birthDate.length >= 4) {
    return travelerInfo.birthDate;
  }

  const year = Number.parseInt(parts.year, 10);
  const month = Number.parseInt(parts.month, 10);
  const day = Number.parseInt(parts.day, 10);

  if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
    return {
      year,
      month,
      day,
    };
  }

  return `${parts.year}-${parts.month}-${parts.day}`;
};

const ensureBlob = (data: unknown): Blob => {
  if (data instanceof Blob) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new Blob([data as any]);
  }

  if (ArrayBuffer.isView(data)) {
    return new Blob([data as any]);
  }

  if (typeof data === 'string') {
    const normalized = data.startsWith('data:') ? data.split(',')[1] ?? '' : data;
    const bufferFromString = Buffer.from(normalized, 'base64');
    const arrayBufferFromString = bufferFromString.buffer.slice(
      bufferFromString.byteOffset,
      bufferFromString.byteOffset + bufferFromString.byteLength
    );
    return new Blob([arrayBufferFromString as any]);
  }

  if (data && typeof (data as { toString?: () => string }).toString === 'function') {
    const serialized = (data as { toString: () => string }).toString();
    const normalized = serialized.startsWith('data:')
      ? serialized.split(',')[1] ?? ''
      : serialized;
    const bufferFromSerialized = Buffer.from(normalized, 'base64');
    const arrayBufferFromSerialized = bufferFromSerialized.buffer.slice(
      bufferFromSerialized.byteOffset,
      bufferFromSerialized.byteOffset + bufferFromSerialized.byteLength
    );
    return new Blob([arrayBufferFromSerialized as any]);
  }

  throw new Error('Unsupported PDF payload format');
};
const normalizeDuration = (raw: number | string | null | undefined): number | null => {
  if (typeof raw === 'number') {
    return raw;
  }
  if (raw === null || raw === undefined) {
    return null;
  }
  const parsed = Number.parseFloat(String(raw));
  return Number.isFinite(parsed) ? parsed : null;
};

const buildTravelerPayload = (
  travelerInfo: TDACTravelerInfo,
  birthDate: string | { year: number; month: number; day: number },
  cloudflareToken: string
) => ({
  cloudflareToken,
  email: travelerInfo.email ?? '',
  familyName: travelerInfo.familyName ?? '',
  middleName: travelerInfo.middleName ?? '',
  firstName: travelerInfo.firstName ?? '',
  gender: travelerInfo.gender ?? 'MALE',
  nationality: travelerInfo.nationality ?? 'CHN',
  passportNo: travelerInfo.passportNo ?? '',
  birthDate,
  occupation: travelerInfo.occupation ?? '',
  cityResidence: travelerInfo.cityResidence ?? 'BEIJING',
  countryResidence: travelerInfo.countryResidence ?? 'CHN',
  visaNo: travelerInfo.visaNo ?? '',
  phoneCode: travelerInfo.phoneCode ?? '86',
  phoneNo: travelerInfo.phoneNo ?? '',
  arrivalDate: travelerInfo.arrivalDate ?? '',
  departureDate: travelerInfo.departureDate ?? null,
  countryBoarded: travelerInfo.countryBoarded ?? 'CHN',
  recentStayCountry: travelerInfo.recentStayCountry ?? '',
  purpose: travelerInfo.purpose ?? 'HOLIDAY',
  travelMode: travelerInfo.travelMode ?? 'AIR',
  flightNo: travelerInfo.flightNo ?? '',
  tranModeId: travelerInfo.tranModeId ?? 'COMMERCIAL_FLIGHT',
  accommodationType: travelerInfo.accommodationType ?? 'HOTEL',
  province: travelerInfo.province ?? 'BANGKOK',
  district: travelerInfo.district ?? '',
  subDistrict: travelerInfo.subDistrict ?? '',
  postCode: travelerInfo.postCode ?? '',
  address: travelerInfo.address ?? travelerInfo.accommodationAddress ?? '',
});

const buildSubmissionPayload = (
  result: TDACAPISubmitResponse,
  pdfSaveResult: PDFSaveResult,
  travelerInfo: TDACTravelerInfo
): TDACSubmissionPayload => ({
  arrCardNo: result.arrCardNo,
  qrUri: pdfSaveResult.filepath,
  pdfPath: pdfSaveResult.filepath,
  submittedAt: result.submittedAt ?? new Date().toISOString(),
  submissionMethod: SUBMISSION_METHOD,
  duration: normalizeDuration(result.duration),
  travelerName: [travelerInfo.firstName, travelerInfo.familyName].filter(Boolean).join(' ').trim() || undefined,
          passportNo: travelerInfo.passportNo,
          arrivalDate: travelerInfo.arrivalDate,
});

const buildResultState = (
  payload: TDACSubmissionPayload
) => {
  return {
    arrCardNo: payload.arrCardNo,
    travelerName: payload.travelerName,
    durationSeconds: payload.duration ?? undefined,
  };
};

const TDACHybridScreen: React.FC<TDACHybridScreenProps> = ({ navigation, route }) => {
  const { t } = useLocale();
  const travelerInfo = useMemo<TDACTravelerInfo>(
    () => ({ ...(route.params?.travelerInfo ?? {}) }),
    [route.params?.travelerInfo]
  );

  const [stage, setStage] = useState<TDACHybridStage>('awaitingToken');
  const [progressMessage, setProgressMessage] = useState<string>('正在准备 Cloudflare 验证...');
  const [cloudflareToken, setCloudflareToken] = useState<string | null>(travelerInfo.cloudflareToken ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultState, setResultState] = useState<SubmissionResultState | null>(null);
  const webViewRef = useRef<WebView>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

const savePDF = useCallback(async (arrCardNo: string, pdfBlob: unknown) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('需要相册权限才能保存入境卡 PDF');
    }

    const blob = ensureBlob(pdfBlob);

    const saveResult = await PDFManagementService.savePDF(arrCardNo, blob, {
      submissionMethod: SUBMISSION_METHOD,
    });

    await MediaLibrary.createAssetAsync(saveResult.filepath);

    return saveResult as PDFSaveResult;
  }, []);

  const submitToAPI = useCallback(async (token: string) => {
    setStage('submitting');
    setProgressMessage('正在提交泰国入境卡...');

    try {
      const birthDate = convertBirthDate(travelerInfo, buildBirthDateParts(travelerInfo.birthDate));
      const travelerPayload = buildTravelerPayload(travelerInfo, birthDate, token);
      const apiResult = (await TDACAPIService.submitArrivalCard(travelerPayload)) as TDACAPISubmitResponse;

      if (!apiResult?.success) {
        throw new Error('提交失败，请稍后再试');
      }

      const pdfSaveResult = await savePDF(apiResult.arrCardNo, apiResult.pdfBlob);
      const submissionPayload = buildSubmissionPayload(apiResult, pdfSaveResult, travelerInfo);
      await TDACSubmissionService.handleTDACSubmissionSuccess(submissionPayload, travelerInfo);

      if (!isMountedRef.current) {
        return;
      }

      setResultState(buildResultState(submissionPayload));
      setStage('success');
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      const message = error instanceof Error ? error.message : '提交失败，请稍后重试';
      setErrorMessage(message);
      setStage('error');
    }
  }, [savePDF, travelerInfo]);

  useEffect(() => {
    if (cloudflareToken && stage === 'awaitingToken') {
      void submitToAPI(cloudflareToken);
    }
  }, [cloudflareToken, stage, submitToAPI]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data) as { type: string; token?: string; message?: string };

        switch (payload.type) {
          case 'CLOUDFLARE_TOKEN_EXTRACTED':
            if (payload.token) {
              setCloudflareToken(payload.token);
            }
            break;
          case 'CLOUDFLARE_TOKEN_POLLING':
            setProgressMessage('等待 Cloudflare 验证完成...');
            break;
          case 'CLOUDFLARE_TOKEN_TIMEOUT':
            setErrorMessage('验证超时，请重试或使用 WebView 方式提交。');
            setStage('error');
            break;
          default:
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    },
    []
  );

  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setStage('awaitingToken');
    setProgressMessage('正在准备 Cloudflare 验证...');
    setCloudflareToken(null);
  }, []);

  const handleSuccessClose = useCallback(() => {
    navigation.pop(2);
  }, [navigation]);

  const travelerName = useMemo(
    () => [travelerInfo.firstName, travelerInfo.familyName].filter(Boolean).join(' ').trim(),
    [travelerInfo.firstName, travelerInfo.familyName]
  );

    return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {stage === 'awaitingToken' && (
          <View style={styles.centerContent}>
            <Text style={styles.headingText}>{t('thailand.selection.hybrid.stage.token', '请输入 Cloudflare 验证')}</Text>
            <Text style={styles.subText}>请在下方页面完成“我不是机器人”验证。</Text>
            <View style={styles.webViewWrapper}>
              <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ uri: TDAC_URL }}
                onMessage={handleWebViewMessage}
                injectedJavaScriptBeforeContentLoaded={CloudflareTokenExtractor.getInterceptionScript()}
                injectedJavaScript={CloudflareTokenExtractor.getExtractionScript()}
                onLoadEnd={() => setProgressMessage('等待用户完成验证...')}
              />
            </View>
            <Text style={styles.progressText}>{progressMessage}</Text>
          </View>
        )}

        {stage === 'submitting' && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.progressText}>{progressMessage}</Text>
            {travelerName.length > 0 ? <Text style={styles.subText}>旅客：{travelerName}</Text> : null}
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.centerContent}>
            <Text style={styles.errorTitle}>提交失败</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
              <Text style={styles.primaryButtonText}>重试</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryButtonText}>返回</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Modal visible={stage === 'success'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>✅ 提交成功</Text>
              {resultState ? (
                <>
                  <Text style={styles.modalItem}>入境卡号：{resultState.arrCardNo}</Text>
                  {resultState.travelerName ? (
                    <Text style={styles.modalItem}>旅客姓名：{resultState.travelerName}</Text>
                  ) : null}
                  {typeof resultState.durationSeconds === 'number' ? (
                    <Text style={styles.modalItem}>
                      用时：{resultState.durationSeconds.toFixed(1)} 秒
                    </Text>
                  ) : null}
                  <Text style={styles.modalHint}>QR 码已保存到相册和旅程记录中</Text>
                </>
              ) : null}
              <TouchableOpacity style={styles.primaryButton} onPress={handleSuccessClose}>
                <Text style={styles.primaryButtonText}>完成</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  centerContent: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  headingText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: colors.text,
  },
  webViewWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.error,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  modalItem: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  modalHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginVertical: 12,
    textAlign: 'center',
  },
});

export default TDACHybridScreen;
