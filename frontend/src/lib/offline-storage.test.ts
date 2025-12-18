import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineStorage, ConnectivityManager } from './offline-storage';
import type { BrewDraft } from '@shared/types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock browser environment
vi.stubGlobal('localStorage', localStorageMock);
vi.mock('$app/environment', () => ({
  browser: true
}));

describe('OfflineStorage', () => {
  const mockDraft: BrewDraft = {
    id: 'test-draft-1',
    barista_id: 'barista-1',
    machine_id: 'machine-1',
    grinder_id: 'grinder-1',
    bag_id: 'bag-1',
    dose_mg: 18000,
    grind_setting: '2.5',
    created_at: '2023-01-01T10:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.length = 0;
  });

  describe('saveDraft', () => {
    it('should save draft to localStorage with generated ID if none provided', async () => {
      const draftWithoutId = { ...mockDraft };
      delete draftWithoutId.id;

      const savedId = await OfflineStorage.saveDraft(draftWithoutId);

      expect(savedId).toMatch(/^draft_\d+_[a-z0-9]+$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `brew_draft_${savedId}`,
        expect.stringContaining(savedId)
      );
    });

    it('should save draft with existing ID', async () => {
      const draftId = await OfflineStorage.saveDraft(mockDraft);

      expect(draftId).toBe(mockDraft.id);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `brew_draft_${mockDraft.id}`,
        expect.stringContaining(mockDraft.id!)
      );
    });

    it('should add draft to sync queue', async () => {
      localStorageMock.getItem.mockReturnValue('[]'); // Empty sync queue

      await OfflineStorage.saveDraft(mockDraft);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'brew_sync_queue',
        JSON.stringify([mockDraft.id])
      );
    });
  });

  describe('getDraft', () => {
    it('should retrieve draft by ID', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockDraft));

      const result = await OfflineStorage.getDraft('test-draft-1');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('brew_draft_test-draft-1');
      expect(result).toEqual(mockDraft);
    });

    it('should return null if draft not found', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await OfflineStorage.getDraft('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null if JSON parsing fails', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = await OfflineStorage.getDraft('test-draft-1');

      expect(result).toBeNull();
    });
  });

  describe('getAllDrafts', () => {
    it('should return all drafts sorted by created_at', async () => {
      const draft1 = { ...mockDraft, id: 'draft-1', created_at: '2023-01-01T10:00:00Z' };
      const draft2 = { ...mockDraft, id: 'draft-2', created_at: '2023-01-02T10:00:00Z' };

      localStorageMock.length = 4;
      localStorageMock.key
        .mockReturnValueOnce('brew_draft_draft-1')
        .mockReturnValueOnce('brew_draft_draft-2')
        .mockReturnValueOnce('other_key')
        .mockReturnValueOnce('brew_sync_queue');

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(draft1))
        .mockReturnValueOnce(JSON.stringify(draft2));

      const result = await OfflineStorage.getAllDrafts();

      expect(result).toEqual([draft2, draft1]); // Most recent first
    });

    it('should return empty array if no drafts found', async () => {
      localStorageMock.length = 0;

      const result = await OfflineStorage.getAllDrafts();

      expect(result).toEqual([]);
    });
  });

  describe('deleteDraft', () => {
    it('should remove draft from localStorage and sync queue', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['test-draft-1', 'other-draft']));

      const result = await OfflineStorage.deleteDraft('test-draft-1');

      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('brew_draft_test-draft-1');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'brew_sync_queue',
        JSON.stringify(['other-draft'])
      );
    });
  });

  describe('getDraftsToSync', () => {
    it('should return drafts that are in sync queue', async () => {
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(['draft-1', 'draft-2'])) // sync queue
        .mockReturnValueOnce(JSON.stringify(mockDraft)) // draft-1
        .mockReturnValueOnce(null); // draft-2 not found

      const result = await OfflineStorage.getDraftsToSync();

      expect(result).toEqual([mockDraft]);
    });
  });

  describe('markDraftAsSynced', () => {
    it('should remove draft from sync queue and update timestamp', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['draft-1', 'draft-2']));
      const mockNow = 1640995200000; // 2022-01-01T00:00:00Z
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      await OfflineStorage.markDraftAsSynced('draft-1');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'brew_sync_queue',
        JSON.stringify(['draft-2'])
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'last_sync_timestamp',
        mockNow.toString()
      );
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage statistics', async () => {
      // Mock getAllDrafts to return 2 drafts
      localStorageMock.length = 2;
      localStorageMock.key
        .mockReturnValueOnce('brew_draft_draft-1')
        .mockReturnValueOnce('brew_draft_draft-2');
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(mockDraft))
        .mockReturnValueOnce(JSON.stringify(mockDraft))
        .mockReturnValueOnce(JSON.stringify(['draft-1'])) // sync queue
        .mockReturnValueOnce('1640995200000'); // last sync

      const result = await OfflineStorage.getStorageInfo();

      expect(result).toEqual({
        draftCount: 2,
        syncQueueLength: 1,
        lastSync: 1640995200000,
        conflictCount: 0,
        storageType: 'localstorage'
      });
    });
  });
});

describe('ConnectivityManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ConnectivityManager.removeAllListeners();
  });

  describe('isOnline', () => {
    it('should return navigator.onLine value in browser', () => {
      vi.stubGlobal('navigator', { onLine: true });

      expect(ConnectivityManager.isOnline()).toBe(true);

      vi.stubGlobal('navigator', { onLine: false });

      expect(ConnectivityManager.isOnline()).toBe(false);
    });
  });

  describe('checkConnectivity', () => {
    it('should return false if navigator.onLine is false', async () => {
      vi.stubGlobal('navigator', { onLine: false });

      const result = await ConnectivityManager.checkConnectivity();

      expect(result).toBe(false);
    });

    it('should perform network test when navigator.onLine is true', async () => {
      vi.stubGlobal('navigator', { onLine: true });
      
      // Mock fetch to succeed
      global.fetch = vi.fn().mockResolvedValue({
        ok: true
      });

      const result = await ConnectivityManager.checkConnectivity();

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/favicon.ico', expect.objectContaining({
        method: 'HEAD',
        cache: 'no-cache'
      }));
    });
  });

  describe('addListener', () => {
    it('should add event listeners and return cleanup function', () => {
      const mockAddEventListener = vi.fn();
      const mockRemoveEventListener = vi.fn();
      
      vi.stubGlobal('window', {
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener
      });

      vi.stubGlobal('document', {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });

      const callback = vi.fn();
      const cleanup = ConnectivityManager.addListener(callback);

      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

      // Test cleanup
      cleanup();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});