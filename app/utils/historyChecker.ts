// 历史记录检查和验证工具

/**
 * 检查历史记录是否还有效
 * @param {Object} generation - 历史生成记录
 * @returns {Object} { isValid: boolean, reason: string, daysUntilExpiry: number }
 */
export function checkGenerationValidity(generation) {
  if (!generation) {
    return { isValid: false, reason: '记录不存在' };
  }

  const { travelInfo, createdAt } = generation;
  
  // 1. 检查航班日期
  if (travelInfo?.arrivalDate) {
    const arrivalDate = new Date(travelInfo.arrivalDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysUntilFlight = Math.ceil((arrivalDate - today) / (1000 * 60 * 60 * 24));
    
    // 航班日期已过期
    if (daysUntilFlight < 0) {
      return {
        isValid: false,
        reason: '航班日期已过期',
        daysUntilExpiry: daysUntilFlight,
      };
    }
    
    // 航班日期即将到来（未来7天内）- 可能需要更新信息
    if (daysUntilFlight <= 7 && daysUntilFlight >= 0) {
      return {
        isValid: true,
        reason: '航班即将出发',
        daysUntilExpiry: daysUntilFlight,
        warning: '航班即将出发，请确认信息是否需要更新',
      };
    }
    
    // 航班日期在未来（7天后）- 完全有效
    if (daysUntilFlight > 7) {
      return {
        isValid: true,
        reason: '记录有效',
        daysUntilExpiry: daysUntilFlight,
      };
    }
  }
  
  // 2. 如果没有航班日期，检查生成时间
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const today = new Date();
    const daysSinceCreated = Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24));
    
    // 超过30天视为过期
    if (daysSinceCreated > 30) {
      return {
        isValid: false,
        reason: '记录已超过30天',
        daysSinceCreated,
      };
    }
    
    // 30天内有效
    return {
      isValid: true,
      reason: '记录有效',
      daysSinceCreated,
    };
  }
  
  // 默认返回无效
  return { isValid: false, reason: '无法判断有效性' };
}

/**
 * 查找用户最近的有效历史记录
 * @param {string} destinationId - 目的地ID
 * @param {string} passportNo - 护照号
 * @param {Array} historyList - 历史记录列表
 * @returns {Object} 最近的有效记录或null
 */
export function findRecentValidGeneration(destinationId, passportNo, historyList) {
  if (!historyList || historyList.length === 0) {
    return null;
  }
  
  // 过滤出匹配目的地和护照的记录
  const matchingRecords = historyList.filter(
    (record) =>
      record.destination?.id === destinationId &&
      record.passport?.passportNo === passportNo
  );
  
  if (matchingRecords.length === 0) {
    return null;
  }
  
  // 按创建时间排序（最新的在前）
  matchingRecords.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA;
  });
  
  // 查找第一个有效的记录
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

/**
 * 格式化日期为友好显示
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
export function formatDate(dateString) {
  if (!dateString) {
return '';
}
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 格式化相对时间（多少天前/后）
 * @param {number} days - 天数
 * @returns {string} 相对时间描述
 */
export function formatRelativeTime(days) {
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

/**
 * 生成历史记录摘要
 * @param {Object} generation - 历史记录
 * @returns {string} 摘要文本
 */
export function generateSummary(generation) {
  const { travelInfo, destination, createdAt } = generation;
  const validity = checkGenerationValidity(generation);
  
  let summary = `${destination?.name || '目的地'}通关包`;
  
  if (travelInfo?.arrivalDate) {
    const daysText = formatRelativeTime(validity.daysUntilExpiry);
    summary += ` · 航班${daysText}`;
  } else if (createdAt) {
    const daysText = formatRelativeTime(-validity.daysSinceCreated);
    summary += ` · ${daysText}生成`;
  }
  
  if (travelInfo?.flightNumber) {
    summary += ` · ${travelInfo.flightNumber}`;
  }
  
  return summary;
}
