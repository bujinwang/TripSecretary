// 入境通 - DateTime Input Component with iOS-style picker
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius } from '../theme';

const DateTimeInput = ({
  label,
  value,
  onChangeText,
  mode = 'date', // 'date' or 'time'
  helpText,
  error,
  errorMessage,
  onBlur,
  minDate, // For date validation
  dateType = 'future', // 'future', 'past', or 'any' - determines year range
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Parse date string YYYY-MM-DD
  const parseDate = (dateStr) => {
    if (!dateStr) {
return { year: new Date().getFullYear(), month: 1, day: 1 };
}
    const parts = dateStr.split('-');
    return {
      year: parseInt(parts[0]) || new Date().getFullYear(),
      month: parseInt(parts[1]) || 1,
      day: parseInt(parts[2]) || 1,
    };
  };

  // Parse time string HH:MM
  const parseTime = (timeStr) => {
    if (!timeStr) {
return { hour: 0, minute: 0 };
}
    const parts = timeStr.split(':');
    return {
      hour: parseInt(parts[0]) || 0,
      minute: parseInt(parts[1]) || 0,
    };
  };

  const currentDate = mode === 'date' ? parseDate(value) : null;
  const currentTime = mode === 'time' ? parseTime(value) : null;

  // Initialize with appropriate defaults based on dateType
  const getDefaultYear = () => {
    if (dateType === 'past') {
      // For birth dates, default to a reasonable birth year (e.g., 30 years ago)
      return new Date().getFullYear() - 30;
    } else {
      // For future dates or any dates, use current year
      return new Date().getFullYear();
    }
  };

  const [selectedYear, setSelectedYear] = useState(currentDate?.year || getDefaultYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate?.month || 1);
  const [selectedDay, setSelectedDay] = useState(currentDate?.day || 1);
  const [selectedHour, setSelectedHour] = useState(currentTime?.hour || 0);
  const [selectedMinute, setSelectedMinute] = useState(currentTime?.minute || 0);

  // Update state when value prop changes
  useEffect(() => {
    if (mode === 'date' && value) {
      const parsed = parseDate(value);
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
    } else if (mode === 'time' && value) {
      const parsed = parseTime(value);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
    } else if (mode === 'date' && !value) {
      // Reset to appropriate defaults when value is cleared
      setSelectedYear(getDefaultYear());
      setSelectedMonth(1);
      setSelectedDay(1);
    }
  }, [value, mode, dateType]);

  // Generate arrays for pickers
  const currentYear = new Date().getFullYear();
  
  // Generate years based on dateType
  let years;
  if (dateType === 'past') {
    // For birth dates: show years from 1900 to current year
    years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i).reverse();
  } else if (dateType === 'future') {
    // For future dates: show current year + 10 years ahead
    years = Array.from({ length: 11 }, (_, i) => currentYear + i);
  } else {
    // For any dates: show 50 years before to 10 years ahead
    years = Array.from({ length: 61 }, (_, i) => currentYear - 50 + i);
  }
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatValue = () => {
    console.log('=== DateTimeInput formatValue ===');
    console.log('label:', label);
    console.log('value:', value);
    console.log('mode:', mode);
    if (!value) {
return mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM';
}
    return value;
  };

  const handleConfirm = () => {
    let newValue;
    if (mode === 'date') {
      const month = String(selectedMonth).padStart(2, '0');
      const day = String(selectedDay).padStart(2, '0');
      newValue = `${selectedYear}-${month}-${day}`;
    } else {
      const hour = String(selectedHour).padStart(2, '0');
      const minute = String(selectedMinute).padStart(2, '0');
      newValue = `${hour}:${minute}`;
    }
    console.log('=== DateTimeInput handleConfirm ===');
    console.log('Label:', label);
    console.log('New value:', newValue);
    console.log('Previous value:', value);
    console.log('dateType:', dateType);
    console.log('Selected year/month/day:', selectedYear, selectedMonth, selectedDay);
    console.log('Calling onChangeText with:', newValue);
    onChangeText(newValue);
    setShowPicker(false);
    // Call onBlur with the new value to ensure it's saved
    if (onBlur) {
      // Use setTimeout to ensure state has updated
      setTimeout(() => onBlur(newValue), 0);
    }
  };

  const handleCancel = () => {
    // Reset to current value
    if (mode === 'date' && value) {
      const parsed = parseDate(value);
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
    } else if (mode === 'time' && value) {
      const parsed = parseTime(value);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
    }
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {formatValue()}
        </Text>
      </TouchableOpacity>

      {helpText && !error && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}
      {error && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.modalButton}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {mode === 'date' ? '选择日期' : '选择时间'}
              </Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={[styles.modalButton, styles.modalButtonPrimary]}>确定</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {mode === 'date' ? (
                <>
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={setSelectedYear}
                    style={styles.picker}
                  >
                    {years.map(year => (
                      <Picker.Item key={year} label={`${year}年`} value={year} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={selectedMonth}
                    onValueChange={setSelectedMonth}
                    style={styles.picker}
                  >
                    {months.map(month => (
                      <Picker.Item key={month} label={`${month}月`} value={month} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={selectedDay}
                    onValueChange={setSelectedDay}
                    style={styles.picker}
                  >
                    {days.map(day => (
                      <Picker.Item key={day} label={`${day}日`} value={day} />
                    ))}
                  </Picker>
                </>
              ) : (
                <>
                  <Picker
                    selectedValue={selectedHour}
                    onValueChange={setSelectedHour}
                    style={styles.picker}
                  >
                    {hours.map(hour => (
                      <Picker.Item key={hour} label={String(hour).padStart(2, '0')} value={hour} />
                    ))}
                  </Picker>
                  <Text style={styles.separator}>:</Text>
                  <Picker
                    selectedValue={selectedMinute}
                    onValueChange={setSelectedMinute}
                    style={styles.picker}
                  >
                    {minutes.map(minute => (
                      <Picker.Item key={minute} label={String(minute).padStart(2, '0')} value={minute} />
                    ))}
                  </Picker>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: colors.error,
  },
  inputText: {
    ...typography.body1,
    color: colors.text,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  modalButton: {
    ...typography.body1,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modalButtonPrimary: {
    color: colors.primary,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  picker: {
    flex: 1,
    height: 200,
  },
  separator: {
    ...typography.h2,
    color: colors.text,
    marginHorizontal: spacing.xs,
  },
});

export default DateTimeInput;
