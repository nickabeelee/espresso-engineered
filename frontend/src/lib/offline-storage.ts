import type { BrewDraft } from '@shared/types';
import { browser } from '$app/environment';

// Key prefixes for localStorage
const DRAFT_KEY_PREFIX = 'brew_draft_';
const SYNC_QUEUE_KEY = 'brew_sync_queue';
const LAST_SYNC_KEY = 'last_sync_timestamp';
const CONFLICT_KEY_PREFIX = 'brew_conflict_';

// IndexedDB configuration
const DB_NAME = 'BrewLoggingDB';
const DB_VERSION = 1;
const DRAFTS_STORE = 'drafts';
const SYNC_QUEUE_STORE = 'syncQueue';

interface ConflictData {
  localDraft: BrewDraft;
  serverBrew?: any;
  conflictType: 'version' | 'data' | 'ownership';
  timestamp: number;
}

// IndexedDB utilities
class IndexedDBManager {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  static async getDB(): Promise<IDBDatabase> {
    if (!browser || !window.indexedDB) {
      throw new Error('IndexedDB not available');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create drafts store
          if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
            const draftsStore = db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
            draftsStore.createIndex('barista_id', 'barista_id', { unique: false });
            draftsStore.createIndex('created_at', 'created_at', { unique: false });
          }
          
          // Create sync queue store
          if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
            db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
          }
        };
      });
    }

    return this.dbPromise;
  }

  static async saveDraft(draft: BrewDraft): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(draft);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getDraft(id: string): Promise<BrewDraft | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([DRAFTS_STORE], 'readonly');
      const store = transaction.objectStore(DRAFTS_STORE);
      
      return new Promise<BrewDraft | null>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage');
      return null;
    }
  }

  static async getAllDrafts(): Promise<BrewDraft[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([DRAFTS_STORE], 'readonly');
      const store = transaction.objectStore(DRAFTS_STORE);
      
      return new Promise<BrewDraft[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const drafts = request.result || [];
          // Sort by created_at or fallback to id for consistent ordering
          drafts.sort((a, b) => {
            const aTime = a.created_at || a.id || '';
            const bTime = b.created_at || b.id || '';
            return bTime.localeCompare(aTime); // Most recent first
          });
          resolve(drafts);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage');
      return [];
    }
  }

  static async deleteDraft(id: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Offline storage utilities for brew drafts
export class OfflineStorage {
  private static isAvailable(): boolean {
    return browser && typeof localStorage !== 'undefined';
  }

  private static async useIndexedDB(): Promise<boolean> {
    if (!browser || !window.indexedDB) return false;
    
    try {
      await IndexedDBManager.getDB();
      return true;
    } catch (error) {
      console.warn('IndexedDB initialization failed, using localStorage:', error);
      return false;
    }
  }

  // Save a draft brew to storage (IndexedDB preferred, localStorage fallback)
  static async saveDraft(draft: BrewDraft): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Storage not available');
    }

    const draftId = draft.id || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const draftWithId = { 
      ...draft, 
      id: draftId,
      created_at: draft.created_at || new Date().toISOString(),
      modified_at: new Date().toISOString()
    };
    
    try {
      // Try IndexedDB first
      if (await this.useIndexedDB()) {
        await IndexedDBManager.saveDraft(draftWithId);
      } else {
        // Fallback to localStorage
        localStorage.setItem(
          `${DRAFT_KEY_PREFIX}${draftId}`,
          JSON.stringify(draftWithId)
        );
      }
      
      // Add to sync queue if not already there
      await this.addToSyncQueue(draftId);
      
      return draftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw new Error('Failed to save draft to storage');
    }
  }

  // Get a specific draft by ID
  static async getDraft(draftId: string): Promise<BrewDraft | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Try IndexedDB first
      if (await this.useIndexedDB()) {
        return await IndexedDBManager.getDraft(draftId);
      } else {
        // Fallback to localStorage
        const draftData = localStorage.getItem(`${DRAFT_KEY_PREFIX}${draftId}`);
        return draftData ? JSON.parse(draftData) : null;
      }
    } catch (error) {
      console.error('Failed to get draft:', error);
      return null;
    }
  }

  // Get all draft brews
  static async getAllDrafts(): Promise<BrewDraft[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      // Try IndexedDB first
      if (await this.useIndexedDB()) {
        return await IndexedDBManager.getAllDrafts();
      } else {
        // Fallback to localStorage
        const drafts: BrewDraft[] = [];
        
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
      }
    } catch (error) {
      console.error('Failed to get all drafts:', error);
      return [];
    }
  }

  // Delete a draft
  static async deleteDraft(draftId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // Try IndexedDB first
      if (await this.useIndexedDB()) {
        await IndexedDBManager.deleteDraft(draftId);
      } else {
        // Fallback to localStorage
        localStorage.removeItem(`${DRAFT_KEY_PREFIX}${draftId}`);
      }
      
      await this.removeFromSyncQueue(draftId);
      return true;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      return false;
    }
  }

  // Clear all drafts (useful for testing or reset)
  static async clearAllDrafts(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      // Clear IndexedDB if available
      if (await this.useIndexedDB()) {
        const db = await IndexedDBManager.getDB();
        const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
        const store = transaction.objectStore(DRAFTS_STORE);
        
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      // Clear localStorage
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
  private static async getSyncQueue(): Promise<string[]> {
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

  private static async setSyncQueue(queue: string[]): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to set sync queue:', error);
    }
  }

  private static async addToSyncQueue(draftId: string): Promise<void> {
    const queue = await this.getSyncQueue();
    if (!queue.includes(draftId)) {
      queue.push(draftId);
      await this.setSyncQueue(queue);
    }
  }

  private static async removeFromSyncQueue(draftId: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filteredQueue = queue.filter(id => id !== draftId);
    await this.setSyncQueue(filteredQueue);
  }

  // Get drafts that need to be synced
  static async getDraftsToSync(): Promise<BrewDraft[]> {
    const queue = await this.getSyncQueue();
    const drafts: BrewDraft[] = [];
    
    for (const draftId of queue) {
      const draft = await this.getDraft(draftId);
      if (draft) {
        drafts.push(draft);
      }
    }
    
    return drafts;
  }

  // Mark draft as synced (remove from sync queue but keep in storage for reference)
  static async markDraftAsSynced(draftId: string): Promise<void> {
    await this.removeFromSyncQueue(draftId);
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

  // Legacy sync method for backward compatibility
  static async getStorageInfoLegacy(): Promise<{ draftCount: number; syncQueueLength: number; lastSync: number | null }> {
    const info = await this.getStorageInfo();
    return {
      draftCount: info.draftCount,
      syncQueueLength: info.syncQueueLength,
      lastSync: info.lastSync
    };
  }

  // Check if we have pending syncs
  static async hasPendingSyncs(): Promise<boolean> {
    const queue = await this.getSyncQueue();
    return queue.length > 0;
  }

  // Conflict resolution methods
  static saveConflict(draftId: string, conflictData: ConflictData): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      localStorage.setItem(
        `${CONFLICT_KEY_PREFIX}${draftId}`,
        JSON.stringify(conflictData)
      );
    } catch (error) {
      console.error('Failed to save conflict data:', error);
    }
  }

  static getConflict(draftId: string): ConflictData | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const conflictData = localStorage.getItem(`${CONFLICT_KEY_PREFIX}${draftId}`);
      return conflictData ? JSON.parse(conflictData) : null;
    } catch (error) {
      console.error('Failed to get conflict data:', error);
      return null;
    }
  }

  static getAllConflicts(): ConflictData[] {
    if (!this.isAvailable()) {
      return [];
    }

    const conflicts: ConflictData[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CONFLICT_KEY_PREFIX)) {
          const conflictData = localStorage.getItem(key);
          if (conflictData) {
            conflicts.push(JSON.parse(conflictData));
          }
        }
      }
      
      return conflicts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get all conflicts:', error);
      return [];
    }
  }

  static resolveConflict(draftId: string, resolution: 'local' | 'server' | 'merge'): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(`${CONFLICT_KEY_PREFIX}${draftId}`);
      return true;
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      return false;
    }
  }

  // Enhanced storage info with conflict data
  static async getStorageInfo(): Promise<{ 
    draftCount: number; 
    syncQueueLength: number; 
    lastSync: number | null;
    conflictCount: number;
    storageType: 'indexeddb' | 'localstorage';
  }> {
    const drafts = await this.getAllDrafts();
    const queue = await this.getSyncQueue();
    const conflicts = this.getAllConflicts();
    const storageType = await this.useIndexedDB() ? 'indexeddb' : 'localstorage';
    
    return {
      draftCount: drafts.length,
      syncQueueLength: queue.length,
      lastSync: this.getLastSyncTimestamp(),
      conflictCount: conflicts.length,
      storageType
    };
  }
}

// Connectivity detection utilities
export class ConnectivityManager {
  private static listeners: Array<(online: boolean) => void> = [];
  private static lastOnlineCheck = 0;
  private static onlineCheckInterval = 30000; // 30 seconds
  private static backgroundSyncInterval: number | null = null;

  static isOnline(): boolean {
    return browser ? navigator.onLine : true;
  }

  // Enhanced connectivity check with actual network test
  static async checkConnectivity(): Promise<boolean> {
    if (!browser) return true;
    
    // Use navigator.onLine as first check
    if (!navigator.onLine) {
      return false;
    }

    // Perform actual network test if enough time has passed
    const now = Date.now();
    if (now - this.lastOnlineCheck < this.onlineCheckInterval) {
      return navigator.onLine;
    }

    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      this.lastOnlineCheck = now;
      return response.ok;
    } catch (error) {
      console.warn('Network connectivity test failed:', error);
      this.lastOnlineCheck = now;
      return false;
    }
  }

  static addListener(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);
    
    if (browser) {
      const onlineHandler = async () => {
        const isActuallyOnline = await this.checkConnectivity();
        callback(isActuallyOnline);
      };
      
      const offlineHandler = () => callback(false);
      
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      // Also listen for visibility change to check connectivity when app becomes visible
      const visibilityHandler = async () => {
        if (document.visibilityState === 'visible') {
          const isOnline = await this.checkConnectivity();
          callback(isOnline);
        }
      };
      
      document.addEventListener('visibilitychange', visibilityHandler);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('online', onlineHandler);
        window.removeEventListener('offline', offlineHandler);
        document.removeEventListener('visibilitychange', visibilityHandler);
        this.listeners = this.listeners.filter(l => l !== callback);
      };
    }
    
    // Return no-op cleanup for non-browser environments
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Start background sync monitoring
  static startBackgroundSync(syncCallback: () => Promise<void>): () => void {
    if (!browser || this.backgroundSyncInterval !== null) {
      return () => {}; // Already running or not in browser
    }

    const performBackgroundSync = async () => {
      try {
        const isOnline = await this.checkConnectivity();
        const hasPendingSyncs = await OfflineStorage.hasPendingSyncs();
        
        if (isOnline && hasPendingSyncs) {
          await syncCallback();
        }
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    };

    // Check every 2 minutes when online
    this.backgroundSyncInterval = window.setInterval(performBackgroundSync, 120000);

    // Also sync when coming back online
    const connectivityCleanup = this.addListener(async (online) => {
      if (online) {
        await performBackgroundSync();
      }
    });

    // Return cleanup function
    return () => {
      if (this.backgroundSyncInterval !== null) {
        clearInterval(this.backgroundSyncInterval);
        this.backgroundSyncInterval = null;
      }
      connectivityCleanup();
    };
  }

  static removeAllListeners(): void {
    this.listeners = [];
    if (this.backgroundSyncInterval !== null) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
  }
}