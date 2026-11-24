#!/usr/bin/env node

/**
 * Consolidate duplicate personal_info records.
 *
 * Many simulator databases accumulated a new personal_info row on every save,
 * leaving dozens of nearly-identical records per user. This script:
 *   1. Picks the richest record per user (most populated fields, latest update).
 *   2. Backfills any missing fields on that record from the duplicates.
 *   3. Re-links entry_info rows to the surviving record.
 *   4. Deletes the obsolete rows.
 *
 * Usage:
 *   node scripts/consolidate-personal-info.js [--db /path/to/db] [--user user_001] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DEFAULT_SIMULATOR_DB_PATH =
  '/Users/bujin/Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA/data/Containers/Data/Application/D2C892B1-6872-4624-BA10-5AEABC8E69C2/Documents/ExponentExperienceData/@anonymous/chujingtong-949aa9fd-5f29-4180-8e63-54175ac2c5e3/SQLite/tripsecretary_secure';

const VALUE_FIELDS = [
  'encrypted_phone_number',
  'encrypted_email',
  'encrypted_home_address',
  'occupation',
  'province_city',
  'country_region',
  'phone_code',
  'gender',
  'label',
  'passport_id',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dbPath: null,
    dryRun: false,
    userId: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--db' && args[i + 1]) {
      options.dbPath = args[i + 1];
      i += 1;
    } else if (arg === '--user' && args[i + 1]) {
      options.userId = args[i + 1];
      i += 1;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else {
      console.warn(`⚠️  Unknown argument ignored: ${arg}`);
    }
  }

  if (!options.dbPath) {
    options.dbPath = DEFAULT_SIMULATOR_DB_PATH;
  }

  return options;
}

function hasValue(value) {
  if (value === null || value === undefined) {
    return false;
  }
  return String(value).trim().length > 0;
}

function calculateScore(row) {
  let score = 0;
  VALUE_FIELDS.forEach((field) => {
    if (hasValue(row[field])) {
      score += 1;
    }
  });
  // Reward records already marked default slightly to avoid toggling if all else equal
  if (row.is_default) {
    score += 0.5;
  }
  return score;
}

function selectBestRecord(rows) {
  let best = null;
  rows.forEach((row) => {
    const metrics = {
      score: calculateScore(row),
      updatedAt: Date.parse(row.updated_at || 0) || 0,
      createdAt: Date.parse(row.created_at || 0) || 0,
      isDefault: row.is_default ? 1 : 0,
    };

    if (!best) {
      best = { row, metrics };
      return;
    }

    const candidateBetter =
      metrics.score > best.metrics.score ||
      (metrics.score === best.metrics.score &&
        (metrics.updatedAt > best.metrics.updatedAt ||
          (metrics.updatedAt === best.metrics.updatedAt &&
            (metrics.isDefault > best.metrics.isDefault ||
              (metrics.isDefault === best.metrics.isDefault &&
                metrics.createdAt > best.metrics.createdAt)))));

    if (candidateBetter) {
      best = { row, metrics };
    }
  });

  return best ? best.row : null;
}

async function consolidatePersonalInfo() {
  const options = parseArgs();
  const dbPath = options.dbPath;

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found:', dbPath);
    console.error('👉 Pass a custom path via --db /path/to/tripsecretary_secure');
    process.exit(1);
  }

  console.log('📁 Database:', dbPath);
  console.log(`🧪 Mode: ${options.dryRun ? 'DRY-RUN (no changes will be written)' : 'APPLY'}`);
  if (options.userId) {
    console.log('👤 Limiting to user:', options.userId);
  }

  if (!options.dryRun) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${dbPath}.backup.${timestamp}`;
    fs.copyFileSync(dbPath, backupPath);
    console.log('💾 Backup created at:', backupPath);
  }

  const db = new sqlite3.Database(dbPath);
  const dbRun = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function onRun(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  const dbAll = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

  try {
    const duplicateUsers = await dbAll(
      `
        SELECT user_id, COUNT(*) AS record_count
        FROM personal_info
        ${options.userId ? 'WHERE user_id = ?' : ''}
        GROUP BY user_id
        HAVING record_count > 1
        ORDER BY record_count DESC
      `,
      options.userId ? [options.userId] : []
    );

    if (duplicateUsers.length === 0) {
      console.log('✅ No users with duplicate personal_info rows found for the provided filter.');
      return;
    }

    console.log(`👥 Found ${duplicateUsers.length} user(s) with duplicates.`);

    let totalRemoved = 0;
    let totalUsersProcessed = 0;
    let totalEntryInfoUpdates = 0;
    let totalFieldsMerged = 0;

    if (!options.dryRun) {
      await dbRun('BEGIN IMMEDIATE TRANSACTION');
    }

    for (const user of duplicateUsers) {
      const rows = await dbAll(
        'SELECT * FROM personal_info WHERE user_id = ? ORDER BY updated_at DESC',
        [user.user_id]
      );

      if (rows.length <= 1) {
        continue;
      }

      const bestRecord = selectBestRecord(rows);
      if (!bestRecord) {
        continue;
      }

      const duplicates = rows.filter((row) => row.id !== bestRecord.id);
      console.log(
        `\n🧹 User ${user.user_id}: keeping ${bestRecord.id} (score ${calculateScore(
          bestRecord
        )}), removing ${duplicates.length} duplicate(s).`
      );

      const mergeUpdates = {};
      VALUE_FIELDS.forEach((field) => {
        if (!hasValue(bestRecord[field])) {
          const donor = duplicates.find((row) => hasValue(row[field]));
          if (donor) {
            mergeUpdates[field] = donor[field];
          }
        }
      });

      if (Object.keys(mergeUpdates).length > 0) {
        mergeUpdates.updated_at = new Date().toISOString();
        totalFieldsMerged += Object.keys(mergeUpdates).length;
      }

      if (options.dryRun) {
        if (Object.keys(mergeUpdates).length > 0) {
          console.log('   ↪️  Would merge fields into survivor:', Object.keys(mergeUpdates));
        }
        duplicates.forEach((dup) => {
          console.log(`   ❌ Would re-link entry_info from ${dup.id} → ${bestRecord.id} then delete`);
        });
      } else {
        if (Object.keys(mergeUpdates).length > 0) {
          const setClauses = Object.keys(mergeUpdates)
            .map((field) => `${field} = ?`)
            .join(', ');
          const values = Object.keys(mergeUpdates).map((field) => mergeUpdates[field]);
          values.push(bestRecord.id);
          await dbRun(`UPDATE personal_info SET ${setClauses} WHERE id = ?`, values);
        }

        await dbRun(
          'UPDATE personal_info SET is_default = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE user_id = ?',
          [bestRecord.id, user.user_id]
        );

        for (const duplicate of duplicates) {
          const entryUpdate = await dbRun(
            'UPDATE entry_info SET personal_info_id = ? WHERE personal_info_id = ?',
            [bestRecord.id, duplicate.id]
          );
          totalEntryInfoUpdates += entryUpdate.changes || 0;

          const deleteResult = await dbRun('DELETE FROM personal_info WHERE id = ?', [duplicate.id]);
          totalRemoved += deleteResult.changes || 0;
        }
      }

      totalUsersProcessed += 1;
    }

    if (!options.dryRun) {
      await dbRun('COMMIT');
    }

    console.log('\n📊 Consolidation summary:');
    console.log(`   Users processed: ${totalUsersProcessed}`);
    console.log(`   Fields merged into survivors: ${totalFieldsMerged}`);
    console.log(`   Entry info links updated: ${totalEntryInfoUpdates}`);
    console.log(`   Duplicate records removed: ${totalRemoved}`);

    if (options.dryRun) {
      console.log('\nℹ️  Dry-run complete. Re-run without --dry-run to apply these changes.');
    } else {
      console.log('\n✅ Consolidation completed successfully.');
    }
  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    if (!options.dryRun) {
      try {
        await dbRun('ROLLBACK');
      } catch (rollbackError) {
        console.error('⚠️  Failed to rollback transaction:', rollbackError.message);
      }
    }
    process.exit(1);
  } finally {
    db.close();
  }
}

consolidatePersonalInfo();
