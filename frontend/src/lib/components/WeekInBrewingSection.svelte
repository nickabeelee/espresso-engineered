<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import BrewCard from './BrewCard.svelte';
  import LoadingIndicator from './LoadingIndicator.svelte';
  import ErrorDisplay from './ErrorDisplay.svelte';
  import { apiClient } from '$lib/api-client';
  import { animations, animationUtils, gsap } from '$lib/ui/animations';
  import { recordListShell } from '$lib/ui/components/card';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import type { Brew } from '../../../shared/types';

  // Component props
  export let weekStart: Date | undefined = undefined;

  // Component state
  let loading = true;
  let error: string | null = null;
  let brewGroups: LayeredBrewGroup[] = [];
  let currentGroupIndex = 0;
  let currentBrewIndex = 0;

  // DOM references
  let containerElement: HTMLElement;
  let groupElements: HTMLElement[] = [];
  let cardElements: HTMLElement[] = [];

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

  const stackShellStyle = toStyleString({
    '--record-list-bg': recordListShell.background,
    '--record-list-border': recordListShell.borderColor,
    '--record-list-border-width': recordListShell.borderWidth,
    '--record-list-border-style': recordListShell.borderStyle,
    '--record-list-radius': recordListShell.borderRadius,
    '--record-list-padding': recordListShell.padding
  });

  // Types for the component
  interface LayeredBrewGroup {
    barista: {
      id: string;
      display_name: string;
    };
    bean: {
      id: string;
      name: string;
      roast_level: string;
      roaster: {
        id: string;
        name: string;
      };
    };
    brews: Brew[];
    stackDepth: number;
  }

  // Load week brewing data
  async function loadWeekBrews() {
    try {
      loading = true;
      error = null;

      const params: any = {};
      if (weekStart) {
        params.week_start = weekStart.toISOString();
      }

      const response = await apiClient.getWeekBrews(params);
      brewGroups = response.data || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load week brews';
      console.error('Error loading week brews:', err);
    } finally {
      loading = false;
    }
  }

  // Navigation functions
  function navigateToGroup(index: number) {
    if (index >= 0 && index < brewGroups.length && index !== currentGroupIndex) {
      const previousIndex = currentGroupIndex;
      currentGroupIndex = index;
      currentBrewIndex = 0; // Reset to first brew in new group
      
      // Dispatch custom event for group navigation
      containerElement?.dispatchEvent(new CustomEvent('groupNavigation', {
        detail: { 
          from: previousIndex, 
          to: index,
          group: brewGroups[index]
        }
      }));
      
      // Use enhanced group change animation
      animateGroupChange(previousIndex, index);
      
      // Animate the new card stack entrance
      setTimeout(() => {
        animateCardStackEntrance();
      }, 200);
    }
  }

  function navigateWithinGroup(index: number) {
    const currentGroup = brewGroups[currentGroupIndex];
    if (currentGroup && index >= 0 && index < currentGroup.brews.length && index !== currentBrewIndex) {
      const previousIndex = currentBrewIndex;
      currentBrewIndex = index;
      
      // Dispatch custom event for brew navigation
      containerElement?.dispatchEvent(new CustomEvent('brewNavigation', {
        detail: { 
          from: previousIndex, 
          to: index,
          brew: currentGroup.brews[index],
          groupIndex: currentGroupIndex
        }
      }));
      
      animateBrewTransition();
    }
  }

  function navigateToPreviousGroup() {
    if (currentGroupIndex > 0) {
      navigateToGroup(currentGroupIndex - 1);
    } else if (brewGroups.length > 0) {
      // Wrap around to last group
      navigateToGroup(brewGroups.length - 1);
    }
  }

  function navigateToNextGroup() {
    if (currentGroupIndex < brewGroups.length - 1) {
      navigateToGroup(currentGroupIndex + 1);
    } else if (brewGroups.length > 0) {
      // Wrap around to first group
      navigateToGroup(0);
    }
  }

  function navigateToPreviousBrew() {
    const currentGroup = brewGroups[currentGroupIndex];
    if (currentBrewIndex > 0) {
      navigateWithinGroup(currentBrewIndex - 1);
    } else if (currentGroup && currentGroup.brews.length > 0) {
      // Wrap around to last brew in group
      navigateWithinGroup(currentGroup.brews.length - 1);
    }
  }

  function navigateToNextBrew() {
    const currentGroup = brewGroups[currentGroupIndex];
    if (currentGroup && currentBrewIndex < currentGroup.brews.length - 1) {
      navigateWithinGroup(currentBrewIndex + 1);
    } else if (currentGroup && currentGroup.brews.length > 0) {
      // Wrap around to first brew in group
      navigateWithinGroup(0);
    }
  }

  // Advanced navigation functions
  function navigateToFirstGroup() {
    if (brewGroups.length > 0) {
      navigateToGroup(0);
    }
  }

  function navigateToLastGroup() {
    if (brewGroups.length > 0) {
      navigateToGroup(brewGroups.length - 1);
    }
  }

  function navigateToFirstBrewInGroup() {
    navigateWithinGroup(0);
  }

  function navigateToLastBrewInGroup() {
    const currentGroup = brewGroups[currentGroupIndex];
    if (currentGroup && currentGroup.brews.length > 0) {
      navigateWithinGroup(currentGroup.brews.length - 1);
    }
  }

  // Navigation state helpers
  function canNavigateToPreviousGroup(): boolean {
    return brewGroups.length > 1; // Can always navigate if more than one group (wrapping)
  }

  function canNavigateToNextGroup(): boolean {
    return brewGroups.length > 1; // Can always navigate if more than one group (wrapping)
  }

  function canNavigateToPreviousBrew(): boolean {
    const currentGroup = brewGroups[currentGroupIndex];
    return currentGroup && currentGroup.brews.length > 1; // Can always navigate if more than one brew (wrapping)
  }

  function canNavigateToNextBrew(): boolean {
    const currentGroup = brewGroups[currentGroupIndex];
    return currentGroup && currentGroup.brews.length > 1; // Can always navigate if more than one brew (wrapping)
  }

  // Get navigation context for accessibility
  function getNavigationContext(): string {
    const currentGroup = brewGroups[currentGroupIndex];
    if (!currentGroup) return '';
    
    return `Group ${currentGroupIndex + 1} of ${brewGroups.length}, Brew ${currentBrewIndex + 1} of ${currentGroup.brews.length}`;
  }

  // Animation functions
  function animateGroupTransition() {
    if (groupElements.length > 0 && groupElements[currentGroupIndex]) {
      // Animate the current group container
      animations.horizontalScroll([groupElements[currentGroupIndex]], {
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0
      });

      // Also animate the group header
      const groupHeader = groupElements[currentGroupIndex]?.querySelector('.group-header');
      if (groupHeader) {
        animations.fadeInUp(groupHeader, {
          duration: 0.25,
          ease: 'power2.out',
          stagger: 0
        });
      }
    }
  }

  function animateBrewTransition() {
    const currentGroup = brewGroups[currentGroupIndex];
    if (currentGroup && cardElements.length > 0) {
      // Get cards for current group
      const groupStartIndex = currentGroupIndex * 5; // Assuming max 5 cards per group for stacking
      const groupCards = cardElements.slice(groupStartIndex, groupStartIndex + currentGroup.brews.length);
      
      if (groupCards.length > 0) {
        // Animate card stacking with enhanced GSAP timeline
        const timeline = gsap.timeline();
        
        // First, set all cards to their base stacked state
        timeline.set(groupCards, {
          scale: 0.98,
          y: (i) => i * 4,
          zIndex: (i) => currentGroup.brews.length - i,
          opacity: 0.7
        });
        
        // Then animate the active card to prominence
        if (groupCards[currentBrewIndex]) {
          timeline.to(groupCards[currentBrewIndex], {
            scale: 1,
            y: 0,
            opacity: 1,
            duration: 0.15,
            ease: 'power1.inOut'
          }, 0);
        }
        
        // Add subtle hover effect preparation
        groupCards.forEach((card, index) => {
          if (index === currentBrewIndex) {
            animationUtils.createHoverLift(card);
          }
        });
      }
    }
  }

  function animateCardStackEntrance() {
    const currentGroup = brewGroups[currentGroupIndex];
    if (currentGroup && cardElements.length > 0) {
      const groupStartIndex = currentGroupIndex * 5;
      const groupCards = cardElements.slice(groupStartIndex, groupStartIndex + currentGroup.brews.length);
      
      if (groupCards.length > 0) {
        // Create entrance animation for the entire stack
        const timeline = gsap.timeline();
        
        // Start with cards off-screen
        timeline.set(groupCards, {
          x: 100,
          opacity: 0,
          scale: 0.8
        });
        
        // Animate cards in with stagger
        timeline.to(groupCards, {
          x: 0,
          opacity: (i) => i === currentBrewIndex ? 1 : 0.7,
          scale: (i) => i === currentBrewIndex ? 1 : 0.98,
          y: (i) => i === currentBrewIndex ? 0 : i * 4,
          duration: 0.4,
          ease: 'back.out(1.7)',
          stagger: 0.05
        });
      }
    }
  }

  function animateNavigationControls() {
    const navButtons = containerElement?.querySelectorAll('.nav-button');
    if (navButtons) {
      animations.fadeInUp(Array.from(navButtons), {
        duration: 0.2,
        ease: 'power2.out',
        stagger: 0.05
      });
    }
  }

  function animateIndicators() {
    const indicators = containerElement?.querySelectorAll('.group-indicator, .brew-indicator');
    if (indicators) {
      animations.fadeInUp(Array.from(indicators), {
        duration: 0.15,
        ease: 'power2.out',
        stagger: 0.02
      });
    }
  }

  // Enhanced animation for smooth transitions between groups
  function animateGroupChange(fromIndex: number, toIndex: number) {
    const timeline = gsap.timeline();
    
    // Animate out the old group
    if (groupElements[fromIndex]) {
      timeline.to(groupElements[fromIndex], {
        x: toIndex > fromIndex ? -50 : 50,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
      });
    }
    
    // Animate in the new group
    if (groupElements[toIndex]) {
      timeline.set(groupElements[toIndex], {
        x: toIndex > fromIndex ? 50 : -50,
        opacity: 0
      });
      
      timeline.to(groupElements[toIndex], {
        x: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
    
    return timeline;
  }

  // Handle brew card click
  function handleBrewClick(brew: Brew, event?: MouseEvent | KeyboardEvent) {
    // Add click animation before navigation
    if (event?.target) {
      const target = event.target as HTMLElement;
      const cardWrapper = target.closest('.brew-card-wrapper');
      if (cardWrapper) {
        // Create a quick press animation
        gsap.timeline()
          .to(cardWrapper, {
            scale: 0.98,
            duration: 0.1,
            ease: 'power2.in'
          })
          .to(cardWrapper, {
            scale: 1,
            duration: 0.1,
            ease: 'power2.out',
            onComplete: () => {
              // Navigate after animation
              navigateToBrewDetail(brew);
            }
          });
      } else {
        navigateToBrewDetail(brew);
      }
    } else {
      navigateToBrewDetail(brew);
    }
  }

  // Navigate to brew detail page
  function navigateToBrewDetail(brew: Brew) {
    // Dispatch navigation event for tracking
    containerElement?.dispatchEvent(new CustomEvent('brewDetailNavigation', {
      detail: { 
        brew,
        fromGroup: currentGroupIndex,
        fromBrew: currentBrewIndex
      }
    }));

    goto(`/brews/${brew.id}`);
  }

  // Handle brew card interaction (click or keyboard)
  function handleBrewInteraction(brew: Brew, event: MouseEvent | KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if this is the current active brew
    const currentGroup = brewGroups[currentGroupIndex];
    if (currentGroup) {
      const brewIndex = currentGroup.brews.findIndex(b => b.id === brew.id);
      if (brewIndex !== -1) {
        if (brewIndex === currentBrewIndex) {
          // If clicking the active brew, navigate to detail
          handleBrewClick(brew, event);
        } else {
          // If clicking a different brew, make it active first
          navigateWithinGroup(brewIndex);
        }
      }
    }
  }

  // Handle quick navigation to brew detail from anywhere
  function quickNavigateToBrewDetail() {
    const currentGroup = brewGroups[currentGroupIndex];
    if (currentGroup && currentGroup.brews[currentBrewIndex]) {
      handleBrewClick(currentGroup.brews[currentBrewIndex]);
    }
  }

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (event.shiftKey) {
          navigateToPreviousGroup();
        } else {
          navigateToPreviousBrew();
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (event.shiftKey) {
          navigateToNextGroup();
        } else {
          navigateToNextBrew();
        }
        break;
      case 'Home':
        event.preventDefault();
        if (event.shiftKey) {
          navigateToFirstGroup();
        } else {
          navigateToFirstBrewInGroup();
        }
        break;
      case 'End':
        event.preventDefault();
        if (event.shiftKey) {
          navigateToLastGroup();
        } else {
          navigateToLastBrewInGroup();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        quickNavigateToBrewDetail();
        break;
      case 'Escape':
        event.preventDefault();
        // Remove focus from component
        if (containerElement) {
          containerElement.blur();
        }
        break;
    }
  }

  // Get display title for a group
  function getGroupTitle(group: LayeredBrewGroup): string {
    return `${group.barista.display_name} × ${group.bean.name}`;
  }

  // Get brew count text
  function getBrewCountText(count: number): string {
    return count === 1 ? '1 brew' : `${count} brews`;
  }

  // Initialize component
  onMount(() => {
    loadWeekBrews();
    
    // Add keyboard event listener
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      // Only handle if this component is focused or no other input is focused
      if (containerElement && (containerElement.contains(document.activeElement) || 
          !document.activeElement || document.activeElement === document.body)) {
        handleKeydown(event);
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // Initial animation setup
    setTimeout(() => {
      animateNavigationControls();
      animateIndicators();
    }, 100);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  });

  // Reactive statement to animate when groups change
  $: if (brewGroups.length > 0 && groupElements.length > 0) {
    // Animate the initial card stack entrance
    setTimeout(() => {
      animateCardStackEntrance();
    }, 300);
  }
</script>

<section class="week-brewing-section" bind:this={containerElement} tabindex="0">
  <div class="section-header">
    <div class="section-header-text">
      <h2 class="section-title" style={sectionTitleStyle}>Week in Brewing</h2>
      <p class="voice-text" style={voiceLineStyle}>Shared rhythms, small details.</p>
    </div>
  </div>

  {#if loading}
    <div class="loading-container">
      <LoadingIndicator />
    </div>
  {:else if error}
    <ErrorDisplay message={error} onRetry={loadWeekBrews} />
  {:else if brewGroups.length === 0}
    <div class="empty-state">
      <p class="voice-text" style={voiceLineStyle}>The week is just beginning. Check back soon to see what everyone's brewing!</p>
    </div>
  {:else}
    <div class="brewing-shell" style={stackShellStyle}>
      <div class="brewing-content">
        <!-- Navigation indicators -->
        <div class="navigation-indicators">
          <div class="group-indicators">
            {#each brewGroups as group, index}
              <button
                class="group-indicator"
                class:active={index === currentGroupIndex}
                on:click={() => navigateToGroup(index)}
                aria-label={`View ${getGroupTitle(group)}`}
              >
                <span class="indicator-dot"></span>
              </button>
            {/each}
          </div>
          
          {#if brewGroups[currentGroupIndex] && brewGroups[currentGroupIndex].brews.length > 1}
            <div class="brew-indicators">
              {#each brewGroups[currentGroupIndex].brews as brew, index}
                <button
                  class="brew-indicator"
                  class:active={index === currentBrewIndex}
                  on:click={() => navigateWithinGroup(index)}
                  aria-label={`View brew ${index + 1} of ${brewGroups[currentGroupIndex].brews.length}`}
                >
                  <span class="indicator-line"></span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Main content area -->
        <div class="content-area">
          <!-- Navigation controls -->
          <div class="navigation-controls">
            <button
              class="nav-button prev-group"
              disabled={!canNavigateToPreviousGroup()}
              on:click={navigateToPreviousGroup}
              aria-label="Previous group"
              title="Previous group (Shift + ←)"
            >
              <span class="nav-icon">‹‹</span>
            </button>
            
            <button
              class="nav-button prev-brew"
              disabled={!canNavigateToPreviousBrew()}
              on:click={navigateToPreviousBrew}
              aria-label="Previous brew"
              title="Previous brew (←)"
            >
              <span class="nav-icon">‹</span>
            </button>
          </div>

          <!-- Current group display -->
          {#if brewGroups[currentGroupIndex]}
            {@const currentGroup = brewGroups[currentGroupIndex]}
            <div class="group-container" bind:this={groupElements[currentGroupIndex]}>
              <div class="group-header">
                <h3 class="group-title">{getGroupTitle(currentGroup)}</h3>
                <p class="group-meta">
                  {getBrewCountText(currentGroup.brews.length)} • 
                  {currentGroup.bean.roaster.name} • 
                  {currentGroup.bean.roast_level}
                </p>
                
                <!-- Quick action button -->
                <button
                  class="quick-action-btn"
                  on:click={quickNavigateToBrewDetail}
                  aria-label="View current brew details"
                  title="View brew details (Enter)"
                >
                  <span class="action-icon">👁</span>
                  View Details
                </button>
              </div>

              <!-- Layered brew cards -->
              <div class="brew-stack">
                {#each currentGroup.brews as brew, index}
                  <div
                    class="brew-card-wrapper"
                    class:active={index === currentBrewIndex}
                    class:stacked={index !== currentBrewIndex}
                    style="z-index: {currentGroup.brews.length - index}; transform: translateY({index === currentBrewIndex ? 0 : index * 4}px) scale({index === currentBrewIndex ? 1 : 0.98})"
                    bind:this={cardElements[currentGroupIndex * 5 + index]}
                    role="button"
                    tabindex={index === currentBrewIndex ? 0 : -1}
                    aria-label={`${index === currentBrewIndex ? 'View' : 'Select'} brew by ${currentGroup.barista.display_name}`}
                    on:click={(event) => handleBrewInteraction(brew, event)}
                    on:keydown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        handleBrewInteraction(brew, event);
                      }
                    }}
                  >
                    <BrewCard
                      {brew}
                      baristaName={currentGroup.barista.display_name}
                    />
                    
                    <!-- Visual indicator for active card -->
                    {#if index === currentBrewIndex}
                      <div class="active-indicator" aria-hidden="true">
                        <span class="indicator-text">Press Enter to view details</span>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Navigation controls -->
          <div class="navigation-controls">
            <button
              class="nav-button next-brew"
              disabled={!canNavigateToNextBrew()}
              on:click={navigateToNextBrew}
              aria-label="Next brew"
              title="Next brew (→)"
            >
              <span class="nav-icon">›</span>
            </button>
            
            <button
              class="nav-button next-group"
              disabled={!canNavigateToNextGroup()}
              on:click={navigateToNextGroup}
              aria-label="Next group"
              title="Next group (Shift + →)"
            >
              <span class="nav-icon">››</span>
            </button>
          </div>
        </div>

        <!-- Keyboard shortcuts help -->
        <div class="keyboard-help">
          <p class="help-text">
            Use ← → to navigate brews, Shift + ← → for groups, Home/End for first/last, Enter to view details
          </p>
          <p class="navigation-context" aria-live="polite">
            {getNavigationContext()}
          </p>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .week-brewing-section {
    padding: 0.5rem 0 0;
    outline: none;
  }

  .section-header {
    margin-bottom: 1.5rem;
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .section-header-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
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


  .brewing-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .brewing-shell {
    background: var(--record-list-bg, var(--bg-surface-paper-secondary));
    border: var(--record-list-border-width, 1px) var(--record-list-border-style, solid) var(--record-list-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-list-radius, var(--radius-md));
    padding: var(--record-list-padding, 1.5rem);
  }

  .navigation-indicators {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .group-indicators {
    display: flex;
    gap: 0.5rem;
  }

  .group-indicator {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 50%;
    transition: all var(--motion-fast);
    transform-origin: center center;
    will-change: transform, background-color;
  }

  .group-indicator:hover {
    background: rgba(123, 94, 58, 0.1);
    transform: scale(1.1);
  }

  .group-indicator:active {
    transform: scale(0.9);
  }

  .indicator-dot {
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-ink-muted);
    transition: all var(--motion-fast);
    will-change: transform, background-color;
  }

  .group-indicator.active .indicator-dot {
    background: var(--accent-primary);
    transform: scale(1.25);
  }

  .brew-indicators {
    display: flex;
    gap: 0.25rem;
  }

  .brew-indicator {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    border-radius: 2px;
    transition: all var(--motion-fast);
    will-change: transform;
  }

  .brew-indicator:hover {
    transform: scale(1.1);
  }

  .brew-indicator:active {
    transform: scale(0.9);
  }

  .indicator-line {
    display: block;
    width: 20px;
    height: 2px;
    background: var(--text-ink-muted);
    transition: all var(--motion-fast);
    will-change: transform, background-color, height;
  }

  .brew-indicator.active .indicator-line {
    background: var(--accent-primary);
    height: 3px;
  }

  .content-area {
    display: flex;
    align-items: center;
    gap: 2rem;
    min-height: 400px;
  }

  .navigation-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .nav-button {
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    cursor: pointer;
    transition: all var(--motion-fast);
    color: var(--text-ink-secondary);
    transform-origin: center center;
    will-change: transform, background-color, border-color;
  }

  .nav-button:hover:not(:disabled) {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
    transform: scale(1.05);
  }

  .nav-button:active:not(:disabled) {
    transform: scale(0.95);
  }

  .nav-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .nav-icon {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .group-container {
    flex: 1;
    max-width: 600px;
  }

  .group-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .group-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-ink-primary);
    margin: 0 0 0.5rem 0;
  }

  .group-meta {
    color: var(--text-ink-muted);
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
  }

  .quick-action-btn {
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--motion-fast);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .quick-action-btn:hover {
    background: var(--accent-primary-dark, #8B5A3C);
    transform: translateY(-1px);
  }

  .quick-action-btn:active {
    transform: translateY(0);
  }

  .action-icon {
    font-size: 1rem;
  }

  .brew-stack {
    position: relative;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brew-card-wrapper {
    position: absolute;
    width: 100%;
    max-width: 500px;
    transition: all 0.3s ease;
    cursor: pointer;
    transform-origin: center center;
    will-change: transform, opacity;
    border-radius: var(--radius-md);
    outline: none;
  }

  .brew-card-wrapper.stacked {
    opacity: 0.7;
    pointer-events: none;
  }

  .brew-card-wrapper.active {
    opacity: 1;
    pointer-events: all;
  }

  .brew-card-wrapper:hover.active {
    transform: translateY(-2px) scale(1.02);
  }

  .brew-card-wrapper:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .brew-card-wrapper.stacked:hover {
    opacity: 0.85;
    cursor: pointer;
  }

  .active-indicator {
    position: absolute;
    bottom: -2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent-primary);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0;
    transition: opacity var(--motion-fast);
    pointer-events: none;
    white-space: nowrap;
  }

  .brew-card-wrapper.active:hover .active-indicator,
  .brew-card-wrapper.active:focus-visible .active-indicator {
    opacity: 1;
  }

  .indicator-text {
    display: block;
  }

  .keyboard-help {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(123, 94, 58, 0.1);
  }

  .help-text {
    color: var(--text-ink-muted);
    font-size: 0.85rem;
    margin: 0 0 0.5rem 0;
  }

  .navigation-context {
    color: var(--text-ink-muted);
    font-size: 0.8rem;
    font-weight: 500;
    margin: 0;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .content-area {
      flex-direction: column;
      gap: 1rem;
    }

    .navigation-controls {
      flex-direction: row;
      justify-content: center;
    }

    .section-title {
      font-size: 1.5rem;
    }

    .group-container {
      max-width: 100%;
    }

    .brew-stack {
      height: 250px;
    }
  }
</style>
