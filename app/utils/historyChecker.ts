// 历史记录检查和验证工具

interface GenerationRecord {
  travelInfo?: {
    arrivalDate?: string;
    flightNumber?: string;
    [key: string]: unknown;
  };
  destination?: {
    id?: string;
    name?: string;
    [key: string]: unknown;
  };
  passport?: {
    passportNo?: string;
    [key: string]: unknown;
  };
  createdAt?: string;
  [key: string]: unknown;
}

interface ValidityResult {
  isValid: boolean;
  reason: string;
  daysUntilExpiry?: number;
  daysSinceCreated?: number;
  warning?: string;
}

export function checkGenerationValidity(generation: GenerationRecord): ValidityResult {
  if (!generation) {
    return { isValid: false, reason: '记录不存在' };
  }

  const { travelInfo, createdAt } = generation;
  
  if (travelInfo?.arrivalDate) {
    const arrivalDate = new Date(travelInfo.arrivalDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysUntilFlight = Math.ceil((arrivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilFlight < 0) {
      return {
        isValid: false,
        reason: '航班日期已过期',
        daysUntilExpiry: daysUntilFlight,
      };
    }
    
    if (daysUntilFlight <= 7 && daysUntilFlight >= 0) {
      return {
        isValid: true,
        reason: '航班即将出发',
        daysUntilExpiry: daysUntilFlight,
        warning: '航班即将出发，请确认信息是否需要更新',
      };
    }
    
    if (daysUntilFlight > 7) {
      return {
        isValid: true,
        reason: '记录有效',
        daysUntilExpiry: daysUntilFlight,
      };
    }
  }
  
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const today = new Date();
    const daysSinceCreated = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreated > 30) {
      return {
        isValid: false,
        reason: '记录已超过30天',
        daysSinceCreated,
      };
    }
    
    return {
      isValid: true,
      reason: '记录有效',
      daysSinceCreated,
    };
  }
  
  return { isValid: false, reason: '无法判断有效性' };
}

export function findRecentValidGeneration(destinationId: string, passportNo: string, historyList: GenerationRecord[]): (GenerationRecord & { validity: ValidityResult }) | null {
  if (!historyList || historyList.length === 0) {
    return null;
  }
  
  const matchingRecords = historyList.filter(
    (record) =>
      record.destination?.id === destinationId &&
      record.passport?.passportNo === passportNo
  );
  
  if (matchingRecords.length === 0) {
    return null;
  }
  
  matchingRecords.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
  
  for (const record of matchingRecords) {
    const validity = checkGenerationValidity(record);
    if (validity.isValid) {
      return {
        ...record,
        validity,
      };
    }
  }
  
  return null;
}

export function formatDate(dateString: string): string {
  if (!dateString) {
    return '';
  }
   
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function formatRelativeTime(days: number): string {
  const absDays = Math.abs(days);
  
  if (days === 0) {
    return '今天';
  }
  if (days === 1) {
    return '明天';
  }
  if (days === -1) {
    return '昨天';
  }
   
  if (days > 0) {
    if (absDays <= 7) {
      return `${absDays}天后`;
    }
    if (absDays <= 30) {
      return `${Math.ceil(absDays / 7)}周后`;
    }
    return `${Math.ceil(absDays / 30)}个月后`;
  } else {
    if (absDays <= 7) {
      return `${absDays}天前`;
    }
    if (absDays <= 30) {
      return `${Math.ceil(absDays / 7)}周前`;
    }
    return `${Math.ceil(absDays / 30)}个月前`;
  }
}

export function generateSummary(generation: GenerationRecord): string {
  const { travelInfo, destination, createdAt } = generation;
  const validity = checkGenerationValidity(generation);
  
  let summary = `${destination?.name || '目的地'}通关包`;
  
  if (travelInfo?.arrivalDate) {
    const daysText = formatRelativeTime(validity.daysUntilExpiry || 0);
    summary += ` · 航班${daysText}`;
  } else if (createdAt) {
    const daysText = formatRelativeTime(-(validity.daysSinceCreated || 0));
    summary += ` · ${daysText}生成`;
  }
  
  if (travelInfo?.flightNumber) {
    summary += ` · ${travelInfo.flightNumber}`;
  }

  return summary;
}
