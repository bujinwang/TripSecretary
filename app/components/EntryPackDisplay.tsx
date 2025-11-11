// @ts-nocheck

import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, Image, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import TDACInfoCard from './TDACInfoCard';
import PDFViewer from './PDFViewer';
import { SAMPLE_THAILAND_ARRIVAL_CARD_PDF_BASE64 } from '../assets/samplePdfBase64';
import { thailandProvinces } from '../data/thailandProvinces';
import { hongkongDistricts, getAllDistricts } from '../data/hongkongLocations';
import { calculateTotalFundsForCountry } from '../utils/currencyConverter';
import PDFManagementService from '../services/PDFManagementService';

const { width: screenWidth } = Dimensions.get('window');
const QR_SIZE = Math.min(screenWidth * 0.6, 250);

// Country-specific configurations
const countryConfigs = {
  th: {
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
      passportExpiryDate: 'วันหมดอายุหนังสือเดินทาง / Passport Expiry Date',
      nationality: 'สัญชาติ / Nationality',
      dateOfBirth: 'วันเกิด / Date of Birth',
      arrivalDate: 'วันเข้าประเทศ / Arrival Date',
      arrivalFlightNumber: 'เที่ยวบินขาเข้า / Arrival Flight Number',
      departureDate: 'วันออกจากประเทศ / Departure Date',
      departureFlightNumber: 'เที่ยวบินขาออก / Departure Flight Number',
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
  my: {
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
      passportExpiryDate: 'Passport Expiry Date / Tarikh Tamat Pasport',
      nationality: 'Nationality / Warganegara',
      dateOfBirth: 'Date of Birth / Tarikh Lahir',
      arrivalDate: 'Arrival Date / Tarikh Ketibaan',
      arrivalFlightNumber: 'Arrival Flight Number / Nombor Penerbangan Ketibaan',
      departureDate: 'Departure Date / Tarikh Berlepas',
      departureFlightNumber: 'Departure Flight Number / Nombor Penerbangan Berlepas',
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
  hk: {
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
      passportExpiryDate: '護照到期日 / Passport Expiry Date',
      nationality: '國籍 / Nationality',
      dateOfBirth: '出生日期 / Date of Birth',
      arrivalDate: '抵達日期 / Arrival Date',
      arrivalFlightNumber: '抵港航班號 / Arrival Flight Number',
      departureDate: '離開日期 / Departure Date',
      departureFlightNumber: '離港航班號 / Departure Flight Number',
      flightNumber: '航班號碼 / Flight Number',
      stayLocation: '住宿地點 / Stay Location',
      lengthOfStay: '停留時間 / Length of Stay',
      purpose: '訪問目的 / Purpose of Visit',
      totalFunds: '總資金 / Total Funds',
      fundType: '類型 / Type',
      amount: '金額 / Amount'
    },
    dateLocales: ['en-US', 'zh-CN']
  },
  kr: {
    entryCardName: 'K-ETA',
    entryCardTab: 'personal',
    entryCardTitle: '입국 정보 / Entry Information',
    personalInfoTitle: '개인 정보 / Personal Information',
    travelInfoTitle: '여행 정보 / Travel Information',
    fundsTitle: '자금 정보 / Funds Information',
    currency: 'KRW',
    currencyName: '원',
    notProvided: '미입력 / Not provided',
    fallbackHotelText: '숙소 주소를 입력해주세요 / Please provide accommodation address',
    labels: {
      fullName: '성명 / Full Name',
      passportNumber: '여권 번호 / Passport Number',
      passportExpiryDate: '여권 만료일 / Passport Expiry Date',
      nationality: '국적 / Nationality',
      dateOfBirth: '생년월일 / Date of Birth',
      arrivalDate: '입국일 / Arrival Date',
      arrivalFlightNumber: '입국 항공편 / Arrival Flight Number',
      departureDate: '출국일 / Departure Date',
      departureFlightNumber: '출국 항공편 / Departure Flight Number',
      flightNumber: '항공편 번호 / Flight Number',
      stayLocation: '숙소 주소 / Stay Location',
      lengthOfStay: '체류 기간 / Length of Stay',
      purpose: '방문 목적 / Purpose of Visit',
      totalFunds: '총 자금 / Total Funds',
      fundType: '종류 / Type',
      amount: '금액 / Amount'
    },
    dateLocales: ['ko-KR', 'en-US']
  },
  us: {
    entryCardName: 'I-94',
    entryCardTab: 'i94',
    entryCardTitle: 'I-94 Entry Record / 美国入境记录',
    personalInfoTitle: 'Personal Information / 个人信息',
    travelInfoTitle: 'Travel Information / 旅行信息',
    fundsTitle: 'Funds Information / 资金信息',
    currency: 'USD',
    currencyName: 'Dollar / 美元',
    notProvided: 'Not provided / 未提供',
    fallbackHotelText: 'Please provide accommodation address / 请提供住宿地址',
    labels: {
      fullName: 'Full Name / 全名',
      passportNumber: 'Passport Number / 护照号码',
      passportExpiryDate: 'Passport Expiry Date / 护照有效期',
      nationality: 'Nationality / 国籍',
      dateOfBirth: 'Date of Birth / 出生日期',
      arrivalDate: 'Arrival Date / 抵达日期',
      arrivalFlightNumber: 'Arrival Flight Number / 抵达航班号',
      departureDate: 'Departure Date / 离开日期',
      departureFlightNumber: 'Departure Flight Number / 离境航班号',
      flightNumber: 'Flight Number / 航班号',
      stayLocation: 'Accommodation Address / 住宿地址',
      lengthOfStay: 'Length of Stay / 停留时间',
      purpose: 'Purpose of Visit / 访问目的',
      totalFunds: 'Total Funds / 资金总额',
      fundType: 'Type / 类型',
      amount: 'Amount / 金额'
    },
    dateLocales: ['en-US', 'zh-CN']
  },
  tw: {
    entryCardName: 'TWAC',
    entryCardTab: 'twac',
    entryCardTitle: '臺灣入境資料 / Taiwan Entry Information',
    personalInfoTitle: '個人資料 / Personal Information',
    travelInfoTitle: '旅行資料 / Travel Information',
    fundsTitle: '資金證明 / Funds Information',
    currency: 'TWD',
    currencyName: '新台幣',
    notProvided: '未提供 / Not provided',
    fallbackHotelText: '請提供住宿地址 / Please provide accommodation address',
    labels: {
      fullName: '全名 / Full Name',
      passportNumber: '護照號碼 / Passport Number',
      passportExpiryDate: '護照到期日 / Passport Expiry Date',
      nationality: '國籍 / Nationality',
      dateOfBirth: '出生日期 / Date of Birth',
      arrivalDate: '抵達日期 / Arrival Date',
      arrivalFlightNumber: '入境航班號 / Arrival Flight Number',
      departureDate: '離開日期 / Departure Date',
      departureFlightNumber: '出境航班號 / Departure Flight Number',
      flightNumber: '航班號碼 / Flight Number',
      stayLocation: '住宿地點 / Stay Location',
      lengthOfStay: '停留時間 / Length of Stay',
      purpose: '訪問目的 / Purpose of Visit',
      totalFunds: '總資金 / Total Funds',
      fundType: '類型 / Type',
      amount: '金額 / Amount'
    },
    dateLocales: ['zh-TW', 'en-US']
  },
  sg: {
    entryCardName: 'SGAC',
    entryCardTab: 'sgac',
    entryCardTitle: 'Singapore Entry Card (SGAC) / 新加坡入境卡',
    personalInfoTitle: 'Personal Information / 个人信息',
    travelInfoTitle: 'Travel Information / 旅行信息',
    fundsTitle: 'Funds Information / 资金信息',
    currency: 'SGD',
    currencyName: 'Dollar / 新元',
    notProvided: 'Not provided / 未提供',
    fallbackHotelText: 'Please provide accommodation address / 请提供住宿地址',
    labels: {
      fullName: 'Full Name / 全名',
      passportNumber: 'Passport Number / 护照号码',
      passportExpiryDate: 'Passport Expiry Date / 护照有效期',
      nationality: 'Nationality / 国籍',
      dateOfBirth: 'Date of Birth / 出生日期',
      arrivalDate: 'Arrival Date / 抵达日期',
      arrivalFlightNumber: 'Arrival Flight Number / 入境航班号',
      departureDate: 'Departure Date / 离开日期',
      departureFlightNumber: 'Departure Flight Number / 离境航班号',
      flightNumber: 'Flight Number / 航班号',
      stayLocation: 'Accommodation Address / 住宿地址',
      lengthOfStay: 'Length of Stay / 停留时间',
      purpose: 'Purpose of Visit / 访问目的',
      totalFunds: 'Total Funds / 资金总额',
      fundType: 'Type / 类型',
      amount: 'Amount / 金额'
    },
    dateLocales: ['en-US', 'zh-CN']
  },
  vn: {
    entryCardName: 'Vietnam Entry Pack',
    entryCardTab: 'personal',
    entryCardTitle: 'Thông tin nhập cảnh Việt Nam',
    personalInfoTitle: 'Thông tin cá nhân',
    travelInfoTitle: 'Thông tin hành trình',
    fundsTitle: 'Chứng minh tài chính',
    currency: 'VND',
    currencyName: '₫',
    notProvided: 'Chưa cung cấp',
    fallbackHotelText: 'Vui lòng cung cấp địa chỉ lưu trú',
    labels: {
      fullName: 'Họ và tên',
      passportNumber: 'Số hộ chiếu',
      passportExpiryDate: 'Ngày hết hạn hộ chiếu',
      nationality: 'Quốc tịch',
      dateOfBirth: 'Ngày sinh',
      arrivalDate: 'Ngày nhập cảnh',
      arrivalFlightNumber: 'Chuyến bay nhập cảnh',
      departureDate: 'Ngày rời Việt Nam',
      departureFlightNumber: 'Chuyến bay rời đi',
      flightNumber: 'Chuyến bay',
      stayLocation: 'Địa chỉ lưu trú',
      lengthOfStay: 'Thời gian lưu trú',
      purpose: 'Mục đích chuyến đi',
      totalFunds: 'Tổng số tiền mang theo',
      fundType: 'Loại',
      amount: 'Số tiền'
    },
    dateLocales: ['vi-VN'],
  }
};

// Country aliases: maps ISO alpha-2 codes to translation keys
// Since translation keys are now standardized to ISO alpha-2, this is mainly for backward compatibility
const COUNTRY_ALIASES = {
  my: 'my',
  sg: 'sg',
  th: 'th',
  hk: 'hk',
  tw: 'tw',
  us: 'us',
  jp: 'jp',
  vn: 'vn',
  kr: 'kr',
  // Legacy mappings for backward compatibility
  malaysia: 'my',
  singapore: 'sg',
  thailand: 'th',
  hongkong: 'hk',
  taiwan: 'tw',
  usa: 'us',
  japan: 'jp',
  vietnam: 'vn',
  korea: 'kr',
};

const EntryPackDisplay = ({
  entryPack: rawEntryPack,
  personalInfo,
  travelInfo,
  funds,
  onClose,
  isModal = false,
  country: rawCountry = 'th'
}) => {
  const country = COUNTRY_ALIASES[rawCountry] || rawCountry || 'th';
  const entryPack = useMemo(
    () =>
      rawEntryPack && rawEntryPack.country !== country
        ? { ...rawEntryPack, country }
        : rawEntryPack,
    [rawEntryPack, country]
  );
  const config = countryConfigs[country] || countryConfigs.th;
  const [activeTab, setActiveTab] = useState(config.entryCardTab);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(null);
  const tdacSubmission = entryPack?.tdacSubmission || null;
  const tdacPdfCandidate = tdacSubmission?.pdfUrl || tdacSubmission?.pdfPath || null;
  const [resolvedTdacPdfUri, setResolvedTdacPdfUri] = useState(tdacPdfCandidate || null);

  useEffect(() => {
    let isMounted = true;

    const resolvePdfPath = async () => {
      if (!tdacPdfCandidate) {
        if (isMounted) {
          setResolvedTdacPdfUri(null);
        }
        return;
      }

      try {
        const result = await PDFManagementService.resolvePDFUri(tdacPdfCandidate);
        if (isMounted) {
          setResolvedTdacPdfUri(result.uri || tdacPdfCandidate);
        }
      } catch (error) {
        console.warn('EntryPackDisplay', 'Failed to resolve TDAC PDF path', error);
        if (isMounted) {
          setResolvedTdacPdfUri(tdacPdfCandidate);
        }
      }
    };

    resolvePdfPath();

    return () => {
      isMounted = false;
    };
  }, [tdacPdfCandidate]);

  const fallbackHotelText = config.fallbackHotelText;

  // Handle photo viewer
  const handleOpenPhotoViewer = (photoUri) => {
    setSelectedPhotoUri(photoUri);
    setPhotoViewerVisible(true);
  };

  const handleClosePhotoViewer = () => {
    setPhotoViewerVisible(false);
    setSelectedPhotoUri(null);
  };

  const formatProvinceThaiEnglish = (value) => {
    if (!value || typeof value !== 'string') {
return '';
}
    const raw = value.trim();
    if (!raw) {
return '';
}

    const normalizedCode = raw.toUpperCase();
    let province = thailandProvinces.find(p => p.code === normalizedCode);

    if (!province) {
      const lower = raw.toLowerCase();
      province = thailandProvinces.find(
        p => p.name?.toLowerCase() === lower || p.nameZh === raw || p.nameTh === raw
      );
    }

    if (!province) {
return '';
}
    const thaiName = province.nameTh || province.name || raw;
    const englishName = province.name || raw;
    return `${thaiName} / ${englishName}`;
  };

  const formatDistrictHongKongBilingual = (value) => {
    if (!value || typeof value !== 'string') {
return '';
}
    const raw = value.trim();
    if (!raw) {
return '';
}

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

    if (!district) {
return raw;
} // Return original if not found

    // Format as: 繁體中文 / English
    return `${district.nameZh} / ${district.nameEn}`;
  };

  // Country-aware location formatter
  const formatLocationBilingual = (value) => {
    if (country === 'hk') {
      return formatDistrictHongKongBilingual(value);
    } else if (country === 'th') {
      return formatProvinceThaiEnglish(value);
    }
    return value || '';
  };

  if (!entryPack) {
    return null;
  }

  const formatBilingualDate = (dateString) => {
    if (!dateString) {
return '';
}
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
return '';
}

      const locale1 = config.dateLocales[0];
      const locale2 = config.dateLocales[1];

      const date1 = date.toLocaleDateString(locale1, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      // If only one locale is provided (e.g., Vietnamese only), return single format
      if (!locale2) {
        return date1;
      }

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
    if (amount === null || amount === undefined) {
return '';
}

    const currency = currencyOverride || config.currency;
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      return `${amount} ${currency}`;
    }

    // Simply format the number with the currency code (no bilingual conversion)
    const formattedAmount = numericAmount.toLocaleString('en-US');
    return `${formattedAmount} ${currency}`;
  };

  const totalFunds = useMemo(() => {
    if (!Array.isArray(funds)) {
return 0;
}
    // Convert all fund amounts to the country's local currency before summing
    return calculateTotalFundsForCountry(funds, country);
  }, [funds, country]);

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
      if (display) {
return display;
}
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
      th: {
        cash: 'เงินสด / Cash',
        credit_card: 'บัตรเครดิต / Credit Card',
        bank_balance: 'ยอดเงินฝากธนาคาร / Bank Balance',
        investment: 'การลงทุน / Investments',
        card: 'บัตรธนาคาร / Bank Card',
        debit_card: 'บัตรเดบิต / Debit Card',
        other: 'อื่น ๆ / Other'
      },
      my: {
        cash: 'Cash / Tunai',
        credit_card: 'Credit Card / Kad Kredit',
        bank_balance: 'Bank Balance / Baki Bank',
        investment: 'Investments / Pelaburan',
        card: 'Bank Card / Kad Bank',
        debit_card: 'Debit Card / Kad Debit',
        other: 'Other / Lain-lain'
      },
      hk: {
        cash: '現金 / Cash',
        credit_card: '信用卡 / Credit Card',
        bank_balance: '銀行存款 / Bank Balance',
        investment: '投資 / Investments',
        card: '銀行卡 / Bank Card',
        debit_card: '扣賬卡 / Debit Card',
        other: '其他 / Other'
      },
      sg: {
        cash: 'Cash / 现金',
        credit_card: 'Credit Card / 信用卡',
        bank_balance: 'Bank Balance / 银行存款',
        investment: 'Investments / 投资',
        card: 'Bank Card / 银行卡',
        debit_card: 'Debit Card / 借记卡',
        other: 'Other / 其他'
      },
      tw: {
        cash: '現金 / Cash',
        credit_card: '信用卡 / Credit Card',
        bank_balance: '銀行存款 / Bank Balance',
        investment: '投資 / Investments',
        card: '銀行卡 / Bank Card',
        debit_card: '扣帳卡 / Debit Card',
        other: '其他 / Other'},
      us: {
        cash: 'Cash / 现金',
        credit_card: 'Credit Card / 信用卡',
        bank_balance: 'Bank Balance / 银行存款',
        investment: 'Investments / 投资',
        card: 'Bank Card / 银行卡',
        debit_card: 'Debit Card / 借记卡',
        other: 'Other / 其他'
      },
      jp: {
        cash: '現金 / Cash',
        credit_card: 'クレジットカード / Credit Card',
        bank_balance: '銀行残高 / Bank Balance',
        investment: '投資 / Investments',
        card: '銀行カード / Bank Card',
        debit_card: 'デビットカード / Debit Card',
        other: 'その他 / Other'
      }
    };

    const labels = fundLabels[country] || fundLabels.th;
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
          <Text style={styles.infoLabel}>{config.labels.passportExpiryDate}:</Text>
          <Text style={styles.infoValue}>
            {formatBilingualDate(entryPack?.passport?.expiryDate || personalInfo?.expiryDate) || config.notProvided}
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

  const renderTravelInfo = () => {
    const formatDateWithFallback = (rawDate) => {
      if (!rawDate || (typeof rawDate === 'string' && rawDate.trim().length === 0)) {
        return config.notProvided;
      }
      const formatted = formatBilingualDate(rawDate);
      return formatted || config.notProvided;
    };

    const formatTextWithFallback = (value) => {
      if (value === null || value === undefined) {
return config.notProvided;
}
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : config.notProvided;
      }
      return value;
    };

    const arrivalDateValue = formatDateWithFallback(
      travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate
    );
    const departureDateValue = formatDateWithFallback(
      travelInfo?.departureDepartureDate || travelInfo?.departureDate
    );
    const arrivalFlightLabel = config.labels.arrivalFlightNumber || config.labels.flightNumber;
    const departureFlightLabel = config.labels.departureFlightNumber || config.labels.flightNumber;
    const arrivalFlightValue = formatTextWithFallback(
      travelInfo?.arrivalFlightNumber || travelInfo?.flightNumber
    );
    const departureFlightValue = formatTextWithFallback(
      travelInfo?.departureFlightNumber ||
      travelInfo?.returnFlightNumber ||
      travelInfo?.departureFlight
    );
    const stayLocationValue = formatTextWithFallback(travelInfo?.hotelAddress);
    const purposeValue = formatTextWithFallback(
      travelInfo?.travelPurpose || travelInfo?.purposeOfVisit
    );
    const lengthOfStayRaw = travelInfo?.lengthOfStay;
    const hasLengthOfStay = typeof lengthOfStayRaw === 'string'
      ? lengthOfStayRaw.trim().length > 0
      : !!lengthOfStayRaw;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✈️ {config.travelInfoTitle}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{config.labels.arrivalDate}:</Text>
            <Text style={styles.infoValue}>{arrivalDateValue}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{arrivalFlightLabel}:</Text>
            <Text style={styles.infoValue}>{arrivalFlightValue}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{config.labels.departureDate}:</Text>
            <Text style={styles.infoValue}>{departureDateValue}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{departureFlightLabel}:</Text>
            <Text style={styles.infoValue}>{departureFlightValue}</Text>
          </View>

          {country === 'th' && hotelProvinceDisplay && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>จังหวัด / Province:</Text>
              <Text style={styles.infoValue}>
                {hotelProvinceDisplay || config.notProvided}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{config.labels.stayLocation}:</Text>
            <Text style={styles.infoValue}>{stayLocationValue}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{config.labels.purpose}:</Text>
            <Text style={styles.infoValue}>{purposeValue}</Text>
          </View>

          {hasLengthOfStay && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{config.labels.lengthOfStay}:</Text>
              <Text style={styles.infoValue}>{lengthOfStayRaw}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderFundsInfo = () => {
    const proofPhotoTexts = {
      th: '📸 มีหลักฐานรูปภาพแล้ว',
      my: '📸 Proof photo uploaded',
      sg: '📸 Proof photo uploaded',
      us: '📸 Proof photo uploaded',
      hk: '📸 已上載證明照片',
      tw: '📸 已上傳證明照片',
      jp: '📸 証明写真アップロード済み',
      vn: '📸 Ảnh chứng minh tài chính'
    };
    const proofPhotoText = proofPhotoTexts[country] || proofPhotoTexts.th;

    const noDataTexts = {
      th: 'ยังไม่มีข้อมูลเงินทุน',
      my: 'No funds information',
      sg: 'No funds information',
      us: 'No funds information',
      jp: '資金情報なし',
      hk: '未提供資金證明',
      tw: '未提供資金證明',
      vn: 'Chưa có thông tin tài chính'
    };
    const noDataText = noDataTexts[country] || noDataTexts.th;

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
                <TouchableOpacity
                  onPress={() => handleOpenPhotoViewer(fund.photoUri || fund.proofPhoto)}
                  style={styles.fundProofContainer}
                >
                  <Text style={styles.fundProof}>
                    {proofPhotoText}
                  </Text>
                  <Text style={styles.fundProofHint}>
                    {country === 'th' ? 'แตะเพื่อดูรูป' :
                     country === 'my' ? 'Tap to view' :
                     country === 'sg' || country === 'us' ? 'Tap to view' :
                     country === 'hk' || country === 'tw' ? '點擊查看' :
                     country === 'jp' ? 'タップして表示' :
                     'แตะเพื่อดูรูป'}
                  </Text>
                </TouchableOpacity>
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

  const renderTDACInfo = () => {
    const placeholderTitles = {
      th: 'ยังไม่ได้ส่ง TDAC',
      my: 'MDAC Not Submitted',
      sg: 'SGAC Not Submitted',
      us: 'I-94 Not Required Online',
      jp: '入国カード未提出',
      hk: '尚未提交入境資料'
    };

    const placeholderDescriptions = {
      th: 'กรุณาส่งแบบฟอร์ม TDAC ภายใน 72 ชั่วโมงก่อนเดินทางถึง',
      my: 'Please submit MDAC within 3 days before arrival',
      sg: 'Please submit SGAC within 3 days before arrival',
      us: 'I-94 is completed at the airport upon arrival',
      jp: '到着前にVisit Japan Webで入国カードを提出してください',
      hk: '香港入境無需預先提交電子表格，到達時填寫即可'
    };

    const qrPlaceholderTexts = {
      th: 'จะแสดงรหัส QR หลังจากส่งเรียบร้อย',
      my: 'QR Code will appear after submission',
      sg: 'DE Number will appear after submission',
      us: 'I-94 number will be provided at entry',
      jp: 'QRコードは提出後に表示されます',
      hk: '入境時會獲得入境蓋章'
    };

    const placeholderNotes = {
      th: 'หากยังไม่มี TDAC สามารถแสดงข้อมูลอื่นให้เจ้าหน้าที่ตรวจคนเข้าเมืองได้',
      my: 'You can still show other information to immigration officer',
      sg: 'You can still show other information to immigration officer',
      us: 'Prepare this information for CBP officer at the airport',
      jp: '入国カードがなくても、他の情報を入国審査官に提示できます',
      hk: '可以向入境處人員出示此資料包'
    };

    const pdfDocumentTitle = {
      th: '📄 เอกสาร TDAC',
      my: '📄 MDAC Document',
      sg: '📄 SGAC Document',
      us: '📄 I-94 Document',
      jp: '📄 入国カード',
      hk: '📄 入境文件'
    };

    return (
      <View style={styles.section}>
        {tdacSubmission && tdacSubmission.arrCardNo ? (
          <>
            {/* PDF Viewer Section */}
            {resolvedTdacPdfUri && (
              <View style={styles.pdfContainer}>
                <PDFViewer
                  source={{ uri: resolvedTdacPdfUri }}
                  style={styles.pdfViewer}
                  showPageIndicator={true}
                  onError={(error) => {
                    console.error('PDF display error:', error);
                  }}
                />
              </View>
            )}
          </>
        ) : (
          <>
            {country !== 'th' && (
              <View style={styles.tdacPlaceholder}>
                <View style={styles.placeholderIcon}>
                  <Text style={styles.placeholderIconText}>📱</Text>
                </View>
                <Text style={styles.placeholderTitle}>
                  {config.placeholderTitle || placeholderTitles[country] || placeholderTitles.th}
                </Text>
                {(config.placeholderDescription || placeholderDescriptions[country]) && (
                  <Text style={styles.placeholderDescription}>
                    {config.placeholderDescription || placeholderDescriptions[country]}
                  </Text>
                )}
                {(config.placeholderNote || placeholderNotes[country]) && (
                  <Text style={styles.placeholderNote}>
                    {config.placeholderNote || placeholderNotes[country]}
                  </Text>
                )}
              </View>
            )}

            {/* Show sample PDF preview for Thailand */}
            {country === 'th' && (
              <View style={styles.samplePdfContainer}>
                <View style={styles.samplePdfHeader}>
                  <Text style={styles.samplePdfTitle}>
                    📄 ตัวอย่างเอกสาร TDAC
                  </Text>
                  <Text style={styles.samplePdfSubtitle}>
                    เอกสารตัวอย่างเพื่อให้ทราบรูปแบบที่จะได้รับหลังจากส่งฟอร์ม
                  </Text>
                </View>

                {/* PDF Preview with Watermark */}
                <PDFViewer
                  source={{ base64: SAMPLE_THAILAND_ARRIVAL_CARD_PDF_BASE64 }}
                  style={styles.samplePdfViewer}
                  showPageIndicator={true}
                  showWatermark={true}
                  watermarkText="ตัวอย่าง"
                  onError={(error) => {
                    console.error('Sample PDF display error:', error);
                  }}
                />

                <View style={styles.pdfInfoHint}>
                  <Text style={styles.pdfInfoText}>
                    ℹ️ เอกสารนี้มี 2 หน้า เลื่อนเพื่อดูหน้าถัดไป
                  </Text>
                </View>

                <Text style={styles.samplePdfFooter}>
                  ⚠️ นี่เป็นเอกสารตัวอย่างเท่านั้น กรุณาส่งฟอร์ม TDAC เพื่อรับเอกสารจริง
                </Text>
              </View>
            )}

          </>
        )}
      </View>
    );
  };

  const getTipsConfig = () => {
    const tipsConfig = {
      thailand: {
        title: '💡 คำถามที่พบบ่อยจากเจ้าหน้าที่ตรวจคนเข้าเมือง / Immigration Officer FAQs',
        questions: [
          {
            q: 'Q: จุดประสงค์ในการมาไทยคืออะไร? / What is the purpose of your visit?',
            a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'ท่องเที่ยว / Tourism'
          },
          {
            q: 'Q: คุณจะพำนักในประเทศไทยนานเท่าใด? / How long will you stay in Thailand?',
            a: travelInfo?.lengthOfStay || '30 วัน / 30 days'
          },
          {
            q: 'Q: คุณจะพักที่ไหน? / Where will you be staying?',
            a: stayLocationAnswer
          },
          {
            q: 'Q: คุณมีเงินทุนเท่าไร? / How much money do you have?',
            a: `${formatBilingualCurrency(totalFunds)} (เงินสดและบัตรธนาคาร / Cash and bank cards)`
          }
        ]
      },
      taiwan: {
        title: '💡 臺灣入境處常見問題 / Immigration Officer FAQs',
        questions: [
          {
            q: 'Q: 您來臺灣的目的是什麼？ / What is the purpose of your visit to Taiwan?',
            a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || '旅遊 / Tourism'
          },
          {
            q: 'Q: 您會在臺灣停留多久？ / How long will you stay in Taiwan?',
            a: travelInfo?.lengthOfStay || '7 天 / 7 days'
          },
          {
            q: 'Q: 您會住在哪裡？ / Where will you be staying?',
            a: stayLocationAnswer
          },
          {
            q: 'Q: 您帶了多少錢？ / How much money do you have?',
            a: `${formatBilingualCurrency(totalFunds)} (現金和銀行卡 / Cash and bank cards)`
          }
        ]
      },
      malaysia: {
        title: '💡 Immigration Officer FAQs / Soalan Lazim Pegawai Imigresen',
        questions: [
          { q: 'Q: What is the purpose of your visit? / Apakah tujuan lawatan anda?', a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'Tourism / Pelancongan' },
          { q: 'Q: How long will you stay? / Berapa lama anda akan tinggal?', a: travelInfo?.lengthOfStay || '7 days / 7 hari' },
          { q: 'Q: Where will you be staying? / Di mana anda akan tinggal?', a: stayLocationAnswer },
          { q: 'Q: How much money do you have? / Berapa banyak wang yang anda ada?', a: `${formatBilingualCurrency(totalFunds)} (Cash and cards / Tunai dan kad)` }
        ]
      },
      usa: {
        title: '💡 CBP Officer FAQs / 海关及边境保护局常见问题',
        questions: [
          { q: 'Q: What is the purpose of your visit? / 你来美国的目的是什么？', a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'Tourism / 旅游' },
          { q: 'Q: How long will you stay? / 你会在美国停留多久？', a: travelInfo?.lengthOfStay || '7 days / 7天' },
          { q: 'Q: Where will you be staying? / 你会住在哪里？', a: stayLocationAnswer },
          { q: 'Q: How much money do you have? / 你带了多少钱？', a: `${formatBilingualCurrency(totalFunds)} (Cash and bank cards / 现金和银行卡)` }
        ]
      },
      singapore: {
        title: '💡 Immigration Officer FAQs / 入境官员常见问题',
        questions: [
          {
            q: 'Q: What is the purpose of your visit to Singapore? / 你来新加坡的目的是什么？',
            a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'Tourism / 旅游'
          },
          {
            q: 'Q: How long will you stay in Singapore? / 你会在新加坡停留多久？',
            a: travelInfo?.lengthOfStay || '7 days / 7天'
          },
          {
            q: 'Q: Where will you be staying? / 你会住在哪里？',
            a: stayLocationAnswer
          },
          {
            q: 'Q: How much money do you have for your stay? / 你带了多少钱？',
            a: `${formatBilingualCurrency(totalFunds)} (Cash and bank cards / 现金和银行卡)`
          },
          {
            q: 'Q: Do you have a return ticket? / 你有回程机票吗？',
            a: travelInfo?.departureFlightNumber ? `Yes, ${travelInfo.departureFlightNumber} / 有，${travelInfo.departureFlightNumber}` : 'Yes / 有'
          }
        ]
      },
      hongkong: {
        title: '💡 入境處常見問題 / Immigration Officer FAQs',
        questions: [
          {
            q: 'Q: 你來香港的目的是什麼？ / What is the purpose of your visit?',
            a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || '旅遊 / Tourism'
          },
          {
            q: 'Q: 你會在香港停留多久？ / How long will you stay in Hong Kong?',
            a: travelInfo?.lengthOfStay || '7 天 / 7 days'
          },
          {
            q: 'Q: 你會住在哪裡？ / Where will you be staying?',
            a: stayLocationAnswer
          },
          {
            q: 'Q: 你帶了多少錢？ / How much money do you have?',
            a: `${formatBilingualCurrency(totalFunds)} (現金和銀行卡 / Cash and bank cards)`
          }
        ]
      },
      japan: {
        title: '💡 入国審査官からのよくある質問 / Immigration Officer FAQs',
        questions: [
          {
            q: 'Q: 日本への渡航目的は何ですか？ / What is the purpose of your visit to Japan?',
            a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || '観光 / Tourism'
          },
          {
            q: 'Q: 日本にどのくらい滞在しますか？ / How long will you stay in Japan?',
            a: travelInfo?.lengthOfStay || '7日間 / 7 days'
          },
          {
            q: 'Q: 日本での滞在先はどこですか？ / Where will you be staying in Japan?',
            a: stayLocationAnswer
          },
      {
        q: 'Q: いくら所持していますか？ / How much money do you have?',
        a: `${formatBilingualCurrency(totalFunds)} (現金とカード / Cash and cards)`
      }
    ]
      },
      vietnam: {
        title: '💡 Câu hỏi thường gặp',
        questions: [
          {
            q: 'Q: Bạn đến Việt Nam với mục đích gì?',
            a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'Du lịch'
          },
          {
            q: 'Q: Bạn sẽ ở lại Việt Nam bao lâu?',
            a: travelInfo?.lengthOfStay || '7 ngày'
          },
          {
            q: 'Q: Bạn sẽ lưu trú ở đâu?',
            a: stayLocationAnswer
          },
          {
            q: 'Q: Bạn mang theo bao nhiêu tiền?',
            a: `${formatBilingualCurrency(totalFunds)} (Tiền mặt & thẻ ngân hàng)`
          }
        ]
      }
    };

    // Map normalized country codes to tipsConfig keys (same mapping as tabsConfig)
    const tipsConfigKey = country === 'us' ? 'usa' : 
                          country === 'my' ? 'malaysia' :
                          country === 'sg' ? 'singapore' :
                          country === 'hk' ? 'hongkong' :
                          country === 'tw' ? 'taiwan' :
                          country === 'jp' ? 'japan' :
                          country === 'vn' ? 'vietnam' :
                          country === 'th' ? 'thailand' :
                          country;
    return tipsConfig[tipsConfigKey] || tipsConfig.thailand;
  };

  const renderImmigrationTips = () => {
    const tips = getTipsConfig();
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{tips.title}</Text>
        <View style={styles.tipsList}>
          {tips.questions.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipQuestion}>{tip.q}</Text>
              <Text style={styles.tipAnswer}>A: {tip.a}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

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
      case 'hdac':
      case 'sgac':
      case 'twac':
      case 'i94':
      case 'jdac':
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
    ],
    hongkong: [
      { key: 'hdac', label: '入境資料', labelEn: 'Entry Info' },
      { key: 'personal', label: '個人資料', labelEn: 'Personal' },
      { key: 'travel', label: '旅行資料', labelEn: 'Travel' },
      { key: 'funds', label: '資金證明', labelEn: 'Funds' },
    ],
    singapore: [
      { key: 'sgac', label: 'SGAC', labelEn: '入境卡' },
      { key: 'personal', label: 'Personal', labelEn: '个人' },
      { key: 'travel', label: 'Travel', labelEn: '旅行' },
      { key: 'funds', label: 'Funds', labelEn: '资金' },
    ],
    taiwan: [
      { key: 'twac', label: '入境資料', labelEn: 'Entry Info' },
      { key: 'personal', label: '個人資料', labelEn: 'Personal' },
      { key: 'travel', label: '旅行資料', labelEn: 'Travel' },
      { key: 'funds', label: '資金證明', labelEn: 'Funds' },
    ],
    usa: [
      { key: 'i94', label: 'I-94', labelEn: '' },
      { key: 'personal', label: 'Personal', labelEn: '' },
      { key: 'travel', label: 'Travel', labelEn: '' },
      { key: 'funds', label: 'Funds', labelEn: '' },
    ],
    japan: [
      { key: 'jdac', label: '入国カード', labelEn: 'Entry Card' },
      { key: 'personal', label: '個人情報', labelEn: 'Personal' },
      { key: 'travel', label: '旅行情報', labelEn: 'Travel' },
      { key: 'funds', label: '資金情報', labelEn: 'Funds' },
    ],
    korea: [
      { key: 'personal', label: '개인 정보', labelEn: 'Personal' },
      { key: 'travel', label: '여행 정보', labelEn: 'Travel' },
      { key: 'funds', label: '자금 정보', labelEn: 'Funds' },
    ],
    vietnam: [
      { key: 'personal', label: 'Thông tin cá nhân', labelEn: '' },
      { key: 'travel', label: 'Thông tin hành trình', labelEn: '' },
      { key: 'funds', label: 'Chứng minh tài chính', labelEn: '' },
    ]
  };

  // Map normalized country codes to tabsConfig keys
  const tabsConfigKey = country === 'us' ? 'usa' : 
                        country === 'my' ? 'malaysia' :
                        country === 'sg' ? 'singapore' :
                        country === 'hk' ? 'hongkong' :
                        country === 'tw' ? 'taiwan' :
                        country === 'jp' ? 'japan' :
                        country === 'kr' ? 'korea' :
                        country === 'vn' ? 'vietnam' :
                        country === 'th' ? 'thailand' :
                        country;
  const tabs = tabsConfig[tabsConfigKey] || tabsConfig.thailand;

  const headerTitles = {
    thailand: '🇹🇭 ชุดข้อมูลตรวจคนเข้าเมือง',
    malaysia: '🇲🇾 Entry Pack',
  singapore: '🇸🇬 Entry Pack',
  taiwan: '🇹🇼 臺灣入境資料包',
  usa: '🇺🇸 Entry Pack',
  hongkong: '🇭🇰 入境資料包',
  japan: '🇯🇵 入国情報パック',
  korea: '🇰🇷 입국 정보 팩',
  vietnam: '🇻🇳 Gói thông tin nhập cảnh Việt Nam'
};

  const headerSubtitles = {
    thailand: 'ข้อมูลสำคัญสำหรับเจ้าหน้าที่ตรวจคนเข้าเมือง',
    malaysia: 'Important information for immigration officer',
  singapore: 'Important information for immigration officer',
  taiwan: '入境處重要資料',
  usa: 'Important information for immigration officer',
  hongkong: '入境處重要資料',
  japan: '入国審査官への重要情報',
  korea: '출입국 심사관을 위한 중요한 정보',
  vietnam: 'Thông tin quan trọng dành cho cán bộ nhập cảnh'
};

  return (
    <View style={[styles.container, isModal && styles.modalContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{headerTitles[tabsConfigKey] || headerTitles.thailand}</Text>
        <Text style={styles.subtitle}>{headerSubtitles[tabsConfigKey] || headerSubtitles.thailand}</Text>

        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              index === tabs.length - 1 && styles.lastTab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            {tab.labelEn && (
              <Text style={[styles.tabTextEn, activeTab === tab.key && styles.activeTabText]}>
                {tab.labelEn}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      {/* Photo Viewer Modal */}
      <Modal
        visible={photoViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClosePhotoViewer}
      >
        <View style={styles.photoViewerOverlay}>
          <TouchableOpacity
            style={styles.photoViewerBackdrop}
            activeOpacity={1}
            onPress={handleClosePhotoViewer}
          />
          <View style={styles.photoViewerContent}>
            {selectedPhotoUri && (
              <Image
                source={{ uri: selectedPhotoUri }}
                style={styles.photoViewerImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.photoViewerCloseButton}
              onPress={handleClosePhotoViewer}
            >
              <View style={styles.photoViewerCloseButtonCircle}>
                <Text style={styles.photoViewerCloseButtonText}>✕</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.photoViewerHintContainer}>
              <Text style={styles.photoViewerHint}>
                {country === 'th' ? 'รูปหลักฐานเงินทุน' :
                 country === 'my' ? 'Fund Proof Photo' :
                 country === 'sg' || country === 'us' ? 'Fund Proof Photo' :
                 country === 'hk' || country === 'tw' ? '資金證明照片' :
                 country === 'jp' ? '資金証明写真' :
                 country === 'kr' ? '자금 증빙 사진' :
                 'รูปหลักฐานเงินทุน'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
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
    paddingVertical: spacing.sm,
  },
  tabContentContainer: {
    paddingHorizontal: spacing.md,
    paddingRight: spacing.lg,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 70,
    alignItems: 'center',
  },
  lastTab: {
    marginRight: 0,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
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
  fundProofContainer: {
    marginTop: spacing.xs,
  },
  fundProof: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  },
  fundProofHint: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  fundsTotal: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#D0D8E0',
  },
  totalLabel: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
    width: '100%',
  },
  totalAmount: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
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
  pdfContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 600,
  },
  pdfTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontSize: 16,
  },
  pdfHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
  },
  pdfViewer: {
    height: 700,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  samplePdfContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#ff9800',
    borderStyle: 'dashed',
  },
  samplePdfHeader: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  samplePdfTitle: {
    ...typography.body,
    color: '#ff9800',
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontSize: 16,
  },
  samplePdfSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    marginTop: spacing.xs / 2,
    lineHeight: 16,
  },
  samplePdfViewer: {
    height: 600,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  pdfInfoHint: {
    backgroundColor: colors.info || '#e3f2fd',
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.sm,
  },
  pdfInfoText: {
    ...typography.caption,
    color: colors.primary || '#1976d2',
    textAlign: 'center',
    fontSize: 12,
  },
  samplePdfFooter: {
    ...typography.caption,
    color: '#ff9800',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    marginTop: spacing.xs,
    fontStyle: 'italic',
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
  // Photo Viewer Modal Styles
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  photoViewerContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerImage: {
    width: '100%',
    height: '80%',
  },
  photoViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    zIndex: 10,
  },
  photoViewerCloseButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  photoViewerCloseButtonText: {
    fontSize: 24,
    color: colors.surface,
    fontWeight: '600',
  },
  photoViewerHintContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoViewerHint: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default EntryPackDisplay;
