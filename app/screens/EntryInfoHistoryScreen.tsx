import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  type AlertButton,
  type ListRenderItemInfo,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import { colors, spacing, borderRadius, typography } from '../theme';
import EntryInfoService from '../services/EntryInfoService';
import DateFormatter from '../utils/DateFormatter';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import LazyLoadingHelper from '../utils/LazyLoadingHelper';
import type { RootStackScreenProps } from '../types/navigation';
import EntryInfo from '../models/EntryInfo';
import UserDataService from '../services/data/UserDataService';
import { useLocale } from '../i18n/LocaleContext';
import SecureStorageService from '../services/security/SecureStorageService';

type EntryInfoInstance = InstanceType<typeof EntryInfo>;

type FilterKey = 'all' | 'completed' | 'cancelled' | 'expired';

type HistoryItem = {
  id: string;
  destination?: string | null;
  destinationId?: string | null;
  status?: string | null;
  arrivalDate?: string | null;
  submittedAt?: string | null;
  createdAt?: string | null;
  lastUpdatedAt?: string | null;
  travel?: { arrivalDate?: string | null } | null;
  completionPercent?: number;
  leftAt?: string | null;
  archivedAt?: string | null;
  [key: string]: unknown;
};

type FlattenedHistoryItem =
  | { type: 'header'; id: string; title: string }
  | ({ type: 'item' } & HistoryItem);

type EntryInfoHistoryScreenProps = RootStackScreenProps<'EntryInfoHistory'>;

const DESTINATION_NAME_MAP = {
  thailand: '泰国',
  japan: '日本',
  singapore: '新加坡',
  malaysia: '马来西亚',
  taiwan: '台湾',
  hongkong: '香港',
  korea: '韩国',
  usa: '美国',
} as const;

const DESTINATION_FLAG_MAP = {
  thailand: '🇹🇭',
  japan: '🇯🇵',
  singapore: '🇸🇬',
  malaysia: '🇲🇾',
  taiwan: '🇹🇼',
  hongkong: '🇭🇰',
  korea: '🇰🇷',
  usa: '🇺🇸',
} as const;

const getDestinationName = (destinationId?: string | null): string => {
  if (!destinationId) {
    return '未知目的地';
  }
  return DESTINATION_NAME_MAP[destinationId as keyof typeof DESTINATION_NAME_MAP] ?? destinationId;
};

const getDestinationFlag = (destinationId?: string | null): string => {
  if (!destinationId) {
    return '🌍';
  }
  return DESTINATION_FLAG_MAP[destinationId as keyof typeof DESTINATION_FLAG_MAP] ?? '🌍';
};

const getStatusColor = (status?: string | null): string => {
  switch (status) {
    case 'completed':
      return colors.success;
    case 'cancelled':
      return colors.textSecondary;
    case 'expired':
      return colors.warning;
    default:
      return colors.textSecondary;
  }
};

const getStatusLabel = (status?: string | null): string => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'cancelled':
      return '已取消';
    case 'expired':
      return '已过期';
    default:
      return status ?? '未知状态';
  }
};

const formatDateDisplay = (date?: string | null, locale?: string): string => {
  if (!date) {
    return '未填写';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return DateFormatter.formatDate(parsed, locale ?? 'zh-CN');
};

const getTimeGroup = (date: string | Date | null | undefined): string => {
  if (!date) {
    return '更早';
  }
  const now = new Date();
  const itemDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(itemDate.getTime())) {
    return '更早';
  }
  const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  }
  if (diffDays === 1) {
    return '昨天';
  }
  if (diffDays <= 7) {
    return '本周';
  }
  if (diffDays <= 30) {
    return '本月';
  }
  return '更早';
};

const groupItemsByTime = (items: HistoryItem[]): Record<string, HistoryItem[]> => {
  const groups: Record<string, HistoryItem[]> = {};
  items.forEach((item) => {
    const group = getTimeGroup(item.createdAt ?? item.arrivalDate ?? item.lastUpdatedAt);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
  });
  return groups;
};

const FALLBACK_HISTORY_USER_IDS: readonly string[] = ['current_user', 'user_001'];
type EntryInfoHistoryRouteParams = {
  userId?: string;
} | undefined;

const EntryInfoHistoryScreen: React.FC<EntryInfoHistoryScreenProps> = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [leftEntries, setLeftEntries] = useState<HistoryItem[]>([]);
  const [archivedEntries, setArchivedEntries] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showLeftSection, setShowLeftSection] = useState<boolean>(false);
  const [showArchivedSection, setShowArchivedSection] = useState<boolean>(false);
  const [leftSectionToggled, setLeftSectionToggled] = useState<boolean>(false);
  const [archivedSectionToggled, setArchivedSectionToggled] = useState<boolean>(false);
  const routeUserId = (route?.params as EntryInfoHistoryRouteParams)?.userId;

  const resolveUserIdCandidates = useCallback((): string[] => {
    const activeUserId =
      typeof SecureStorageService.getActiveUserId === 'function'
        ? SecureStorageService.getActiveUserId()
        : null;

    const orderedCandidates = [routeUserId, activeUserId, ...FALLBACK_HISTORY_USER_IDS];
    const dedupedCandidates: string[] = [];

    orderedCandidates.forEach((candidate) => {
      if (typeof candidate !== 'string' || candidate.trim().length === 0) {
        return;
      }
      if (!dedupedCandidates.includes(candidate)) {
        dedupedCandidates.push(candidate);
      }
    });

    return dedupedCandidates.length > 0 ? dedupedCandidates : ['user_001'];
  }, [routeUserId]);

  const applyFiltersAndSearch = useCallback(
    (items: HistoryItem[], filter: FilterKey, query: string) => {
      let filtered = items;

      if (filter !== 'all') {
        filtered = filtered.filter((item) => item.status === filter);
      }

      if (query.trim()) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter((item) => {
          const destinationText = `${item.destination ?? item.destinationId ?? ''}`.toLowerCase();
          const arrivalText = formatDateDisplay(item.arrivalDate, language).toLowerCase();
          return destinationText.includes(lowerQuery) || arrivalText.includes(lowerQuery);
        });
      }

      setFilteredItems(filtered);
    },
    [language],
  );

  const filterOptions: ReadonlyArray<{ key: FilterKey; label: string; count: number }> = [
    { key: 'all', label: '全部', count: 0 },
    { key: 'completed', label: '已完成', count: 0 },
    { key: 'cancelled', label: '已取消', count: 0 },
    { key: 'expired', label: '已过期', count: 0 },
  ];

  const loadHistoryData = useCallback(async (): Promise<void> => {
    const operationId = PerformanceMonitor.startTiming('loadHistoryData', {
      selectedFilter,
      searchQuery: searchQuery.length,
    });

    try {
      setLoading(true);
      const seenEntryIds = new Set<string>();
      const normalizedItems: HistoryItem[] = [];
      const candidateUserIds = resolveUserIdCandidates();
      let loadedUserId: string | null = null;

      for (const candidateUserId of candidateUserIds) {
        if (!candidateUserId) {
          continue;
        }
        try {
          await UserDataService.initialize(candidateUserId as any);
          const entryInfos = await EntryInfoService.getAllEntryInfos(candidateUserId as any);

          entryInfos.forEach((entryInfo: EntryInfoInstance) => {
            if (seenEntryIds.has(entryInfo.id)) {
              return;
            }

            const destinationId = entryInfo.destinationId ?? null;
            const travelData =
              entryInfo.travel && typeof entryInfo.travel === 'object'
                ? (entryInfo.travel as { arrivalDate?: string | null })
                : null;
            const documents =
              entryInfo.documents && typeof entryInfo.documents === 'object'
                ? (entryInfo.documents as { submittedAt?: string | null })
                : null;
            const completionPercent =
              typeof entryInfo.getTotalCompletionPercent === 'function'
                ? entryInfo.getTotalCompletionPercent()
                : 0;
            const status = entryInfo.status ?? null;

            const baseItem: HistoryItem = {
              id: entryInfo.id,
              destinationId,
              destination: destinationId ? getDestinationName(destinationId) : null,
              status,
              arrivalDate: travelData?.arrivalDate ?? null,
              submittedAt: documents?.submittedAt ?? null,
              createdAt: entryInfo.createdAt ?? entryInfo.lastUpdatedAt ?? null,
              lastUpdatedAt: entryInfo.lastUpdatedAt ?? null,
              travel: travelData,
              completionPercent,
            };

            if (status === 'left') {
              baseItem.leftAt = entryInfo.lastUpdatedAt ?? null;
            } else if (status === 'archived') {
              baseItem.archivedAt = entryInfo.lastUpdatedAt ?? null;
            }

            normalizedItems.push(baseItem);
            seenEntryIds.add(entryInfo.id);
          });
          loadedUserId = candidateUserId;
          break;
        } catch (candidateError) {
          console.warn('[EntryInfoHistoryScreen] Failed to load entry infos for user', candidateUserId, candidateError);
        }
      }

      console.log('[EntryInfoHistoryScreen] normalized items', normalizedItems.map(item => ({ id: item.id, destinationId: item.destinationId, status: item.status })));

      const leftItems = normalizedItems.filter((item) => item.status === 'left');
      const archivedItems = normalizedItems.filter((item) => item.status === 'archived');
      const remainingItems = normalizedItems.filter(
        (item) => item.status !== 'left' && item.status !== 'archived'
      );

      setLeftEntries(leftItems);
      setArchivedEntries(archivedItems);
      setHistoryItems(remainingItems);
      applyFiltersAndSearch(remainingItems, selectedFilter, searchQuery);

      PerformanceMonitor.endTiming(operationId, {
        itemsLoaded: normalizedItems.length,
        leftCount: leftItems.length,
        archivedCount: archivedItems.length,
        userId: loadedUserId ?? 'unknown',
      });
    } catch (error) {
      console.error('Failed to load history data:', error);
      PerformanceMonitor.endTiming(operationId, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      Alert.alert('错误', '加载历史记录失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, searchQuery, applyFiltersAndSearch, resolveUserIdCandidates]);

  useEffect(() => {
    if (!leftSectionToggled) {
      setShowLeftSection(leftEntries.length > 0);
    }
  }, [leftEntries, leftSectionToggled]);

  useEffect(() => {
    if (!archivedSectionToggled) {
      setShowArchivedSection(archivedEntries.length > 0);
    }
  }, [archivedEntries, archivedSectionToggled]);

  const handleItemPress = useCallback(
    (item: HistoryItem) => {
    // Navigate to EntryInfoDetailScreen with EntryInfo ID
    navigation.navigate('EntryInfoDetail', {
      entryInfoId: item.id,
      isHistorical: true,
    });
  },
    [navigation],
  );

  const handleDeleteItem = useCallback(
    (item: HistoryItem) => {
    const buttons: AlertButton[] = [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await EntryInfoService.deleteEntryInfo(item.id);

            // Refresh the list
            await loadHistoryData();
            Alert.alert('成功', '历史记录已删除');
          } catch (error) {
            console.error('Failed to delete history item:', error);
            Alert.alert('错误', '删除失败，请重试');
          }
        },
      },
    ];

    Alert.alert(
      '确认删除',
      `确定要删除 ${item.destination} 的历史记录吗？此操作无法撤销。`,
      buttons
    );
  },
    [loadHistoryData],
  );

  const handleItemLongPress = useCallback(
    (item: HistoryItem) => {
      const actions: AlertButton[] = [
        {
          text: '查看详情',
          onPress: () => handleItemPress(item),
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => handleDeleteItem(item),
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ];

      Alert.alert(
        '操作选项',
        `选择对 ${item.destination} 历史记录的操作`,
        actions,
      );
    },
    [handleDeleteItem, handleItemPress],
  );

  const handleFilterPress = (filterKey: FilterKey): void => {
    setSelectedFilter(filterKey);
    setShowFilters(false);
    applyFiltersAndSearch(historyItems, filterKey, searchQuery);
  };

  type StatusUpdateConfig = {
    reason?: string;
    successMessage?: string;
  };

  const performStatusUpdate = useCallback(
    async (entryInfoId: string, nextStatus: string, config: StatusUpdateConfig = {}) => {
      try {
        setActionLoading(true);
        const options = config.reason ? { reason: config.reason } : {};
        await UserDataService.updateEntryInfoStatus(entryInfoId, nextStatus, options);
        await loadHistoryData();
        if (config.successMessage) {
          Alert.alert('', config.successMessage);
        }
      } catch (error: unknown) {
        console.error('Failed to update entry info status:', error);
        Alert.alert(
          t('history.actions.errorTitle', { defaultValue: '操作失败' }),
          t('history.actions.errorMessage', {
            defaultValue: error instanceof Error ? error.message : '请稍后再试。',
          })
        );
      } finally {
        setActionLoading(false);
      }
    },
    [loadHistoryData, t]
  );

  const handleRejoinEntry = useCallback(
    (entry: HistoryItem) => {
      const destinationName = entry.destination ?? getDestinationName(entry.destinationId);
      void performStatusUpdate(entry.id, 'incomplete', {
        reason: 'user_rejoined_trip',
        successMessage: t('history.actions.restoreSuccess', {
          destination: destinationName,
          defaultValue: `${destinationName} 已恢复到首页。`,
        }),
      });
    },
    [performStatusUpdate, t]
  );

  const handleArchiveEntry = useCallback(
    (entry: HistoryItem) => {
      const destinationName = entry.destination ?? getDestinationName(entry.destinationId);
      Alert.alert(
        t('history.actions.archiveTitle', { defaultValue: '归档这个行程？' }),
        t('history.actions.archiveMessage', {
          destination: destinationName,
          defaultValue: '行程将移到“已完成/归档”，您仍可以稍后恢复。',
        }),
        [
          {
            text: t('common.cancel', { defaultValue: '取消' }),
            style: 'cancel',
          },
          {
            text: t('history.actions.archiveConfirm', { defaultValue: '确认归档' }),
            onPress: () =>
              void performStatusUpdate(entry.id, 'archived', {
                reason: 'user_archived_trip',
                successMessage: t('history.actions.archiveSuccess', {
                  destination: destinationName,
                  defaultValue: `${destinationName} 已归档。`,
                }),
              }),
          },
        ]
      );
    },
    [performStatusUpdate, t]
  );

  const handleRestoreArchived = useCallback(
    (entry: HistoryItem) => {
      const destinationName = entry.destination ?? getDestinationName(entry.destinationId);
      void performStatusUpdate(entry.id, 'incomplete', {
        reason: 'user_restored_from_archive',
        successMessage: t('history.actions.restoreSuccess', {
          destination: destinationName,
          defaultValue: `${destinationName} 已恢复到首页。`,
        }),
      });
    },
    [performStatusUpdate, t]
  );

  const handleSearchChange = (query: string): void => {
    setSearchQuery(query);
    applyFiltersAndSearch(historyItems, selectedFilter, query);
  };

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadHistoryData();
    setRefreshing(false);
  }, [loadHistoryData]);

  useFocusEffect(
    useCallback(() => {
      loadHistoryData();
    }, [loadHistoryData])
  );

  const renderHistoryItem = useCallback(
    (item: HistoryItem): React.ReactElement => (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleItemLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={styles.destinationInfo}>
            <Text style={styles.flagEmoji}>{getDestinationFlag(item.destinationId)}</Text>
            <Text style={styles.destinationName}>
              {item.destination ?? getDestinationName(item.destinationId)}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {t('history.labels.arrivalDate', {
                defaultValue: '抵达日期',
              })}
              : {formatDateDisplay(item.arrivalDate, language)}
            </Text>
          </View>

          {item.submittedAt && (
            <View style={styles.dateRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {t('history.labels.submittedAt', {
                  defaultValue: '提交日期',
                })}
                : {formatDateDisplay(item.submittedAt, language)}
              </Text>
            </View>
          )}

          <View style={styles.dateRow}>
            <Ionicons name="archive-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {t('history.labels.createdAt', {
                defaultValue: '创建日期',
              })}
              : {formatDateDisplay(item.createdAt, language)}
            </Text>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    ),
    [handleItemLongPress, handleItemPress],
  );

  const renderLeftEntryCard = useCallback(
    (entry: HistoryItem) => {
      const destinationName = entry.destination ?? getDestinationName(entry.destinationId);
      const completionPercent =
        typeof entry.completionPercent === 'number'
          ? entry.completionPercent
          : entry.travel?.arrivalDate
            ? 100
            : 0;

      return (
        <Card key={`left_${entry.id}`} style={[styles.historyCard, styles.leftCard]}>
          <View style={styles.entryPackItem}>
            <View style={styles.inProgressLeft}>
              <Text style={styles.entryPackFlag}>{getDestinationFlag(entry.destinationId)}</Text>
              <View style={styles.progressIndicator}>
                <Text style={styles.progressPercent}>{`${completionPercent}%`}</Text>
              </View>
            </View>
            <View style={styles.entryPackInfo}>
              <Text style={styles.entryPackTitle}>{destinationName}</Text>
              <Text style={styles.leftStatusLabel}>
                {t('history.left.status', { defaultValue: '已离开' })}
              </Text>
              {entry.leftAt && (
                <Text style={styles.entryMetaText}>
                  {t('history.left.movedAt', {
                    date: formatDateDisplay(entry.leftAt, language),
                    defaultValue: `移到此列表：${formatDateDisplay(entry.leftAt, language)}`,
                  })}
                </Text>
              )}
              <Text style={styles.entryMetaText}>
                {t('history.left.completion', {
                  percent: completionPercent,
                  defaultValue: `完成度 ${completionPercent}%`,
                })}
              </Text>
              {entry.arrivalDate && (
                <Text style={styles.entryMetaText}>
                  {t('history.labels.arrivalDate', { defaultValue: '抵达日期' })}
                  ：{formatDateDisplay(entry.arrivalDate, language)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.entryActionsRow}>
            <Button
              title={t('history.actions.restoreTrip', { defaultValue: '恢复到首页' })}
              onPress={() => handleRejoinEntry(entry)}
              variant="primary"
              icon="↩️"
              disabled={actionLoading}
              style={styles.entryActionButton}
            />
            <Button
              title={t('history.actions.archiveTrip', { defaultValue: '归档' })}
              onPress={() => handleArchiveEntry(entry)}
              variant="text"
              icon="📁"
              disabled={actionLoading}
              style={styles.entryActionButton}
              textStyle={styles.entryActionDangerText}
            />
          </View>
        </Card>
      );
    },
    [actionLoading, handleArchiveEntry, handleRejoinEntry, language, t]
  );

  const renderArchivedEntryCard = useCallback(
    (entry: HistoryItem) => {
      const destinationName = entry.destination ?? getDestinationName(entry.destinationId);

      return (
        <Card key={`archived_${entry.id}`} style={[styles.historyCard, styles.archivedCard]}>
          <View style={styles.entryPackItem}>
            <View style={styles.inProgressLeft}>
              <Text style={styles.entryPackFlag}>{getDestinationFlag(entry.destinationId)}</Text>
            </View>
            <View style={styles.entryPackInfo}>
              <Text style={styles.entryPackTitle}>{destinationName}</Text>
              <Text style={styles.archivedStatusLabel}>
                {t('history.archived.status', { defaultValue: '已归档' })}
              </Text>
              {entry.archivedAt && (
                <Text style={styles.entryMetaText}>
                  {t('history.archived.archivedAt', {
                    date: formatDateDisplay(entry.archivedAt, language),
                    defaultValue: `归档日期：${formatDateDisplay(entry.archivedAt, language)}`,
                  })}
                </Text>
              )}
              {entry.arrivalDate && (
                <Text style={styles.entryMetaText}>
                  {t('history.labels.arrivalDate', { defaultValue: '抵达日期' })}
                  ：{formatDateDisplay(entry.arrivalDate, language)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.entryActionsRow}>
            <Button
              title={t('history.actions.restoreTrip', { defaultValue: '恢复到首页' })}
              onPress={() => handleRestoreArchived(entry)}
              variant="secondary"
              icon="🔄"
              disabled={actionLoading}
              style={styles.entryActionButton}
            />
          </View>
        </Card>
      );
    },
    [actionLoading, handleRestoreArchived, language, t]
  );

  const renderSectionHeader = (title: string): React.ReactElement => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // Memoize optimized FlatList props
  const optimizedListProps = useMemo(() => {
    const {
      keyExtractor: _ignoredKeyExtractor,
      getItemLayout: _ignoredGetItemLayout,
      ...restProps
    } = LazyLoadingHelper.getOptimizedFlatListProps({
      itemHeight: 120, // Estimated height of history item
      windowSize: 10,
      initialNumToRender: 8,
      maxToRenderPerBatch: 5,
      updateCellsBatchingPeriod: 50,
      removeClippedSubviews: true,
    });
    return restProps;
  }, []);

  // Flatten grouped data for virtualized list
  const flattenedData = useMemo<FlattenedHistoryItem[]>(() => {
    const operationId = PerformanceMonitor.startTiming('flattenGroupedData', {
      filteredItemsCount: filteredItems.length,
    });

    const groups = groupItemsByTime(filteredItems);
    const groupOrder = ['今天', '昨天', '本周', '本月', '更早'];
    const flattened: FlattenedHistoryItem[] = [];

    groupOrder.forEach((groupTitle) => {
      if (groups[groupTitle]?.length > 0) {
        // Add section header
        flattened.push({
          type: 'header',
          id: `header_${groupTitle}`,
          title: groupTitle,
        });
        
        // Add items
        groups[groupTitle].forEach((item) => {
          flattened.push({
            type: 'item',
            ...item,
          });
        });
      }
    });

    PerformanceMonitor.endTiming(operationId, {
      flattenedCount: flattened.length,
      groupCount: groupOrder.filter((g) => groups[g]?.length > 0).length,
    });

    return flattened;
  }, [filteredItems]);

  const renderFlattenedItem = useCallback(
    ({ item }: ListRenderItemInfo<FlattenedHistoryItem>): React.ReactElement | null =>
      item.type === 'header' ? renderSectionHeader(item.title) : renderHistoryItem(item),
    [renderHistoryItem],
  );

  const getItemLayout = useCallback(
    (data: FlattenedHistoryItem[] | null | undefined, index: number) => {
      if (!data) {
        return { length: 0, offset: 0, index };
      }
      const height = data[index]?.type === 'header' ? 40 : 120;
      const offset = data
        .slice(0, index)
        .reduce(
          (sum, current) => sum + (current.type === 'header' ? 40 : 120),
          0,
        );
      return {
        length: height,
        offset,
        index,
      };
    },
    [],
  );

  const renderGroupedList = (): React.ReactElement => (
    <FlatList<FlattenedHistoryItem>
      data={flattenedData}
      renderItem={renderFlattenedItem}
      getItemLayout={getItemLayout}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      {...optimizedListProps}
      onViewableItemsChanged={({ viewableItems }) => {
        if (viewableItems.length > 0) {
          PerformanceMonitor.recordMemoryUsage('historyListScroll', {
            visibleItems: viewableItems.length,
            totalItems: flattenedData.length,
          });
        }
      }}
    />
  );

  const renderLeftSection = (): React.ReactElement | null => {
    if (!leftEntries.length) {
      return null;
    }

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {t('history.left.title', { defaultValue: '已离开的行程' })}
          </Text>
          <View style={styles.sectionHeaderRight}>
            <Text style={styles.sectionBadge}>{leftEntries.length}</Text>
            <TouchableOpacity
              style={styles.sectionToggle}
              onPress={() => {
                setLeftSectionToggled(true);
                setShowLeftSection((prev) => !prev);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.sectionToggleText}>
                {showLeftSection
                  ? t('history.actions.hide', { defaultValue: '收起' })
                  : t('history.actions.show', { defaultValue: '展开' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {showLeftSection && (
          <>
            <Text style={styles.sectionHelperText}>
              {t('history.left.helper', { defaultValue: '可以随时恢复，行程会回到首页。' })}
            </Text>
            {leftEntries.map(renderLeftEntryCard)}
          </>
        )}
      </View>
    );
  };

  const renderArchivedSection = (): React.ReactElement | null => {
    if (!archivedEntries.length) {
      return null;
    }

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {t('history.archived.title', { defaultValue: '已完成 / 归档' })}
          </Text>
          <View style={styles.sectionHeaderRight}>
            <Text style={styles.sectionBadge}>{archivedEntries.length}</Text>
            <TouchableOpacity
              style={styles.sectionToggle}
              onPress={() => {
                setArchivedSectionToggled(true);
                setShowArchivedSection((prev) => !prev);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.sectionToggleText}>
                {showArchivedSection
                  ? t('history.actions.hide', { defaultValue: '收起' })
                  : t('history.actions.show', { defaultValue: '展开' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {showArchivedSection && (
          <>
            <Text style={styles.sectionHelperText}>
              {t('history.archived.helper', { defaultValue: '需要时也能再次恢复到首页。' })}
            </Text>
            {archivedEntries.map(renderArchivedEntryCard)}
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>加载历史记录...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('history.headerTitle', { defaultValue: '归档记录' })}
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('history.searchPlaceholder', { defaultValue: '搜索目的地或日期…' })}
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleSearchChange('')}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Options */}
      {showFilters && (
        <View style={styles.filterContainer}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterOption,
                selectedFilter === option.key && styles.filterOptionActive
              ]}
              onPress={() => handleFilterPress(option.key)}
            >
              <Text style={[
                styles.filterOptionText,
                selectedFilter === option.key && styles.filterOptionTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.listWrapper}>
        {renderLeftSection()}
        {renderArchivedSection()}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {t('history.empty.title', { defaultValue: '暂无历史记录' })}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('history.empty.subtitle', { defaultValue: '完成行程后可以在此查看记录' })}
            </Text>
          </View>
        ) : (
          renderGroupedList()
        )}
      </View>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  filterOptionTextActive: {
    color: colors.surface,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  listWrapper: {
    flex: 1,
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  historyItem: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.surface,
  },
  itemDetails: {
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionBadge: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    textAlign: 'center',
  },
  sectionToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionToggleText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sectionHelperText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  entryPackItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  entryPackFlag: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  progressIndicator: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '700',
    fontSize: 12,
  },
  entryPackInfo: {
    flex: 1,
  },
  entryPackTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  leftStatusLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  archivedStatusLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  entryMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  entryActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  entryActionButton: {
    flex: 1,
  },
  entryActionDangerText: {
    color: colors.error,
    fontWeight: '600',
  },
  leftCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  archivedCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.textDisabled,
    backgroundColor: colors.surface,
  },
});

export default EntryInfoHistoryScreen;
