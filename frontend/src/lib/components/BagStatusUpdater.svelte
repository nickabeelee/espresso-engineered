<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import type { Bag, InventoryStatus } from '../../../../shared/types';

  export let bag: Bag;
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    updated: Bag;
  }>();

  let updating = false;
  let error: string | null = null;

  const statusOptions = [
    { value: 'unopened', label: '📦 Unopened', color: 'bg-blue-100 text-blue-800' },
    { value: 'plenty', label: '✅ Plenty', color: 'bg-green-100 text-green-800' },
    { value: 'getting_low', label: '⚠️ Getting Low', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'empty', label: '❌ Empty', color: 'bg-red-100 text-red-800' }
  ];

  async function updateStatus(newStatus: InventoryStatus) {
    if (updating || disabled || newStatus === bag.inventory_status) return;

    try {
      updating = true;
      error = null;

      const response = await apiClient.updateBag(bag.id, {
        inventory_status: newStatus
      });

      if (response.data) {
        dispatch('updated', response.data);
      } else {
        throw new Error('Failed to update bag status');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update status';
      console.error('Failed to update bag status:', err);
    } finally {
      updating = false;
    }
  }

  function getCurrentStatusOption() {
    return statusOptions.find(option => option.value === bag.inventory_status);
  }

  $: currentStatus = getCurrentStatusOption();
</script>

<div class="bag-status-updater">
  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="status-buttons">
    {#each statusOptions as option}
      <button
        type="button"
        class="status-btn {option.color}"
        class:active={bag.inventory_status === option.value}
        class:updating={updating}
        disabled={disabled || updating}
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

  .error-message {
    background: rgba(122, 62, 47, 0.12);
    border: 1px solid rgba(122, 62, 47, 0.25);
    color: var(--semantic-error);
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
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
    transition: all 0.2s ease;
    opacity: 0.7;
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