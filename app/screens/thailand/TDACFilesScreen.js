/**
 * TDAC Files Screen
 *
 * Displays all saved TDAC PDFs and QR codes
 * Allows users to view, share, and delete files
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PDFManagementService from '../../services/PDFManagementService';
import { useTranslation } from '../../i18n/LocaleContext';

const TDACFilesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [pdfs, setPdfs] = useState([]);
  const [qrImages, setQrImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pdfs'); // 'pdfs' or 'qr'

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const [loadedPdfs, loadedQrImages] = await Promise.all([
        PDFManagementService.getAllSavedPDFs(),
        PDFManagementService.getAllSavedQRImages()
      ]);

      setPdfs(loadedPdfs);
      setQrImages(loadedQrImages);
    } catch (error) {
      console.error('Failed to load files:', error);
      Alert.alert(
        t('common.error') || 'Error',
        'Failed to load saved files. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFiles();
  };

  const handleSharePDF = async (pdf) => {
    try {
      const result = await PDFManagementService.sharePDF(pdf.filepath);
      if (!result.success) {
        Alert.alert(
          t('common.error') || 'Error',
          result.error || 'Failed to share PDF'
        );
      }
    } catch (error) {
      console.error('Share PDF error:', error);
      Alert.alert(
        t('common.error') || 'Error',
        'Failed to share PDF. Please try again.'
      );
    }
  };

  const handleShareQR = async (qr) => {
    try {
      const result = await PDFManagementService.shareQRImage(qr.filepath);
      if (!result.success) {
        Alert.alert(
          t('common.error') || 'Error',
          result.error || 'Failed to share QR code'
        );
      }
    } catch (error) {
      console.error('Share QR error:', error);
      Alert.alert(
        t('common.error') || 'Error',
        'Failed to share QR code. Please try again.'
      );
    }
  };

  const handleDeletePDF = async (pdf) => {
    Alert.alert(
      t('common.confirm') || 'Confirm',
      `Delete TDAC PDF for ${pdf.arrCardNo}?`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PDFManagementService.deletePDF(pdf.filepath);
              loadFiles(); // Refresh list
            } catch (error) {
              Alert.alert(
                t('common.error') || 'Error',
                'Failed to delete PDF'
              );
            }
          }
        }
      ]
    );
  };

  const handleDeleteQR = async (qr) => {
    Alert.alert(
      t('common.confirm') || 'Confirm',
      `Delete QR code for ${qr.arrCardNo}?`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PDFManagementService.deletePDF(qr.filepath);
              loadFiles(); // Refresh list
            } catch (error) {
              Alert.alert(
                t('common.error') || 'Error',
                'Failed to delete QR code'
              );
            }
          }
        }
      ]
    );
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderPDFItem = ({ item }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileIcon}>
        <Ionicons name="document-text" size={40} color="#E53935" />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>Card No: {item.arrCardNo}</Text>
        <Text style={styles.fileDate}>{formatDate(item.savedAt)}</Text>
        <Text style={styles.fileSize}>{formatFileSize(item.size)}</Text>
      </View>
      <View style={styles.fileActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSharePDF(item)}
        >
          <Ionicons name="share-outline" size={24} color="#1976D2" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeletePDF(item)}
        >
          <Ionicons name="trash-outline" size={24} color="#E53935" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQRItem = ({ item }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileIcon}>
        <Ionicons name="qr-code" size={40} color="#43A047" />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>Card No: {item.arrCardNo}</Text>
        <Text style={styles.fileDate}>{formatDate(item.savedAt)}</Text>
        <Text style={styles.fileSize}>{formatFileSize(item.size)}</Text>
      </View>
      <View style={styles.fileActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShareQR(item)}
        >
          <Ionicons name="share-outline" size={24} color="#1976D2" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteQR(item)}
        >
          <Ionicons name="trash-outline" size={24} color="#E53935" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === 'pdfs' ? 'document-text-outline' : 'qr-code-outline'}
        size={64}
        color="#BDBDBD"
      />
      <Text style={styles.emptyText}>
        {activeTab === 'pdfs'
          ? 'No saved PDFs found'
          : 'No saved QR codes found'}
      </Text>
      <Text style={styles.emptySubtext}>
        Complete a TDAC submission to save files here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading saved files...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pdfs' && styles.activeTab]}
          onPress={() => setActiveTab('pdfs')}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === 'pdfs' ? '#1976D2' : '#757575'}
          />
          <Text style={[styles.tabText, activeTab === 'pdfs' && styles.activeTabText]}>
            PDFs ({pdfs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qr' && styles.activeTab]}
          onPress={() => setActiveTab('qr')}
        >
          <Ionicons
            name="qr-code"
            size={20}
            color={activeTab === 'qr' ? '#1976D2' : '#757575'}
          />
          <Text style={[styles.tabText, activeTab === 'qr' && styles.activeTabText]}>
            QR Codes ({qrImages.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* File List */}
      <FlatList
        data={activeTab === 'pdfs' ? pdfs : qrImages}
        renderItem={activeTab === 'pdfs' ? renderPDFItem : renderQRItem}
        keyExtractor={(item) => item.filename}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={
          (activeTab === 'pdfs' ? pdfs : qrImages).length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976D2'
  },
  tabText: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '500'
  },
  activeTabText: {
    color: '#1976D2',
    fontWeight: '600'
  },
  listContainer: {
    padding: 16
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fileItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  fileIcon: {
    marginRight: 16,
    justifyContent: 'center'
  },
  fileInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4
  },
  fileDate: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2
  },
  fileSize: {
    fontSize: 12,
    color: '#9E9E9E'
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionButton: {
    padding: 8
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32
  }
});

export default TDACFilesScreen;
