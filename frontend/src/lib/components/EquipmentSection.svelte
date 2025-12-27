<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import IconButton from '$lib/components/IconButton.svelte';
  import EditableMachineCard from '$lib/components/EditableMachineCard.svelte';
  import EditableGrinderCard from '$lib/components/EditableGrinderCard.svelte';
  import { Plus } from '$lib/icons';
  import { getImageUrl } from '$lib/utils/image-utils';
  import { buildEquipmentUsageStats } from '$lib/utils/usage-stats';
  import type { Machine, Grinder, Barista } from '@shared/types';

  export let equipmentType: 'machine' | 'grinder';

  const config = {
    machine: {
      title: 'Machines',
      singular: 'Machine',
      description: 'The machines that shape your extraction.',
      voiceText: 'Each one has its own character.'
    },
    grinder: {
      title: 'Grinders',
      singular: 'Grinder', 
      description: 'The grinders that set the tone for every shot.',
      voiceText: 'Precision starts here.'
    }
  };

  let selectedConfig = config[equipmentType];

  let items: (Machine | Grinder)[] = [];
  let loading = true;
  let error = '';
  let usageById: Record<string, number> = {};
  let mostUsedBy: Record<string, Barista | undefined> = {};
  let showNewForm = false;

  onMount(() => {
    loadItems();
    loadUsageStats();
  });

  // React to equipmentType changes
  $: if (equipmentType) {
    selectedConfig = config[equipmentType];
    showNewForm = false; // Reset form state when switching types
    loadItems();
    loadUsageStats();
  }

  async function loadItems() {
    try {
      loading = true;
      error = '';
      const response = equipmentType === 'machine'
        ? await apiClient.getMachines()
        : await apiClient.getGrinders();
      items = response.data;
    } catch (err) {
      error = err instanceof Error ? err.message : `Failed to load ${selectedConfig.title.toLowerCase()}`;
    } finally {
      loading = false;
    }
  }

  async function loadUsageStats() {
    try {
      const [brewsResponse, baristasResponse] = await Promise.all([
        apiClient.getBrews(),
        apiClient.getBaristas()
      ]);

      const { usageCounts, topBaristaByEquipment } = buildEquipmentUsageStats(
        brewsResponse.data,
        baristasResponse.data
      );

      usageById = usageCounts;
      mostUsedBy = topBaristaByEquipment;
    } catch (err) {
      usageById = {};
      mostUsedBy = {};
    }
  }

  function handleNewEquipment() {
    showNewForm = true;
  }

  function handleEquipmentCreated(event: CustomEvent<Machine | Grinder>) {
    const newItem = event.detail;
    items = [newItem, ...items];
    showNewForm = false;
  }

  function handleEquipmentUpdated(event: CustomEvent<Machine | Grinder>) {
    const updatedItem = event.detail;
    items = items.map(item => item.id === updatedItem.id ? updatedItem : item);
  }

  function handleEquipmentDeleted(event: CustomEvent<string>) {
    const deletedId = event.detail;
    items = items.filter(item => item.id !== deletedId);
  }

  function handleNewFormCancel() {
    showNewForm = false;
  }
</script>

<div class="equipment-section">
  <div class="section-header">
    <div class="section-info">
      <p class="voice-text">{selectedConfig.voiceText}</p>
      <h2>{selectedConfig.title}</h2>
      <p class="description">{selectedConfig.description}</p>
    </div>
    
    <IconButton 
      on:click={handleNewEquipment}
      ariaLabel="Add new {selectedConfig.singular.toLowerCase()}"
      title="Add {selectedConfig.singular}"
      variant="accent"
    >
      <Plus />
    </IconButton>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="equipment-list">
    <!-- New equipment form -->
    {#if showNewForm}
      {#if equipmentType === 'machine'}
        <EditableMachineCard
          isNewMachine={true}
          on:created={handleEquipmentCreated}
          on:cancel={handleNewFormCancel}
        />
      {:else}
        <EditableGrinderCard
          isNewGrinder={true}
          on:created={handleEquipmentCreated}
          on:cancel={handleNewFormCancel}
        />
      {/if}
    {/if}

    {#if loading}
      <div class="loading-state">
        <p>Loading {selectedConfig.title.toLowerCase()}...</p>
      </div>
    {:else if items.length === 0}
      <div class="empty-state">
        <p class="voice-text">Nothing here yet.</p>
        <p class="empty-title">No {selectedConfig.title.toLowerCase()} yet.</p>
        <p class="empty-description">Add your first {selectedConfig.singular.toLowerCase()} to get started.</p>
      </div>
    {:else}
      <div class="equipment-grid-shell">
        <div class="equipment-grid">
          {#each items as item (item.id)}
            <div class="equipment-item">
              {#if equipmentType === 'machine'}
                <EditableMachineCard
                  machine={item}
                  usageCount={usageById[item.id] || 0}
                  mostUsedBy={mostUsedBy[item.id]}
                  on:updated={handleEquipmentUpdated}
                  on:deleted={handleEquipmentDeleted}
                />
              {:else}
                <EditableGrinderCard
                  grinder={item}
                  usageCount={usageById[item.id] || 0}
                  mostUsedBy={mostUsedBy[item.id]}
                  on:updated={handleEquipmentUpdated}
                  on:deleted={handleEquipmentDeleted}
                />
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .equipment-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .section-info {
    flex: 1;
  }

  .voice-text {
    font-family: "Libre Baskerville", serif;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
    line-height: 1.7;
    margin: 0 0 0.5rem 0;
    font-style: italic;
  }

  .section-info h2 {
    margin: 0 0 0.5rem 0;
    color: var(--text-ink-primary);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 1.5rem;
    font-weight: 500;
  }

  .description {
    margin: 0;
    color: var(--text-ink-secondary);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.9rem;
  }

  .error-message {
    background: rgba(122, 62, 47, 0.1);
    color: var(--semantic-error);
    border: 1px solid rgba(122, 62, 47, 0.3);
    border-radius: var(--radius-sm);
    padding: 0.75rem 1rem;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.9rem;
  }

  .equipment-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .equipment-grid-shell {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1.5rem;
  }

  .equipment-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .equipment-item {
    position: relative;
  }

  .loading-state,
  .empty-state {
    text-align: center;
    padding: 2rem;
  }

  .loading-state {
    color: var(--text-ink-muted);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
  }

  .empty-state .voice-text {
    font-family: "Libre Baskerville", serif;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
    line-height: 1.7;
    margin-bottom: 1rem;
    font-style: italic;
  }

  .empty-title {
    margin: 0.5rem 0;
    font-weight: 600;
    color: var(--text-ink-primary);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
  }

  .empty-description {
    margin: 0.5rem 0;
    color: var(--text-ink-muted);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
  }
</style>
