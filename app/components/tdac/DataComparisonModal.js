/**
 * DataComparisonModal Component
 *
 * DEV mode only modal for comparing entry data with TDAC submission
 * Helps debug data transformation and field mapping
 */

import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, Modal, SafeAreaView, ScrollView, TouchableOpacity, Alert, Clipboard } from 'react-native';
import styles from '../../screens/thailand/TDACWebViewScreen.styles';

const DataComparisonModal = ({ visible, onClose, comparisonData, onRefresh }) => {
  const handleExport = () => {
    if (!comparisonData) return;

    const exportData = {
      comparison: comparisonData,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };

    Clipboard.setString(JSON.stringify(exportData, null, 2));
    Alert.alert('✅ Exported', 'Comparison data copied to clipboard');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.comparisonContainer}>
        <View style={styles.comparisonHeader}>
          <View style={styles.comparisonHeaderLeft}>
            <Text style={styles.comparisonTitle}>🔍 Data Comparison</Text>
            <Text style={styles.comparisonSubtitle}>Entry Info vs TDAC Submission</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.comparisonCloseButton}
            activeOpacity={0.7}
          >
            <Text style={styles.comparisonCloseButtonText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        {comparisonData && (
          <ScrollView style={styles.comparisonContent} showsVerticalScrollIndicator={true}>
            {/* Summary Section */}
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonSectionTitle}>📊 Summary</Text>
              <View style={styles.comparisonSummary}>
                <View style={styles.comparisonSummaryItem}>
                  <Text style={styles.comparisonSummaryLabel}>Total Fields:</Text>
                  <Text style={styles.comparisonSummaryValue}>{comparisonData.summary.totalFields}</Text>
                </View>
                <View style={styles.comparisonSummaryItem}>
                  <Text style={styles.comparisonSummaryLabel}>Valid Mappings:</Text>
                  <Text style={[
                    styles.comparisonSummaryValue,
                    { color: comparisonData.summary.accuracy >= 90 ? '#4CAF50' : comparisonData.summary.accuracy >= 70 ? '#FF9800' : '#F44336' }
                  ]}>
                    {comparisonData.summary.validFields}/{comparisonData.summary.totalFields} ({comparisonData.summary.accuracy}%)
                  </Text>
                </View>
                <View style={styles.comparisonSummaryItem}>
                  <Text style={styles.comparisonSummaryLabel}>Overall Status:</Text>
                  <Text style={[
                    styles.comparisonSummaryValue,
                    { color: comparisonData.validationResults.overall ? '#4CAF50' : '#F44336' }
                  ]}>
                    {comparisonData.validationResults.overall ? '✅ VALID' : '❌ ISSUES'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Field Mappings */}
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonSectionTitle}>🔄 Field Mappings</Text>
              {Object.entries(comparisonData.fieldMappings).map(([fieldName, mapping]) => (
                <View key={fieldName} style={[
                  styles.comparisonFieldItem,
                  mapping.status === 'error' && styles.comparisonFieldItemError,
                  mapping.status === 'transformed' && styles.comparisonFieldItemWarning
                ]}>
                  <View style={styles.comparisonFieldHeader}>
                    <Text style={styles.comparisonFieldName}>{fieldName}</Text>
                    <Text style={[
                      styles.comparisonFieldStatus,
                      { color: mapping.status === 'mapped' ? '#4CAF50' : mapping.status === 'transformed' ? '#FF9800' : '#F44336' }
                    ]}>
                      {mapping.status === 'mapped' ? '✅' : mapping.status === 'transformed' ? '🔄' : '❌'}
                    </Text>
                  </View>

                  <View style={styles.comparisonFieldRow}>
                    <Text style={styles.comparisonFieldLabel}>Source:</Text>
                    <Text style={styles.comparisonFieldSource}>{mapping.source}</Text>
                  </View>

                  <View style={styles.comparisonFieldRow}>
                    <Text style={styles.comparisonFieldLabel}>Original:</Text>
                    <Text style={styles.comparisonFieldValue}>{String(mapping.originalValue)}</Text>
                  </View>

                  <View style={styles.comparisonFieldRow}>
                    <Text style={styles.comparisonFieldLabel}>TDAC:</Text>
                    <Text style={styles.comparisonFieldValue}>{String(mapping.tdacValue)}</Text>
                  </View>

                  {mapping.transformation && (
                    <View style={styles.comparisonFieldRow}>
                      <Text style={styles.comparisonFieldLabel}>Transform:</Text>
                      <Text style={styles.comparisonFieldTransform}>{mapping.transformation}</Text>
                    </View>
                  )}

                  {mapping.notes && (
                    <View style={styles.comparisonFieldNotes}>
                      <Text style={styles.comparisonFieldNotesText}>{mapping.notes}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Complete Payload Preview */}
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonSectionTitle}>📋 Complete TDAC Payload</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.comparisonPayloadScroll}>
                <Text style={styles.comparisonPayload}>
                  {JSON.stringify(comparisonData.tdacSubmissionData, null, 2)}
                </Text>
              </ScrollView>
            </View>

            {/* Actions */}
            <View style={styles.comparisonActions}>
              <TouchableOpacity
                style={styles.comparisonRefreshButton}
                onPress={() => {
                  onRefresh();
                  console.log('🔄 Data comparison refreshed');
                }}
              >
                <Text style={styles.comparisonRefreshButtonText}>🔄 Refresh Comparison</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.comparisonExportButton}
                onPress={handleExport}
              >
                <Text style={styles.comparisonExportButtonText}>📋 Export Data</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

DataComparisonModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  comparisonData: PropTypes.shape({
    summary: PropTypes.shape({
      totalFields: PropTypes.number,
      validFields: PropTypes.number,
      accuracy: PropTypes.number,
    }),
    fieldMappings: PropTypes.object,
    validationResults: PropTypes.shape({
      overall: PropTypes.bool,
    }),
    tdacSubmissionData: PropTypes.object,
  }),
  onRefresh: PropTypes.func.isRequired,
};

DataComparisonModal.defaultProps = {
  comparisonData: null,
};

export default DataComparisonModal;
