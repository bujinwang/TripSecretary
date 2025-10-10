/**
 * TDAC Selection Screen
 * 让用户选择使用WebView自动化版本 或 完全API版本
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const TDACSelectionScreen = ({ navigation, route }) => {
  const { travelerInfo } = route.params || {};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>泰国入境卡提交方式</Text>
        <Text style={styles.headerSubtitle}>请选择提交方式</Text>
      </View>

      {/* Hybrid版本 - 推荐 */}
      <TouchableOpacity 
        style={[styles.card, styles.recommendedCard]}
        onPress={() => navigation.navigate('TDACHybrid', { travelerInfo })}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔥 推荐</Text>
        </View>
        
        <Text style={styles.cardTitle}>⚡ 混合极速版本</Text>
        <Text style={styles.cardSubtitle}>隐藏WebView + 直接API - 最优方案</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>5-8秒</Text>
            <Text style={styles.statLabel}>提交时间</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>95%+</Text>
            <Text style={styles.statLabel}>成功率</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>3倍</Text>
            <Text style={styles.statLabel}>速度提升</Text>
          </View>
        </View>

        <View style={styles.features}>
          <Text style={styles.feature}>⚡ 极速提交（5-8秒）</Text>
          <Text style={styles.feature}>✅ 自动获取Cloudflare Token</Text>
          <Text style={styles.feature}>✅ 直接API调用</Text>
          <Text style={styles.feature}>✅ 无需可见WebView</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.buttonText}>立即使用 →</Text>
        </View>
      </TouchableOpacity>

      {/* WebView版本 - 备用 */}
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('TDACWebView', { travelerInfo })}
      >
        <Text style={styles.cardTitle}>🌐 WebView自动化版本</Text>
        <Text style={styles.cardSubtitle}>网页自动填表方案 - 稳定备用</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.normalStat]}>24秒</Text>
            <Text style={styles.statLabel}>提交时间</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.normalStat]}>85%</Text>
            <Text style={styles.statLabel}>成功率</Text>
          </View>
        </View>

        <View style={styles.features}>
          <Text style={styles.feature}>✅ 完整自动化流程</Text>
          <Text style={styles.feature}>✅ Cloudflare自动检测</Text>
          <Text style={styles.feature}>⚠️ 速度较慢（24秒）</Text>
          <Text style={styles.feature}>⚠️ 依赖网页结构</Text>
        </View>

        <View style={[styles.buttonContainer, styles.secondaryButton]}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>使用备用方案</Text>
        </View>
      </TouchableOpacity>

      {/* 对比说明 */}
      <View style={styles.comparisonSection}>
        <Text style={styles.comparisonTitle}>📊 性能对比</Text>
        
        <View style={styles.comparisonTable}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>速度</Text>
            <Text style={styles.comparisonApi}>5-8秒 ⚡</Text>
            <Text style={styles.comparisonWeb}>24秒</Text>
          </View>
          
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>可靠性</Text>
            <Text style={styles.comparisonApi}>95%+ ✅</Text>
            <Text style={styles.comparisonWeb}>85%</Text>
          </View>
          
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>技术方案</Text>
            <Text style={styles.comparisonApi}>混合 ✅</Text>
            <Text style={styles.comparisonWeb}>纯WebView</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 推荐使用混合极速版本：自动获取Token + 直接API提交 = 最佳体验
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1b6ca3',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recommendedCard: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  normalStat: {
    color: '#666',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  features: {
    marginBottom: 20,
  },
  feature: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  buttonContainer: {
    backgroundColor: '#1b6ca3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1b6ca3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#1b6ca3',
  },
  comparisonSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  comparisonTable: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  comparisonLabel: {
    flex: 1,
    fontSize: 15,
    color: '#666',
  },
  comparisonApi: {
    flex: 1,
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  comparisonWeb: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  footerText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default TDACSelectionScreen;
