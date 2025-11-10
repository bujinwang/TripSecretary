import React, { useState, useCallback, useMemo } from 'react';
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
import { colors } from '../theme/colors';
import EntryInfoService from '../services/EntryInfoService';
import DateFormatter from '../utils/DateFormatter';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import LazyLoadingHelper from '../utils/LazyLoadingHelper';
import type { RootStackScreenProps } from '../types/navigation';
import EntryInfo from '../models/EntryInfo';

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

const formatDateDisplay = (date?: string | null): string => {
  if (!date) {
    return '未填写';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return DateFormatter.formatDate(parsed, 'zh-CN');
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

const EntryInfoHistoryScreen: React.FC<EntryInfoHistoryScreenProps> = ({ navigation }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

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
          const arrivalText = formatDateDisplay(item.arrivalDate).toLowerCase();
          return destinationText.includes(lowerQuery) || arrivalText.includes(lowerQuery);
        });
      }

      setFilteredItems(filtered);
    },
    [],
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
      
      // Get current user ID (this would come from auth context in real app)
      const userId = 'current_user'; // TODO: Get from auth context
      
      // Load EntryInfo records
      const entryInfos = await EntryInfoService.getAllEntryInfos(userId);

      const normalizedItems: HistoryItem[] = entryInfos.map((entryInfo: EntryInfoInstance) => {
        const destinationId = entryInfo.destinationId ?? null;
        const travelData =
          entryInfo.travel && typeof entryInfo.travel === 'object'
            ? (entryInfo.travel as { arrivalDate?: string | null })
            : null;
        const documents =
          entryInfo.documents && typeof entryInfo.documents === 'object'
            ? (entryInfo.documents as { submittedAt?: string | null })
            : null;

        return {
          id: entryInfo.id,
          destinationId,
          destination: destinationId ? getDestinationName(destinationId) : null,
          status: entryInfo.status ?? null,
          arrivalDate: travelData?.arrivalDate ?? null,
          submittedAt: documents?.submittedAt ?? null,
          createdAt: entryInfo.createdAt ?? entryInfo.lastUpdatedAt ?? null,
          lastUpdatedAt: entryInfo.lastUpdatedAt ?? null,
          travel: travelData,
        };
      });

      setHistoryItems(normalizedItems);
      applyFiltersAndSearch(normalizedItems, selectedFilter, searchQuery);

      PerformanceMonitor.endTiming(operationId, {
        itemsLoaded: normalizedItems.length,
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
  }, [selectedFilter, searchQuery, applyFiltersAndSearch]);

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
              抵达日期: {formatDateDisplay(item.arrivalDate)}
            </Text>
          </View>

          {item.submittedAt && (
            <View style={styles.dateRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                提交日期: {formatDateDisplay(item.submittedAt)}
              </Text>
            </View>
          )}

          <View style={styles.dateRow}>
            <Ionicons name="archive-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              创建日期: {formatDateDisplay(item.createdAt)}
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

  const renderSectionHeader = (title: string): React.ReactElement => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // Memoize optimized FlatList props
  const optimizedListProps = useMemo(
    () =>
      LazyLoadingHelper.getOptimizedFlatListProps({
        itemHeight: 120, // Estimated height of history item
        windowSize: 10,
        initialNumToRender: 8,
        maxToRenderPerBatch: 5,
        updateCellsBatchingPeriod: 50,
        removeClippedSubviews: true,
      }),
    [],
  );

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
        <Text style={styles.headerTitle}>历史记录</Text>
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
          placeholder="搜索目的地或日期..."
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
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>暂无历史记录</Text>
            <Text style={styles.emptySubtitle}>完成行程后可以在此查看历史记录</Text>
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

});

export default EntryInfoHistoryScreen;