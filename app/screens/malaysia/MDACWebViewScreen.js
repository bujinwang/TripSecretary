// 马来西亚 MDAC 内嵌网页助手
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import BackButton from '../../components/BackButton';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';

const MDAC_URL = 'https://imigresen-online.imi.gov.my/mdac/main?registerMain';

const MDACWebViewScreen = ({ navigation }) => {
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
    const supported = await Linking.canOpenURL(MDAC_URL);
    if (supported) {
      Linking.openURL(MDAC_URL);
    } else {
      Alert.alert(t('malaysia.webview.openFailedTitle'), t('malaysia.webview.openFailedBody'));
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
        <Text style={styles.headerTitle}>{t('malaysia.webview.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.noticeBar}>
        <Text style={styles.noticeEmoji}>💡</Text>
        <Text style={styles.noticeText}>
          {t('malaysia.webview.notice')}
        </Text>
      </View>

      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: MDAC_URL }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0D47A1" />
              <Text style={styles.loadingText}>{t('malaysia.webview.loading')}</Text>
            </View>
          )}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0D47A1" />
            <Text style={styles.loadingText}>{t('malaysia.webview.loading')}</Text>
          </View>
        )}
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarButton, !canGoBack && styles.toolbarButtonDisabled]}
          onPress={handleGoBack}
          disabled={!canGoBack}
        >
          <Text style={styles.toolbarButtonText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarButton, !canGoForward && styles.toolbarButtonDisabled]}
          onPress={handleGoForward}
          disabled={!canGoForward}
        >
          <Text style={styles.toolbarButtonText}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleReload}>
          <Text style={styles.toolbarButtonText}>⟳</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolbarButton, styles.toolbarButtonPrimary]} onPress={handleOpenExternal}>
          <Text style={[styles.toolbarButtonText, styles.toolbarButtonPrimaryText]}>
            {t('malaysia.webview.openExternal')}
          </Text>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFF3E0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  noticeEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  noticeText: {
    flex: 1,
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
  },
  webViewContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  toolbarButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  toolbarButtonDisabled: {
    opacity: 0.4,
  },
  toolbarButtonPrimary: {
    backgroundColor: '#0D47A1',
  },
  toolbarButtonText: {
    ...typography.body1,
    color: '#0D47A1',
    fontWeight: '600',
  },
  toolbarButtonPrimaryText: {
    color: colors.white,
  },
});

export default MDACWebViewScreen;
