// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import OptimizedImage from '../../../components/OptimizedImage';
import { safeGet, safeString } from '../helpers';

/**
 * TravelInfoSection Component
 * Displays travel information including flight details, accommodation, and visit purpose
 * for immigration officer presentation mode
 */
const TravelInfoSection = ({ travelData, language, formatDateForDisplay, t }) => (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.travelInformation') :
         language === 'thai' ? 'ข้อมูลการเดินทาง' :
         `ข้อมูลการเดินทาง / ${t('progressiveEntryFlow.immigrationOfficer.presentation.travelInformation')}`}
      </Text>

      {/* Flight Information Group */}
      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          ✈️ {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.flightDetails') :
               language === 'thai' ? 'รายละเอียดเที่ยวบิน' :
               `รายละเอียดเที่ยวบิน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.flightDetails')}`}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalFlight') :
             language === 'thai' ? 'เที่ยวบินมา' :
             `เที่ยวบินมา / ${t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalFlight')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {safeGet(travelData, 'arrivalFlight', null) || safeGet(travelData, 'flightNumber', 'N/A')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalDateTime') :
             language === 'thai' ? 'วันและเวลาที่มาถึง' :
             `วันและเวลาที่มาถึง / ${t('progressiveEntryFlow.immigrationOfficer.presentation.arrivalDateTime')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {formatDateForDisplay(travelData?.arrivalDate)}
          </Text>
        </View>

        {travelData?.departureDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.departureDate') :
               language === 'thai' ? 'วันที่เดินทางกลับ' :
               `วันที่เดินทางกลับ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.departureDate')}`}:
            </Text>
            <Text style={styles.infoValue}>
              {formatDateForDisplay(travelData.departureDate)}
            </Text>
          </View>
        )}

        {/* Flight Ticket Photo */}
        {travelData?.arrivalFlightTicketPhotoUri && (
          <TouchableOpacity
            style={styles.documentPhotoContainer}
            onPress={() => {
              Alert.alert(
                language === 'english' ? 'Flight Ticket' :
                language === 'thai' ? 'ตั๋วเครื่องบิน' :
                'ตั๋วเครื่องบิน / Flight Ticket',
                language === 'english' ? 'Tap to view larger image' :
                language === 'thai' ? 'แตะเพื่อดูภาพขนาดใหญ่' :
                'แตะเพื่อดูภาพขนาดใหญ่ / Tap to view larger image'
              );
            }}
          >
            <Text style={styles.documentPhotoLabel}>
              🎫 {language === 'english' ? 'Flight Ticket' :
                  language === 'thai' ? 'ตั๋วเครื่องบิน' :
                  'ตั๋วเครื่องบิน / Flight Ticket'}
            </Text>
            <OptimizedImage
              uri={travelData.arrivalFlightTicketPhotoUri}
              style={styles.documentPhoto}
              resizeMode="contain"
              lazy={true}
              lazyLoadDelay={200}
              placeholder="🎫"
              showLoadingText={false}
            />
            <Text style={styles.documentPhotoHint}>
              {language === 'english' ? 'Tap to enlarge' :
               language === 'thai' ? 'แตะเพื่อขยาย' :
               'แตะเพื่อขยาย'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Accommodation Information Group */}
      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          🏨 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.accommodation') :
               language === 'thai' ? 'ที่พัก' :
               `ที่พัก / ${t('progressiveEntryFlow.immigrationOfficer.presentation.accommodation')}`}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.hotelName') :
             language === 'thai' ? 'ชื่อโรงแรม' :
             `ชื่อโรงแรม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.hotelName')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {safeGet(travelData, 'accommodationName', null) || safeGet(travelData, 'hotelName', 'N/A')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.address') :
             language === 'thai' ? 'ที่อยู่' :
             `ที่อยู่ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.address')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {safeGet(travelData, 'accommodationAddress', null) || safeGet(travelData, 'address', 'N/A')}
          </Text>
        </View>

        {safeGet(travelData, 'accommodationPhone') && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.phone') :
               language === 'thai' ? 'โทรศัพท์' :
               `โทรศัพท์ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.phone')}`}:
            </Text>
            <Text style={styles.infoValue}>
              {safeString(safeGet(travelData, 'accommodationPhone'), 'N/A')}
            </Text>
          </View>
        )}

        {/* Hotel Booking Photo */}
        {travelData?.hotelBookingPhotoUri && (
          <TouchableOpacity
            style={styles.documentPhotoContainer}
            onPress={() => {
              Alert.alert(
                language === 'english' ? 'Hotel Booking' :
                language === 'thai' ? 'การจองโรงแรม' :
                'การจองโรงแรม / Hotel Booking',
                language === 'english' ? 'Tap to view larger image' :
                language === 'thai' ? 'แตะเพื่อดูภาพขนาดใหญ่' :
                'แตะเพื่อดูภาพขนาดใหญ่ / Tap to view larger image'
              );
            }}
          >
            <Text style={styles.documentPhotoLabel}>
              🏨 {language === 'english' ? 'Hotel Booking' :
                  language === 'thai' ? 'การจองโรงแรม' :
                  'การจองโรงแรม / Hotel Booking'}
            </Text>
            <OptimizedImage
              uri={travelData.hotelBookingPhotoUri}
              style={styles.documentPhoto}
              resizeMode="contain"
              lazy={true}
              lazyLoadDelay={250}
              placeholder="🏨"
              showLoadingText={false}
            />
            <Text style={styles.documentPhotoHint}>
              {language === 'english' ? 'Tap to enlarge' :
               language === 'thai' ? 'แตะเพื่อขยาย' :
               'แตะเพื่อขยาย'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Visit Purpose Group */}
      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          🎯 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.visitPurpose') :
               language === 'thai' ? 'จุดประสงค์การเยือน' :
               `จุดประสงค์การเยือน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.visitPurpose')}`}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.purpose') :
             language === 'thai' ? 'จุดประสงค์' :
             `จุดประสงค์ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.purpose')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {safeGet(travelData, 'purposeOfVisit', null) || safeGet(travelData, 'purpose', 'N/A')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.durationOfStay') :
             language === 'thai' ? 'ระยะเวลาพำนัก' :
             `ระยะเวลาพำนัก / ${t('progressiveEntryFlow.immigrationOfficer.presentation.durationOfStay')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {travelData?.durationOfStay || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

const styles = StyleSheet.create({
  infoSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.sm,
  },
  infoGroup: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  documentPhotoContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  documentPhotoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  documentPhoto: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background,
  },
  documentPhotoHint: {
    fontSize: 12,
    color: colors.textSecondary,
    padding: spacing.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TravelInfoSection;
