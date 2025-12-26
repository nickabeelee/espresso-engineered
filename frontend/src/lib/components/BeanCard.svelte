<script lang="ts">
  import { goto } from '$app/navigation';
  import { createEventDispatcher } from 'svelte';
  import { barista } from '$lib/auth';
  import { getBeanPermissions, handlePermissionError } from '$lib/permissions';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import { PencilSquare, Trash } from '$lib/icons';
  import type { BeanWithContext, Roaster } from '@shared/types';

  export let bean: BeanWithContext;
  export let roaster: Roaster | null = null;

  const dispatch = createEventDispatcher<{
    beanUpdated: BeanWithContext;
    beanDeleted: string;
  }>();

  let showActions = false;
  let isDeleting = false;
  let deleteError: string | null = null;

  $: permissions = getBeanPermissions($barista, bean);

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

  function getOwnershipClass(status: string): string {
    switch (status) {
      case 'owned':
        return 'owned';
      case 'previously_owned':
        return 'previously-owned';
      case 'never_owned':
        return 'community';
      default:
        return 'unknown';
    }
  }

  function renderStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '');
  }

  function handleCardClick(event: MouseEvent) {
    // Don't navigate if clicking on action buttons
    if ((event.target as HTMLElement).closest('.bean-actions')) {
      return;
    }
    goto(`/beans/${bean.id}`);
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goto(`/beans/${bean.id}`);
    }
  }

  function handleMouseEnter() {
    showActions = true;
  }

  function handleMouseLeave() {
    showActions = false;
    deleteError = null;
  }

  function handleEditClick(event: MouseEvent) {
    event.stopPropagation();
    // TODO: Implement bean editing modal/form
    console.log('Edit bean:', bean.id);
  }

  async function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    
    if (!permissions.canDelete) {
      deleteError = 'Only administrators can delete beans.';
      return;
    }

    if (!confirm(`Are you sure you want to delete "${bean.name}"? This action cannot be undone.`)) {
      return;
    }

    isDeleting = true;
    deleteError = null;

    try {
      await apiClient.delete(`/admin/beans/${bean.id}`);
      dispatch('beanDeleted', bean.id);
    } catch (error) {
      deleteError = handlePermissionError(error as Error, 'delete', 'bean');
      console.error('Failed to delete bean:', error);
    } finally {
      isDeleting = false;
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
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <!-- Permission-based action controls -->
  {#if showActions && (permissions.canEdit || permissions.canDelete)}
    <div class="bean-actions">
      {#if permissions.canEdit}
        <IconButton
          type="button"
          ariaLabel="Edit bean"
          title="Edit bean"
          variant="neutral"
          size="sm"
          on:click={handleEditClick}
        >
          <PencilSquare />
        </IconButton>
      {/if}
      
      {#if permissions.canDelete}
        <IconButton
          type="button"
          ariaLabel="Delete bean"
          title="Delete bean"
          variant="danger"
          size="sm"
          disabled={isDeleting}
          on:click={handleDeleteClick}
        >
          <Trash />
        </IconButton>
      {/if}
    </div>
  {/if}

  <!-- Permission error display -->
  {#if deleteError}
    <div class="permission-error">
      {deleteError}
    </div>
  {/if}
  <div class="bean-header">
    <div class="bean-chips">
      {#if roaster}
        <span class="roaster-chip">{roaster.name}</span>
      {/if}
      <div class="status-group">
        {#if bean.most_used_by_me}
          <span class="most-used-chip">Most Used by Me</span>
        {/if}
        <span class="ownership-chip {getOwnershipClass(bean.ownership_status)}">
          {getOwnershipLabel(bean.ownership_status)}
        </span>
      </div>
    </div>
    <div class="bean-heading">
      <h3 class="bean-title">{bean.name}</h3>
      <div class="bean-meta">
        {#if bean.roast_level}
          <span class="roast-level">{bean.roast_level}</span>
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

  .bean-actions {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: flex;
    gap: 0.25rem;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-sm);
    padding: 0.25rem;
    box-shadow: var(--shadow-soft);
    z-index: 10;
  }

  .permission-error {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    right: 0.75rem;
    background: var(--semantic-error-bg);
    color: var(--semantic-error);
    border: 1px solid var(--semantic-error);
    border-radius: var(--radius-sm);
    padding: 0.5rem;
    font-size: 0.8rem;
    z-index: 10;
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
    gap: 0.75rem;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .roast-level {
    font-weight: 500;
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

  .ownership-chip {
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid transparent;
  }

  .ownership-chip.owned {
    background: rgba(85, 98, 74, 0.18);
    color: var(--semantic-success);
    border-color: rgba(85, 98, 74, 0.35);
  }

  .ownership-chip.previously-owned {
    background: rgba(138, 106, 62, 0.18);
    color: var(--semantic-warning);
    border-color: rgba(138, 106, 62, 0.35);
  }

  .ownership-chip.community {
    background: rgba(123, 94, 58, 0.12);
    color: var(--text-ink-secondary);
    border-color: rgba(123, 94, 58, 0.25);
  }

  .most-used-chip {
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(176, 138, 90, 0.18);
    color: var(--accent-primary);
    border: 1px solid rgba(176, 138, 90, 0.35);
  }

  .roaster-chip {
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

    .roaster-chip {
      max-width: 100%;
    }

    .bean-meta {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>