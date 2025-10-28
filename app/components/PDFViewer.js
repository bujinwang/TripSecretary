/**
 * PDFViewer Component
 *
 * Displays PDF documents with scroll support for multi-page documents
 * Optimized for displaying TDAC arrival cards (typically 2 pages)
 *
 * Uses WebView to render PDFs for Expo compatibility
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
  TouchableOpacity,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const { width, height } = Dimensions.get('window');

/**
 * PDFViewer Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.source - PDF source { uri: 'file://...' } or { base64: '...' }
 * @param {Object} props.style - Custom styles for container
 * @param {Function} props.onLoadComplete - Callback when PDF loads
 * @param {Function} props.onError - Callback when error occurs
 * @param {boolean} props.showPageIndicator - Show page indicator (default: true)
 * @param {string} props.errorMessage - Custom error message
 * @param {boolean} props.showWatermark - Show watermark overlay (default: false)
 * @param {string} props.watermarkText - Watermark text (default: 'SAMPLE')
 */
const PDFViewer = ({
  source,
  style,
  onLoadComplete,
  onError,
  showPageIndicator = true,
  errorMessage = 'Unable to load PDF',
  showWatermark = false,
  watermarkText = 'SAMPLE'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfData, setPdfData] = useState(null);

  useEffect(() => {
    loadPDF();
  }, [source]);

  /**
   * Load PDF from source
   * Converts file URI to base64 for WebView rendering
   */
  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!source) {
        throw new Error('No PDF source provided');
      }

      let base64Data = null;

      if (source.base64) {
        // Already base64
        base64Data = source.base64;
        console.log('✅ Using provided base64 data');
      } else if (source.uri) {
        // Read file and convert to base64
        let fileUri = source.uri;
        console.log('📄 Loading PDF from URI:', fileUri);

        // Handle different URI formats
        if (fileUri.startsWith('file://')) {
          fileUri = fileUri.replace('file://', '');
        }

        // Try to read the file
        try {
          base64Data = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('✅ PDF read successfully, size:', Math.round(base64Data.length / 1024), 'KB');
        } catch (readError) {
          console.log('⚠️ Direct read failed, trying with file:// prefix...');

          // Try with file:// prefix
          try {
            base64Data = await FileSystem.readAsStringAsync('file://' + fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            console.log('✅ PDF read with file:// prefix');
          } catch (secondError) {
            // Last attempt: try original URI as-is if it had http/https
            if (source.uri.startsWith('http://') || source.uri.startsWith('https://')) {
              console.log('⚠️ HTTP URL detected, downloading PDF...');
              const downloadResult = await FileSystem.downloadAsync(
                source.uri,
                FileSystem.documentDirectory + 'temp_pdf.pdf'
              );
              base64Data = await FileSystem.readAsStringAsync(downloadResult.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              console.log('✅ PDF downloaded and read');
            } else {
              throw new Error('PDF file not found or cannot be read: ' + source.uri);
            }
          }
        }
      } else {
        throw new Error('Invalid PDF source format');
      }

      if (!base64Data) {
        throw new Error('Failed to load PDF data');
      }

      setPdfData(base64Data);
      setLoading(false);

      console.log('✅ PDF loaded successfully');
      onLoadComplete?.();

    } catch (err) {
      console.error('❌ PDF load error:', err);
      setError(err.message);
      setLoading(false);
      onError?.(err);
    }
  };

  /**
   * Handle WebView load end
   */
  const handleWebViewLoad = () => {
    setLoading(false);
  };

  /**
   * Handle WebView error
   */
  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    setError('Failed to render PDF in viewer');
    setLoading(false);
    onError?.(new Error(nativeEvent.description || 'WebView error'));
  };

  /**
   * Retry loading PDF
   */
  const handleRetry = () => {
    setError(null);
    loadPDF();
  };

  /**
   * Render loading state
   */
  if (loading && !error) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading PDF...</Text>
        <Text style={styles.loadingHint}>Please wait</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <Text style={styles.errorIcon}>📄</Text>
        <Text style={styles.errorTitle}>Unable to Display PDF</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Generate HTML for PDF viewing
   */
  const getHTMLContent = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
              overflow-x: hidden;
              overflow-y: auto;
              position: relative;
            }
            #pdf-container {
              width: 100%;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 10px;
              position: relative;
            }
            iframe {
              width: 100%;
              height: 1000px;
              border: none;
              background: white;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80px;
              font-weight: bold;
              color: rgba(255, 0, 0, 0.15);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              pointer-events: none;
              z-index: 9999;
              text-align: center;
              white-space: nowrap;
              user-select: none;
              -webkit-user-select: none;
              text-transform: uppercase;
              letter-spacing: 10px;
            }
            .watermark-badge {
              position: fixed;
              top: 20px;
              right: 20px;
              background-color: rgba(255, 152, 0, 0.9);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              z-index: 9999;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
              text-transform: uppercase;
            }
            .page-indicator {
              position: fixed;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              background-color: rgba(0, 0, 0, 0.7);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              z-index: 1000;
            }
            .scroll-hint {
              position: fixed;
              bottom: 60px;
              left: 50%;
              transform: translateX(-50%);
              background-color: rgba(0, 0, 0, 0.7);
              color: white;
              padding: 6px 12px;
              border-radius: 15px;
              font-size: 11px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              animation: pulse 2s infinite;
              z-index: 999;
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.7; }
              50% { opacity: 1; }
            }
          </style>
        </head>
        <body>
          ${showWatermark ? `
            <div class="watermark">${watermarkText}</div>
            <div class="watermark-badge">📋 ${watermarkText}</div>
          ` : ''}
          <div id="pdf-container">
            <iframe
              src="data:application/pdf;base64,${pdfData}"
              type="application/pdf"
              frameborder="0"
              scrolling="auto"
              allowfullscreen
            ></iframe>
          </div>
          ${showPageIndicator ? `
            <div class="page-indicator">
              Scroll to view all pages
            </div>
            <div class="scroll-hint">
              ⬇️ Scroll down
            </div>
          ` : ''}
          <script>
            // Remove scroll hint after user scrolls
            window.addEventListener('scroll', function() {
              var hint = document.querySelector('.scroll-hint');
              if (hint && window.scrollY > 50) {
                hint.style.display = 'none';
              }
            });

            // Log when PDF loads
            window.addEventListener('load', function() {
              console.log('PDF viewer loaded');
            });
          </script>
        </body>
      </html>
    `;
  };

  /**
   * Render PDF via WebView
   */
  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: getHTMLContent() }}
        style={styles.webview}
        onLoad={handleWebViewLoad}
        onError={handleWebViewError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        automaticallyAdjustContentInsets={false}
        scalesPageToFit={true}
        bounces={true}
        originWhitelist={['*']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing?.lg || 20,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingText: {
    ...typography?.body,
    color: colors?.text || '#333',
    marginTop: spacing?.md || 12,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingHint: {
    ...typography?.caption,
    color: colors?.textSecondary || '#666',
    marginTop: spacing?.xs || 4,
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: spacing?.lg || 20,
  },
  errorTitle: {
    ...typography?.h3,
    color: colors?.error || '#f44336',
    fontWeight: '600',
    marginBottom: spacing?.sm || 8,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography?.body,
    color: colors?.text || '#333',
    textAlign: 'center',
    marginBottom: spacing?.xs || 4,
  },
  errorDetail: {
    ...typography?.caption,
    color: colors?.textSecondary || '#666',
    textAlign: 'center',
    marginBottom: spacing?.lg || 20,
    paddingHorizontal: spacing?.lg || 20,
  },
  retryButton: {
    backgroundColor: colors?.primary || '#1b6ca3',
    paddingHorizontal: spacing?.xl || 24,
    paddingVertical: spacing?.md || 12,
    borderRadius: 8,
    marginTop: spacing?.md || 12,
  },
  retryButtonText: {
    ...typography?.body,
    color: colors?.white || '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PDFViewer;
