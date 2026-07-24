/**
 * OfflineQueueService - Queues operations when offline for later execution
 *
 * Stores pending API submissions in AsyncStorage and replays them
 * when network connectivity is restored.
 *
 * Requirements: P2 - Offline mode enhancements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkCapabilityDetector from '../../utils/NetworkCapabilityDetector';

export type QueueOperationType =
  | 'submit_entry_info'
  | 'submit_digital_card'
  | 'sync_user_data'
  | 'upload_document'
  | 'tdac_submission';

export interface QueuedOperation {
  id: string;
  type: QueueOperationType;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

export interface QueueStatus {
  queueSize: number;
  isOnline: boolean;
  oldestPending: number | null;
  operations: QueuedOperation[];
}

interface OperationResult {
  success: boolean;
  error?: string;
}

type OperationProcessor = (operation: QueuedOperation) => Promise<OperationResult>;

class OfflineQueueService {
  private readonly queueKey = 'offline_operation_queue';
  private readonly maxRetries = 3;
  private processors: Map<QueueOperationType, OperationProcessor> = new Map();
  private isProcessing = false;
  private isOnline = true;
  private networkCheckInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Array<(status: QueueStatus) => void> = [];

  /**
   * Initialize the offline queue service
   */
  async initialize(): Promise<void> {
    console.log('[OfflineQueue] Initializing offline queue service');

    // Check initial network status
    await this.checkNetworkStatus();

    // Start periodic network checks (every 30 seconds)
    this.networkCheckInterval = setInterval(async () => {
      await this.checkNetworkStatus();
    }, 30000);

    // Process any pending operations if online
    if (this.isOnline) {
      await this.processQueue();
    }
  }

  /**
   * Register a processor for a specific operation type
   */
  registerProcessor(type: QueueOperationType, processor: OperationProcessor): void {
    console.log(`[OfflineQueue] Registered processor for ${type}`);
    this.processors.set(type, processor);
  }

  /**
   * Enqueue an operation for later execution
   */
  async enqueue(type: QueueOperationType, payload: unknown): Promise<string> {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const operation: QueuedOperation = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries,
    };

    const queue = await this.getQueue();
    queue.push(operation);
    await this.saveQueue(queue);

    console.log(`[OfflineQueue] Enqueued operation ${id} of type ${type}. Queue size: ${queue.length}`);

    // Try processing immediately if online
    if (this.isOnline && !this.isProcessing) {
      await this.processQueue();
    }

    await this.notifyListeners();
    return id;
  }

  /**
   * Get the current queue status
   */
  async getStatus(): Promise<QueueStatus> {
    const queue = await this.getQueue();

    return {
      queueSize: queue.length,
      isOnline: this.isOnline,
      oldestPending: queue.length > 0 ? queue[0].timestamp : null,
      operations: queue,
    };
  }

  /**
   * Process all pending operations in the queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('[OfflineQueue] Already processing, skipping');
      return;
    }

    if (!this.isOnline) {
      console.log('[OfflineQueue] Offline, cannot process queue');
      return;
    }

    this.isProcessing = true;

    try {
      const queue = await this.getQueue();
      console.log(`[OfflineQueue] Processing ${queue.length} pending operations`);

      const remaining: QueuedOperation[] = [];

      for (const operation of queue) {
        const processor = this.processors.get(operation.type);

        if (!processor) {
          console.warn(`[OfflineQueue] No processor registered for type ${operation.type}, removing operation`);
          continue;
        }

        try {
          const result = await processor(operation);

          if (result.success) {
            console.log(`[OfflineQueue] Successfully processed operation ${operation.id}`);
          } else {
            operation.retryCount++;
            operation.lastError = result.error;

            if (operation.retryCount < operation.maxRetries) {
              remaining.push(operation);
              console.log(`[OfflineQueue] Operation ${operation.id} failed, retry ${operation.retryCount}/${operation.maxRetries}`);
            } else {
              console.error(`[OfflineQueue] Operation ${operation.id} exceeded max retries, dropping`);
            }
          }
        } catch (error) {
          operation.retryCount++;
          operation.lastError = (error as Error).message;

          if (operation.retryCount < operation.maxRetries) {
            remaining.push(operation);
          }
        }
      }

      await this.saveQueue(remaining);
      console.log(`[OfflineQueue] Queue processing complete. Remaining: ${remaining.length}`);
    } finally {
      this.isProcessing = false;
      await this.notifyListeners();
    }
  }

  /**
   * Remove a specific operation from the queue
   */
  async removeOperation(operationId: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(op => op.id !== operationId);
    await this.saveQueue(filtered);
    await this.notifyListeners();
  }

  /**
   * Clear the entire queue
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(this.queueKey);
    await this.notifyListeners();
  }

  /**
   * Subscribe to queue status changes
   */
  subscribe(listener: (status: QueueStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Clean up service (stop intervals)
   */
  cleanup(): void {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
    this.listeners = [];
  }

  // Private helpers

  private async getQueue(): Promise<QueuedOperation[]> {
    try {
      const json = await AsyncStorage.getItem(this.queueKey);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('[OfflineQueue] Failed to read queue:', error);
      return [];
    }
  }

  private async saveQueue(queue: QueuedOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  private async checkNetworkStatus(): Promise<void> {
    try {
      const isOnline = await NetworkCapabilityDetector.testFetchCapability();
      const wasOffline = !this.isOnline;

      this.isOnline = isOnline;

      if (wasOffline && isOnline) {
        console.log('[OfflineQueue] Network restored, processing queue');
        await this.processQueue();
      }

      await this.notifyListeners();
    } catch (error) {
      console.error('[OfflineQueue] Network check failed:', error);
    }
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch (error) {
        console.error('[OfflineQueue] Listener error:', error);
      }
    }
  }
}

// Export singleton instance
const offlineQueueService = new OfflineQueueService();
export default offlineQueueService;
