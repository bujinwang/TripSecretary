/**
 * FlightInfoSubSection Component
 *
 * Displays arrival and departure flight information
 * Part of TravelDetailsSection
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing } from '../../../../theme';
import { DateTimeInput } from '../../../../components';
import { InputWithValidation } from '../../ThailandTravelComponents';

const FlightInfoSubSection = ({
  // Form state
  arrivalFlightNumber,
  arrivalArrivalDate,
  flightTicketPhoto,
  departureFlightNumber,
  departureDepartureDate,
  // Setters
  setArrivalFlightNumber,
  setArrivalArrivalDate,
  setDepartureFlightNumber,
  setDepartureDepartureDate,
  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  // Actions
  handleFlightTicketPhotoUpload,
  // Styles from parent
  styles,
}) => {
  return (
    <>
      {/* Arrival Flight Section */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>来程机票（入境泰国）</Text>
      </View>

      <InputWithValidation
        label="航班号（来程）"
        value={arrivalFlightNumber}
        onChangeText={(text) => setArrivalFlightNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
        helpText="例如：MU5067"
        error={!!errors.arrivalFlightNumber}
        errorMessage={errors.arrivalFlightNumber}
        warning={!!warnings.arrivalFlightNumber}
        warningMessage={warnings.arrivalFlightNumber}
        fieldName="arrivalFlightNumber"
        lastEditedField={lastEditedField}
        autoCapitalize="characters"
        placeholder="MU5067"
      />

      <DateTimeInput
        label="抵达日期"
        value={arrivalArrivalDate}
        onChangeText={(newValue) => {
          setArrivalArrivalDate(newValue);
          handleFieldBlur('arrivalArrivalDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText="选择到达泰国的日期"
        error={!!errors.arrivalArrivalDate}
        errorMessage={errors.arrivalArrivalDate}
      />

      <View style={styles.documentUploadSection}>
        <Text style={styles.fieldLabel}>机票照片（可选）</Text>
        <Text style={styles.helpText}>
          上传机票照片可以帮助海关快速确认你的行程
        </Text>
        <TouchableOpacity
          style={styles.photoUploadButton}
          onPress={handleFlightTicketPhotoUpload}
        >
          <Text style={styles.photoUploadIcon}>📷</Text>
          <Text style={styles.photoUploadText}>
            {flightTicketPhoto ? '更换机票照片' : '上传机票照片'}
          </Text>
        </TouchableOpacity>
        {flightTicketPhoto && (
          <View style={styles.photoPreview}>
            <Image
              source={{ uri: flightTicketPhoto }}
              style={styles.photoImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {/* Departure Flight Section */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>去程机票（离开泰国）</Text>
      </View>

      <InputWithValidation
        label="航班号（去程）"
        value={departureFlightNumber}
        onChangeText={(text) => setDepartureFlightNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)}
        helpText="例如：MU5068"
        error={!!errors.departureFlightNumber}
        errorMessage={errors.departureFlightNumber}
        warning={!!warnings.departureFlightNumber}
        warningMessage={warnings.departureFlightNumber}
        fieldName="departureFlightNumber"
        lastEditedField={lastEditedField}
        autoCapitalize="characters"
        placeholder="MU5068"
      />

      <DateTimeInput
        label="离开日期"
        value={departureDepartureDate}
        onChangeText={(newValue) => {
          setDepartureDepartureDate(newValue);
          setTimeout(() => {
            handleFieldBlur('departureDepartureDate', newValue);
          }, 100);
        }}
        mode="date"
        dateType="future"
        helpText="选择离开泰国的日期"
        error={!!errors.departureDepartureDate}
        errorMessage={errors.departureDepartureDate}
      />
    </>
  );
};

const localStyles = StyleSheet.create({
  subSectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subSectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  documentUploadSection: {
    marginBottom: spacing.md,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#f8f9fa',
  },
  photoUploadIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  photoUploadText: {
    ...typography.body2,
    color: colors.primary,
  },
  photoPreview: {
    marginTop: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
  },
});

export default FlightInfoSubSection;
