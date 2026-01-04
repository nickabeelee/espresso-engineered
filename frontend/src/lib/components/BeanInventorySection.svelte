<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { enhancedApiClient } from '$lib/utils/enhanced-api-client';
  import { barista } from '$lib/auth';
  import BagCard from '$lib/components/BagCard.svelte';
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
    inspect: { bag: BagWithBarista };
    brew: { bagId: string | null };
  }>();

  let bags: BagWithBarista[] = [];
  let baristasById: Record<string, BaristaType> = {};
  let loading = true;
  let error: string | null = null;
  // Horizontal scrolling elements
  let scrollContainer: HTMLElement | null = null;
  let bagCards: HTMLElement[] = [];
  let canScrollLeft = false;
  let canScrollRight = false;

  // Animation cleanup functions
  let scrollCleanup: (() => void) | null = null;
  let hoverCleanups: Array<() => void> = [];
  let lastBagSignature = '';
  let resizeObserver: ResizeObserver | null = null;

  const getBagCards = () => bagCards.filter((card): card is HTMLElement => Boolean(card));

  const sectionTitleStyle = toStyleString({
    ...textStyles.headingSecondary,
    color: colorCss.text.ink.primary,
    margin: '0 0 0.5rem 0'
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

  onMount(() => {
    loadInventoryData();
  });

  onDestroy(() => {
    clearAnimations();
    scrollCleanup?.();
    scrollCleanup = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
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

      // Create baristas lookup for BagCard
      baristasById = {
        [$barista.id]: $barista
      };

      await tick();
      initScrollTracking();
      initAnimations();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load the coffee shelf';
      console.error('Failed to load bag inventory:', err);
    } finally {
      loading = false;
    }
  }

  function updateScrollButtons() {
    if (!scrollContainer) return;
    const cards = getBagCards();
    const lastCard = cards[cards.length - 1];
    const contentWidth = lastCard ? lastCard.offsetLeft + lastCard.offsetWidth : 0;

    canScrollLeft = scrollContainer.scrollLeft > 4;
    canScrollRight = contentWidth - scrollContainer.clientWidth > 4;
  }

  function initScrollTracking() {
    if (!scrollContainer || scrollCleanup) return;

    scrollContainer.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons();
    requestAnimationFrame(updateScrollButtons);

    if (!resizeObserver && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        updateScrollButtons();
      });
      resizeObserver.observe(scrollContainer);
      const list = scrollContainer.querySelector('.bag-list');
      if (list) {
        resizeObserver.observe(list);
      }
    }

    scrollCleanup = () => {
      scrollContainer?.removeEventListener('scroll', updateScrollButtons);
    };
  }

  function clearAnimations() {
    hoverCleanups.forEach(cleanup => cleanup());
    hoverCleanups = [];
  }

  function initAnimations() {
    const cards = getBagCards();
    if (cards.length === 0) return;

    clearAnimations();

    animations.fadeInUp(cards, {
      duration: 0.18,
      ease: 'power1.out',
      stagger: 0.04
    });
    
    // Add hover effects to each card with enhanced lift
    cards.forEach(card => {
      const cleanup = animationUtils.createHoverLift(card);
      hoverCleanups.push(cleanup);
    });
  }

  function scrollLeft() {
    if (!scrollContainer) return;
    
    const cards = getBagCards();
    if (cards.length === 0) return;

    const current = scrollContainer.scrollLeft;
    const offsets = cards.map((card) => card.offsetLeft);
    const previousTarget = [...offsets].reverse().find((offset) => offset < current - 1) ?? 0;
    const previousSnap = scrollContainer.style.scrollSnapType || getComputedStyle(scrollContainer).scrollSnapType;
    scrollContainer.style.scrollSnapType = 'none';
    
    // Add smooth GSAP animation for scroll
    gsap.to(scrollContainer, {
      scrollLeft: previousTarget,
      duration: 0.24,
      ease: 'power2.out',
      overwrite: 'auto',
      onComplete: () => {
        scrollContainer?.style.setProperty('scroll-snap-type', previousSnap || 'x mandatory');
      }
    });
  }

  function scrollRight() {
    if (!scrollContainer) return;
    
    const cards = getBagCards();
    if (cards.length === 0) return;

    const current = scrollContainer.scrollLeft;
    const offsets = cards.map((card) => card.offsetLeft);
    const nextTarget = offsets.find((offset) => offset > current + 1) ?? offsets[offsets.length - 1];
    const previousSnap = scrollContainer.style.scrollSnapType || getComputedStyle(scrollContainer).scrollSnapType;
    scrollContainer.style.scrollSnapType = 'none';
    
    // Add smooth GSAP animation for scroll
    gsap.to(scrollContainer, {
      scrollLeft: nextTarget,
      duration: 0.24,
      ease: 'power2.out',
      overwrite: 'auto',
      onComplete: () => {
        scrollContainer?.style.setProperty('scroll-snap-type', previousSnap || 'x mandatory');
      }
    });
  }

  export function applyBagUpdate(updatedBag: BagWithBarista) {
    const index = bags.findIndex(bag => bag.id === updatedBag.id);
    if (index !== -1) {
      const existingBag = bags[index];
      const existingBean = (existingBag as any).bean;
      const updatedBean = (updatedBag as any).bean;
      const mergedBean = existingBean || updatedBean ? { ...(existingBean || {}), ...(updatedBean || {}) } : undefined;
      const mergedBag = {
        ...updatedBag,
        ...(mergedBean ? { bean: mergedBean } : {})
      };
      bags[index] = mergedBag;
      bags = [...bags]; // Trigger reactivity
    }

    dispatch('bagUpdated', updatedBag);
  }

  function handleBagUpdated(event: CustomEvent<BagWithBarista>) {
    applyBagUpdate(event.detail);
  }

  function requestInspect(bag: BagWithBarista) {
    dispatch('inspect', { bag });
  }

  function requestBrew(event: CustomEvent<{ bagId: string | null }>) {
    dispatch('brew', event.detail);
  }

  $: if (bags.length > 0) {
    const signature = bags.map((bag) => bag.id).join('|');
    if (signature !== lastBagSignature) {
      lastBagSignature = signature;
      void tick().then(() => {
        initScrollTracking();
        initAnimations();
        updateScrollButtons();
      });
    }
  }

  $: if (scrollContainer) {
    initScrollTracking();
    updateScrollButtons();
  }
</script>

<div class="bean-inventory-section">
  <div class="section-header">
    <div class="section-header-text">
      <h2 style={sectionTitleStyle}>Your Coffee Shelf</h2>
      <p class="voice-text" style={voiceLineStyle}>Keep the bar stocked and the labels honest.</p>
    </div>
    {#if !loading && !error && bags.length > 0}
      <div class="inventory-controls">
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
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="loading-container">
      <LoadingIndicator />
      <p class="voice-text" style={voiceLineStyle}>Setting out your bar shelf...</p>
    </div>
  {:else if error}
    <ErrorDisplay 
      message={error}
      onRetry={loadInventoryData}
    />
  {:else if bags.length === 0}
    <div class="empty-state">
      <p class="voice-text" style={voiceLineStyle}>Your shelf is quiet.</p>
      <p class="voice-text" style={voiceLineStyle}>Add a bag to start your bar shelf.</p>
    </div>
  {:else}
    <div class="inventory-shell" style={inventoryShellStyle}>
      <div class="inventory-container edge-rail">
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
                <BagCard
                  variant="preview"
                  {bag}
                  beanName={bag.bean?.name || 'Unknown Bean'}
                  roasterName={bag.bean?.roaster?.name || null}
                  beanImagePath={bag.bean?.image_path || null}
                  beanRoastLevel={bag.bean?.roast_level || null}
                  tastingNotes={bag.bean?.tasting_notes || null}
                  {baristasById}
                  on:inspect={() => requestInspect(bag)}
                  on:brew={requestBrew}
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
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1.5rem;
    flex-wrap: wrap;
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

  .inventory-controls {
    display: flex;
    justify-content: flex-end;
    align-self: flex-end;
    padding-top: 0.5rem;
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
    scroll-snap-type: x mandatory;
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
    scroll-snap-align: start;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .scroll-controls {
      display: none;
    }

    .bag-card-wrapper {
      width: min(82vw, 320px);
      min-width: min(82vw, 320px);
    }

    .bag-list {
      gap: 1rem;
    }

    .inventory-shell {
      background: transparent;
      border: none;
      padding: 0;
    }

  }

  @media (max-width: 480px) {
    .bag-card-wrapper {
      width: min(86vw, 280px);
      min-width: min(86vw, 280px);
    }

    .bag-card-wrapper.with-image {
      width: min(86vw, 280px);
      min-width: min(86vw, 280px);
    }
  }
</style>
