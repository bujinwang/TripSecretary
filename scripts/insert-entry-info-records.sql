-- SQL script to insert the 9 entry_info records
-- This can be run directly on the database if you have access to it
-- Or use the import script that will execute these via the app

-- Record 1: Thailand (submitted)
INSERT OR REPLACE INTO entry_info (
  id, user_id, passport_id, personal_info_id, travel_info_id,
  destination_id, status, completion_metrics, documents,
  display_status, last_updated_at, created_at
) VALUES (
  'entry_1761348094096_5kg7bla7e',
  'user_001',
  'passport_1761348123876_8a6sujvz4',
  'personal_1761348123900_yr1wft0kw',
  'mhct8mp7ji2ip9d56bs',
  'th',
  'submitted',
  '{"passport":{"complete":5,"total":5,"state":"complete"},"personalInfo":{"complete":6,"total":6,"state":"complete"},"funds":{"complete":1,"total":1,"state":"complete","validFundCount":2},"travel":{"complete":10,"total":10,"state":"complete"}}',
  NULL,
  NULL,
  '2025-10-31T16:24:05.149Z',
  '2025-10-31T16:24:05.149Z'
);

-- Record 2: Japan (incomplete)
INSERT OR REPLACE INTO entry_info (
  id, user_id, passport_id, personal_info_id, travel_info_id,
  destination_id, status, completion_metrics, documents,
  display_status, last_updated_at, created_at
) VALUES (
  'entry_1762271522033_5oajfhktd',
  'user_001',
  'passport_1761934913272_wpe2fcoas',
  'personal_1762441243926_9vd778qz4',
  'mhkqys9k23szikv0rnv',
  'jp',
  'incomplete',
  '{"passport":{"complete":5,"total":5,"state":"complete"},"personalInfo":{"complete":6,"total":6,"state":"complete"},"funds":{"complete":1,"total":1,"state":"complete","validFundCount":2},"travel":{"complete":2,"total":10,"state":"partial"}}',
  NULL,
  NULL,
  '2025-11-06T15:00:43.993Z',
  '2025-11-06T15:00:43.993Z'
);

-- Record 3: Hong Kong (incomplete)
INSERT OR REPLACE INTO entry_info (
  id, user_id, passport_id, personal_info_id, travel_info_id,
  destination_id, status, completion_metrics, documents,
  display_status, last_updated_at, created_at
) VALUES (
  'entry_1761498113630_671h97bpx',
  'user_001',
  'passport_1761934913272_wpe2fcoas',
  'personal_1762441658750_mkke3vk0a',
  'mh6xwxxvsh4rrsz883f',
  'hk',
  'incomplete',
  '{"passport":{"complete":5,"total":5,"state":"complete"},"personalInfo":{"complete":6,"total":6,"state":"complete"},"funds":{"complete":1,"total":1,"state":"complete","validFundCount":2},"travel":{"complete":9,"total":10,"state":"partial"}}',
  NULL,
  NULL,
  '2025-11-06T15:07:38.819Z',
  '2025-11-06T15:07:38.819Z'
);

-- Record 4: USA (incomplete)
INSERT OR REPLACE INTO entry_info (
  id, user_id, passport_id, personal_info_id, travel_info_id,
  destination_id, status, completion_metrics, documents,
  display_status, last_updated_at, created_at
) VALUES (
  'entry_1762442205061_ovmnvws85',
  'user_001',
  'passport_1761934913272_wpe2fcoas',
  'personal_1762443030155_vrwcjobvo',
  'mhnkl27snrvb1okqp7',
  'us',
  'incomplete',
  '{"passport":{"complete":5,"total":5,"state":"complete"},"personalInfo":{"complete":6,"total":6,"state":"complete"},"funds":{"complete":1,"total":1,"state":"complete","validFundCount":2},"travel":{"complete":2,"total":10,"state":"partial"}}',
  NULL,
  NULL,
  '2025-11-06T15:30:30.326Z',
  '2025-11-06T15:30:30.326Z'
);

-- Record 5: Taiwan (incomplete)
INSERT OR REPLACE INTO entry_info (
  id, user_id, passport_id, personal_info_id, travel_info_id,
  destination_id, status, completion_metrics, documents,
  display_status, last_updated_at, created_at
) VALUES (
  'entry_1762444026770_05u1u9pcn',
  'user_001',
  'passport_1761934913272_wpe2fcoas',
  'personal_1762444149031_ktluvmlts',
  'mhnlo3kt2op01wjt396',
  'tw',
  'incomplete',
  '{"passport":{"complete":5,"total":5,"state":"complete"},"personalInfo":{"complete":6,"total":6,"state":"complete"},"funds":{"complete":1,"total":1,"state":"complete","validFundCount":2},"travel":{"complete":2,"total":10,"state":"partial"}}',
  NULL,
  NULL,
  '2025-11-06T15:49:09.093Z',
  '2025-11-06T15:49:09.093Z'
);

-- Record 6: Korea (incomplete)
INSERT OR REPLACE INTO entry_info (
  id, user_id, passport_id, personal_info_id, travel_info_id,
  destination_id, status, completion_metrics, documents,
  display_status, last_updated_at, created_at
) VALUES (
  'entry_1762446618612_rwz0hzzue',
  'user_001',
  'passport_1761934913272_wpe2fcoas',
  'personal_1762447645315_q252ommkr',
  'mhnntmlwi5rnrxjwpgj',
  'kr',
  'incomplete',
  '{"passport":{"complete":5,"total":5,"state":"complete"},"personalInfo":{"complete":6,"total":6,"state":"complete"},"funds":{"complete":1,"total":1,"state":"complete","validFundCount":2},"travel":{"complete":0,"total":10,"state":"missing"}}',
  NULL,
  NULL,
  '2025-11-06T16:47:25.391Z',
  '2025-11-06T16:47:25.391Z'
);

-- Record 7: Singapore (incomplete)
INSERT OR REPLACE INTO entry_info (
  id, user_id, passport_id, personal_info_id, travel_info_id,
  destination_id, status, completion_metrics, documents,
  display_status, last_updated_at, created_at
) VALUES (
  'entry_1762443970838_gh2bkrv7u',
  'user_001',
  'passport_1761934913272_wpe2fcoas',
  'personal_1762449730086_cpbbcuwh5',
  'mhnlmwums37zbcm5td',
  'sg',
  'incomplete',
  '{"passport":{"complete":5,"total":5,"state":"complete"},"personalInfo":{"complete":6,"total":6,"state":"complete"},"funds":{"complete":1,"total":1,"state":"complete","validFundCount":2},"travel":{"complete":2,"total":10,"state":"partial"}}',
  NULL,
  NULL,
  '2025-11-06T17:22:11.687Z',
  '2025-11-06T17:22:11.687Z'
);

-- Record 8: Vietnam (ready)
INSERT OR REPLACE INTO entry_info (
  id, user_id, passport_id, personal_info_id, travel_info_id,
  destination_id, status, completion_metrics, documents,
  display_status, last_updated_at, created_at
) VALUES (
  'entry_1762197748186_q2uimkv3k',
  'user_001',
  'passport_1761934913272_wpe2fcoas',
  'personal_1762449730086_cpbbcuwh5',
  'mhfer4w13n955uyc4cy',
  'vn',
  'ready',
  '{"passport":{"complete":5,"total":5,"state":"complete"},"personalInfo":{"complete":6,"total":6,"state":"complete"},"funds":{"complete":1,"total":1,"state":"complete","validFundCount":2},"travel":{"complete":10,"total":10,"state":"complete"}}',
  NULL,
  NULL,
  '2025-11-06T17:24:04.561Z',
  '2025-11-06T17:24:04.562Z'
);

-- Record 9: Malaysia (ready)
INSERT OR REPLACE INTO entry_info (
  id, user_id, passport_id, personal_info_id, travel_info_id,
  destination_id, status, completion_metrics, documents,
  display_status, last_updated_at, created_at
) VALUES (
  'entry_1762206384802_jyxfwdhs0',
  'user_001',
  'passport_1761934913272_wpe2fcoas',
  'personal_1762452180256_1g5cpoo78',
  'mhjo6tu24bstd9rdu7w',
  'my',
  'ready',
  '{"passport":{"complete":5,"total":5,"state":"complete"},"personalInfo":{"complete":6,"total":6,"state":"complete"},"funds":{"complete":1,"total":1,"state":"complete","validFundCount":2},"travel":{"complete":10,"total":10,"state":"complete"}}',
  NULL,
  NULL,
  '2025-11-06T18:03:00.330Z',
  '2025-11-06T18:03:00.330Z'
);

