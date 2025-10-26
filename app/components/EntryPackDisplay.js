import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import TDACInfoCard from './TDACInfoCard';
import { thailandProvinces } from '../data/thailandProvinces';
import { hongkongDistricts, getAllDistricts } from '../data/hongkongLocations';

const { width: screenWidth } = Dimensions.get('window');
const QR_SIZE = Math.min(screenWidth * 0.6, 250);

// Country-specific configurations
const countryConfigs = {
  thailand: {
    entryCardName: 'TDAC',
    entryCardTab: 'tdac',
    entryCardTitle: 'บัตรเข้าเมือง TDAC / TDAC Entry Card',
    personalInfoTitle: 'ข้อมูลส่วนบุคคล / Personal Information',
    travelInfoTitle: 'ข้อมูลการเดินทาง / Travel Information',
    fundsTitle: 'ข้อมูลเงินพกพา / Funds Information',
    currency: 'THB',
    currencyName: 'บาท',
    notProvided: 'ยังไม่ได้กรอก / Not provided',
    fallbackHotelText: 'โปรดระบุที่อยู่ที่พัก / Please provide hotel address',
    labels: {
      fullName: 'ชื่อเต็ม / Full Name',
      passportNumber: 'หมายเลขหนังสือเดินทาง / Passport Number',
      nationality: 'สัญชาติ / Nationality',
      dateOfBirth: 'วันเกิด / Date of Birth',
      arrivalDate: 'วันเข้าประเทศ / Arrival Date',
      departureDate: 'วันออกจากประเทศ / Departure Date',
      flightNumber: 'เที่ยวบิน / Flight Number',
      stayLocation: 'สถานที่พัก / Stay Location',
      lengthOfStay: 'ระยะเวลาพัก / Length of Stay',
      purpose: 'วัตถุประสงค์ / Purpose of Visit',
      totalFunds: 'เงินพกพาทั้งหมด / Total Funds',
      fundType: 'ประเภท / Type',
      amount: 'จำนวนเงิน / Amount'
    },
    dateLocales: ['th-TH', 'en-US']
  },
  malaysia: {
    entryCardName: 'MDAC',
    entryCardTab: 'mdac',
    entryCardTitle: 'MDAC Entry Card / Kad Ketibaan Digital Malaysia',
    personalInfoTitle: 'Personal Information / Maklumat Peribadi',
    travelInfoTitle: 'Travel Information / Maklumat Perjalanan',
    fundsTitle: 'Funds Information / Maklumat Kewangan',
    currency: 'MYR',
    currencyName: 'Ringgit',
    notProvided: 'Not provided / Tidak diberikan',
    fallbackHotelText: 'Please provide hotel address / Sila berikan alamat hotel',
    labels: {
      fullName: 'Full Name / Nama Penuh',
      passportNumber: 'Passport Number / Nombor Pasport',
      nationality: 'Nationality / Warganegara',
      dateOfBirth: 'Date of Birth / Tarikh Lahir',
      arrivalDate: 'Arrival Date / Tarikh Ketibaan',
      departureDate: 'Departure Date / Tarikh Berlepas',
      flightNumber: 'Flight Number / Nombor Penerbangan',
      stayLocation: 'Stay Location / Lokasi Penginapan',
      lengthOfStay: 'Length of Stay / Tempoh Penginapan',
      purpose: 'Purpose of Visit / Tujuan Lawatan',
      totalFunds: 'Total Funds / Jumlah Wang',
      fundType: 'Type / Jenis',
      amount: 'Amount / Jumlah'
    },
    dateLocales: ['en-US', 'ms-MY']
  },
  hongkong: {
    entryCardName: 'HDAC',
    entryCardTab: 'hdac',
    entryCardTitle: '香港入境資料 / Hong Kong Entry Information',
    personalInfoTitle: '個人資料 / Personal Information',
    travelInfoTitle: '旅行資料 / Travel Information',
    fundsTitle: '資金證明 / Funds Information',
    currency: 'HKD',
    currencyName: '港幣',
    notProvided: '未提供 / Not provided',
    fallbackHotelText: '請提供住宿地址 / Please provide accommodation address',
    labels: {
      fullName: '全名 / Full Name',
      passportNumber: '護照號碼 / Passport Number',
      nationality: '國籍 / Nationality',
      dateOfBirth: '出生日期 / Date of Birth',
      arrivalDate: '抵達日期 / Arrival Date',
      departureDate: '離開日期 / Departure Date',
      flightNumber: '航班號碼 / Flight Number',
      stayLocation: '住宿地點 / Stay Location',
      lengthOfStay: '停留時間 / Length of Stay',
      purpose: '訪問目的 / Purpose of Visit',
      totalFunds: '總資金 / Total Funds',
      fundType: '類型 / Type',
      amount: '金額 / Amount'
    },
    dateLocales: ['zh-HK', 'en-US']
  }
};

const EntryPackDisplay = ({
  entryPack,
  personalInfo,
  travelInfo,
  funds,
  onClose,
  isModal = false,
  country = 'thailand'
}) => {
  const config = countryConfigs[country] || countryConfigs.thailand;
  const [activeTab, setActiveTab] = useState(config.entryCardTab);

  const fallbackHotelText = config.fallbackHotelText;

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

  const formatDistrictHongKongBilingual = (value) => {
    if (!value || typeof value !== 'string') return '';
    const raw = value.trim();
    if (!raw) return '';

    // Get all Hong Kong districts
    const allDistricts = getAllDistricts();

    // Try to find by exact match (nameEn or nameZh)
    let district = allDistricts.find(
      d => d.nameEn === raw || d.nameZh === raw || d.nameEn.toLowerCase() === raw.toLowerCase()
    );

    if (!district) {
      // Try partial match
      district = allDistricts.find(
        d => d.nameEn.toLowerCase().includes(raw.toLowerCase()) ||
             d.nameZh.includes(raw)
      );
    }

    if (!district) return raw; // Return original if not found

    // Format as: 繁體中文 / English
    return `${district.nameZh} / ${district.nameEn}`;
  };

  // Country-aware location formatter
  const formatLocationBilingual = (value) => {
    if (country === 'hongkong') {
      return formatDistrictHongKongBilingual(value);
    } else if (country === 'thailand') {
      return formatProvinceThaiEnglish(value);
    }
    return value || '';
  };

  if (!entryPack) {
    return null;
  }

  const formatBilingualDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';

      const locale1 = config.dateLocales[0];
      const locale2 = config.dateLocales[1];

      const date1 = date.toLocaleDateString(locale1, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const date2 = date.toLocaleDateString(locale2, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return `${date1} / ${date2}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatBilingualCurrency = (amount, currencyOverride = null) => {
    if (amount === null || amount === undefined) return '';

    const currency = currencyOverride || config.currency;
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      return `${amount} ${currency}`;
    }

    const locale1Formatted = numericAmount.toLocaleString(config.dateLocales[0]);
    const locale2Formatted = numericAmount.toLocaleString(config.dateLocales[1]);
    const currencyName = config.currencyName;

    return `${locale1Formatted} ${currencyName} / ${locale2Formatted} ${currency}`;
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
      travelInfo?.district, // For Hong Kong
    ];

    for (const candidate of candidates) {
      const display = formatLocationBilingual(candidate);
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
    travelInfo?.district,
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
    const fundLabels = {
      thailand: {
        cash: 'เงินสด / Cash',
        credit_card: 'บัตรเครดิต / Credit Card',
        bank_balance: 'ยอดเงินฝากธนาคาร / Bank Balance',
        investment: 'การลงทุน / Investments',
        card: 'บัตรธนาคาร / Bank Card',
        debit_card: 'บัตรเดบิต / Debit Card',
        other: 'อื่น ๆ / Other'
      },
      malaysia: {
        cash: 'Cash / Tunai',
        credit_card: 'Credit Card / Kad Kredit',
        bank_balance: 'Bank Balance / Baki Bank',
        investment: 'Investments / Pelaburan',
        card: 'Bank Card / Kad Bank',
        debit_card: 'Debit Card / Kad Debit',
        other: 'Other / Lain-lain'
      }
    };

    const labels = fundLabels[country] || fundLabels.thailand;
    return labels[type] || labels.other;
  };

  const renderPersonalInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👤 {config.personalInfoTitle}</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{config.labels.fullName}:</Text>
          <Text style={styles.infoValue}>
            {entryPack?.passport?.fullName || personalInfo?.fullName || config.notProvided}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{config.labels.passportNumber}:</Text>
          <Text style={styles.infoValue}>
            {entryPack?.passport?.passportNumber || personalInfo?.passportNumber || config.notProvided}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{config.labels.nationality}:</Text>
          <Text style={styles.infoValue}>
            {entryPack?.passport?.nationality || personalInfo?.nationality || config.notProvided}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{config.labels.dateOfBirth}:</Text>
          <Text style={styles.infoValue}>
            {formatBilingualDate(entryPack?.passport?.dateOfBirth || personalInfo?.dateOfBirth)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTravelInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>✈️ {config.travelInfoTitle}</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{config.labels.arrivalDate}:</Text>
          <Text style={styles.infoValue}>
            {formatBilingualDate(travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate)}
          </Text>
        </View>

        {country === 'thailand' && hotelProvinceDisplay && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>จังหวัด / Province:</Text>
            <Text style={styles.infoValue}>
              {hotelProvinceDisplay || config.notProvided}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{config.labels.flightNumber}:</Text>
          <Text style={styles.infoValue}>
            {travelInfo?.arrivalFlightNumber || travelInfo?.flightNumber || config.notProvided}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{config.labels.purpose}:</Text>
          <Text style={styles.infoValue}>
            {travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || config.notProvided}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{config.labels.stayLocation}:</Text>
          <Text style={styles.infoValue}>
            {travelInfo?.hotelAddress || config.notProvided}
          </Text>
        </View>

        {travelInfo?.lengthOfStay && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{config.labels.lengthOfStay}:</Text>
            <Text style={styles.infoValue}>
              {travelInfo.lengthOfStay}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderFundsInfo = () => {
    const proofPhotoText = country === 'malaysia'
      ? '📸 Proof photo uploaded / Foto bukti dimuat naik'
      : '📸 มีหลักฐานรูปภาพแล้ว / Proof photo uploaded';

    const noDataText = country === 'malaysia'
      ? 'No funds information / Tiada maklumat kewangan'
      : 'ยังไม่มีข้อมูลเงินทุน / No funds information';

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 {config.fundsTitle}</Text>

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
                  {proofPhotoText}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noData}>{noDataText}</Text>
        )}

        <View style={styles.fundsTotal}>
          <Text style={styles.totalLabel}>{config.labels.totalFunds}:</Text>
          <Text style={styles.totalAmount}>
            {formatBilingualCurrency(totalFunds)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTDACInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🛂 {config.entryCardTitle}</Text>

      {entryPack.tdacSubmission && entryPack.tdacSubmission.arrCardNo ? (
        <TDACInfoCard
          tdacSubmission={entryPack.tdacSubmission}
          isReadOnly={true}
          country={country}
        />
      ) : (
        <View style={styles.tdacPlaceholder}>
          <View style={styles.placeholderIcon}>
            <Text style={styles.placeholderIconText}>📱</Text>
          </View>
          <Text style={styles.placeholderTitle}>
            {country === 'malaysia'
              ? `MDAC Not Submitted Yet / MDAC Belum Dihantar`
              : 'ยังไม่ได้ส่ง TDAC / TDAC Not Submitted Yet'
            }
          </Text>
          <Text style={styles.placeholderDescription}>
            {country === 'malaysia'
              ? 'Please submit MDAC within 3 days before arrival / Sila hantar MDAC dalam 3 hari sebelum ketibaan'
              : 'กรุณาส่งแบบฟอร์ม TDAC ภายใน 72 ชั่วโมงก่อนเดินทางถึง / Please submit TDAC within 72 hours before arrival'
            }
          </Text>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>
              {country === 'malaysia'
                ? 'QR Code will appear after submission / Kod QR akan muncul selepas penghantaran'
                : 'จะแสดงรหัส QR หลังจากส่งเรียบร้อย / QR Code will appear after submission'
              }
            </Text>
          </View>
          <Text style={styles.placeholderNote}>
            {country === 'malaysia'
              ? 'You can still show other information to immigration officer / Anda masih boleh tunjukkan maklumat lain kepada pegawai imigresen'
              : 'หากยังไม่มี TDAC สามารถแสดงข้อมูลอื่นให้เจ้าหน้าที่ตรวจคนเข้าเมืองได้ / You can still show other information to immigration officer even without TDAC'
            }
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
      case 'personal':
        return renderPersonalInfo();
      case 'travel':
        return renderTravelInfo();
      case 'funds':
        return renderFundsInfo();
      case 'tdac':
      case 'mdac':
        return renderTDACInfo();
      case 'tips':
        return renderImmigrationTips();
      default:
        return renderTDACInfo();
    }
  };

  const tabsConfig = {
    thailand: [
      { key: 'tdac', label: 'บัตร TDAC', labelEn: 'TDAC' },
      { key: 'personal', label: 'ข้อมูลส่วนตัว', labelEn: 'Personal' },
      { key: 'travel', label: 'ข้อมูลการเดินทาง', labelEn: 'Travel' },
      { key: 'funds', label: 'เงินทุน', labelEn: 'Funds' },
    ],
    malaysia: [
      { key: 'mdac', label: 'MDAC', labelEn: 'MDAC' },
      { key: 'personal', label: 'Personal', labelEn: 'Peribadi' },
      { key: 'travel', label: 'Travel', labelEn: 'Perjalanan' },
      { key: 'funds', label: 'Funds', labelEn: 'Kewangan' },
    ]
  };

  const tabs = tabsConfig[country] || tabsConfig.thailand;

  const headerTitles = {
    thailand: '🇹🇭 ชุดข้อมูลตรวจคนเข้าเมือง / Entry Pack',
    malaysia: '🇲🇾 Entry Pack / Pakej Kemasukan'
  };

  const headerSubtitles = {
    thailand: 'ข้อมูลสำคัญสำหรับเจ้าหน้าที่ตรวจคนเข้าเมือง / Important information for immigration officer',
    malaysia: 'Important information for immigration officer / Maklumat penting untuk pegawai imigresen'
  };

  return (
    <View style={[styles.container, isModal && styles.modalContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{headerTitles[country] || headerTitles.thailand}</Text>
        <Text style={styles.subtitle}>{headerSubtitles[country] || headerSubtitles.thailand}</Text>

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
          {country === 'malaysia'
            ? 'Please show this entry pack to the immigration officer / Sila tunjukkan pakej ini kepada pegawai imigresen'
            : 'กรุณาแสดงชุดข้อมูลนี้ต่อเจ้าหน้าที่ตรวจคนเข้าเมือง / Please show this entry pack to the immigration officer'
          }
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
