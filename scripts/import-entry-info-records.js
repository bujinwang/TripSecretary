/**
 * Script to import the 9 entry_info records into the current simulator database
 * Run with: node scripts/import-entry-info-records.js
 * 
 * This will insert the 9 records you provided into the database
 */

const path = require('path');
const SQLite = require('react-native-sqlite-storage').default;

const entryInfoRecords = [
  {
    "id": "entry_1761348094096_5kg7bla7e",
    "user_id": "user_001",
    "passport_id": "passport_1761348123876_8a6sujvz4",
    "personal_info_id": "personal_1761348123900_yr1wft0kw",
    "travel_info_id": "mhct8mp7ji2ip9d56bs",
    "destination_id": "th",
    "status": "submitted",
    "completion_metrics": "{\"passport\":{\"complete\":5,\"total\":5,\"state\":\"complete\"},\"personalInfo\":{\"complete\":6,\"total\":6,\"state\":\"complete\"},\"funds\":{\"complete\":1,\"total\":1,\"state\":\"complete\",\"validFundCount\":2},\"travel\":{\"complete\":10,\"total\":10,\"state\":\"complete\"}}",
    "documents": null,
    "display_status": null,
    "last_updated_at": "2025-10-31T16:24:05.149Z",
    "created_at": "2025-10-31T16:24:05.149Z"
  },
  {
    "id": "entry_1762271522033_5oajfhktd",
    "user_id": "user_001",
    "passport_id": "passport_1761934913272_wpe2fcoas",
    "personal_info_id": "personal_1762441243926_9vd778qz4",
    "travel_info_id": "mhkqys9k23szikv0rnv",
    "destination_id": "jp",
    "status": "incomplete",
    "completion_metrics": "{\"passport\":{\"complete\":5,\"total\":5,\"state\":\"complete\"},\"personalInfo\":{\"complete\":6,\"total\":6,\"state\":\"complete\"},\"funds\":{\"complete\":1,\"total\":1,\"state\":\"complete\",\"validFundCount\":2},\"travel\":{\"complete\":2,\"total\":10,\"state\":\"partial\"}}",
    "documents": null,
    "display_status": null,
    "last_updated_at": "2025-11-06T15:00:43.993Z",
    "created_at": "2025-11-06T15:00:43.993Z"
  },
  {
    "id": "entry_1761498113630_671h97bpx",
    "user_id": "user_001",
    "passport_id": "passport_1761934913272_wpe2fcoas",
    "personal_info_id": "personal_1762441658750_mkke3vk0a",
    "travel_info_id": "mh6xwxxvsh4rrsz883f",
    "destination_id": "hk",
    "status": "incomplete",
    "completion_metrics": "{\"passport\":{\"complete\":5,\"total\":5,\"state\":\"complete\"},\"personalInfo\":{\"complete\":6,\"total\":6,\"state\":\"complete\"},\"funds\":{\"complete\":1,\"total\":1,\"state\":\"complete\",\"validFundCount\":2},\"travel\":{\"complete\":9,\"total\":10,\"state\":\"partial\"}}",
    "documents": null,
    "display_status": null,
    "last_updated_at": "2025-11-06T15:07:38.819Z",
    "created_at": "2025-11-06T15:07:38.819Z"
  },
  {
    "id": "entry_1762442205061_ovmnvws85",
    "user_id": "user_001",
    "passport_id": "passport_1761934913272_wpe2fcoas",
    "personal_info_id": "personal_1762443030155_vrwcjobvo",
    "travel_info_id": "mhnkl27snrvb1okqp7",
    "destination_id": "us",
    "status": "incomplete",
    "completion_metrics": "{\"passport\":{\"complete\":5,\"total\":5,\"state\":\"complete\"},\"personalInfo\":{\"complete\":6,\"total\":6,\"state\":\"complete\"},\"funds\":{\"complete\":1,\"total\":1,\"state\":\"complete\",\"validFundCount\":2},\"travel\":{\"complete\":2,\"total\":10,\"state\":\"partial\"}}",
    "documents": null,
    "display_status": null,
    "last_updated_at": "2025-11-06T15:30:30.326Z",
    "created_at": "2025-11-06T15:30:30.326Z"
  },
  {
    "id": "entry_1762444026770_05u1u9pcn",
    "user_id": "user_001",
    "passport_id": "passport_1761934913272_wpe2fcoas",
    "personal_info_id": "personal_1762444149031_ktluvmlts",
    "travel_info_id": "mhnlo3kt2op01wjt396",
    "destination_id": "tw",
    "status": "incomplete",
    "completion_metrics": "{\"passport\":{\"complete\":5,\"total\":5,\"state\":\"complete\"},\"personalInfo\":{\"complete\":6,\"total\":6,\"state\":\"complete\"},\"funds\":{\"complete\":1,\"total\":1,\"state\":\"complete\",\"validFundCount\":2},\"travel\":{\"complete\":2,\"total\":10,\"state\":\"partial\"}}",
    "documents": null,
    "display_status": null,
    "last_updated_at": "2025-11-06T15:49:09.093Z",
    "created_at": "2025-11-06T15:49:09.093Z"
  },
  {
    "id": "entry_1762446618612_rwz0hzzue",
    "user_id": "user_001",
    "passport_id": "passport_1761934913272_wpe2fcoas",
    "personal_info_id": "personal_1762447645315_q252ommkr",
    "travel_info_id": "mhnntmlwi5rnrxjwpgj",
    "destination_id": "kr",
    "status": "incomplete",
    "completion_metrics": "{\"passport\":{\"complete\":5,\"total\":5,\"state\":\"complete\"},\"personalInfo\":{\"complete\":6,\"total\":6,\"state\":\"complete\"},\"funds\":{\"complete\":1,\"total\":1,\"state\":\"complete\",\"validFundCount\":2},\"travel\":{\"complete\":0,\"total\":10,\"state\":\"missing\"}}",
    "documents": null,
    "display_status": null,
    "last_updated_at": "2025-11-06T16:47:25.391Z",
    "created_at": "2025-11-06T16:47:25.391Z"
  },
  {
    "id": "entry_1762443970838_gh2bkrv7u",
    "user_id": "user_001",
    "passport_id": "passport_1761934913272_wpe2fcoas",
    "personal_info_id": "personal_1762449730086_cpbbcuwh5",
    "travel_info_id": "mhnlmwums37zbcm5td",
    "destination_id": "sg",
    "status": "incomplete",
    "completion_metrics": "{\"passport\":{\"complete\":5,\"total\":5,\"state\":\"complete\"},\"personalInfo\":{\"complete\":6,\"total\":6,\"state\":\"complete\"},\"funds\":{\"complete\":1,\"total\":1,\"state\":\"complete\",\"validFundCount\":2},\"travel\":{\"complete\":2,\"total\":10,\"state\":\"partial\"}}",
    "documents": null,
    "display_status": null,
    "last_updated_at": "2025-11-06T17:22:11.687Z",
    "created_at": "2025-11-06T17:22:11.687Z"
  },
  {
    "id": "entry_1762197748186_q2uimkv3k",
    "user_id": "user_001",
    "passport_id": "passport_1761934913272_wpe2fcoas",
    "personal_info_id": "personal_1762449730086_cpbbcuwh5",
    "travel_info_id": "mhfer4w13n955uyc4cy",
    "destination_id": "vn",
    "status": "ready",
    "completion_metrics": "{\"passport\":{\"complete\":5,\"total\":5,\"state\":\"complete\"},\"personalInfo\":{\"complete\":6,\"total\":6,\"state\":\"complete\"},\"funds\":{\"complete\":1,\"total\":1,\"state\":\"complete\",\"validFundCount\":2},\"travel\":{\"complete\":10,\"total\":10,\"state\":\"complete\"}}",
    "documents": null,
    "display_status": null,
    "last_updated_at": "2025-11-06T17:24:04.561Z",
    "created_at": "2025-11-06T17:24:04.562Z"
  },
  {
    "id": "entry_1762206384802_jyxfwdhs0",
    "user_id": "user_001",
    "passport_id": "passport_1761934913272_wpe2fcoas",
    "personal_info_id": "personal_1762452180256_1g5cpoo78",
    "travel_info_id": "mhjo6tu24bstd9rdu7w",
    "destination_id": "my",
    "status": "ready",
    "completion_metrics": "{\"passport\":{\"complete\":5,\"total\":5,\"state\":\"complete\"},\"personalInfo\":{\"complete\":6,\"total\":6,\"state\":\"complete\"},\"funds\":{\"complete\":1,\"total\":1,\"state\":\"complete\",\"validFundCount\":2},\"travel\":{\"complete\":10,\"total\":10,\"state\":\"complete\"}}",
    "documents": null,
    "display_status": null,
    "last_updated_at": "2025-11-06T18:03:00.330Z",
    "created_at": "2025-11-06T18:03:00.330Z"
  }
];

async function importRecords() {
  console.log('📥 Importing 9 entry_info records...\n');
  
  // Note: This script needs to be run from within the React Native app context
  // or you need to provide the actual database path
  console.log('⚠️  This script needs to be run from within the app or with the database path.');
  console.log('   The database path should be logged when the app starts.');
  console.log('   Look for: "Opening database: tripsecretary_secure"\n');
  
  console.log('Records to import:');
  entryInfoRecords.forEach((record, index) => {
    console.log(`  ${index + 1}. ${record.destination_id} - ${record.status} (${record.id})`);
  });
  
  console.log('\n💡 To import these records, you can:');
  console.log('   1. Use the app\'s data import feature (if available)');
  console.log('   2. Manually insert via SQL in the app\'s database');
  console.log('   3. Copy the database file from the simulator that has the 9 records');
  console.log('   4. Use a database browser tool to import the records\n');
  
  // Generate SQL INSERT statements
  console.log('SQL INSERT statements:\n');
  entryInfoRecords.forEach((record) => {
    const sql = `INSERT OR REPLACE INTO entry_info (
      id, user_id, passport_id, personal_info_id, travel_info_id,
      destination_id, status, completion_metrics, documents,
      display_status, last_updated_at, created_at
    ) VALUES (
      '${record.id}',
      '${record.user_id}',
      ${record.passport_id ? `'${record.passport_id}'` : 'NULL'},
      ${record.personal_info_id ? `'${record.personal_info_id}'` : 'NULL'},
      ${record.travel_info_id ? `'${record.travel_info_id}'` : 'NULL'},
      '${record.destination_id}',
      '${record.status}',
      ${record.completion_metrics ? `'${record.completion_metrics.replace(/'/g, "''")}'` : 'NULL'},
      ${record.documents ? `'${record.documents}'` : 'NULL'},
      ${record.display_status ? `'${record.display_status}'` : 'NULL'},
      '${record.last_updated_at}',
      '${record.created_at}'
    );`;
    console.log(sql);
  });
}

importRecords().catch(console.error);

