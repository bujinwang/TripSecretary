// 香港 HDAC 内嵌网页助手 (Hong Kong Digital Arrival Card WebView)
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import BackButton from '../../components/BackButton';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';

// Hong Kong Immigration Department official website
const HDAC_URL = 'https://www.immd.gov.hk/';

const HDACWebViewScreen = ({ navigation }) => {
  const { t } = useLocale();
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (state) => {
    setCanGoBack(state.canGoBack);
    setCanGoForward(state.canGoForward);
  };

  const handleOpenExternal = async () => {
    const supported = await Linking.canOpenURL(HDAC_URL);
    if (supported) {
      Linking.openURL(HDAC_URL);
    } else {
      Alert.alert(
        t('hongkong.webview.openFailedTitle', { defaultValue: '无法打开链接' }),
        t('hongkong.webview.openFailedBody', { defaultValue: '请检查网络连接后重试' })
      );
    }
  };

  const handleReload = () => {
    webViewRef.current?.reload();
  };

  const handleGoBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      webViewRef.current?.goForward();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('hongkong.webview.headerTitle', { defaultValue: '香港入境事务处' })}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.noticeBar}>
        <Text style={styles.noticeEmoji}>💡</Text>
        <Text style={styles.noticeText}>
          {t('hongkong.webview.notice', { defaultValue: '提示：这是香港入境事务处官方网站。入境通不会收集您填写的任何信息。' })}
        </Text>
      </View>

      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: HDAC_URL }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#D32F2F" />
              <Text style={styles.loadingText}>{t('hongkong.webview.loading', { defaultValue: '加载中...' })}</Text>
            </View>
          )}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#D32F2F" />
            <Text style={styles.loadingText}>{t('hongkong.webview.loading', { defaultValue: '加载中...' })}</Text>
          </View>
        )}
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarButton, !canGoBack && styles.toolbarButtonDisabled]}
          onPress={handleGoBack}
          disabled={!canGoBack}
        >
          <Text style={[styles.toolbarButtonText, !canGoBack && styles.toolbarButtonTextDisabled]}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarButton, !canGoForward && styles.toolbarButtonDisabled]}
          onPress={handleGoForward}
          disabled={!canGoForward}
        >
          <Text style={[styles.toolbarButtonText, !canGoForward && styles.toolbarButtonTextDisabled]}>▶</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleReload}>
          <Text style={styles.toolbarButtonText}>🔄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolbarButton, styles.externalButton]} onPress={handleOpenExternal}>
          <Text style={styles.externalButtonText}>{t('hongkong.webview.openExternal', { defaultValue: '浏览器打开' })}</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  noticeEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  noticeText: {
    ...typography.caption,
    color: '#D32F2F',
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  loadingText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  toolbarButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolbarButtonDisabled: {
    opacity: 0.3,
  },
  toolbarButtonText: {
    fontSize: 18,
  },
  toolbarButtonTextDisabled: {
    opacity: 0.3,
  },
  externalButton: {
    flex: 1,
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
    alignItems: 'center',
  },
  externalButtonText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '700',
  },
});

export default HDACWebViewScreen;
