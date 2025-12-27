<script lang="ts">
  import { goto } from '$app/navigation';
  import Chip from '$lib/components/Chip.svelte';
  import RoastLevel from '$lib/components/RoastLevel.svelte';
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
</script>

<article
  class="bean-card"
  role="link"
  tabindex="0"
  aria-label={`View ${bean.name} details`}
  on:click={handleCardClick}
  on:keydown={handleCardKeydown}
>

  <div class="bean-header">
    <div class="bean-chips">
      {#if roaster}
        <Chip variant="neutral" size="sm">{roaster.name}</Chip>
      {/if}
      <div class="status-group">
        {#if bean.most_used_by_me}
          <Chip variant="accent" size="sm">Most Used by Me</Chip>
        {/if}
        <Chip variant={getOwnershipVariant(bean.ownership_status)} size="sm">
          {getOwnershipLabel(bean.ownership_status)}
        </Chip>
      </div>
    </div>
    <div class="bean-heading">
      <h3 class="bean-title">{bean.name}</h3>
      <div class="bean-meta">
        {#if bean.roast_level}
          <div class="roast-level-container">
            <RoastLevel value={bean.roast_level} size="small" />
          </div>
        {/if}
        {#if bean.country_of_origin}
          <span class="origin">{bean.country_of_origin}</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="bean-details">
    {#if bean.personal_rating}
      <div class="detail-row">
        <span class="label">My Rating:</span>
        <span class="value rating personal">
          {renderStars(bean.personal_rating)}
          <span class="rating-number">({bean.personal_rating}/5)</span>
        </span>
      </div>
    {:else if bean.average_rating}
      <div class="detail-row">
        <span class="label">Community:</span>
        <span class="value rating community">
          {renderStars(bean.average_rating)}
          <span class="rating-number">({bean.average_rating.toFixed(1)}/5)</span>
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

    {#if bean.rating_count > 0}
      <div class="detail-row">
        <span class="label">Ratings:</span>
        <span class="value">{bean.rating_count}</span>
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
</article>

<style>
  .bean-card {
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    transition: box-shadow var(--motion-fast), border-color var(--motion-fast);
    cursor: pointer;
    position: relative;
  }

  .bean-card:hover {
    box-shadow: var(--shadow-soft);
    border-color: var(--accent-primary);
  }

  .bean-card:focus-visible {
    outline: 2px solid rgba(176, 138, 90, 0.4);
    outline-offset: 2px;
  }

  .bean-header {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.75rem;
    gap: 0.75rem;
  }

  .bean-heading {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bean-title {
    margin: 0;
    font-size: 1.05rem;
    color: var(--text-ink-primary);
  }

  .bean-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .roast-level-container {
    display: flex;
    align-items: center;
  }

  .origin {
    font-style: italic;
  }

  .bean-chips {
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

  .bean-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem 1.25rem;
    margin-bottom: 1rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
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

  .bean-notes {
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

    .bean-chips {
      align-items: center;
    }

    .bean-meta {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>