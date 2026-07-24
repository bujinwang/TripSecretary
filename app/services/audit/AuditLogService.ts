/**
 * AuditLogService - Immutable audit logging for entry pack snapshots
 * Tracks all operations on snapshots for security and compliance
 *
 * Requirements: 28.1-28.5
 */

import * as FileSystem from 'expo-file-system';
import SecureStorageService from '../security/SecureStorageService';

type AuditEventType = 'created' | 'viewed' | 'status_changed' | 'deleted' | 'exported';

type AuditMetadata = Record<string, unknown> & {
  snapshotId?: string;
  entryPackId?: string;
  userId?: string;
  appVersion?: string;
  platform?: string;
  deviceId?: string;
};

type AuditQueryOptions = {
  limit?: number;
  offset?: number;
  eventTypes?: AuditEventType[];
  startDate?: string;
  endDate?: string;
};

type AuditEvent = {
  id: string;
  eventType: AuditEventType;
  timestamp: string;
  snapshotId: string | null;
  entryPackId: string | null;
  userId: string | null;
  metadata: Record<string, unknown>;
  systemInfo: {
    appVersion: string;
    platform: string;
    deviceId: string;
  };
  immutable: true;
  version: number;
};

type AuditLog = {
  snapshotId: string;
  version: number;
  totalEvents: number;
  events: AuditEvent[];
  eventSummary: AuditSummary;
  firstEvent: AuditEvent | null;
  lastEvent: AuditEvent | null;
  hasMore: boolean;
  retrievedAt: string;
};

type AuditSummary = Record<AuditEventType | 'other', number>;

type IntegrityIssue = {
  type: string;
  eventId?: string;
  message: string;
};

type IntegrityResult = {
  snapshotId: string;
  isIntact: boolean;
  issues: IntegrityIssue[];
  eventCount: number;
  verifiedAt: string;
};

type AuditExportFormat = 'json' | 'csv';

type AuditExportResult = {
  success: boolean;
  exportPath: string;
  fileName: string;
  format: AuditExportFormat;
  eventCount: number;
  exportedAt: string;
};

type AuditStatistics = {
  totalEvents: number;
  eventsByType: Record<string, number>;
  storageUsage: number;
  oldestEvent: string | null;
  newestEvent: string | null;
  calculatedAt: string;
  error?: string;
};

type SecureStorageAuditAdapter = {
  saveAuditEvent?: (event: AuditEvent) => Promise<void>;
  getAuditEventsBySnapshotId?: (snapshotId: string, options?: AuditQueryOptions) => Promise<AuditEvent[]>;
};

type FileSystemDirectory = {
  exists(): Promise<boolean>;
  create(): Promise<void>;
  list(): Promise<string[]>;
};

type FileSystemFile = {
  exists(): Promise<boolean>;
  write(data: string): Promise<void>;
  text(): Promise<string>;
  size(): Promise<number | null>;
};

class AuditLogService {
  private readonly auditStorageDir: string;

  private readonly secureStorage: SecureStorageAuditAdapter;

  constructor() {
    this.auditStorageDir = `${FileSystem.documentDirectory}audit_logs/`;
    this.secureStorage = SecureStorageService as unknown as SecureStorageAuditAdapter;
    void this.initializeStorage();
  }

  /**
   * Initialize audit log storage directory
   */
  async initializeStorage(): Promise<void> {
    try {
      const auditDir = new FileSystem.Directory(this.auditStorageDir) as unknown as FileSystemDirectory;
      const dirExists = await auditDir.exists();
      if (!dirExists) {
        await auditDir.create();
        console.log('Audit log storage directory created:', this.auditStorageDir);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize audit log storage:', message);
    }
  }

  /**
   * Record audit event
   * @param eventType - Type of event
   * @param metadata - Event metadata
   * @returns Event ID
   */
  async record(eventType: AuditEventType, metadata: AuditMetadata = {}): Promise<string> {
    try {
      const eventId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const timestamp = new Date().toISOString();

      const {
        snapshotId = null,
        entryPackId = null,
        userId = null,
        appVersion = '1.0.0',
        platform = 'mobile',
        deviceId = 'unknown',
        ...restMetadata
      } = metadata;

      const validEventTypes: AuditEventType[] = ['created', 'viewed', 'status_changed', 'deleted', 'exported'];
      if (!validEventTypes.includes(eventType)) {
        throw new Error(`Invalid event type: ${eventType}`);
      }

      const auditEvent: AuditEvent = {
        id: eventId,
        eventType,
        timestamp,
        snapshotId,
        entryPackId,
        userId,
        metadata: restMetadata,
        systemInfo: {
          appVersion: String(appVersion),
          platform: String(platform),
          deviceId: String(deviceId)
        },
        immutable: true,
        version: 1
      };

      const savePromises: Array<Promise<void>> = [this.saveToFileSystem(auditEvent)];
      if (this.secureStorage.saveAuditEvent) {
        savePromises.push(this.secureStorage.saveAuditEvent(auditEvent));
      }

      await Promise.all(savePromises);

      console.log('Audit event recorded:', {
        eventId,
        eventType,
        snapshotId,
        timestamp
      });

      return eventId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to record audit event:', message);
      throw new Error(message);
    }
  }

  /**
   * Get audit log for snapshot
   */
  async getAuditLog(snapshotId: string, options: AuditQueryOptions = {}): Promise<AuditLog> {
    try {
      console.log('Getting audit log for snapshot:', snapshotId);

      let events = await this.loadEventsFromDatabase(snapshotId, options);

      if (events.length === 0) {
        console.log('Database query returned no results, trying file system fallback');
        events = await this.loadEventsFromFileSystem(snapshotId, options);
      }

      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      let paginatedEvents = events;
      if (options.limit !== undefined) {
        const offset = options.offset ?? 0;
        paginatedEvents = events.slice(offset, offset + options.limit);
      }

      const auditLog: AuditLog = {
        snapshotId,
        version: this.calculateLogVersion(events),
        totalEvents: events.length,
        events: paginatedEvents,
        eventSummary: this.calculateEventSummary(events),
        firstEvent: events.length > 0 ? events[0] : null,
        lastEvent: events.length > 0 ? events[events.length - 1] : null,
        hasMore: Boolean(options.limit && events.length > (options.offset ?? 0) + options.limit),
        retrievedAt: new Date().toISOString()
      };

      console.log('Audit log retrieved:', {
        snapshotId,
        totalEvents: auditLog.totalEvents,
        returnedEvents: paginatedEvents.length
      });

      return auditLog;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to get audit log:', message);
      throw new Error(message);
    }
  }

  /**
   * Save audit event to file system
   */
  async saveToFileSystem(auditEvent: AuditEvent): Promise<void> {
    try {
      const eventDate = new Date(auditEvent.timestamp);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');

      const datePath = `${year}/${month}/${day}`;
      const eventDir = `${this.auditStorageDir}${datePath}/`;

      const eventDirectory = new FileSystem.Directory(eventDir) as unknown as FileSystemDirectory;
      await eventDirectory.create();

      const eventFileName = `${auditEvent.id}.json`;
      const eventFilePath = `${eventDir}${eventFileName}`;

      const eventFile = new FileSystem.File(eventFilePath) as unknown as FileSystemFile;
      await eventFile.write(JSON.stringify(auditEvent, null, 2));

      console.log('Audit event saved to file system:', {
        eventId: auditEvent.id,
        path: eventFilePath
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to save audit event to file system:', message);
    }
  }

  /**
   * Load events from database
   */
  async loadEventsFromDatabase(snapshotId: string, options: AuditQueryOptions = {}): Promise<AuditEvent[]> {
    try {
      if (!this.secureStorage.getAuditEventsBySnapshotId) {
        return [];
      }
      return await this.secureStorage.getAuditEventsBySnapshotId(snapshotId, options);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load events from database:', message);
      return [];
    }
  }

  /**
   * Load events from file system (fallback)
   */
  async loadEventsFromFileSystem(snapshotId: string, options: AuditQueryOptions = {}): Promise<AuditEvent[]> {
    void options;
    try {
      const events: AuditEvent[] = [];

      const auditDir = new FileSystem.Directory(this.auditStorageDir) as unknown as FileSystemDirectory;
      if (!await auditDir.exists()) {
        return events;
      }

      await this.searchAuditFiles(this.auditStorageDir, snapshotId, events);

      return events;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load events from file system:', message);
      return [];
    }
  }

  /**
   * Recursively search for audit files
   */
  async searchAuditFiles(dirPath: string, snapshotId: string, events: AuditEvent[]): Promise<void> {
    try {
      const dir = new FileSystem.Directory(dirPath) as unknown as FileSystemDirectory;
      const items = await dir.list();

      for (const item of items) {
        const itemPath = `${dirPath}${item}`;
        const itemDir = new FileSystem.Directory(itemPath) as unknown as FileSystemDirectory;
        const itemFile = new FileSystem.File(itemPath) as unknown as FileSystemFile;

        if (await itemDir.exists()) {
          await this.searchAuditFiles(`${itemPath}/`, snapshotId, events);
        } else if (item.endsWith('.json') && await itemFile.exists()) {
          try {
            const eventContent = await itemFile.text();
            const auditEvent = JSON.parse(eventContent) as AuditEvent;

            if (auditEvent.snapshotId === snapshotId) {
              events.push(auditEvent);
            }
          } catch (parseError: unknown) {
            const message = parseError instanceof Error ? parseError.message : String(parseError);
            console.error('Failed to parse audit event file:', itemPath, message);
          }
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to search audit files in directory:', dirPath, message);
    }
  }

  /**
   * Calculate log version based on events
   */
  calculateLogVersion(events: AuditEvent[]): number {
    return events.length;
  }

  /**
   * Calculate event summary statistics
   */
  calculateEventSummary(events: AuditEvent[]): AuditSummary {
    const summary: AuditSummary = {
      created: 0,
      viewed: 0,
      status_changed: 0,
      deleted: 0,
      exported: 0,
      other: 0
    };

    events.forEach(event => {
      if (summary[event.eventType] !== undefined) {
        summary[event.eventType] += 1;
      } else {
        summary.other += 1;
      }
    });

    return summary;
  }

  /**
   * Verify audit log integrity
   */
  async verifyIntegrity(snapshotId: string): Promise<IntegrityResult> {
    try {
      console.log('Verifying audit log integrity for snapshot:', snapshotId);

      const verificationResult: IntegrityResult = {
        snapshotId,
        isIntact: true,
        issues: [],
        eventCount: 0,
        verifiedAt: new Date().toISOString()
      };

      const dbEvents = await this.loadEventsFromDatabase(snapshotId);
      const fsEvents = await this.loadEventsFromFileSystem(snapshotId);

      verificationResult.eventCount = Math.max(dbEvents.length, fsEvents.length);

      if (dbEvents.length !== fsEvents.length) {
        verificationResult.isIntact = false;
        verificationResult.issues.push({
          type: 'count_mismatch',
          message: `Event count mismatch: DB=${dbEvents.length}, FS=${fsEvents.length}`
        });
      }

      const allEvents = [...dbEvents, ...fsEvents];
      const eventIds = new Set<string>();

      for (const event of allEvents) {
        if (eventIds.has(event.id)) {
          const existingEvent = allEvents.find(e => e.id === event.id && e !== event);
          if (existingEvent && JSON.stringify(existingEvent) !== JSON.stringify(event)) {
            verificationResult.isIntact = false;
            verificationResult.issues.push({
              type: 'immutability_violation',
              eventId: event.id,
              message: 'Event content has been modified'
            });
          }
        } else {
          eventIds.add(event.id);
        }

        if (!event.immutable || event.version !== 1) {
          verificationResult.isIntact = false;
          verificationResult.issues.push({
            type: 'structure_violation',
            eventId: event.id,
            message: 'Event structure is invalid'
          });
        }
      }

      console.log('Audit log integrity verification completed:', {
        snapshotId,
        isIntact: verificationResult.isIntact,
        issueCount: verificationResult.issues.length
      });

      return verificationResult;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to verify audit log integrity:', message);
      return {
        snapshotId,
        isIntact: false,
        issues: [{ type: 'verification_error', message }],
        eventCount: 0,
        verifiedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Export audit log for compliance
   */
  async exportAuditLog(snapshotId: string, format: AuditExportFormat = 'json'): Promise<AuditExportResult> {
    try {
      console.log('Exporting audit log:', { snapshotId, format });

      const auditLog = await this.getAuditLog(snapshotId);
      const exportTimestamp = new Date().toISOString();
      const exportFileName = `audit_log_${snapshotId}_${Date.now()}.${format}`;
      const exportDirPath = `${FileSystem.documentDirectory}exports/`;
      const exportPath = `${exportDirPath}${exportFileName}`;

      const exportsDir = new FileSystem.Directory(exportDirPath) as unknown as FileSystemDirectory;
      if (!await exportsDir.exists()) {
        await exportsDir.create();
      }

      let exportContent: string;

      if (format === 'json') {
        exportContent = JSON.stringify({
          exportInfo: {
            snapshotId,
            exportedAt: exportTimestamp,
            format,
            totalEvents: auditLog.totalEvents
          },
          auditLog
        }, null, 2);
      } else if (format === 'csv') {
        const csvHeaders = 'Event ID,Event Type,Timestamp,Snapshot ID,Entry Pack ID,User ID,Metadata\n';
        const csvRows = auditLog.events.map(event => {
          const metadata = JSON.stringify(event.metadata).replace(/"/g, '""');
          return [
            event.id,
            event.eventType,
            event.timestamp,
            event.snapshotId ?? '',
            event.entryPackId ?? '',
            event.userId ?? '',
            metadata
          ].join(',');
        }).join('\n');

        exportContent = csvHeaders + csvRows;
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

      const exportFile = new FileSystem.File(exportPath) as unknown as FileSystemFile;
      await exportFile.write(exportContent);

      await this.record('exported', {
        snapshotId,
        exportFormat: format,
        exportPath,
        eventCount: auditLog.totalEvents
      });

      console.log('Audit log exported successfully:', {
        snapshotId,
        format,
        exportPath,
        eventCount: auditLog.totalEvents
      });

      return {
        success: true,
        exportPath,
        fileName: exportFileName,
        format,
        eventCount: auditLog.totalEvents,
        exportedAt: exportTimestamp
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to export audit log:', message);
      throw new Error(message);
    }
  }

  /**
   * Get audit statistics
   */
  async getStats(): Promise<AuditStatistics> {
    try {
      const stats: AuditStatistics = {
        totalEvents: 0,
        eventsByType: {},
        storageUsage: 0,
        oldestEvent: null,
        newestEvent: null,
        calculatedAt: new Date().toISOString()
      };

      const auditDir = new FileSystem.Directory(this.auditStorageDir) as unknown as FileSystemDirectory;
      if (await auditDir.exists()) {
        stats.storageUsage = await this.calculateDirectorySize(this.auditStorageDir);
      }

      return stats;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to get audit statistics:', message);
      return {
        totalEvents: 0,
        eventsByType: {},
        storageUsage: 0,
        oldestEvent: null,
        newestEvent: null,
        calculatedAt: new Date().toISOString(),
        error: message
      };
    }
  }

  /**
   * Calculate directory size recursively
   */
  async calculateDirectorySize(dirPath: string): Promise<number> {
    try {
      let totalSize = 0;

      const dir = new FileSystem.Directory(dirPath) as unknown as FileSystemDirectory;
      if (!await dir.exists()) {
        return 0;
      }

      const items = await dir.list();

      for (const item of items) {
        const itemPath = `${dirPath}${item}`;
        const itemDir = new FileSystem.Directory(itemPath) as unknown as FileSystemDirectory;
        const itemFile = new FileSystem.File(itemPath) as unknown as FileSystemFile;

        if (await itemDir.exists()) {
          totalSize += await this.calculateDirectorySize(`${itemPath}/`);
        } else if (await itemFile.exists()) {
          totalSize += (await itemFile.size()) ?? 0;
        }
      }

      return totalSize;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to calculate directory size:', message);
      return 0;
    }
  }
}

const auditLogService = new AuditLogService();

export default auditLogService;
