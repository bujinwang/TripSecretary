import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { CollapsibleSection } from '../../tamagui';
import NationalitySelector from '../../NationalitySelector';
import Input from '../../Input';
import { getPhoneCode } from '../../../data/phoneCodes';
import { colors, spacing, borderRadius } from '../../../theme';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type HandleFieldBlur = (field: string, value: string) => void;

type PersonalInfoSectionStyles = ReturnType<typeof createStyles>;
type PersonalInfoStyleKey = keyof PersonalInfoSectionStyles;
type StyleOverrides = Partial<Record<PersonalInfoStyleKey, ViewStyle>>;

export interface USAPersonalInfoSectionProps {
  t: TranslationFn;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  occupation: string;
  cityOfResidence: string;
  residentCountry: string;
  phoneCode: string;
  phoneNumber: string;
  email: string;
  setOccupation: (value: string) => void;
  setCityOfResidence: (value: string) => void;
  setResidentCountry: (value: string) => void;
  setPhoneCode: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setEmail: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: HandleFieldBlur;
  lastEditedField?: string | null;
  debouncedSaveData?: () => void;
  styles?: StyleOverrides;
}

const PersonalInfoSection: React.FC<USAPersonalInfoSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  occupation,
  cityOfResidence,
  residentCountry,
  phoneCode,
  phoneNumber,
  email,
  setOccupation,
  setCityOfResidence,
  setResidentCountry,
  setPhoneCode,
  setPhoneNumber,
  setEmail,
  errors,
  warnings: _warnings,
  handleFieldBlur,
  lastEditedField,
  debouncedSaveData,
  styles: styleOverrides,
}) => {
  const sectionStyles = React.useMemo(
    () => (styleOverrides ? ({ ...defaultStyles, ...styleOverrides } as PersonalInfoSectionStyles) : defaultStyles),
    [styleOverrides],
  );

  return (
    <CollapsibleSection
      title={t('us.travelInfo.sections.personal', { defaultValue: '👤 个人信息' })}
      expanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
      style={sectionStyles.sectionCard}
      headerStyle={sectionStyles.sectionHeader}
      contentStyle={sectionStyles.sectionContent}
    >
      <Input
        label={t('us.travelInfo.fields.occupation', { defaultValue: '职业' })}
        value={occupation}
        onChangeText={setOccupation}
        onBlur={() => handleFieldBlur('occupation', occupation)}
        placeholder={t('us.travelInfo.fields.occupationPlaceholder', { defaultValue: 'Engineer' })}
        error={!!errors.occupation}
        errorMessage={errors.occupation}
        helpText={t('us.travelInfo.fields.occupationHelp', {
          defaultValue: '请用英文填写职业',
        })}
        isLastEdited={lastEditedField === 'occupation'}
      />

      <Input
        label={t('us.travelInfo.fields.cityOfResidence', { defaultValue: '居住城市' })}
        value={cityOfResidence}
        onChangeText={setCityOfResidence}
        onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
        placeholder={t('us.travelInfo.fields.cityOfResidencePlaceholder', { defaultValue: 'Beijing' })}
        error={!!errors.cityOfResidence}
        errorMessage={errors.cityOfResidence}
        helpText={t('us.travelInfo.fields.cityOfResidenceHelp', {
          defaultValue: '您目前居住的城市',
        })}
        isLastEdited={lastEditedField === 'cityOfResidence'}
      />

      <NationalitySelector
        label={t('us.travelInfo.fields.residentCountry', { defaultValue: '居住国家' })}
        value={residentCountry}
        onValueChange={(value: string) => {
          setResidentCountry(value);
          const code = getPhoneCode(value);
          if (code) {
            setPhoneCode(code);
          }
          handleFieldBlur('residentCountry', value);
          debouncedSaveData?.();
        }}
        placeholder={t('us.travelInfo.fields.residentCountryPlaceholder', {
          defaultValue: '选择居住国家',
        })}
        error={!!errors.residentCountry}
        errorMessage={errors.residentCountry}
      />

      <View style={sectionStyles.phoneRow}>
        <View style={sectionStyles.phoneCodeContainer}>
          <Input
            label={t('us.travelInfo.fields.phoneCode', { defaultValue: '区号' })}
            value={phoneCode}
            onChangeText={setPhoneCode}
            onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
            placeholder={t('us.travelInfo.fields.phoneCodePlaceholder', { defaultValue: '+86' })}
            error={!!errors.phoneCode}
            errorMessage={errors.phoneCode}
          />
        </View>
        <View style={sectionStyles.phoneNumberContainer}>
          <Input
            label={t('us.travelInfo.fields.phoneNumber', { defaultValue: '电话号码' })}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
            placeholder={t('us.travelInfo.fields.phoneNumberPlaceholder', {
              defaultValue: '13800138000',
            })}
            keyboardType="phone-pad"
            error={!!errors.phoneNumber}
            errorMessage={errors.phoneNumber}
            isLastEdited={lastEditedField === 'phoneNumber'}
          />
        </View>
      </View>

      <Input
        label={t('us.travelInfo.fields.email', { defaultValue: '电子邮箱' })}
        value={email}
        onChangeText={setEmail}
        onBlur={() => handleFieldBlur('email', email)}
        placeholder={t('us.travelInfo.fields.emailPlaceholder', {
          defaultValue: 'example@email.com',
        })}
        keyboardType="email-address"
        autoCapitalize="none"
        error={!!errors.email}
        errorMessage={errors.email}
        helpText={t('us.travelInfo.fields.emailHelp', {
          defaultValue: '用于接收重要通知',
        })}
        isLastEdited={lastEditedField === 'email'}
      />
    </CollapsibleSection>
  );
};

export default PersonalInfoSection;

const createStyles = () =>
  StyleSheet.create({
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    sectionHeader: {
      paddingHorizontal: spacing.sm,
    },
    sectionContent: {
      gap: spacing.md,
    },
    phoneRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    phoneCodeContainer: {
      flex: 0.35,
    },
    phoneNumberContainer: {
      flex: 0.65,
    },
  });

const defaultStyles = createStyles();
