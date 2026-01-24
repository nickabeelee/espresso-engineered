<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BeanList from '$lib/components/BeanList.svelte';
  import BagCard from '$lib/components/BagCard.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import InlineBagCreator from '$lib/components/InlineBagCreator.svelte';
  import InlineBeanCreator from '$lib/components/InlineBeanCreator.svelte';
  import InlineRoasterCreator from '$lib/components/InlineRoasterCreator.svelte';
  import EditableRoasterCard from '$lib/components/EditableRoasterCard.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { Plus, ArrowPath, MagnifyingGlass } from '$lib/icons';
  import { apiClient } from '$lib/api-client';
  import { enhancedApiClient } from '$lib/utils/enhanced-api-client';
  import { barista } from '$lib/auth';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import type { BagWithBarista, Barista as BaristaType, Bean, Roaster } from '@shared/types';

  type BagWithDetails = BagWithBarista & {
    bean?: {
      id: string;
      name: string;
      image_path?: string | null;
      roast_level?: string | null;
      tasting_notes?: string | null;
      roaster?: {
        id: string;
        name: string;
        website_url?: string | null;
      } | null;
    };
  };

  let showBeanCreator = false;
  let showBagCreator = false;
  let showRoasterCreator = false;
  let beanListComponent: BeanList;
  let handledCreateParam = false;
  let bags: BagWithDetails[] = [];
  let bagError: string | null = null;
  let bagLoading = false;
  let includeCommunityBags = true;
  let bagSearch = '';
  let inspectedBag: BagWithDetails | null = null;
  let bagSheetOpen = false;
  let roasters: Roaster[] = [];
  let roasterError: string | null = null;
  let roasterLoading = false;
  let roasterSearch = '';
  let baristasById: Record<string, BaristaType> = {};

  const breadcrumbLinkStyle = toStyleString({
    ...textStyles.helper,
    color: colorCss.text.ink.muted,
    '--breadcrumb-color': colorCss.text.ink.muted,
    '--breadcrumb-hover': colorCss.text.ink.secondary
  });

  const sectionTitleStyle = toStyleString({
    ...textStyles.headingSecondary,
    color: colorCss.text.ink.primary
  });

  onMount(() => {
    loadBags();
    loadRoasters();
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

  async function loadBags() {
    try {
      bagLoading = true;
      bagError = null;

      const response = await apiClient.getBags({ include_community: includeCommunityBags });
      bags = response.data as BagWithDetails[];

      const nextBaristasById: Record<string, BaristaType> = {};
      if ($barista) {
        nextBaristasById[$barista.id] = $barista;
      }

      if (includeCommunityBags) {
        const baristaResponse = await apiClient.getBaristas();
        baristaResponse.data.forEach((entry) => {
          nextBaristasById[entry.id] = entry;
        });
      }

      baristasById = nextBaristasById;
    } catch (err) {
      bagError = err instanceof Error ? err.message : 'Failed to load bags';
      console.error('Failed to load bags:', err);
    } finally {
      bagLoading = false;
    }
  }

  async function loadRoasters() {
    try {
      roasterLoading = true;
      roasterError = null;
      const response = await enhancedApiClient.getRoasters();
      roasters = response.data;
    } catch (err) {
      roasterError = err instanceof Error ? err.message : 'Failed to load roasters';
      console.error('Failed to load roasters:', err);
    } finally {
      roasterLoading = false;
    }
  }

  function handleBagCreated(event: CustomEvent<BagWithDetails>) {
    showBagCreator = false;
    bags = [event.detail, ...bags];
  }

  function handleBagUpdated(event: CustomEvent<BagWithDetails>) {
    const updated = event.detail;
    const index = bags.findIndex((bag) => bag.id === updated.id);
    if (index >= 0) {
      bags[index] = { ...bags[index], ...updated };
      bags = [...bags];
    }
    inspectedBag = updated;
  }

  function handleBagInspect(bag: BagWithDetails) {
    inspectedBag = bag;
    bagSheetOpen = true;
  }

  function closeBagSheet() {
    bagSheetOpen = false;
    inspectedBag = null;
  }

  function handleRoasterCreated(event: CustomEvent<Roaster>) {
    showRoasterCreator = false;
    roasters = [event.detail, ...roasters];
  }

  function handleRoasterUpdated(event: CustomEvent<Roaster>) {
    const updated = event.detail;
    const index = roasters.findIndex((roaster) => roaster.id === updated.id);
    if (index >= 0) {
      roasters[index] = updated;
      roasters = [...roasters];
    }
  }

  function handleRoasterDeleted(event: CustomEvent<string>) {
    roasters = roasters.filter((roaster) => roaster.id !== event.detail);
  }

  $: if (!handledCreateParam && $page.url.searchParams.get('create') === 'bean') {
    showBeanCreator = true;
    handledCreateParam = true;
  }

  $: filteredBags = bags.filter((bag) => {
    if (!bagSearch.trim()) return true;
    const query = bagSearch.toLowerCase();
    const beanName = bag.bean?.name?.toLowerCase() ?? '';
    const bagName = bag.name?.toLowerCase() ?? '';
    const roasterName = bag.bean?.roaster?.name?.toLowerCase() ?? '';
    const ownerName = baristasById[bag.owner_id]?.display_name?.toLowerCase() ?? '';
    return (
      beanName.includes(query) ||
      bagName.includes(query) ||
      roasterName.includes(query) ||
      ownerName.includes(query)
    );
  });

  $: myBags = filteredBags.filter((bag) => bag.owner_id === $barista?.id);
  $: communityBags = includeCommunityBags
    ? filteredBags.filter((bag) => bag.owner_id !== $barista?.id)
    : [];

  $: filteredRoasters = roasters.filter((roaster) => {
    if (!roasterSearch.trim()) return true;
    const query = roasterSearch.toLowerCase();
    return (
      roaster.name.toLowerCase().includes(query) ||
      roaster.website_url?.toLowerCase().includes(query)
    );
  });
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
      <div class="header-actions">
        <button class="btn-secondary" on:click={() => showBagCreator = true}>New bag</button>
        <button class="btn-secondary" on:click={() => showRoasterCreator = true}>New roaster</button>
        <IconButton
          on:click={() => showBeanCreator = true}
          ariaLabel="New bean"
          variant="accent"
        >
          <Plus />
        </IconButton>
      </div>
    </div>

    {#if showBeanCreator}
      <InlineBeanCreator 
        on:created={handleBeanCreated}
        on:cancel={handleCancel}
      />
    {/if}

    <div class="beans-content">
      <section class="hub-section">
        <div class="section-title-row">
          <div>
            <h2 style={sectionTitleStyle}>Beans</h2>
            <p class="section-subtitle">Browse your stash and the wider community.</p>
          </div>
        </div>
        <BeanList bind:this={beanListComponent} />
      </section>

      <section class="hub-section">
        <div class="section-title-row">
          <div>
            <h2 style={sectionTitleStyle}>Bags</h2>
            <p class="section-subtitle">Manage your shelf and peek at community bags.</p>
          </div>
          <div class="section-actions">
            <button class="btn-secondary" on:click={() => showBagCreator = true}>Add bag</button>
            <IconButton
              on:click={loadBags}
              ariaLabel="Refresh bags"
              title="Refresh bags"
              variant="neutral"
              disabled={bagLoading}
            >
              <ArrowPath />
            </IconButton>
          </div>
        </div>

        {#if showBagCreator}
          <InlineBagCreator on:created={handleBagCreated} on:cancel={() => showBagCreator = false} />
        {/if}

        <div class="section-controls">
          <div class="search-field">
            <span class="search-icon" aria-hidden="true">
              <MagnifyingGlass size={18} />
            </span>
            <input
              type="text"
              bind:value={bagSearch}
              placeholder="Search bags, beans, roasters..."
              class="search-input"
            />
          </div>
          <label class="quick-toggle">
            <input
              type="checkbox"
              bind:checked={includeCommunityBags}
              on:change={loadBags}
            />
            <span class="toggle-track" aria-hidden="true"></span>
            <span class="toggle-label">Include community</span>
          </label>
        </div>

        {#if bagLoading}
          <LoadingIndicator variant="dots" size="sm" inline message="Loading bags..." />
        {:else if bagError}
          <ErrorDisplay
            error={bagError}
            variant="banner"
            showRetry={true}
            showDismiss={false}
            on:retry={loadBags}
          />
        {:else if filteredBags.length === 0}
          <EmptyState
            title="No bags yet"
            description="Add your first bag or toggle in community bags to explore."
            icon="add"
            actionLabel="Add bag"
            on:action={() => showBagCreator = true}
          />
        {:else}
          <div class="bag-groups">
            {#if myBags.length > 0}
              <div class="bag-group">
                <h3>Your bags</h3>
                <div class="bag-grid">
                  {#each myBags as bag (bag.id)}
                    <BagCard
                      variant="preview"
                      bag={bag}
                      beanName={bag.bean?.name || 'Unknown Bean'}
                      roasterName={bag.bean?.roaster?.name || null}
                      beanImagePath={bag.bean?.image_path || null}
                      beanRoastLevel={bag.bean?.roast_level || null}
                      tastingNotes={bag.bean?.tasting_notes || null}
                      baristasById={baristasById}
                      on:inspect={() => handleBagInspect(bag)}
                    />
                  {/each}
                </div>
              </div>
            {/if}
            {#if includeCommunityBags && communityBags.length > 0}
              <div class="bag-group">
                <h3>Community bags</h3>
                <div class="bag-grid">
                  {#each communityBags as bag (bag.id)}
                    <BagCard
                      variant="preview"
                      bag={bag}
                      beanName={bag.bean?.name || 'Unknown Bean'}
                      roasterName={bag.bean?.roaster?.name || null}
                      beanImagePath={bag.bean?.image_path || null}
                      beanRoastLevel={bag.bean?.roast_level || null}
                      tastingNotes={bag.bean?.tasting_notes || null}
                      baristasById={baristasById}
                      on:inspect={() => handleBagInspect(bag)}
                    />
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </section>

      <section class="hub-section">
        <div class="section-title-row">
          <div>
            <h2 style={sectionTitleStyle}>Roasters</h2>
            <p class="section-subtitle">Keep the roster current and editable.</p>
          </div>
          <div class="section-actions">
            <button class="btn-secondary" on:click={() => showRoasterCreator = true}>Add roaster</button>
            <IconButton
              on:click={loadRoasters}
              ariaLabel="Refresh roasters"
              title="Refresh roasters"
              variant="neutral"
              disabled={roasterLoading}
            >
              <ArrowPath />
            </IconButton>
          </div>
        </div>

        {#if showRoasterCreator}
          <InlineRoasterCreator
            on:created={handleRoasterCreated}
            on:cancel={() => showRoasterCreator = false}
          />
        {/if}

        <div class="section-controls">
          <div class="search-field">
            <span class="search-icon" aria-hidden="true">
              <MagnifyingGlass size={18} />
            </span>
            <input
              type="text"
              bind:value={roasterSearch}
              placeholder="Search roasters or websites..."
              class="search-input"
            />
          </div>
        </div>

        {#if roasterLoading}
          <LoadingIndicator variant="dots" size="sm" inline message="Loading roasters..." />
        {:else if roasterError}
          <ErrorDisplay
            error={roasterError}
            variant="banner"
            showRetry={true}
            showDismiss={false}
            on:retry={loadRoasters}
          />
        {:else if filteredRoasters.length === 0}
          <EmptyState
            title="No roasters yet"
            description="Create the first roaster to anchor your beans."
            icon="add"
            actionLabel="Add roaster"
            on:action={() => showRoasterCreator = true}
          />
        {:else}
          <div class="roaster-grid">
            {#each filteredRoasters as roaster (roaster.id)}
              <EditableRoasterCard
                {roaster}
                on:updated={handleRoasterUpdated}
                on:deleted={handleRoasterDeleted}
              />
            {/each}
          </div>
        {/if}
      </section>
    </div>
  </div>

  {#if inspectedBag}
    <Sheet
      open={bagSheetOpen}
      title="Bag details"
      subtitle={inspectedBag.name || inspectedBag.bean?.name || 'Bag'}
      stickyHeader={true}
      edgeFade={true}
      on:close={closeBagSheet}
    >
      <BagCard
        variant="inspect"
        surface="sheet"
        bag={inspectedBag}
        beanName={inspectedBag.bean?.name || 'Unknown Bean'}
        roasterName={inspectedBag.bean?.roaster?.name || null}
        beanImagePath={inspectedBag.bean?.image_path || null}
        beanRoastLevel={inspectedBag.bean?.roast_level || null}
        tastingNotes={inspectedBag.bean?.tasting_notes || null}
        baristasById={baristasById}
        on:updated={handleBagUpdated}
      />
    </Sheet>
  {/if}
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

  .hub-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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

  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .section-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .section-subtitle {
    color: var(--text-ink-muted);
    margin: 0.35rem 0 0;
  }

  .section-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .section-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 1rem;
  }

  .search-field {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 220px;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--text-ink-muted);
    display: inline-flex;
    align-items: center;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.6rem 0.75rem 0.6rem 2.3rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 1rem;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .bag-groups {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .bag-group h3 {
    margin: 0 0 0.75rem;
  }

  .bag-grid,
  .roaster-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .quick-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-ink-secondary);
    cursor: pointer;
    user-select: none;
  }

  .quick-toggle input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .toggle-track {
    width: 44px;
    height: 24px;
    border-radius: 999px;
    background: rgba(123, 94, 58, 0.2);
    border: 1px solid rgba(123, 94, 58, 0.35);
    position: relative;
    transition: background var(--motion-fast), border-color var(--motion-fast);
  }

  .toggle-track::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--bg-surface-paper);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transition: transform var(--motion-fast);
  }

  .quick-toggle input:checked + .toggle-track {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .quick-toggle input:checked + .toggle-track::after {
    transform: translateX(20px);
  }

  .quick-toggle input:focus-visible + .toggle-track {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .quick-toggle input:disabled + .toggle-track {
    opacity: 0.5;
  }

  .quick-toggle input:disabled ~ .toggle-label {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .section-header,
    .section-title-row {
      align-items: flex-start;
      flex-direction: column;
    }

    .section-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .bag-grid,
    .roaster-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
