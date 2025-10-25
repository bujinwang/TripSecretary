#!/usr/bin/env node

/**
 * Generate Thailand location dataset with bilingual fields (English, Thai, Chinese)
 * Source: https://github.com/kongvut/thai-province-data
 *
 * This script downloads Chinese translations via Google Translate for district
 * and sub-district names (best-effort machine translation). Results are cached
 * locally to avoid duplicate requests when re-running the script.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DATA_DIR_CANDIDATES = [
  process.env.THAI_ADMIN_DATA_DIR
    ? path.join(process.env.THAI_ADMIN_DATA_DIR)
    : null,
  path.join(__dirname, '..', 'data', 'thai-admin', 'raw'),
  path.join('/tmp', 'thai-province-data', 'thai-province-data-master', 'data', 'raw'),
  path.join(__dirname, '..', '..', 'tmp', 'thai-province-data', 'thai-province-data-master', 'data', 'raw'),
].filter(Boolean);

const RAW_DATA_DIR = RAW_DATA_DIR_CANDIDATES.find((candidate) => {
  const exists = fs.existsSync(candidate);
  if (exists) {
    console.log(`Using Thailand raw data directory: ${candidate}`);
  }
  return exists;
});

if (!RAW_DATA_DIR) {
  console.error('Unable to locate raw Thailand administrative data. Checked:');
  RAW_DATA_DIR_CANDIDATES.forEach((candidate) => console.error(`  - ${candidate}`));
  console.error('Please download https://github.com/kongvut/thai-province-data and set THAI_ADMIN_DATA_DIR to its data/raw folder.');
  process.exit(1);
}

const OUTPUT_FILE = path.join(__dirname, '..', 'app', 'data', 'thailandLocations.js');
const CACHE_FILE = path.join(__dirname, 'thai_location_zh_cache.json');

const provincesPath = path.join(RAW_DATA_DIR, 'provinces.json');
const districtsPath = path.join(RAW_DATA_DIR, 'districts.json');
const subDistrictsPath = path.join(RAW_DATA_DIR, 'sub_districts.json');

if (!fs.existsSync(provincesPath) || !fs.existsSync(districtsPath) || !fs.existsSync(subDistrictsPath)) {
  console.error('Raw Thailand administrative data not found. Please download the repository:');
  console.error('  https://github.com/kongvut/thai-province-data');
  console.error('and extract it to tmp/thai-province-data/');
  process.exit(1);
}

const provinceData = JSON.parse(fs.readFileSync(provincesPath, 'utf8'));
const districtData = JSON.parse(fs.readFileSync(districtsPath, 'utf8'));
const subDistrictData = JSON.parse(fs.readFileSync(subDistrictsPath, 'utf8'));

let translationCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    translationCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (error) {
    console.warn('Failed to read existing translation cache, starting fresh.');
    translationCache = {};
  }
}

const saveCache = () => {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(translationCache, null, 2), 'utf8');
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const translateToChinese = async (text) => {
  if (!text) return '';
  if (translationCache[text]) {
    return translationCache[text];
  }

  const encoded = encodeURIComponent(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encoded}`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const translated = data?.[0]?.[0]?.[0];
      if (translated) {
        translationCache[text] = translated;
        if (attempt > 1) {
          console.log(`✔️  Translated (retry ${attempt - 1}): ${text} → ${translated}`);
        }
        return translated;
      }
      throw new Error('Empty translation result');
    } catch (error) {
      console.warn(`⚠️  Translation failed for "${text}" (attempt ${attempt}): ${error.message}`);
      await sleep(300 * attempt);
    }
  }

  console.error(`❌  Failed to translate "${text}", falling back to original name.`);
  translationCache[text] = text;
  return text;
};

const buildProvinceCodeMap = () => {
  const map = new Map();
  provinceData.forEach((province) => {
    const code = province.name_en
      .normalize('NFKD')
      .replace(/[^\w]+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase();
    map.set(province.id, {
      code,
      nameEn: province.name_en,
      nameTh: province.name_th,
    });
  });
  return map;
};

const provinceCodeMap = buildProvinceCodeMap();

const uniqueNames = new Set();
districtData.forEach((item) => uniqueNames.add(item.name_en));
subDistrictData.forEach((item) => uniqueNames.add(item.name_en));

const namesToTranslate = Array.from(uniqueNames).filter((name) => !translationCache[name]);

const totalToTranslate = namesToTranslate.length;
if (totalToTranslate > 0) {
  console.log(`Translating ${totalToTranslate} location names to Chinese...`);
}

let processed = 0;
for (const name of namesToTranslate) {
  await translateToChinese(name);
  processed += 1;
  if (processed % 50 === 0) {
    saveCache();
    console.log(`Progress: ${processed}/${totalToTranslate}`);
  }
  await sleep(50); // Gentle throttle to avoid getting rate-limited
}

if (namesToTranslate.length > 0) {
  saveCache();
  console.log('Translation cache updated.');
}

const buildDistrictsByProvince = () => {
  const result = {};
  districtData.forEach((district) => {
    const province = provinceCodeMap.get(district.province_id);
    if (!province) return;
    const entry = {
      id: district.id,
      nameEn: district.name_en,
      nameTh: district.name_th,
      nameZh: translationCache[district.name_en] || district.name_en,
    };
    if (!result[province.code]) {
      result[province.code] = [];
    }
    result[province.code].push(entry);
  });

  Object.values(result).forEach((list) => {
    list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  });

  return result;
};

const buildSubDistrictsByDistrict = () => {
  const result = {};
  subDistrictData.forEach((sub) => {
    const entry = {
      id: sub.id,
      nameEn: sub.name_en,
      nameTh: sub.name_th,
      nameZh: translationCache[sub.name_en] || sub.name_en,
      postalCode: sub.zip_code ? String(sub.zip_code) : '',
    };

    if (!result[sub.district_id]) {
      result[sub.district_id] = [];
    }
    result[sub.district_id].push(entry);
  });

  Object.values(result).forEach((list) => {
    list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  });

  return result;
};

const districtsByProvince = buildDistrictsByProvince();
const subDistrictsByDistrict = buildSubDistrictsByDistrict();

const header = `/**
 * Thailand administrative divisions (province → district → sub-district)
 * Source: https://github.com/kongvut/thai-province-data (raw data snapshot)
 * Includes machine-translated Chinese names generated via Google Translate.
 * Generated on ${new Date().toISOString()}
 */

`;

const fileContent =
  header +
  `export const thailandDistricts = ${JSON.stringify(districtsByProvince, null, 2)};\n\n` +
  `export const thailandSubDistricts = ${JSON.stringify(subDistrictsByDistrict, null, 2)};\n\n` +
  `export function getDistrictsByProvince(code) {\n  return thailandDistricts[code] || [];\n}\n\n` +
  `export function getSubDistrictsByDistrictId(districtId) {\n  return thailandSubDistricts[districtId] || [];\n}\n`;

fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
console.log(`✅ Generated dataset: ${OUTPUT_FILE}`);
