// 入境通 - History Screen
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import { useLocale } from '../i18n/LocaleContext';
import DateFormatter from '../utils/DateFormatter';
import EntryInfoService from '../services/EntryInfoService';
import UserDataService from '../services/data/UserDataService';
import SecureStorageService from '../services/security/SecureStorageService';
import { navigateToCountry } from '../utils/countriesService';
import type { SerializablePassport, TravelInfoData } from '../types/data';
import type { DestinationParam } from '../types/navigation';
import EntryInfo from '../models/EntryInfo';

type HistoryScreenProps = {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
};

type SectionKey = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'earlier';

type EntryHistoryItem = {
  id: string;
  entryInfoId: string;
  flag: string;
  title: string;
  timeLabel: string;
  passportLabel: string;
  destination: DestinationParam & { flag?: string };
  travelInfo: TravelInfoData | Record<string, unknown> | null;
  passport: SerializablePassport | null;
  status?: string | null;
  completionPercent?: number;
  createdAt?: string | null;
  lastUpdatedAt?: string | null;
  userId?: string | null;
};

type HistorySection = {
  id: SectionKey;
  title: string;
  items: EntryHistoryItem[];
};

const SECTION_ORDER: SectionKey[] = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'earlier'];
const FALLBACK_HISTORY_USER_IDS: readonly string[] = ['current_user', 'user_001'];
const ALLOWED_STATUSES = new Set(['left', 'archived', 'expired']);
type EntryInfoInstance = InstanceType<typeof EntryInfo>;

const DESTINATION_FLAG_MAP: Record<string, string> = {
  hk: '🇭🇰',
  th: '🇹🇭',
  tw: '🇹🇼',
  jp: '🇯🇵',
  kr: '🇰🇷',
  sg: '🇸🇬',
  my: '🇲🇾',
  us: '🇺🇸',
  vn: '🇻🇳',
  ca: '🇨🇦',
  ph: '🇵🇭',
  id: '🇮🇩',
  au: '🇦🇺',
};

const getDestinationFlag = (destinationId?: string | null): string => {
  if (!destinationId) {
    return '🌍';
  }
  const normalized = destinationId.toLowerCase();
  return DESTINATION_FLAG_MAP[normalized] ?? '🌍';
};

const getSectionKeyFromDate = (date?: string | null): SectionKey => {
  if (!date) {
    return 'earlier';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'earlier';
  }
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'today';
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays < 7) {
    return 'thisWeek';
  }
  if (diffDays < 30) {
    return 'thisMonth';
  }
  return 'earlier';
};

const formatGeneratedTimeLabel = (
  createdAt: string | null | undefined,
  language: string,
  translate: (key: string, options?: Record<string, unknown>) => string
): string => {
  if (!createdAt) {
    return translate('history.timePrefix', { defaultValue: 'Generated' });
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return `${translate('history.timePrefix', { defaultValue: 'Generated' })} ${createdAt}`;
  }

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  let relativeLabel: string;

  if (diffDays <= 0) {
    relativeLabel = translate('history.sections.today', { defaultValue: 'Today' });
  } else if (diffDays === 1) {
    relativeLabel = translate('history.sections.yesterday', { defaultValue: 'Yesterday' });
  } else {
    relativeLabel = DateFormatter.formatDate(date, language, 'datetime') || date.toLocaleString(language);
    return `${translate('history.timePrefix', { defaultValue: 'Generated' })} ${relativeLabel}`;
  }

  const connector = language.startsWith('en') ? ' at ' : ' ';
  const timePart = DateFormatter.formatDate(date, language, 'time') || date.toLocaleTimeString(language, { hour12: !language.startsWith('zh') });
  const formatted = `${relativeLabel}${connector}${timePart}`;
  return `${translate('history.timePrefix', { defaultValue: 'Generated' })} ${formatted}`;
};

const buildPassportLabel = (
  passport: SerializablePassport | null,
  translate: (key: string, options?: Record<string, unknown>) => string
): string => {
  if (!passport) {
    return translate('home.common.unknown', { defaultValue: 'Unknown' });
  }

  const nationality =
    passport.nationality ||
    (passport as Record<string, string | undefined>).country ||
    (passport as Record<string, string | undefined>).issuingCountry ||
    '';
  const passportNumber =
    passport.passportNumber ||
    (passport as Record<string, string | undefined>).passportNo ||
    (passport as Record<string, string | undefined>).passport_no ||
    '';
  const passportType = translate('home.passport.type', { defaultValue: 'Passport' });

  if (nationality && passportNumber) {
    return `${nationality} ${passportType} ${passportNumber}`;
  }
  if (passportNumber) {
    return `${passportType} ${passportNumber}`;
  }
  if (nationality) {
    return `${nationality} ${passportType}`;
  }
  return translate('home.common.unknown', { defaultValue: 'Unknown' });
};

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const { t, language } = useLocale();
  const [historySections, setHistorySections] = useState<HistorySection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resolveUserIdCandidates = useCallback((): string[] => {
    const activeUserId =
      typeof SecureStorageService.getActiveUserId === 'function'
        ? SecureStorageService.getActiveUserId()
        : null;
    const orderedCandidates = [activeUserId, ...FALLBACK_HISTORY_USER_IDS];
    const deduped: string[] = [];

    orderedCandidates.forEach((candidate) => {
      if (candidate && !deduped.includes(candidate)) {
        deduped.push(candidate);
      }
    });

    return deduped;
  }, []);

  const groupHistoryItems = useCallback(
    (items: EntryHistoryItem[]): HistorySection[] => {
      const groups: Record<SectionKey, EntryHistoryItem[]> = {
        today: [],
        yesterday: [],
        thisWeek: [],
        thisMonth: [],
        earlier: [],
      };

      items.forEach((item) => {
        const sectionKey = getSectionKeyFromDate(item.lastUpdatedAt ?? item.createdAt ?? null);
        groups[sectionKey].push(item);
      });

      return SECTION_ORDER.filter((sectionId) => groups[sectionId].length > 0).map((sectionId) => ({
        id: sectionId,
        title: t(`history.sections.${sectionId}`, {
          defaultValue: sectionId,
        }),
        items: groups[sectionId],
      }));
    },
    [t]
  );

  const loadEntryHistory = useCallback(
    async ({ showLoader = true }: { showLoader?: boolean } = {}) => {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      try {
        const candidateUserIds = resolveUserIdCandidates();
        let historyItems: EntryHistoryItem[] = [];
        let lastError: Error | null = null;

        for (const candidate of candidateUserIds) {
          if (!candidate) {
            continue;
          }

          try {
            await UserDataService.initialize(candidate as any);
            await SecureStorageService.initialize(candidate);
            const entryInfos = (await EntryInfoService.getAllEntryInfos(candidate as any)) as EntryInfoInstance[];
            if (!entryInfos.length) {
              continue;
            }

            const sortedEntries = [...entryInfos].sort((a, b) => {
              const aTime = new Date(a.lastUpdatedAt ?? a.createdAt ?? 0).getTime();
              const bTime = new Date(b.lastUpdatedAt ?? b.createdAt ?? 0).getTime();
              return bTime - aTime;
            });

            const passportCache = new Map<string, SerializablePassport | null>();
            const travelCache = new Map<string, TravelInfoData | null>();

            const resolvePassport = async (passportId?: string | null): Promise<SerializablePassport | null> => {
              if (!passportId) {
                return null;
              }
              if (passportCache.has(passportId)) {
                return passportCache.get(passportId) ?? null;
              }
              try {
                const passportRecord = await UserDataService.getPassportById(passportId);
                const serializable = UserDataService.toSerializablePassport(passportRecord);
                passportCache.set(passportId, serializable);
                return serializable;
              } catch (passportError) {
                console.warn('[HistoryScreen] Failed to load passport', passportId, passportError);
                passportCache.set(passportId, null);
                return null;
              }
            };

            const resolveTravelInfo = async (travelInfoId?: string | null): Promise<TravelInfoData | null> => {
              if (!travelInfoId) {
                return null;
              }
              if (travelCache.has(travelInfoId)) {
                return travelCache.get(travelInfoId) ?? null;
              }
              try {
                const travelRecord = await SecureStorageService.getTravelInfoById(travelInfoId);
                const normalized = travelRecord ? { ...travelRecord } : null;
                travelCache.set(travelInfoId, normalized);
                return normalized as TravelInfoData | null;
              } catch (travelError) {
                console.warn('[HistoryScreen] Failed to load travel info', travelInfoId, travelError);
                travelCache.set(travelInfoId, null);
                return null;
              }
            };

            const cardPromises = sortedEntries
              .filter(
                (entryInfo) =>
                  entryInfo && ALLOWED_STATUSES.has((entryInfo.status ?? '').toLowerCase())
              )
              .map(async (entryInfo) => {
                const destinationId = entryInfo.destinationId ?? undefined;
                const destinationName = destinationId
                  ? t(`home.destinationNames.${destinationId}`, {
                      defaultValue: destinationId,
                    })
                  : t('home.common.unknown', { defaultValue: 'Unknown' });
                const flag = getDestinationFlag(destinationId);
                const passport = await resolvePassport(entryInfo.passportId);
                const travelInfo =
                  entryInfo.travel ??
                  (entryInfo.travelInfoId ? await resolveTravelInfo(entryInfo.travelInfoId) : null);

                const timestamp = entryInfo.lastUpdatedAt ?? entryInfo.createdAt ?? null;
                return {
                  id: entryInfo.id,
                  entryInfoId: entryInfo.id,
                  flag,
                  title: t('home.history.cardTitle', {
                    country: destinationName,
                    defaultValue: `${destinationName} Entry Pack`,
                  }),
                  timeLabel: formatGeneratedTimeLabel(timestamp, language, t),
                  passportLabel: buildPassportLabel(passport, t),
                  destination: {
                    id: destinationId,
                    name: destinationName,
                    flag,
                  },
                  travelInfo: travelInfo ?? null,
                  passport,
                  status: entryInfo.status ?? null,
                  completionPercent:
                    typeof entryInfo.getTotalCompletionPercent === 'function'
                      ? entryInfo.getTotalCompletionPercent()
                      : undefined,
                  createdAt: entryInfo.createdAt ?? null,
                  lastUpdatedAt: entryInfo.lastUpdatedAt ?? null,
                  userId: entryInfo.userId ?? null,
                } as EntryHistoryItem;
              });

            const candidateItems = (await Promise.all(cardPromises)).filter(
              (item): item is EntryHistoryItem => Boolean(item?.entryInfoId)
            );

            historyItems = candidateItems;
            if (historyItems.length > 0) {
              break;
            }
          } catch (candidateError) {
            lastError =
              candidateError instanceof Error
                ? candidateError
                : new Error(String(candidateError));
          }
        }

        if (!historyItems.length && lastError) {
          throw lastError;
        }

        setHistorySections(groupHistoryItems(historyItems));
      } catch (loadError) {
        console.error('[HistoryScreen] Failed to load snapshots:', loadError);
        setHistorySections([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('history.errorMessage', { defaultValue: 'Unable to load history' })
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [groupHistoryItems, language, resolveUserIdCandidates, t]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntryHistory({ showLoader: false });
    setRefreshing(false);
  }, [loadEntryHistory]);

  useFocusEffect(
    useCallback(() => {
      loadEntryHistory();
    }, [loadEntryHistory])
  );

  const handleViewItem = useCallback(
    (item: EntryHistoryItem) => {
      const normalizedStatus = (item.status ?? '').toLowerCase();
      const destinationId = item.destination?.id;

      if (normalizedStatus === 'left' && destinationId) {
        navigateToCountry(navigation, destinationId, 'entryFlow', {
          destination: item.destination,
          passport: item.passport,
          travelInfo: item.travelInfo,
          entryInfoId: item.entryInfoId,
          entryInfo: {
            id: item.entryInfoId,
            status: item.status,
            completionPercent: item.completionPercent,
            createdAt: item.createdAt,
            lastUpdatedAt: item.lastUpdatedAt,
            userId: item.userId,
            destinationId,
          },
          userId: item.userId ?? undefined,
          fromHistory: true,
        });
        return;
      }

      navigation.navigate('Result', {
        passport: item.passport,
        destination: item.destination,
        travelInfo: item.travelInfo,
        generationId: item.entryInfoId,
        fromHistory: true,
        userId: item.userId ?? undefined,
      });
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('history.headerTitle')}</Text>
        <TouchableOpacity>
          <Text style={styles.filterButton}>{t('history.filterButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('history.loading', { defaultValue: 'Loading history…' })}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {historySections.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyCard}
                  onPress={() => handleViewItem(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View style={styles.cardInfo}>
                    <Text style={styles.destination}>{item.title}</Text>
                    <Text style={styles.time}>{item.timeLabel}</Text>
                    <Text style={styles.passport}>
                      {t('history.passportPrefix')} {item.passportLabel}
                    </Text>
                  </View>
                  <View style={styles.cardAction}>
                    <Text style={styles.actionText}>{t('common.view')}</Text>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Empty State (if no history) */}
          {historySections.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>{t('history.empty.title')}</Text>
              <Text style={styles.emptyText}>{t('history.empty.subtitle')}</Text>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          )}
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  filterButton: {
    ...typography.body1,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flag: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  destination: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  passport: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  cardAction: {
    alignItems: 'center',
  },
  actionText: {
    ...typography.body1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  arrow: {
    ...typography.h3,
    color: colors.textDisabled,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

export default HistoryScreen;
