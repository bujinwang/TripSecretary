// 入境通 - Generation History Management
// 管理生成历史，避免重复生成

interface HistoryRecord {
  passport?: { passportNo?: string; [key: string]: unknown };
  destination?: { id?: string; [key: string]: unknown };
  travelInfo?: { flightNumber?: string; arrivalDate?: string; [key: string]: unknown };
  createdAt?: string;
  [key: string]: unknown;
}

interface GenerationParams {
  passport?: { passportNo?: string; [key: string]: unknown };
  destination?: { id?: string; [key: string]: unknown };
  travelInfo?: { flightNumber?: string; arrivalDate?: string; [key: string]: unknown };
}

type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

export const checkDuplicate = (params: GenerationParams, historyList: HistoryRecord[]): HistoryRecord | null => {
  const { passport, destination, travelInfo } = params;
  
  const duplicate = historyList.find(record => {
    if (record.passport?.passportNo !== passport?.passportNo) {
      return false;
    }
    
    if (record.destination?.id !== destination?.id) {
      return false;
    }
    
    if (record.travelInfo?.flightNumber !== travelInfo?.flightNumber) {
      return false;
    }
    
    if (travelInfo?.arrivalDate && 
        record.travelInfo?.arrivalDate !== travelInfo?.arrivalDate) {
      return false;
    }
    
    return true;
  });
  
  return duplicate || null;
};

export const generateRecordId = (passport: { passportNo?: string } | undefined, destination: { id?: string } | undefined, travelInfo: { flightNumber?: string; arrivalDate?: string } | undefined): string => {
  const parts = [
    passport?.passportNo || 'unknown',
    destination?.id || 'unknown',
    travelInfo?.flightNumber || 'manual',
    travelInfo?.arrivalDate || new Date().toISOString().split('T')[0],
  ];
  return parts.join('-');
};

export const isRecordValid = (record: HistoryRecord): boolean => {
  if (!record.travelInfo?.arrivalDate) {
    return true;
  }
  
  const arrivalDate = new Date(record.travelInfo.arrivalDate);
  const now = new Date();
  
  if (arrivalDate < now) {
    return false;
  }
  
  return true;
};

export const getTimeUntilArrival = (arrivalDate: string | undefined, t: TranslateFunction | undefined): string => {
  if (!arrivalDate) {
    return '';
  }

  const translator: TranslateFunction = typeof t === 'function' ? t : (key: string, options?: Record<string, unknown>) => (options?.defaultValue as string) ?? key;

  const arrival = new Date(arrivalDate);
  const now = new Date();
  const diffMs = arrival.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return translator('travelInfo.timeUntil.past', { defaultValue: 'Past' });
  }
  if (diffDays === 0) {
    return translator('travelInfo.timeUntil.today', { defaultValue: 'Today' });
  }
  if (diffDays === 1) {
    return translator('travelInfo.timeUntil.tomorrow', { defaultValue: 'Tomorrow' });
  }
  if (diffDays <= 7) {
    return translator('travelInfo.timeUntil.days', {
      count: diffDays,
      defaultValue: `${diffDays} days`,
    });
  }
  if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return translator('travelInfo.timeUntil.weeks', {
      count: weeks,
      defaultValue: `${weeks} weeks`,
    });
  }

  const months = Math.floor(diffDays / 30);
  return translator('travelInfo.timeUntil.months', {
    count: months,
    defaultValue: `${months} months`,
  });
};

export default {
  checkDuplicate,
  generateRecordId,
  isRecordValid,
  getTimeUntilArrival,
};
