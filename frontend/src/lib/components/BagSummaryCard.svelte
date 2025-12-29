<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { PencilSquare } from '$lib/icons';
  import { summaryCard } from '$lib/ui/components/summary-card';
  import { toStyleString } from '$lib/ui/style';
  import type { BagWithBarista, Barista as BaristaType } from '@shared/types';

  export let bag: BagWithBarista;
  export let beanName: string;
  export let baristasById: Record<string, BaristaType> = {};
  export let onEditLabel: string = 'Edit bag';

  const dispatch = createEventDispatcher<{ edit: void }>();

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function getBagOwnerName(): string {
    if (bag.barista?.display_name) {
      return bag.barista.display_name;
    }
    const owner = baristasById[bag.owner_id];
    return owner ? owner.display_name : 'Unknown';
  }

  function formatInventoryStatus(status?: string): string {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function resolveStatusVariant(status?: string): 'success' | 'warning' | 'error' {
    if (status === 'getting_low') return 'warning';
    if (status === 'empty') return 'error';
    return 'success';
  }

  const style = toStyleString({
    '--summary-card-bg': summaryCard.container.background,
    '--summary-card-border': summaryCard.container.borderColor,
    '--summary-card-border-width': summaryCard.container.borderWidth,
    '--summary-card-border-style': summaryCard.container.borderStyle,
    '--summary-card-radius': summaryCard.container.borderRadius,
    '--summary-card-padding': summaryCard.container.padding,
    '--summary-card-transition': summaryCard.container.transition,
    '--summary-card-header-gap': summaryCard.header.gap,
    '--summary-card-header-margin': summaryCard.header.marginBottom,
    '--summary-card-kicker-font': summaryCard.kicker.fontFamily,
    '--summary-card-kicker-size': summaryCard.kicker.fontSize,
    '--summary-card-kicker-color': summaryCard.kicker.textColor,
    '--summary-card-title-font': summaryCard.title.fontFamily,
    '--summary-card-title-size': summaryCard.title.fontSize,
    '--summary-card-title-weight': summaryCard.title.fontWeight,
    '--summary-card-title-color': summaryCard.title.textColor,
    '--summary-card-meta-font': summaryCard.meta.fontFamily,
    '--summary-card-meta-size': summaryCard.meta.fontSize,
    '--summary-card-meta-color': summaryCard.meta.textColor,
    '--summary-card-actions-gap': summaryCard.actions.gap,
    '--summary-card-detail-gap': summaryCard.detailGrid.gap,
    '--summary-card-detail-min-col': summaryCard.detailGrid.minColumnWidth,
    '--summary-card-detail-label-font': summaryCard.detailLabel.fontFamily,
    '--summary-card-detail-label-size': summaryCard.detailLabel.fontSize,
    '--summary-card-detail-label-weight': summaryCard.detailLabel.fontWeight,
    '--summary-card-detail-label-color': summaryCard.detailLabel.textColor,
    '--summary-card-detail-value-font': summaryCard.detailValue.fontFamily,
    '--summary-card-detail-value-size': summaryCard.detailValue.fontSize,
    '--summary-card-detail-value-weight': summaryCard.detailValue.fontWeight,
    '--summary-card-detail-value-color': summaryCard.detailValue.textColor,
    '--summary-card-empty-font': summaryCard.emptyValue.fontFamily,
    '--summary-card-empty-size': summaryCard.emptyValue.fontSize,
    '--summary-card-empty-style': summaryCard.emptyValue.fontStyle,
    '--summary-card-empty-color': summaryCard.emptyValue.textColor,
    '--summary-card-status-font': summaryCard.statusPill.fontFamily,
    '--summary-card-status-size': summaryCard.statusPill.fontSize,
    '--summary-card-status-weight': summaryCard.statusPill.fontWeight,
    '--summary-card-status-radius': summaryCard.statusPill.borderRadius,
    '--summary-card-status-padding': summaryCard.statusPill.padding,
    '--summary-card-status-success-bg': summaryCard.statusPill.variants.success.background,
    '--summary-card-status-success-color': summaryCard.statusPill.variants.success.textColor,
    '--summary-card-status-warning-bg': summaryCard.statusPill.variants.warning.background,
    '--summary-card-status-warning-color': summaryCard.statusPill.variants.warning.textColor,
    '--summary-card-status-error-bg': summaryCard.statusPill.variants.error.background,
    '--summary-card-status-error-color': summaryCard.statusPill.variants.error.textColor
  });
</script>

<article class="bag-summary" style={style}>
  <div class="bag-summary-header">
    <div class="bag-summary-title">
      <p class="bag-summary-kicker">Coffee Bag</p>
      <h4>{bag.name || beanName}</h4>
      <span class="bag-summary-meta">{getBagOwnerName()}</span>
    </div>
    <div class="bag-summary-actions">
      <span class={`bag-summary-status bag-summary-status--${resolveStatusVariant(bag.inventory_status)}`}>
        {formatInventoryStatus(bag.inventory_status)}
      </span>
      <IconButton
        ariaLabel={onEditLabel}
        title={onEditLabel}
        variant="accent"
        size="sm"
        on:click={() => dispatch('edit')}
      >
        <PencilSquare />
      </IconButton>
    </div>
  </div>

  <div class="bag-summary-details">
    <div class="bag-summary-detail">
      <span class="bag-summary-label">Roasted</span>
      {#if bag.roast_date}
        <span class="bag-summary-value">{formatDate(bag.roast_date)}</span>
      {:else}
        <span class="bag-summary-empty">Not specified</span>
      {/if}
    </div>
    <div class="bag-summary-detail">
      <span class="bag-summary-label">Weight</span>
      {#if bag.weight_g}
        <span class="bag-summary-value">{bag.weight_g}g</span>
      {:else}
        <span class="bag-summary-empty">Not specified</span>
      {/if}
    </div>
    <div class="bag-summary-detail">
      <span class="bag-summary-label">Price</span>
      {#if bag.price}
        <span class="bag-summary-value">${bag.price.toFixed(2)}</span>
      {:else}
        <span class="bag-summary-empty">Not specified</span>
      {/if}
    </div>
    <div class="bag-summary-detail">
      <span class="bag-summary-label">From</span>
      {#if bag.purchase_location}
        <span class="bag-summary-value">{bag.purchase_location}</span>
      {:else}
        <span class="bag-summary-empty">Not specified</span>
      {/if}
    </div>
  </div>
</article>

<style>
  .bag-summary {
    background: var(--summary-card-bg, var(--bg-surface-paper));
    border: var(--summary-card-border-width, 1px) var(--summary-card-border-style, solid) var(--summary-card-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--summary-card-radius, var(--radius-md));
    padding: var(--summary-card-padding, 1rem);
    transition: var(--summary-card-transition, box-shadow var(--motion-fast), border-color var(--motion-fast));
  }

  .bag-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--summary-card-header-gap, 0.75rem);
    margin-bottom: var(--summary-card-header-margin, 0.75rem);
  }

  .bag-summary-title h4 {
    margin: 0.15rem 0 0 0;
    font-family: var(--summary-card-title-font, inherit);
    font-size: var(--summary-card-title-size, 1.05rem);
    font-weight: var(--summary-card-title-weight, 600);
    color: var(--summary-card-title-color, var(--text-ink-primary));
  }

  .bag-summary-kicker {
    margin: 0;
    font-family: var(--summary-card-kicker-font, inherit);
    font-size: var(--summary-card-kicker-size, 0.75rem);
    color: var(--summary-card-kicker-color, var(--text-ink-muted));
  }

  .bag-summary-meta {
    display: block;
    margin-top: 0.25rem;
    font-family: var(--summary-card-meta-font, inherit);
    font-size: var(--summary-card-meta-size, 0.9rem);
    color: var(--summary-card-meta-color, var(--text-ink-muted));
  }

  .bag-summary-actions {
    display: flex;
    align-items: center;
    gap: var(--summary-card-actions-gap, 0.5rem);
  }

  .bag-summary-status {
    font-family: var(--summary-card-status-font, inherit);
    font-size: var(--summary-card-status-size, 0.7rem);
    font-weight: var(--summary-card-status-weight, 600);
    border-radius: var(--summary-card-status-radius, 999px);
    padding: var(--summary-card-status-padding, 0.2rem 0.5rem);
    text-transform: capitalize;
    white-space: nowrap;
  }

  .bag-summary-status--success {
    background: var(--summary-card-status-success-bg, rgba(85, 98, 74, 0.18));
    color: var(--summary-card-status-success-color, var(--semantic-success));
  }

  .bag-summary-status--warning {
    background: var(--summary-card-status-warning-bg, rgba(138, 106, 62, 0.18));
    color: var(--summary-card-status-warning-color, var(--semantic-warning));
  }

  .bag-summary-status--error {
    background: var(--summary-card-status-error-bg, rgba(122, 62, 47, 0.18));
    color: var(--summary-card-status-error-color, var(--semantic-error));
  }

  .bag-summary-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--summary-card-detail-min-col, 140px), 1fr));
    gap: var(--summary-card-detail-gap, 0.5rem 1.25rem);
  }

  .bag-summary-detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bag-summary-label {
    font-family: var(--summary-card-detail-label-font, inherit);
    font-size: var(--summary-card-detail-label-size, 0.8rem);
    font-weight: var(--summary-card-detail-label-weight, 500);
    color: var(--summary-card-detail-label-color, var(--text-ink-muted));
  }

  .bag-summary-value {
    font-family: var(--summary-card-detail-value-font, inherit);
    font-size: var(--summary-card-detail-value-size, 0.9rem);
    font-weight: var(--summary-card-detail-value-weight, 600);
    color: var(--summary-card-detail-value-color, var(--text-ink-primary));
  }

  .bag-summary-empty {
    font-family: var(--summary-card-empty-font, inherit);
    font-size: var(--summary-card-empty-size, 0.9rem);
    font-style: var(--summary-card-empty-style, italic);
    color: var(--summary-card-empty-color, var(--text-ink-muted));
  }
</style>
