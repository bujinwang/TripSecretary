
// 出境通 - Thailand Travel Info Screen (泰国入境信息)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const CollapsibleSection = ({ title, children, onScan }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={toggleCollapse} activeOpacity={0.8}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {onScan && (
            <TouchableOpacity style={styles.scanButton} onPress={onScan}>
              <Text style={styles.scanIcon}>📸</Text>
              <Text style={styles.scanText}>扫描</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sectionIcon}>{isCollapsed ? '▼' : '▲'}</Text>
        </View>
      </TouchableOpacity>
      {!isCollapsed && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const ThailandTravelInfoScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};
  const { t } = useLocale();

  // Passport Info State
  const [passportNo, setPassportNo] = useState(passport?.passportNo || '');
  const [fullName, setFullName] = useState(passport?.name || '');
  const [nationality, setNationality] = useState(passport?.nationality || '');
  const [dob, setDob] = useState(passport?.dob || '');
  const [expiryDate, setExpiryDate] = useState(passport?.expiry || '');

  // Personal Info State
  const [sex, setSex] = useState(passport?.sex || '');
  const [occupation, setOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Proof of Funds State
  const [funds, setFunds] = useState([]);

  // Travel Info State
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDepartureAirport, setArrivalDepartureAirport] = useState('');
  const [arrivalDepartureDateTime, setArrivalDepartureDateTime] = useState('');
  const [arrivalArrivalAirport, setArrivalArrivalAirport] = useState('');
  const [arrivalArrivalDateTime, setArrivalArrivalDateTime] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureAirport, setDepartureDepartureAirport] = useState('');
  const [departureDepartureDateTime, setDepartureDepartureDateTime] = useState('');
  const [departureArrivalAirport, setDepartureArrivalAirport] = useState('');
  const [departureArrivalDateTime, setDepartureArrivalDateTime] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');

  const [errors, setErrors] = useState({});

  const addFund = (type) => {
    const newFund = { id: Date.now(), type };
    if (type === 'cash') {
      newFund.amount = '';
      newFund.details = '';
    } else {
      newFund.photo = null;
    }
    setFunds([...funds, newFund]);
  };

  const removeFund = (id) => {
    setFunds(funds.filter((fund) => fund.id !== id));
  };

  const updateFund = (id, key, value) => {
    setFunds(
      funds.map((fund) => (fund.id === id ? { ...fund, [key]: value } : fund))
    );
  };


  const validate = () => {
    const newErrors = {};
    if (!passportNo) newErrors.passportNo = '护照号不能为空';
    if (!fullName) newErrors.fullName = '姓名不能为空';
    if (!nationality) newErrors.nationality = '国籍不能为空';
    if (!expiryDate) newErrors.expiryDate = '护照有效期不能为空';
    if (!dob) newErrors.dob = '出生日期不能为空';
    if (!sex) newErrors.sex = '性别不能为空';
    if (!occupation) newErrors.occupation = '职业不能为空';
    if (!cityOfResidence) newErrors.cityOfResidence = '居住城市不能为空';
    if (!residentCountry) newErrors.residentCountry = '居住国家不能为空';
    if (!phoneNumber) newErrors.phoneNumber = '电话号码不能为空';
    if (!email) newErrors.email = '电子邮箱不能为空';
    if (!arrivalFlightNumber) newErrors.arrivalFlightNumber = '抵达航班号不能为空';
    if (!arrivalDepartureAirport) newErrors.arrivalDepartureAirport = '出发机场不能为空';
    if (!arrivalDepartureDateTime) newErrors.arrivalDepartureDateTime = '出发时间不能为空';
    if (!arrivalArrivalAirport) newErrors.arrivalArrivalAirport = '抵达机场不能为空';
    if (!arrivalArrivalDateTime) newErrors.arrivalArrivalDateTime = '抵达时间不能为空';
    if (!departureFlightNumber) newErrors.departureFlightNumber = '离开航班号不能为空';
    if (!departureDepartureAirport) newErrors.departureDepartureAirport = '出发机场不能为空';
    if (!departureDepartureDateTime) newErrors.departureDepartureDateTime = '出发时间不能为空';
    if (!departureArrivalAirport) newErrors.departureArrivalAirport = '抵达机场不能为空';
    if (!departureArrivalDateTime) newErrors.departureArrivalDateTime = '抵达时间不能为空';
    if (!hotelName) newErrors.hotelName = '酒店名称不能为空';
    if (!hotelAddress) newErrors.hotelAddress = '酒店地址不能为空';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) {
      return;
    }

    const travelInfo = {
      // Passport Info
      passportNo,
      fullName,
      nationality,
      dob,
      expiryDate,

      // Personal Info
      sex,
      occupation,
      cityOfResidence,
      residentCountry,
      phoneNumber,
      email,

      // Proof of Funds
      funds,

      // Travel Info
      arrivalFlightNumber,
      arrivalDepartureAirport,
      arrivalDepartureDateTime,
      arrivalArrivalAirport,
      arrivalArrivalDateTime,
      departureFlightNumber,
      departureDepartureAirport,
      departureDepartureDateTime,
      departureArrivalAirport,
      departureArrivalDateTime,
      hotelName,
      hotelAddress,
    };

    navigation.navigate('Generating', {
      passport,
      destination,
      travelInfo,
    });
  };

  const handleScanPassport = () => {
    console.log('Scan Passport');
    // navigation.navigate('ScanPassport');
  };

  const handleScanTickets = () => {
    console.log('Scan Tickets');
  };

  const handleScanHotel = () => {
    console.log('Scan Hotel');
  };
  
  const handleTakePhoto = () => {
    console.log('Take Photo');
  };

  const handleChoosePhoto = (id) => {
    Alert.alert('选择照片', '', [
      {
        text: '拍照',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('需要相机权限');
            return;
          }
          const result = await ImagePicker.launchCameraAsync();
          if (!result.canceled) {
            updateFund(id, 'photo', result.assets[0].uri);
          }
        },
      },
      {
        text: '从相册选择',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('需要相册权限');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync();
          if (!result.canceled) {
            updateFund(id, 'photo', result.assets[0].uri);
          }
        },
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const renderGenderOptions = () => {
    const options = ['Female', 'Male', 'Undefined'];
    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              sex === option && styles.optionButtonActive,
            ]}
            onPress={() => setSex(option)}
          >
            <Text
              style={[
                styles.optionText,
                sex === option && styles.optionTextActive,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>泰国入境信息</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇹🇭</Text>
          <Text style={styles.title}>填写泰国入境信息</Text>
          <Text style={styles.subtitle}>请提供以下信息以完成入境卡生成</Text>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            所有信息仅保存在您的手机本地
          </Text>
        </View>

        <CollapsibleSection title="护照信息" onScan={handleScanPassport}>
          <Input label="护照号" value={passportNo} onChangeText={setPassportNo} helpText="请输入您的护照号码" error={!!errors.passportNo} errorMessage={errors.passportNo} />
          <Input label="姓名" value={fullName} onChangeText={setFullName} helpText="请输入您的全名" error={!!errors.fullName} errorMessage={errors.fullName} />
          <Input label="国籍" value={nationality} onChangeText={setNationality} helpText="请输入您的国籍" error={!!errors.nationality} errorMessage={errors.nationality} />
          <Input label="出生日期" value={dob} onChangeText={setDob} helpText="格式: YYYY-MM-DD" error={!!errors.dob} errorMessage={errors.dob} />
          <Input label="护照有效期" value={expiryDate} onChangeText={setExpiryDate} helpText="格式: YYYY-MM-DD" error={!!errors.expiryDate} errorMessage={errors.expiryDate} />
        </CollapsibleSection>

        <CollapsibleSection title="个人信息">
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>性别</Text>
            {renderGenderOptions()}
          </View>
          <Input label="职业" value={occupation} onChangeText={setOccupation} helpText="请输入您的职业" error={!!errors.occupation} errorMessage={errors.occupation} />
          <Input label="居住城市" value={cityOfResidence} onChangeText={setCityOfResidence} helpText="请输入您居住的城市" error={!!errors.cityOfResidence} errorMessage={errors.cityOfResidence} />
          <Input label="居住国家" value={residentCountry} onChangeText={setResidentCountry} helpText="请输入您居住的国家" error={!!errors.residentCountry} errorMessage={errors.residentCountry} />
          <Input label="电话号码" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" helpText="请输入您的电话号码" error={!!errors.phoneNumber} errorMessage={errors.phoneNumber} />
          <Input label="电子邮箱" value={email} onChangeText={setEmail} keyboardType="email-address" helpText="请输入您的电子邮箱地址" error={!!errors.email} errorMessage={errors.email} />
        </CollapsibleSection>

        <CollapsibleSection title="资金证明">
          <View style={styles.fundActions}>
            <Button title="添加现金" onPress={() => addFund('cash')} variant="secondary" style={styles.fundButton} />
            <Button title="添加信用卡照片" onPress={() => addFund('credit_card')} variant="secondary" style={styles.fundButton} />
            <Button title="添加银行账户余额" onPress={() => addFund('bank_balance')} variant="secondary" style={styles.fundButton} />
          </View>

          {funds.map((fund, index) => (
            <View key={fund.id} style={styles.fundItem}>
              <Text style={styles.fundType}>{{
                'cash': '现金',
                'credit_card': '信用卡照片',
                'bank_balance': '银行账户余额',
              }[fund.type]}</Text>
              {fund.type === 'cash' ? (
                <>
                  <Input
                    label="金额"
                    value={fund.amount}
                    onChangeText={(text) => updateFund(fund.id, 'amount', text)}
                    keyboardType="numeric"
                  />
                  <Input
                    label="细节"
                    value={fund.details}
                    onChangeText={(text) => updateFund(fund.id, 'details', text)}
                  />
                </>
              ) : (
                <View>
                  <TouchableOpacity style={styles.photoButton} onPress={() => handleChoosePhoto(fund.id)}>
                    <Text style={styles.photoButtonText}>{fund.photo ? '更换照片' : '添加照片'}</Text>
                  </TouchableOpacity>
                  {fund.photo && <Image source={{ uri: fund.photo }} style={styles.fundImage} />}
                </View>
              )}
              <Button title="删除" onPress={() => removeFund(fund.id)} variant="danger" />
            </View>
          ))}
        </CollapsibleSection>

        <CollapsibleSection title="旅行信息">
          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>来泰国机票</Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanTickets}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
          </View>
          <Input label="航班号" value={arrivalFlightNumber} onChangeText={setArrivalFlightNumber} helpText="请输入您的抵达航班号" error={!!errors.arrivalFlightNumber} errorMessage={errors.arrivalFlightNumber} />
          <Input label="出发机场" value={arrivalDepartureAirport} onChangeText={setArrivalDepartureAirport} helpText="请输入出发机场" error={!!errors.arrivalDepartureAirport} errorMessage={errors.arrivalDepartureAirport} />
          <Input label="出发时间" value={arrivalDepartureDateTime} onChangeText={setArrivalDepartureDateTime} helpText="格式: YYYY-MM-DD HH:MM" error={!!errors.arrivalDepartureDateTime} errorMessage={errors.arrivalDepartureDateTime} />
          <Input label="抵达机场" value={arrivalArrivalAirport} onChangeText={setArrivalArrivalAirport} helpText="请输入抵达机场" error={!!errors.arrivalArrivalAirport} errorMessage={errors.arrivalArrivalAirport} />
          <Input label="抵达时间" value={arrivalArrivalDateTime} onChangeText={setArrivalArrivalDateTime} helpText="格式: YYYY-MM-DD HH:MM" error={!!errors.arrivalArrivalDateTime} errorMessage={errors.arrivalArrivalDateTime} />

          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>去程机票</Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanTickets}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
          </View>
          <Input label="航班号" value={departureFlightNumber} onChangeText={setDepartureFlightNumber} helpText="请输入您的离开航班号" error={!!errors.departureFlightNumber} errorMessage={errors.departureFlightNumber} />
          <Input label="出发机场" value={departureDepartureAirport} onChangeText={setDepartureDepartureAirport} helpText="请输入出发机场" error={!!errors.departureDepartureAirport} errorMessage={errors.departureDepartureAirport} />
          <Input label="出发时间" value={departureDepartureDateTime} onChangeText={setDepartureDepartureDateTime} helpText="格式: YYYY-MM-DD HH:MM" error={!!errors.departureDepartureDateTime} errorMessage={errors.departureDepartureDateTime} />
          <Input label="抵达机场" value={departureArrivalAirport} onChangeText={setDepartureArrivalAirport} helpText="请输入抵达机场" error={!!errors.departureArrivalAirport} errorMessage={errors.departureArrivalAirport} />
          <Input label="抵达时间" value={departureArrivalDateTime} onChangeText={setDepartureArrivalDateTime} helpText="格式: YYYY-MM-DD HH:MM" error={!!errors.departureArrivalDateTime} errorMessage={errors.departureArrivalDateTime} />
          
          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>旅馆信息</Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanHotel}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
          </View>
          <Input label="酒店名称" value={hotelName} onChangeText={setHotelName} helpText="请输入您预订的酒店名称" error={!!errors.hotelName} errorMessage={errors.hotelName} />
          <Input label="酒店地址" value={hotelAddress} onChangeText={setHotelAddress} multiline helpText="请输入您预订的酒店地址" error={!!errors.hotelAddress} errorMessage={errors.hotelAddress} />
        </CollapsibleSection>

        <View style={styles.buttonContainer}>
          <Button
            title="生成入境卡"
            onPress={handleContinue}
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    paddingBottom: spacing.xxl,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  flag: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  sectionIcon: {
    ...typography.h3,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  sectionContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  placeholderText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  scanIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  scanText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  subSectionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    margin: spacing.xs,
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    ...typography.body1,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  fundActions: {
    flexDirection: 'column',
    marginBottom: spacing.md,
  },
  fundButton: {
    marginVertical: spacing.xs,
  },
  fundItem: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  fundType: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  photoButton: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  fundImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  privacyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  privacyText: {
    fontSize: 13,
    color: '#34C759',
    flex: 1,
    lineHeight: 18,
  },
});

export default ThailandTravelInfoScreen;
