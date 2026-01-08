<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { isAuthenticated, barista } from '$lib/auth';
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
  import BagCard from '$lib/components/BagCard.svelte';
  import BrewCard from '$lib/components/BrewCard.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import BeanAnalysisFilters from '$lib/components/BeanAnalysisFilters.svelte';
  import { apiClient } from '$lib/api-client';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import type { Bean, Bag, BagWithBarista, Brew } from '@shared/types';
  import type { RecencyPeriod } from '$lib/ui/viz/d3-integration';

  // Lazy load components for better performance
  let BeanInventorySection: any = null;
  let WeekInBrewingSection: any = null;
  let BeanAnalysisSection: any = null;

  // Redirect unauthenticated users to auth page
  $: if (browser && !$isAuthenticated && $barista === null) {
    goto('/auth');
  }

  // Component state
  let lastBrewDate: Date | null = null;
  let hasRecentActivity = false;
  let loading = true;
  let error: string | null = null;
  let inspectedBag: BagWithBarista | null = null;
  let inspectOpen = false;
  let createBagOpen = false;
  let activeBrewGroup: LayeredBrewGroup | null = null;
  
  // Analysis section state
  let selectedBean: Bean | null = null;
  let selectedBag: Bag | null = null;
  let includeCommunity = false;
  let recencyFilter: RecencyPeriod = 'M';
  let analysisFiltersOpen = false;
  let isMobile = false;
  let viewportQuery: MediaQueryList | null = null;
  let viewportListener: ((event: MediaQueryListEvent) => void) | null = null;

  // Progressive loading state
  let inventoryLoaded = false;
  let weekLoaded = false;
  let analysisLoaded = false;

  // Performance optimization: preload critical data
  let preloadPromise: Promise<void> | null = null;

  // Load user activity data when component mounts
  onMount(async () => {
    if (browser) {
      viewportQuery = window.matchMedia('(max-width: 768px)');
      const updateViewport = (event?: MediaQueryListEvent) => {
        isMobile = event?.matches ?? viewportQuery?.matches ?? false;
        if (!isMobile) {
          analysisFiltersOpen = false;
        }
      };
      updateViewport();
      viewportListener = updateViewport;
      if (viewportQuery.addEventListener) {
        viewportQuery.addEventListener('change', updateViewport);
      } else {
        viewportQuery.addListener(updateViewport);
      }
    }
    if ($barista) {
      await loadDashboardData();
    }
  });

  onDestroy(() => {
    if (viewportQuery && viewportListener) {
      if (viewportQuery.removeEventListener) {
        viewportQuery.removeEventListener('change', viewportListener);
      } else {
        viewportQuery.removeListener(viewportListener);
      }
    }
  });

  async function loadDashboardData() {
    try {
      loading = true;
      error = null;

      // Start preloading critical data immediately
      preloadPromise = preloadCriticalData();

      // Load user activity data for voice greeting
      try {
        const prefillResponse = await apiClient.getPrefillData();
        if (prefillResponse.data) {
          hasRecentActivity = true;
          // Try to get last brew date from recent brews
          const brewsResponse = await apiClient.getBrews({ 
            barista_id: $barista!.id,
            limit: 1 
          });
          if (brewsResponse.data.length > 0) {
            lastBrewDate = new Date(brewsResponse.data[0].created_at);
          }
        }
      } catch (error) {
        // If no prefill data, user likely hasn't brewed recently
        hasRecentActivity = false;
      }

      // Mark initial loading as complete
      loading = false;
      
      // Progressive loading with optimized timing
      inventoryLoaded = true;
      
      // Lazy load inventory component
      if (!BeanInventorySection) {
        BeanInventorySection = (await import('$lib/components/BeanInventorySection.svelte')).default;
      }
      
      // Use requestAnimationFrame for smoother transitions
      requestAnimationFrame(() => {
        setTimeout(async () => {
          weekLoaded = true;
          
          // Lazy load week component
          if (!WeekInBrewingSection) {
            WeekInBrewingSection = (await import('$lib/components/WeekInBrewingSection.svelte')).default;
          }
          
          // Preload analysis data while week section is loading
          requestAnimationFrame(() => {
            setTimeout(async () => {
              analysisLoaded = true;
              
              // Lazy load analysis component
              if (!BeanAnalysisSection) {
                BeanAnalysisSection = (await import('$lib/components/BeanAnalysisSection.svelte')).default;
              }
            }, 300);
          });
        }, 200);
      });

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load dashboard';
      loading = false;
    }
  }

  // Preload critical data for better performance
  async function preloadCriticalData() {
    if (!$barista) return;
    
    try {
      // Preload inventory data (most critical)
      const inventoryPromise = apiClient.getBagInventory();
      
      // Preload user's recent brews for analysis defaults
      const recentBrewsPromise = apiClient.getBrews({ 
        barista_id: $barista.id,
        limit: 5 
      });
      
      // Wait for critical data
      await Promise.all([inventoryPromise, recentBrewsPromise]);
    } catch (error) {
      // Preloading failures shouldn't block the UI
      console.warn('Preloading failed:', error);
    }
  }

  function handleBagUpdated(event: CustomEvent<BagWithBarista>) {
    const updatedBag = event.detail;
    inventorySectionRef?.applyBagUpdate(updatedBag, false);

    if (inspectedBag?.id === updatedBag.id) {
      const existingBean = (inspectedBag as any).bean;
      const updatedBean = (updatedBag as any).bean;
      const mergedBean = existingBean || updatedBean ? { ...(existingBean || {}), ...(updatedBean || {}) } : undefined;
      inspectedBag = {
        ...updatedBag,
        ...(mergedBean ? { bean: mergedBean } : {})
      };
    }
  }

  function handleBagInspect(event: CustomEvent<{ bag: BagWithBarista }>) {
    inspectedBag = event.detail.bag;
    inspectOpen = true;
  }

  function closeBagInspect() {
    inspectOpen = false;
  }

  function openCreateBag() {
    createBagOpen = true;
  }

  function closeCreateBag() {
    createBagOpen = false;
  }

  function handleBagCreated(event: CustomEvent<BagWithBarista>) {
    inventorySectionRef?.addBag(event.detail);
    createBagOpen = false;
  }

  function handleBagBrew(event: CustomEvent<{ bagId: string | null }>) {
    const bagId = event.detail.bagId;
    if (!bagId) return;
    goto(`/brews/new?bag=${bagId}`);
  }

  function openAnalysisFilters() {
    analysisFiltersOpen = true;
  }

  function closeAnalysisFilters() {
    analysisFiltersOpen = false;
  }

  async function retryLoad() {
    await loadDashboardData();
  }

  function handleBrewGroupOpen(event: CustomEvent<{ group: LayeredBrewGroup }>) {
    activeBrewGroup = event.detail.group;
  }

  function closeBrewGroupSheet() {
    activeBrewGroup = null;
  }

  const getBrewCountText = (count: number) => (count === 1 ? '1 brew' : `${count} brews`);

  const voiceLineStyle = toStyleString({
    ...textStyles.voice,
    color: colorCss.text.ink.muted,
    margin: 0
  });

  const pageTitleStyle = toStyleString({
    ...textStyles.headingPrimary,
    color: colorCss.text.ink.primary,
    margin: 0
  });

  const pageSubtitleStyle = toStyleString({
    ...textStyles.helper,
    color: colorCss.text.ink.muted,
    margin: 0
  });

  const heroTitleStyle = toStyleString({
    ...textStyles.headingPrimary,
    color: colorCss.text.ink.primary,
    margin: '0 0 0.75rem 0'
  });

  const heroTaglineStyle = toStyleString({
    ...textStyles.headingTertiary,
    color: colorCss.text.ink.secondary,
    margin: '0 0 1rem 0'
  });

  const heroDescriptionStyle = toStyleString({
    ...textStyles.body,
    color: colorCss.text.ink.primary,
    margin: '0 0 2rem 0'
  });

  const featureTitleStyle = toStyleString({
    ...textStyles.headingTertiary,
    color: colorCss.text.ink.primary,
    margin: '0 0 0.6rem 0'
  });

  const featureBodyStyle = toStyleString({
    ...textStyles.body,
    color: colorCss.text.ink.secondary,
    margin: 0
  });

  let inventorySectionRef: any = null;

  type BrewWithEquipment = Brew & {
    grinder?: {
      image_path?: string | null;
    };
    machine?: {
      image_path?: string | null;
    };
  };

  type LayeredBrewGroup = {
    barista: {
      id: string;
      display_name: string;
    };
    bean: {
      id: string;
      name: string;
      roast_level: string;
      image_path?: string | null;
      roaster: {
        id: string;
        name: string;
      };
    };
    brews: BrewWithEquipment[];
    stackDepth: number;
  };
</script>

<svelte:head>
  <title>Home - Espresso Engineered</title>
  <meta name="description" content="Your brewing dashboard" />
</svelte:head>

{#if $isAuthenticated && $barista}
  <div class="home-dashboard" id="home-top">
    <div class="page-header">
      <p class="voice-line" style={voiceLineStyle}>Settle in.</p>
      <h1 style={pageTitleStyle}>Home</h1>
      <p style={pageSubtitleStyle}>Your brewing dashboard.</p>
    </div>
    <!-- Voice Greeting Section -->
    {#if loading}
      <div class="loading-container">
        <div class="loading-circle" aria-hidden="true"></div>
        <p class="voice-text loading-message" style={voiceLineStyle}>Preparing your brewing dashboard...</p>
      </div>
    {:else if error}
      <ErrorDisplay 
        message={error}
        onRetry={retryLoad}
      />
    {:else}
      <!-- Bean Inventory Section -->
      {#if inventoryLoaded && BeanInventorySection}
        <div class="section-container inventory-section" id="shelf">
          <svelte:component 
            this={BeanInventorySection}
            bind:this={inventorySectionRef}
            on:bagUpdated={handleBagUpdated}
            on:inspect={handleBagInspect}
            on:brew={handleBagBrew}
            on:createBag={openCreateBag}
          />
        </div>
      {:else if inventoryLoaded}
        <div class="section-skeleton">
          <div class="skeleton-header"></div>
          <div class="skeleton-content"></div>
        </div>
      {:else}
        <div class="section-skeleton">
          <div class="skeleton-header"></div>
          <div class="skeleton-content"></div>
        </div>
      {/if}

      <!-- Week in Brewing Section -->
      {#if weekLoaded && WeekInBrewingSection}
        <div class="section-container week-section" id="week">
          <svelte:component this={WeekInBrewingSection} on:openGroup={handleBrewGroupOpen} />
        </div>
      {:else if weekLoaded}
        <div class="section-skeleton">
          <div class="skeleton-header"></div>
          <div class="skeleton-content"></div>
        </div>
      {:else if inventoryLoaded}
        <div class="section-skeleton">
          <div class="skeleton-header"></div>
          <div class="skeleton-content"></div>
        </div>
      {/if}

      <!-- Bean Analysis Section -->
      {#if analysisLoaded && BeanAnalysisSection}
        <div class="section-container analysis-section" id="analysis">
          <svelte:component 
            this={BeanAnalysisSection}
            bind:selectedBean
            bind:selectedBag
            bind:includeCommunity
            bind:recencyFilter
            showInlineFilters={!isMobile}
            on:openFilters={openAnalysisFilters}
          />
        </div>
      {:else if analysisLoaded}
        <div class="section-skeleton">
          <div class="skeleton-header"></div>
          <div class="skeleton-content analysis-skeleton"></div>
        </div>
      {:else if weekLoaded}
        <div class="section-skeleton">
          <div class="skeleton-header"></div>
          <div class="skeleton-content analysis-skeleton"></div>
        </div>
      {/if}

    {/if}
  </div>
  {#if inspectedBag}
    <Sheet
      open={inspectOpen}
      title="Your bag"
      subtitle={inspectedBag.name || inspectedBag.bean?.name || 'Bag details'}
      stickyHeader={true}
      edgeFade={true}
      on:close={closeBagInspect}
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
        on:updated={handleBagUpdated}
        on:brew={handleBagBrew}
      />
    </Sheet>
  {/if}
  {#if createBagOpen}
    <Sheet
      open={createBagOpen}
      title="New bag"
      subtitle="Add to your shelf"
      stickyHeader={true}
      edgeFade={true}
      on:close={closeCreateBag}
    >
      <BagCard
        variant="edit"
        surface="sheet"
        isNewBag={true}
        beanId={null}
        beanName=""
        roasterName={null}
        beanImagePath={null}
        beanRoastLevel={null}
        tastingNotes={null}
        on:created={handleBagCreated}
        on:cancel={closeCreateBag}
      />
    </Sheet>
  {/if}
  {#if activeBrewGroup}
    <Sheet
      open={Boolean(activeBrewGroup)}
      title={activeBrewGroup.bean.name}
      subtitle={`${activeBrewGroup.barista.display_name} · ${getBrewCountText(activeBrewGroup.brews.length)}`}
      closeLabel="Close brew stack"
      stickyHeader={true}
      edgeFade={true}
      on:close={closeBrewGroupSheet}
    >
      <div class="brew-stack-sheet-list">
        {#each activeBrewGroup.brews as brew (brew.id)}
          <BrewCard
            brew={brew}
            baristaName={activeBrewGroup.barista.display_name}
            beanName={activeBrewGroup.bean?.name ?? null}
            beanImagePath={activeBrewGroup.bean?.image_path ?? null}
            grinderImagePath={brew.grinder?.image_path ?? null}
            machineImagePath={brew.machine?.image_path ?? null}
            variant="detail"
          />
        {/each}
      </div>
    </Sheet>
  {/if}
  {#if analysisLoaded && isMobile}
    <Sheet
      open={analysisFiltersOpen}
      title="Filters"
      subtitle="Refine the analysis view"
      closeLabel="Close filters"
      panelBackground={colorCss.bg.surface.paper.primary}
      panelMinHeight="70vh"
      stickyHeader={true}
      edgeFade={false}
      on:close={closeAnalysisFilters}
    >
      <BeanAnalysisFilters
        variant="sheet"
        bind:selectedBean
        bind:selectedBag
        bind:includeCommunity
        bind:recencyFilter
      />
    </Sheet>
  {/if}
{:else}
  <!-- Landing page for unauthenticated users -->
  <div class="home-page">
    <div class="hero">
      <p class="voice-line" style={voiceLineStyle}>Take a moment.</p>
      <h1 style={heroTitleStyle}>Espresso Engineered</h1>
      <p class="tagline" style={heroTaglineStyle}>A quieter place to record the way you brew.</p>
      <p class="description" style={heroDescriptionStyle}>
        Capture espresso sessions with deliberate notes, revisit past ratios, and
        discover the patterns you return to most.
      </p>
      
      <div class="cta-buttons">
        <a href="/auth" class="btn-primary">Enter</a>
        <a href="/brews" class="btn-secondary">Browse Brews</a>
      </div>
    </div>

    <div class="features">
      <div class="feature card">
        <h3 style={featureTitleStyle}>Quiet logging</h3>
        <p style={featureBodyStyle}>Pre-fill from your last brew and focus only on what changed.</p>
      </div>
      
      <div class="feature card">
        <h3 style={featureTitleStyle}>Offline first</h3>
        <p style={featureBodyStyle}>Drafts hold steady when you're away and sync when you return.</p>
      </div>
      
      <div class="feature card">
        <h3 style={featureTitleStyle}>Shared patterns</h3>
        <p style={featureBodyStyle}>See how your equipment shapes results, without turning it into noise.</p>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Dashboard styles */
  .home-dashboard {
    display: flex;
    flex-direction: column;
    gap: 3rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0;
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }


  .page-header h1 {
    margin: 0;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 1rem;
  }

  .loading-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid rgba(214, 199, 174, 0.25);
    border-top-color: var(--accent-primary);
    animation: spin 0.9s linear infinite;
  }

  .loading-message {
    font-size: 0.95rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }


  .section-container {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.6s ease-out forwards;
    will-change: opacity, transform;
    contain: none;
  }

  .inventory-section {
    animation-delay: 0.1s;
  }

  .week-section {
    animation-delay: 0.2s;
  }

  .analysis-section {
    animation-delay: 0.3s;
  }

  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: none;
    }
  }

  /* Skeleton loading screens with optimized animations */
  .section-skeleton {
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    background: var(--bg-surface-paper);
    border: 1px solid var(--border-subtle);
    opacity: 0;
    animation: fadeIn 0.3s ease-out forwards;
    will-change: opacity;
    contain: layout style paint;
  }

  .skeleton-header {
    height: 1.5rem;
    width: 200px;
    background: linear-gradient(90deg, var(--border-subtle) 25%, var(--bg-surface-paper-secondary) 50%, var(--border-subtle) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: var(--radius-sm);
    margin-bottom: 1rem;
    will-change: background-position;
  }

  .skeleton-content {
    height: 120px;
    background: linear-gradient(90deg, var(--border-subtle) 25%, var(--bg-surface-paper-secondary) 50%, var(--border-subtle) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: var(--radius-md);
    will-change: background-position;
  }

  .analysis-skeleton {
    height: 300px;
  }

  .brew-stack-sheet-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
    padding-right: 0.25rem;
  }


  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }

  /* Performance optimizations */
  .home-dashboard {
    transform: translateZ(0); /* Force hardware acceleration */
  }

  :global(body.sheet-open) .home-dashboard {
    transform: none;
  }

  /* Reduce motion for users who prefer it */
  @media (prefers-reduced-motion: reduce) {
    .section-container,
    .section-skeleton {
      animation: none;
      opacity: 1;
      transform: none;
    }
    
    .skeleton-header,
    .skeleton-content {
      animation: none;
    }
  }

  /* Landing page styles (for unauthenticated users) */
  .home-page {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .hero {
    text-align: left;
    max-width: 680px;
  }

  .cta-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    .home-dashboard {
      gap: 2rem;
    }

    .section-skeleton {
      padding: 1rem;
      border-radius: var(--radius-md);
    }


    .cta-buttons {
      flex-direction: column;
      align-items: flex-start;
    }
  }

</style>
