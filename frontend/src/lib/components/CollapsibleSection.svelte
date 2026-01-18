<script lang="ts">
  import { formSection } from '$lib/ui/components/form';
  import { sectionSurface } from '$lib/ui/components/card';
  import { spacing } from '$lib/ui/foundations/spacing';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import { ChevronDown } from '$lib/icons';

  export let title: string | null = null;
  export let open = true;
  export let toggleLabel: string | null = null;
  export let disabled = false;

  const contentId = `collapsible-${Math.random().toString(36).slice(2, 9)}`;

  $: resolvedToggleLabel = toggleLabel ?? (title ? `Toggle ${title}` : 'Toggle section');

  const style = toStyleString({
    '--section-bg': sectionSurface.background,
    '--section-border': sectionSurface.borderColor,
    '--section-border-width': sectionSurface.borderWidth,
    '--section-border-style': sectionSurface.borderStyle,
    '--section-radius': sectionSurface.borderRadius,
    '--section-padding': sectionSurface.padding,
    '--section-title-color': formSection.title.textColor,
    '--section-title-size': textStyles.headingTertiary.fontSize,
    '--section-title-weight': textStyles.headingTertiary.fontWeight,
    '--section-title-family': textStyles.headingTertiary.fontFamily,
    '--section-title-line-height': textStyles.headingTertiary.lineHeight,
    '--section-title-border': formSection.title.borderColor,
    '--section-title-border-width': formSection.title.borderWidth,
    '--section-header-margin': spacing.lg,
    '--section-toggle-hover': 'rgba(123, 94, 58, 0.08)'
  });

  function handleToggle() {
    if (disabled) return;
    open = !open;
  }
</script>

<section class="collapsible-section" style={style}>
  <header class="section-header" class:isCollapsed={!open}>
    <div class="section-title">
      {#if $$slots.title}
        <slot name="title" />
      {:else if title}
        <h3>{title}</h3>
      {/if}
    </div>
    {#if $$slots.headerActions}
      <div class="section-header-actions">
        <slot name="headerActions" />
      </div>
    {/if}
    <button
      class="section-toggle"
      type="button"
      aria-expanded={open}
      aria-controls={contentId}
      aria-label={resolvedToggleLabel}
      on:click={handleToggle}
      disabled={disabled}
    >
      <span class:chevronOpen={open}>
        <ChevronDown size={18} />
      </span>
    </button>
  </header>
  {#if open}
    <div class="section-body" id={contentId}>
      <slot />
    </div>
    {#if $$slots.actions}
      <div class="section-actions">
        <slot name="actions" />
      </div>
    {/if}
  {/if}
</section>

<style>
  .collapsible-section {
    background: var(--section-bg);
    border: var(--section-border-width) var(--section-border-style) var(--section-border);
    border-radius: var(--section-radius);
    padding: var(--section-padding);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: var(--section-header-margin);
  }

  .section-header.isCollapsed {
    margin-bottom: 0;
  }

  .section-title {
    color: var(--section-title-color);
    font-size: var(--section-title-size);
    font-weight: var(--section-title-weight);
    font-family: var(--section-title-family);
    line-height: var(--section-title-line-height);
  }

  .section-title h3 {
    margin: 0;
    font: inherit;
    color: inherit;
  }

  .section-toggle {
    border: none;
    background: transparent;
    color: var(--section-title-color);
    padding: 0.25rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .section-toggle:hover:not(:disabled) {
    background: var(--section-toggle-hover);
  }

  .section-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .section-toggle span {
    display: inline-flex;
    align-items: center;
    transition: transform 0.2s ease;
  }

  .section-toggle span.chevronOpen {
    transform: rotate(0deg);
  }

  .section-toggle span:not(.chevronOpen) {
    transform: rotate(-90deg);
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 0.75rem;
    border-top: var(--section-title-border-width) solid var(--section-title-border);
  }
</style>
