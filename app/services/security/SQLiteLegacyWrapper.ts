/**
 * SQLiteLegacyWrapper
 *
 * Compatibility layer that mirrors the callback-style API of the legacy
 * `expo-sqlite` module while internally delegating to the async/await API.
 *
 * This is primarily used to support older modules and scripts that still rely on
 * transactions with callback signatures (`transaction((tx) => { ... })`). The
 * wrapper ensures those callers can keep working while the rest of the
 * codebase adopts the modern async interface provided by Expo SDK 51+.
 */

import { openDatabaseAsync } from 'expo-sqlite';

// Minimal subset of the async SQLite API that we rely on. The Expo type
// definitions are not yet exposed publicly, so we declare the contract here.
interface SQLiteDatabase {
  runAsync(query: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T | null>;
  execAsync(query: string): Promise<void>;
  closeAsync(): Promise<void>;
  withTransactionAsync<T>(callback: () => Promise<T>): Promise<T>;
}

export interface LegacyResultSetRowList {
  readonly length: number;
  item: (index: number) => Record<string, unknown> | null;
  readonly _array: Record<string, unknown>[];
}

export interface LegacyResultSet {
  readonly rows: LegacyResultSetRowList;
  readonly rowsAffected: number;
  readonly insertId?: number | null;
}

export type LegacyExecuteSqlSuccessCallback = (transaction: LegacyTransaction, resultSet: LegacyResultSet) => void;

export type LegacyExecuteSqlErrorCallback = (transaction: LegacyTransaction, error: Error) => boolean | void;

export type LegacyTransactionCallback = (transaction: LegacyTransaction) => void | Promise<void>;

export interface LegacyTransaction {
  executeSql(
    sqlStatement: string,
    args?: unknown[] | null,
    successCallback?: LegacyExecuteSqlSuccessCallback,
    errorCallback?: LegacyExecuteSqlErrorCallback
  ): Promise<LegacyResultSet>;
}

export interface LegacyDatabase {
  transaction(
    callback: LegacyTransactionCallback,
    errorCallback?: (error: Error) => void,
    successCallback?: () => void
  ): Promise<void>;
  readTransaction(
    callback: LegacyTransactionCallback,
    errorCallback?: (error: Error) => void,
    successCallback?: () => void
  ): Promise<void>;
  exec(
    queries: Array<{ sql: string; args?: unknown[] }> | string[],
    readOnly?: boolean
  ): Promise<void>;
  close(): Promise<void>;
  getAsyncDatabase(): SQLiteDatabase;
}

class LegacyResultSetRowListImpl implements LegacyResultSetRowList {
  private readonly rows: Record<string, unknown>[];

  constructor(rows: Record<string, unknown>[]) {
    this.rows = rows;
  }

  get length(): number {
    return this.rows.length;
  }

  item(index: number): Record<string, unknown> | null {
    if (index < 0 || index >= this.rows.length) {
      return null;
    }
    return this.rows[index];
  }

  get _array(): Record<string, unknown>[] {
    return this.rows;
  }
}

class LegacyTransactionImpl implements LegacyTransaction {
  private readonly db: SQLiteDatabase;
  private readonly mode: 'read' | 'write';
  private pending: Array<Promise<LegacyResultSet>> = [];

  constructor(db: SQLiteDatabase, mode: 'read' | 'write') {
    this.db = db;
    this.mode = mode;
  }

  async executeSql(
    sqlStatement: string,
    args: unknown[] | null = null,
    successCallback?: LegacyExecuteSqlSuccessCallback,
    errorCallback?: LegacyExecuteSqlErrorCallback
  ): Promise<LegacyResultSet> {
    const params = Array.isArray(args) ? args : [];

    const task = SQLiteLegacyWrapper.executeSql(this.db, sqlStatement, params, this.mode)
      .then(result => {
        if (successCallback) {
          successCallback(this, result);
        }
        return result;
      })
      .catch(error => {
        if (errorCallback) {
          const shouldSuppress = errorCallback(this, error instanceof Error ? error : new Error(String(error)));
          if (shouldSuppress === false) {
            throw error;
          }
        }
        throw error;
      });

    this.pending.push(task);
    return task;
  }

  async flushPending(): Promise<void> {
    if (this.pending.length === 0) {
      return;
    }

    const tasks = this.pending;
    this.pending = [];
    await Promise.all(tasks);
  }
}

class LegacyDatabaseImpl implements LegacyDatabase {
  private readonly db: SQLiteDatabase;

  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  async transaction(
    callback: LegacyTransactionCallback,
    errorCallback?: (error: Error) => void,
    successCallback?: () => void
  ): Promise<void> {
    await this.runWithTransaction(callback, 'write', errorCallback, successCallback);
  }

  async readTransaction(
    callback: LegacyTransactionCallback,
    errorCallback?: (error: Error) => void,
    successCallback?: () => void
  ): Promise<void> {
    await this.runWithTransaction(callback, 'read', errorCallback, successCallback);
  }

  async exec(
    queries: Array<{ sql: string; args?: unknown[] }> | string[],
    readOnly: boolean = false
  ): Promise<void> {
    const normalized = queries.map(query => {
      if (typeof query === 'string') {
        return { sql: query, args: [] as unknown[] };
      }
      return { sql: query.sql, args: query.args ?? [] };
    });

    await this.db.withTransactionAsync(async () => {
      for (const { sql, args } of normalized) {
        await SQLiteLegacyWrapper.executeSql(this.db, sql, args, readOnly ? 'read' : 'write');
      }
    });
  }

  async close(): Promise<void> {
    await this.db.closeAsync();
  }

  getAsyncDatabase(): SQLiteDatabase {
    return this.db;
  }

  private async runWithTransaction(
    callback: LegacyTransactionCallback,
    mode: 'read' | 'write',
    errorCallback?: (error: Error) => void,
    successCallback?: () => void
  ): Promise<void> {
    const transaction = new LegacyTransactionImpl(this.db, mode);

    try {
      await this.db.withTransactionAsync(async () => {
        await callback(transaction);
        await transaction.flushPending();
      });
      if (successCallback) {
        successCallback();
      }
    } catch (error) {
      if (errorCallback) {
        errorCallback(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      throw error;
    }
  }
}

export default class SQLiteLegacyWrapper {
  static async open(name: string): Promise<LegacyDatabase> {
    const db = (await openDatabaseAsync(name)) as SQLiteDatabase;
    return new LegacyDatabaseImpl(db);
  }

  static from(database: SQLiteDatabase): LegacyDatabase {
    return new LegacyDatabaseImpl(database);
  }

  private static async executeSql(
    db: SQLiteDatabase,
    sqlStatement: string,
    params: unknown[],
    mode: 'read' | 'write'
  ): Promise<LegacyResultSet> {
    const trimmed = sqlStatement.trim();
    if (!trimmed) {
      throw new Error('SQL statement must not be empty');
    }

    const command = SQLiteLegacyWrapper.getStatementType(trimmed);
    const lowerCaseCommand = command.toLowerCase();

    if (mode === 'read' && !SQLiteLegacyWrapper.isReadOnlyStatement(lowerCaseCommand)) {
      throw new Error(`Attempted to execute write operation (${command}) inside readTransaction`);
    }

    if (SQLiteLegacyWrapper.isResultProducingStatement(lowerCaseCommand)) {
      const rows = await db.getAllAsync(trimmed, params);
      const resultRows = new LegacyResultSetRowListImpl(rows);

      return {
        rows: resultRows,
        rowsAffected: 0,
        insertId: null
      };
    }

    const { changes, lastInsertRowId } = await db.runAsync(trimmed, params);
    const resultRows = new LegacyResultSetRowListImpl([]);

    return {
      rows: resultRows,
      rowsAffected: changes,
      insertId: Number.isFinite(lastInsertRowId) ? lastInsertRowId : null
    };
  }

  private static getStatementType(sqlStatement: string): string {
    const [command] = sqlStatement.split(/\s+/);
    return command ?? '';
  }

  private static isResultProducingStatement(command: string): boolean {
    return ['select', 'pragma', 'explain'].includes(command);
  }

  private static isReadOnlyStatement(command: string): boolean {
    return ['select', 'pragma', 'explain'].includes(command);
  }
}

