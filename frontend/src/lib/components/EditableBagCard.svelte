<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { adminService } from '$lib/admin-service';
  import { barista } from '$lib/auth';
  import { getBagPermissions } from '$lib/permissions';
  import IconButton from '$lib/components/IconButton.svelte';
  import BagStatusUpdater from '$lib/components/BagStatusUpdater.svelte';
  import { PencilSquare, CheckCircle, XMark, Plus } from '$lib/icons';
  import type { BagWithBarista, InventoryStatus, UpdateBagRequest, CreateBagRequest } from '@shared/types';

  // Props for existing bag mode
  export let bag: BagWithBarista | null = null;
  export let beanName: string;
  
  // Props for new bag mode
  export let beanId: string | null = null;
  export let isNewBag = false;

  const dispatch = createEventDispatcher<{
    updated: BagWithBarista;
    created: BagWithBarista;
    deleted: string;
    cancel: void;
  }>();

  let isEditing = isNewBag; // Start in edit mode for new bags
  let isSaving = false;
  let error: string | null = null;
  
  // Form data - works for both create and update
  let formData: Partial<CreateBagRequest & UpdateBagRequest> = {};

  $: bagPermissions = bag ? getBagPermissions($barista, bag) : { canEdit: true, canDelete: false };
  $: canEdit = bagPermissions.canEdit;

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function formatInventoryStatus(status?: string): string {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function initializeFormData() {
    if (isNewBag) {
      // Initialize for new bag creation
      formData = {
        bean_id: beanId || '',
        name: '',
        roast_date: '',
        weight_g: undefined,
        price: undefined,
        purchase_location: '',
        inventory_status: undefined
      };
    } else if (bag) {
      // Initialize for editing existing bag
      formData = {
        name: bag.name || '',
        roast_date: bag.roast_date || '',
        weight_g: bag.weight_g || undefined,
        price: bag.price || undefined,
        purchase_location: bag.purchase_location || '',
        inventory_status: bag.inventory_status
      };
    }
  }

  function handleEdit() {
    if (!canEdit || isNewBag) return;
    
    initializeFormData();
    isEditing = true;
    error = null;
  }

  function handleCancel() {
    if (isNewBag) {
      dispatch('cancel');
      return;
    }
    
    isEditing = false;
    formData = {};
    error = null;
  }

  function validateForm(): boolean {
    if (!formData.bean_id && isNewBag) {
      error = 'Bean is required';
      return false;
    }
    
    if (formData.weight_g !== undefined && formData.weight_g < 0) {
      error = 'Weight cannot be negative';
      return false;
    }
    
    if (formData.price !== undefined && formData.price < 0) {
      error = 'Price cannot be negative';
      return false;
    }
    
    return true;
  }

  async function handleSave() {
    if (!canEdit) return;
    if (!validateForm()) return;

    try {
      isSaving = true;
      error = null;

      if (isNewBag) {
        // Create new bag
        const createData: CreateBagRequest = {
          bean_id: formData.bean_id!,
          name: formData.name?.trim() || undefined,
          roast_date: formData.roast_date || undefined,
          weight_g: formData.weight_g || undefined,
          price: formData.price,
          purchase_location: formData.purchase_location?.trim() || undefined,
          inventory_status: formData.inventory_status
        };

        const response = await apiClient.createBag(createData);
        
        if (response.data) {
          dispatch('created', response.data);
        } else {
          throw new Error('Failed to create bag');
        }
      } else if (bag) {
        // Update existing bag
        const updateData: UpdateBagRequest = {
          id: bag.id,
          ...formData
        };

        // Use admin endpoint if user is admin and not the bag owner
        const isAdmin = $barista?.is_admin === true;
        const isOwner = bag.owner_id === $barista?.id;
        
        let response;
        if (isAdmin && !isOwner) {
          // Admin editing someone else's bag - use admin endpoint
          const updatedBag = await adminService.updateBag(bag.id, updateData);
          response = { data: updatedBag };
        } else {
          // Owner editing their own bag - use regular endpoint
          response = await apiClient.updateBag(bag.id, updateData);
        }
        
        if (response.data) {
          // Preserve barista information
          const updatedBag = { ...response.data, barista: bag.barista };
          dispatch('updated', updatedBag);
          isEditing = false;
          formData = {};
        } else {
          throw new Error('Failed to update bag');
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : `Failed to ${isNewBag ? 'create' : 'update'} bag`;
      console.error(`Failed to ${isNewBag ? 'create' : 'update'} bag:`, err);
    } finally {
      isSaving = false;
    }
  }

  function handleBagStatusUpdated(event: CustomEvent<BagWithBarista>) {
    if (!bag) return;
    const updatedBag = event.detail;
    // Preserve barista information
    const bagWithBarista = { ...updatedBag, barista: bag.barista };
    dispatch('updated', bagWithBarista);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleSave();
    }
  }

  // Initialize form data when component mounts or props change
  $: if (isNewBag || bag) {
    initializeFormData();
  }

</script>

<div class="bag-card" class:editing={isEditing} class:new-bag={isNewBag} on:keydown={handleKeydown}>
  <div class="bag-header">
    <div class="bag-title">
      {#if isEditing}
        <input
          type="text"
          bind:value={formData.name}
          class="bag-name-input"
          placeholder={isNewBag ? `Name for this ${beanName} bag` : beanName}
          disabled={isSaving}
        />
      {:else if isNewBag}
        <h4>New Bag</h4>
      {:else}
        <h4>{bag?.name || beanName}</h4>
      {/if}
      
      {#if isNewBag && isEditing}
        <span class="bag-info">Creating bag for: <strong>{beanName}</strong></span>
      {/if}
    </div>
    
    <div class="bag-actions">
      {#if !isEditing && !isNewBag && bag?.inventory_status}
        <span class="inventory-status {bag.inventory_status}">
          {formatInventoryStatus(bag.inventory_status)}
        </span>
      {/if}
      
      {#if canEdit && !isEditing && !isNewBag}
        <IconButton 
          on:click={handleEdit} 
          ariaLabel="Edit bag" 
          title="Edit bag" 
          variant="accent" 
          size="sm"
        >
          <PencilSquare />
        </IconButton>
      {/if}
      
      {#if isEditing}
        <div class="edit-actions">
          <IconButton 
            on:click={handleCancel} 
            ariaLabel="Cancel" 
            title="Cancel" 
            variant="neutral" 
            size="sm"
            disabled={isSaving}
          >
            <XMark />
          </IconButton>
          <IconButton 
            on:click={handleSave} 
            ariaLabel={isNewBag ? "Create bag" : "Save changes"} 
            title={isNewBag ? "Create bag" : "Save"} 
            variant="success" 
            size="sm"
            disabled={isSaving}
          >
            <CheckCircle />
          </IconButton>
        </div>
      {/if}
    </div>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}
  
  <div class="bag-details">
    <div class="bag-detail">
      <span class="detail-label">Roasted</span>
      {#if isEditing}
        <input
          type="date"
          bind:value={formData.roast_date}
          class="detail-input"
          disabled={isSaving}
        />
      {:else if bag?.roast_date}
        <span class="detail-value">{formatDate(bag.roast_date)}</span>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>
    
    <div class="bag-detail">
      <span class="detail-label">Weight (g)</span>
      {#if isEditing}
        <input
          type="number"
          inputmode="decimal"
          bind:value={formData.weight_g}
          class="detail-input"
          placeholder="e.g., 250"
          min="0"
          step="0.1"
          disabled={isSaving}
        />
      {:else if bag?.weight_g}
        <span class="detail-value">{bag.weight_g}g</span>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>
    
    <div class="bag-detail">
      <span class="detail-label">Price</span>
      {#if isEditing}
        <input
          type="number"
          inputmode="decimal"
          bind:value={formData.price}
          class="detail-input"
          placeholder="e.g., 18.50"
          min="0"
          step="0.01"
          disabled={isSaving}
        />
      {:else if bag?.price}
        <span class="detail-value">${bag.price.toFixed(2)}</span>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>
    
    <div class="bag-detail">
      <span class="detail-label">From</span>
      {#if isEditing}
        <input
          type="text"
          bind:value={formData.purchase_location}
          class="detail-input"
          placeholder="e.g., Local Coffee Shop"
          disabled={isSaving}
        />
      {:else if bag?.purchase_location}
        <span class="detail-value">{bag.purchase_location}</span>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>

    {#if isEditing}
      <div class="bag-detail">
        <span class="detail-label">Status</span>
        <select
          bind:value={formData.inventory_status}
          class="detail-select"
          disabled={isSaving}
        >
          <option value="">Select status</option>
          <option value="unopened">Unopened</option>
          <option value="plenty">Plenty</option>
          <option value="getting_low">Getting Low</option>
          <option value="empty">Empty</option>
        </select>
      </div>
    {/if}
  </div>

  <!-- Status updater for owned bags and admins (only when not editing and not new bag) -->
  {#if canEdit && !isEditing && !isNewBag && bag}
    <div class="bag-status-section">
      <h5>Update Status</h5>
      <BagStatusUpdater 
        {bag} 
        on:updated={handleBagStatusUpdated}
      />
    </div>
  {/if}
</div>

<style>
  .bag-card {
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 1rem;
    transition: border-color var(--motion-fast);
  }

  .bag-card.editing {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.1);
  }

  .bag-card.new-bag {
    border-color: var(--accent-primary);
    border-style: dashed;
    background: rgba(176, 138, 90, 0.05);
    margin-bottom: 1.5rem;
  }

  .bag-card.new-bag.editing {
    border-style: solid;
    background: var(--bg-surface-paper);
    margin-bottom: 1.5rem;
  }

  .bag-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .bag-title {
    flex: 1;
    min-width: 0;
  }

  .bag-title h4 {
    margin: 0;
    color: var(--text-ink-primary);
    font-size: 1rem;
    word-wrap: break-word;
  }

  .bag-name-input {
    width: 100%;
    color: var(--text-ink-primary);
    font-size: 1rem;
    font-weight: 600;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.3);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.75rem;
    transition: border-color var(--motion-fast);
  }

  .bag-name-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.1);
  }

  .bag-name-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .bag-info {
    color: var(--text-ink-secondary);
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: block;
  }

  .bag-info strong {
    color: var(--accent-primary);
  }

  .bag-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .edit-actions {
    display: flex;
    gap: 0.25rem;
  }

  .inventory-status {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: capitalize;
    white-space: nowrap;
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

  .error-message {
    background: rgba(156, 69, 69, 0.1);
    color: var(--semantic-error);
    border: 1px solid rgba(156, 69, 69, 0.3);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
  }

  .bag-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .bag-detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
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

  .detail-empty {
    color: var(--text-ink-muted);
    font-style: italic;
  }

  .detail-input,
  .detail-select {
    color: var(--text-ink-primary);
    font-size: 0.9rem;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.3);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.6rem;
    transition: border-color var(--motion-fast);
  }

  .detail-input:focus,
  .detail-select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.1);
  }

  .detail-input:disabled,
  .detail-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .bag-status-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(123, 94, 58, 0.2);
  }

  .bag-status-section h5 {
    margin: 0 0 0.75rem 0;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .bag-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .bag-actions {
      align-self: flex-end;
    }

    .bag-details {
      grid-template-columns: 1fr;
    }
  }
</style>
