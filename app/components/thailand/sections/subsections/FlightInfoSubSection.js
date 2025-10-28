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
  departureFlightTicketPhoto,
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
  handleDepartureFlightTicketPhotoUpload,
  // Styles from parent
  styles: parentStyles,
}) => {
  // Use parent styles if provided, otherwise use local styles
  const styles = parentStyles || localStyles;

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

      {/* Photo Upload Card */}
      <View style={styles.photoUploadCard}>
        <View style={styles.photoUploadHeader}>
          <Text style={styles.photoUploadTitle}>📸 机票照片（可选）</Text>
        </View>

        <View style={styles.photoInfoBox}>
          <Text style={styles.photoInfoIcon}>💡</Text>
          <Text style={styles.photoInfoText}>
            上传机票照片可以帮助海关快速确认你的行程
          </Text>
        </View>

        {!flightTicketPhoto ? (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleFlightTicketPhotoUpload}
          >
            <View style={styles.uploadButtonContent}>
              <View style={styles.uploadIconCircle}>
                <Text style={styles.uploadIcon}>📷</Text>
              </View>
              <Text style={styles.uploadButtonText}>点击上传机票照片</Text>
              <Text style={styles.uploadButtonSubtext}>支持 JPG, PNG 格式</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.photoPreviewContainer}>
            <Image
              source={{ uri: flightTicketPhoto }}
              style={styles.photoImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handleFlightTicketPhotoUpload}
            >
              <Text style={styles.changePhotoIcon}>🔄</Text>
              <Text style={styles.changePhotoText}>更换照片</Text>
            </TouchableOpacity>
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

      {/* Departure Flight Photo Upload Card */}
      <View style={styles.photoUploadCard}>
        <View style={styles.photoUploadHeader}>
          <Text style={styles.photoUploadTitle}>📸 离境机票照片（可选）</Text>
        </View>

        <View style={styles.photoInfoBox}>
          <Text style={styles.photoInfoIcon}>💡</Text>
          <Text style={styles.photoInfoText}>
            上传离境机票照片可以帮助海关确认你的返程计划
          </Text>
        </View>

        {!departureFlightTicketPhoto ? (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleDepartureFlightTicketPhotoUpload}
          >
            <View style={styles.uploadButtonContent}>
              <View style={styles.uploadIconCircle}>
                <Text style={styles.uploadIcon}>📷</Text>
              </View>
              <Text style={styles.uploadButtonText}>点击上传离境机票照片</Text>
              <Text style={styles.uploadButtonSubtext}>支持 JPG, PNG 格式</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.photoPreviewContainer}>
            <Image
              source={{ uri: departureFlightTicketPhoto }}
              style={styles.photoImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handleDepartureFlightTicketPhotoUpload}
            >
              <Text style={styles.changePhotoIcon}>🔄</Text>
              <Text style={styles.changePhotoText}>更换照片</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  photoUploadCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoUploadHeader: {
    marginBottom: spacing.sm,
  },
  photoUploadTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    fontSize: 16,
  },
  photoInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  photoInfoIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  photoInfoText: {
    ...typography.caption,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: spacing.lg,
    backgroundColor: '#F0F7FF',
  },
  uploadButtonContent: {
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  uploadButtonSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  changePhotoIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  changePhotoText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
});

export default FlightInfoSubSection;
