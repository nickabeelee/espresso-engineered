<script lang="ts">
  import { goto } from '$app/navigation';
  import Chip from '$lib/components/Chip.svelte';
  import { StarMicro } from '$lib/icons';
  import { recordCard } from '$lib/ui/components/card';
  import { imageFrame, imageSizes } from '$lib/ui/components/image';
  import { toStyleString } from '$lib/ui/style';
  import { getTransformedImageUrl } from '$lib/utils/image-utils';

  export let brew: Brew;
  export let baristaName: string | null = null;
  export let beanName: string | null = null;
  export let beanImagePath: string | null = null;
  export let grinderImagePath: string | null = null;
  export let machineImagePath: string | null = null;
  export let variant: 'detail' | 'summary' = 'detail';

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function formatShortDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function isDraft(entry: Brew): boolean {
    return !entry.rating || !entry.tasting_notes || !entry.reflections;
  }

  function getBrewTitle(entry: Brew): string {
    if (entry.name) return entry.name;
    return `Brew ${formatDate(entry.created_at)}`;
  }

  function formatRatio(value?: number): string {
    if (!value) return '—';
    return `1:${value.toFixed(2)}`;
  }

  function formatBrewTime(value?: number): string {
    if (!value) return '—';
    const rounded = Math.round(value * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}s`;
  }

  function getDisplayRating(): string {
    if (typeof brew.rating !== 'number') return '—';
    return `${Math.round(brew.rating)}`;
  }

  function handleCardClick() {
    goto(`/brews/${brew.id}`);
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goto(`/brews/${brew.id}`);
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
    '--brew-thumb-bg': imageFrame.background,
    '--brew-thumb-border': imageFrame.borderColor,
    '--brew-thumb-border-width': imageFrame.borderWidth,
    '--brew-thumb-border-style': imageFrame.borderStyle,
    '--brew-thumb-radius': imageFrame.borderRadius
  });
</script>

<article
  class="brew-card"
  class:summary={variant === 'summary'}
  style={style}
  role="link"
  tabindex="0"
  aria-label={`View ${getBrewTitle(brew)}`}
  on:click={handleCardClick}
  on:keydown={handleCardKeydown}
>
  {#if variant === 'summary'}
    <div class="brew-summary">
      <div class="summary-top">
        <span class="summary-meta summary-barista">{baristaName ?? 'Unknown barista'}</span>
        <div class="summary-chips">
          <Chip variant={isDraft(brew) ? 'warning' : 'success'} size="sm">
            {isDraft(brew) ? 'Draft' : 'Complete'}
          </Chip>
          <Chip variant={typeof brew.rating === 'number' ? 'accent' : 'neutral'} size="sm">
            <span class="rating-chip">
              {getDisplayRating()}
              <StarMicro size={14} />
            </span>
          </Chip>
        </div>
      </div>

      <h3 class="summary-title">{beanName ?? getBrewTitle(brew)}</h3>
      <p class="summary-meta">{formatShortDate(brew.created_at)} · {formatTime(brew.created_at)}</p>

      <div class="summary-kpis">
        <span class="kpi">Grind: {brew.grind_setting ?? '—'}</span>
        <span class="kpi">{formatRatio(brew.ratio)}</span>
        <span class="kpi">{formatBrewTime(brew.brew_time_s)}</span>
      </div>

      <div class="summary-thumbs">
        <div class="thumb-frame" class:placeholder={!beanImagePath} aria-hidden={!beanImagePath ? 'true' : undefined}>
          {#if beanImagePath}
            <img
              src={getTransformedImageUrl(beanImagePath, 'bean', imageSizes.card)}
              alt={beanName ?? 'Bean'}
              loading="lazy"
            />
          {/if}
        </div>
        <div class="thumb-frame" class:placeholder={!grinderImagePath} aria-hidden={!grinderImagePath ? 'true' : undefined}>
          {#if grinderImagePath}
            <img
              src={getTransformedImageUrl(grinderImagePath, 'grinder', imageSizes.card)}
              alt="Grinder"
              loading="lazy"
            />
          {/if}
        </div>
        <div class="thumb-frame" class:placeholder={!machineImagePath} aria-hidden={!machineImagePath ? 'true' : undefined}>
          {#if machineImagePath}
            <img
              src={getTransformedImageUrl(machineImagePath, 'machine', imageSizes.card)}
              alt="Machine"
              loading="lazy"
            />
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="brew-header">
      <div class="brew-chips">
        <span class="brew-barista">{baristaName ?? 'Unknown barista'}</span>
        <div class="status-group">
          {#if isDraft(brew)}
            <a
              href="/brews/{brew.id}?reflect=true"
              class="action-link"
              on:click|stopPropagation
            >
              Complete
            </a>
          {/if}
          <Chip variant={isDraft(brew) ? 'warning' : 'success'} size="sm">
            {isDraft(brew) ? 'Draft' : 'Complete'}
          </Chip>
          <Chip variant={typeof brew.rating === 'number' ? 'accent' : 'neutral'} size="sm">
            <span class="rating-chip">
              {getDisplayRating()}
              <StarMicro size={14} />
            </span>
          </Chip>
        </div>
      </div>
      <div class="brew-heading">
        <h3 class="brew-title">{getBrewTitle(brew)}</h3>
        <span class="brew-date">
          {formatDate(brew.created_at)} at {formatTime(brew.created_at)}
        </span>
      </div>
    </div>

    <div class="detail-kpis summary-kpis">
      <span class="kpi">Grind: {brew.grind_setting ?? '—'}</span>
      <span class="kpi">{formatRatio(brew.ratio)}</span>
      <span class="kpi">{formatBrewTime(brew.brew_time_s)}</span>
    </div>

    <div class="brew-details">
      <div class="detail-row">
        <span class="label">Dose:</span>
        <span class="value">{brew.dose_g.toFixed(1)}g</span>
      </div>

      {#if brew.flow_rate_g_per_s}
        <div class="detail-row">
          <span class="label">Flow rate:</span>
          <span class="value">{brew.flow_rate_g_per_s.toFixed(1)} g/s</span>
        </div>
      {/if}

    </div>

    {#if brew.tasting_notes}
      <div class="brew-notes">
        <p class="notes-preview">
          {brew.tasting_notes.length > 100
            ? brew.tasting_notes.substring(0, 100) + '...'
            : brew.tasting_notes}
        </p>
      </div>
    {/if}

    <div class="detail-media summary-thumbs">
      <div class="thumb-frame" class:placeholder={!beanImagePath} aria-hidden={!beanImagePath ? 'true' : undefined}>
        {#if beanImagePath}
          <img
            src={getTransformedImageUrl(beanImagePath, 'bean', imageSizes.card)}
            alt={beanName ?? 'Bean'}
            loading="lazy"
          />
        {/if}
      </div>
      <div class="thumb-frame" class:placeholder={!grinderImagePath} aria-hidden={!grinderImagePath ? 'true' : undefined}>
        {#if grinderImagePath}
          <img
            src={getTransformedImageUrl(grinderImagePath, 'grinder', imageSizes.card)}
            alt="Grinder"
            loading="lazy"
          />
        {/if}
      </div>
      <div class="thumb-frame" class:placeholder={!machineImagePath} aria-hidden={!machineImagePath ? 'true' : undefined}>
        {#if machineImagePath}
          <img
            src={getTransformedImageUrl(machineImagePath, 'machine', imageSizes.card)}
            alt="Machine"
            loading="lazy"
          />
        {/if}
      </div>
    </div>
  {/if}
</article>

<style>
  .brew-card {
    background: var(--record-card-bg, var(--bg-surface-paper));
    border: var(--record-card-border-width, 1px) var(--record-card-border-style, solid) var(--record-card-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-card-radius, var(--radius-md));
    padding: var(--record-card-padding, 1.5rem);
    transition: border-color var(--motion-fast);
    cursor: pointer;
  }

  .brew-card:hover {
    border-color: var(--record-card-hover-border, var(--accent-primary));
  }

  .brew-card:focus-visible {
    outline: var(--record-card-focus-width, 2px) solid var(--record-card-focus-color, rgba(176, 138, 90, 0.4));
    outline-offset: var(--record-card-focus-offset, 2px);
  }

  .brew-card.summary {
    padding: 1.1rem;
  }

  .brew-summary {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .summary-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .summary-chips {
    display: flex;
    justify-content: flex-end;
    gap: 0.4rem;
  }

  .rating-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .summary-title {
    margin: 0;
    font-size: 1.05rem;
    color: var(--text-ink-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .summary-meta {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-ink-muted);
  }

  .summary-barista {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 45%;
  }

  .summary-kpis {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.98rem;
    color: var(--text-ink-secondary);
    flex-wrap: wrap;
  }

  .detail-kpis {
    margin-bottom: 0.85rem;
  }

  .summary-kpis .kpi {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 700;
    font-family: var(--record-card-detail-value-font, inherit);
    letter-spacing: 0.01em;
  }

  .summary-kpis .kpi:not(:last-child)::after {
    content: '•';
    color: var(--text-ink-muted);
    margin-left: 0.35rem;
  }

  .summary-thumbs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .thumb-frame {
    flex: 1 1 0;
    aspect-ratio: 1 / 1;
    border-radius: var(--brew-thumb-radius, 12px);
    border: var(--brew-thumb-border-width, 1px) var(--brew-thumb-border-style, solid) var(--brew-thumb-border, rgba(123, 94, 58, 0.2));
    background: var(--brew-thumb-bg, rgba(123, 94, 58, 0.06));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .thumb-frame.placeholder {
    border-style: dashed;
    background: rgba(123, 94, 58, 0.04);
  }

  .thumb-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .brew-header {
    display: flex;
    flex-direction: column;
    margin-bottom: var(--record-card-header-margin, 0.75rem);
    gap: var(--record-card-header-gap, 0.75rem);
  }

  .brew-heading {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .brew-title {
    margin: 0;
    font-size: var(--record-card-title-size, 1.05rem);
  }

  .brew-title {
    color: var(--record-card-title-color, var(--text-ink-primary));
  }

  .brew-date {
    color: var(--record-card-meta-color, var(--text-ink-muted));
    font-size: var(--record-card-meta-size, 0.9rem);
  }

  .brew-chips {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .brew-barista {
    color: var(--text-ink-muted);
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 45%;
  }

  .status-group {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-left: auto;
  }

  .brew-details {
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
    color: var(--accent-primary);
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    white-space: nowrap;
  }

  .rating-number {
    color: var(--text-ink-muted);
    font-weight: normal;
    font-size: 0.8rem;
    margin-left: 0;
  }

  .brew-notes {
    margin-bottom: 0;
    padding: var(--record-card-notes-padding, 0.75rem);
    background: var(--record-card-notes-bg, rgba(123, 94, 58, 0.08));
    border-radius: var(--record-card-notes-radius, var(--radius-sm));
    border-left: var(--record-card-notes-border-width, 3px) solid var(--record-card-notes-border, var(--accent-primary));
  }

  .detail-media {
    margin-top: 0.9rem;
  }

  .notes-preview {
    margin: 0;
    color: var(--record-card-notes-color, var(--text-ink-secondary));
    font-size: var(--record-card-notes-size, 0.9rem);
    line-height: var(--record-card-notes-line-height, 1.4);
    font-style: italic;
  }

  .action-link {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--accent-primary);
    text-decoration: none;
  }

  .action-link:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .brew-title {
      font-size: 1rem;
    }

    .brew-details {
      grid-template-columns: 1fr;
    }

    .brew-chips {
      align-items: center;
    }

    .barista-chip {
      max-width: 100%;
    }

    .brew-card.summary {
      padding: 1rem;
    }

    .summary-thumbs {
      gap: 0.5rem;
    }
  }
</style>
