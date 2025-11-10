// @ts-nocheck

/**
 * Thailand Emergency Contact Information
 *
 * Emergency contact numbers including:
 * - Police, ambulance, fire services
 * - Tourist police (with language support)
 * - Embassy/consulate contacts
 * - Hospital recommendations
 * - Important hotlines
 */

/**
 * @typedef {Object} ThailandEmergencyInfo
 * @property {Object} emergencyNumbers - Emergency service numbers
 * @property {Array<Object>} embassies - Embassy and consulate information
 * @property {Array<Object>} hospitals - Recommended hospitals
 * @property {Array<Object>} hotlines - Important hotlines
 */

export const emergencyInfo = {
  // Emergency Service Numbers
  emergencyNumbers: {
    police: {
      number: '191',
      name: 'Police',
      nameZh: '警察',
      nameTh: 'ตำรวจ',
      available: '24/7',
      languages: ['Thai', 'English'],
    },
    ambulance: {
      number: '1669',
      name: 'Ambulance / Emergency Medical Services',
      nameZh: '救护车/急救服务',
      nameTh: 'รถพยาบาล',
      available: '24/7',
      languages: ['Thai', 'English'],
    },
    fire: {
      number: '199',
      name: 'Fire Department',
      nameZh: '消防',
      nameTh: 'ดับเพลิง',
      available: '24/7',
      languages: ['Thai'],
    },
    touristPolice: {
      number: '1155',
      name: 'Tourist Police',
      nameZh: '旅游警察',
      nameTh: 'ตำรวจท่องเที่ยว',
      available: '24/7',
      languages: ['Thai', 'English', 'Chinese', 'Japanese', 'Korean'],
      note: 'Chinese language service available (有中文服务)',
    },
    emergency: {
      number: '911',
      name: 'General Emergency',
      nameZh: '综合紧急服务',
      available: '24/7',
      note: 'Routes to appropriate emergency service',
    },
  },

  // Embassy and Consulate Information
  embassies: [
    {
      country: 'China',
      countryCode: 'CHN',
      name: 'Embassy of the People\'s Republic of China in Thailand',
      nameZh: '中华人民共和国驻泰王国大使馆',
      phone: '+66-2-245-7033',
      emergencyPhone: '+66-2-245-7010',
      address: '57 Ratchadaphisek Road, Din Daeng, Bangkok 10400',
      addressZh: '曼谷拉差达披色路57号，邮编10400',
      email: 'chinaemb_th@mfa.gov.cn',
      website: 'http://th.china-embassy.gov.cn',
      hours: 'Mon-Fri: 9:00-12:00, 14:00-16:00',
      services: ['Passport', 'Visa', 'Consular Protection'],
      consularProtection24h: '+66-2-245-7010',
    },
    {
      country: 'USA',
      countryCode: 'USA',
      name: 'Embassy of the United States in Thailand',
      phone: '+66-2-205-4000',
      emergencyPhone: '+66-2-205-4000',
      address: '95 Wireless Road, Pathum Wan, Bangkok 10330',
      website: 'https://th.usembassy.gov',
      hours: 'Mon-Fri: 7:30-16:30',
      services: ['American Citizen Services'],
    },
    {
      country: 'UK',
      countryCode: 'GBR',
      name: 'British Embassy Bangkok',
      phone: '+66-2-305-8333',
      emergencyPhone: '+66-81-882-3585',
      address: '14 Wireless Road, Lumpini, Pathum Wan, Bangkok 10330',
      website: 'https://www.gov.uk/world/thailand',
      hours: 'Mon-Fri: 8:00-16:30',
      services: ['Consular Services'],
    },
  ],

  // Recommended Hospitals
  hospitals: [
    {
      name: 'Bumrungrad International Hospital',
      nameZh: '康民国际医院',
      phone: '+66-2-066-8888',
      emergency: '+66-2-011-5222',
      address: '33 Sukhumvit 3, Wattana, Bangkok 10110',
      languages: ['English', 'Chinese', 'Japanese', 'Arabic', 'Thai'],
      specialties: ['Emergency', 'General Medicine', 'Surgery'],
      insurance: 'Accepts international insurance',
      note: 'Popular with expats and tourists, Chinese-speaking staff available',
    },
    {
      name: 'Bangkok Hospital',
      nameZh: '曼谷医院',
      phone: '+66-2-310-3000',
      emergency: '+66-1719',
      address: '2 Soi Soonvijai 7, New Petchburi Road, Bangkok 10310',
      languages: ['English', 'Chinese', 'Japanese', 'Thai'],
      specialties: ['Emergency', 'Trauma', 'Cardiology'],
      insurance: 'Accepts international insurance',
      note: 'Large hospital network across Thailand',
    },
    {
      name: 'Samitivej Hospital',
      nameZh: '三美泰医院',
      phone: '+66-2-022-2222',
      emergency: '+66-2-022-2222',
      address: '133 Sukhumvit 49, Wattana, Bangkok 10110',
      languages: ['English', 'Chinese', 'Japanese', 'Thai'],
      specialties: ['Emergency', 'Pediatrics', 'Obstetrics'],
      insurance: 'Accepts international insurance',
    },
  ],

  // Important Hotlines
  hotlines: [
    {
      name: 'Tourist Assistance Center',
      nameZh: '旅游协助中心',
      number: '1672',
      available: '24/7',
      services: ['Tourist information', 'Complaints', 'Assistance'],
      languages: ['Thai', 'English'],
    },
    {
      name: 'Tourist Police Hotline',
      nameZh: '旅游警察热线',
      number: '1155',
      available: '24/7',
      services: ['Tourist-related crimes', 'Scams', 'General assistance'],
      languages: ['Thai', 'English', 'Chinese'],
      note: 'Chinese language support available',
    },
    {
      name: 'Immigration Hotline',
      nameZh: '移民局热线',
      number: '1178',
      available: 'Mon-Fri: 8:30-16:30',
      services: ['Visa inquiries', 'Immigration procedures'],
      languages: ['Thai', 'English'],
    },
    {
      name: 'Road Accident Emergency',
      nameZh: '交通事故紧急服务',
      number: '1669',
      available: '24/7',
      services: ['Accident reporting', 'Emergency medical assistance'],
      languages: ['Thai', 'English'],
    },
  ],

  // Important Notes
  notes: {
    // Language support
    language: {
      title: 'Language Support',
      titleZh: '语言支持',
      content: 'Tourist Police (1155) provides Chinese language service. For embassy assistance, contact your country\'s embassy directly.',
      contentZh: '旅游警察（1155）提供中文服务。如需使馆协助，请直接联系您所在国使馆。',
    },

    // Medical costs
    medicalCosts: {
      title: 'Medical Costs',
      titleZh: '医疗费用',
      content: 'International hospitals in Thailand are expensive. Travel insurance is highly recommended.',
      contentZh: '泰国国际医院费用较高，强烈建议购买旅行保险。',
    },

    // Emergency preparation
    preparation: {
      title: 'Emergency Preparation',
      titleZh: '紧急准备',
      content: 'Save these numbers in your phone before travel. Keep a copy of your passport and travel insurance details.',
      contentZh: '旅行前请将这些号码保存在手机中，并保留护照和旅行保险详情的副本。',
    },
  },
};

export default emergencyInfo;
