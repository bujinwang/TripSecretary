/**
 * DataComparisonModal Component
 *
 * DEV mode only modal for comparing entry data with TDAC submission
 * Helps debug data transformation and field mapping
 */

import React from 'react';
// @ts-ignore - prop-types has no TypeScript declarations
import PropTypes from 'prop-types';
import { View, Text, Modal, ScrollView, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../../screens/thailand/TDACWebViewScreen.styles';

interface FieldMapping {
  status: 'mapped' | 'transformed' | 'error';
  source: string;
  originalValue: unknown;
  tdacValue: unknown;
  transformation?: string;
  notes?: string;
}

interface DataComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  comparisonData?: Record<string, unknown> | null;
  onRefresh: () => void;
}

const DataComparisonModal = ({ visible, onClose, comparisonData, onRefresh }: DataComparisonModalProps) => {
  const handleExport = () => {
    if (!comparisonData) {
return;
}

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

        {comparisonData && (() => {
          const data = comparisonData as Record<string, unknown>;
          const summary = data.summary as Record<string, number>;
          const validationResults = data.validationResults as Record<string, boolean>;
          const fieldMappings = data.fieldMappings as Record<string, FieldMapping>;
          return (
          <ScrollView style={styles.comparisonContent} showsVerticalScrollIndicator={true}>
            {/* Summary Section */}
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonSectionTitle}>📊 Summary</Text>
              <View style={styles.comparisonSummary}>
                <View style={styles.comparisonSummaryItem}>
                  <Text style={styles.comparisonSummaryLabel}>Total Fields:</Text>
                  <Text style={styles.comparisonSummaryValue}>{summary.totalFields}</Text>
                </View>
                <View style={styles.comparisonSummaryItem}>
                  <Text style={styles.comparisonSummaryLabel}>Valid Mappings:</Text>
                  <Text style={[
                    styles.comparisonSummaryValue,
                    { color: summary.accuracy >= 90 ? '#4CAF50' : summary.accuracy >= 70 ? '#FF9800' : '#F44336' }
                  ]}>
                    {summary.validFields}/{summary.totalFields} ({summary.accuracy}%)
                  </Text>
                </View>
                <View style={styles.comparisonSummaryItem}>
                  <Text style={styles.comparisonSummaryLabel}>Overall Status:</Text>
                  <Text style={[
                    styles.comparisonSummaryValue,
                    { color: validationResults.overall ? '#4CAF50' : '#F44336' }
                  ]}>
                    {validationResults.overall ? '✅ VALID' : '❌ ISSUES'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Field Mappings */}
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonSectionTitle}>🔄 Field Mappings</Text>
              {Object.entries(fieldMappings).map(([fieldName, mapping]: [string, FieldMapping]) => (
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

                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Source:</Text>
                    <Text style={styles.comparisonFieldSource}>{mapping.source}</Text>
                  </View>

                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Original:</Text>
                    <Text style={styles.comparisonValue}>{String(mapping.originalValue)}</Text>
                  </View>

                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>TDAC:</Text>
                    <Text style={styles.comparisonValue}>{String(mapping.tdacValue)}</Text>
                  </View>

                  {mapping.transformation && (
                    <View style={styles.comparisonRow}>
                      <Text style={styles.comparisonLabel}>Transform:</Text>
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
          );
        })()}
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
