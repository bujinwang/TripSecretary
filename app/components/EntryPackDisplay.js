import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import TDACInfoCard from './TDACInfoCard';
import { thailandProvinces } from '../data/thailandProvinces';

const { width: screenWidth } = Dimensions.get('window');
const QR_SIZE = Math.min(screenWidth * 0.6, 250);

const EntryPackDisplay = ({
  entryPack,
  personalInfo,
  travelInfo,
  funds,
  onClose,
  isModal = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const fallbackHotelText = 'โปรดระบุที่อยู่ที่พัก / Please provide hotel address';

  const formatProvinceThaiEnglish = (value) => {
    if (!value || typeof value !== 'string') return '';
    const raw = value.trim();
    if (!raw) return '';

    const normalizedCode = raw.toUpperCase();
    let province = thailandProvinces.find(p => p.code === normalizedCode);

    if (!province) {
      const lower = raw.toLowerCase();
      province = thailandProvinces.find(
        p => p.name?.toLowerCase() === lower || p.nameZh === raw || p.nameTh === raw
      );
    }

    if (!province) return '';
    const thaiName = province.nameTh || province.name || raw;
    const englishName = province.name || raw;
    return `${thaiName} / ${englishName}`;
  };

  if (!entryPack) {
    return null;
  }

  const formatBilingualDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';

      const thaiDate = date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const englishDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return `${thaiDate} / ${englishDate}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatBilingualCurrency = (amount, currency = 'THB') => {
    if (amount === null || amount === undefined) return '';

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      return `${amount} ${currency}`;
    }

    const thaiFormatted = numericAmount.toLocaleString('th-TH');
    const englishFormatted = numericAmount.toLocaleString('en-US');
    const thaiCurrency = currency === 'THB' ? 'บาท' : currency;

    return `${thaiFormatted} ${thaiCurrency} / ${englishFormatted} ${currency}`;
  };

  const totalFunds = useMemo(() => {
    if (!Array.isArray(funds)) return 0;
    return funds.reduce((sum, fund) => {
      const numericAmount = Number(fund?.amount);
      return sum + (Number.isNaN(numericAmount) ? 0 : numericAmount);
    }, 0);
  }, [funds]);

  const hotelProvinceDisplay = useMemo(() => {
    const candidates = [
      travelInfo?.province,
      travelInfo?.provinceCode,
      travelInfo?.provinceName,
      travelInfo?.hotelProvince,
      travelInfo?.hotelProvinceCode,
      travelInfo?.state,
    ];

    for (const candidate of candidates) {
      const display = formatProvinceThaiEnglish(candidate);
      if (display) return display;
    }

    return '';
  }, [
    travelInfo?.province,
    travelInfo?.provinceCode,
    travelInfo?.provinceName,
    travelInfo?.hotelProvince,
    travelInfo?.hotelProvinceCode,
    travelInfo?.state,
  ]);

  const stayLocationAnswer = useMemo(() => {
    const address = typeof travelInfo?.hotelAddress === 'string' ? travelInfo.hotelAddress.trim() : '';

    if (hotelProvinceDisplay && address) {
      return `${hotelProvinceDisplay}\n${address}`;
    }

    if (hotelProvinceDisplay) {
      return hotelProvinceDisplay;
    }

    if (address) {
      return address;
    }

    return fallbackHotelText;
  }, [hotelProvinceDisplay, travelInfo?.hotelAddress]);

  const getFundTypeLabel = (type) => {
    switch (type) {
      case 'cash':
        return 'เงินสด / Cash';
      case 'credit_card':
        return 'บัตรเครดิต / Credit Card';
      case 'bank_balance':
        return 'ยอดเงินฝากธนาคาร / Bank Balance';
      case 'investment':
        return 'การลงทุน / Investments';
      case 'card':
        return 'บัตรธนาคาร / Bank Card';
      case 'debit_card':
        return 'บัตรเดบิต / Debit Card';
      default:
        return type ? `${type} / ${type}` : 'อื่น ๆ / Other';
    }
  };

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 ภาพรวมชุดข้อมูลเข้าเมือง / Entry Pack Overview</Text>

      <View style={styles.overviewGrid}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>หมายเลขบัตรเข้าเมือง</Text>
          <Text style={styles.overviewValue}>
            {entryPack.tdacSubmission?.arrCardNo || 'ยังไม่มี / Not available'}
          </Text>
        </View>

        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>วันเข้าประเทศ</Text>
          <Text style={styles.overviewValue}>
            {formatBilingualDate(travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate)}
          </Text>
        </View>

        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>ยอดรวมเงินทุน</Text>
          <Text style={styles.overviewValue}>
            {formatBilingualCurrency(totalFunds)}
          </Text>
        </View>

        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>หมายเลขหนังสือเดินทาง</Text>
          <Text style={styles.overviewValue}>
            {entryPack?.passport?.passportNumber || personalInfo?.passportNumber || 'ยังไม่ได้กรอก / Not provided'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👤 ข้อมูลส่วนบุคคล / Personal Information</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ชื่อเต็ม / Full Name:</Text>
          <Text style={styles.infoValue}>
            {entryPack?.passport?.fullName || personalInfo?.fullName || 'ยังไม่ได้กรอก / Not provided'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>หมายเลขหนังสือเดินทาง / Passport Number:</Text>
          <Text style={styles.infoValue}>
            {entryPack?.passport?.passportNumber || personalInfo?.passportNumber || 'ยังไม่ได้กรอก / Not provided'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>สัญชาติ / Nationality:</Text>
          <Text style={styles.infoValue}>
            {entryPack?.passport?.nationality || personalInfo?.nationality || 'ยังไม่ได้กรอก / Not provided'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>วันเกิด / Date of Birth:</Text>
          <Text style={styles.infoValue}>
            {formatBilingualDate(entryPack?.passport?.dateOfBirth || personalInfo?.dateOfBirth)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTravelInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>✈️ ข้อมูลการเดินทาง / Travel Information</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>วันเข้าประเทศ / Arrival Date:</Text>
          <Text style={styles.infoValue}>
            {formatBilingualDate(travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>จังหวัด / Province:</Text>
          <Text style={styles.infoValue}>
            {hotelProvinceDisplay || 'ยังไม่ได้กรอก / Not provided'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>เที่ยวบิน / Flight Number:</Text>
          <Text style={styles.infoValue}>
            {travelInfo?.arrivalFlightNumber || travelInfo?.flightNumber || 'ยังไม่ได้กรอก / Not provided'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>วัตถุประสงค์การเดินทาง / Purpose of Visit:</Text>
          <Text style={styles.infoValue}>
            {travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'ยังไม่ได้กรอก / Not provided'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ที่อยู่ที่พัก / Hotel Address:</Text>
          <Text style={styles.infoValue}>
            {travelInfo?.hotelAddress || 'ยังไม่ได้กรอก / Not provided'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFundsInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💰 ข้อมูลเงินทุน / Funds Information</Text>

      {funds && funds.length > 0 ? (
        funds.map((fund, index) => (
          <View key={index} style={styles.fundItem}>
            <View style={styles.fundHeader}>
              <Text style={styles.fundType}>
                {getFundTypeLabel(fund.type)}
              </Text>
              <Text style={styles.fundAmount}>
                {formatBilingualCurrency(fund.amount, fund.currency)}
              </Text>
            </View>

            {(fund.details || fund.description) && (
              <Text style={styles.fundDescription}>
                {fund.details || fund.description}
              </Text>
            )}

            {(fund.photoUri || fund.proofPhoto) && (
              <Text style={styles.fundProof}>
                📸 มีหลักฐานรูปภาพแล้ว / Proof photo uploaded
              </Text>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noData}>ยังไม่มีข้อมูลเงินทุน / No funds information</Text>
      )}

      <View style={styles.fundsTotal}>
        <Text style={styles.totalLabel}>ยอดรวม / Total:</Text>
        <Text style={styles.totalAmount}>
          {formatBilingualCurrency(totalFunds)}
        </Text>
      </View>
    </View>
  );

  const renderTDACInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🛂 บัตรเข้าเมือง TDAC / TDAC Entry Card</Text>

      {entryPack.tdacSubmission && entryPack.tdacSubmission.arrCardNo ? (
        <TDACInfoCard
          tdacSubmission={entryPack.tdacSubmission}
          isReadOnly={true}
        />
      ) : (
        <View style={styles.tdacPlaceholder}>
          <View style={styles.placeholderIcon}>
            <Text style={styles.placeholderIconText}>📱</Text>
          </View>
          <Text style={styles.placeholderTitle}>
            ยังไม่ได้ส่ง TDAC / TDAC Not Submitted Yet
          </Text>
          <Text style={styles.placeholderDescription}>
            กรุณาส่งแบบฟอร์ม TDAC ภายใน 72 ชั่วโมงก่อนเดินทางถึง / Please submit TDAC within 72 hours before arrival
          </Text>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>
              จะแสดงรหัส QR หลังจากส่งเรียบร้อย / QR Code will appear after submission
            </Text>
          </View>
          <Text style={styles.placeholderNote}>
            หากยังไม่มี TDAC สามารถแสดงข้อมูลอื่นให้เจ้าหน้าที่ตรวจคนเข้าเมืองได้ / You can still show other information to immigration officer even without TDAC
          </Text>
        </View>
      )}
    </View>
  );

  const renderImmigrationTips = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💡 คำถามที่พบบ่อยจากเจ้าหน้าที่ตรวจคนเข้าเมือง / Immigration Officer FAQs</Text>

      <View style={styles.tipsList}>
        <View style={styles.tipItem}>
          <Text style={styles.tipQuestion}>Q: จุดประสงค์ในการมาไทยคืออะไร? / What is the purpose of your visit?</Text>
          <Text style={styles.tipAnswer}>
            A: {travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'ท่องเที่ยว / Tourism'}
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Text style={styles.tipQuestion}>Q: คุณจะพำนักในประเทศไทยนานเท่าใด? / How long will you stay in Thailand?</Text>
          <Text style={styles.tipAnswer}>
            A: {travelInfo?.lengthOfStay || '30 วัน / 30 days'}
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Text style={styles.tipQuestion}>Q: คุณจะพักที่ไหน? / Where will you be staying?</Text>
          <Text style={styles.tipAnswer}>
            A: {stayLocationAnswer}
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Text style={styles.tipQuestion}>Q: คุณมีเงินทุนเท่าไร? / How much money do you have?</Text>
          <Text style={styles.tipAnswer}>
            A: {formatBilingualCurrency(totalFunds)} (เงินสดและบัตรธนาคาร / Cash and bank cards)
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'personal':
        return renderPersonalInfo();
      case 'travel':
        return renderTravelInfo();
      case 'funds':
        return renderFundsInfo();
      case 'tdac':
        return renderTDACInfo();
      case 'tips':
        return renderImmigrationTips();
      default:
        return renderOverview();
    }
  };

  const tabs = [
    { key: 'overview', label: 'ภาพรวม', labelEn: 'Overview' },
    { key: 'personal', label: 'ข้อมูลส่วนตัว', labelEn: 'Personal' },
    { key: 'travel', label: 'ข้อมูลการเดินทาง', labelEn: 'Travel' },
    { key: 'funds', label: 'เงินทุน', labelEn: 'Funds' },
    { key: 'tdac', label: 'บัตร TDAC', labelEn: 'TDAC' },
    { key: 'tips', label: 'คำถาม-คำตอบ', labelEn: 'FAQs' },
  ];

  return (
    <View style={[styles.container, isModal && styles.modalContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🇹🇭 ชุดข้อมูลตรวจคนเข้าเมือง / Entry Pack</Text>
        <Text style={styles.subtitle}>ข้อมูลสำคัญสำหรับเจ้าหน้าที่ตรวจคนเข้าเมือง / Important information for immigration officer</Text>

        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            <Text style={[styles.tabTextEn, activeTab === tab.key && styles.activeTabText]}>
              {tab.labelEn}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          กรุณาแสดงชุดข้อมูลนี้ต่อเจ้าหน้าที่ตรวจคนเข้าเมือง / Please show this entry pack to the immigration officer
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalContainer: {
    margin: spacing.md,
    borderRadius: 16,
    maxHeight: '90%',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    ...typography.h2,
    color: colors.surface,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.surface,
    opacity: 0.9,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  tabContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  tabTextEn: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  activeTabText: {
    color: colors.surface,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  overviewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  overviewValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  infoGrid: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  fundItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fundType: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  fundAmount: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  fundDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fundProof: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  },
  fundsTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.surface,
    fontWeight: '600',
  },
  totalAmount: {
    ...typography.h2,
    color: colors.surface,
    fontWeight: '700',
  },
  noData: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  tdacPlaceholder: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  placeholderIconText: {
    fontSize: 30,
    color: colors.surface,
  },
  placeholderTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  placeholderDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  qrPlaceholder: {
    width: QR_SIZE,
    height: QR_SIZE * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  qrPlaceholderText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  placeholderNote: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
    fontWeight: '500',
  },
  tipsList: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
  },
  tipItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tipQuestion: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  tipAnswer: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EntryPackDisplay;
