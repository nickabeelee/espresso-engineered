import { apiClient } from './api-client';
import { OfflineStorage, ConnectivityManager } from './offline-storage';
import { barista } from './auth';
import { get } from 'svelte/store';
import type { BrewDraft } from '@shared/types';

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private constructor() {
    // Set up connectivity listener for automatic sync
    ConnectivityManager.addListener(async (online) => {
      if (online && !this.syncInProgress) {
        const hasPending = await OfflineStorage.hasPendingSyncs();
        if (hasPending) {
          this.syncPendingDrafts();
        }
      }
    });

    // Start background sync monitoring
    ConnectivityManager.startBackgroundSync(async () => {
      if (!this.syncInProgress) {
        await this.syncPendingDrafts();
      }
    });
  }

  async syncPendingDrafts(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, error: 'Sync already in progress' };
    }

    const draftsToSync = await OfflineStorage.getDraftsToSync();
    if (draftsToSync.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    this.syncInProgress = true;
    this.notifyListeners({ type: 'started', draftsCount: draftsToSync.length });

    try {
      const currentBarista = get(barista);
      if (!currentBarista) {
        throw new Error('No authenticated user');
      }

      // Validate drafts belong to current user
      const validDrafts = draftsToSync.filter(draft => 
        draft.barista_id === currentBarista.id
      );

      if (validDrafts.length === 0) {
        throw new Error('No valid drafts to sync');
      }

      // Check connectivity before attempting sync
      const isOnline = await ConnectivityManager.checkConnectivity();
      if (!isOnline) {
        throw new Error('No network connectivity');
      }

      // Attempt batch sync first
      try {
        const response = await apiClient.batchSyncBrews(validDrafts);
        if (response.data && response.data.length > 0) {
          // Mark all successfully synced drafts
          for (const syncedBrew of response.data) {
            const originalDraft = validDrafts.find(d => 
              d.dose_g === syncedBrew.dose_g && 
              d.bag_id === syncedBrew.bag_id &&
              d.machine_id === syncedBrew.machine_id &&
              d.grinder_id === syncedBrew.grinder_id
            );
            
            if (originalDraft?.id) {
              await OfflineStorage.markDraftAsSynced(originalDraft.id);
            }
          }

          this.notifyListeners({ 
            type: 'completed', 
            syncedCount: response.data.length 
          });

          return { 
            success: true, 
            syncedCount: response.data.length,
            syncedBrews: response.data
          };
        }
      } catch (batchError) {
        console.warn('Batch sync failed, trying individual sync:', batchError);
        
        // Fall back to individual sync with conflict detection
        const syncResults = await this.syncDraftsIndividually(validDrafts);
        return syncResults;
      }

      throw new Error('Batch sync returned no data');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.notifyListeners({ type: 'error', error: errorMessage });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncDraftsIndividually(drafts: BrewDraft[]): Promise<SyncResult> {
    const syncedBrews = [];
    const errors = [];
    const conflicts = [];
    let syncedCount = 0;

    for (const draft of drafts) {
      try {
        const response = await apiClient.createBrew(draft);
        if (response.data) {
          syncedBrews.push(response.data);
          syncedCount++;
          
          if (draft.id) {
            await OfflineStorage.markDraftAsSynced(draft.id);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Check if this is a conflict error (e.g., duplicate, version mismatch)
        if (this.isConflictError(error)) {
          const conflictData = {
            localDraft: draft,
            conflictType: this.determineConflictType(error),
            timestamp: Date.now()
          } as const;
          
          if (draft.id) {
            OfflineStorage.saveConflict(draft.id, conflictData);
            conflicts.push(`Conflict detected for draft ${draft.id}`);
          }
        } else {
          errors.push(`Failed to sync draft ${draft.id}: ${errorMessage}`);
        }
      }
    }

    if (syncedCount > 0) {
      this.notifyListeners({ 
        type: 'completed', 
        syncedCount,
        errors: [...errors, ...conflicts].length > 0 ? [...errors, ...conflicts] : undefined
      });
    } else {
      this.notifyListeners({ 
        type: 'error', 
        error: `Failed to sync any drafts: ${[...errors, ...conflicts].join(', ')}` 
      });
    }

    return {
      success: syncedCount > 0,
      syncedCount,
      syncedBrews,
      error: [...errors, ...conflicts].length > 0 ? [...errors, ...conflicts].join(', ') : undefined
    };
  }

  private isConflictError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const message = error.message.toLowerCase();
    return message.includes('conflict') || 
           message.includes('duplicate') || 
           message.includes('version') ||
           message.includes('already exists');
  }

  private determineConflictType(error: unknown): 'version' | 'data' | 'ownership' {
    if (!(error instanceof Error)) return 'data';
    
    const message = error.message.toLowerCase();
    if (message.includes('version') || message.includes('modified')) {
      return 'version';
    } else if (message.includes('ownership') || message.includes('permission')) {
      return 'ownership';
    } else {
      return 'data';
    }
  }

  addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(status: SyncStatus) {
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  async getPendingSyncCount(): Promise<number> {
    const drafts = await OfflineStorage.getDraftsToSync();
    return drafts.length;
  }

  async getStorageInfo() {
    return await OfflineStorage.getStorageInfo();
  }

  async getConflicts() {
    return OfflineStorage.getAllConflicts();
  }

  async resolveConflict(draftId: string, resolution: 'local' | 'server' | 'merge'): Promise<boolean> {
    return OfflineStorage.resolveConflict(draftId, resolution);
  }

  async checkConnectivity(): Promise<boolean> {
    return ConnectivityManager.checkConnectivity();
  }
}

export interface SyncResult {
  success: boolean;
  syncedCount?: number;
  syncedBrews?: any[];
  error?: string;
}

export interface SyncStatus {
  type: 'started' | 'completed' | 'error';
  draftsCount?: number;
  syncedCount?: number;
  error?: string;
  errors?: string[];
}

// Export singleton instance
export const syncService = SyncService.getInstance();