/**
 * Taiwan Cities and Counties
 * Major cities and counties in Taiwan for travel information
 */

export const taiwanCities = [
  {
    "id": "taipei",
    "nameEn": "Taipei City",
    "nameZh": "臺北市",
    "type": "special_municipality"
  },
  {
    "id": "new_taipei",
    "nameEn": "New Taipei City",
    "nameZh": "新北市",
    "type": "special_municipality"
  },
  {
    "id": "taoyuan",
    "nameEn": "Taoyuan City",
    "nameZh": "桃園市",
    "type": "special_municipality"
  },
  {
    "id": "taichung",
    "nameEn": "Taichung City",
    "nameZh": "臺中市",
    "type": "special_municipality"
  },
  {
    "id": "tainan",
    "nameEn": "Tainan City",
    "nameZh": "臺南市",
    "type": "special_municipality"
  },
  {
    "id": "kaohsiung",
    "nameEn": "Kaohsiung City",
    "nameZh": "高雄市",
    "type": "special_municipality"
  },
  {
    "id": "keelung",
    "nameEn": "Keelung City",
    "nameZh": "基隆市",
    "type": "provincial_city"
  },
  {
    "id": "hsinchu_city",
    "nameEn": "Hsinchu City",
    "nameZh": "新竹市",
    "type": "provincial_city"
  },
  {
    "id": "chiayi_city",
    "nameEn": "Chiayi City",
    "nameZh": "嘉義市",
    "type": "provincial_city"
  },
  {
    "id": "hsinchu",
    "nameEn": "Hsinchu County",
    "nameZh": "新竹縣",
    "type": "county"
  },
  {
    "id": "miaoli",
    "nameEn": "Miaoli County",
    "nameZh": "苗栗縣",
    "type": "county"
  },
  {
    "id": "changhua",
    "nameEn": "Changhua County",
    "nameZh": "彰化縣",
    "type": "county"
  },
  {
    "id": "nantou",
    "nameEn": "Nantou County",
    "nameZh": "南投縣",
    "type": "county"
  },
  {
    "id": "yunlin",
    "nameEn": "Yunlin County",
    "nameZh": "雲林縣",
    "type": "county"
  },
  {
    "id": "chiayi",
    "nameEn": "Chiayi County",
    "nameZh": "嘉義縣",
    "type": "county"
  },
  {
    "id": "pingtung",
    "nameEn": "Pingtung County",
    "nameZh": "屏東縣",
    "type": "county"
  },
  {
    "id": "yilan",
    "nameEn": "Yilan County",
    "nameZh": "宜蘭縣",
    "type": "county"
  },
  {
    "id": "hualien",
    "nameEn": "Hualien County",
    "nameZh": "花蓮縣",
    "type": "county"
  },
  {
    "id": "taitung",
    "nameEn": "Taitung County",
    "nameZh": "臺東縣",
    "type": "county"
  },
  {
    "id": "penghu",
    "nameEn": "Penghu County",
    "nameZh": "澎湖縣",
    "type": "county"
  },
  {
    "id": "kinmen",
    "nameEn": "Kinmen County",
    "nameZh": "金門縣",
    "type": "county"
  },
  {
    "id": "lienchiang",
    "nameEn": "Lienchiang County",
    "nameZh": "連江縣",
    "type": "county"
  }
];

/**
 * Get city by ID
 */
export const getCityById = (id) => {
  return taiwanCities.find(city => city.id === id);
};

/**
 * Get city by English name (case-insensitive, partial match)
 */
export const getCityByName = (nameEn) => {
  if (!nameEn) return null;
  const searchTerm = nameEn.toLowerCase().trim();
  return taiwanCities.find(city =>
    city.nameEn.toLowerCase().includes(searchTerm) ||
    city.nameZh.includes(searchTerm)
  );
};

/**
 * Get all special municipalities (6 major cities)
 */
export const getSpecialMunicipalities = () => {
  return taiwanCities.filter(city => city.type === 'special_municipality');
};

/**
 * Get all provincial cities
 */
export const getProvincialCities = () => {
  return taiwanCities.filter(city => city.type === 'provincial_city');
};

/**
 * Get all counties
 */
export const getCounties = () => {
  return taiwanCities.filter(city => city.type === 'county');
};
