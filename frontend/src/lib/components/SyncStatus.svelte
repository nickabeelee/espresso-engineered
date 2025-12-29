<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { syncService } from '$lib/sync-service';
  import { ConnectivityManager } from '$lib/offline-storage';
  import { syncStatus } from '$lib/ui/components/status';
  import { toStyleString } from '$lib/ui/style';


  let isOnline = true;
  let syncInProgress = false;
  let pendingSyncCount = 0;
  let lastSyncTime: number | null = null;
  let syncStatus: string | null = null;
  let showDetails = false;

  let connectivityCleanup: (() => void) | null = null;
  let syncCleanup: (() => void) | null = null;

  const style = toStyleString({
    '--sync-indicator-bg': syncStatus.indicator.background,
    '--sync-indicator-border': syncStatus.indicator.borderColor,
    '--sync-indicator-radius': syncStatus.indicator.radius,
    '--sync-indicator-padding': syncStatus.indicator.padding,
    '--sync-detail-bg': syncStatus.detailCard.background,
    '--sync-detail-border': syncStatus.detailCard.borderColor,
    '--sync-detail-radius': syncStatus.detailCard.radius,
    '--sync-detail-padding': syncStatus.detailCard.padding,
    '--sync-detail-shadow': syncStatus.detailCard.shadow,
    '--sync-label-color': syncStatus.label.color,
    '--sync-value-color': syncStatus.value.color
  });

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
    if (!isOnline) return 'var(--semantic-error)'; // Red for offline
    if (syncInProgress) return 'var(--accent-primary)'; // syncing
    if (pendingSyncCount > 0) return 'var(--semantic-warning)'; // pending
    return 'var(--semantic-success)'; // all synced
  }

  function getStatusText(): string {
    if (!isOnline) return 'Offline';
    if (syncInProgress) return 'Syncing...';
    if (pendingSyncCount > 0) return `${pendingSyncCount} pending`;
    return 'All synced';
  }
</script>

<div class="sync-status" class:expanded={showDetails} style={style}>
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
    padding: var(--sync-indicator-padding, 0.5rem 0.75rem);
    background: var(--sync-indicator-bg, var(--bg-surface-paper-secondary));
    border: 1px solid var(--sync-indicator-border, var(--border-subtle));
    border-radius: var(--sync-indicator-radius, var(--radius-lg));
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .sync-indicator:hover {
    background: var(--bg-surface-paper-secondary);
    border-color: var(--border-strong);
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
    color: var(--text-ink-primary);
    font-weight: 500;
  }

  .sync-details {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: var(--sync-detail-bg, var(--bg-surface-paper-secondary));
    border: 1px solid var(--sync-detail-border, var(--border-subtle));
    border-radius: var(--sync-detail-radius, var(--radius-md));
    box-shadow: var(--sync-detail-shadow, 0 4px 12px rgba(43, 33, 24, 0.2));
    padding: var(--sync-detail-padding, 1rem);
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
    color: var(--sync-label-color, var(--text-ink-muted));
    font-weight: 500;
  }

  .value {
    font-size: 0.8rem;
    color: var(--sync-value-color, var(--text-ink-primary));
    font-weight: 600;
  }

  .value.offline {
    color: var(--semantic-error);
  }

  .status-message {
    color: var(--accent-primary);
    font-style: italic;
  }

  .sync-actions {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-subtle);
  }

  .sync-btn {
    width: 100%;
    padding: 0.5rem;
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    border: 1px solid var(--accent-primary);
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .sync-btn:hover:not(:disabled) {
    background: var(--accent-primary-dark);
  }

  .sync-btn:disabled {
    background: rgba(123, 94, 58, 0.6);
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
