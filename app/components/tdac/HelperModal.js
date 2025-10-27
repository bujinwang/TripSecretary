/**
 * HelperModal Component
 *
 * Modal component for TDAC WebView copy helper
 * Displays form fields organized by section with copy/autofill functionality
 */

import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, Modal, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import styles from '../../screens/thailand/TDACWebViewScreen.styles';
import { useTranslation } from '../../i18n/LocaleContext';

const HelperModal = ({ visible, onClose, formFields, renderCopyField }) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('thailand.tdacWebView.helperModal.title')}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>{t('thailand.tdacWebView.helperModal.close')}</Text>
          </TouchableOpacity>
        </View>

        {/* Copy Helper Content */}
        <ScrollView style={styles.modalContent}>
          {/* Instructions */}
          <View style={styles.instructionBanner}>
            <Text style={styles.instructionIcon}>💡</Text>
            <Text style={styles.instructionText}>
              {t('thailand.tdacWebView.helperModal.instruction')}
            </Text>
          </View>

          {/* Step 1: Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.stepBadge}>1</Text>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            {formFields
              .filter((f) => f.section === 'personal')
              .map((item) => renderCopyField(item))}
          </View>

          {/* Step 2: Trip Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.stepBadge}>2</Text>
              <Text style={styles.sectionTitle}>Trip & Accommodation</Text>
            </View>
            {formFields
              .filter((f) => f.section === 'trip')
              .map((item) => renderCopyField(item))}
          </View>

          {/* Step 3: Accommodation */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.stepBadge}>3</Text>
              <Text style={styles.sectionTitle}>Accommodation</Text>
            </View>
            {formFields
              .filter((f) => f.section === 'accommodation')
              .map((item) => renderCopyField(item))}
          </View>

          {/* Health Declaration Note */}
          <View style={styles.noteCard}>
            <Text style={styles.noteIcon}>⚠️</Text>
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>{t('thailand.tdacWebView.helperModal.healthDeclaration.title')}</Text>
              <Text style={styles.noteText}>
                {t('thailand.tdacWebView.helperModal.healthDeclaration.note')}
              </Text>
            </View>
          </View>

          {/* Final Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>{t('thailand.tdacWebView.helperModal.tips.title')}</Text>
            <Text style={styles.tipsText}>
              {t('thailand.tdacWebView.helperModal.tips.items')}
            </Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

HelperModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formFields: PropTypes.arrayOf(PropTypes.shape({
    section: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    labelCn: PropTypes.string,
    value: PropTypes.any,
    field: PropTypes.string.isRequired,
    searchTerms: PropTypes.arrayOf(PropTypes.string),
  })).isRequired,
  renderCopyField: PropTypes.func.isRequired,
};

export default HelperModal;
