<script lang="ts">
  import { formSection } from '$lib/ui/components/form';
  import { sectionSurface } from '$lib/ui/components/card';
  import { spacing } from '$lib/ui/foundations/spacing';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';

  export let title: string | null = null;

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
    '--section-header-margin': spacing.lg
  });
</script>

<section class="section-card" style={style}>
  <header class="section-header">
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
  </header>
  <div class="section-body">
    <slot />
  </div>
  {#if $$slots.actions}
    <div class="section-actions">
      <slot name="actions" />
    </div>
  {/if}
</section>

<style>
  .section-card {
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
