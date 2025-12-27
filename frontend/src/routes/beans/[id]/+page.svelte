<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import Chip from '$lib/components/Chip.svelte';
  import BeanRating from '$lib/components/BeanRating.svelte';
  import BagStatusUpdater from '$lib/components/BagStatusUpdater.svelte';
  import EditableBagCard from '$lib/components/EditableBagCard.svelte';
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
  import RoasterSelector from '$lib/components/RoasterSelector.svelte';
  import { enhancedApiClient } from '$lib/utils/enhanced-api-client';
  import { apiClient } from '$lib/api-client';
  import { globalLoadingManager, LoadingKeys } from '$lib/utils/loading-state';
  import { AppError } from '$lib/utils/error-handling';
  import { barista } from '$lib/auth';
  import { getBeanPermissions, getBagPermissions } from '$lib/permissions';
  import { XMark, PencilSquare, Trash, CheckCircle, Plus } from '$lib/icons';
  import type { BeanWithContext, Roaster, Bag, BagWithBarista, Barista as BaristaType, RoastLevel, CreateBeanRequest } from '@shared/types';

  let bean: BeanWithContext | null = null;
  let roaster: Roaster | null = null;
  let roasters: Roaster[] = [];
  let bags: BagWithBarista[] = [];
  let baristasById: Record<string, BaristaType> = {};
  let error: AppError | null = null;
  let personalRating: number | null = null;
  let isDeleting = false;
  let permissionError: AppError | null = null;
  let isEditing = false;
  let isSaving = false;
  let editFormData: Partial<CreateBeanRequest> = {};
  let showBagCreator = false;

  const roastLevels: RoastLevel[] = ['Light', 'Medium Light', 'Medium', 'Medium Dark', 'Dark'];

  $: beanId = $page.params.id;
  $: beanPermissions = getBeanPermissions($barista, bean || undefined);
  $: isLoading = globalLoadingManager.isLoading(LoadingKeys.BEAN_DETAIL);

  onMount(async () => {
    if (beanId) {
      await loadBeanDetails(beanId);
    }
  });

  async function loadBeanDetails(id: string) {
    error = null;
    
    try {
      const [beanResponse, roastersResponse, bagsResponse, baristasResponse] = await Promise.all([
        enhancedApiClient.getBean(id),
        enhancedApiClient.getRoasters(),
        enhancedApiClient.getBags({ bean_id: id }), // Filter bags by bean_id on the server
        apiClient.getBaristas()
      ]);

      if (beanResponse.data) {
        bean = beanResponse.data;
        personalRating = bean.personal_rating || null;
        
        // Store all roasters for editing
        roasters = roastersResponse.data;
        
        // Find the roaster for this bean
        roaster = roasters.find(r => r.id === bean.roaster_id) || null;
        
        // Bags are already filtered by bean_id from the API
        bags = bagsResponse.data;
        
        // Create baristas lookup
        baristasById = baristasResponse.data.reduce<Record<string, BaristaType>>((acc, barista) => {
          acc[barista.id] = barista;
          return acc;
        }, {});
      } else {
        throw new Error('Bean not found');
      }
    } catch (err) {
      error = err instanceof AppError ? err : new AppError(
        'Failed to load bean details',
        { operation: 'load', entityType: 'bean details', retryable: true },
        err as Error
      );
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

  function getBagOwnershipStatus(bag: BagWithBarista): 'owned' | 'other' {
    return bag.owner_id === $barista?.id ? 'owned' : 'other';
  }

  function getBagOwnerName(bag: BagWithBarista): string {
    // Use embedded barista information if available, otherwise fall back to lookup
    if (bag.barista?.display_name) {
      return bag.barista.display_name;
    }
    const owner = baristasById[bag.owner_id];
    return owner ? owner.display_name : 'Unknown';
  }

  function formatInventoryStatus(status?: string): string {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function handleEditBean() {
    if (!beanPermissions.canEdit) {
      permissionError = new AppError(
        'You don\'t have permission to edit this bean.',
        { operation: 'edit', entityType: 'bean', retryable: false }
      );
      return;
    }
    
    if (!bean) return;
    
    // Initialize edit form data with current bean values
    editFormData = {
      name: bean.name,
      roaster_id: bean.roaster_id,
      roast_level: bean.roast_level,
      country_of_origin: bean.country_of_origin || '',
      tasting_notes: bean.tasting_notes || ''
    };
    
    isEditing = true;
  }

  function handleCancelEdit() {
    isEditing = false;
    editFormData = {};
    permissionError = null;
  }

  async function handleSaveEdit() {
    if (!bean || !editFormData.name?.trim() || !editFormData.roaster_id) {
      permissionError = new AppError(
        'Name and roaster are required.',
        { operation: 'save', entityType: 'bean', retryable: false }
      );
      return;
    }

    try {
      isSaving = true;
      permissionError = null;
      
      const response = await apiClient.updateBean(bean.id, editFormData);
      
      // Update local bean data
      bean = { ...bean, ...response.data };
      
      // Update roaster reference
      roaster = roasters.find(r => r.id === bean.roaster_id) || null;
      
      isEditing = false;
      editFormData = {};
      
      // Reload to get fresh context data
      if (beanId) {
        await loadBeanDetails(beanId);
      }
    } catch (err: any) {
      permissionError = new AppError(
        err.message || 'Failed to update bean',
        { operation: 'save', entityType: 'bean', retryable: true },
        err
      );
    } finally {
      isSaving = false;
    }
  }

  async function handleDeleteBean() {
    if (!bean || !beanPermissions.canDelete) {
      permissionError = new AppError(
        'Only administrators can delete beans.',
        { operation: 'delete', entityType: 'bean', retryable: false }
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete "${bean.name}"? This action cannot be undone and will affect all associated bags and brews.`)) {
      return;
    }

    isDeleting = true;
    permissionError = null;

    try {
      await enhancedApiClient.deleteBean(bean.id);
      goto('/beans');
    } catch (err) {
      permissionError = err instanceof AppError ? err : new AppError(
        'Failed to delete bean',
        { operation: 'delete', entityType: 'bean', retryable: false },
        err as Error
      );
      console.error('Failed to delete bean:', err);
    } finally {
      isDeleting = false;
    }
  }

  function handleRetryLoad() {
    if (beanId) {
      loadBeanDetails(beanId);
    }
  }

  function handleRetryDelete() {
    handleDeleteBean();
  }

  function handleDismissError() {
    error = null;
  }

  function handleDismissPermissionError() {
    permissionError = null;
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

  async function handleBagStatusUpdated(event: CustomEvent<Bag>) {
    const updatedBag = event.detail;
    
    // Update the bag in the local bags array, preserving barista information
    bags = bags.map(bag => 
      bag.id === updatedBag.id ? { ...updatedBag, barista: bag.barista } : bag
    );
  }

  async function handleBagUpdated(event: CustomEvent<BagWithBarista>) {
    const updatedBag = event.detail;
    
    // Update the bag in the local bags array
    bags = bags.map(bag => 
      bag.id === updatedBag.id ? updatedBag : bag
    );
  }

  async function handleBagCreated(event: CustomEvent<BagWithBarista>) {
    const newBag = event.detail;
    
    // Add the new bag to the beginning of the list
    bags = [newBag, ...bags];
    
    // Hide the bag creator
    showBagCreator = false;
  }

  function handleNewBagCancel() {
    showBagCreator = false;
  }

  async function handleRoasterCreated(event: CustomEvent<Roaster>) {
    const newRoaster = event.detail;
    
    // Add the new roaster to the roasters list
    roasters = [newRoaster, ...roasters];
    
    // If we're editing, set the new roaster as selected
    if (isEditing) {
      editFormData.roaster_id = newRoaster.id;
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
        {#if bean && (beanPermissions.canEdit || beanPermissions.canDelete)}
          {#if beanPermissions.canEdit && !isEditing}
            <IconButton 
              on:click={handleEditBean} 
              ariaLabel="Edit bean" 
              title="Edit bean" 
              variant="accent" 
              disabled={$isLoading}
            >
              <PencilSquare />
            </IconButton>
          {/if}
          
          {#if beanPermissions.canDelete && !isEditing}
            <IconButton 
              on:click={handleDeleteBean} 
              ariaLabel="Delete bean" 
              title="Delete bean" 
              variant="danger" 
              disabled={$isLoading || isDeleting}
            >
              <Trash />
            </IconButton>
          {/if}
        {/if}
        
        <IconButton on:click={handleClose} ariaLabel="Back to beans" title="Close" variant="neutral" disabled={$isLoading}>
          <XMark />
        </IconButton>
      </div>
    </header>

    {#if $isLoading}
      <div class="loading">
        <span>Loading bean details...</span>
      </div>
    {:else if error}
      <ErrorDisplay
        error={error}
        variant="banner"
        context="bean details"
        on:retry={handleRetryLoad}
        on:dismiss={handleDismissError}
      />
    {:else if bean}
      <!-- Permission error display -->
      {#if permissionError}
        <ErrorDisplay
          error={permissionError}
          variant="inline"
          context="bean operations"
          on:retry={handleRetryDelete}
          on:dismiss={handleDismissPermissionError}
        />
      {/if}
      
      <div class="bean-content">
        <!-- Bean Information -->
        <div class="detail-section card">
          <div class="section-header">
            <div class="section-title-area">
              <h3>Bean Information</h3>
            </div>
            <div class="section-actions">
              {#if !isEditing}
                <div class="meta-chips">
                  <Chip variant={getOwnershipVariant(bean.ownership_status)} size="sm">
                    {getOwnershipLabel(bean.ownership_status)}
                  </Chip>
                  {#if bean.most_used_by_me}
                    <Chip variant="accent" size="sm">Most Used by Me</Chip>
                  {/if}
                </div>
              {/if}
              {#if isEditing}
                <div class="edit-actions">
                  <IconButton 
                    on:click={handleCancelEdit} 
                    ariaLabel="Cancel edit" 
                    title="Cancel" 
                    variant="neutral" 
                    disabled={isSaving}
                  >
                    <XMark />
                  </IconButton>
                  <IconButton 
                    on:click={handleSaveEdit} 
                    ariaLabel="Save changes" 
                    title="Save" 
                    variant="success" 
                    disabled={isSaving || !editFormData.name?.trim() || !editFormData.roaster_id}
                  >
                    <CheckCircle />
                  </IconButton>
                </div>
              {/if}
            </div>
          </div>
          
          <div class="bean-info-grid">
            <div class="info-item">
              <span class="info-label">Name</span>
              {#if isEditing}
                <input
                  type="text"
                  bind:value={editFormData.name}
                  class="info-input"
                  placeholder="Bean name"
                  disabled={isSaving}
                />
              {:else}
                <span class="info-value">{bean.name}</span>
              {/if}
            </div>
            
            <div class="info-item">
              <span class="info-label">Roaster</span>
              {#if isEditing}
                <RoasterSelector
                  bind:value={editFormData.roaster_id}
                  disabled={isSaving}
                  on:roasterCreated={handleRoasterCreated}
                />
              {:else}
                <span class="info-value">{roaster?.name || 'Unknown'}</span>
              {/if}
            </div>
            
            <!-- Two main fields in one row -->
            <div class="two-field-row">
              <div class="info-item">
                <span class="info-label">Roast Level</span>
                {#if isEditing}
                  <select
                    bind:value={editFormData.roast_level}
                    class="info-select"
                    disabled={isSaving}
                  >
                    {#each roastLevels as level}
                      <option value={level}>{level}</option>
                    {/each}
                  </select>
                {:else}
                  <span class="info-value">{bean.roast_level}</span>
                {/if}
              </div>
              
              <div class="info-item">
                <span class="info-label">Origin</span>
                {#if isEditing}
                  <input
                    type="text"
                    bind:value={editFormData.country_of_origin}
                    class="info-input"
                    placeholder="e.g., Ethiopia"
                    disabled={isSaving}
                  />
                {:else if bean.country_of_origin}
                  <span class="info-value">{bean.country_of_origin}</span>
                {:else}
                  <span class="info-value info-empty">Not specified</span>
                {/if}
              </div>
            </div>
          </div>
          
          <div class="tasting-notes">
            <h4>Tasting Notes</h4>
            {#if isEditing}
              <textarea
                bind:value={editFormData.tasting_notes}
                class="tasting-notes-input"
                placeholder="e.g., Bright acidity, floral notes, citrus finish"
                rows="3"
                disabled={isSaving}
              ></textarea>
            {:else if bean.tasting_notes}
              <p>{bean.tasting_notes}</p>
            {:else}
              <p class="info-empty">No tasting notes provided</p>
            {/if}
          </div>
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
                <div class="activity-item" class:clickable={activity.activity_type === 'brew' && activity.brew_id}>
                  {#if activity.activity_type === 'brew' && activity.brew_id}
                    <button 
                      class="activity-link"
                      on:click={() => goto(`/brews/${activity.brew_id}`)}
                      aria-label="View brew details"
                    >
                      <span class="activity-text">
                        {activity.barista_display_name} {activity.brew_name || `brew from ${formatDate(activity.created_at)}`}
                      </span>
                      <span class="activity-date">{formatDate(activity.created_at)}</span>
                    </button>
                  {:else}
                    <div class="activity-content">
                      <span class="activity-text">
                        {activity.barista_display_name} 
                        {#if activity.activity_type === 'rating'}
                          rated this bean
                        {:else if activity.activity_type === 'bag_created'}
                          added a bag of this bean
                        {:else}
                          interacted with this bean
                        {/if}
                      </span>
                      <span class="activity-date">{formatDate(activity.created_at)}</span>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Associated Bags -->
        <div class="detail-section card">
          <div class="section-header">
            <div class="section-title-area">
              <h3>Associated Bags ({bags.length})</h3>
            </div>
            <div class="section-actions">
              <IconButton 
                on:click={() => showBagCreator = true} 
                ariaLabel="New bag" 
                title="Create new bag for this bean" 
                variant="accent" 
                size="sm"
              >
                <Plus />
              </IconButton>
            </div>
          </div>

          {#if showBagCreator}
            <EditableBagCard
              beanId={bean.id}
              beanName={bean.name}
              isNewBag={true}
              on:created={handleBagCreated}
              on:cancel={handleNewBagCancel}
            />
          {/if}

          {#if bags.length === 0}
            <div class="empty-state">
              <p>No bags found for this bean.</p>
              <p class="empty-hint">Create your first bag to start tracking this bean's inventory.</p>
            </div>
          {:else}
            <div class="bags-grid">
              {#each bags as bag}
                <EditableBagCard
                  {bag}
                  beanName={bean.name}
                  {baristasById}
                  on:updated={handleBagUpdated}
                />
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

  .permission-error {
    background: var(--semantic-error-bg);
    color: var(--semantic-error);
    border: 1px solid var(--semantic-error);
    border-radius: var(--radius-md);
    padding: 1rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
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

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-title-area h3 {
    margin: 0;
  }

  .section-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .meta-chips {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  .bean-info-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .two-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
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

  .info-empty {
    color: var(--text-ink-muted);
    font-style: italic;
  }

  .info-input,
  .info-select {
    color: var(--text-ink-primary);
    font-size: 1.05rem;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.3);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.75rem;
    transition: border-color var(--motion-fast);
  }

  .info-input:focus,
  .info-select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(123, 94, 58, 0.1);
  }

  .info-input:disabled,
  .info-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

  .tasting-notes-input {
    width: 100%;
    color: var(--text-ink-secondary);
    line-height: 1.6;
    margin: 0;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.3);
    border-radius: var(--radius-md);
    padding: 0.85rem 1rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    transition: border-color var(--motion-fast);
  }

  .tasting-notes-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(123, 94, 58, 0.1);
  }

  .tasting-notes-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .tasting-notes .info-empty {
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 0.85rem 1rem;
    margin: 0;
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

  .activity-item.clickable {
    padding: 0;
    overflow: hidden;
  }

  .activity-link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background-color var(--motion-fast);
  }

  .activity-link:hover {
    background: rgba(123, 94, 58, 0.05);
  }

  .activity-link:focus {
    outline: 2px solid var(--accent-primary);
    outline-offset: -2px;
  }

  .activity-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
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

  .empty-hint {
    margin-top: 0.5rem !important;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .bags-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .two-field-row {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .section-actions {
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }

    .meta-chips {
      flex-wrap: wrap;
      justify-content: flex-end;
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