<script lang="ts">
  import { goto } from '$app/navigation';
  import { recordCard } from '$lib/ui/components/card';
  import { toStyleString } from '$lib/ui/style';

  export let brew: Brew;
  export let baristaName: string | null = null;

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
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
    '--record-card-notes-line-height': recordCard.notes.lineHeight
  });
</script>

<article
  class="brew-card"
  style={style}
  role="link"
  tabindex="0"
  aria-label={`View ${getBrewTitle(brew)}`}
  on:click={handleCardClick}
  on:keydown={handleCardKeydown}
>
  <div class="brew-header">
    <div class="brew-chips">
      {#if baristaName}
        <span class="barista-chip">{baristaName}</span>
      {/if}
      <div class="status-group">
        {#if isDraft(brew)}
          <a
            href="/brews/{brew.id}?edit=true"
            class="action-link"
            on:click|stopPropagation
          >
            Complete
          </a>
        {/if}
        <span class="status-chip" class:draft={isDraft(brew)} class:complete={!isDraft(brew)}>
          {isDraft(brew) ? 'Draft' : 'Complete'}
        </span>
      </div>
    </div>
    <div class="brew-heading">
      <h3 class="brew-title">{getBrewTitle(brew)}</h3>
      <span class="brew-date">
        {formatDate(brew.created_at)} at {formatTime(brew.created_at)}
      </span>
    </div>
  </div>

  <div class="brew-details">
    <div class="detail-row">
      <span class="label">Dose:</span>
      <span class="value">{brew.dose_g.toFixed(1)}g</span>
    </div>

    {#if brew.grind_setting}
      <div class="detail-row">
        <span class="label">Grind:</span>
        <span class="value">{brew.grind_setting}</span>
      </div>
    {/if}

    {#if brew.yield_g}
      <div class="detail-row">
        <span class="label">Yield:</span>
        <span class="value">{brew.yield_g.toFixed(1)}g</span>
      </div>
    {/if}

    {#if brew.ratio}
      <div class="detail-row">
        <span class="label">Ratio:</span>
        <span class="value">1:{brew.ratio.toFixed(2)}</span>
      </div>
    {/if}

    {#if brew.brew_time_s}
      <div class="detail-row">
        <span class="label">Time:</span>
        <span class="value">{brew.brew_time_s.toFixed(1)}s</span>
      </div>
    {/if}

    {#if brew.rating}
      <div class="detail-row rating-row">
        <span class="label">Rating:</span>
        <span class="value rating">
          {'★'.repeat(Math.floor(brew.rating))}
          {brew.rating % 1 !== 0 ? '½' : ''}
          <span class="rating-number">({brew.rating}/10)</span>
        </span>
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

</article>

<style>
  .brew-card {
    background: var(--record-card-bg, var(--bg-surface-paper));
    border: var(--record-card-border-width, 1px) var(--record-card-border-style, solid) var(--record-card-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-card-radius, var(--radius-md));
    padding: var(--record-card-padding, 1.5rem);
    transition: box-shadow var(--motion-fast), border-color var(--motion-fast);
    cursor: pointer;
  }

  .brew-card:hover {
    box-shadow: var(--record-card-hover-shadow, var(--shadow-soft));
    border-color: var(--record-card-hover-border, var(--accent-primary));
  }

  .brew-card:focus-visible {
    outline: var(--record-card-focus-width, 2px) solid var(--record-card-focus-color, rgba(176, 138, 90, 0.4));
    outline-offset: var(--record-card-focus-offset, 2px);
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

  .status-group {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-left: auto;
  }

  .status-chip {
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid transparent;
  }

  .status-chip.draft {
    background: rgba(138, 106, 62, 0.18);
    color: var(--semantic-warning);
    border-color: rgba(138, 106, 62, 0.35);
  }

  .status-chip.complete {
    background: rgba(85, 98, 74, 0.18);
    color: var(--semantic-success);
    border-color: rgba(85, 98, 74, 0.35);
  }

  .barista-chip {
    display: inline-block;
    padding: 0.2rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(123, 94, 58, 0.12);
    color: var(--text-ink-secondary);
    border: 1px solid rgba(123, 94, 58, 0.25);
    max-width: 14rem;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .brew-meta {
    margin-bottom: 1rem;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
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
  }
</style>
