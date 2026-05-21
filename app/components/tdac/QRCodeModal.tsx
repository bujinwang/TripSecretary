/**
 * QRCodeModal Component
 *
 * Modal component for displaying TDAC QR code
 * Shows QR code with traveler information and save to album functionality
 */

import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, Modal, Image, TouchableOpacity } from 'react-native';
import styles from '../../screens/thailand/TDACWebViewScreen.styles';
import { useTranslation } from '../../i18n/LocaleContext';

const QRCodeModal = ({ visible, onClose, qrCodeData, passport, saveToPhotoAlbum }) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.qrModalOverlay}>
        <View style={styles.qrModalContainer}>
          <View style={styles.qrModalHeader}>
            <Text style={styles.qrModalTitle}>{t('thailand.tdacWebView.qrCodeModal.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.qrCloseButton}
            >
              <Text style={styles.qrCloseButtonText}>{t('thailand.tdacWebView.qrCodeModal.close')}</Text>
            </TouchableOpacity>
          </View>

          {qrCodeData && (
            <View style={styles.qrCodeContent}>
              <Image
                source={{ uri: qrCodeData.src }}
                style={styles.qrCodeImage}
                resizeMode="contain"
              />
              <Text style={styles.qrHint}>
                {t('thailand.tdacWebView.qrCodeModal.hint')}
              </Text>
              <Text style={styles.qrSubHint}>
                {t('thailand.tdacWebView.qrCodeModal.subHint')}
              </Text>

              <View style={styles.qrInfo}>
                <Text style={styles.qrInfoLabel}>{t('thailand.tdacWebView.qrCodeModal.nameLabel')}</Text>
                <Text style={styles.qrInfoValue}>{passport?.nameEn || passport?.name}</Text>

                <Text style={styles.qrInfoLabel}>{t('thailand.tdacWebView.qrCodeModal.passportLabel')}</Text>
                <Text style={styles.qrInfoValue}>{passport?.passportNo}</Text>

                <Text style={styles.qrInfoLabel}>{t('thailand.tdacWebView.qrCodeModal.savedTimeLabel')}</Text>
                <Text style={styles.qrInfoValue}>
                  {qrCodeData.timestamp ? new Date(qrCodeData.timestamp).toLocaleString('zh-CN') : ''}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.qrSaveAgainButton}
                onPress={() => saveToPhotoAlbum(qrCodeData.src)}
              >
                <Text style={styles.qrSaveAgainButtonText}>{t('thailand.tdacWebView.qrCodeModal.saveAgain')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

QRCodeModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  qrCodeData: PropTypes.shape({
    src: PropTypes.string.isRequired,
    timestamp: PropTypes.number,
    arrCardNo: PropTypes.string,
  }),
  passport: PropTypes.shape({
    nameEn: PropTypes.string,
    name: PropTypes.string,
    passportNo: PropTypes.string,
  }),
  saveToPhotoAlbum: PropTypes.func.isRequired,
};

QRCodeModal.defaultProps = {
  qrCodeData: null,
  passport: null,
};

export default QRCodeModal;
