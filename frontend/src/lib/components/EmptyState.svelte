<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { InformationCircle, PlusCircle, MagnifyingGlass, ArrowPath } from '$lib/icons';
  import { emptyState } from '$lib/ui/components/empty-state';
  import { toStyleString } from '$lib/ui/style';
  
  export let title: string;
  export let description: string;
  export let icon: 'info' | 'search' | 'add' | 'refresh' | 'custom' = 'info';
  export let customIcon: any = null;
  export let actionLabel: string | null = null;
  export let actionVariant: 'primary' | 'secondary' | 'neutral' = 'primary';
  export let secondaryActionLabel: string | null = null;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let illustration: string | null = null; // URL to illustration image
  
  const dispatch = createEventDispatcher<{
    action: void;
    secondaryAction: void;
  }>();

  const style = toStyleString({
    '--empty-padding': emptyState.container.padding,
    '--empty-min-height': emptyState.container.minHeight,
    '--empty-content-gap': emptyState.content.gap,
    '--empty-content-max': emptyState.content.maxWidth,
    '--empty-icon-color': emptyState.icon.color,
    '--empty-icon-opacity': emptyState.icon.opacity,
    '--empty-icon-size-sm': emptyState.icon.size.sm,
    '--empty-icon-size-md': emptyState.icon.size.md,
    '--empty-icon-size-lg': emptyState.icon.size.lg,
    '--empty-title-color': emptyState.title.color,
    '--empty-title-weight': emptyState.title.fontWeight,
    '--empty-title-size-sm': emptyState.title.size.sm,
    '--empty-title-size-md': emptyState.title.size.md,
    '--empty-title-size-lg': emptyState.title.size.lg,
    '--empty-desc-color': emptyState.description.color,
    '--empty-desc-line-height': emptyState.description.lineHeight,
    '--empty-desc-size-sm': emptyState.description.size.sm,
    '--empty-desc-size-md': emptyState.description.size.md,
    '--empty-desc-size-lg': emptyState.description.size.lg,
    '--empty-actions-gap': emptyState.actions.gap,
    '--empty-illustration-opacity': emptyState.illustration.opacity,
    '--empty-illustration-sm': emptyState.illustration.maxWidth.sm,
    '--empty-illustration-md': emptyState.illustration.maxWidth.md,
    '--empty-illustration-lg': emptyState.illustration.maxWidth.lg
  });
  
  function getIcon() {
    if (icon === 'custom' && customIcon) return customIcon;
    
    switch (icon) {
      case 'search':
        return MagnifyingGlass;
      case 'add':
        return PlusCircle;
      case 'refresh':
        return ArrowPath;
      case 'info':
      default:
        return InformationCircle;
    }
  }
  
  function handleAction() {
    dispatch('action');
  }
  
  function handleSecondaryAction() {
    dispatch('secondaryAction');
  }
</script>

<div class="empty-state {size}" role="region" aria-label="Empty state" style={style}>
  <div class="empty-content">
    {#if illustration}
      <div class="empty-illustration">
        <img src={illustration} alt="" />
      </div>
    {:else}
      <div class="empty-icon">
        <svelte:component 
          this={getIcon()} 
          size={size === 'sm' ? 32 : size === 'md' ? 48 : 64} 
        />
      </div>
    {/if}
    
    <div class="empty-text">
      <h3 class="empty-title">{title}</h3>
      <p class="empty-description">{description}</p>
    </div>
    
    {#if actionLabel || secondaryActionLabel}
      <div class="empty-actions">
        {#if actionLabel}
          <button 
            type="button" 
            class="btn-{actionVariant}"
            on:click={handleAction}
          >
            {actionLabel}
          </button>
        {/if}
        
        {#if secondaryActionLabel}
          <button 
            type="button" 
            class="btn-secondary"
            on:click={handleSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--empty-padding, 2rem);
    min-height: var(--empty-min-height, 200px);
  }
  
  .empty-state.sm {
    padding: 1.5rem;
    min-height: 150px;
  }
  
  .empty-state.lg {
    padding: 3rem;
    min-height: 300px;
  }
  
  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--empty-content-gap, 1.5rem);
    max-width: var(--empty-content-max, 400px);
  }
  
  .empty-state.sm .empty-content {
    gap: 1rem;
    max-width: 300px;
  }
  
  .empty-state.lg .empty-content {
    gap: 2rem;
    max-width: 500px;
  }
  
  .empty-icon {
    color: var(--empty-icon-color, var(--text-ink-muted));
    opacity: var(--empty-icon-opacity, 0.6);
  }
  
  .empty-illustration {
    max-width: var(--empty-illustration-md, 200px);
    opacity: var(--empty-illustration-opacity, 0.8);
  }
  
  .empty-state.sm .empty-illustration {
    max-width: var(--empty-illustration-sm, 150px);
  }
  
  .empty-state.lg .empty-illustration {
    max-width: var(--empty-illustration-lg, 250px);
  }
  
  .empty-illustration img {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .empty-text {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .empty-title {
    margin: 0;
    color: var(--empty-title-color, var(--text-ink-primary));
    font-weight: var(--empty-title-weight, 600);
  }
  
  .empty-state.sm .empty-title {
    font-size: var(--empty-title-size-sm, 1.1rem);
  }
  
  .empty-state.md .empty-title {
    font-size: var(--empty-title-size-md, 1.25rem);
  }
  
  .empty-state.lg .empty-title {
    font-size: var(--empty-title-size-lg, 1.5rem);
  }
  
  .empty-description {
    margin: 0;
    color: var(--empty-desc-color, var(--text-ink-muted));
    line-height: var(--empty-desc-line-height, 1.5);
  }
  
  .empty-state.sm .empty-description {
    font-size: var(--empty-desc-size-sm, 0.9rem);
  }
  
  .empty-state.md .empty-description {
    font-size: var(--empty-desc-size-md, 1rem);
  }
  
  .empty-state.lg .empty-description {
    font-size: var(--empty-desc-size-lg, 1.1rem);
  }
  
  .empty-actions {
    display: flex;
    gap: var(--empty-actions-gap, 0.75rem);
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .empty-state.sm .empty-actions {
    gap: 0.5rem;
  }
  
  .empty-state.lg .empty-actions {
    gap: 1rem;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .empty-state {
      padding: 1.5rem 1rem;
    }
    
    .empty-content {
      max-width: 280px;
    }
    
    .empty-actions {
      flex-direction: column;
      width: 100%;
    }
    
    .empty-actions button {
      width: 100%;
    }
  }
  
  /* Animation for empty state appearance */
  .empty-state {
    animation: fadeInUp 0.4s ease-out;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
