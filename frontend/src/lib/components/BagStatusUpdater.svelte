<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { enhancedApiClient } from '$lib/utils/enhanced-api-client';
  import { AppError } from '$lib/utils/error-handling';
  import { barista } from '$lib/auth';
  import { getBagPermissions } from '$lib/permissions';
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
  import type { Bag, InventoryStatus } from '../../../../shared/types';

  export let bag: Bag;
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    updated: Bag;
  }>();

  let updating = false;
  let error: AppError | null = null;

  $: permissions = getBagPermissions($barista, bag);
  $: canUpdate = permissions.canEdit && !disabled;

  const statusOptions = [
    { value: 'unopened', label: '📦 Unopened', variant: 'success' },
    { value: 'plenty', label: '✅ Plenty', variant: 'success' },
    { value: 'getting_low', label: '⚠️ Getting Low', variant: 'warning' },
    { value: 'empty', label: '❌ Empty', variant: 'error' }
  ] as const;

  async function updateStatus(newStatus: InventoryStatus) {
    if (updating || !canUpdate || newStatus === bag.inventory_status) return;

    if (!permissions.canEdit) {
      error = new AppError(
        'You don\'t have permission to update this bag\'s status.',
        { operation: 'update status for', entityType: 'bag', retryable: false }
      );
      return;
    }

    try {
      updating = true;
      error = null;

      const response = await enhancedApiClient.updateBag(bag.id, {
        inventory_status: newStatus
      });

      if (response.data) {
        dispatch('updated', response.data);
      } else {
        throw new Error('Failed to update bag status');
      }
    } catch (err) {
      error = err instanceof AppError ? err : new AppError(
        'Failed to update bag status',
        { operation: 'update status for', entityType: 'bag', retryable: false },
        err as Error
      );
      console.error('Failed to update bag status:', err);
    } finally {
      updating = false;
    }
  }

  function getCurrentStatusOption() {
    return statusOptions.find(option => option.value === bag.inventory_status);
  }

  function handleRetryUpdate() {
    if (bag.inventory_status) {
      updateStatus(bag.inventory_status);
    }
  }

  function handleDismissError() {
    error = null;
  }

  $: currentStatus = getCurrentStatusOption();
</script>

<div class="bag-status-updater">
  {#if error}
    <ErrorDisplay
      error={error}
      variant="inline"
      size="sm"
      context="bag status update"
      on:retry={handleRetryUpdate}
      on:dismiss={handleDismissError}
    />
  {/if}

  <div class="status-buttons">
    {#each statusOptions as option}
      <button
        type="button"
        class="status-btn status-btn--{option.variant}"
        class:active={bag.inventory_status === option.value}
        class:updating={updating}
        disabled={!canUpdate || updating}
        on:click={() => updateStatus(option.value)}
        title="Set status to {option.label}"
      >
        {option.label}
      </button>
    {/each}
  </div>

  {#if updating}
    <div class="updating-indicator">
      Updating...
    </div>
  {/if}
</div>

<style>
  .bag-status-updater {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .status-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .status-btn {
    padding: 0.4rem 0.75rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--motion-fast) ease;
    opacity: 0.7;
    background: var(--bg-surface-paper);
    color: var(--text-ink-secondary);
  }

  .status-btn--success {
    background: rgba(85, 98, 74, 0.18);
    color: var(--semantic-success);
    border-color: rgba(85, 98, 74, 0.35);
  }

  .status-btn--warning {
    background: rgba(138, 106, 62, 0.18);
    color: var(--semantic-warning);
    border-color: rgba(138, 106, 62, 0.35);
  }

  .status-btn--error {
    background: rgba(122, 62, 47, 0.18);
    color: var(--semantic-error);
    border-color: rgba(122, 62, 47, 0.35);
  }

  .status-btn:hover:not(:disabled) {
    opacity: 1;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .status-btn.active {
    opacity: 1;
    border-color: rgba(0, 0, 0, 0.2);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .status-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .status-btn.updating {
    animation: pulse 1.5s ease-in-out infinite;
  }

  .updating-indicator {
    font-size: 0.75rem;
    color: var(--text-ink-muted);
    text-align: center;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
  }

  @media (max-width: 768px) {
    .status-buttons {
      flex-direction: column;
    }

    .status-btn {
      text-align: center;
    }
  }
</style>