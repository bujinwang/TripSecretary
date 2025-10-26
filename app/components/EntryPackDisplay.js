import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import TDACInfoCard from './TDACInfoCard';
import { thailandProvinces } from '../data/thailandProvinces';

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
  singapore: {
    entryCardName: 'SGAC',
    entryCardTab: 'sgac',
    entryCardTitle: 'SG Arrival Card (SGAC) / 新加坡入境卡',
    personalInfoTitle: 'Personal Information / 个人信息',
    travelInfoTitle: 'Travel Information / 旅行信息',
    fundsTitle: 'Funds Information / 资金信息',
    currency: 'SGD',
    currencyName: '新元',
    notProvided: 'Not provided / 未提供',
    fallbackHotelText: 'Please provide accommodation address / 请提供住宿地址',
    labels: {
      fullName: 'Full Name / 全名',
      passportNumber: 'Passport Number / 护照号码',
      nationality: 'Nationality / 国籍',
      dateOfBirth: 'Date of Birth / 出生日期',
      arrivalDate: 'Arrival Date / 抵达日期',
      departureDate: 'Departure Date / 离开日期',
      flightNumber: 'Flight Number / 航班号',
      stayLocation: 'Accommodation / 住宿地址',
      lengthOfStay: 'Length of Stay / 停留时间',
      purpose: 'Purpose of Visit / 访问目的',
      totalFunds: 'Total Funds / 资金总额',
      fundType: 'Type / 类型',
      amount: 'Amount / 金额'
    },
    dateLocales: ['en-US', 'zh-CN']
  },
  japan: {
    entryCardName: 'JDAC',
    entryCardTab: 'jdac',
    entryCardTitle: '入国カード / Japan Entry Card',
    personalInfoTitle: '個人情報 / Personal Information',
    travelInfoTitle: '旅行情報 / Travel Information',
    fundsTitle: '資金情報 / Funds Information',
    currency: 'JPY',
    currencyName: '円',
    notProvided: '未提供 / Not provided',
    fallbackHotelText: '宿泊先住所を入力してください / Please provide accommodation address',
    labels: {
      fullName: '氏名 / Full Name',
      passportNumber: 'パスポート番号 / Passport Number',
      nationality: '国籍 / Nationality',
      dateOfBirth: '生年月日 / Date of Birth',
      arrivalDate: '到着日 / Arrival Date',
      departureDate: '出発日 / Departure Date',
      flightNumber: '便名 / Flight Number',
      stayLocation: '滞在先 / Accommodation',
      lengthOfStay: '滞在期間 / Length of Stay',
      purpose: '渡航目的 / Purpose of Visit',
      totalFunds: '所持金合計 / Total Funds',
      fundType: '種類 / Type',
      amount: '金額 / Amount'
    },
    dateLocales: ['ja-JP', 'en-US']
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

    // Simply format the number with the currency code (no bilingual conversion)
    const formattedAmount = numericAmount.toLocaleString('en-US');
    return `${formattedAmount} ${currency}`;
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
      },
      singapore: {
        cash: 'Cash / 现金',
        credit_card: 'Credit Card / 信用卡',
        bank_balance: 'Bank Balance / 银行存款',
        investment: 'Investments / 投资',
        card: 'Bank Card / 银行卡',
        debit_card: 'Debit Card / 借记卡',
        other: 'Other / 其他'
      },
      japan: {
        cash: '現金 / Cash',
        credit_card: 'クレジットカード / Credit Card',
        bank_balance: '銀行残高 / Bank Balance',
        investment: '投資 / Investments',
        card: '銀行カード / Bank Card',
        debit_card: 'デビットカード / Debit Card',
        other: 'その他 / Other'
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
    const proofPhotoTexts = {
      thailand: '📸 มีหลักฐานรูปภาพแล้ว / Proof photo uploaded',
      malaysia: '📸 Proof photo uploaded / Foto bukti dimuat naik',
      singapore: '📸 Proof photo uploaded / 已上传凭证照片',
      japan: '📸 証明写真アップロード済み / Proof photo uploaded'
    };
    const proofPhotoText = proofPhotoTexts[country] || proofPhotoTexts.thailand;

    const noDataTexts = {
      thailand: 'ยังไม่มีข้อมูลเงินทุน / No funds information',
      malaysia: 'No funds information / Tiada maklumat kewangan',
      singapore: 'No funds information / 未提供资金信息',
      japan: '資金情報なし / No funds information'
    };
    const noDataText = noDataTexts[country] || noDataTexts.thailand;

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

  const renderTDACInfo = () => {
    const placeholderTitles = {
      thailand: 'ยังไม่ได้ส่ง TDAC / TDAC Not Submitted Yet',
      malaysia: 'MDAC Not Submitted Yet / MDAC Belum Dihantar',
      singapore: 'SGAC Not Submitted Yet / 新加坡入境卡尚未提交',
      japan: '入国カード未提出 / Entry Card Not Submitted Yet'
    };

    const placeholderDescriptions = {
      thailand: 'กรุณาส่งแบบฟอร์ม TDAC ภายใน 72 ชั่วโมงก่อนเดินทางถึง / Please submit TDAC within 72 hours before arrival',
      malaysia: 'Please submit MDAC within 3 days before arrival / Sila hantar MDAC dalam 3 hari sebelum ketibaan',
      singapore: 'Please submit SGAC within 3 days before arrival / 请在抵达前3天内提交新加坡入境卡',
      japan: '到着前にVisit Japan Webで入国カードを提出してください / Please submit entry card via Visit Japan Web before arrival'
    };

    const qrPlaceholderTexts = {
      thailand: 'จะแสดงรหัส QR หลังจากส่งเรียบร้อย / QR Code will appear after submission',
      malaysia: 'QR Code will appear after submission / Kod QR akan muncul selepas penghantaran',
      singapore: 'DE Number will appear after submission / 提交后会显示DE编号',
      japan: 'QRコードは提出後に表示されます / QR Code will appear after submission'
    };

    const placeholderNotes = {
      thailand: 'หากยังไม่มี TDAC สามารถแสดงข้อมูลอื่นให้เจ้าหน้าที่ตรวจคนเข้าเมืองได้ / You can still show other information to immigration officer even without TDAC',
      malaysia: 'You can still show other information to immigration officer / Anda masih boleh tunjukkan maklumat lain kepada pegawai imigresen',
      singapore: 'You can still show other information to immigration officer / 您仍可向入境官员出示其他信息',
      japan: '入国カードがなくても、他の情報を入国審査官に提示できます / You can still show other information to immigration officer even without entry card'
    };

    return (
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
              {placeholderTitles[country] || placeholderTitles.thailand}
            </Text>
            <Text style={styles.placeholderDescription}>
              {placeholderDescriptions[country] || placeholderDescriptions.thailand}
            </Text>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>
                {qrPlaceholderTexts[country] || qrPlaceholderTexts.thailand}
              </Text>
            </View>
            <Text style={styles.placeholderNote}>
              {placeholderNotes[country] || placeholderNotes.thailand}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderImmigrationTips = () => {
    const tipsConfig = {
      thailand: {
        title: '💡 คำถามที่พบบ่อยจากเจ้าหน้าที่ตรวจคนเข้าเมือง / Immigration Officer FAQs',
        questions: [
          { q: 'Q: จุดประสงค์ในการมาไทยคืออะไร? / What is the purpose of your visit?', a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'ท่องเที่ยว / Tourism' },
          { q: 'Q: คุณจะพำนักในประเทศไทยนานเท่าใด? / How long will you stay in Thailand?', a: travelInfo?.lengthOfStay || '30 วัน / 30 days' },
          { q: 'Q: คุณจะพักที่ไหน? / Where will you be staying?', a: stayLocationAnswer },
          { q: 'Q: คุณมีเงินทุนเท่าไร? / How much money do you have?', a: `${formatBilingualCurrency(totalFunds)} (เงินสดและบัตรธนาคาร / Cash and bank cards)` }
        ]
      },
      malaysia: {
        title: '💡 Immigration Officer FAQs / Soalan Lazim Pegawai Imigresen',
        questions: [
          { q: 'Q: What is the purpose of your visit? / Apakah tujuan lawatan anda?', a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'Tourism / Pelancongan' },
          { q: 'Q: How long will you stay in Malaysia? / Berapa lama anda akan tinggal di Malaysia?', a: travelInfo?.lengthOfStay || '7 days / 7 hari' },
          { q: 'Q: Where will you be staying? / Di mana anda akan menginap?', a: stayLocationAnswer },
          { q: 'Q: How much money do you have? / Berapa banyak wang yang anda bawa?', a: `${formatBilingualCurrency(totalFunds)} (Cash and cards / Tunai dan kad)` }
        ]
      },
      singapore: {
        title: '💡 Immigration Officer FAQs / 入境官员常见问题',
        questions: [
          { q: 'Q: What is the purpose of your visit? / 您来新加坡的目的是什么？', a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || 'Tourism / 旅游' },
          { q: 'Q: How long will you stay in Singapore? / 您会在新加坡停留多久？', a: travelInfo?.lengthOfStay || '7 days / 7天' },
          { q: 'Q: Where will you be staying? / 您会住在哪里？', a: stayLocationAnswer },
          { q: 'Q: How much money do you have? / 您带了多少钱？', a: `${formatBilingualCurrency(totalFunds)} (Cash and cards / 现金和银行卡)` }
        ]
      },
      japan: {
        title: '💡 入国審査官からのよくある質問 / Immigration Officer FAQs',
        questions: [
          { q: 'Q: 日本への渡航目的は何ですか？ / What is the purpose of your visit to Japan?', a: travelInfo?.travelPurpose || travelInfo?.purposeOfVisit || '観光 / Tourism' },
          { q: 'Q: 日本にどのくらい滞在しますか？ / How long will you stay in Japan?', a: travelInfo?.lengthOfStay || '7日間 / 7 days' },
          { q: 'Q: 日本での滞在先はどこですか？ / Where will you be staying in Japan?', a: stayLocationAnswer },
          { q: 'Q: いくら所持していますか？ / How much money do you have?', a: `${formatBilingualCurrency(totalFunds)} (現金とカード / Cash and cards)` }
        ]
      }
    };

    const tips = tipsConfig[country] || tipsConfig.thailand;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{tips.title}</Text>

        <View style={styles.tipsList}>
          {tips.questions.map((item, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipQuestion}>{item.q}</Text>
              <Text style={styles.tipAnswer}>A: {item.a}</Text>
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
      case 'sgac':
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
    singapore: [
      { key: 'sgac', label: 'SGAC', labelEn: '入境卡' },
      { key: 'personal', label: 'Personal', labelEn: '个人' },
      { key: 'travel', label: 'Travel', labelEn: '旅行' },
      { key: 'funds', label: 'Funds', labelEn: '资金' },
    ],
    japan: [
      { key: 'jdac', label: '入国カード', labelEn: 'Entry Card' },
      { key: 'personal', label: '個人情報', labelEn: 'Personal' },
      { key: 'travel', label: '旅行情報', labelEn: 'Travel' },
      { key: 'funds', label: '資金情報', labelEn: 'Funds' },
    ]
  };

  const tabs = tabsConfig[country] || tabsConfig.thailand;

  const headerTitles = {
    thailand: '🇹🇭 ชุดข้อมูลตรวจคนเข้าเมือง / Entry Pack',
    malaysia: '🇲🇾 Entry Pack / Pakej Kemasukan',
    singapore: '🇸🇬 Entry Pack / 入境信息包',
    japan: '🇯🇵 入国情報パック / Entry Pack'
  };

  const headerSubtitles = {
    thailand: 'ข้อมูลสำคัญสำหรับเจ้าหน้าที่ตรวจคนเข้าเมือง / Important information for immigration officer',
    malaysia: 'Important information for immigration officer / Maklumat penting untuk pegawai imigresen',
    singapore: 'Important information for immigration officer / 重要入境信息',
    japan: '入国審査官への重要情報 / Important information for immigration officer'
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
            : country === 'singapore'
            ? 'Please show this entry pack to the immigration officer / 请向入境官员出示此信息包'
            : country === 'japan'
            ? 'この情報パックを入国審査官に提示してください / Please show this entry pack to the immigration officer'
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
