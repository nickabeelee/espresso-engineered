<script lang="ts">
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
    return !entry.yield_g || !entry.rating;
  }

  function getBrewTitle(entry: Brew): string {
    if (entry.name) return entry.name;
    return `Brew ${formatDate(entry.created_at)}`;
  }
</script>

<article class="brew-card">
  <div class="brew-header">
    <h3 class="brew-title">
      <a href="/brews/{brew.id}">{getBrewTitle(brew)}</a>
    </h3>
    <div class="brew-chips">
      <span class="status-chip" class:draft={isDraft(brew)} class:complete={!isDraft(brew)}>
        {isDraft(brew) ? 'Draft' : 'Complete'}
      </span>
      {#if baristaName}
        <span class="barista-chip">{baristaName}</span>
      {/if}
    </div>
  </div>

  <div class="brew-meta">
    <span class="brew-date">
      {formatDate(brew.created_at)} at {formatTime(brew.created_at)}
    </span>
  </div>

  <div class="brew-details">
    <div class="detail-row">
      <span class="label">Dose:</span>
      <span class="value">{brew.dose_g.toFixed(1)}g</span>
    </div>

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
      <div class="detail-row">
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

  <div class="brew-actions">
    <a href="/brews/{brew.id}" class="btn-secondary">View</a>
    {#if isDraft(brew)}
      <a href="/brews/{brew.id}?edit=true" class="btn-primary">Complete</a>
    {/if}
  </div>
</article>

<style>
  .brew-card {
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    transition: box-shadow var(--motion-fast), border-color var(--motion-fast);
  }

  .brew-card:hover {
    box-shadow: var(--shadow-soft);
    border-color: var(--accent-primary);
  }

  .brew-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
    gap: 0.75rem;
  }

  .brew-title {
    margin: 0;
    font-size: 1.25rem;
  }

  .brew-title a {
    color: var(--text-ink-primary);
    text-decoration: none;
  }

  .brew-title a:hover {
    color: var(--accent-primary);
  }

  .brew-chips {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: flex-end;
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
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(123, 94, 58, 0.12);
    color: var(--text-ink-secondary);
    border: 1px solid rgba(123, 94, 58, 0.25);
  }

  .brew-meta {
    margin-bottom: 1rem;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .brew-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-row .label {
    font-weight: 500;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
  }

  .detail-row .value {
    color: var(--text-ink-primary);
    font-weight: 600;
  }

  .value.rating {
    color: var(--accent-primary);
  }

  .rating-number {
    color: var(--text-ink-muted);
    font-weight: normal;
    font-size: 0.8rem;
    margin-left: 0.25rem;
  }

  .brew-notes {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgba(123, 94, 58, 0.08);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--accent-primary);
  }

  .notes-preview {
    margin: 0;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
    font-style: italic;
  }

  .brew-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  @media (max-width: 768px) {
    .brew-details {
      grid-template-columns: 1fr;
    }

    .brew-chips {
      align-items: flex-start;
    }
  }
</style>
