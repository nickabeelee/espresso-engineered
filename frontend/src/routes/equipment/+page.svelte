<script lang="ts">
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import EquipmentSection from '$lib/components/EquipmentSection.svelte';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';

  let activeType: 'machine' | 'grinder' = 'machine';

  const breadcrumbLinkStyle = toStyleString({
    ...textStyles.helper,
    color: colorCss.text.ink.muted,
    '--breadcrumb-color': colorCss.text.ink.muted,
    '--breadcrumb-hover': colorCss.text.ink.secondary
  });
</script>

<svelte:head>
  <title>Equipment - Espresso Engineered</title>
  <meta name="description" content="Manage the machines and grinders in your espresso setup" />
</svelte:head>

<AuthGuard>
  <div class="equipment-page">
    <nav class="breadcrumb">
      <a href="/" class="breadcrumb-link" style={breadcrumbLinkStyle}>← Home</a>
    </nav>
    <div class="section-header">
      <div>
        <p class="voice-line">Keep what serves you close.</p>
        <h1>Equipment</h1>
        <p>Machines and grinders ready when you are.</p>
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
        <EquipmentSection equipmentType="machine" />
      {:else}
        <EquipmentSection equipmentType="grinder" />
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

  .breadcrumb {
    margin-bottom: 0.5rem;
  }

  .breadcrumb-link {
    text-decoration: none;
    color: var(--breadcrumb-color, var(--text-ink-muted));
    transition: color 0.2s ease;
  }

  .breadcrumb-link:hover {
    color: var(--breadcrumb-hover, var(--text-ink-secondary));
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
