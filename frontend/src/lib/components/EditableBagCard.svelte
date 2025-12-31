<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { adminService } from '$lib/admin-service';
  import { barista } from '$lib/auth';
  import { getBagPermissions } from '$lib/permissions';
  import IconButton from '$lib/components/IconButton.svelte';
  import BagStatusUpdater from '$lib/components/BagStatusUpdater.svelte';
  import { PencilSquare, CheckCircle, XMark, Plus } from '$lib/icons';
  import { editableCard, editableCardVariants } from '$lib/ui/components/editable-card';
  import { toStyleString } from '$lib/ui/style';
  import type { BagWithBarista, Barista as BaristaType, InventoryStatus, UpdateBagRequest, CreateBagRequest } from '@shared/types';

  // Props for existing bag mode
  export let bag: BagWithBarista | null = null;
  export let beanName: string;
  export let baristasById: Record<string, BaristaType> = {};
  
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

  function getBagOwnershipStatus(): 'owned' | 'other' {
    if (!bag) return 'owned'; // New bags are always owned by current user
    return bag.owner_id === $barista?.id ? 'owned' : 'other';
  }

  function getBagOwnerName(): string {
    if (!bag) return 'Your bag'; // New bags
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
    dispatch('cancel');
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

  $: ownershipStatus = getBagOwnershipStatus();
  $: ownerName = getBagOwnerName();

  const style = toStyleString({
    '--editable-card-bg': editableCard.container.background,
    '--editable-card-border': editableCard.container.borderColor,
    '--editable-card-border-width': editableCard.container.borderWidth,
    '--editable-card-border-style': editableCard.container.borderStyle,
    '--editable-card-radius': editableCard.container.borderRadius,
    '--editable-card-padding': editableCard.container.padding,
    '--editable-card-transition': editableCard.container.transition,
    '--editable-card-hover-shadow': editableCard.container.hover.shadow,
    '--editable-card-hover-border': editableCard.container.hover.borderColor,
    '--editable-card-edit-border': editableCard.state.editing.borderColor,
    '--editable-card-edit-shadow': editableCard.state.editing.shadow,
    '--editable-card-new-border': editableCard.state.newCard.borderColor,
    '--editable-card-new-border-style': editableCard.state.newCard.borderStyle,
    '--editable-card-new-bg': editableCard.state.newCard.background,
    '--editable-card-new-margin': editableCard.state.newCard.marginBottom,
    '--editable-card-new-edit-border-style': editableCard.state.newEditing.borderStyle,
    '--editable-card-new-edit-bg': editableCard.state.newEditing.background,
    '--editable-card-new-edit-margin': editableCard.state.newEditing.marginBottom,
    '--editable-card-header-gap': editableCard.header.gap,
    '--editable-card-header-margin': editableCard.header.marginBottom,
    '--editable-card-title-font': editableCard.title.fontFamily,
    '--editable-card-title-size': editableCard.title.fontSize,
    '--editable-card-title-weight': editableCard.title.fontWeight,
    '--editable-card-title-color': editableCard.title.textColor,
    '--editable-card-info-font': editableCard.info.fontFamily,
    '--editable-card-info-size': editableCard.info.fontSize,
    '--editable-card-info-color': editableCard.info.textColor,
    '--editable-card-owner-color': editableCard.owner.textColor,
    '--editable-card-owner-highlight': editableCard.owner.highlightColor,
    '--editable-card-owner-size': editableCard.owner.fontSize,
    '--editable-card-owner-weight': editableCard.owner.fontWeight,
    '--editable-card-actions-gap': editableCard.actions.gap,
    '--editable-card-edit-actions-gap': editableCard.actions.editActionsGap,
    '--editable-card-status-font-size': editableCard.statusPill.fontSize,
    '--editable-card-status-font-weight': editableCard.statusPill.fontWeight,
    '--editable-card-status-radius': editableCard.statusPill.borderRadius,
    '--editable-card-status-padding': editableCard.statusPill.padding,
    '--editable-card-status-success-bg': editableCard.statusPill.variants.success.background,
    '--editable-card-status-success-color': editableCard.statusPill.variants.success.textColor,
    '--editable-card-status-warning-bg': editableCard.statusPill.variants.warning.background,
    '--editable-card-status-warning-color': editableCard.statusPill.variants.warning.textColor,
    '--editable-card-status-error-bg': editableCard.statusPill.variants.error.background,
    '--editable-card-status-error-color': editableCard.statusPill.variants.error.textColor,
    '--editable-card-error-bg': editableCard.error.background,
    '--editable-card-error-border': editableCard.error.borderColor,
    '--editable-card-error-color': editableCard.error.textColor,
    '--editable-card-error-radius': editableCard.error.borderRadius,
    '--editable-card-error-padding': editableCard.error.padding,
    '--editable-card-error-font': editableCard.error.fontFamily,
    '--editable-card-error-size': editableCard.error.fontSize,
    '--editable-card-grid-gap': editableCard.detailGrid.gap,
    '--editable-card-detail-min-col': editableCardVariants.compact.detailMinColumnWidth,
    '--editable-card-label-font': editableCard.detail.label.fontFamily,
    '--editable-card-label-size': editableCard.detail.label.fontSize,
    '--editable-card-label-weight': editableCard.detail.label.fontWeight,
    '--editable-card-label-color': editableCard.detail.label.textColor,
    '--editable-card-value-font': editableCard.detail.value.fontFamily,
    '--editable-card-value-size': editableCard.detail.value.fontSize,
    '--editable-card-value-color': editableCard.detail.value.textColor,
    '--editable-card-empty-font': editableCard.detail.empty.fontFamily,
    '--editable-card-empty-style': editableCard.detail.empty.fontStyle,
    '--editable-card-empty-color': editableCard.detail.empty.textColor,
    '--editable-card-input-font': editableCard.input.fontFamily,
    '--editable-card-input-size': editableCard.input.fontSize,
    '--editable-card-input-color': editableCard.input.textColor,
    '--editable-card-input-bg': editableCard.input.background,
    '--editable-card-input-border': editableCard.input.borderColor,
    '--editable-card-input-border-width': editableCard.input.borderWidth,
    '--editable-card-input-radius': editableCard.input.borderRadius,
    '--editable-card-input-padding': editableCard.input.padding,
    '--editable-card-input-focus': editableCard.input.focusRing,
    '--editable-card-section-divider': editableCard.section.dividerColor,
    '--editable-card-section-title-font': editableCard.section.title.fontFamily,
    '--editable-card-section-title-size': editableCard.section.title.fontSize,
    '--editable-card-section-title-weight': editableCard.section.title.fontWeight,
    '--editable-card-section-title-color': editableCard.section.title.textColor
  });
</script>

<div class="bag-card" class:editing={isEditing} class:new-bag={isNewBag} on:keydown={handleKeydown} style={style}>
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
      
      {#if !isNewBag}
        <span class="bag-owner" class:own={ownershipStatus === 'owned'}>
          {ownershipStatus === 'owned' ? 'Your bag' : `${ownerName}'s bag`}
        </span>
      {:else if isEditing}
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
    background: var(--editable-card-bg, var(--bg-surface-paper));
    border: var(--editable-card-border-width, 1px) var(--editable-card-border-style, solid) var(--editable-card-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--editable-card-radius, var(--radius-md));
    padding: var(--editable-card-padding, 1rem);
    transition: var(--editable-card-transition, border-color var(--motion-fast));
  }

  .bag-card:hover {
    box-shadow: var(--editable-card-hover-shadow, var(--shadow-soft));
    border-color: var(--editable-card-hover-border, var(--accent-primary));
  }

  .bag-card.editing {
    border-color: var(--editable-card-edit-border, var(--accent-primary));
    box-shadow: var(--editable-card-edit-shadow, 0 0 0 2px rgba(176, 138, 90, 0.1));
  }

  .bag-card.new-bag {
    border-color: var(--editable-card-new-border, var(--accent-primary));
    border-style: var(--editable-card-new-border-style, dashed);
    background: var(--editable-card-new-bg, rgba(176, 138, 90, 0.05));
    margin-bottom: var(--editable-card-new-margin, 1.5rem);
  }

  .bag-card.new-bag.editing {
    border-style: var(--editable-card-new-edit-border-style, solid);
    background: var(--editable-card-new-edit-bg, var(--bg-surface-paper));
    margin-bottom: var(--editable-card-new-edit-margin, 1.5rem);
  }

  .bag-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--editable-card-header-gap, 1rem);
    margin-bottom: var(--editable-card-header-margin, 0.75rem);
  }

  .bag-title {
    flex: 1;
    min-width: 0;
  }

  .bag-title h4 {
    margin: 0;
    color: var(--editable-card-title-color, var(--text-ink-primary));
    font-family: var(--editable-card-title-font, inherit);
    font-size: var(--editable-card-title-size, 1rem);
    font-weight: var(--editable-card-title-weight, 600);
    word-wrap: break-word;
  }

  .bag-name-input {
    width: 100%;
    color: var(--editable-card-input-color, var(--text-ink-primary));
    font-size: var(--editable-card-input-size, 1rem);
    font-weight: 600;
    background: var(--editable-card-input-bg, var(--bg-surface-paper));
    border: var(--editable-card-input-border-width, 1px) solid var(--editable-card-input-border, rgba(123, 94, 58, 0.3));
    border-radius: var(--editable-card-input-radius, var(--radius-sm));
    padding: 0.5rem 0.75rem;
    transition: border-color var(--motion-fast);
  }

  .bag-name-input:focus {
    outline: none;
    border-color: var(--editable-card-edit-border, var(--accent-primary));
    box-shadow: var(--editable-card-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.1));
  }

  .bag-name-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .bag-owner {
    color: var(--editable-card-owner-color, var(--text-ink-muted));
    font-size: var(--editable-card-owner-size, 0.8rem);
    margin-top: 0.25rem;
    display: block;
  }

  .bag-owner.own {
    color: var(--editable-card-owner-highlight, var(--semantic-success));
    font-weight: var(--editable-card-owner-weight, 600);
  }

  .bag-info {
    color: var(--editable-card-info-color, var(--text-ink-secondary));
    font-family: var(--editable-card-info-font, inherit);
    font-size: var(--editable-card-info-size, 0.8rem);
    margin-top: 0.25rem;
    display: block;
  }

  .bag-info strong {
    color: var(--editable-card-edit-border, var(--accent-primary));
  }

  .bag-actions {
    display: flex;
    align-items: center;
    gap: var(--editable-card-actions-gap, 0.5rem);
    flex-shrink: 0;
  }

  .edit-actions {
    display: flex;
    gap: var(--editable-card-edit-actions-gap, 0.25rem);
  }

  .inventory-status {
    padding: var(--editable-card-status-padding, 0.2rem 0.5rem);
    border-radius: var(--editable-card-status-radius, 999px);
    font-size: var(--editable-card-status-font-size, 0.7rem);
    font-weight: var(--editable-card-status-font-weight, 600);
    text-transform: capitalize;
    white-space: nowrap;
    background: var(--editable-card-status-bg, rgba(85, 98, 74, 0.18));
    color: var(--editable-card-status-color, var(--semantic-success));
  }

  .inventory-status.unopened {
    --editable-card-status-bg: var(--editable-card-status-success-bg, rgba(85, 98, 74, 0.18));
    --editable-card-status-color: var(--editable-card-status-success-color, var(--semantic-success));
  }

  .inventory-status.plenty {
    --editable-card-status-bg: var(--editable-card-status-success-bg, rgba(85, 98, 74, 0.18));
    --editable-card-status-color: var(--editable-card-status-success-color, var(--semantic-success));
  }

  .inventory-status.getting_low {
    --editable-card-status-bg: var(--editable-card-status-warning-bg, rgba(138, 106, 62, 0.18));
    --editable-card-status-color: var(--editable-card-status-warning-color, var(--semantic-warning));
  }

  .inventory-status.empty {
    --editable-card-status-bg: var(--editable-card-status-error-bg, rgba(122, 62, 47, 0.18));
    --editable-card-status-color: var(--editable-card-status-error-color, var(--semantic-error));
  }

  .error-message {
    background: var(--editable-card-error-bg, rgba(122, 62, 47, 0.1));
    color: var(--editable-card-error-color, var(--semantic-error));
    border: 1px solid var(--editable-card-error-border, rgba(122, 62, 47, 0.3));
    border-radius: var(--editable-card-error-radius, var(--radius-sm));
    padding: var(--editable-card-error-padding, 0.5rem 0.75rem);
    margin-bottom: 0.75rem;
    font-family: var(--editable-card-error-font, inherit);
    font-size: var(--editable-card-error-size, 0.9rem);
  }

  .bag-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--editable-card-detail-min-col, 120px), 1fr));
    gap: var(--editable-card-grid-gap, 0.75rem);
  }

  .bag-detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    font-weight: var(--editable-card-label-weight, 500);
    color: var(--editable-card-label-color, var(--text-ink-secondary));
    font-size: var(--editable-card-label-size, 0.8rem);
    font-family: var(--editable-card-label-font, inherit);
  }

  .detail-value {
    color: var(--editable-card-value-color, var(--text-ink-primary));
    font-size: var(--editable-card-value-size, 0.9rem);
    font-family: var(--editable-card-value-font, inherit);
  }

  .detail-empty {
    color: var(--editable-card-empty-color, var(--text-ink-muted));
    font-style: var(--editable-card-empty-style, italic);
    font-family: var(--editable-card-empty-font, inherit);
  }

  .detail-input,
  .detail-select {
    color: var(--editable-card-input-color, var(--text-ink-primary));
    font-size: var(--editable-card-input-size, 0.9rem);
    font-family: var(--editable-card-input-font, inherit);
    background: var(--editable-card-input-bg, var(--bg-surface-paper));
    border: var(--editable-card-input-border-width, 1px) solid var(--editable-card-input-border, rgba(123, 94, 58, 0.3));
    border-radius: var(--editable-card-input-radius, var(--radius-sm));
    padding: var(--editable-card-input-padding, 0.4rem 0.6rem);
    transition: border-color var(--motion-fast);
  }

  .detail-input:focus,
  .detail-select:focus {
    outline: none;
    border-color: var(--editable-card-edit-border, var(--accent-primary));
    box-shadow: var(--editable-card-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.1));
  }

  .detail-input:disabled,
  .detail-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .bag-status-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--editable-card-section-divider, rgba(123, 94, 58, 0.2));
  }

  .bag-status-section h5 {
    margin: 0 0 0.75rem 0;
    color: var(--editable-card-section-title-color, var(--text-ink-secondary));
    font-size: var(--editable-card-section-title-size, 0.9rem);
    font-weight: var(--editable-card-section-title-weight, 600);
    font-family: var(--editable-card-section-title-font, inherit);
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
