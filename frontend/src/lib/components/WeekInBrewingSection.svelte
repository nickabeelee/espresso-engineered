<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from "svelte";
  import BrewCard from "./BrewCard.svelte";
  import LoadingIndicator from "./LoadingIndicator.svelte";
  import ErrorDisplay from "./ErrorDisplay.svelte";
  import IconButton from "$lib/components/IconButton.svelte";
  import { ChevronLeft, ChevronRight, StarMini } from "$lib/icons";
  import { apiClient } from "$lib/api-client";
  import { animations, gsap } from "$lib/ui/animations";
  import { recordListShell } from "$lib/ui/components/card";
  import { colorCss } from "$lib/ui/foundations/color";
  import { textStyles } from "$lib/ui/foundations/typography";
  import { toStyleString } from "$lib/ui/style";
  import type { Brew } from "../../../shared/types";

  // Component props
  export let weekStart: Date | undefined = undefined;

  // Component state
  let loading = true;
  let error: string | null = null;
  let brewGroups: LayeredBrewGroup[] = [];
  let stackOrders: number[][] = [];
  const dispatch = createEventDispatcher<{
    openGroup: { group: LayeredBrewGroup };
  }>();

  // DOM references
  let scrollContainer: HTMLElement | null = null;
  let groupElements: HTMLElement[] = [];
  let prefersReducedMotion = false;
  let reduceMotionQuery: MediaQueryList | null = null;
  let reduceMotionListener: ((event: MediaQueryListEvent) => void) | null =
    null;
  let stackRenderedIds: Array<Set<string>> = [];

  // Scroll state
  let canScrollLeft = false;
  let canScrollRight = false;
  let scrollTrackingInitialized = false;

  // Swipe tracking
  const swipeStates = new Map<
    number,
    { x: number; y: number; scrollLeft: number }
  >();
  const stackAnimating = new Set<number>();

  const maxStackDepth = 3;

  const sectionTitleStyle = toStyleString({
    ...textStyles.headingSecondary,
    color: colorCss.text.ink.primary,
    margin: "0 0 0.5rem 0",
  });

  const voiceLineStyle = toStyleString({
    ...textStyles.voice,
    color: colorCss.text.ink.muted,
    margin: 0,
  });

  const groupTitleStyle = toStyleString({
    ...textStyles.headingTertiary,
    color: colorCss.text.ink.primary,
    margin: 0,
  });

  const groupMetaStyle = toStyleString({
    ...textStyles.helper,
    color: colorCss.text.ink.muted,
    margin: 0,
  });

  const stackShellStyle = toStyleString({
    "--record-list-bg": recordListShell.background,
    "--record-list-border": recordListShell.borderColor,
    "--record-list-border-width": recordListShell.borderWidth,
    "--record-list-border-style": recordListShell.borderStyle,
    "--record-list-radius": recordListShell.borderRadius,
    "--record-list-padding": recordListShell.padding,
  });

  const actionLinkStyle = toStyleString({
    ...textStyles.voice,
    color: colorCss.accent.primary,
  });

  // Types for the component
  interface BrewWithEquipment extends Brew {
    grinder?: {
      image_path?: string | null;
    };
    machine?: {
      image_path?: string | null;
    };
  }

  interface LayeredBrewGroup {
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
  }

  const getGroupKey = (group: LayeredBrewGroup) =>
    `${group.barista.id}-${group.bean.id}`;

  const getBrewCountText = (count: number) =>
    count === 1 ? "1 brew" : `${count} brews`;

  const getGroupAverageRating = (group: LayeredBrewGroup) => {
    const ratings = group.brews
      .map((brew) => brew.rating)
      .filter((rating): rating is number => typeof rating === "number");

    if (ratings.length === 0) return null;

    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    return total / ratings.length;
  };

  const getStackDepth = (group: LayeredBrewGroup) => {
    return Math.min(group.brews.length, maxStackDepth);
  };

  const getActiveIndex = (groupIndex: number, orders: number[][]) =>
    orders[groupIndex]?.[0] ?? 0;

  const getStackedBrews = (
    group: LayeredBrewGroup,
    groupIndex: number,
    orders: number[][],
  ) => {
    const totalBrews = group.brews.length;
    if (totalBrews === 0)
      return [] as Array<{ brew: Brew; index: number; offset: number }>;

    const depth = getStackDepth(group);
    const order =
      orders[groupIndex]?.length === totalBrews
        ? orders[groupIndex]
        : group.brews.map((_, index) => index);

    return Array.from({ length: depth }, (_, offset) => {
      const index = order[offset % order.length] ?? 0;
      return {
        brew: group.brews[index],
        index,
        offset,
      };
    });
  };

  const getNormalizedOrder = (groupIndex: number, group: LayeredBrewGroup) => {
    return stackOrders[groupIndex]?.length === group.brews.length
      ? stackOrders[groupIndex]
      : group.brews.map((_, index) => index);
  };

  const updateStackOrder = async (
    groupIndex: number,
    order: number[],
    options: { animateActive?: boolean } = {},
  ) => {
    stackOrders = stackOrders.map((current, index) =>
      index === groupIndex ? order : current,
    );
    await tick();

    const groupElement = groupElements[groupIndex];
    if (!groupElement) return;

    const stackCards = Array.from(groupElement.querySelectorAll(".stack-card"));
    if (stackCards.length > 0 && !prefersReducedMotion) {
      const group = brewGroups[groupIndex];
      if (group) {
        const stackedBrews = getStackedBrews(group, groupIndex, stackOrders);
        const nextIds = new Set(stackedBrews.map((item) => item.brew.id));
        const previousIds = stackRenderedIds[groupIndex];
        stackRenderedIds[groupIndex] = nextIds;

        if (previousIds) {
          const newIds = stackedBrews
            .filter((item) => !previousIds.has(item.brew.id))
            .map((item) => item.brew.id);

          const newCards = newIds
            .map((id) => groupElement.querySelector(`[data-brew-id="${id}"]`))
            .filter((element): element is HTMLElement => Boolean(element));

          if (newCards.length > 0) {
            gsap.set(newCards, { opacity: 0 });
          }
        }
      }

      gsap.to(stackCards, {
        x: 0,
        rotate: 0,
        y: (index) => index * 10,
        scale: (index) => 1 - index * 0.02,
        opacity: (index) => 1 - index * 0.12,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (options.animateActive === false) return;

    const activeCard = groupElement.querySelector(
      ".stack-card.is-active",
    ) as HTMLElement | null;
    if (activeCard) {
      gsap.fromTo(
        activeCard,
        { scale: 0.96, opacity: 0.88, y: 12, transformOrigin: "top center" },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.18,
          ease: "power2.out",
          transformOrigin: "top center",
          clearProps: "transform",
        },
      );
    }
  };

  const animateStackShuffle = async (
    groupIndex: number,
    order: number[],
    direction: -1 | 1,
  ) => {
    if (stackAnimating.has(groupIndex)) return;
    stackAnimating.add(groupIndex);

    try {
      const groupElement = groupElements[groupIndex];
      if (!groupElement || prefersReducedMotion) {
        await updateStackOrder(groupIndex, order);
        return;
      }

      const activeCard = groupElement.querySelector(
        ".stack-card.is-active",
      ) as HTMLElement | null;
      if (!activeCard) {
        await updateStackOrder(groupIndex, order);
        return;
      }

      gsap.killTweensOf(activeCard);

      const exitX = direction === 1 ? 38 : -38;
      const exitY = 18;
      const rotate = direction === 1 ? 2.5 : -2.5;

      await new Promise<void>((resolve) => {
        gsap.to(activeCard, {
          x: exitX,
          y: exitY,
          rotate,
          opacity: 0.35,
          scale: 0.98,
          duration: 0.2,
          ease: "power2.in",
          onComplete: resolve,
        });
      });

      await updateStackOrder(groupIndex, order);
    } finally {
      stackAnimating.delete(groupIndex);
    }
  };

  // Load week brewing data
  async function loadWeekBrews() {
    try {
      loading = true;
      error = null;

      const params: Record<string, string> = {};
      if (weekStart) {
        params.week_start = weekStart.toISOString();
      }

      const response = await apiClient.getWeekBrews(params);
      brewGroups = response.data || [];
      stackOrders = brewGroups.map((group) =>
        group.brews.map((_, index) => index),
      );
      stackRenderedIds = brewGroups.map((group, groupIndex) => {
        const stackedBrews = getStackedBrews(group, groupIndex, stackOrders);
        return new Set(stackedBrews.map((item) => item.brew.id));
      });
      await tick();

      const groupTargets = groupElements.filter(Boolean);
      if (groupTargets.length > 0) {
        animations.fadeInUp(groupTargets, {
          duration: 0.16,
          ease: "power1.out",
          stagger: 0.04,
        });
      }

      updateScrollButtons();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load week brews";
      console.error("Error loading week brews:", err);
    } finally {
      loading = false;
    }
  }

  function updateScrollButtons() {
    if (!scrollContainer) return;
    canScrollLeft = scrollContainer.scrollLeft > 4;
    canScrollRight =
      scrollContainer.scrollLeft + scrollContainer.clientWidth <
      scrollContainer.scrollWidth - 4;
  }

  function setupScrollTracking() {
    if (!scrollContainer) return;
    if (scrollTrackingInitialized) return;
    scrollContainer.addEventListener("scroll", updateScrollButtons, {
      passive: true,
    });
    updateScrollButtons();
    scrollTrackingInitialized = true;
  }

  function scrollByGroup(direction: -1 | 1) {
    if (!scrollContainer) return;

    const groupWidth = groupElements.find(Boolean)?.offsetWidth ?? 380;
    const gap = 24;
    const scrollAmount = groupWidth + gap;
    const target = scrollContainer.scrollLeft + direction * scrollAmount;
    const previousSnap = scrollContainer.style.scrollSnapType;

    scrollContainer.style.scrollSnapType = "none";

    gsap.to(scrollContainer, {
      scrollLeft: target,
      duration: 0.24,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        scrollContainer?.style.setProperty(
          "scroll-snap-type",
          previousSnap || "x mandatory",
        );
      },
    });
  }

  async function setActiveBrew(groupIndex: number, brewIndex: number) {
    const group = brewGroups[groupIndex];
    if (!group) return;

    const total = group.brews.length;
    if (total === 0) return;

    const nextIndex = ((brewIndex % total) + total) % total;
    const currentOrder = getNormalizedOrder(groupIndex, group);
    const position = currentOrder.indexOf(nextIndex);
    const rotated =
      position === -1
        ? currentOrder
        : currentOrder.slice(position).concat(currentOrder.slice(0, position));

    await updateStackOrder(groupIndex, rotated);
  }

  function navigateBrew(groupIndex: number, direction: -1 | 1) {
    const group = brewGroups[groupIndex];
    if (!group || group.brews.length < 2) return;
    const currentOrder = getNormalizedOrder(groupIndex, group);
    const rotated =
      direction === 1
        ? [...currentOrder.slice(1), currentOrder[0]]
        : [currentOrder[currentOrder.length - 1], ...currentOrder.slice(0, -1)];

    animateStackShuffle(groupIndex, rotated, direction);
  }

  function openGroupOverlay(groupIndex: number) {
    if (typeof window !== "undefined" && window.innerWidth > 720) {
      return;
    }
    const group = brewGroups[groupIndex];
    if (!group) return;
    dispatch("openGroup", { group });
  }

  function handleStackPointerDown(groupIndex: number, event: PointerEvent) {
    swipeStates.set(groupIndex, {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: scrollContainer?.scrollLeft ?? 0,
    });
  }

  function handleStackPointerUp(groupIndex: number, event: PointerEvent) {
    const state = swipeStates.get(groupIndex);
    if (!state) return;

    swipeStates.delete(groupIndex);

    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    const scrollDelta = Math.abs(
      (scrollContainer?.scrollLeft ?? 0) - state.scrollLeft,
    );

    if (scrollDelta > 8) return;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy)) return;

    navigateBrew(groupIndex, dx < 0 ? 1 : -1);
  }

  function handleGroupKeydown(event: KeyboardEvent, groupIndex: number) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateBrew(groupIndex, -1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateBrew(groupIndex, 1);
    }
  }

  onMount(() => {
    if (typeof window !== "undefined") {
      reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const updateMotionPreference = () => {
        prefersReducedMotion = reduceMotionQuery?.matches ?? false;
      };
      updateMotionPreference();
      reduceMotionListener = updateMotionPreference;
      if (reduceMotionQuery.addEventListener) {
        reduceMotionQuery.addEventListener("change", updateMotionPreference);
      } else {
        reduceMotionQuery.addListener(updateMotionPreference);
      }
    }
    loadWeekBrews();
  });

  $: if (scrollContainer) {
    setupScrollTracking();
  }

  onDestroy(() => {
    if (scrollContainer) {
      scrollContainer.removeEventListener("scroll", updateScrollButtons);
    }
    if (reduceMotionQuery && reduceMotionListener) {
      if (reduceMotionQuery.removeEventListener) {
        reduceMotionQuery.removeEventListener("change", reduceMotionListener);
      } else {
        reduceMotionQuery.removeListener(reduceMotionListener);
      }
    }
    scrollTrackingInitialized = false;
    swipeStates.clear();
  });
</script>

<section class="week-brewing-section">
  <div class="section-header">
    <div class="section-header-text">
      <h2 class="section-title" style={sectionTitleStyle}>Week in Brewing</h2>
      <p class="voice-text" style={voiceLineStyle}>
        Shared rhythms, small details.
      </p>
    </div>
    <div class="section-header-actions">
      {#if !loading && !error && brewGroups.length > 0}
        <div class="scroll-header">
          <div class="scroll-controls">
            <IconButton
              on:click={() => scrollByGroup(-1)}
              ariaLabel="Scroll left"
              title="Scroll left"
              variant="neutral"
              disabled={!canScrollLeft}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              on:click={() => scrollByGroup(1)}
              ariaLabel="Scroll right"
              title="Scroll right"
              variant="neutral"
              disabled={!canScrollRight}
            >
              <ChevronRight />
            </IconButton>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="section-cta">
    <a class="section-link" href="/brews/new" style={actionLinkStyle}>
      Pull a new shot
    </a>
  </div>

  {#if loading}
    <div class="loading-container">
      <LoadingIndicator />
    </div>
  {:else if error}
    <ErrorDisplay message={error} onRetry={loadWeekBrews} />
  {:else if brewGroups.length === 0}
    <div class="empty-state">
      <p class="voice-text" style={voiceLineStyle}>
        The week is just beginning. Check back soon to see what everyone's
        brewing!
      </p>
    </div>
  {:else}
    <div class="brewing-shell edge-rail" style={stackShellStyle}>
      <div class="group-scroll" bind:this={scrollContainer}>
        <div class="group-row">
          {#each brewGroups as group, groupIndex (getGroupKey(group))}
            {@const averageRating = getGroupAverageRating(group)}
            <article
              class="group-stack"
              bind:this={groupElements[groupIndex]}
              tabindex="0"
              aria-label={`Brews by ${group.barista.display_name} using ${group.bean.name}`}
              on:keydown={(event) => handleGroupKeydown(event, groupIndex)}
            >
              <div class="group-header">
                <div class="group-heading">
                  <h3 class="group-title" style={groupTitleStyle}>
                    {group.bean.name}
                  </h3>
                  <p class="group-meta" style={groupMetaStyle}>
                    {group.barista.display_name}
                  </p>
                </div>
                <div class="group-metrics" style={groupMetaStyle}>
                  <span class="group-count"
                    >{getBrewCountText(group.brews.length)}</span
                  >
                  {#if averageRating !== null}
                    <span class="avg-rating"
                      >{averageRating.toFixed(1)}
                      <StarMini size={16} /> avg</span
                    >
                  {/if}
                </div>
              </div>

              <div
                class="stack-area"
                on:pointerdown={(event) =>
                  handleStackPointerDown(groupIndex, event)}
                on:pointerup={(event) =>
                  handleStackPointerUp(groupIndex, event)}
                on:pointercancel={() => swipeStates.delete(groupIndex)}
                on:click={() => openGroupOverlay(groupIndex)}
              >
                {#each getStackedBrews(group, groupIndex, stackOrders) as stackItem (stackItem.brew.id)}
                  <div
                    class="stack-card"
                    class:is-active={stackItem.offset === 0}
                    class:is-stacked={stackItem.offset > 0}
                    data-brew-id={stackItem.brew.id}
                    style={`--stack-offset: ${stackItem.offset}; --stack-depth: ${getStackDepth(group)}; z-index: ${getStackDepth(group) - stackItem.offset}; opacity: ${1 - stackItem.offset * 0.12};`}
                  >
                    <BrewCard
                      brew={stackItem.brew}
                      baristaName={group.barista.display_name}
                      beanName={group.bean?.name ?? null}
                      beanImagePath={group.bean?.image_path ?? null}
                      grinderImagePath={stackItem.brew.grinder?.image_path ??
                        null}
                      machineImagePath={stackItem.brew.machine?.image_path ??
                        null}
                      variant="summary"
                    />
                  </div>
                {/each}
              </div>

              <div class="stack-footer">
                <div class="stack-controls">
                  <IconButton
                    on:click={() => navigateBrew(groupIndex, -1)}
                    ariaLabel="Previous brew"
                    title="Previous brew"
                    variant="neutral"
                    disabled={group.brews.length < 2}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <span class="stack-count" style={groupMetaStyle}>
                    {getActiveIndex(groupIndex, stackOrders) + 1} / {group.brews
                      .length}
                  </span>
                  <IconButton
                    on:click={() => navigateBrew(groupIndex, 1)}
                    ariaLabel="Next brew"
                    title="Next brew"
                    variant="neutral"
                    disabled={group.brews.length < 2}
                  >
                    <ChevronRight />
                  </IconButton>
                </div>
              </div>
            </article>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .week-brewing-section {
    padding: 0.5rem 0 0;
  }

  .section-header {
    margin-bottom: 1.5rem;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .section-header-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .section-header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .section-link {
    text-decoration: none;
    font-style: normal;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    letter-spacing: inherit;
    font-weight: 400;
    color: inherit;
  }

  .section-link:hover {
    text-decoration: underline;
    text-decoration-thickness: 1px;
  }

  .section-cta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-bottom: 0.5rem;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    padding: 3rem 0;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
  }

  .brewing-shell {
    background: var(--record-list-bg, var(--bg-surface-paper-secondary));
    border: var(--record-list-border-width, 1px)
      var(--record-list-border-style, solid)
      var(--record-list-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-list-radius, var(--radius-md));
    padding: var(--record-list-padding, 1.5rem);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .scroll-header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
    align-self: flex-end;
  }

  .scroll-controls {
    display: flex;
    gap: 0.5rem;
  }

  .group-scroll {
    overflow-x: auto;
    padding-bottom: 0.5rem;
    scrollbar-width: thin;
    scrollbar-color: var(--border-subtle) transparent;
    scroll-snap-type: x mandatory;
  }

  .group-scroll::-webkit-scrollbar {
    height: 6px;
  }

  .group-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .group-scroll::-webkit-scrollbar-thumb {
    background: var(--border-subtle);
    border-radius: 3px;
  }

  .group-row {
    display: flex;
    gap: 1.5rem;
    min-width: min-content;
  }

  .group-stack {
    width: 320px;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    scroll-snap-align: start;
    outline: none;
  }

  .group-stack:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 4px;
    border-radius: var(--radius-md);
  }

  .group-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .group-heading {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
    flex: 1;
  }

  .group-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .avg-rating {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .group-count {
    white-space: nowrap;
  }

  .group-metrics {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
  }

  .stack-area {
    display: grid;
    position: relative;
    min-height: 270px;
    overflow: hidden;
    border-radius: var(--radius-md);
  }

  .stack-card {
    grid-area: 1 / 1;
    transform: translateY(calc(var(--stack-offset) * 10px))
      scale(calc(1 - var(--stack-offset) * 0.02));
    transform-origin: top center;
    transition:
      transform 160ms ease,
      opacity 160ms ease;
    pointer-events: none;
  }

  .stack-card.is-active {
    pointer-events: auto;
  }

  .stack-footer {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: center;
  }

  .stack-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stack-count {
    min-width: 80px;
    text-align: center;
  }

  @media (max-width: 768px) {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 0;
    }

    .scroll-controls {
      display: none;
    }

    .group-stack {
      width: min(82vw, 320px);
      min-width: min(82vw, 320px);
    }

    .stack-area {
      min-height: 270px;
    }

    .stack-card.is-active {
      pointer-events: none;
    }

    .stack-footer {
      display: none;
    }

    .brewing-shell {
      background: var(--record-list-bg, var(--bg-surface-paper-secondary));
      border: var(--record-list-border-width, 1px)
        var(--record-list-border-style, solid)
        var(--record-list-border, rgba(123, 94, 58, 0.2));
      border-radius: 0;
      padding: 0.75rem 0;
    }

    .group-scroll {
      padding-left: 1rem;
      padding-right: 1rem;
      scroll-padding-left: 1rem;
      scroll-padding-right: 1rem;
    }

    .group-row {
      padding-right: 1rem;
    }
  }

  @media (max-width: 480px) {
    .group-stack {
      width: min(86vw, 280px);
      min-width: min(86vw, 280px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .stack-card {
      transition: none;
    }
  }
</style>
