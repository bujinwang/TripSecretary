// TDAC Entry Pack Preview - DocumentFullScreenModal Component
// Full-screen modal viewer for document preview with pinch-to-zoom and sharing

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Share,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '../../i18n/LocaleContext';
import { previewTheme } from '../../theme/preview-tokens';
import { PreviewHaptics } from '../../utils/haptics';
import {
  ANIMATION_EASING,
  SPRING_CONFIGS,
  ReduceMotionManager,
} from '../../utils/animations/previewAnimations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * DocumentFullScreenModal Component
 *
 * Full-screen modal viewer for TDAC document preview.
 * Features:
 * - Dark overlay background
 * - Pinch-to-zoom support (future enhancement)
 * - Swipe to dismiss gesture
 * - Page indicators for multi-page documents
 * - Share/download options
 * - Close button
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Function} props.onClose - Close handler
 * @param {React.ReactNode} props.children - Document content to display
 * @param {Object} props.documentData - Document metadata
 * @param {string} props.documentData.name - Document name
 * @param {string} props.documentData.tdacNumber - TDAC number
 * @param {number} props.pageCount - Number of pages (default: 1)
 * @param {number} props.currentPage - Current page index (default: 0)
 * @param {Function} props.onPageChange - Page change handler
 * @param {Function} props.onShare - Share handler
 * @param {Function} props.onDownload - Download handler
 * @param {boolean} props.showPageIndicator - Show page indicator (default: true)
 * @param {boolean} props.showShareButton - Show share button (default: true)
 * @param {Object} props.style - Additional styles
 *
 * @example
 * <DocumentFullScreenModal
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   documentData={{ name: 'TDAC Card', tdacNumber: 'A1234567' }}
 *   onShare={handleShare}
 * >
 *   <DocumentContent />
 * </DocumentFullScreenModal>
 */
const DocumentFullScreenModal = ({
  visible = false,
  onClose,
  children,
  documentData = {},
  pageCount = 1,
  currentPage = 0,
  onPageChange,
  onShare,
  onDownload,
  showPageIndicator = true,
  showShareButton = true,
  style,
}) => {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState(currentPage);
  const scrollViewRef = useRef(null);

  // Animation values for modal entrance/exit
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);

  // Animation values for pinch-to-zoom
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Animation values for swipe-to-dismiss
  const dragY = useSharedValue(0);
  const dismissThreshold = 150; // Pixels to drag before dismissing

  // Modal entrance animation
  useEffect(() => {
    if (visible) {
      const isReduceMotion = ReduceMotionManager.isReduceMotionEnabled;

      if (isReduceMotion) {
        modalOpacity.value = 1;
        modalScale.value = 1;
      } else {
        modalOpacity.value = withTiming(1, {
          duration: 300,
          easing: ANIMATION_EASING.EASE_OUT,
        });
        modalScale.value = withTiming(1, {
          duration: 300,
          easing: ANIMATION_EASING.EASE_OUT,
        });
      }
    } else {
      // Reset zoom when modal closes
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      dragY.value = 0;
      modalOpacity.value = 0;
      modalScale.value = 0.9;
    }
  }, [visible]);

  // Handle close with haptic feedback and animation
  const handleClose = () => {
    PreviewHaptics.buttonPress();

    const isReduceMotion = ReduceMotionManager.isReduceMotionEnabled;

    if (isReduceMotion) {
      if (onClose) {
        onClose();
      }
    } else {
      // Animate out
      modalOpacity.value = withTiming(0, {
        duration: 250,
        easing: ANIMATION_EASING.EASE_IN,
      });
      modalScale.value = withTiming(0.95, {
        duration: 250,
        easing: ANIMATION_EASING.EASE_IN,
      });

      // Close after animation
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 250);
    }
  };

  // Handle share with haptic feedback
  const handleShare = async () => {
    PreviewHaptics.buttonPress();

    if (onShare) {
      await onShare();
    } else {
      // Default share implementation
      try {
        await Share.share({
          message: t('preview.document.share.message', {
            defaultValue: 'TDAC Document Preview',
          }),
          title: t('preview.document.share.title', {
            defaultValue: 'Share Document',
          }),
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  // Handle download with haptic feedback
  const handleDownload = async () => {
    PreviewHaptics.buttonPress();

    if (onDownload) {
      await onDownload();
    }
  };

  // Handle page change
  const handlePageChange = (pageIndex) => {
    PreviewHaptics.selection();
    setActivePage(pageIndex);

    if (onPageChange) {
      onPageChange(pageIndex);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    PreviewHaptics.buttonPress();
    const newScale = Math.min(savedScale.value + 0.5, 3);
    scale.value = withSpring(newScale, SPRING_CONFIGS.gentle);
    savedScale.value = newScale;
  };

  const handleZoomOut = () => {
    PreviewHaptics.buttonPress();
    const newScale = Math.max(savedScale.value - 0.5, 1);
    scale.value = withSpring(newScale, SPRING_CONFIGS.gentle);
    savedScale.value = newScale;

    // Reset position when zooming back to 1x
    if (newScale === 1) {
      translateX.value = withSpring(0, SPRING_CONFIGS.gentle);
      translateY.value = withSpring(0, SPRING_CONFIGS.gentle);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  };

  const handleZoomReset = () => {
    PreviewHaptics.buttonPress();
    scale.value = withSpring(1, SPRING_CONFIGS.gentle);
    savedScale.value = 1;
    translateX.value = withSpring(0, SPRING_CONFIGS.gentle);
    translateY.value = withSpring(0, SPRING_CONFIGS.gentle);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = Math.max(1, Math.min(savedScale.value * event.scale, 3));
      scale.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      // Reset if zoomed out below 1x
      if (scale.value < 1) {
        scale.value = withSpring(1, SPRING_CONFIGS.gentle);
        savedScale.value = 1;
        translateX.value = withSpring(0, SPRING_CONFIGS.gentle);
        translateY.value = withSpring(0, SPRING_CONFIGS.gentle);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Pan gesture for moving zoomed content
  const panGesture = Gesture.Pan()
    .enabled(savedScale.value > 1)
    .onUpdate((event) => {
      // Allow panning when zoomed in
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Swipe down to dismiss gesture (only when not zoomed)
  const swipeGesture = Gesture.Pan()
    .enabled(savedScale.value === 1)
    .onUpdate((event) => {
      // Only allow downward swipes
      if (event.translationY > 0) {
        dragY.value = event.translationY;
        // Reduce opacity as user drags
        const progress = Math.min(event.translationY / dismissThreshold, 1);
        modalOpacity.value = 1 - progress * 0.5;
      }
    })
    .onEnd((event) => {
      if (event.translationY > dismissThreshold) {
        // Dismiss modal
        runOnJS(handleClose)();
      } else {
        // Snap back
        dragY.value = withSpring(0, SPRING_CONFIGS.gentle);
        modalOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  // Double-tap to toggle zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(PreviewHaptics.selection)();

      if (savedScale.value > 1) {
        // Reset zoom
        scale.value = withSpring(1, SPRING_CONFIGS.gentle);
        savedScale.value = 1;
        translateX.value = withSpring(0, SPRING_CONFIGS.gentle);
        translateY.value = withSpring(0, SPRING_CONFIGS.gentle);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom to 2x
        scale.value = withSpring(2, SPRING_CONFIGS.gentle);
        savedScale.value = 2;
      }
    });

  // Combine gestures
  const composedGestures = Gesture.Simultaneous(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
    swipeGesture
  );

  // Animated styles
  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const animatedDocumentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: dragY.value },
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value + dragY.value },
    ],
  }));

  // Calculate page indicator dots
  const renderPageIndicator = () => {
    if (!showPageIndicator || pageCount <= 1) {
      return null;
    }

    return (
      <View style={styles.pageIndicatorContainer}>
        {Array.from({ length: pageCount }).map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pageIndicatorDot,
              index === activePage && styles.pageIndicatorDotActive,
            ]}
            onPress={() => handlePageChange(index)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('preview.document.page', {
              defaultValue: `Page ${index + 1} of ${pageCount}`,
              current: index + 1,
              total: pageCount,
            })}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      transparent={false}
    >
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.modalBackground, animatedModalStyle]}>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {documentData.name ||
                t('preview.document.fullscreen.title', {
                  defaultValue: 'Document Preview',
                })}
            </Text>
            {documentData.tdacNumber && (
              <Text style={styles.headerSubtitle}>{documentData.tdacNumber}</Text>
            )}
          </View>

          <View style={styles.headerRight}>
            {/* Zoom controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={handleZoomOut}
                disabled={savedScale.value <= 1}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('preview.document.zoomOut', {
                  defaultValue: 'Zoom out',
                })}
              >
                <Feather
                  name="minus"
                  size={previewTheme.iconSizes.medium}
                  color={
                    savedScale.value <= 1
                      ? previewTheme.colors.neutral600
                      : previewTheme.colors.white
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.zoomResetButton}
                onPress={handleZoomReset}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('preview.document.zoomReset', {
                  defaultValue: 'Reset zoom',
                })}
              >
                <Text style={styles.zoomText}>
                  {Math.round(savedScale.value * 100)}%
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.zoomButton}
                onPress={handleZoomIn}
                disabled={savedScale.value >= 3}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('preview.document.zoomIn', {
                  defaultValue: 'Zoom in',
                })}
              >
                <Feather
                  name="plus"
                  size={previewTheme.iconSizes.medium}
                  color={
                    savedScale.value >= 3
                      ? previewTheme.colors.neutral600
                      : previewTheme.colors.white
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Share button */}
            {showShareButton && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleShare}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('preview.document.share', {
                  defaultValue: 'Share',
                })}
              >
                <Feather
                  name="share-2"
                  size={previewTheme.iconSizes.large}
                  color={previewTheme.colors.white}
                />
              </TouchableOpacity>
            )}

            {/* Download button (if handler provided) */}
            {onDownload && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleDownload}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('preview.document.download', {
                  defaultValue: 'Download',
                })}
              >
                <Feather
                  name="download"
                  size={previewTheme.iconSizes.large}
                  color={previewTheme.colors.white}
                />
              </TouchableOpacity>
            )}

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
            >
              <Feather
                name="x"
                size={previewTheme.iconSizes.large}
                color={previewTheme.colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content area */}
        <GestureDetector gesture={composedGestures}>
          <Animated.View style={styles.scrollView}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              scrollEnabled={savedScale.value === 1}
            >
              <Animated.View
                style={[styles.documentWrapper, animatedDocumentStyle]}
              >
                {children}
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </GestureDetector>

        {/* Page indicator */}
        {renderPageIndicator()}

        {/* Info footer */}
        <View style={styles.footer}>
          <View style={styles.footerIconContainer}>
            <Feather
              name="info"
              size={previewTheme.iconSizes.small}
              color={previewTheme.colors.neutral400}
            />
          </View>
          <Text style={styles.footerText}>
            {t('preview.document.fullscreen.hint', {
              defaultValue: 'Pinch to zoom • Scroll to view details',
            })}
          </Text>
        </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: previewTheme.spacing.md,
    paddingVertical: previewTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flex: 1,
    marginRight: previewTheme.spacing.md,
  },
  headerTitle: {
    ...previewTheme.typography.h3,
    color: previewTheme.colors.white,
  },
  headerSubtitle: {
    ...previewTheme.typography.small,
    color: previewTheme.colors.neutral400,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: previewTheme.spacing.xs,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: previewTheme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: previewTheme.spacing.lg,
    minHeight: SCREEN_HEIGHT - 200, // Account for header and footer
  },
  documentWrapper: {
    backgroundColor: previewTheme.colors.white,
    borderRadius: previewTheme.borderRadius.medium,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: previewTheme.spacing.md,
  },
  pageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  pageIndicatorDotActive: {
    width: 24,
    backgroundColor: previewTheme.colors.white,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: previewTheme.spacing.md,
    paddingVertical: previewTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerIconContainer: {
    marginRight: previewTheme.spacing.xs,
  },
  footerText: {
    ...previewTheme.typography.small,
    color: previewTheme.colors.neutral400,
  },
  // Zoom controls
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: previewTheme.spacing.xs,
    marginRight: previewTheme.spacing.sm,
  },
  zoomButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomResetButton: {
    paddingHorizontal: previewTheme.spacing.sm,
    paddingVertical: previewTheme.spacing.xs,
  },
  zoomText: {
    ...previewTheme.typography.small,
    color: previewTheme.colors.white,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
});

export default DocumentFullScreenModal;
