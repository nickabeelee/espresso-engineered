<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { enhancedApiClient } from '$lib/utils/enhanced-api-client';
  import { barista } from '$lib/auth';
  import EditableBagCard from '$lib/components/EditableBagCard.svelte';
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { ChevronLeft, ChevronRight } from '$lib/icons';
  import { animations, animationUtils, gsap } from '$lib/ui/animations';
  import { recordListShell } from '$lib/ui/components/card';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import type { BagWithBarista, Barista as BaristaType } from '@shared/types';

  const dispatch = createEventDispatcher<{
    bagUpdated: BagWithBarista;
  }>();

  let bags: BagWithBarista[] = [];
  let baristasById: Record<string, BaristaType> = {};
  let loading = true;
  let error: string | null = null;
  let currentWeekStart: string | null = null;

  // Horizontal scrolling elements
  let scrollContainer: HTMLElement;
  let bagCards: HTMLElement[] = [];
  let canScrollLeft = false;
  let canScrollRight = false;

  // Animation cleanup functions
  let cleanupFunctions: (() => void)[] = [];

  const getBagCards = () => bagCards.filter((card): card is HTMLElement => Boolean(card));

  const sectionTitleStyle = toStyleString({
    ...textStyles.headingSecondary,
    color: colorCss.text.ink.primary,
    margin: 0
  });

  const voiceLineStyle = toStyleString({
    ...textStyles.voice,
    color: colorCss.text.ink.muted,
    margin: 0
  });

  const inventoryShellStyle = toStyleString({
    '--record-list-bg': recordListShell.background,
    '--record-list-border': recordListShell.borderColor,
    '--record-list-border-width': recordListShell.borderWidth,
    '--record-list-border-style': recordListShell.borderStyle,
    '--record-list-radius': recordListShell.borderRadius,
    '--record-list-padding': recordListShell.padding
  });

  onMount(async () => {
    await loadInventoryData();
    setupScrolling();
    setupAnimations();
  });

  onDestroy(() => {
    cleanupFunctions.forEach(cleanup => cleanup());
  });

  async function loadInventoryData() {
    if (!$barista) return;

    try {
      loading = true;
      error = null;

      const response = await enhancedApiClient.getBagInventory();
      
      // Transform bags to include barista information
      bags = response.data.map(bag => ({
        ...bag,
        barista: $barista!
      }));

      // Create baristas lookup for EditableBagCard
      baristasById = {
        [$barista.id]: $barista
      };

      currentWeekStart = response.current_week_start;

      // Animate in the new content after data loads
      setTimeout(() => {
        const cards = getBagCards();
        if (cards.length > 0) {
          animations.fadeInUp(cards, {
            duration: 0.3,
            ease: 'power2.out',
            stagger: 0.1
          });
        }
      }, 50);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load inventory';
      console.error('Failed to load bag inventory:', err);
    } finally {
      loading = false;
    }
  }

  function setupScrolling() {
    if (!scrollContainer) return;

    const updateScrollButtons = () => {
      canScrollLeft = scrollContainer.scrollLeft > 0;
      canScrollRight = scrollContainer.scrollLeft < (scrollContainer.scrollWidth - scrollContainer.clientWidth);
    };

    scrollContainer.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();

    // Cleanup function
    cleanupFunctions.push(() => {
      scrollContainer?.removeEventListener('scroll', updateScrollButtons);
    });
  }

  function setupAnimations() {
    const cards = getBagCards();
    if (cards.length === 0) return;

    // Animate cards on load with staggered entrance
    const timeline = animations.horizontalScroll(cards, {
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.08
    });
    
    // Add hover effects to each card with enhanced lift
    cards.forEach(card => {
      const cleanup = animationUtils.createHoverLift(card);
      cleanupFunctions.push(cleanup);
    });

    // Add momentum scrolling effect
    if (scrollContainer) {
      const momentumCleanup = animationUtils.createMomentumScroll(scrollContainer, cards);
      cleanupFunctions.push(momentumCleanup);
    }
  }

  function scrollLeft() {
    if (!scrollContainer) return;
    
    const scrollAmount = scrollContainer.clientWidth * 0.8;
    
    // Add smooth GSAP animation for scroll
    gsap.to(scrollContainer, {
      scrollLeft: scrollContainer.scrollLeft - scrollAmount,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  function scrollRight() {
    if (!scrollContainer) return;
    
    const scrollAmount = scrollContainer.clientWidth * 0.8;
    
    // Add smooth GSAP animation for scroll
    gsap.to(scrollContainer, {
      scrollLeft: scrollContainer.scrollLeft + scrollAmount,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  function handleBagUpdated(event: CustomEvent<BagWithBarista>) {
    const updatedBag = event.detail;
    
    // Update the bag in our local array
    const index = bags.findIndex(bag => bag.id === updatedBag.id);
    if (index !== -1) {
      bags[index] = updatedBag;
      bags = [...bags]; // Trigger reactivity
    }

    dispatch('bagUpdated', updatedBag);
  }

  // Re-setup animations when bags change
  $: if (bags.length > 0 && bagCards.length > 0) {
    // Clean up previous animations
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];
    
    // Setup new animations
    setTimeout(() => setupAnimations(), 100);
  }

  // Update scroll buttons when bags change
  $: if (bags.length > 0 && scrollContainer) {
    setTimeout(() => setupScrolling(), 100);
  }
</script>

<div class="bean-inventory-section">
  <div class="section-header">
    <div class="section-header-text">
      <h2 style={sectionTitleStyle}>Your Bean Inventory</h2>
      <p class="voice-text" style={voiceLineStyle}>Keep the shelves honest.</p>
    </div>
    {#if bags.length > 0}
      <div class="scroll-controls">
        <IconButton
          on:click={scrollLeft}
          ariaLabel="Scroll left"
          title="Scroll left"
          variant="neutral"
          size="sm"
          disabled={!canScrollLeft}
        >
          <ChevronLeft />
        </IconButton>
        <IconButton
          on:click={scrollRight}
          ariaLabel="Scroll right"
          title="Scroll right"
          variant="neutral"
          size="sm"
          disabled={!canScrollRight}
        >
          <ChevronRight />
        </IconButton>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="loading-container">
      <LoadingIndicator />
      <p class="voice-text" style={voiceLineStyle}>Loading your coffee collection...</p>
    </div>
  {:else if error}
    <ErrorDisplay 
      message={error}
      onRetry={loadInventoryData}
    />
  {:else if bags.length === 0}
    <div class="empty-state">
      <p class="voice-text" style={voiceLineStyle}>Your coffee collection is empty.</p>
      <p class="voice-text" style={voiceLineStyle}>Add some bags to get started with tracking your inventory.</p>
    </div>
  {:else}
    <div class="inventory-shell" style={inventoryShellStyle}>
      <div class="inventory-container">
        <div 
          class="bag-scroll-container" 
          bind:this={scrollContainer}
        >
          <div class="bag-list">
            {#each bags as bag, index (bag.id)}
              <div 
                class="bag-card-wrapper"
                bind:this={bagCards[index]}
              >
                <EditableBagCard
                  {bag}
                  beanName={bag.bean?.name || 'Unknown Bean'}
                  {baristasById}
                  on:updated={handleBagUpdated}
                />
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .bean-inventory-section {
    width: 100%;
    padding-top: 0.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1.5rem;
  }

  .section-header-text {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .scroll-controls {
    display: flex;
    gap: 0.5rem;
    transition: opacity var(--motion-fast);
  }

  .scroll-controls :global(.icon-button:disabled) {
    opacity: 0.4;
    transition: opacity var(--motion-fast);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 1rem;
  }


  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    border: 2px dashed var(--border-subtle);
    border-radius: var(--radius-md);
    background: var(--bg-surface-paper-secondary);
  }

  .empty-state .voice-text:first-child {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .inventory-shell {
    background: var(--record-list-bg, var(--bg-surface-paper-secondary));
    border: var(--record-list-border-width, 1px) var(--record-list-border-style, solid) var(--record-list-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-list-radius, var(--radius-md));
    padding: var(--record-list-padding, 1.5rem);
  }

  .inventory-container {
    position: relative;
  }

  .bag-scroll-container {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--border-subtle) transparent;
    padding-bottom: 0.5rem;
  }

  .bag-scroll-container::-webkit-scrollbar {
    height: 6px;
  }

  .bag-scroll-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .bag-scroll-container::-webkit-scrollbar-thumb {
    background: var(--border-subtle);
    border-radius: 3px;
  }

  .bag-scroll-container::-webkit-scrollbar-thumb:hover {
    background: var(--text-ink-muted);
  }

  .bag-list {
    display: flex;
    gap: 1.5rem;
    padding: 0.5rem 0;
    min-width: min-content;
  }

  .bag-card-wrapper {
    flex: 0 0 auto;
    width: 320px;
    min-width: 320px;
    transition: transform var(--motion-fast), opacity var(--motion-fast);
  }

  .bag-card-wrapper:hover {
    transform: translateY(-2px);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .scroll-controls {
      align-self: flex-end;
    }

    .bag-card-wrapper {
      width: 280px;
      min-width: 280px;
    }

    .bag-list {
      gap: 1rem;
    }
  }

  @media (max-width: 480px) {
    .bag-card-wrapper {
      width: 260px;
      min-width: 260px;
    }
  }
</style>
