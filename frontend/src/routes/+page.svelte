<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { isAuthenticated, barista } from '$lib/auth';
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
  import { apiClient } from '$lib/api-client';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import type { Bean, Bag, BagWithBarista } from '@shared/types';

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
  
  // Analysis section state
  let selectedBean: Bean | null = null;
  let selectedBag: Bag | null = null;

  // Progressive loading state
  let inventoryLoaded = false;
  let weekLoaded = false;
  let analysisLoaded = false;

  // Performance optimization: preload critical data
  let preloadPromise: Promise<void> | null = null;

  // Load user activity data when component mounts
  onMount(async () => {
    if ($barista) {
      await loadDashboardData();
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
    // Handle bag updates from inventory section
    // This could trigger updates in other sections if needed
    console.log('Bag updated:', event.detail);
  }

  function handleBeanChange(event: CustomEvent<{ bean: Bean | null }>) {
    selectedBean = event.detail.bean;
  }

  function handleBagChange(event: CustomEvent<{ bag: Bag | null }>) {
    selectedBag = event.detail.bag;
  }

  async function retryLoad() {
    await loadDashboardData();
  }

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
    <nav class="home-index" aria-label="Home sections">
      <a href="#shelf">Shelf</a>
      <span class="index-divider" aria-hidden="true">•</span>
      <a href="#week">Week</a>
      <span class="index-divider" aria-hidden="true">•</span>
      <a href="#analysis">Analyze</a>
    </nav>
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
            on:bagUpdated={handleBagUpdated}
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
          <svelte:component this={WeekInBrewingSection} />
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
            {selectedBean}
            {selectedBag}
            on:beanChange={handleBeanChange}
            on:bagChange={handleBagChange}
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

  .home-index {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-ink-muted);
  }

  .home-index a {
    color: inherit;
  }

  .home-index a:hover {
    color: var(--text-ink-secondary);
  }

  .index-divider {
    opacity: 0.6;
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
    contain: layout style paint;
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
      transform: translateY(0);
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
