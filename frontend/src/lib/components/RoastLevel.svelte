<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { RoastLevel } from '../../../shared/types';
  import CoffeeBeanMicro from '$lib/icons/micro/CoffeeBean.svelte';
  import CoffeeBeanMini from '$lib/icons/mini/CoffeeBean.svelte';
  import CoffeeBeanSolid from '$lib/icons/solid/CoffeeBean.svelte';

  // Props interface
  export let value: RoastLevel | null = null;
  export let editable: boolean = false;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let showLabel: boolean = false;
  export let onChange: ((value: RoastLevel) => void) | undefined = undefined;

  // Event dispatcher for Svelte events
  const dispatch = createEventDispatcher<{
    change: RoastLevel;
  }>();

  // Internal state for hover interactions
  let hoverValue: RoastLevel | null = null;
  let isHovering: boolean = false;

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

  // Get number of active beans for current display state
  function getActiveBeanCount(): number {
    const displayValue = isHovering && hoverValue ? hoverValue : value;
    return displayValue ? roastLevelMap[displayValue] : 0;
  }

  // Handle mouse enter on bean
  function handleBeanHover(beanIndex: number) {
    if (!editable) return;
    
    isHovering = true;
    hoverValue = beanPositionToRoastLevel[beanIndex];
  }

  // Handle mouse leave from component
  function handleMouseLeave() {
    if (!editable) return;
    
    isHovering = false;
    hoverValue = null;
  }

  // Handle click on bean
  function handleBeanClick(beanIndex: number) {
    if (!editable) return;
    
    const newValue = beanPositionToRoastLevel[beanIndex];
    value = newValue;
    
    // Call onChange prop if provided
    if (onChange) {
      onChange(newValue);
    }
    
    // Dispatch Svelte event
    dispatch('change', newValue);
    
    // Clear hover state
    isHovering = false;
    hoverValue = null;
  }

  // Get the CSS class for a bean based on its state
  function getBeanClass(beanIndex: number): string {
    const activeBeanCount = getActiveBeanCount();
    const isActive = beanIndex <= activeBeanCount;
    const isHoverPreview = isHovering && hoverValue && beanIndex <= roastLevelMap[hoverValue];
    
    if (isHoverPreview) {
      return 'bean-icon bean-active bean-hover-preview';
    } else if (isActive) {
      return 'bean-icon bean-active';
    } else {
      return 'bean-icon bean-inactive';
    }
  }

  // Handle keyboard navigation for editable mode
  function handleKeyDown(event: KeyboardEvent) {
    if (!editable) return;
    
    const currentLevel = value ? roastLevelMap[value] : 0;
    let newLevel = currentLevel;
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        newLevel = Math.max(1, currentLevel - 1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        newLevel = Math.min(5, currentLevel + 1);
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
    
    if (newLevel !== currentLevel) {
      const newValue = beanPositionToRoastLevel[newLevel];
      value = newValue;
      
      if (onChange) {
        onChange(newValue);
      }
      
      dispatch('change', newValue);
    }
  }

  $: IconComponent = getIconComponent(size);
  $: displayValue = isHovering && hoverValue ? hoverValue : value;
</script>

<div 
  class="roast-level-component"
  class:editable
  on:mouseleave={handleMouseLeave}
  on:keydown={handleKeyDown}
  role={editable ? 'slider' : 'img'}
  aria-label={value ? `Roast level: ${value}` : 'Roast level not set'}
  aria-valuemin={editable ? 1 : undefined}
  aria-valuemax={editable ? 5 : undefined}
  aria-valuenow={editable && value ? roastLevelMap[value] : undefined}
  aria-valuetext={editable && value ? value : undefined}
  tabindex={editable ? 0 : -1}
  title={value || 'Roast level not set'}
>
  <div class="bean-row">
    {#each Array(5) as _, index}
      <button
        class={getBeanClass(index + 1)}
        class:clickable={editable}
        on:mouseenter={() => handleBeanHover(index + 1)}
        on:click={() => handleBeanClick(index + 1)}
        disabled={!editable}
        aria-label={`Set roast level to ${beanPositionToRoastLevel[index + 1]}`}
        title={editable ? `Set roast level to ${beanPositionToRoastLevel[index + 1]}` : ''}
      >
        <svelte:component this={IconComponent} />
      </button>
    {/each}
  </div>
  
  {#if showLabel && value}
    <div class="roast-label">
      {value}
    </div>
  {/if}
</div>

<style>
  .roast-level-component {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
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
    transition: color var(--motion-fast) ease;
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
    color: var(--text-ink-muted);
  }

  .bean-hover-preview {
    color: var(--accent-primary);
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