// @ts-nocheck

type BuildParams = {
  destination: string
  resident?: string
  passport?: string
  language?: string
}

const normalizeLang = (language?: string) => (language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'

const normalizeCode = (v?: string) => {
  const x = (v || '').toString().trim().toUpperCase()
  if (!x) return ''
  if (x === 'CN' || x === 'CHN' || x.includes('CHINA')) return 'CHN'
  if (x === 'US' || x === 'USA' || x.includes('UNITED STATES')) return 'USA'
  if (x === 'GB' || x === 'GBR' || x.includes('UNITED KINGDOM') || x.includes('UK')) return 'GBR'
  if (x === 'JP' || x === 'JPN' || x.includes('JAPAN')) return 'JPN'
  if (x === 'KR' || x === 'KOR' || x.includes('KOREA')) return 'KOR'
  if (x === 'TW' || x === 'TWN' || x.includes('TAIWAN')) return 'TWN'
  if (x === 'HK' || x === 'HKG' || x.includes('HONG KONG')) return 'HKG'
  if (x.length === 2) return x
  return x
}

const NUMBERS: Record<string, { en: string[]; zh: string[] }> = {
  us: {
    en: [
      'Police/Fire/Ambulance: 911',
      'Suicide & Crisis Lifeline: 988',
      'Poison Control: 1‑800‑222‑1222',
      'CBP Traveler Information: 1‑877‑227‑5511',
      'TSA Contact Center: 1‑866‑289‑9673',
    ],
    zh: [
      '警察/消防/急救：911',
      '心理危机热线：988',
      '中毒控制中心：1‑800‑222‑1222',
      '海关与边境保护咨询：1‑877‑227‑5511',
      '运输安保局热线：1‑866‑289‑9673',
    ],
  },
  jp: {
    en: [
      'Police: 110',
      'Ambulance/Fire: 119',
      'Tourist Hotline (English): 050‑3816‑2787',
    ],
    zh: [
      '警察：110',
      '急救/消防：119',
      '旅游服务热线（英语）：050‑3816‑2787',
    ],
  },
  sg: {
    en: ['Police: 999', 'Ambulance/Fire: 995', 'Non‑Emergency Ambulance: 1777'],
    zh: ['警察：999', '急救/消防：995', '非紧急救护车：1777'],
  },
  my: {
    en: ['Emergency Services: 999', 'Fire and Rescue: 999'],
    zh: ['综合紧急服务：999', '消防与救援：999'],
  },
  vn: {
    en: ['Police: 113', 'Fire: 114', 'Ambulance: 115'],
    zh: ['警察：113', '消防：114', '急救：115'],
  },
  hk: {
    en: ['Police/Fire/Ambulance: 999'],
    zh: ['警察/消防/急救：999'],
  },
  tw: {
    en: ['Police: 110', 'Ambulance/Fire: 119'],
    zh: ['警察：110', '急救/消防：119'],
  },
  kr: {
    en: ['Police: 112', 'Ambulance/Fire: 119'],
    zh: ['警察：112', '急救/消防：119'],
  },
  th: {
    en: ['Police: 191', 'Ambulance: 1669', 'Tourist Police: 1155'],
    zh: ['警察：191', '救护车：1669', '旅游警察：1155'],
  },
  ca: {
    en: ['Police/Fire/Ambulance: 911'],
    zh: ['警察/消防/急救：911'],
  },
}

const EMBASSIES: Record<string, Record<string, string>> = {
  us: { CHN: '+1‑202‑495‑2266', KOR: '+1‑202‑939‑5600', JPN: '+1‑202‑238‑6700' },
  jp: { CHN: '+81‑3‑3403‑3388', USA: '+81‑3‑3224‑5000' },
  th: { CHN: '+66‑2‑245‑7033', USA: '+66‑2‑205‑4000', GBR: '+66‑2‑305‑8333' },
}

const EMBASSY_NAMES_EN: Record<string, Record<string, string>> = {
  us: { CHN: 'Chinese Embassy', KOR: 'Korean Embassy', JPN: 'Japanese Embassy' },
  jp: { CHN: 'Chinese Embassy', USA: 'US Embassy' },
  th: { CHN: 'Chinese Embassy', USA: 'US Embassy', GBR: 'British Embassy' },
}

const EMBASSY_NAMES_ZH: Record<string, Record<string, string>> = {
  us: { CHN: '中国大使馆', KOR: '韩国大使馆', JPN: '日本大使馆' },
  jp: { CHN: '中国驻日大使馆', USA: '美国驻日大使馆' },
  th: { CHN: '中国驻泰大使馆', USA: '美国驻泰大使馆', GBR: '英国驻泰大使馆' },
}

export const buildEmergencyTips = (params: BuildParams): string[] => {
  const lang = normalizeLang(params.language)
  const destKey = (params.destination || '').toLowerCase()
  const residentCode = normalizeCode(params.resident)
  const passportCode = normalizeCode(params.passport)
  const code = residentCode || passportCode
  const base = NUMBERS[destKey]?.[lang] || []
  const embassyMap = EMBASSIES[destKey] || {}
  const names = lang === 'zh' ? EMBASSY_NAMES_ZH[destKey] || {} : EMBASSY_NAMES_EN[destKey] || {}
  const embassyNumber = code && embassyMap[code]
  const tips = [...base]
  if (embassyNumber) {
    const label = names[code] || (lang === 'zh' ? '使馆' : 'Embassy')
    tips.push(`${label}: ${embassyNumber}`)
  } else {
    tips.push(lang === 'zh' ? '联系您所在国驻当地使馆（官网可查询电话）' : 'Contact your country’s embassy in destination (check official website)')
  }
  tips.push(lang === 'zh' ? '将这些号码保存到手机联系人' : 'Save these numbers to your phone contacts')
  tips.push(lang === 'zh' ? '遇到紧急情况请立即拨打' : 'Call immediately in emergencies')
  return tips
}

export default { buildEmergencyTips }