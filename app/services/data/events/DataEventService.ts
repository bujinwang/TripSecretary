import SnapshotService from '../../snapshot/SnapshotService';
import EntryInfo from '../../../models/EntryInfo';
import DataDiffCalculator from '../../../utils/DataDiffCalculator';

type DataChangeDetails = Record<string, unknown>;

type DataChangeEvent = {
  type: 'DATA_CHANGED';
  dataType: string;
  userId: string;
  timestamp: string;
} & DataChangeDetails;

type ResubmissionWarningEvent = {
  type: 'RESUBMISSION_WARNING';
  entryInfoId: string;
  userId: string;
  destinationId: string;
  diffResult: Record<string, unknown>;
  changeSummary: Record<string, unknown>;
  requiresImmediateResubmission: boolean;
  timestamp: string;
};

type DataEvent = DataChangeEvent | ResubmissionWarningEvent;

type DataChangeListener = (event: DataEvent) => void;

type EntryInfoRecord = {
  id?: string;
  status?: string;
  userId?: string;
  destinationId?: string;
  [key: string]: unknown;
};

type GetEntryInfosCallback = (userId: string) => Promise<EntryInfoRecord[]>;

type CheckEntryInfoCallback = (
  entryInfo: EntryInfoRecord,
  dataType: string,
  changeDetails: DataChangeDetails
) => Promise<void>;

type GetAllUserDataCallback = (userId: string) => Promise<Record<string, unknown>>;

type GetTravelInfoCallback = (userId: string, destinationId: string | undefined) => Promise<Record<string, unknown>>;

type GetFundItemsCallback = (userId: string) => Promise<unknown[]>;

class DataEventService {
  private static dataChangeListeners: DataChangeListener[] = [];

  private static resubmissionWarnings: Map<string, ResubmissionWarningEvent> = new Map();

  static addDataChangeListener(listener: DataChangeListener): () => void {
    this.dataChangeListeners.push(listener);

    return () => {
      const index = this.dataChangeListeners.indexOf(listener);
      if (index > -1) {
        this.dataChangeListeners.splice(index, 1);
      }
    };
  }

  static triggerDataChangeEvent(dataType: string, userId: string, changeDetails: DataChangeDetails = {}): void {
    try {
      const event: DataChangeEvent = {
        type: 'DATA_CHANGED',
        dataType,
        userId,
        timestamp: new Date().toISOString(),
        ...changeDetails
      };

      console.log('Data change event triggered:', event);

      this.dataChangeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('Error in data change listener:', message);
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to trigger data change event:', message);
    }
  }

  static async handleDataChangeForActiveEntryPacks(
    userId: string,
    dataType: string,
    changeDetails: DataChangeDetails,
    getAllEntryInfosForUser: GetEntryInfosCallback,
    checkEntryInfoForDataChanges: CheckEntryInfoCallback
  ): Promise<void> {
    try {
      const activeEntryInfos = await getAllEntryInfosForUser(userId);
      const submittedInfos = activeEntryInfos.filter(info => info.status === 'submitted');

      if (submittedInfos.length === 0) {
        console.log('No submitted entry infos found, no resubmission warning needed');
        return;
      }

      console.log(`Found ${submittedInfos.length} submitted entry infos, checking for data changes`);

      for (const entryInfo of submittedInfos) {
        await checkEntryInfoForDataChanges(entryInfo, dataType, changeDetails);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to handle data change for active entry infos:', message);
    }
  }

  static async checkEntryInfoForDataChanges(
    entryInfo: EntryInfoRecord,
    dataType: string,
    changeDetails: DataChangeDetails,
    getAllUserData: GetAllUserDataCallback,
    getTravelInfo: GetTravelInfoCallback,
    getFundItems: GetFundItemsCallback
  ): Promise<void> {
    void changeDetails;
    try {
      console.log('Checking entry info for data changes:', {
        entryInfoId: entryInfo.id,
        status: entryInfo.status,
        dataType
      });

      if (!entryInfo.userId || !entryInfo.id) {
        console.warn('Entry info missing userId or id. Skipping diff calculation.');
        return;
      }

      const snapshots = await SnapshotService.list(entryInfo.userId, { entryInfoId: entryInfo.id });

      if (snapshots.length === 0) {
        console.log('No snapshots found for entry info, cannot compare data changes');
        return;
      }

      const latestSnapshot = snapshots[0] as Record<string, unknown>;
      const snapshotData = {
        passport: latestSnapshot.passport,
        personalInfo: latestSnapshot.personalInfo,
        funds: latestSnapshot.funds,
        travel: latestSnapshot.travel
      };

      const currentData = await getAllUserData(entryInfo.userId);
      const currentTravel = await getTravelInfo(entryInfo.userId, entryInfo.destinationId);
      const currentFunds = await getFundItems(entryInfo.userId);

      const completeCurrentData = {
        passport: currentData.passport,
        personalInfo: currentData.personalInfo,
        funds: currentFunds,
        travel: currentTravel
      };

      const diffResult = DataDiffCalculator.calculateDiff(snapshotData, completeCurrentData);

      if (diffResult?.hasChanges) {
        console.log('Data changes detected for entry info:', {
          entryInfoId: entryInfo.id,
          totalChanges: diffResult.summary?.totalChanges,
          significantChanges: diffResult.summary?.significantChanges
        });

        const changeSummary = DataDiffCalculator.generateChangeSummary(diffResult);
        this.triggerResubmissionWarningEvent(entryInfo, diffResult, changeSummary);
      } else {
        console.log('No significant data changes detected for entry info:', entryInfo.id);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to check entry info for data changes:', message);
    }
  }

  static triggerResubmissionWarningEvent(
    entryInfo: EntryInfoRecord,
    diffResult: Record<string, any>,
    changeSummary: Record<string, any>
  ): void {
    try {
      if (!entryInfo.id || !entryInfo.userId || !entryInfo.destinationId) {
        throw new Error('Entry info is missing required fields for warning event');
      }

      const event: ResubmissionWarningEvent = {
        type: 'RESUBMISSION_WARNING',
        entryInfoId: entryInfo.id,
        userId: entryInfo.userId,
        destinationId: entryInfo.destinationId,
        diffResult,
        changeSummary,
        requiresImmediateResubmission: Boolean(DataDiffCalculator.requiresImmediateResubmission(diffResult)),
        timestamp: new Date().toISOString()
      };

      console.log('Resubmission warning event triggered:', {
        entryInfoId: entryInfo.id,
        changesCount: diffResult.summary?.totalChanges,
        requiresImmediate: event.requiresImmediateResubmission
      });

      this.storeResubmissionWarningEvent(event);

      this.dataChangeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('Error in resubmission warning listener:', message);
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to trigger resubmission warning event:', message);
    }
  }

  static storeResubmissionWarningEvent(event: ResubmissionWarningEvent): void {
    try {
      this.resubmissionWarnings.set(event.entryInfoId, event);

      if (this.resubmissionWarnings.size > 10) {
        const entries = Array.from(this.resubmissionWarnings.entries());
        entries.sort((a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime());
        const oldestEntry = entries[0];
        if (oldestEntry) {
          this.resubmissionWarnings.delete(oldestEntry[0]);
        }
      }

      console.log('Resubmission warning stored:', {
        entryInfoId: event.entryInfoId,
        totalWarnings: this.resubmissionWarnings.size
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to store resubmission warning event:', message);
    }
  }

  static getPendingResubmissionWarnings(userId: string): ResubmissionWarningEvent[] {
    try {
      return Array.from(this.resubmissionWarnings.values())
        .filter(warning => warning.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to get pending resubmission warnings:', message);
      return [];
    }
  }

  static getResubmissionWarning(entryInfoId: string): ResubmissionWarningEvent | null {
    try {
      return this.resubmissionWarnings.get(entryInfoId) ?? null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to get resubmission warning:', message);
      return null;
    }
  }

  static clearResubmissionWarning(entryInfoId: string): void {
    try {
      this.resubmissionWarnings.delete(entryInfoId);
      console.log('Resubmission warning cleared:', entryInfoId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to clear resubmission warning:', message);
    }
  }

  static async markEntryInfoAsSuperseded(entryInfoId: string, changeDetails: DataChangeDetails = {}): Promise<any> {
    try {
      console.log('Marking entry info as superseded:', {
        entryInfoId,
        changeDetails
      });

      const entryInfo = await EntryInfo.load(entryInfoId);

      if (!entryInfo) {
        throw new Error(`Entry info not found: ${entryInfoId}`);
      }

      entryInfo.markAsSuperseded();
      await entryInfo.save();

      this.clearResubmissionWarning(entryInfoId);

      console.log('Entry info marked as superseded successfully:', {
        entryInfoId,
        newStatus: entryInfo.status
      });

      return entryInfo;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to mark entry info as superseded:', message);
      throw error;
    }
  }
}

export default DataEventService;
