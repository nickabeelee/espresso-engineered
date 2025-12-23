<script lang="ts">
  import { tick } from 'svelte';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import EquipmentSection from '$lib/components/EquipmentSection.svelte';
  import { Plus } from '$lib/icons';

  let activeType: 'machine' | 'grinder' = 'machine';
  let showMachineForm = true;
  let showGrinderForm = true;

  async function focusForm(type: 'machine' | 'grinder') {
    activeType = type;
    if (type === 'machine') {
      showMachineForm = true;
    } else {
      showGrinderForm = true;
    }

    await tick();
    const form = document.getElementById(`${type}-form`);
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<svelte:head>
  <title>Equipment - Espresso Engineered</title>
  <meta name="description" content="Manage the machines and grinders in your espresso setup" />
</svelte:head>

<AuthGuard>
  <div class="equipment-page">
    <div class="section-header">
      <div>
        <p class="voice-line">Keep what serves you close.</p>
        <h1>Equipment</h1>
        <p>Machines and grinders ready when you are.</p>
      </div>
      <div class="equipment-actions">
        <button class="btn-primary" type="button" on:click={() => focusForm('machine')}>
          <Plus />
          Machine
        </button>
        <button class="btn-primary" type="button" on:click={() => focusForm('grinder')}>
          <Plus />
          Grinder
        </button>
      </div>
    </div>

    <div class="equipment-tabs">
      <button
        type="button"
        class="tab-button"
        class:active={activeType === 'machine'}
        on:click={() => (activeType = 'machine')}
      >
        Machines
      </button>
      <button
        type="button"
        class="tab-button"
        class:active={activeType === 'grinder'}
        on:click={() => (activeType = 'grinder')}
      >
        Grinders
      </button>
    </div>

    <div class="equipment-sections">
      {#if activeType === 'machine'}
        <EquipmentSection equipmentType="machine" bind:showForm={showMachineForm} />
      {:else}
        <EquipmentSection equipmentType="grinder" bind:showForm={showGrinderForm} />
      {/if}
    </div>
  </div>
</AuthGuard>

<style>
  .equipment-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .equipment-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .equipment-tabs {
    display: inline-flex;
    gap: 0.5rem;
    padding: 0.35rem;
    background: rgba(123, 94, 58, 0.12);
    border-radius: 999px;
    border: 1px solid rgba(123, 94, 58, 0.3);
    align-self: flex-start;
  }

  .tab-button {
    border: none;
    background: transparent;
    color: var(--text-ink-secondary);
    padding: 0.45rem 1.1rem;
    border-radius: 999px;
    font-size: 0.95rem;
    cursor: pointer;
    font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
    transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
  }

  .tab-button:hover {
    background: rgba(123, 94, 58, 0.2);
  }

  .tab-button.active {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
  }

  .equipment-sections {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  @media (max-width: 768px) {
    .equipment-actions {
      width: 100%;
      justify-content: flex-start;
    }

    .equipment-tabs {
      width: 100%;
      justify-content: space-between;
    }

    .tab-button {
      flex: 1;
      text-align: center;
    }
  }
</style>
