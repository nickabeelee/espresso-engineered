import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BrewDraft } from '@shared/types';

// Mock all dependencies before importing SyncService
vi.mock('./offline-storage', () => ({
  OfflineStorage: {
    getDraftsToSync: vi.fn(),
    markDraftAsSynced: vi.fn(),
    getStorageInfo: vi.fn(),
    hasPendingSyncs: vi.fn()
  },
  ConnectivityManager: {
    checkConnectivity: vi.fn().mockResolvedValue(true),
    addListener: vi.fn().mockReturnValue(() => {}),
    startBackgroundSync: vi.fn().mockReturnValue(() => {})
  }
}));

vi.mock('./api-client', () => ({
  apiClient: {
    batchSyncBrews: vi.fn(),
    createBrew: vi.fn()
  }
}));

vi.mock('./auth', () => ({
  barista: {
    subscribe: vi.fn()
  }
}));

vi.mock('svelte/store', () => ({
  get: vi.fn()
}));

// Now import the modules after mocking
import { SyncService } from './sync-service';
import { OfflineStorage, ConnectivityManager } from './offline-storage';
import { apiClient } from './api-client';
import { get } from 'svelte/store';

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock implementations
    vi.mocked(OfflineStorage.getDraftsToSync).mockResolvedValue([]);
    vi.mocked(OfflineStorage.markDraftAsSynced).mockResolvedValue();
    vi.mocked(OfflineStorage.getStorageInfo).mockResolvedValue({
      draftCount: 0,
      syncQueueLength: 0,
      lastSync: null,
      conflictCount: 0,
      storageType: 'localstorage'
    });
    vi.mocked(OfflineStorage.hasPendingSyncs).mockResolvedValue(false);
    vi.mocked(ConnectivityManager.checkConnectivity).mockResolvedValue(true);
    
    syncService = SyncService.getInstance();
  });

  describe('syncPendingDrafts', () => {
    it('should return success with 0 count when no drafts to sync', async () => {
      vi.mocked(OfflineStorage.getDraftsToSync).mockResolvedValue([]);

      const result = await syncService.syncPendingDrafts();

      expect(result).toEqual({
        success: true,
        syncedCount: 0
      });
    });

    it('should return error when no authenticated user', async () => {
      const mockDraft: BrewDraft = {
        id: 'draft-1',
        barista_id: 'test-barista',
        machine_id: 'test-machine',
        grinder_id: 'test-grinder',
        bag_id: 'test-bag',
        dose_g: 18.0
      };

      vi.mocked(OfflineStorage.getDraftsToSync).mockResolvedValue([mockDraft]);
      
      // Mock get function to return null (no authenticated user)
      vi.mocked(get).mockReturnValue(null);

      const result = await syncService.syncPendingDrafts();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No authenticated user');
    });

    it('should successfully sync drafts via batch sync', async () => {
      const mockDraft: BrewDraft = {
        id: 'draft-1',
        barista_id: 'test-barista',
        machine_id: 'test-machine',
        grinder_id: 'test-grinder',
        bag_id: 'test-bag',
        dose_g: 18.0
      };

      const mockSyncedBrew = {
        id: 'brew-1',
        ...mockDraft,
        created_at: '2023-01-01T00:00:00Z',
        modified_at: '2023-01-01T00:00:00Z'
      };

      vi.mocked(OfflineStorage.getDraftsToSync).mockResolvedValue([mockDraft]);
      
      // Mock get function to return authenticated user
      vi.mocked(get).mockReturnValue({
        id: 'test-barista',
        created_at: '2023-01-01T00:00:00Z',
        first_name: 'Test',
        last_name: 'User',
        display_name: 'Test User'
      });

      vi.mocked(apiClient.batchSyncBrews).mockResolvedValue({
        data: [mockSyncedBrew]
      });

      const result = await syncService.syncPendingDrafts();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(result.syncedBrews).toEqual([mockSyncedBrew]);
      expect(OfflineStorage.markDraftAsSynced).toHaveBeenCalledWith('draft-1');
    });

    it('should filter out drafts that do not belong to current user', async () => {
      const mockDrafts: BrewDraft[] = [
        {
          id: 'draft-1',
          barista_id: 'test-barista',
          machine_id: 'test-machine',
          grinder_id: 'test-grinder',
          bag_id: 'test-bag',
          dose_g: 18.0
        },
        {
          id: 'draft-2',
          barista_id: 'other-barista', // Different user
          machine_id: 'test-machine',
          grinder_id: 'test-grinder',
          bag_id: 'test-bag',
          dose_g: 18.0
        }
      ];

      vi.mocked(OfflineStorage.getDraftsToSync).mockResolvedValue(mockDrafts);
      
      // Mock get function to return authenticated user
      vi.mocked(get).mockReturnValue({
        id: 'test-barista',
        created_at: '2023-01-01T00:00:00Z',
        first_name: 'Test',
        last_name: 'User',
        display_name: 'Test User'
      });

      vi.mocked(apiClient.batchSyncBrews).mockResolvedValue({
        data: [{
          id: 'brew-1',
          ...mockDrafts[0],
          created_at: '2023-01-01T00:00:00Z',
          modified_at: '2023-01-01T00:00:00Z'
        }]
      });

      const result = await syncService.syncPendingDrafts();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      // Should only sync the draft belonging to the current user
      expect(apiClient.batchSyncBrews).toHaveBeenCalledWith([mockDrafts[0]]);
    });

    it('should fall back to individual sync when batch sync fails', async () => {
      const mockDraft: BrewDraft = {
        id: 'draft-1',
        barista_id: 'test-barista',
        machine_id: 'test-machine',
        grinder_id: 'test-grinder',
        bag_id: 'test-bag',
        dose_g: 18.0
      };

      const mockSyncedBrew = {
        id: 'brew-1',
        ...mockDraft,
        created_at: '2023-01-01T00:00:00Z',
        modified_at: '2023-01-01T00:00:00Z'
      };

      vi.mocked(OfflineStorage.getDraftsToSync).mockResolvedValue([mockDraft]);
      
      // Mock get function to return authenticated user
      vi.mocked(get).mockReturnValue({
        id: 'test-barista',
        created_at: '2023-01-01T00:00:00Z',
        first_name: 'Test',
        last_name: 'User',
        display_name: 'Test User'
      });

      // Batch sync fails
      vi.mocked(apiClient.batchSyncBrews).mockRejectedValue(new Error('Batch sync failed'));
      
      // Individual sync succeeds
      vi.mocked(apiClient.createBrew).mockResolvedValue({
        data: mockSyncedBrew
      });

      const result = await syncService.syncPendingDrafts();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(apiClient.createBrew).toHaveBeenCalledWith(mockDraft);
      expect(OfflineStorage.markDraftAsSynced).toHaveBeenCalledWith('draft-1');
    });
  });

  describe('utility methods', () => {
    it('should return pending sync count', async () => {
      vi.mocked(OfflineStorage.getDraftsToSync).mockResolvedValue([
        { barista_id: 'test', machine_id: 'test', grinder_id: 'test', bag_id: 'test', dose_g: 18.0 },
        { barista_id: 'test', machine_id: 'test', grinder_id: 'test', bag_id: 'test', dose_g: 18.0 }
      ]);

      const count = await syncService.getPendingSyncCount();
      expect(count).toBe(2);
    });

    it('should return storage info', async () => {
      const mockInfo = {
        draftCount: 3,
        syncQueueLength: 2,
        lastSync: 1234567890,
        conflictCount: 0,
        storageType: 'localstorage' as const
      };

      vi.mocked(OfflineStorage.getStorageInfo).mockResolvedValue(mockInfo);

      const info = await syncService.getStorageInfo();
      expect(info).toEqual(mockInfo);
    });

    it('should track sync in progress state', async () => {
      expect(syncService.isSyncInProgress()).toBe(false);

      // Mock a long-running sync
      vi.mocked(OfflineStorage.getDraftsToSync).mockResolvedValue([
        { barista_id: 'test', machine_id: 'test', grinder_id: 'test', bag_id: 'test', dose_g: 18.0 }
      ]);
      
      // Mock get function to return authenticated user
      vi.mocked(get).mockReturnValue({
        id: 'test',
        created_at: '2023-01-01T00:00:00Z',
        first_name: 'Test',
        last_name: 'User',
        display_name: 'Test User'
      });

      let resolveSync: (value: any) => void;
      const syncPromise = new Promise(resolve => {
        resolveSync = resolve;
      });

      vi.mocked(apiClient.batchSyncBrews).mockReturnValue(syncPromise as any);

      const syncResult = syncService.syncPendingDrafts();
      
      // Wait a tick to let the sync start
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should be in progress
      expect(syncService.isSyncInProgress()).toBe(true);

      // Resolve the sync
      resolveSync!({ data: [] });
      await syncResult;

      // Should no longer be in progress
      expect(syncService.isSyncInProgress()).toBe(false);
    });
  });
});