<script lang="ts">
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BeanList from '$lib/components/BeanList.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import InlineBeanCreator from '$lib/components/InlineBeanCreator.svelte';
  import { Plus } from '$lib/icons';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import type { Bean } from '@shared/types';

  let showBeanCreator = false;
  let beanListComponent: BeanList;

  const breadcrumbLinkStyle = toStyleString({
    ...textStyles.helper,
    color: colorCss.text.ink.muted,
    '--breadcrumb-color': colorCss.text.ink.muted,
    '--breadcrumb-hover': colorCss.text.ink.secondary
  });

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
      <a href="/" class="breadcrumb-link" style={breadcrumbLinkStyle}>← Home</a>
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
</style>
