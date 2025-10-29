/**
 * Fix Completion Metrics Script
 *
 * Recalculates and updates completion_metrics for all entry_info records
 * based on actual data in the database.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path - update this to match your simulator path
const DB_PATH = process.env.DB_PATH || path.join(
  process.env.HOME,
  'Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA',
  'data/Containers/Data/Application/D2C892B1-6872-4624-BA10-5AEABC8E69C2',
  'Documents/ExponentExperienceData/@anonymous/chujingtong-949aa9fd-5f29-4180-8e63-54175ac2c5e3',
  'SQLite/tripsecretary_secure'
);

console.log('📊 Fix Completion Metrics Script');
console.log('='.repeat(50));
console.log('Database:', DB_PATH);
console.log('');

// Helper function to check if field has data
function hasData(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  return true;
}

function computeMetric(checks) {
  const total = checks.length;
  const complete = checks.filter(Boolean).length;
  const state = complete === total ? 'complete'
    : complete > 0 ? 'partial'
      : 'missing';

  return { complete, total, state };
}

function dbGet(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function dbGetCount(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.fund_count || 0 : 0);
      }
    });
  });
}

// Calculate metrics for a single entry
async function calculateMetricsForEntry(db, entryInfo) {
  const [passport, personalInfo, travelInfo, fundCount] = await Promise.all([
    dbGet(
      db,
      `SELECT encrypted_passport_number, encrypted_full_name, encrypted_nationality,
              encrypted_date_of_birth, expiry_date
       FROM passports WHERE id = ?`,
      [entryInfo.passport_id]
    ),
    dbGet(
      db,
      `SELECT occupation, province_city, country_region, encrypted_phone_number,
              encrypted_email, phone_code
       FROM personal_info WHERE id = ?`,
      [entryInfo.personal_info_id]
    ),
    dbGet(
      db,
      `SELECT travel_purpose, recent_stay_country, boarding_country,
              arrival_flight_number, arrival_arrival_date,
              departure_flight_number, departure_departure_date,
              accommodation_type, province, hotel_address,
              is_transit_passenger
       FROM travel_info WHERE id = ?`,
      [entryInfo.travel_info_id]
    ),
    dbGetCount(
      db,
      `SELECT COUNT(*) as fund_count FROM fund_items WHERE user_id = ?`,
      [entryInfo.user_id]
    )
  ]);

  const passportChecks = passport
    ? [
        hasData(passport.encrypted_passport_number),
        hasData(passport.encrypted_full_name),
        hasData(passport.encrypted_nationality),
        hasData(passport.encrypted_date_of_birth),
        hasData(passport.expiry_date)
      ]
    : new Array(5).fill(false);

  const personalChecks = personalInfo
    ? [
        hasData(personalInfo.occupation),
        hasData(personalInfo.province_city),
        hasData(personalInfo.country_region),
        hasData(personalInfo.phone_code),
        hasData(personalInfo.encrypted_phone_number),
        hasData(personalInfo.encrypted_email)
      ]
    : new Array(6).fill(false);

  let travelChecks;
  if (travelInfo) {
    const isTransitPassenger = Number(travelInfo.is_transit_passenger) === 1;

    travelChecks = [
      hasData(travelInfo.travel_purpose),
      hasData(travelInfo.recent_stay_country),
      hasData(travelInfo.boarding_country),
      hasData(travelInfo.arrival_flight_number),
      hasData(travelInfo.arrival_arrival_date),
      hasData(travelInfo.departure_flight_number),
      hasData(travelInfo.departure_departure_date)
    ];

    if (!isTransitPassenger) {
      travelChecks.push(
        hasData(travelInfo.accommodation_type),
        hasData(travelInfo.province),
        hasData(travelInfo.hotel_address)
      );
    }
  } else {
    // Assume full travel requirements when no record exists
    travelChecks = new Array(10).fill(false);
  }

  const metrics = {
    passport: computeMetric(passportChecks),
    personalInfo: computeMetric(personalChecks),
    travel: computeMetric(travelChecks),
    funds: {
      complete: fundCount > 0 ? 1 : 0,
      total: 1,
      state: fundCount > 0 ? 'complete' : 'missing'
    }
  };

  return metrics;
}

// Main function
async function fixCompletionMetrics() {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err);
      process.exit(1);
    }
  });

  console.log('✅ Database connection opened\n');

  // Get all entry_info records
  db.all(
    `SELECT * FROM entry_info WHERE user_id = 'user_001'`,
    [],
    async (err, entries) => {
      if (err) {
        console.error('❌ Error fetching entries:', err);
        db.close();
        return;
      }

      console.log(`📦 Found ${entries.length} entry_info records\n`);

      for (const entry of entries) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📍 Entry: ${entry.destination_id.toUpperCase()}`);
        console.log(`   ID: ${entry.id}`);
        console.log(`   Status: ${entry.status}`);

        try {
          const metrics = await calculateMetricsForEntry(db, entry);

          // Calculate overall percentage
          const totalComplete = metrics.passport.complete + metrics.personalInfo.complete +
                               metrics.travel.complete + metrics.funds.complete;
          const totalFields = metrics.passport.total + metrics.personalInfo.total +
                             metrics.travel.total + metrics.funds.total;
          const percentage = Math.round((totalComplete / totalFields) * 100);

          console.log(`\n   📊 Calculated Metrics:`);
          console.log(`   - Passport:      ${metrics.passport.complete}/${metrics.passport.total} (${metrics.passport.state})`);
          console.log(`   - Personal Info: ${metrics.personalInfo.complete}/${metrics.personalInfo.total} (${metrics.personalInfo.state})`);
          console.log(`   - Travel:        ${metrics.travel.complete}/${metrics.travel.total} (${metrics.travel.state})`);
          console.log(`   - Funds:         ${metrics.funds.complete}/${metrics.funds.total} (${metrics.funds.state})`);
          console.log(`   - Overall:       ${totalComplete}/${totalFields} = ${percentage}%`);

          // Convert to JSON string (single stringify, not double)
          const metricsJson = JSON.stringify(metrics);

          // Update database
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE entry_info SET completion_metrics = ?, last_updated_at = ? WHERE id = ?`,
              [metricsJson, new Date().toISOString(), entry.id],
              (err) => {
                if (err) {
                  console.error(`   ❌ Error updating entry:`, err);
                  reject(err);
                } else {
                  console.log(`   ✅ Updated completion_metrics in database`);
                  resolve();
                }
              }
            );
          });

        } catch (error) {
          console.error(`   ❌ Error calculating metrics:`, error);
        }
      }

      console.log(`\n${'='.repeat(50)}`);
      console.log('\n✅ All entries processed!');
      console.log('\n📱 Reload your app to see the updated percentages.\n');

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        process.exit(0);
      });
    }
  );
}

// Run the script
fixCompletionMetrics().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
