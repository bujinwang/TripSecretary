-- Rebuild Thailand TDAC successful submission records
-- This creates proper entry_info, digital_arrival_card records for testing UI

-- Get the ARR Card No from the PDF filename: TDAC_0836C73_1761781405619.pdf
-- ARR Card No: 0836C73
-- Submission timestamp: 1761781405619 (2025-10-29 17:43:25)

-- Step 1: Update entry_info to link to correct travel_info and set status to submitted
UPDATE entry_info
SET
  travel_info_id = 'mh9pqhp5fziejfhtta7',
  status = 'submitted',
  last_updated_at = datetime('2025-10-29 17:43:25')
WHERE id = 'entry_1761348094096_5kg7bla7e';

-- Step 2: Create digital_arrival_card record for successful TDAC submission
INSERT INTO digital_arrival_cards (
  id,
  entry_info_id,
  user_id,
  card_type,
  destination_id,
  arr_card_no,
  qr_uri,
  pdf_url,
  submitted_at,
  submission_method,
  status,
  api_response,
  processing_time,
  retry_count,
  error_details,
  is_superseded,
  version,
  created_at,
  updated_at
) VALUES (
  'dac_thailand_0836c73_success',
  'entry_1761348094096_5kg7bla7e',
  'user_001',
  'TDAC',
  'th',
  '0836C73',
  'file:///Users/bujin/Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA/data/Containers/Data/Application/D2C892B1-6872-4624-BA10-5AEABC8E69C2/Documents/ExponentExperienceData/@anonymous/chujingtong-949aa9fd-5f29-4180-8e63-54175ac2c5e3/tdac/TDAC_0836C73_1761781405619.pdf',
  'file:///Users/bujin/Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA/data/Containers/Data/Application/D2C892B1-6872-4624-BA10-5AEABC8E69C2/Documents/ExponentExperienceData/@anonymous/chujingtong-949aa9fd-5f29-4180-8e63-54175ac2c5e3/tdac/TDAC_0836C73_1761781405619.pdf',
  '2025-10-29 17:43:25',
  'flash_api',
  'success',
  json('{"success": true, "arrCardNo": "0836C73"}'),
  2500,
  0,
  NULL,
  0,
  1,
  '2025-10-29 17:43:25',
  '2025-10-29 17:43:25'
);

-- Step 3: Fix snapshots country to use 'th' instead of 'thailand'
UPDATE snapshots
SET country = 'th'
WHERE country = 'thailand';

-- Show final state
SELECT '=== Final Database State ===' as summary;
SELECT '' as summary;

SELECT 'Entry Info (Thailand):' as detail;
SELECT
  id,
  destination_id,
  status,
  travel_info_id,
  created_at,
  last_updated_at
FROM entry_info
WHERE destination_id = 'th';

SELECT '' as detail;

SELECT 'Digital Arrival Cards:' as detail;
SELECT
  id,
  entry_info_id,
  card_type,
  status,
  arr_card_no,
  submission_method,
  submitted_at
FROM digital_arrival_cards
WHERE entry_info_id = 'entry_1761348094096_5kg7bla7e';

SELECT '' as detail;

SELECT 'Snapshots (Thailand):' as detail;
SELECT
  id,
  travel_info_id,
  country,
  datetime(created_at/1000, 'unixepoch') as created_at
FROM snapshots
WHERE country = 'th'
ORDER BY created_at DESC
LIMIT 3;

SELECT '' as detail;
SELECT 'Expected UI Behavior:' as note;
SELECT '- Thailand should appear ONLY in "My Trips" section (已提交)' as note;
SELECT '- Thailand should NOT appear in "In Progress" section (填写中)' as note;
SELECT '- Hong Kong should appear in "In Progress" section (95% complete)' as note;
