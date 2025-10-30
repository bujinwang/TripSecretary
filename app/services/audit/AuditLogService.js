/**
 * AuditLogService - Immutable audit logging for entry pack snapshots
 * Tracks all operations on snapshots for security and compliance
 * 
 * Requirements: 28.1-28.5
 */

import * as FileSystem from 'expo-file-system';
import SecureStorageService from '../security/SecureStorageService';

class AuditLogService {
  constructor() {
    this.auditStorageDir = `${FileSystem.documentDirectory}audit_logs/`;
    this.initializeStorage();
  }

  /**
   * Initialize audit log storage directory
   */
  async initializeStorage() {
    try {
      const auditDir = new FileSystem.Directory(this.auditStorageDir);
      const dirExists = await auditDir.exists();
      if (!dirExists) {
        FileSystem.makeDirectory(this.auditStorageDir, { intermediates: true });
        console.log('Audit log storage directory created:', this.auditStorageDir);
      }
    } catch (error) {
      console.error('Failed to initialize audit log storage:', error);
    }
  }

  /**
   * Record audit event
   * @param {string} eventType - Type of event ('created', 'viewed', 'status_changed', 'deleted', 'exported')
   * @param {Object} metadata - Event metadata
   * @returns {Promise<string>} - Event ID
   */
  async record(eventType, metadata = {}) {
    try {
      // Generate unique event ID
      const eventId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      // Create audit event record
      const auditEvent = {
        id: eventId,
        eventType: eventType,
        timestamp: timestamp,
        
        // Core metadata
        snapshotId: metadata.snapshotId || null,
        entryPackId: metadata.entryPackId || null,
        userId: metadata.userId || null,
        
        // Event-specific data
        metadata: {
          ...metadata,
          // Remove duplicated fields from metadata
          snapshotId: undefined,
          entryPackId: undefined,
          userId: undefined
        },
        
        // System context
        systemInfo: {
          appVersion: metadata.appVersion || '1.0.0',
          platform: metadata.platform || 'mobile',
          deviceId: metadata.deviceId || 'unknown'
        },
        
        // Immutability guarantee
        immutable: true,
        version: 1
      };

      // Validate event type
      const validEventTypes = ['created', 'viewed', 'status_changed', 'deleted', 'exported'];
      if (!validEventTypes.includes(eventType)) {
        throw new Error(`Invalid event type: ${eventType}`);
      }

      // Save to both file system and database for redundancy
      await Promise.all([
        this.saveToFileSystem(auditEvent),
        this.saveToDatabase(auditEvent)
      ]);

      console.log('Audit event recorded:', {
        eventId,
        eventType,
        snapshotId: metadata.snapshotId,
        timestamp
      });

      return eventId;
    } catch (error) {
      console.error('Failed to record audit event:', error);
      throw error;
    }
  }

  /**
   * Get audit log for snapshot
   * @param {string} snapshotId - Snapshot ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Audit log with events
   */
  async getAuditLog(snapshotId, options = {}) {
    try {
      console.log('Getting audit log for snapshot:', snapshotId);

      // Load events from database (primary source)
      let events = await this.loadEventsFromDatabase(snapshotId, options);
      
      // If database fails, fallback to file system
      if (events.length === 0) {
        console.log('Database query returned no results, trying file system fallback');
        events = await this.loadEventsFromFileSystem(snapshotId, options);
      }

      // Sort events by timestamp (oldest first)
      events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Apply pagination if requested
      let paginatedEvents = events;
      if (options.limit) {
        const offset = options.offset || 0;
        paginatedEvents = events.slice(offset, offset + options.limit);
      }

      // Calculate audit log summary
      const auditLog = {
        snapshotId: snapshotId,
        version: this.calculateLogVersion(events),
        totalEvents: events.length,
        events: paginatedEvents,
        
        // Event type summary
        eventSummary: this.calculateEventSummary(events),
        
        // Timeline info
        firstEvent: events.length > 0 ? events[0] : null,
        lastEvent: events.length > 0 ? events[events.length - 1] : null,
        
        // Query metadata
        hasMore: options.limit && events.length > (options.offset || 0) + options.limit,
        retrievedAt: new Date().toISOString()
      };

      console.log('Audit log retrieved:', {
        snapshotId,
        totalEvents: auditLog.totalEvents,
        returnedEvents: paginatedEvents.length
      });

      return auditLog;
    } catch (error) {
      console.error('Failed to get audit log:', error);
      throw error;
    }
  }

  /**
   * Save audit event to file system
   * @param {Object} auditEvent - Audit event to save
   * @returns {Promise<void>}
   */
  async saveToFileSystem(auditEvent) {
    try {
      // Create date-based directory structure for organization
      const eventDate = new Date(auditEvent.timestamp);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      
      const datePath = `${year}/${month}/${day}`;
      const eventDir = `${this.auditStorageDir}${datePath}/`;
      
      // Create directory if it doesn't exist
      FileSystem.makeDirectory(eventDir, { intermediates: true });
      
      // Save event as JSON file
      const eventFileName = `${auditEvent.id}.json`;
      const eventFilePath = `${eventDir}${eventFileName}`;
      
      FileSystem.writeAsString(
        eventFilePath, 
        JSON.stringify(auditEvent, null, 2)
      );

      console.log('Audit event saved to file system:', {
        eventId: auditEvent.id,
        path: eventFilePath
      });
    } catch (error) {
      console.error('Failed to save audit event to file system:', error);
      // Don't throw - this is a backup mechanism
    }
  }

  /**
   * Save audit event to database
   * @param {Object} auditEvent - Audit event to save
   * @returns {Promise<void>}
   */
  async saveToDatabase(auditEvent) {
    try {
      await SecureStorageService.saveAuditEvent(auditEvent);
      console.log('Audit event saved to database:', auditEvent.id);
    } catch (error) {
      console.error('Failed to save audit event to database:', error);
      // Don't throw - file system is the fallback
    }
  }

  /**
   * Load events from database
   * @param {string} snapshotId - Snapshot ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of audit events
   */
  async loadEventsFromDatabase(snapshotId, options = {}) {
    try {
      return await SecureStorageService.getAuditEventsBySnapshotId(snapshotId, options);
    } catch (error) {
      console.error('Failed to load events from database:', error);
      return [];
    }
  }

  /**
   * Load events from file system (fallback)
   * @param {string} snapshotId - Snapshot ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of audit events
   */
  async loadEventsFromFileSystem(snapshotId, options = {}) {
    try {
      const events = [];
      
      // This is a simplified implementation - in production you'd want to
      // index files by snapshot ID for better performance
      const auditDirInfo = FileSystem.getInfo(this.auditStorageDir);
      if (!auditDirInfo.exists) {
        return events;
      }

      // Recursively search for audit files
      await this.searchAuditFiles(this.auditStorageDir, snapshotId, events);
      
      return events;
    } catch (error) {
      console.error('Failed to load events from file system:', error);
      return [];
    }
  }

  /**
   * Recursively search for audit files
   * @param {string} dirPath - Directory path to search
   * @param {string} snapshotId - Snapshot ID to filter by
   * @param {Array} events - Array to collect events
   * @returns {Promise<void>}
   */
  async searchAuditFiles(dirPath, snapshotId, events) {
    try {
      const items = FileSystem.readDirectory(dirPath);
      
      for (const item of items) {
        const itemPath = `${dirPath}${item}`;
        const itemInfo = FileSystem.getInfo(itemPath);
        
        if (itemInfo.isDirectory) {
          // Recursively search subdirectories
          await this.searchAuditFiles(`${itemPath}/`, snapshotId, events);
        } else if (item.endsWith('.json')) {
          // Load and check audit event file
          try {
            const eventContent = FileSystem.readAsString(itemPath);
            const auditEvent = JSON.parse(eventContent);
            
            if (auditEvent.snapshotId === snapshotId) {
              events.push(auditEvent);
            }
          } catch (parseError) {
            console.error('Failed to parse audit event file:', itemPath, parseError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to search audit files in directory:', dirPath, error);
    }
  }

  /**
   * Calculate log version based on events
   * @param {Array} events - Array of audit events
   * @returns {number} - Log version
   */
  calculateLogVersion(events) {
    // Version is based on the number of events (simple versioning)
    return events.length;
  }

  /**
   * Calculate event summary statistics
   * @param {Array} events - Array of audit events
   * @returns {Object} - Event summary
   */
  calculateEventSummary(events) {
    const summary = {
      created: 0,
      viewed: 0,
      status_changed: 0,
      deleted: 0,
      exported: 0,
      other: 0
    };

    events.forEach(event => {
      if (summary.hasOwnProperty(event.eventType)) {
        summary[event.eventType]++;
      } else {
        summary.other++;
      }
    });

    return summary;
  }

  /**
   * Verify audit log integrity
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object>} - Integrity verification result
   */
  async verifyIntegrity(snapshotId) {
    try {
      console.log('Verifying audit log integrity for snapshot:', snapshotId);

      const verificationResult = {
        snapshotId: snapshotId,
        isIntact: true,
        issues: [],
        eventCount: 0,
        verifiedAt: new Date().toISOString()
      };

      // Load events from both sources
      const dbEvents = await this.loadEventsFromDatabase(snapshotId);
      const fsEvents = await this.loadEventsFromFileSystem(snapshotId);

      verificationResult.eventCount = Math.max(dbEvents.length, fsEvents.length);

      // Check for consistency between database and file system
      if (dbEvents.length !== fsEvents.length) {
        verificationResult.isIntact = false;
        verificationResult.issues.push({
          type: 'count_mismatch',
          message: `Event count mismatch: DB=${dbEvents.length}, FS=${fsEvents.length}`
        });
      }

      // Check for immutability violations
      const allEvents = [...dbEvents, ...fsEvents];
      const eventIds = new Set();
      
      for (const event of allEvents) {
        if (eventIds.has(event.id)) {
          // Duplicate event ID found - check if content is identical
          const existingEvent = allEvents.find(e => e.id === event.id && e !== event);
          if (JSON.stringify(existingEvent) !== JSON.stringify(event)) {
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

        // Check event structure
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
    } catch (error) {
      console.error('Failed to verify audit log integrity:', error);
      return {
        snapshotId: snapshotId,
        isIntact: false,
        issues: [{ type: 'verification_error', message: error.message }],
        eventCount: 0,
        verifiedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Export audit log for compliance
   * @param {string} snapshotId - Snapshot ID
   * @param {string} format - Export format ('json', 'csv')
   * @returns {Promise<Object>} - Export result
   */
  async exportAuditLog(snapshotId, format = 'json') {
    try {
      console.log('Exporting audit log:', { snapshotId, format });

      const auditLog = await this.getAuditLog(snapshotId);
      const exportTimestamp = new Date().toISOString();
      const exportFileName = `audit_log_${snapshotId}_${Date.now()}.${format}`;
      const exportPath = `${FileSystem.documentDirectory}exports/${exportFileName}`;

      // Create exports directory
      FileSystem.makeDirectory(`${FileSystem.documentDirectory}exports/`, { 
        intermediates: true 
      });

      let exportContent;
      
      if (format === 'json') {
        exportContent = JSON.stringify({
          exportInfo: {
            snapshotId: snapshotId,
            exportedAt: exportTimestamp,
            format: format,
            totalEvents: auditLog.totalEvents
          },
          auditLog: auditLog
        }, null, 2);
      } else if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = 'Event ID,Event Type,Timestamp,Snapshot ID,Entry Pack ID,User ID,Metadata\n';
        const csvRows = auditLog.events.map(event => {
          return [
            event.id,
            event.eventType,
            event.timestamp,
            event.snapshotId || '',
            event.entryPackId || '',
            event.userId || '',
            JSON.stringify(event.metadata).replace(/"/g, '""') // Escape quotes for CSV
          ].join(',');
        }).join('\n');
        
        exportContent = csvHeaders + csvRows;
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

      // Write export file
      FileSystem.writeAsString(exportPath, exportContent);

      // Record export event in audit log
      await this.record('exported', {
        snapshotId: snapshotId,
        exportFormat: format,
        exportPath: exportPath,
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
        exportPath: exportPath,
        fileName: exportFileName,
        format: format,
        eventCount: auditLog.totalEvents,
        exportedAt: exportTimestamp
      };
    } catch (error) {
      console.error('Failed to export audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   * @returns {Promise<Object>} - Audit statistics
   */
  async getStats() {
    try {
      // This is a simplified implementation
      // In production, you'd want to maintain these stats in a summary table
      
      const stats = {
        totalEvents: 0,
        eventsByType: {},
        storageUsage: 0,
        oldestEvent: null,
        newestEvent: null,
        calculatedAt: new Date().toISOString()
      };

      // Calculate storage usage
      const auditDirInfo = FileSystem.getInfo(this.auditStorageDir);
      if (auditDirInfo.exists) {
        stats.storageUsage = await this.calculateDirectorySize(this.auditStorageDir);
      }

      return stats;
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        storageUsage: 0,
        oldestEvent: null,
        newestEvent: null,
        calculatedAt: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Calculate directory size recursively
   * @param {string} dirPath - Directory path
   * @returns {Promise<number>} - Size in bytes
   */
  async calculateDirectorySize(dirPath) {
    try {
      let totalSize = 0;
      
      const dirInfo = FileSystem.getInfo(dirPath);
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        return 0;
      }

      const items = FileSystem.readDirectory(dirPath);
      
      for (const item of items) {
        const itemPath = `${dirPath}${item}`;
        const itemInfo = FileSystem.getInfo(itemPath);
        
        if (itemInfo.isDirectory) {
          totalSize += await this.calculateDirectorySize(`${itemPath}/`);
        } else {
          totalSize += itemInfo.size || 0;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate directory size:', error);
      return 0;
    }
  }
}

// Export singleton instance
const auditLogService = new AuditLogService();

export default auditLogService;