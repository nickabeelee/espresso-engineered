<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  import { ChevronDown, ChevronLeft, ChevronRight } from '$lib/icons';
  import { animations, gsap } from '$lib/ui/animations';
  import { recordListShell } from '$lib/ui/components/card';
  import { toStyleString } from '$lib/ui/style';

  export let items: unknown[] = [];
  export let getKey: (item: unknown, index: number) => string | number = (
    item,
    index
  ) => (item as { id?: string | number })?.id ?? index;
  export let cardMinWidth = 320;
  export let showControls = true;
  export let edgeRail = true;
  export let shellStyle: string | null = null;
  export let expandable = false;
  export let expanded = false;
  export let expandLabel = 'Expand';
  export let collapseLabel = 'Collapse';
  export let isLoading = false;
  export let loadingMessage = 'Loading...';

  let scrollContainer: HTMLElement | null = null;
  let cardElements: HTMLElement[] = [];
  let canScrollLeft = false;
  let canScrollRight = false;
  let resizeObserver: ResizeObserver | null = null;
  let scrollCleanup: (() => void) | null = null;
  let lastSignature = '';
  let lastAnimatedSignature = '';
  let prefersReducedMotion = false;
  let reduceMotionQuery: MediaQueryList | null = null;
  let reduceMotionListener: ((event: MediaQueryListEvent) => void) | null = null;

  const defaultShellStyle = toStyleString({
    '--record-list-bg': recordListShell.background,
    '--record-list-border': recordListShell.borderColor,
    '--record-list-border-width': recordListShell.borderWidth,
    '--record-list-border-style': recordListShell.borderStyle,
    '--record-list-radius': recordListShell.borderRadius,
    '--record-list-padding': recordListShell.padding
  });

  const getCards = () =>
    cardElements.filter((card): card is HTMLElement => Boolean(card));

  const maxAnimatedCards = 6;

  function updateScrollButtons() {
    if (!scrollContainer) return;
    const cards = getCards();
    const lastCard = cards[cards.length - 1];
    const contentWidth = lastCard
      ? lastCard.offsetLeft + lastCard.offsetWidth
      : 0;

    canScrollLeft = scrollContainer.scrollLeft > 4;
    canScrollRight = contentWidth - scrollContainer.clientWidth > 4;
  }

  function initScrollTracking() {
    if (!scrollContainer || scrollCleanup) return;

    scrollContainer.addEventListener('scroll', updateScrollButtons, {
      passive: true
    });
    updateScrollButtons();
    requestAnimationFrame(updateScrollButtons);

    if (!resizeObserver && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        updateScrollButtons();
      });
      resizeObserver.observe(scrollContainer);
      const list = scrollContainer.querySelector('.rail-list');
      if (list) {
        resizeObserver.observe(list);
      }
    }

    scrollCleanup = () => {
      scrollContainer?.removeEventListener('scroll', updateScrollButtons);
    };
  }

  function animateCards(signature: string) {
    if (prefersReducedMotion || signature === lastAnimatedSignature) return;
    const cards = getCards().slice(0, maxAnimatedCards);
    if (cards.length === 0) return;

    gsap.killTweensOf(cards);
    animations.horizontalScroll(cards, {
      duration: 0.26,
      ease: 'power2.out',
      stagger: 0.08
    });
    lastAnimatedSignature = signature;
  }

  function scrollLeft() {
    if (!scrollContainer) return;
    const cards = getCards();
    if (cards.length === 0) return;

    const offsets = cards.map((card) => card.offsetLeft);
    const currentIndex = getActiveIndex(offsets, scrollContainer);
    const targetIndex = Math.max(currentIndex - 1, 0);
    scrollContainer.scrollTo({ left: offsets[targetIndex] ?? 0, behavior: 'smooth' });
  }

  function scrollRight() {
    if (!scrollContainer) return;
    const cards = getCards();
    if (cards.length === 0) return;

    const offsets = cards.map((card) => card.offsetLeft);
    const currentIndex = getActiveIndex(offsets, scrollContainer);
    const targetIndex = Math.min(currentIndex + 1, offsets.length - 1);
    scrollContainer.scrollTo({ left: offsets[targetIndex] ?? 0, behavior: 'smooth' });
  }

  function getActiveIndex(offsets: number[], container: HTMLElement) {
    const style = getComputedStyle(container);
    const scrollPaddingLeft = parseFloat(style.scrollPaddingLeft || '0');
    const paddingLeft = parseFloat(style.paddingLeft || '0');
    const snapLeft = container.scrollLeft + (scrollPaddingLeft || paddingLeft);

    return offsets.reduce((closest, offset, index) => {
      const currentDistance = Math.abs(offset - snapLeft);
      const closestDistance = Math.abs(offsets[closest] - snapLeft);
      return currentDistance < closestDistance ? index : closest;
    }, 0);
  }

  onMount(() => {
    if (typeof window === 'undefined') return;
    reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = (event?: MediaQueryListEvent) => {
      prefersReducedMotion = event?.matches ?? reduceMotionQuery?.matches ?? false;
    };
    updateReducedMotion();
    reduceMotionListener = updateReducedMotion;
    if (reduceMotionQuery.addEventListener) {
      reduceMotionQuery.addEventListener('change', updateReducedMotion);
    } else {
      reduceMotionQuery.addListener(updateReducedMotion);
    }
  });

  onDestroy(() => {
    scrollCleanup?.();
    scrollCleanup = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (reduceMotionQuery && reduceMotionListener) {
      if (reduceMotionQuery.removeEventListener) {
        reduceMotionQuery.removeEventListener('change', reduceMotionListener);
      } else {
        reduceMotionQuery.removeListener(reduceMotionListener);
      }
    }
  });

  $: if (items.length > 0) {
    const signature = items
      .map((item, index) => getKey(item, index))
      .join('|');
    if (signature !== lastSignature) {
      lastSignature = signature;
      void tick().then(() => {
        initScrollTracking();
        updateScrollButtons();
        if (!isLoading) {
          animateCards(signature);
        }
      });
    }
  }

  $: if (scrollContainer) {
    initScrollTracking();
    updateScrollButtons();
  }

  $: if (!isLoading && lastSignature) {
    void tick().then(() => {
      animateCards(lastSignature);
    });
  }
</script>

<div
  class="rail-shell"
  class:edge-rail={edgeRail}
  style={shellStyle ?? defaultShellStyle}
  aria-busy={isLoading}
>
  {#if showControls || expandable}
    <div class="rail-header">
      {#if expandable}
        <button
          type="button"
          class="expand-toggle"
          aria-expanded={expanded}
          on:click={() => (expanded = !expanded)}
        >
          <span class="expand-icon" aria-hidden="true">
            {#if expanded}
              <ChevronDown />
            {:else}
              <ChevronRight />
            {/if}
          </span>
          <span>{expanded ? collapseLabel : expandLabel}</span>
        </button>
      {/if}
      {#if showControls && items.length > 1}
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
  {/if}

  <div class="rail-scroll" bind:this={scrollContainer}>
    <div class="rail-list">
      {#if items.length === 0}
        <div class="rail-placeholder">
          {#if isLoading}
            <LoadingIndicator variant="dots" size="sm" inline message={loadingMessage} />
          {:else}
            <slot name="empty" />
          {/if}
        </div>
      {/if}
      {#each items as item, index (getKey(item, index))}
        <div
          class="rail-card"
          style={`--card-width: ${cardMinWidth}px;`}
          bind:this={cardElements[index]}
        >
          <slot {item} {index} />
        </div>
      {/each}
    </div>
  </div>

  {#if expandable && expanded}
    <div class="rail-expanded">
      <slot name="expanded" />
    </div>
  {/if}
</div>

<style>
  .rail-shell {
    background: var(--record-list-bg, var(--bg-surface-paper-secondary));
    border: var(--record-list-border-width, 1px)
      var(--record-list-border-style, solid)
      var(--record-list-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-list-radius, var(--radius-md));
    padding: var(--record-list-padding, 1.5rem);
  }

  .rail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .expand-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-ink-secondary);
    cursor: pointer;
    transition: background var(--motion-fast), border-color var(--motion-fast);
  }

  .expand-toggle:hover {
    background: var(--bg-surface-paper);
    border-color: var(--text-ink-muted);
  }

  .expand-icon {
    display: inline-flex;
    align-items: center;
  }

  .expand-icon :global(svg) {
    width: 18px;
    height: 18px;
  }

  .scroll-controls {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .scroll-controls :global(.icon-button:disabled) {
    opacity: 0.4;
    transition: opacity var(--motion-fast);
  }

  .rail-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--border-subtle) transparent;
    padding-bottom: 0.5rem;
    scroll-snap-type: x mandatory;
  }

  .rail-scroll::-webkit-scrollbar {
    height: 6px;
  }

  .rail-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .rail-scroll::-webkit-scrollbar-thumb {
    background: var(--border-subtle);
    border-radius: 3px;
  }

  .rail-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--text-ink-muted);
  }

  .rail-list {
    display: flex;
    gap: 1.5rem;
    padding: 0.5rem 0;
    min-width: min-content;
  }

  .rail-placeholder {
    flex: 1 1 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem 0;
  }

  .rail-card {
    flex: 0 0 auto;
    width: var(--card-width, 320px);
    min-width: var(--card-width, 320px);
    scroll-snap-align: start;
  }

  @media (max-width: 768px) {
    .rail-header {
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .expand-toggle {
      width: 100%;
      justify-content: center;
    }

    .scroll-controls {
      display: none;
    }

    .rail-shell {
      border-radius: 0;
      padding: 0.75rem 0;
    }

    .rail-shell.edge-rail {
      padding-left: 0;
      padding-right: 0;
    }

    .rail-scroll {
      padding-left: 1rem;
      padding-right: 1rem;
      scroll-padding-left: 1rem;
      scroll-padding-right: 1rem;
    }

    .rail-card {
      width: min(82vw, var(--card-width, 320px));
      min-width: min(82vw, var(--card-width, 320px));
    }

    .rail-list {
      gap: 1rem;
      padding-right: 1rem;
    }
  }

  @media (max-width: 480px) {
    .rail-card {
      width: min(86vw, var(--card-width, 320px));
      min-width: min(86vw, var(--card-width, 320px));
    }
  }

  .rail-expanded {
    margin-top: 1rem;
  }
</style>
