const clampToStartOfDay = (date: Date): Date => {
  const normalized = new Date(date.getTime());
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const formatDateForInput = (date: Date): string => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseDateFromInput = (value?: string | null): Date | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const parts = value.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return clampToStartOfDay(parsed);
};

export const getDefaultArrivalDate = (offsetDays = 3): string => {
  const base = clampToStartOfDay(new Date());
  const safeOffset = Number.isFinite(offsetDays) ? Math.max(offsetDays, 0) : 0;
  base.setDate(base.getDate() + safeOffset);
  return formatDateForInput(base);
};

export const getDefaultDepartureDate = (
  arrivalDateValue?: string | null,
  monthOffset = 1
): string => {
  const arrivalDate =
    parseDateFromInput(arrivalDateValue) ?? clampToStartOfDay(new Date());

  const departure = new Date(arrivalDate.getTime());
  const safeMonthOffset = Number.isFinite(monthOffset) ? Math.max(monthOffset, 0) : 0;
  const originalDay = departure.getDate();

  departure.setMonth(departure.getMonth() + safeMonthOffset);

  const monthChanged = departure.getDate() !== originalDay;
  const notAfterArrival = departure <= arrivalDate;

  if (monthChanged || notAfterArrival) {
    departure.setTime(arrivalDate.getTime());
    departure.setDate(arrivalDate.getDate() + 30);
  }

  return formatDateForInput(clampToStartOfDay(departure));
};

export const getDefaultTravelDates = (
  arrivalDateValue?: string | null,
  arrivalOffsetDays = 3,
  departureMonthOffset = 1
): { arrivalDate: string; departureDate: string } => {
  const defaultArrival = getDefaultArrivalDate(arrivalOffsetDays);
  const hasArrivalValue =
    typeof arrivalDateValue === 'string' && arrivalDateValue.trim().length > 0;
  const resolvedArrival = hasArrivalValue ? arrivalDateValue!.trim() : defaultArrival;

  const departureDate = getDefaultDepartureDate(
    resolvedArrival,
    departureMonthOffset
  );

  return {
    arrivalDate: resolvedArrival,
    departureDate,
  };
};
