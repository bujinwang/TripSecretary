import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import EntryInfoService from '../services/EntryInfoService';
import DateFormatter from '../utils/DateFormatter';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import LazyLoadingHelper from '../utils/LazyLoadingHelper';

const EntryInfoHistoryScreen = ({ navigation }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);


  const filterOptions = [
    { key: 'all', label: '全部', count: 0 },
    { key: 'completed', label: '已完成', count: 0 },
    { key: 'cancelled', label: '已取消', count: 0 },
    { key: 'expired', label: '已过期', count: 0 },
  ];

  const loadHistoryData = useCallback(async () => {
    const operationId = PerformanceMonitor.startTiming('loadHistoryData', {
      selectedFilter,
      searchQuery: searchQuery.length
    });

    try {
      setLoading(true);
      
      // Get current user ID (this would come from auth context in real app)
      const userId = 'current_user'; // TODO: Get from auth context
      
      // Load EntryInfo records
      const entryInfos = await EntryInfoService.getAllEntryInfos(userId);

      setHistoryItems(entryInfos);
      applyFiltersAndSearch(entryInfos, selectedFilter, searchQuery);

      PerformanceMonitor.endTiming(operationId, {
        itemsLoaded: entryInfos.length,
      });
    } catch (error) {
      console.error('Failed to load history data:', error);
      PerformanceMonitor.endTiming(operationId, { error: error.message });
      Alert.alert('错误', '加载历史记录失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, searchQuery]);

  const applyFiltersAndSearch = useCallback((items, filter, query) => {
    let filtered = items;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.status === filter);
    }

    // Apply search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(item => 
        item.destination.toLowerCase().includes(lowerQuery) ||
        DateFormatter.formatDate(new Date(item.arrivalDate), 'zh-CN').includes(lowerQuery)
      );
    }

    setFilteredItems(filtered);
  }, []);

  const getDestinationName = (destinationId) => {
    const destinations = {
      thailand: '泰国',
      japan: '日本',
      singapore: '新加坡',
      malaysia: '马来西亚',
      taiwan: '台湾',
      hongkong: '香港',
      korea: '韩国',
      usa: '美国',
    };
    return destinations[destinationId] || destinationId;
  };

  const getDestinationFlag = (destinationId) => {
    const flags = {
      thailand: '🇹🇭',
      japan: '🇯🇵',
      singapore: '🇸🇬',
      malaysia: '🇲🇾',
      taiwan: '🇹🇼',
      hongkong: '🇭🇰',
      korea: '🇰🇷',
      usa: '🇺🇸',
    };
    return flags[destinationId] || '🌍';
  };

  const getStatusColor = (status) => {
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      case 'expired':
        return '已过期';
      default:
        return status;
    }
  };

  const getTimeGroup = (date) => {
    const now = new Date();
    const itemDate = new Date(date);
    const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));

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

  const groupItemsByTime = (items) => {
    const groups = {};
    items.forEach(item => {
      const group = getTimeGroup(item.createdAt);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
    });
    return groups;
  };

  const handleItemPress = (item) => {
    // Navigate to EntryInfoDetailScreen with EntryInfo ID
    navigation.navigate('EntryInfoDetail', {
      entryInfoId: item.id,
      isHistorical: true,
    });
  };

  const handleItemLongPress = (item) => {
    const actions = [
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
      }
    ];

    Alert.alert(
      '操作选项',
      `选择对 ${item.destination} 历史记录的操作`,
      actions
    );
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      '确认删除',
      `确定要删除 ${item.destination} 的历史记录吗？此操作无法撤销。`,
      [
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
      ]
    );
  };



  const handleFilterPress = (filterKey) => {
    setSelectedFilter(filterKey);
    setShowFilters(false);
    applyFiltersAndSearch(historyItems, filterKey, searchQuery);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    applyFiltersAndSearch(historyItems, selectedFilter, query);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistoryData();
    setRefreshing(false);
  }, [loadHistoryData]);

  useFocusEffect(
    useCallback(() => {
      loadHistoryData();
    }, [loadHistoryData])
  );

  const renderHistoryItem = useCallback(({ item, index }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleItemLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.destinationInfo}>
          <Text style={styles.flagEmoji}>{getDestinationFlag(item.destinationId)}</Text>
          <Text style={styles.destinationName}>{item.destination}</Text>
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
            抵达日期: {DateFormatter.formatDate(new Date(item.arrivalDate), 'zh-CN')}
          </Text>
        </View>
        
        {item.submittedAt && (
          <View style={styles.dateRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              提交日期: {DateFormatter.formatDate(new Date(item.submittedAt), 'zh-CN')}
            </Text>
          </View>
        )}

        <View style={styles.dateRow}>
          <Ionicons name="archive-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.dateText}>
            创建日期: {DateFormatter.formatDate(new Date(item.createdAt), 'zh-CN')}
          </Text>
        </View>
      </View>

      <View style={styles.itemFooter}>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  ), []);

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // Memoize optimized FlatList props
  const optimizedListProps = useMemo(() => {
    return LazyLoadingHelper.getOptimizedFlatListProps({
      itemHeight: 120, // Estimated height of history item
      windowSize: 10,
      initialNumToRender: 8,
      maxToRenderPerBatch: 5,
      updateCellsBatchingPeriod: 50,
      removeClippedSubviews: true
    });
  }, []);

  // Flatten grouped data for virtualized list
  const flattenedData = useMemo(() => {
    const operationId = PerformanceMonitor.startTiming('flattenGroupedData', {
      filteredItemsCount: filteredItems.length
    });

    const groups = groupItemsByTime(filteredItems);
    const groupOrder = ['今天', '昨天', '本周', '本月', '更早'];
    const flattened = [];

    groupOrder.forEach(groupTitle => {
      if (groups[groupTitle]?.length > 0) {
        // Add section header
        flattened.push({
          type: 'header',
          id: `header_${groupTitle}`,
          title: groupTitle
        });
        
        // Add items
        groups[groupTitle].forEach(item => {
          flattened.push({
            type: 'item',
            ...item
          });
        });
      }
    });

    PerformanceMonitor.endTiming(operationId, {
      flattenedCount: flattened.length,
      groupCount: groupOrder.filter(g => groups[g]?.length > 0).length
    });

    return flattened;
  }, [filteredItems]);

  const renderFlattenedItem = useCallback(({ item, index }) => {
    if (item.type === 'header') {
      return renderSectionHeader(item.title);
    }
    return renderHistoryItem({ item, index });
  }, []);

  const getItemLayout = useCallback((data, index) => {
    const item = data[index];
    const height = item?.type === 'header' ? 40 : 120;
    return {
      length: height,
      offset: data.slice(0, index).reduce((sum, item) => 
        sum + (item.type === 'header' ? 40 : 120), 0),
      index
    };
  }, []);

  const renderGroupedList = () => {
    return (
      <FlatList
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
          // Record memory usage periodically
          if (viewableItems.length > 0) {
            PerformanceMonitor.recordMemoryUsage('historyListScroll', {
              visibleItems: viewableItems.length,
              totalItems: flattenedData.length
            });
          }
        }}
      />
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



      {/* Results Count */}
      {(searchQuery.length > 0 || selectedFilter !== 'all') && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            显示 {filteredItems.length} 个结果

          </Text>
        </View>
      )}

      {/* History List */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>暂无历史记录</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.length > 0 || selectedFilter !== 'all'
              ? '没有找到匹配的记录'
              : '完成的旅程将显示在这里'
            }
          </Text>
        </View>
      ) : (
        renderGroupedList()
      )}
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
  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContainer: {
    paddingBottom: 20,
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