<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import Chip from '$lib/components/Chip.svelte';
  import RoastLevel from '$lib/components/RoastLevel.svelte';
  import { StarMicro } from '$lib/icons';
  import { recordCard } from '$lib/ui/components/card';
  import { editableCard } from '$lib/ui/components/editable-card';
  import { imageFrame, imageSizes } from '$lib/ui/components/image';
  import { toStyleString } from '$lib/ui/style';
  import { getTransformedImageUrl } from '$lib/utils/image-utils';
  import type { BeanWithContext, Roaster } from '@shared/types';

  export let bean: BeanWithContext;
  export let roaster: Roaster | null = null;
  export let variant: 'preview' | 'inspect' = 'inspect';

  const dispatch = createEventDispatcher<{
    inspect: void;
  }>();

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
    dispatch('inspect');
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goto(`/beans/${bean.id}`);
      dispatch('inspect');
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
    '--record-card-image-bg': imageFrame.background,
    '--record-card-image-border': imageFrame.borderColor,
    '--record-card-image-border-width': imageFrame.borderWidth,
    '--record-card-image-border-style': imageFrame.borderStyle,
    '--record-card-image-radius': imageFrame.borderRadius,
    '--record-card-image-placeholder-bg': imageFrame.placeholder.background,
    '--record-card-image-placeholder-border-style': imageFrame.placeholder.borderStyle,
    '--record-card-image-width': `${imageSizes.card.width}px`,
    '--record-card-image-height': `${imageSizes.card.height}px`,
    '--preview-title-font': editableCard.title.fontFamily,
    '--preview-title-size': editableCard.title.fontSize,
    '--preview-title-weight': editableCard.title.fontWeight,
    '--preview-title-color': editableCard.title.textColor,
    '--preview-image-size': `${imageSizes.thumbnail.width}px`,
    '--preview-meta-size': editableCard.info.fontSize,
    '--preview-meta-color': editableCard.info.textColor,
    '--preview-meta-font': editableCard.info.fontFamily
  });
</script>

{#if variant === 'preview'}
  <article
    class="bean-card preview"
    style={style}
    role="link"
    tabindex="0"
    aria-label={`View ${bean.name} details`}
    on:click={handleCardClick}
    on:keydown={handleCardKeydown}
  >
    <div class="bean-preview">
      <div class="bean-preview-top">
        <span class="bean-preview-roaster">{roaster?.name || 'Roaster'}</span>
        <div class="bean-preview-chips">
          <Chip
            variant={bean.average_rating !== null && bean.average_rating !== undefined && bean.rating_count > 0 ? 'accent' : 'neutral'}
            size="sm"
          >
            <span class="rating-chip">
              {bean.average_rating !== null && bean.average_rating !== undefined && bean.rating_count > 0
                ? bean.average_rating.toFixed(1)
                : '—'}
              <StarMicro size={14} />
            </span>
          </Chip>
        </div>
      </div>
      <div class="bean-preview-title">
        <h4>{bean.name}</h4>
      </div>
      <div class="bean-preview-body">
        <div class="bean-preview-media" class:placeholder={!bean.image_path}>
          {#if bean.image_path}
            <img
              src={getTransformedImageUrl(bean.image_path, 'bean', imageSizes.card)}
              alt={bean.name}
              loading="lazy"
              on:error={(e) => e.currentTarget.style.display = 'none'}
            />
          {/if}
        </div>
        <div class="bean-preview-main">
          {#if bean.tasting_notes}
            <p class="bean-preview-notes">{bean.tasting_notes}</p>
          {:else}
            <p class="bean-preview-notes empty">No tasting notes yet.</p>
          {/if}
          {#if bean.roast_level}
            <div class="bean-preview-meta">
              <RoastLevel value={bean.roast_level} size="small" />
            </div>
          {/if}
        </div>
      </div>
    </div>
  </article>
{:else}
  <article
    class="bean-card has-media"
    style={style}
    role="link"
    tabindex="0"
    aria-label={`View ${bean.name} details`}
    on:click={handleCardClick}
    on:keydown={handleCardKeydown}
  >
    <div class="bean-card-body">
      <div class="bean-header">
        <div class="bean-header-main">
          <div class="bean-header-text">
            <div class="bean-title-row">
              <h3 class="bean-title">{bean.name}</h3>
            </div>
            <div class="bean-meta">
              {#if roaster}
                <span class="meta-item">By {roaster.name}</span>
              {/if}
            </div>
          </div>
          <div class="bean-header-status">
            {#if bean.roast_level}
              <Chip variant="neutral" size="sm">
                <RoastLevel value={bean.roast_level} size="small" />
              </Chip>
            {/if}
            <Chip variant={getOwnershipVariant(bean.ownership_status)} size="sm">
              {getOwnershipLabel(bean.ownership_status)}
            </Chip>
          </div>
        </div>
      </div>

      <div class="bean-content">
        <div class="bean-media">
          <div class="card-media" class:placeholder={!bean.image_path} aria-hidden={!bean.image_path ? 'true' : undefined}>
            {#if bean.image_path}
              <img
                src={getTransformedImageUrl(bean.image_path, 'bean', imageSizes.card)}
                alt={bean.name}
                loading="lazy"
                on:error={(e) => e.currentTarget.style.display = 'none'}
              />
            {/if}
          </div>
        </div>

        <div class="bean-details">
          {#if bean.personal_rating}
            <div class="detail-row rating-row">
              <span class="label">My Rating</span>
              <span class="value rating personal">
                {renderStars(bean.personal_rating)}
                <span class="rating-number">({bean.personal_rating}/5)</span>
              </span>
            </div>
          {/if}
          {#if bean.average_rating}
            <div class="detail-row rating-row">
              <span class="label">Community</span>
              <span class="value rating community">
                {renderStars(bean.average_rating)}
                <span class="rating-number">({bean.average_rating.toFixed(1)}/5)</span>
                {#if bean.rating_count > 0}
                  <span class="rating-count">{bean.rating_count}</span>
                {/if}
              </span>
            </div>
          {/if}

          {#if bean.country_of_origin}
            <div class="detail-row">
              <span class="label">Origin</span>
              <span class="value">{bean.country_of_origin}</span>
            </div>
          {/if}

          <div class="detail-row">
            <span class="label">Stats</span>
            <div class="value stats-chips">
              <Chip variant="neutral" size="sm">
                {bean.total_brews} {bean.total_brews === 1 ? 'brew' : 'brews'}
              </Chip>
              <Chip variant="neutral" size="sm">
                {bean.bag_count} {bean.bag_count === 1 ? 'bag' : 'bags'}
              </Chip>
            </div>
          </div>
        </div>
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
{/if}

<style>
  .bean-card {
    background: var(--record-card-bg, var(--bg-surface-paper));
    border: var(--record-card-border-width, 1px) var(--record-card-border-style, solid) var(--record-card-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-card-radius, var(--radius-md));
    padding: var(--record-card-padding, 1.5rem);
    transition: border-color var(--motion-fast);
    cursor: pointer;
    position: relative;
  }

  .bean-card.preview {
    padding: 1.1rem;
  }

  .bean-preview {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bean-preview-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .bean-preview-roaster {
    color: var(--preview-meta-color, var(--text-ink-secondary));
    font-family: var(--preview-meta-font, inherit);
    font-size: var(--preview-meta-size, 0.8rem);
    font-weight: 600;
  }

  .bean-preview-chips {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .rating-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .bean-preview-title h4 {
    margin: 0;
    font-size: var(--preview-title-size, 1rem);
    color: var(--preview-title-color, var(--text-ink-primary));
    font-family: var(--preview-title-font, inherit);
    font-weight: var(--preview-title-weight, 600);
  }

  .bean-preview-body {
    display: grid;
    grid-template-columns: var(--preview-image-size, 96px) 1fr;
    gap: 1rem;
    align-items: center;
  }

  .bean-preview-media {
    width: var(--preview-image-size, 96px);
    height: var(--preview-image-size, 96px);
    aspect-ratio: 1 / 1;
    border-radius: var(--record-card-image-radius, var(--radius-sm));
    border: var(--record-card-image-border-width, 1px) var(--record-card-image-border-style, dashed)
      var(--record-card-image-border, rgba(123, 94, 58, 0.2));
    overflow: hidden;
    background: var(--record-card-image-bg, rgba(123, 94, 58, 0.06));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bean-preview-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .bean-preview-media.placeholder {
    background: var(--record-card-image-placeholder-bg, rgba(123, 94, 58, 0.04));
    border-style: var(--record-card-image-placeholder-border-style, dashed);
  }

  .bean-preview-notes {
    margin: 0;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
    line-height: 1.4;
    max-height: 3.6em;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .bean-preview-meta {
    display: inline-flex;
    align-items: center;
    margin-top: 0.5rem;
  }

  .bean-preview-notes.empty {
    color: var(--text-ink-secondary);
  }

  .bean-card:hover {
    border-color: var(--record-card-hover-border, var(--accent-primary));
  }

  .bean-card:focus-visible {
    outline: var(--record-card-focus-width, 2px) solid var(--record-card-focus-color, rgba(176, 138, 90, 0.4));
    outline-offset: var(--record-card-focus-offset, 2px);
  }

  .card-media {
    width: min(100%, var(--record-card-image-width, 200px));
    aspect-ratio: 1 / 1;
    border-radius: var(--record-card-image-radius, var(--radius-sm));
    border: var(--record-card-image-border-width, 1px) var(--record-card-image-border-style, solid)
      var(--record-card-image-border, rgba(123, 94, 58, 0.2));
    overflow: hidden;
    background: var(--record-card-image-bg, rgba(123, 94, 58, 0.06));
  }

  .card-media.placeholder {
    background: var(--record-card-image-placeholder-bg, rgba(123, 94, 58, 0.04));
    border-style: var(--record-card-image-placeholder-border-style, dashed);
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

  .bean-header-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .bean-header-text {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .bean-header-status {
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 0.5rem;
    flex-direction: column;
    align-items: flex-end;
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

  .bean-content {
    display: grid;
    grid-template-columns: var(--record-card-image-width, 200px) minmax(200px, 1fr);
    gap: 1rem;
    align-items: start;
  }

  .bean-media {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .bean-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--record-card-detail-min-col, 120px), 1fr));
    gap: var(--record-card-detail-grid-gap, 0.5rem 1.25rem);
    margin-bottom: var(--record-card-detail-grid-margin, 1rem);
  }

  .bean-card.has-media .bean-details {
    grid-template-columns: 1fr;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .detail-row.rating-row {
    grid-column: 1 / -1;
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

  .value.stats-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
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
    margin-top: var(--record-card-detail-grid-margin, 1rem);
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

  @media (max-width: 520px) {
    .bean-title {
      font-size: 1rem;
    }

    .bean-header-main {
      flex-direction: column;
      align-items: flex-start;
    }

    .bean-content {
      grid-template-columns: 1fr;
    }

    .bean-preview-body {
      grid-template-columns: 1fr;
    }

    .bean-preview-media {
      width: min(100%, var(--preview-image-size, 96px));
      height: auto;
      margin: 0 auto;
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
