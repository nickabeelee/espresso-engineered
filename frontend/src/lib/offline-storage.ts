import type { BrewDraft } from '@shared/types';
import { browser } from '$app/environment';

// Key prefixes for localStorage
const DRAFT_KEY_PREFIX = 'brew_draft_';
const SYNC_QUEUE_KEY = 'brew_sync_queue';
const LAST_SYNC_KEY = 'last_sync_timestamp';

// Offline storage utilities for brew drafts
export class OfflineStorage {
  private static isAvailable(): boolean {
    return browser && typeof localStorage !== 'undefined';
  }

  // Save a draft brew to localStorage
  static saveDraft(draft: BrewDraft): string {
    if (!this.isAvailable()) {
      throw new Error('localStorage not available');
    }

    const draftId = draft.id || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const draftWithId = { ...draft, id: draftId };
    
    try {
      localStorage.setItem(
        `${DRAFT_KEY_PREFIX}${draftId}`,
        JSON.stringify(draftWithId)
      );
      
      // Add to sync queue if not already there
      this.addToSyncQueue(draftId);
      
      return draftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw new Error('Failed to save draft to local storage');
    }
  }

  // Get a specific draft by ID
  static getDraft(draftId: string): BrewDraft | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const draftData = localStorage.getItem(`${DRAFT_KEY_PREFIX}${draftId}`);
      return draftData ? JSON.parse(draftData) : null;
    } catch (error) {
      console.error('Failed to get draft:', error);
      return null;
    }
  }

  // Get all draft brews
  static getAllDrafts(): BrewDraft[] {
    if (!this.isAvailable()) {
      return [];
    }

    const drafts: BrewDraft[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
          const draftData = localStorage.getItem(key);
          if (draftData) {
            drafts.push(JSON.parse(draftData));
          }
        }
      }
      
      // Sort by created_at or fallback to id for consistent ordering
      return drafts.sort((a, b) => {
        const aTime = a.created_at || a.id || '';
        const bTime = b.created_at || b.id || '';
        return bTime.localeCompare(aTime); // Most recent first
      });
    } catch (error) {
      console.error('Failed to get all drafts:', error);
      return [];
    }
  }

  // Delete a draft
  static deleteDraft(draftId: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${draftId}`);
      this.removeFromSyncQueue(draftId);
      return true;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      return false;
    }
  }

  // Clear all drafts (useful for testing or reset)
  static clearAllDrafts(): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (error) {
      console.error('Failed to clear drafts:', error);
    }
  }

  // Sync queue management
  private static getSyncQueue(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const queueData = localStorage.getItem(SYNC_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  private static setSyncQueue(queue: string[]): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to set sync queue:', error);
    }
  }

  private static addToSyncQueue(draftId: string): void {
    const queue = this.getSyncQueue();
    if (!queue.includes(draftId)) {
      queue.push(draftId);
      this.setSyncQueue(queue);
    }
  }

  private static removeFromSyncQueue(draftId: string): void {
    const queue = this.getSyncQueue();
    const filteredQueue = queue.filter(id => id !== draftId);
    this.setSyncQueue(filteredQueue);
  }

  // Get drafts that need to be synced
  static getDraftsToSync(): BrewDraft[] {
    const queue = this.getSyncQueue();
    const drafts: BrewDraft[] = [];
    
    queue.forEach(draftId => {
      const draft = this.getDraft(draftId);
      if (draft) {
        drafts.push(draft);
      }
    });
    
    return drafts;
  }

  // Mark draft as synced (remove from sync queue but keep in storage for reference)
  static markDraftAsSynced(draftId: string): void {
    this.removeFromSyncQueue(draftId);
    this.setLastSyncTimestamp();
  }

  // Sync timestamp management
  static getLastSyncTimestamp(): number | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const timestamp = localStorage.getItem(LAST_SYNC_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return null;
    }
  }

  private static setLastSyncTimestamp(): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to set last sync timestamp:', error);
    }
  }

  // Utility methods
  static getStorageInfo(): { draftCount: number; syncQueueLength: number; lastSync: number | null } {
    return {
      draftCount: this.getAllDrafts().length,
      syncQueueLength: this.getSyncQueue().length,
      lastSync: this.getLastSyncTimestamp()
    };
  }

  // Check if we have pending syncs
  static hasPendingSyncs(): boolean {
    return this.getSyncQueue().length > 0;
  }
}

// Connectivity detection utilities
export class ConnectivityManager {
  private static listeners: Array<(online: boolean) => void> = [];

  static isOnline(): boolean {
    return browser ? navigator.onLine : true;
  }

  static addListener(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);
    
    if (browser) {
      const onlineHandler = () => callback(true);
      const offlineHandler = () => callback(false);
      
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('online', onlineHandler);
        window.removeEventListener('offline', offlineHandler);
        this.listeners = this.listeners.filter(l => l !== callback);
      };
    }
    
    // Return no-op cleanup for non-browser environments
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  static removeAllListeners(): void {
    this.listeners = [];
  }
}