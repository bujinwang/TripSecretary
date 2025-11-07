import * as FileSystem from 'expo-file-system';

type StorageCategory = 'snapshots' | 'exports' | 'backups' | 'auditLogs';

type StorageCategoryWithTotal = StorageCategory | 'total';

type StorageQuotaConfig = Partial<Record<StorageCategoryWithTotal, number>>;

type StorageUsage = Record<StorageCategory, number>;

type QuotaStatus = Record<StorageCategoryWithTotal, boolean>;

type UsageSummary = {
  usage: StorageUsage;
  totalUsage: number;
  formattedUsage: Record<StorageCategoryWithTotal, string>;
  quotaStatus: QuotaStatus;
};

type FileSystemDirectory = {
  exists(): Promise<boolean>;
  create(): Promise<void>;
  list(): Promise<string[]>;
};

type FileSystemFile = {
  exists(): Promise<boolean>;
  size(): Promise<number | null>;
};

const DEFAULT_QUOTAS: Required<StorageQuotaConfig> = {
  snapshots: 500 * 1024 * 1024, // 500 MB
  exports: 200 * 1024 * 1024, // 200 MB
  backups: 2 * 1024 * 1024 * 1024, // 2 GB
  auditLogs: 200 * 1024 * 1024, // 200 MB
  total: 3 * 1024 * 1024 * 1024 // 3 GB
};

class StorageQuotaManager {
  private quotas: Required<StorageQuotaConfig>;

  private readonly categoryDirectories: Record<StorageCategory, string>;

  constructor(initialQuotas: StorageQuotaConfig = {}) {
    this.quotas = { ...DEFAULT_QUOTAS, ...initialQuotas } as Required<StorageQuotaConfig>;

    this.categoryDirectories = {
      snapshots: `${FileSystem.documentDirectory}snapshots/`,
      exports: `${FileSystem.documentDirectory}exports/`,
      backups: `${FileSystem.documentDirectory}backups/`,
      auditLogs: `${FileSystem.documentDirectory}audit_logs/`
    };
  }

  setQuota(category: StorageCategoryWithTotal, bytes: number): void {
    if (bytes <= 0) {
      throw new Error('Quota must be a positive number of bytes');
    }

    this.quotas[category] = bytes;
  }

  getQuota(category: StorageCategoryWithTotal): number {
    return this.quotas[category];
  }

  async getUsageSummary(): Promise<UsageSummary> {
    const usage: StorageUsage = {
      snapshots: await this.calculateDirectorySize(this.categoryDirectories.snapshots),
      exports: await this.calculateDirectorySize(this.categoryDirectories.exports),
      backups: await this.calculateDirectorySize(this.categoryDirectories.backups),
      auditLogs: await this.calculateDirectorySize(this.categoryDirectories.auditLogs)
    };

    const totalUsage = Object.values(usage).reduce((sum, value) => sum + value, 0);

    const formattedUsage: Record<StorageCategoryWithTotal, string> = {
      snapshots: this.formatBytes(usage.snapshots),
      exports: this.formatBytes(usage.exports),
      backups: this.formatBytes(usage.backups),
      auditLogs: this.formatBytes(usage.auditLogs),
      total: this.formatBytes(totalUsage)
    };

    const quotaStatus: QuotaStatus = {
      snapshots: usage.snapshots <= this.quotas.snapshots,
      exports: usage.exports <= this.quotas.exports,
      backups: usage.backups <= this.quotas.backups,
      auditLogs: usage.auditLogs <= this.quotas.auditLogs,
      total: totalUsage <= this.quotas.total
    };

    return {
      usage,
      totalUsage,
      formattedUsage,
      quotaStatus
    };
  }

  async isQuotaExceeded(): Promise<boolean> {
    const { quotaStatus } = await this.getUsageSummary();
    return Object.values(quotaStatus).some(status => status === false);
  }

  async enforceQuotas(): Promise<void> {
    const exceeded = await this.isQuotaExceeded();
    if (!exceeded) {
      return;
    }

    console.warn('[StorageQuotaManager] Quota exceeded. Consider cleaning up old data.');
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    try {
      const dir = new FileSystem.Directory(dirPath) as unknown as FileSystemDirectory;
      if (!await dir.exists()) {
        return 0;
      }

      const items = await dir.list();
      let totalSize = 0;

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
      console.error('[StorageQuotaManager] Failed to calculate directory size:', dirPath, message);
      return 0;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    return `${size.toFixed(2)} ${sizes[i]}`;
  }
}

const storageQuotaManager = new StorageQuotaManager();

export default storageQuotaManager;
