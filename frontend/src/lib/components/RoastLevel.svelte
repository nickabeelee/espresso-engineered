<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { RoastLevel } from '../../../shared/types';
  import CoffeeBeanMicro from '$lib/icons/micro/CoffeeBean.svelte';
  import CoffeeBeanMini from '$lib/icons/mini/CoffeeBean.svelte';
  import CoffeeBeanSolid from '$lib/icons/solid/CoffeeBean.svelte';

  // Props interface
  export let value: RoastLevel | null | undefined = null;
  export let editable: boolean = false;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let showLabel: boolean = false;
  export let onChange: ((value: RoastLevel) => void) | undefined = undefined;

  // Event dispatcher for Svelte events
  const dispatch = createEventDispatcher<{
    change: RoastLevel;
    value: RoastLevel;
  }>();

  const beanIndices = [1, 2, 3, 4, 5];
  let draftValue: RoastLevel | null = value ?? null;
  let lastPropValue: RoastLevel | null | undefined = value;
  let activeBeanCount = 0;
  let buttonRefs: Array<HTMLButtonElement | null> = [];

  // Roast level mapping to number of active beans
  const roastLevelMap: Record<RoastLevel, number> = {
    'Light': 1,
    'Medium Light': 2,
    'Medium': 3,
    'Medium Dark': 4,
    'Dark': 5
  };

  // Reverse mapping for click interactions
  const beanPositionToRoastLevel: Record<number, RoastLevel> = {
    1: 'Light',
    2: 'Medium Light',
    3: 'Medium',
    4: 'Medium Dark',
    5: 'Dark'
  };

  // Get the appropriate icon component based on size
  function getIconComponent(size: 'small' | 'medium' | 'large') {
    switch (size) {
      case 'small':
        return CoffeeBeanMicro;
      case 'medium':
        return CoffeeBeanMini;
      case 'large':
        return CoffeeBeanSolid;
      default:
        return CoffeeBeanMini;
    }
  }

  // Handle click on bean
  function handleBeanClick(beanIndex: number) {
    if (!editable) return;
    
    const newValue = beanPositionToRoastLevel[beanIndex];
    draftValue = newValue;
    
    // Call onChange prop if provided
    if (onChange) {
      onChange(newValue);
    }
    
    // Dispatch Svelte event
    dispatch('change', newValue);
    dispatch('value', newValue);
    
  }

  async function handleKeyDown(event: KeyboardEvent) {
    if (!editable) return;

    const currentLevel = activeBeanCount || 0;
    let newLevel = currentLevel || 1;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        newLevel = Math.max(1, currentLevel - 1 || 1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        newLevel = Math.min(5, currentLevel + 1 || 1);
        break;
      case 'Home':
        event.preventDefault();
        newLevel = 1;
        break;
      case 'End':
        event.preventDefault();
        newLevel = 5;
        break;
      default:
        return;
    }

    handleBeanClick(newLevel);
    await tick();
    buttonRefs[newLevel - 1]?.focus();
  }

  $: IconComponent = getIconComponent(size);
  $: if (value !== lastPropValue) {
    draftValue = value ?? null;
    lastPropValue = value;
  }
  $: activeBeanCount = draftValue ? roastLevelMap[draftValue] : 0;
</script>

<div
  class="roast-level-component"
  class:editable
  class:small={size === 'small'}
  class:medium={size === 'medium'}
  class:large={size === 'large'}
  role="radiogroup"
  aria-label={draftValue ? `Roast level: ${draftValue}` : 'Roast level not set'}
  tabindex={editable ? 0 : undefined}
  on:keydown={handleKeyDown}
  title={draftValue || 'Roast level not set'}
>
  <div class="bean-row">
    {#key draftValue}
      {#each beanIndices as beanIndex}
        {#if beanIndex <= activeBeanCount}
          <button
            type="button"
            class="bean-icon bean-active"
            class:clickable={editable}
            on:click={() => handleBeanClick(beanIndex)}
            disabled={!editable}
            role="radio"
            aria-checked="true"
            tabindex={editable && beanIndex === activeBeanCount ? 0 : -1}
            aria-label={`Set roast level to ${beanPositionToRoastLevel[beanIndex]}`}
            title={editable ? `Set roast level to ${beanPositionToRoastLevel[beanIndex]}` : ''}
            bind:this={buttonRefs[beanIndex - 1]}
          >
            <svelte:component this={IconComponent} />
          </button>
        {:else}
          <button
            type="button"
            class="bean-icon bean-inactive"
            class:clickable={editable}
            on:click={() => handleBeanClick(beanIndex)}
            disabled={!editable}
            role="radio"
            aria-checked="false"
            tabindex={editable && activeBeanCount === 0 && beanIndex === 1 ? 0 : -1}
            aria-label={`Set roast level to ${beanPositionToRoastLevel[beanIndex]}`}
            title={editable ? `Set roast level to ${beanPositionToRoastLevel[beanIndex]}` : ''}
            bind:this={buttonRefs[beanIndex - 1]}
          >
            <svelte:component this={IconComponent} />
          </button>
        {/if}
      {/each}
    {/key}
  </div>
  
  {#if showLabel && draftValue}
    <div class="roast-label">
      ({draftValue})
    </div>
  {/if}
</div>

<style>
  .roast-level-component {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    --bean-size: 20px;
  }

  .roast-level-component.small {
    --bean-size: 16px;
  }

  .roast-level-component.medium {
    --bean-size: 20px;
  }

  .roast-level-component.large {
    --bean-size: 24px;
  }

  .bean-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .bean-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0;
    cursor: default;
    transition: color var(--motion-fast) ease, transform var(--motion-fast) ease, filter var(--motion-fast) ease;
    flex-shrink: 0;
  }

  .bean-icon :global(svg) {
    display: block;
    flex-shrink: 0;
    height: var(--bean-size);
    width: auto;
    overflow: visible;
  }

  .bean-icon.clickable {
    cursor: pointer;
  }

  .bean-icon.clickable:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .bean-active {
    color: var(--text-ink-primary);
  }

  .bean-inactive {
    color: var(--text-ink-placeholder);
  }

  .roast-level-component.editable .bean-row button:hover,
  .roast-level-component.editable .bean-row button:focus-visible {
    transform: translateY(-2px) scale(1.08);
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.18));
  }

  .roast-level-component.editable .bean-row:has(button:nth-child(1):hover) button:nth-child(-n + 1),
  .roast-level-component.editable .bean-row:has(button:nth-child(2):hover) button:nth-child(-n + 2),
  .roast-level-component.editable .bean-row:has(button:nth-child(3):hover) button:nth-child(-n + 3),
  .roast-level-component.editable .bean-row:has(button:nth-child(4):hover) button:nth-child(-n + 4),
  .roast-level-component.editable .bean-row:has(button:nth-child(5):hover) button:nth-child(-n + 5),
  .roast-level-component.editable .bean-row:has(button:nth-child(1):focus-visible) button:nth-child(-n + 1),
  .roast-level-component.editable .bean-row:has(button:nth-child(2):focus-visible) button:nth-child(-n + 2),
  .roast-level-component.editable .bean-row:has(button:nth-child(3):focus-visible) button:nth-child(-n + 3),
  .roast-level-component.editable .bean-row:has(button:nth-child(4):focus-visible) button:nth-child(-n + 4),
  .roast-level-component.editable .bean-row:has(button:nth-child(5):focus-visible) button:nth-child(-n + 5) {
    color: var(--accent-primary);
    transform: translateY(-1px) scale(1.05);
  }

  .roast-label {
    font-size: 0.875rem;
    color: var(--text-ink-muted);
    font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
    text-align: center;
  }

  .editable.roast-level-component:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
</style>
