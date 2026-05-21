/**
 * DataAccessLogService
 *
 * Lightweight observability utility for tracking access to sensitive data.
 * Uses the modern async FileSystem API while offering simple helpers for
 * recording, querying, and pruning access logs.
 */

import * as FileSystem from 'expo-file-system';
import LoggingService from '../LoggingService';

const COMPONENT = 'DataAccessLogService';

export type DataAccessAction = 'READ' | 'WRITE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'SHARE';

export type DataAccessSource = 'service' | 'background' | 'sync' | 'api' | 'user';

export interface DataAccessLogEntry {
  id: string;
  timestamp: string;
  action: DataAccessAction;
  entity: string;
  entityId?: string;
  userId?: string;
  actor?: string;
  source?: DataAccessSource;
  metadata?: Record<string, unknown>;
  success: boolean;
  durationMs?: number;
  errorMessage?: string | null;
}

export interface RecordAccessOptions {
  action: DataAccessAction;
  entity: string;
  entityId?: string;
  userId?: string;
  actor?: string;
  source?: DataAccessSource;
  metadata?: Record<string, unknown>;
  success?: boolean;
  durationMs?: number;
  error?: Error | string | null;
}

export interface DataAccessLogFilters {
  action?: DataAccessAction;
  entity?: string;
  entityId?: string;
  userId?: string;
  source?: DataAccessSource;
  since?: Date;
  until?: Date;
  success?: boolean;
}

export interface LogStatistics {
  total: number;
  byAction: Record<DataAccessAction, number>;
  byEntity: Record<string, number>;
  lastEntry?: DataAccessLogEntry;
}

interface DataAccessLogConfig {
  retentionDays: number;
  maxEntries: number;
  enabled: boolean;
}

class DataAccessLogService {
  private static instance: DataAccessLogService | null = null;

  private readonly config: DataAccessLogConfig = {
    retentionDays: 30,
    maxEntries: 1000,
    enabled: true
  };

  private readonly logDirectory: string;
  private readonly logFilePath: string;

  private cache: DataAccessLogEntry[] | null = null;
  private lock: Promise<void> = Promise.resolve();

  private constructor() {
    const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
    this.logDirectory = `${baseDir}data-access-logs`;
    this.logFilePath = `${this.logDirectory}/logs.json`;
  }

  static getInstance(): DataAccessLogService {
    if (!this.instance) {
      this.instance = new DataAccessLogService();
    }

    return this.instance;
  }

  async recordAccess(options: RecordAccessOptions): Promise<DataAccessLogEntry | null> {
    if (!this.config.enabled) {
      return null;
    }

    const entry: DataAccessLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      userId: options.userId,
      actor: options.actor,
      source: options.source ?? 'service',
      metadata: options.metadata,
      success: options.success ?? true,
      durationMs: options.durationMs,
      errorMessage: this.extractErrorMessage(options.error)
    };

    await this.withLock(async () => {
      const logs = await this.loadLogs();
      logs.push(entry);
      this.pruneLogsInPlace(logs);
      await this.saveLogs(logs);
      this.cache = logs;
    });

    LoggingService.debug(COMPONENT, 'Recorded data access entry', {
      action: entry.action,
      entity: entry.entity,
      success: entry.success
    });

    return entry;
  }

  async getLogs(filters?: DataAccessLogFilters): Promise<DataAccessLogEntry[]> {
    const logs = await this.loadLogs();
    if (!filters) {
      return [...logs];
    }

    return logs.filter(entry => this.matchesFilters(entry, filters));
  }

  async getRecentLogs(limit: number = 50): Promise<DataAccessLogEntry[]> {
    const logs = await this.loadLogs();
    return logs.slice(-limit).reverse();
  }

  async clearLogs(): Promise<void> {
    await this.withLock(async () => {
      this.cache = [];
      await this.ensureStorage();
      await FileSystem.writeAsStringAsync(this.logFilePath, '[]');
    });

    LoggingService.info(COMPONENT, 'Cleared data access logs');
  }

  async getStatistics(): Promise<LogStatistics> {
    const logs = await this.loadLogs();
    const byAction: Record<DataAccessAction, number> = {
      READ: 0,
      WRITE: 0,
      DELETE: 0,
      EXPORT: 0,
      IMPORT: 0,
      SHARE: 0
    };

    const byEntity: Record<string, number> = {};

    for (const entry of logs) {
      byAction[entry.action] += 1;
      byEntity[entry.entity] = (byEntity[entry.entity] ?? 0) + 1;
    }

    return {
      total: logs.length,
      byAction,
      byEntity,
      lastEntry: logs.at(-1)
    };
  }

  configure(partialConfig: Partial<Omit<DataAccessLogConfig, 'enabled'>> & { enabled?: boolean }): void {
    if (typeof partialConfig.retentionDays === 'number' && partialConfig.retentionDays > 0) {
      this.config.retentionDays = partialConfig.retentionDays;
    }

    if (typeof partialConfig.maxEntries === 'number' && partialConfig.maxEntries > 0) {
      this.config.maxEntries = partialConfig.maxEntries;
    }

    if (typeof partialConfig.enabled === 'boolean') {
      this.config.enabled = partialConfig.enabled;
    }
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  private async loadLogs(): Promise<DataAccessLogEntry[]> {
    if (this.cache) {
      return this.cache;
    }

    await this.ensureStorage();

    try {
      const contents = await FileSystem.readAsStringAsync(this.logFilePath);
      const parsed = JSON.parse(contents) as DataAccessLogEntry[];
      this.cache = Array.isArray(parsed) ? parsed.map(entry => this.normalizeEntry(entry)) : [];
    } catch (error) {
      if (error instanceof Error && error.message.includes('No such file or directory')) {
        this.cache = [];
        await FileSystem.writeAsStringAsync(this.logFilePath, '[]');
      } else {
        LoggingService.error(COMPONENT, error as Error, { operation: 'loadLogs' });
        this.cache = [];
      }
    }

    return this.cache;
  }

  private async saveLogs(logs: DataAccessLogEntry[]): Promise<void> {
    try {
      await this.ensureStorage();
      await FileSystem.writeAsStringAsync(this.logFilePath, JSON.stringify(logs));
    } catch (error) {
      LoggingService.error(COMPONENT, error as Error, { operation: 'saveLogs' });
      throw error;
    }
  }

  private async ensureStorage(): Promise<void> {
    try {
      const directoryInfo = await FileSystem.getInfoAsync(this.logDirectory);
      if (!directoryInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.logDirectory, { intermediates: true });
      }
    } catch (error) {
      LoggingService.error(COMPONENT, error as Error, { operation: 'ensureStorage' });
      throw error;
    }
  }

  private pruneLogsInPlace(logs: DataAccessLogEntry[]): void {
    const now = Date.now();
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

    const filtered = logs.filter(entry => {
      const entryTime = Date.parse(entry.timestamp);
      if (Number.isNaN(entryTime)) {
        return false;
      }
      return now - entryTime <= retentionMs;
    });

    logs.length = 0;
    logs.push(...filtered);

    if (logs.length > this.config.maxEntries) {
      logs.splice(0, logs.length - this.config.maxEntries);
    }
  }

  private matchesFilters(entry: DataAccessLogEntry, filters: DataAccessLogFilters): boolean {
    if (filters.action && entry.action !== filters.action) {
      return false;
    }

    if (filters.entity && entry.entity !== filters.entity) {
      return false;
    }

    if (filters.entityId && entry.entityId !== filters.entityId) {
      return false;
    }

    if (filters.userId && entry.userId !== filters.userId) {
      return false;
    }

    if (filters.source && entry.source !== filters.source) {
      return false;
    }

    if (typeof filters.success === 'boolean' && entry.success !== filters.success) {
      return false;
    }

    if (filters.since) {
      const sinceTime = filters.since.getTime();
      const entryTime = Date.parse(entry.timestamp);
      if (!Number.isNaN(entryTime) && entryTime < sinceTime) {
        return false;
      }
    }

    if (filters.until) {
      const untilTime = filters.until.getTime();
      const entryTime = Date.parse(entry.timestamp);
      if (!Number.isNaN(entryTime) && entryTime > untilTime) {
        return false;
      }
    }

    return true;
  }

  private normalizeEntry(entry: DataAccessLogEntry): DataAccessLogEntry {
    return {
      ...entry,
      id: entry.id || this.generateId(),
      timestamp: entry.timestamp || new Date().toISOString(),
      action: entry.action,
      entity: entry.entity,
      source: entry.source ?? 'service',
      success: typeof entry.success === 'boolean' ? entry.success : true,
      metadata: entry.metadata ?? undefined,
      errorMessage: entry.errorMessage ?? null
    };
  }

  private extractErrorMessage(error: Error | string | null | undefined): string | null {
    if (!error) {
      return null;
    }

    if (typeof error === 'string') {
      return error;
    }

    return error.message;
  }

  private generateId(): string {
    const randomPart = Math.random().toString(36).slice(2, 8);
    return `log_${Date.now()}_${randomPart}`;
  }

  private async withLock<T>(task: () => Promise<T>): Promise<T> {
    await this.lock;
    let release: () => void = () => {};
    this.lock = new Promise<void>(resolve => {
      release = resolve;
    });

    try {
      return await task();
    } finally {
      release();
    }
  }
}

export default DataAccessLogService.getInstance();

