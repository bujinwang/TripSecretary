// 出国啰 - Travel Info Screen (补充旅行信息)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { colors, typography, spacing, borderRadius } from '../theme';
import { checkDuplicate, getTimeUntilArrival } from '../utils/generationHistory';
import api from '../services/api';

const TravelInfoScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};

  // Form state
  const [flightNumber, setFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [stayDuration, setStayDuration] = useState('');
  const [travelPurpose, setTravelPurpose] = useState('旅游');
  
  // For US customs
  const [cashAmount, setCashAmount] = useState('否');
  const [carryingFood, setCarryingFood] = useState('否');
  
  // For Canada customs (E311)
  const [exceedsDutyFree, setExceedsDutyFree] = useState('否');
  const [hasFirearms, setHasFirearms] = useState('否');
  const [hasCommercialGoods, setHasCommercialGoods] = useState('否');
  const [visitedFarm, setVisitedFarm] = useState('否');
  const [hasHighCurrency, setHasHighCurrency] = useState('否');
  const [arrivingFrom, setArrivingFrom] = useState('其他国家'); // '美国' or '其他国家'
  
  // For Thailand health declaration
  const [hasFever, setHasFever] = useState('否');
  
  // Duplicate check state
  const [duplicateRecord, setDuplicateRecord] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Get required fields based on destination
  const getRequiredFields = () => {
    const destName = destination?.name || '';
    
    switch (destName) {
      case '香港':
        return []; // 香港不需要额外信息
      case '台湾':
        return ['flightNumber', 'hotelAddress', 'contactPhone', 'travelPurpose'];
      case '泰国':
        return ['flightNumber', 'arrivalDate', 'hotelName', 'hotelAddress', 'contactPhone', 'stayDuration', 'hasFever'];
      case '美国':
        return ['flightNumber', 'hotelAddress', 'travelPurpose', 'cashAmount', 'carryingFood'];
      default:
        return ['flightNumber', 'hotelAddress', 'contactPhone', 'stayDuration', 'travelPurpose'];
    }
  };

  const requiredFields = getRequiredFields();
  const needsHealthDeclaration = destination?.name === '泰国';
  const needsUSCustoms = destination?.name === '美国';
  const needsCanadaCustoms = destination?.name === '加拿大' || destination?.id === 'ca';

  const handleScanTicket = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要权限', '请允许访问相册');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });
      
      if (!result.canceled) {
        try {
          const ocrResult = await api.recognizeTicket(result.assets[0].uri);
          if (ocrResult.flightNumber) setFlightNumber(ocrResult.flightNumber);
          if (ocrResult.arrivalDate) setArrivalDate(ocrResult.arrivalDate);
          Alert.alert('识别成功', '已自动填充航班信息');
        } catch (error) {
          if (error.message.includes('未授权')) {
            Alert.alert('需要登录', '请先登录后使用OCR识别功能', [
              { text: '手动输入', style: 'cancel' },
              { text: '去登录', onPress: () => navigation.navigate('Login') }
            ]);
          } else {
            Alert.alert('识别失败', error.message || '请手动输入或重试');
          }
        }
      }
    } catch (error) {
      Alert.alert('错误', '无法打开相册');
    }
  };

  const handleScanHotel = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要权限', '请允许访问相册');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });
      
      if (!result.canceled) {
        try {
          const ocrResult = await api.recognizeHotel(result.assets[0].uri);
          if (ocrResult.hotelName) setHotelName(ocrResult.hotelName);
          if (ocrResult.address) setHotelAddress(ocrResult.address);
          if (ocrResult.phone) setContactPhone(ocrResult.phone);
          Alert.alert('识别成功', '已自动填充酒店信息');
        } catch (error) {
          if (error.message.includes('未授权')) {
            Alert.alert('需要登录', '请先登录后使用OCR识别功能', [
              { text: '手动输入', style: 'cancel' },
              { text: '去登录', onPress: () => navigation.navigate('Login') }
            ]);
          } else {
            Alert.alert('识别失败', error.message || '请手动输入或重试');
          }
        }
      }
    } catch (error) {
      Alert.alert('错误', '无法打开相册');
    }
  };

  const handleGenerate = () => {
    // TODO: Validate required fields
    const travelInfo = {
      flightNumber,
      arrivalDate,
      hotelName,
      hotelAddress,
      contactPhone,
      stayDuration,
      travelPurpose,
      // US customs
      cashAmount,
      carryingFood,
      // Canada customs (E311)
      exceedsDutyFree,
      hasFirearms,
      hasCommercialGoods,
      visitedFarm,
      hasHighCurrency,
      arrivingFrom,
      // Thailand health
      hasFever,
    };

    // Mock history data - 实际应该从 AsyncStorage 或 API 获取
    const historyList = [
      {
        id: 'existing-1',
        passport: { passportNo: 'E12345678' },
        destination: { id: 'th', name: '泰国' },
        travelInfo: {
          flightNumber: 'CA981',
          arrivalDate: '2025-01-15',
        },
        createdAt: '2025-01-10T10:00:00Z',
      },
    ];

    // 检查是否有重复记录
    const duplicate = checkDuplicate(
      { passport, destination, travelInfo },
      historyList
    );

    if (duplicate) {
      setDuplicateRecord(duplicate);
      setShowDuplicateWarning(true);
      return;
    }

    // 没有重复，继续生成
    navigation.navigate('Generating', {
      passport,
      destination,
      travelInfo,
    });
  };

  const handleUseDuplicate = () => {
    // 使用已有的记录
    navigation.navigate('Result', {
      passport,
      destination,
      travelInfo: duplicateRecord.travelInfo,
      fromHistory: true,
    });
  };

  const handleGenerateAnyway = () => {
    // 强制重新生成
    const travelInfo = {
      flightNumber,
      arrivalDate,
      hotelName,
      hotelAddress,
      contactPhone,
      stayDuration,
      travelPurpose,
      // US customs
      cashAmount,
      carryingFood,
      // Canada customs (E311)
      exceedsDutyFree,
      hasFirearms,
      hasCommercialGoods,
      visitedFarm,
      hasHighCurrency,
      arrivingFrom,
      // Thailand health
      hasFever,
    };

    setShowDuplicateWarning(false);
    navigation.navigate('Generating', {
      passport,
      destination,
      travelInfo,
      forceRegenerate: true,
    });
  };

  const renderPurposeOptions = () => {
    const purposes = ['旅游', '商务', '探亲', '学习', '工作'];
    return (
      <View style={styles.optionsContainer}>
        {purposes.map((purpose) => (
          <TouchableOpacity
            key={purpose}
            style={[
              styles.optionButton,
              travelPurpose === purpose && styles.optionButtonActive,
            ]}
            onPress={() => setTravelPurpose(purpose)}
          >
            <Text
              style={[
                styles.optionText,
                travelPurpose === purpose && styles.optionTextActive,
              ]}
            >
              {purpose}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderYesNoOptions = (value, setValue) => {
    return (
      <View style={styles.yesNoContainer}>
        <TouchableOpacity
          style={[
            styles.yesNoButton,
            value === '是' && styles.yesNoButtonActive,
          ]}
          onPress={() => setValue('是')}
        >
          <Text
            style={[
              styles.yesNoText,
              value === '是' && styles.yesNoTextActive,
            ]}
          >
            是
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.yesNoButton,
            value === '否' && styles.yesNoButtonActive,
          ]}
          onPress={() => setValue('否')}
        >
          <Text
            style={[
              styles.yesNoText,
              value === '否' && styles.yesNoTextActive,
            ]}
          >
            否
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>发现重复记录</Text>
            <Text style={styles.modalMessage}>
              你已经生成过相同航班的入境表格：
            </Text>
            
            <Card style={styles.duplicateInfoCard}>
              <Text style={styles.duplicateLabel}>目的地</Text>
              <Text style={styles.duplicateValue}>
                {duplicateRecord?.destination?.flag} {duplicateRecord?.destination?.name}
              </Text>
              
              <Text style={styles.duplicateLabel}>航班号</Text>
              <Text style={styles.duplicateValue}>
                {duplicateRecord?.travelInfo?.flightNumber}
              </Text>
              
              {duplicateRecord?.travelInfo?.arrivalDate && (
                <>
                  <Text style={styles.duplicateLabel}>到达日期</Text>
                  <Text style={styles.duplicateValue}>
                    {duplicateRecord?.travelInfo?.arrivalDate}
                    {' '}({getTimeUntilArrival(duplicateRecord?.travelInfo?.arrivalDate)})
                  </Text>
                </>
              )}
              
              <Text style={styles.duplicateLabel}>生成时间</Text>
              <Text style={styles.duplicateValue}>
                {new Date(duplicateRecord?.createdAt).toLocaleString('zh-CN')}
              </Text>
            </Card>

            <Text style={styles.modalHint}>
              建议直接使用已有记录，避免重复生成
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="使用已有记录"
                onPress={handleUseDuplicate}
                variant="primary"
                style={styles.modalButton}
              />
              <Button
                title="重新生成"
                onPress={handleGenerateAnyway}
                variant="secondary"
                style={styles.modalButton}
              />
            </View>
            
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDuplicateWarning(false)}
            >
              <Text style={styles.modalCloseText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>补充旅行信息</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Destination Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>{destination?.flag || '🌍'}</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>目的地: {destination?.name || ''}</Text>
              <Text style={styles.infoSubtitle}>
                请填写以下信息以生成入境表格
              </Text>
            </View>
          </View>
        </Card>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Flight Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✈️ 航班信息</Text>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={handleScanTicket}
              >
                <Text style={styles.scanIcon}>📸</Text>
                <Text style={styles.scanText}>扫描机票</Text>
              </TouchableOpacity>
            </View>
            
            <Input
              label="航班号"
              placeholder="例如: CA981, CZ309"
              value={flightNumber}
              onChangeText={setFlightNumber}
              required={requiredFields.includes('flightNumber')}
            />

            {requiredFields.includes('arrivalDate') && (
              <Input
                label="到达日期"
                placeholder="例如: 2025-01-15"
                value={arrivalDate}
                onChangeText={setArrivalDate}
                required
              />
            )}
          </View>

          {/* Accommodation Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏨 住宿信息</Text>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={handleScanHotel}
              >
                <Text style={styles.scanIcon}>📸</Text>
                <Text style={styles.scanText}>扫描预订单</Text>
              </TouchableOpacity>
            </View>
            
            {requiredFields.includes('hotelName') && (
              <Input
                label="酒店名称"
                placeholder="例如: Bangkok Grand Hotel"
                value={hotelName}
                onChangeText={setHotelName}
                required
              />
            )}

            <Input
              label="酒店地址"
              placeholder="例如: 123 Sukhumvit Road, Bangkok"
              value={hotelAddress}
              onChangeText={setHotelAddress}
              multiline
              required={requiredFields.includes('hotelAddress')}
            />

            {requiredFields.includes('contactPhone') && (
              <Input
                label="联系电话"
                placeholder="例如: +66 123456789"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                required
              />
            )}
          </View>

          {/* Trip Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 行程信息</Text>
            
            {requiredFields.includes('stayDuration') && (
              <Input
                label="停留天数"
                placeholder="例如: 7"
                value={stayDuration}
                onChangeText={setStayDuration}
                keyboardType="numeric"
                required
              />
            )}

            {requiredFields.includes('travelPurpose') && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  入境目的 <Text style={styles.required}>*</Text>
                </Text>
                {renderPurposeOptions()}
              </View>
            )}
          </View>

          {/* Health Declaration (Thailand) */}
          {needsHealthDeclaration && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🩺 健康申报（泰国要求）</Text>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  近期是否有发烧、咳嗽等症状？ <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(hasFever, setHasFever)}
              </View>
            </View>
          )}

          {/* US Customs Declaration */}
          {needsUSCustoms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛃 美国海关申报</Text>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  携带现金或等值货币超过 $10,000？ <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(cashAmount, setCashAmount)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  携带食品、植物、动物产品？ <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(carryingFood, setCarryingFood)}
              </View>
            </View>
          )}

          {/* Canada Customs Declaration (E311) */}
          {needsCanadaCustoms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🍁 加拿大海关申报 (E311)</Text>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  从哪个国家入境？ <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      arrivingFrom === '美国' && styles.optionButtonActive,
                    ]}
                    onPress={() => setArrivingFrom('美国')}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        arrivingFrom === '美国' && styles.optionTextActive,
                      ]}
                    >
                      美国 (U.S.A.)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      arrivingFrom === '其他国家' && styles.optionButtonActive,
                    ]}
                    onPress={() => setArrivingFrom('其他国家')}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        arrivingFrom === '其他国家' && styles.optionTextActive,
                      ]}
                    >
                      其他国家 (Other)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  携带现金或货币工具总额 ≥ $10,000加元？ <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(hasHighCurrency, setHasHighCurrency)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  携带物品总价值超过免税额度？ <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.fieldHint}>礼品超过$60加元需申报</Text>
                {renderYesNoOptions(exceedsDutyFree, setExceedsDutyFree)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  携带枪支或武器？ <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(hasFirearms, setHasFirearms)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  携带商业物品、样品或用于转售的商品？ <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(hasCommercialGoods, setHasCommercialGoods)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  携带食品、植物、动物或相关产品？ <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.fieldHint}>包括：水果、肉类、种子、木制品等</Text>
                {renderYesNoOptions(visitedFarm, setVisitedFarm)}
              </View>
            </View>
          )}
        </View>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsIcon}>💡</Text>
          <Text style={styles.tipsTitle}>温馨提示</Text>
          <Text style={styles.tipsText}>
            • 可以点击"扫描机票"自动识别航班信息{'\n'}
            • 可以点击"扫描预订单"自动识别酒店信息{'\n'}
            • 也可以手动输入，请确保信息准确{'\n'}
            • 酒店地址需填写英文{'\n'}
            • 联系电话需包含国家区号（如 +66）
          </Text>
        </Card>

        {/* Generate Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="开始生成通关包"
            onPress={handleGenerate}
            variant="primary"
            icon={<Text style={styles.buttonIcon}>✨</Text>}
          />
        </View>

        <View style={{ height: spacing.xxl }} />
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
    ...typography.h2,
    color: colors.primary,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  infoCard: {
    margin: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  form: {
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  scanIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  scanText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  required: {
    color: colors.error,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
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
  yesNoContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  yesNoButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  yesNoText: {
    ...typography.body2,
    color: colors.text,
  },
  yesNoTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tipsCard: {
    margin: spacing.md,
    backgroundColor: colors.white,
  },
  tipsIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tipsText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
  },
  buttonIcon: {
    fontSize: 24,
  },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    padding: spacing.xl,
    maxWidth: 500,
    width: '100%',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  duplicateInfoCard: {
    width: '100%',
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  duplicateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  duplicateValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  modalHint: {
    ...typography.body1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'column',
    width: '100%',
    gap: spacing.sm,
  },
  modalButton: {
    width: '100%',
  },
  modalClose: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  modalCloseText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
});

export default TravelInfoScreen;
