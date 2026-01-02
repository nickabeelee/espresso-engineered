<script lang="ts">
  import { goto } from '$app/navigation';
  import Chip from '$lib/components/Chip.svelte';
  import RoastLevel from '$lib/components/RoastLevel.svelte';
  import { recordCard } from '$lib/ui/components/card';
  import { imageSizes } from '$lib/ui/components/image';
  import { toStyleString } from '$lib/ui/style';
  import { getTransformedImageUrl } from '$lib/utils/image-utils';
  import type { BeanWithContext, Roaster } from '@shared/types';

  export let bean: BeanWithContext;
  export let roaster: Roaster | null = null;

  // Removed showActions, isDeleting, deleteError, and permissions since we only want navigation

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function getOwnershipLabel(status: string): string {
    switch (status) {
      case 'owned':
        return 'In Collection';
      case 'previously_owned':
        return 'Previously Owned';
      case 'never_owned':
        return 'Community Bean';
      default:
        return 'Unknown';
    }
  }

  function getOwnershipVariant(status: string): 'success' | 'warning' | 'neutral' {
    switch (status) {
      case 'owned':
        return 'success';
      case 'previously_owned':
        return 'warning';
      case 'never_owned':
      default:
        return 'neutral';
    }
  }

  function renderStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '');
  }

  function handleCardClick(event: MouseEvent) {
    goto(`/beans/${bean.id}`);
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goto(`/beans/${bean.id}`);
    }
  }

  const style = toStyleString({
    '--record-card-bg': recordCard.container.background,
    '--record-card-border': recordCard.container.borderColor,
    '--record-card-border-width': recordCard.container.borderWidth,
    '--record-card-border-style': recordCard.container.borderStyle,
    '--record-card-radius': recordCard.container.borderRadius,
    '--record-card-padding': recordCard.container.padding,
    '--record-card-hover-shadow': recordCard.container.hover.shadow,
    '--record-card-hover-border': recordCard.container.hover.borderColor,
    '--record-card-focus-width': recordCard.container.focusRing.width,
    '--record-card-focus-color': recordCard.container.focusRing.color,
    '--record-card-focus-offset': recordCard.container.focusRing.offset,
    '--record-card-header-gap': recordCard.header.gap,
    '--record-card-header-margin': recordCard.header.marginBottom,
    '--record-card-title-size': recordCard.title.fontSize,
    '--record-card-title-color': recordCard.title.textColor,
    '--record-card-meta-size': recordCard.meta.fontSize,
    '--record-card-meta-color': recordCard.meta.textColor,
    '--record-card-detail-grid-gap': recordCard.detailGrid.gap,
    '--record-card-detail-grid-margin': recordCard.detailGrid.marginBottom,
    '--record-card-detail-min-col': recordCard.detailGrid.minColumnWidth,
    '--record-card-detail-label-size': recordCard.detailLabel.fontSize,
    '--record-card-detail-label-color': recordCard.detailLabel.textColor,
    '--record-card-detail-label-weight': recordCard.detailLabel.fontWeight,
    '--record-card-detail-value-color': recordCard.detailValue.textColor,
    '--record-card-detail-value-weight': recordCard.detailValue.fontWeight,
    '--record-card-detail-value-font': recordCard.detailValue.fontFamily,
    '--record-card-notes-bg': recordCard.notes.background,
    '--record-card-notes-border': recordCard.notes.borderColor,
    '--record-card-notes-border-width': recordCard.notes.borderWidth,
    '--record-card-notes-radius': recordCard.notes.borderRadius,
    '--record-card-notes-padding': recordCard.notes.padding,
    '--record-card-notes-color': recordCard.notes.textColor,
    '--record-card-notes-size': recordCard.notes.fontSize,
    '--record-card-notes-line-height': recordCard.notes.lineHeight,
    '--record-card-image-width': `${imageSizes.card.width}px`,
    '--record-card-image-height': `${imageSizes.card.height}px`
  });
</script>

<article
  class="bean-card"
  style={style}
  role="link"
  tabindex="0"
  aria-label={`View ${bean.name} details`}
  on:click={handleCardClick}
  on:keydown={handleCardKeydown}
>

  <div class="bean-card-body">
    <div class="bean-header">
      <div class="bean-title-row">
        <h3 class="bean-title">{bean.name}</h3>
        <Chip variant={getOwnershipVariant(bean.ownership_status)} size="sm">
          {getOwnershipLabel(bean.ownership_status)}
        </Chip>
      </div>
      {#if bean.image_path}
        <div class="card-media">
          <img
            src={getTransformedImageUrl(bean.image_path, 'bean', imageSizes.card)}
            alt={bean.name}
            loading="lazy"
            on:error={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>
      {/if}
      <div class="bean-meta">
        {#if bean.roast_level}
          <div class="roast-level-container">
            <RoastLevel value={bean.roast_level} size="small" />
          </div>
        {/if}
        {#if roaster}
          <span class="meta-item">{roaster.name}</span>
        {/if}
        {#if bean.country_of_origin}
          <span class="meta-item origin">{bean.country_of_origin}</span>
        {/if}
        {#if bean.most_used_by_me}
          <span class="meta-item meta-flag">Most used by me</span>
        {/if}
      </div>
    </div>

    <div class="bean-chips">
      {#if roaster}
        <Chip variant="neutral" size="sm">{roaster.name}</Chip>
      {/if}
      {#if bean.most_used_by_me}
        <Chip variant="accent" size="sm">Most Used by Me</Chip>
      {/if}
    </div>

      <div class="bean-details">
        {#if bean.personal_rating}
          <div class="detail-row rating-row">
            <span class="label">My Rating:</span>
            <span class="value rating personal">
              {renderStars(bean.personal_rating)}
              <span class="rating-number">({bean.personal_rating}/5)</span>
            </span>
          </div>
        {/if}
        {#if bean.average_rating}
          <div class="detail-row rating-row">
            <span class="label">Community:</span>
            <span class="value rating community">
              {renderStars(bean.average_rating)}
              <span class="rating-number">({bean.average_rating.toFixed(1)}/5)</span>
              {#if bean.rating_count > 0}
                <span class="rating-count">{bean.rating_count}</span>
              {/if}
            </span>
          </div>
        {/if}

        <div class="detail-row">
          <span class="label">Total Brews:</span>
          <span class="value">{bean.total_brews}</span>
        </div>

        {#if bean.bag_count > 0}
          <div class="detail-row">
            <span class="label">Bags:</span>
            <span class="value">{bean.bag_count}</span>
          </div>
        {/if}
      </div>

      {#if bean.tasting_notes}
        <div class="bean-notes">
          <p class="notes-preview">
            {bean.tasting_notes.length > 100
              ? bean.tasting_notes.substring(0, 100) + '...'
              : bean.tasting_notes}
          </p>
        </div>
      {/if}

      <!-- Social signals as subtle secondary metadata -->
      {#if bean.recent_activity && bean.recent_activity.length > 0}
        <div class="social-signals">
          <span class="activity-indicator">
            Recent activity by {bean.recent_activity[0].barista_display_name}
          </span>
        </div>
      {/if}
  </div>
</article>

<style>
  .bean-card {
    background: var(--record-card-bg, var(--bg-surface-paper));
    border: var(--record-card-border-width, 1px) var(--record-card-border-style, solid) var(--record-card-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-card-radius, var(--radius-md));
    padding: var(--record-card-padding, 1.5rem);
    transition: box-shadow var(--motion-fast), border-color var(--motion-fast);
    cursor: pointer;
    position: relative;
  }

  .bean-card:hover {
    box-shadow: var(--record-card-hover-shadow, var(--shadow-soft));
    border-color: var(--record-card-hover-border, var(--accent-primary));
  }

  .bean-card:focus-visible {
    outline: var(--record-card-focus-width, 2px) solid var(--record-card-focus-color, rgba(176, 138, 90, 0.4));
    outline-offset: var(--record-card-focus-offset, 2px);
  }

  .card-media {
    width: min(100%, var(--record-card-image-width, 200px));
    aspect-ratio: 1 / 1;
    border-radius: var(--record-card-notes-radius, var(--radius-sm));
    border: 1px solid var(--record-card-border, rgba(123, 94, 58, 0.2));
    overflow: hidden;
    background: rgba(123, 94, 58, 0.06);
    margin-top: 0.75rem;
  }

  .card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .bean-header {
    display: flex;
    flex-direction: column;
    margin-bottom: var(--record-card-header-margin, 0.75rem);
    gap: var(--record-card-header-gap, 0.75rem);
  }

  .bean-heading {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bean-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .bean-title {
    margin: 0;
    font-size: var(--record-card-title-size, 1.05rem);
    color: var(--record-card-title-color, var(--text-ink-primary));
  }

  .bean-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    color: var(--record-card-meta-color, var(--text-ink-muted));
    font-size: var(--record-card-meta-size, 0.9rem);
  }

  .roast-level-container {
    display: inline-flex;
    align-items: center;
  }

  .origin {
    font-style: italic;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .meta-flag {
    color: var(--accent-primary);
    font-weight: 600;
  }

  .bean-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .bean-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--record-card-detail-min-col, 120px), 1fr));
    gap: var(--record-card-detail-grid-gap, 0.5rem 1.25rem);
    margin-bottom: var(--record-card-detail-grid-margin, 1rem);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .detail-row.rating-row {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: minmax(5.5rem, 7rem) 1fr;
    column-gap: 0.35rem;
    align-items: center;
  }

  .detail-row.rating-row .value {
    justify-self: start;
  }

  .detail-row .label {
    font-weight: var(--record-card-detail-label-weight, 500);
    color: var(--record-card-detail-label-color, var(--text-ink-secondary));
    font-size: var(--record-card-detail-label-size, 0.9rem);
  }

  .detail-row .value {
    color: var(--record-card-detail-value-color, var(--text-ink-primary));
    font-weight: var(--record-card-detail-value-weight, 600);
    font-family: var(--record-card-detail-value-font, inherit);
  }

  .value.rating {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    white-space: nowrap;
  }

  .value.rating.personal {
    color: var(--accent-primary);
  }

  .value.rating.community {
    color: var(--text-ink-secondary);
  }

  .rating-number {
    color: var(--text-ink-muted);
    font-weight: normal;
    font-size: 0.8rem;
    margin-left: 0;
  }

  .rating-count {
    color: var(--text-ink-muted);
    font-weight: normal;
    font-size: 0.75rem;
  }

  .bean-notes {
    margin-bottom: 1rem;
    padding: var(--record-card-notes-padding, 0.75rem);
    background: var(--record-card-notes-bg, rgba(123, 94, 58, 0.08));
    border-radius: var(--record-card-notes-radius, var(--radius-sm));
    border-left: var(--record-card-notes-border-width, 3px) solid var(--record-card-notes-border, var(--accent-primary));
  }

  .notes-preview {
    margin: 0;
    color: var(--record-card-notes-color, var(--text-ink-secondary));
    font-size: var(--record-card-notes-size, 0.9rem);
    line-height: var(--record-card-notes-line-height, 1.4);
    font-style: italic;
  }

  .social-signals {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(123, 94, 58, 0.15);
  }

  .activity-indicator {
    color: var(--text-ink-muted);
    font-size: 0.8rem;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .bean-title {
      font-size: 1rem;
    }

    .bean-details {
      grid-template-columns: 1fr;
    }

    .bean-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35rem;
    }

    .bean-title-row {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
