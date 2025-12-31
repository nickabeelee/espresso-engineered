<script lang="ts">
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BeanList from '$lib/components/BeanList.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import InlineBeanCreator from '$lib/components/InlineBeanCreator.svelte';
  import { Plus } from '$lib/icons';
  import type { Bean } from '@shared/types';

  let showBeanCreator = false;
  let beanListComponent: BeanList;

  function handleBeanCreated(event: CustomEvent<Bean>) {
    showBeanCreator = false;
    // Refresh the bean list
    if (beanListComponent) {
      beanListComponent.refreshBeans();
    }
  }

  function handleCancel() {
    showBeanCreator = false;
  }
</script>

<svelte:head>
  <title>Beans - Espresso Engineered</title>
  <meta name="description" content="Manage your coffee bean inventory and discover new beans from the community" />
</svelte:head>

<AuthGuard>
  <div class="beans-page">
    <nav class="breadcrumb">
      <a href="/" class="breadcrumb-link">← Home</a>
    </nav>
    <div class="section-header">
      <div>
        <p class="voice-line">Discover what drives great coffee.</p>
        <h1>Beans</h1>
        <p>Your collection and the community's discoveries.</p>
      </div>
      <IconButton 
        on:click={() => showBeanCreator = true} 
        ariaLabel="New bean" 
        variant="accent"
      >
        <Plus />
      </IconButton>
    </div>

    {#if showBeanCreator}
      <InlineBeanCreator 
        on:created={handleBeanCreated}
        on:cancel={handleCancel}
      />
    {/if}

    <div class="beans-content">
      <BeanList bind:this={beanListComponent} />
    </div>
  </div>
</AuthGuard>

<style>
  .beans-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .beans-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .breadcrumb {
    margin-bottom: 1rem;
  }

  .breadcrumb-link {
    color: var(--text-ink-muted);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s ease;
  }

  .breadcrumb-link:hover {
    color: var(--text-ink-secondary);
  }
</style>