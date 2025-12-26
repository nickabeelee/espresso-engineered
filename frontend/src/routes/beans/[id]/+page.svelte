<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import BeanRating from '$lib/components/BeanRating.svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import { XMark, PencilSquare } from '$lib/icons';
  import type { BeanWithContext, Roaster, Bag, Barista as BaristaType } from '@shared/types';

  let bean: BeanWithContext | null = null;
  let roaster: Roaster | null = null;
  let bags: Bag[] = [];
  let baristasById: Record<string, BaristaType> = {};
  let loading = true;
  let error: string | null = null;
  let personalRating: number | null = null;

  $: beanId = $page.params.id;

  onMount(async () => {
    if (beanId) {
      await loadBeanDetails(beanId);
    }
  });

  async function loadBeanDetails(id: string) {
    loading = true;
    error = null;
    
    try {
      const [beanResponse, roastersResponse, bagsResponse, baristasResponse] = await Promise.all([
        apiClient.getBean(id),
        apiClient.getRoasters(),
        apiClient.getBags(),
        apiClient.getBaristas()
      ]);

      if (beanResponse.data) {
        bean = beanResponse.data;
        personalRating = bean.personal_rating || null;
        
        // Find the roaster for this bean
        roaster = roastersResponse.data.find(r => r.id === bean.roaster_id) || null;
        
        // Filter bags for this bean
        bags = bagsResponse.data.filter(bag => bag.bean_id === bean.id);
        
        // Create baristas lookup
        baristasById = baristasResponse.data.reduce<Record<string, BaristaType>>((acc, barista) => {
          acc[barista.id] = barista;
          return acc;
        }, {});
      } else {
        throw new Error('Bean not found');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load bean details';
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    goto('/beans');
  }

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

  function getBagOwnershipStatus(bag: Bag): 'owned' | 'other' {
    return bag.owner_id === $barista?.id ? 'owned' : 'other';
  }

  function getBagOwnerName(bag: Bag): string {
    const owner = baristasById[bag.owner_id];
    return owner ? owner.display_name : 'Unknown';
  }

  function formatInventoryStatus(status?: string): string {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  async function handleRatingChanged(event: CustomEvent<{ rating: number | null }>) {
    // Update the local state and reload bean details to get fresh data
    personalRating = event.detail.rating;
    if (bean) {
      bean.personal_rating = event.detail.rating;
    }
    
    // Optionally reload to get updated community average
    if (beanId) {
      await loadBeanDetails(beanId);
    }
  }
</script>

<svelte:head>
  <title>{bean?.name || 'Bean'} - Espresso Engineered</title>
  <meta name="description" content="View bean details and associated bags" />
</svelte:head>

<AuthGuard>
  <div class="bean-detail-page">
    <header>
      <div>
        <h1>{bean?.name || 'Bean Details'}</h1>
        {#if roaster}
          <p class="roaster-name">{roaster.name}</p>
        {/if}
      </div>
      
      <div class="actions">
        <IconButton on:click={handleClose} ariaLabel="Back to beans" title="Close" variant="neutral" disabled={loading}>
          <XMark />
        </IconButton>
      </div>
    </header>

    {#if loading}
      <div class="loading">Loading bean details...</div>
    {:else if error}
      <div class="error">Error: {error}</div>
    {:else if bean}
      <div class="bean-content">
        <!-- Bean Information -->
        <div class="detail-section card">
          <h3>Bean Information</h3>
          <div class="bean-info-grid">
            <div class="info-item">
              <span class="info-label">Name</span>
              <span class="info-value">{bean.name}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Roaster</span>
              <span class="info-value">{roaster?.name || 'Unknown'}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Roast Level</span>
              <span class="info-value">{bean.roast_level}</span>
            </div>
            
            {#if bean.country_of_origin}
              <div class="info-item">
                <span class="info-label">Origin</span>
                <span class="info-value">{bean.country_of_origin}</span>
              </div>
            {/if}
            
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="ownership-chip {getOwnershipClass(bean.ownership_status)}">
                {getOwnershipLabel(bean.ownership_status)}
              </span>
            </div>
            
            {#if bean.most_used_by_me}
              <div class="info-item">
                <span class="info-label">Usage</span>
                <span class="most-used-chip">Most Used by Me</span>
              </div>
            {/if}
          </div>
          
          {#if bean.tasting_notes}
            <div class="tasting-notes">
              <h4>Tasting Notes</h4>
              <p>{bean.tasting_notes}</p>
            </div>
          {/if}
        </div>

        <!-- Statistics and Rating -->
        <div class="detail-section card">
          <h3>Statistics & Rating</h3>
          
          <!-- Personal Rating Interface -->
          {#if $barista?.id}
            <div class="rating-section">
              <h4>My Rating</h4>
              <BeanRating 
                beanId={bean.id} 
                currentRating={personalRating} 
                on:ratingChanged={handleRatingChanged}
              />
            </div>
          {/if}
          
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Total Brews</span>
              <div class="stat-value">{bean.total_brews}</div>
            </div>
            
            <div class="stat-card">
              <span class="stat-label">Total Bags</span>
              <div class="stat-value">{bean.bag_count}</div>
            </div>
            
            <div class="stat-card">
              <span class="stat-label">Community Ratings</span>
              <div class="stat-value">{bean.rating_count}</div>
            </div>
            
            {#if bean.average_rating}
              <div class="stat-card">
                <span class="stat-label">Community Average</span>
                <div class="stat-value rating community">
                  {renderStars(bean.average_rating)}
                  <span class="rating-number">({bean.average_rating.toFixed(1)}/5)</span>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Recent Activity -->
        {#if bean.recent_activity && bean.recent_activity.length > 0}
          <div class="detail-section card">
            <h3>Recent Activity</h3>
            <div class="activity-list">
              {#each bean.recent_activity as activity}
                <div class="activity-item">
                  <span class="activity-text">
                    {activity.barista_display_name} 
                    {#if activity.activity_type === 'brew'}
                      brewed this bean
                    {:else if activity.activity_type === 'rating'}
                      rated this bean
                    {:else if activity.activity_type === 'bag_created'}
                      added a bag of this bean
                    {:else}
                      interacted with this bean
                    {/if}
                  </span>
                  <span class="activity-date">{formatDate(activity.created_at)}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Associated Bags -->
        <div class="detail-section card">
          <h3>Associated Bags ({bags.length})</h3>
          {#if bags.length === 0}
            <div class="empty-state">
              <p>No bags found for this bean.</p>
            </div>
          {:else}
            <div class="bags-grid">
              {#each bags as bag}
                {@const ownershipStatus = getBagOwnershipStatus(bag)}
                {@const ownerName = getBagOwnerName(bag)}
                <div class="bag-card" class:owned={ownershipStatus === 'owned'}>
                  <div class="bag-header">
                    <div class="bag-title">
                      <h4>{bag.name || bean.name}</h4>
                      <span class="bag-owner" class:own={ownershipStatus === 'owned'}>
                        {ownershipStatus === 'owned' ? 'Your bag' : `${ownerName}'s bag`}
                      </span>
                    </div>
                    {#if bag.inventory_status}
                      <span class="inventory-status {bag.inventory_status}">
                        {formatInventoryStatus(bag.inventory_status)}
                      </span>
                    {/if}
                  </div>
                  
                  <div class="bag-details">
                    {#if bag.roast_date}
                      <div class="bag-detail">
                        <span class="detail-label">Roasted</span>
                        <span class="detail-value">{formatDate(bag.roast_date)}</span>
                      </div>
                    {/if}
                    
                    {#if bag.weight_g}
                      <div class="bag-detail">
                        <span class="detail-label">Weight</span>
                        <span class="detail-value">{bag.weight_g.toFixed(0)}g</span>
                      </div>
                    {/if}
                    
                    {#if bag.purchase_location}
                      <div class="bag-detail">
                        <span class="detail-label">From</span>
                        <span class="detail-value">{bag.purchase_location}</span>
                      </div>
                    {/if}
                    
                    {#if bag.price}
                      <div class="bag-detail">
                        <span class="detail-label">Price</span>
                        <span class="detail-value">${bag.price.toFixed(2)}</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="not-found">Bean not found</div>
    {/if}
  </div>
</AuthGuard>

<style>
  .bean-detail-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
  }

  h1 {
    color: var(--text-ink-primary);
    font-size: 2rem;
    margin: 0.5rem 0 0 0;
  }

  .roaster-name {
    color: var(--text-ink-secondary);
    font-size: 1.1rem;
    margin: 0.25rem 0 0 0;
    font-weight: 500;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .loading, .error, .not-found {
    text-align: center;
    padding: 2rem;
    color: var(--text-ink-muted);
  }

  .error {
    color: var(--semantic-error);
  }

  .bean-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .detail-section {
    padding: 1.5rem;
  }

  .detail-section h3 {
    color: var(--text-ink-secondary);
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
  }

  .bean-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-weight: 600;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .info-value {
    color: var(--text-ink-primary);
    font-size: 1.05rem;
  }

  .ownership-chip {
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid transparent;
    width: fit-content;
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
    width: fit-content;
  }

  .tasting-notes {
    margin-top: 1rem;
  }

  .tasting-notes h4 {
    color: var(--text-ink-secondary);
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .tasting-notes p {
    color: var(--text-ink-secondary);
    line-height: 1.6;
    margin: 0;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 0.85rem 1rem;
  }

  .rating-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
  }

  .rating-section h4 {
    color: var(--text-ink-secondary);
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 0.85rem 1rem;
  }

  .stat-label {
    font-weight: 600;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .stat-value {
    color: var(--text-ink-primary);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .stat-value.rating {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    white-space: nowrap;
  }

  .stat-value.rating.personal {
    color: var(--accent-primary);
  }

  .stat-value.rating.community {
    color: var(--text-ink-secondary);
  }

  .rating-number {
    color: var(--text-ink-muted);
    font-weight: normal;
    font-size: 0.8rem;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .activity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
  }

  .activity-text {
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
  }

  .activity-date {
    color: var(--text-ink-muted);
    font-size: 0.8rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-ink-muted);
    background: var(--bg-surface-paper);
    border: 1px dashed rgba(123, 94, 58, 0.35);
    border-radius: var(--radius-md);
  }

  .empty-state p {
    margin: 0;
  }

  .bags-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .bag-card {
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 1rem;
  }

  .bag-card.owned {
    border-color: rgba(85, 98, 74, 0.35);
    background: rgba(85, 98, 74, 0.05);
  }

  .bag-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .bag-title h4 {
    margin: 0;
    color: var(--text-ink-primary);
    font-size: 1rem;
  }

  .bag-owner {
    color: var(--text-ink-muted);
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }

  .bag-owner.own {
    color: var(--semantic-success);
    font-weight: 600;
  }

  .inventory-status {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .inventory-status.unopened {
    background: rgba(85, 98, 74, 0.18);
    color: var(--semantic-success);
  }

  .inventory-status.plenty {
    background: rgba(85, 98, 74, 0.18);
    color: var(--semantic-success);
  }

  .inventory-status.getting_low {
    background: rgba(138, 106, 62, 0.18);
    color: var(--semantic-warning);
  }

  .inventory-status.empty {
    background: rgba(156, 69, 69, 0.18);
    color: var(--semantic-error);
  }

  .bag-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .bag-detail {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .detail-label {
    font-weight: 500;
    color: var(--text-ink-muted);
    font-size: 0.8rem;
  }

  .detail-value {
    color: var(--text-ink-primary);
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    .bean-info-grid {
      grid-template-columns: 1fr;
    }

    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .bags-grid {
      grid-template-columns: 1fr;
    }

    .activity-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .bag-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>