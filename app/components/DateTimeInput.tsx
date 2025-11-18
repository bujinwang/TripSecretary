import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius } from '../theme';

type DateType = 'future' | 'past' | 'any';
type Mode = 'date' | 'time';

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface TimeParts {
  hour: number;
  minute: number;
}

type LabelDescriptor = {
  label?: React.ReactNode;
  text?: React.ReactNode;
  title?: React.ReactNode;
  helper?: React.ReactNode;
  helperText?: React.ReactNode;
  help?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  errorMessage?: React.ReactNode;
  placeholder?: string;
};

type LabelProp = React.ReactNode | LabelDescriptor;

export interface DateTimeInputProps {
  label?: LabelProp;
  value?: string;
  onChangeText?: (value: string) => void;
  mode?: Mode;
  helpText?: React.ReactNode;
  error?: boolean;
  errorMessage?: React.ReactNode;
  onBlur?: (value: string) => void;
  dateType?: DateType;
  style?: StyleProp<ViewStyle>;
  placeholder?: string;
  onChange?: (value: string) => void;
}

const isRenderableContent = (value: unknown): value is React.ReactNode => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return true;
  }
  return React.isValidElement(value);
};

const pickRenderable = (...values: unknown[]): React.ReactNode | undefined => {
  for (const value of values) {
    if (isRenderableContent(value)) {
      return value;
    }
  }
  return undefined;
};

const isLabelDescriptor = (value: unknown): value is LabelDescriptor =>
  Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !React.isValidElement(value),
  );

const parseDate = (dateStr?: string): DateParts => {
  if (!dateStr) {
    const now = new Date();
    return { year: now.getFullYear(), month: 1, day: 1 };
  }

  const parts = dateStr.split('-');
  return {
    year: Number.parseInt(parts[0], 10) || new Date().getFullYear(),
    month: Number.parseInt(parts[1], 10) || 1,
    day: Number.parseInt(parts[2], 10) || 1,
  };
};

const parseTime = (timeStr?: string): TimeParts => {
  if (!timeStr) {
    return { hour: 0, minute: 0 };
  }

  const parts = timeStr.split(':');
  return {
    hour: Number.parseInt(parts[0], 10) || 0,
    minute: Number.parseInt(parts[1], 10) || 0,
  };
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const DateTimeInput: React.FC<DateTimeInputProps> = ({
  label,
  value,
  onChangeText = () => {},
  mode = 'date',
  helpText,
  error,
  errorMessage,
  onBlur,
  dateType = 'future',
  style,
  placeholder,
  onChange,
}) => {
  const labelObject = isLabelDescriptor(label) ? label : undefined;
  const normalizedLabel = pickRenderable(
    labelObject?.label,
    labelObject?.text,
    labelObject?.title,
    label,
  );
  const normalizedHelpText = pickRenderable(
    helpText,
    labelObject?.help,
    labelObject?.helper,
    labelObject?.helperText,
    labelObject?.description,
  );
  const normalizedErrorMessage = pickRenderable(
    errorMessage,
    labelObject?.error,
    labelObject?.errorMessage,
  );
  const resolvedPlaceholder =
    placeholder ??
    (typeof labelObject?.placeholder === 'string' ? labelObject.placeholder : undefined);

  const [showPicker, setShowPicker] = useState(false);

  const currentDate = mode === 'date' ? parseDate(value) : undefined;
  const currentTime = mode === 'time' ? parseTime(value) : undefined;

  const getDefaultYear = useCallback(() => {
    if (dateType === 'past') {
      return new Date().getFullYear() - 30;
    }
    return new Date().getFullYear();
  }, [dateType]);

  const [selectedYear, setSelectedYear] = useState<number>(currentDate?.year ?? getDefaultYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate?.month ?? 1);
  const [selectedDay, setSelectedDay] = useState<number>(currentDate?.day ?? 1);
  const [selectedHour, setSelectedHour] = useState<number>(currentTime?.hour ?? 0);
  const [selectedMinute, setSelectedMinute] = useState<number>(currentTime?.minute ?? 0);

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
      setSelectedYear(getDefaultYear());
      setSelectedMonth(1);
      setSelectedDay(1);
    }
  }, [value, mode, dateType, getDefaultYear]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const years = useMemo(() => {
    if (dateType === 'past') {
      const startYear = 1900;
      const length = currentYear - startYear + 1;
      return Array.from({ length }, (_, index) => startYear + index);
    }
    if (dateType === 'future') {
      return Array.from({ length: 11 }, (_, index) => currentYear + index);
    }
    return Array.from({ length: 61 }, (_, index) => currentYear - 50 + index);
  }, [currentYear, dateType]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const days = useMemo(
    () => Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, index) => index + 1),
    [selectedYear, selectedMonth],
  );
  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, index) => index), []);

  const formatValue = () => {
    if (value) {
      return value;
    }
    if (resolvedPlaceholder) {
      return resolvedPlaceholder;
    }
    return mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM';
  };

  const handleConfirm = () => {
    let newValue: string;
    if (mode === 'date') {
      const month = String(selectedMonth).padStart(2, '0');
      const day = String(selectedDay).padStart(2, '0');
      newValue = `${selectedYear}-${month}-${day}`;
    } else {
      const hour = String(selectedHour).padStart(2, '0');
      const minute = String(selectedMinute).padStart(2, '0');
      newValue = `${hour}:${minute}`;
    }

    onChangeText(newValue);
    onChange?.(newValue);
    setShowPicker(false);

    if (onBlur) {
      setTimeout(() => onBlur(newValue), 0);
    }
  };

  const handleCancel = () => {
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
    <View style={[styles.container, style]}>
      {normalizedLabel ? <Text style={styles.label}>{normalizedLabel}</Text> : null}

      <TouchableOpacity
        style={[styles.input, error ? styles.inputError : null]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.inputText, !value ? styles.placeholder : null]}>{formatValue()}</Text>
      </TouchableOpacity>

      {normalizedHelpText && !error ? <Text style={styles.helpText}>{normalizedHelpText}</Text> : null}
      {error && normalizedErrorMessage ? <Text style={styles.errorText}>{normalizedErrorMessage}</Text> : null}

      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={handleCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.modalButton}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{mode === 'date' ? '选择日期' : '选择时间'}</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={[styles.modalButton, styles.modalButtonPrimary]}>确定</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {mode === 'date' ? (
                <>
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={(itemValue) => setSelectedYear(Number(itemValue))}
                    style={styles.picker}
                  >
                    {years.map((year) => (
                      <Picker.Item key={year} label={`${year}年`} value={year} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={selectedMonth}
                    onValueChange={(itemValue) => setSelectedMonth(Number(itemValue))}
                    style={styles.picker}
                  >
                    {months.map((month) => (
                      <Picker.Item key={month} label={`${month}月`} value={month} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={selectedDay}
                    onValueChange={(itemValue) => setSelectedDay(Number(itemValue))}
                    style={styles.picker}
                  >
                    {days.map((day) => (
                      <Picker.Item key={day} label={`${day}日`} value={day} />
                    ))}
                  </Picker>
                </>
              ) : (
                <>
                  <Picker
                    selectedValue={selectedHour}
                    onValueChange={(itemValue) => setSelectedHour(Number(itemValue))}
                    style={styles.picker}
                  >
                    {hours.map((hour) => (
                      <Picker.Item key={hour} label={String(hour).padStart(2, '0')} value={hour} />
                    ))}
                  </Picker>
                  <Text style={styles.separator}>:</Text>
                  <Picker
                    selectedValue={selectedMinute}
                    onValueChange={(itemValue) => setSelectedMinute(Number(itemValue))}
                    style={styles.picker}
                  >
                    {minutes.map((minute) => (
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
