/**
 * TravelPurposeSubSection Component
 *
 * Displays travel purpose selection and boarding/recent stay countries
 * Part of TravelDetailsSection
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../../../theme';
import { NationalitySelector } from '../../../../components';
import Input from '../../../../components/Input';

const TravelPurposeSubSection = ({
  // Form state
  travelPurpose,
  customTravelPurpose,
  recentStayCountry,
  boardingCountry,
  // Setters
  setTravelPurpose,
  setCustomTravelPurpose,
  setRecentStayCountry,
  setBoardingCountry,
  // Validation
  handleFieldBlur,
  // Actions
  debouncedSaveData,
  // Styles from parent
  styles,
}) => {
  const travelPurposeOptions = [
    { value: 'HOLIDAY', label: '度假旅游', icon: '🏖️', tip: '最受欢迎的选择！' },
    { value: 'MEETING', label: '会议', icon: '👔', tip: '商务会议或活动' },
    { value: 'SPORTS', label: '体育活动', icon: '⚽', tip: '运动或比赛' },
    { value: 'BUSINESS', label: '商务', icon: '💼', tip: '商务考察或工作' },
    { value: 'INCENTIVE', label: '奖励旅游', icon: '🎁', tip: '公司奖励旅行' },
    { value: 'CONVENTION', label: '会展', icon: '🎪', tip: '参加会议或展览' },
    { value: 'EDUCATION', label: '教育', icon: '📚', tip: '学习或培训' },
    { value: 'EMPLOYMENT', label: '就业', icon: '💻', tip: '工作签证' },
    { value: 'EXHIBITION', label: '展览', icon: '🎨', tip: '参观展览或展会' },
    { value: 'MEDICAL', label: '医疗', icon: '🏥', tip: '医疗旅游或治疗' },
    { value: 'OTHER', label: '其他', icon: '✏️', tip: '请详细说明' },
  ];

  return (
    <>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>为什么来泰国？</Text>
        <View style={styles.optionsContainer}>
          {travelPurposeOptions.map((option) => {
            const isActive = travelPurpose === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  isActive && styles.optionButtonActive,
                ]}
                onPress={() => {
                  setTravelPurpose(option.value);
                  if (option.value !== 'OTHER') {
                    setCustomTravelPurpose('');
                  }
                  debouncedSaveData();
                }}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.optionText,
                    isActive && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {travelPurpose === 'OTHER' && (
          <Input
            placeholder="请详细说明旅行目的（英文）"
            value={customTravelPurpose}
            onChangeText={(text) => setCustomTravelPurpose(text.toUpperCase())}
            onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
            autoCapitalize="characters"
            style={styles.input}
          />
        )}
      </View>

      <NationalitySelector
        label="最近30天去过哪些国家？"
        value={recentStayCountry}
        onValueChange={(code) => {
          setRecentStayCountry(code);
          handleFieldBlur('recentStayCountry', code);
        }}
        helpText="选择你最近30天内访问过的国家"
      />

      <NationalitySelector
        label="从哪个国家登机来泰国？"
        value={boardingCountry}
        onValueChange={(code) => {
          setBoardingCountry(code);
          handleFieldBlur('boardingCountry', code);
        }}
        helpText="选择你登机前往泰国的国家"
      />
    </>
  );
};

export default TravelPurposeSubSection;
