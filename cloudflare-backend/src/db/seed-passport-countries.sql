-- =====================================================
-- Passport-Countries Seed Data
-- Pre-populate common passport-country relationships
-- =====================================================

-- NOTE: This data represents common visa-free/visa-on-arrival scenarios
-- Always verify current immigration policies as they change frequently

-- =====================================================
-- Chinese Passport (CHN) - Common Destinations
-- =====================================================

-- Thailand (visa-free for tourism, 30 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'THA', 0, 30, 'Visa-free for tourism, 30 days'
FROM passports WHERE nationality = 'CHN';

-- Japan (visa required for CHN passport)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'JPN', 1, 90, 'Visa required, max 90 days per stay'
FROM passports WHERE nationality = 'CHN';

-- Singapore (visa-free for transit, 96 hours)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'SGP', 0, 4, 'Visa-free transit for 96 hours with onward ticket'
FROM passports WHERE nationality = 'CHN';

-- Malaysia (visa-free for tourism, 30 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'MYS', 0, 30, 'Visa-free for tourism, 30 days'
FROM passports WHERE nationality = 'CHN';

-- South Korea (visa required)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'KOR', 1, 90, 'Visa required for most visits'
FROM passports WHERE nationality = 'CHN';

-- Vietnam (visa required, e-visa available)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'VNM', 1, 90, 'E-visa available, up to 90 days'
FROM passports WHERE nationality = 'CHN';

-- United States (visa required)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'USA', 1, 180, 'B1/B2 visa required, typically 6 months'
FROM passports WHERE nationality = 'CHN';

-- Canada (visa required)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'CAN', 1, 180, 'Visitor visa required, typically 6 months'
FROM passports WHERE nationality = 'CHN';

-- =====================================================
-- Hong Kong SAR Passport (HKG) - Common Destinations
-- =====================================================

-- Thailand (visa-free, 30 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'THA', 0, 30, 'Visa-free, 30 days'
FROM passports WHERE nationality = 'HKG';

-- Japan (visa-free, 90 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'JPN', 0, 90, 'Visa-free, 90 days'
FROM passports WHERE nationality = 'HKG';

-- Singapore (visa-free, 90 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'SGP', 0, 90, 'Visa-free, 90 days'
FROM passports WHERE nationality = 'HKG';

-- Malaysia (visa-free, 90 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'MYS', 0, 90, 'Visa-free, 90 days'
FROM passports WHERE nationality = 'HKG';

-- South Korea (visa-free, 90 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'KOR', 0, 90, 'Visa-free, 90 days'
FROM passports WHERE nationality = 'HKG';

-- Vietnam (visa-free, 30 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'VNM', 0, 30, 'Visa-free, 30 days'
FROM passports WHERE nationality = 'HKG';

-- United States (visa-free ESTA, 90 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'USA', 0, 90, 'ESTA required (visa waiver), 90 days'
FROM passports WHERE nationality = 'HKG';

-- Canada (eTA required, 6 months)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'CAN', 0, 180, 'eTA required (visa waiver), up to 6 months'
FROM passports WHERE nationality = 'HKG';

-- United Kingdom (visa-free, 180 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'GBR', 0, 180, 'Visa-free, up to 6 months'
FROM passports WHERE nationality = 'HKG';

-- =====================================================
-- Macau SAR Passport (MAC) - Common Destinations
-- =====================================================

-- Thailand (visa-free, 30 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'THA', 0, 30, 'Visa-free, 30 days'
FROM passports WHERE nationality = 'MAC';

-- Japan (visa-free, 90 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'JPN', 0, 90, 'Visa-free, 90 days'
FROM passports WHERE nationality = 'MAC';

-- Singapore (visa-free, 90 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'SGP', 0, 90, 'Visa-free, 90 days'
FROM passports WHERE nationality = 'MAC';

-- Malaysia (visa-free, 90 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'MYS', 0, 90, 'Visa-free, 90 days'
FROM passports WHERE nationality = 'MAC';

-- South Korea (visa-free, 90 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'KOR', 0, 90, 'Visa-free, 90 days'
FROM passports WHERE nationality = 'MAC';

-- Vietnam (visa-free, 30 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'VNM', 0, 30, 'Visa-free, 30 days'
FROM passports WHERE nationality = 'MAC';

-- United Kingdom (visa-free, 180 days)
INSERT OR IGNORE INTO passport_countries (passport_id, country_code, visa_required, max_stay_days, notes)
SELECT id, 'GBR', 0, 180, 'Visa-free, up to 6 months'
FROM passports WHERE nationality = 'MAC';

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

-- 1. This data is for reference only and may change
-- 2. Always verify current visa requirements before travel
-- 3. Some entries require additional documents (e.g., ESTA, eTA)
-- 4. Transit visa exemptions may have different rules
-- 5. Visa-free duration may vary by purpose of visit
-- 6. Some countries require passport validity (e.g., 6 months)

-- Usage:
-- This seed data runs automatically after passport creation
-- to populate available destinations for each passport type
