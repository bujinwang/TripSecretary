// 入境通 - Generation History Management
// 管理生成历史，避免重复生成

/**
 * 检查是否已有相同的生成记录
 * @param {Object} params - 生成参数
 * @param {Object} params.passport - 护照信息
 * @param {Object} params.destination - 目的地
 * @param {Object} params.travelInfo - 旅行信息
 * @param {Array} historyList - 历史记录列表
 * @returns {Object|null} - 如果找到重复记录返回记录，否则返回null
 */
export const checkDuplicate = (params, historyList) => {
  const { passport, destination, travelInfo } = params;
  
  // 查找相同的记录
  const duplicate = historyList.find(record => {
    // 1. 检查护照号是否相同
    if (record.passport?.passportNo !== passport?.passportNo) {
      return false;
    }
    
    // 2. 检查目的地是否相同
    if (record.destination?.id !== destination?.id) {
      return false;
    }
    
    // 3. 检查航班号是否相同（关键）
    if (record.travelInfo?.flightNumber !== travelInfo?.flightNumber) {
      return false;
    }
    
    // 4. 检查到达日期是否相同（如果有）
    if (travelInfo?.arrivalDate && 
        record.travelInfo?.arrivalDate !== travelInfo?.arrivalDate) {
      return false;
    }
    
    return true;
  });
  
  return duplicate || null;
};

/**
 * 生成唯一的记录ID
 * @param {Object} passport - 护照信息
 * @param {Object} destination - 目的地
 * @param {Object} travelInfo - 旅行信息
 * @returns {string} - 唯一ID
 */
export const generateRecordId = (passport, destination, travelInfo) => {
  const parts = [
    passport?.passportNo || 'unknown',
    destination?.id || 'unknown',
    travelInfo?.flightNumber || 'manual',
    travelInfo?.arrivalDate || new Date().toISOString().split('T')[0],
  ];
  return parts.join('-');
};

/**
 * 检查生成记录是否仍然有效
 * @param {Object} record - 历史记录
 * @returns {boolean} - 是否有效
 */
export const isRecordValid = (record) => {
  if (!record.travelInfo?.arrivalDate) {
    return true; // 没有日期的记录永久有效
  }
  
  const arrivalDate = new Date(record.travelInfo.arrivalDate);
  const now = new Date();
  
  // 如果到达日期已过，记录无效
  if (arrivalDate < now) {
    return false;
  }
  
  return true;
};

/**
 * 计算距离到达还有多少时间
 * @param {string} arrivalDate - 到达日期
 * @returns {string} - 人性化的时间描述
 */
export const getTimeUntilArrival = (arrivalDate, t) => {
  if (!arrivalDate) {
return '';
}

  const translator = typeof t === 'function' ? t : (key, options) => options?.defaultValue ?? key;

  const arrival = new Date(arrivalDate);
  const now = new Date();
  const diffMs = arrival - now;
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
