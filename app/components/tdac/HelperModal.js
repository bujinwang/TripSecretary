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

const HelperModal = ({ visible, onClose, formFields, renderCopyField }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>复制助手</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕ 关闭</Text>
          </TouchableOpacity>
        </View>

        {/* Copy Helper Content */}
        <ScrollView style={styles.modalContent}>
          {/* Instructions */}
          <View style={styles.instructionBanner}>
            <Text style={styles.instructionIcon}>💡</Text>
            <Text style={styles.instructionText}>
              点击⚡尝试自动填充网页，失败则点"复制"手动粘贴
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
              <Text style={styles.noteTitle}>Step 4: Health Declaration</Text>
              <Text style={styles.noteText}>
                健康声明部分请根据实际情况在网页中选择 Yes 或 No
              </Text>
            </View>
          </View>

          {/* Final Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 完成后记得：</Text>
            <Text style={styles.tipsText}>
              • 提交后会收到确认邮件{'\n'}
              • 邮件中包含QR码{'\n'}
              • 截图保存QR码{'\n'}
              • 入境时出示QR码和护照
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
