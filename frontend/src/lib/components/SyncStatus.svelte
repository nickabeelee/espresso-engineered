<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { syncService } from '$lib/sync-service';
  import { ConnectivityManager } from '$lib/offline-storage';
  import type { SyncStatus } from '$lib/sync-service';

  let isOnline = true;
  let syncInProgress = false;
  let pendingSyncCount = 0;
  let lastSyncTime: number | null = null;
  let syncStatus: string | null = null;
  let showDetails = false;

  let connectivityCleanup: (() => void) | null = null;
  let syncCleanup: (() => void) | null = null;

  onMount(() => {
    // Initialize state
    updateSyncInfo();
    
    // Set up connectivity monitoring
    isOnline = ConnectivityManager.isOnline();
    connectivityCleanup = ConnectivityManager.addListener(async (online) => {
      isOnline = online;
      if (online) {
        await updateSyncInfo();
      }
    });

    // Set up sync status monitoring
    syncCleanup = syncService.addSyncListener((status: SyncStatus) => {
      syncInProgress = syncService.isSyncInProgress();
      
      switch (status.type) {
        case 'started':
          syncStatus = `Syncing ${status.draftsCount} draft${status.draftsCount === 1 ? '' : 's'}...`;
          break;
        case 'completed':
          syncStatus = `Synced ${status.syncedCount} brew${status.syncedCount === 1 ? '' : 's'}`;
          updateSyncInfo();
          // Clear status after 3 seconds
          setTimeout(() => {
            syncStatus = null;
          }, 3000);
          break;
        case 'error':
          syncStatus = `Sync failed: ${status.error}`;
          // Clear error after 5 seconds
          setTimeout(() => {
            syncStatus = null;
          }, 5000);
          break;
      }
    });

    // Update sync info periodically
    const interval = setInterval(updateSyncInfo, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  });

  onDestroy(() => {
    connectivityCleanup?.();
    syncCleanup?.();
  });

  async function updateSyncInfo() {
    try {
      pendingSyncCount = await syncService.getPendingSyncCount();
      syncInProgress = syncService.isSyncInProgress();
      
      const storageInfo = await syncService.getStorageInfo();
      lastSyncTime = storageInfo.lastSync;
    } catch (error) {
      console.error('Failed to update sync info:', error);
    }
  }

  async function manualSync() {
    if (syncInProgress || !isOnline) return;
    
    try {
      await syncService.syncPendingDrafts();
    } catch (error) {
      console.error('Manual sync failed:', error);
      syncStatus = 'Manual sync failed';
      setTimeout(() => {
        syncStatus = null;
      }, 5000);
    }
  }

  function formatLastSync(timestamp: number | null): string {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  function getStatusColor(): string {
    if (!isOnline) return '#dc3545'; // Red for offline
    if (syncInProgress) return '#ffc107'; // Yellow for syncing
    if (pendingSyncCount > 0) return '#fd7e14'; // Orange for pending
    return '#28a745'; // Green for all synced
  }

  function getStatusText(): string {
    if (!isOnline) return 'Offline';
    if (syncInProgress) return 'Syncing...';
    if (pendingSyncCount > 0) return `${pendingSyncCount} pending`;
    return 'All synced';
  }
</script>

<div class="sync-status" class:expanded={showDetails}>
  <button 
    class="sync-indicator" 
    on:click={() => showDetails = !showDetails}
    style="--status-color: {getStatusColor()}"
    title="Click to view sync details"
  >
    <div class="status-dot" class:pulse={syncInProgress}></div>
    <span class="status-text">{getStatusText()}</span>
  </button>

  {#if showDetails}
    <div class="sync-details">
      <div class="detail-row">
        <span class="label">Connection:</span>
        <span class="value" class:offline={!isOnline}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      
      <div class="detail-row">
        <span class="label">Pending syncs:</span>
        <span class="value">{pendingSyncCount}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Last sync:</span>
        <span class="value">{formatLastSync(lastSyncTime)}</span>
      </div>

      {#if syncStatus}
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value status-message">{syncStatus}</span>
        </div>
      {/if}

      <div class="sync-actions">
        <button 
          class="sync-btn"
          on:click={manualSync}
          disabled={syncInProgress || !isOnline || pendingSyncCount === 0}
        >
          {syncInProgress ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .sync-status {
    position: relative;
    display: inline-block;
  }

  .sync-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 1rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .sync-indicator:hover {
    background: #f8f9fa;
    border-color: #dee2e6;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--status-color);
    transition: all 0.2s ease;
  }

  .status-dot.pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  .status-text {
    color: #333;
    font-weight: 500;
  }

  .sync-details {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 1rem;
    min-width: 200px;
    z-index: 1000;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .detail-row:last-child {
    margin-bottom: 0;
  }

  .label {
    font-size: 0.8rem;
    color: #666;
    font-weight: 500;
  }

  .value {
    font-size: 0.8rem;
    color: #333;
    font-weight: 600;
  }

  .value.offline {
    color: #dc3545;
  }

  .status-message {
    color: #007bff;
    font-style: italic;
  }

  .sync-actions {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e5e5;
  }

  .sync-btn {
    width: 100%;
    padding: 0.5rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .sync-btn:hover:not(:disabled) {
    background: #0056b3;
  }

  .sync-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .sync-details {
      right: auto;
      left: 0;
      min-width: 180px;
    }
  }
</style>