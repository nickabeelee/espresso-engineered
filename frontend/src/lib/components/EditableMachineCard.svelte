<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { adminService } from '$lib/admin-service';
  import { barista } from '$lib/auth';
  import IconButton from '$lib/components/IconButton.svelte';
  import ImageUpload from '$lib/components/ImageUpload.svelte';
  import Chip from '$lib/components/Chip.svelte';
  import { PencilSquare, CheckCircle, XMark, Plus, Trash } from '$lib/icons';
  import { editableCard, editableCardVariants } from '$lib/ui/components/editable-card';
  import { toStyleString } from '$lib/ui/style';
  import { imageSizes } from '$lib/ui/components/image';
  import { getTransformedImageUrl } from '$lib/utils/image-utils';
  import { imageSizes } from '$lib/ui/components/image';
  import { formatMostUsedBy } from '$lib/utils/usage-stats';
  import type { Machine, CreateMachineRequest, Barista } from '@shared/types';

  // Props for existing machine mode
  export let machine: Machine | null = null;
  
  // Props for new machine mode
  export let isNewMachine = false;

  // Props for usage stats
  export let usageCount: number = 0;
  export let mostUsedBy: Barista | undefined = undefined;

  const dispatch = createEventDispatcher<{
    updated: Machine;
    created: Machine;
    deleted: string;
    cancel: void;
  }>();

  let isEditing = isNewMachine; // Start in edit mode for new machines
  let isSaving = false;
  let error: string | null = null;
  let validationErrors: Record<string, string> = {};
  
  // Form data - works for both create and update
  let formData: Partial<CreateMachineRequest> = {};

  $: canEdit = true; // Machines are global, anyone can edit
  $: isAdmin = $barista?.is_admin === true;

  const style = toStyleString({
    '--editable-card-bg': editableCard.container.background,
    '--editable-card-border': editableCard.container.borderColor,
    '--editable-card-border-width': editableCard.container.borderWidth,
    '--editable-card-border-style': editableCard.container.borderStyle,
    '--editable-card-radius': editableCard.container.borderRadius,
    '--editable-card-padding': editableCard.container.padding,
    '--editable-card-transition': editableCard.container.transition,
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
    '--editable-card-actions-gap': editableCard.actions.gap,
    '--editable-card-edit-actions-gap': editableCard.actions.editActionsGap,
    '--editable-card-error-bg': editableCard.error.background,
    '--editable-card-error-border': editableCard.error.borderColor,
    '--editable-card-error-color': editableCard.error.textColor,
    '--editable-card-error-radius': editableCard.error.borderRadius,
    '--editable-card-error-padding': editableCard.error.padding,
    '--editable-card-error-font': editableCard.error.fontFamily,
    '--editable-card-error-size': editableCard.error.fontSize,
    '--editable-card-grid-gap': editableCard.detailGrid.gap,
    '--editable-card-detail-min-col': editableCardVariants.standard.detailMinColumnWidth,
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
    '--editable-card-image-width': `${imageSizes.card.width}px`,
    '--editable-card-image-height': `${imageSizes.card.height}px`
  });

  const commonManufacturers = [
    'La Marzocco',
    'Synesso', 
    'Slayer',
    'Victoria Arduino',
    'Rocket Espresso',
    'Lelit',
    'Profitec',
    'ECM',
    'Rancilio',
    'Gaggia',
    'Breville',
    'Decent Espresso'
  ];

  function initializeFormData() {
    if (isNewMachine) {
      // Initialize for new machine creation
      formData = {
        manufacturer: '',
        model: '',
        user_manual_link: '',
        image_path: ''
      };
    } else if (machine) {
      // Initialize for editing existing machine
      formData = {
        manufacturer: machine.manufacturer || '',
        model: machine.model || '',
        user_manual_link: machine.user_manual_link || '',
        image_path: machine.image_path || ''
      };
    }
  }

  function handleEdit() {
    if (!canEdit || isNewMachine) return;
    
    initializeFormData();
    isEditing = true;
    error = null;
    validationErrors = {};
  }

  function handleCancel() {
    if (isNewMachine) {
      dispatch('cancel');
      return;
    }
    
    isEditing = false;
    formData = {};
    error = null;
    validationErrors = {};
  }

  function isValidUrl(value: string): boolean {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  function validateForm(): boolean {
    validationErrors = {};

    if (!formData.manufacturer?.trim()) {
      validationErrors.manufacturer = 'Manufacturer is required';
    }

    if (!formData.model?.trim()) {
      validationErrors.model = 'Model is required';
    }

    if (formData.user_manual_link && !isValidUrl(formData.user_manual_link)) {
      validationErrors.user_manual_link = 'Please enter a valid URL';
    }

    return Object.keys(validationErrors).length === 0;
  }

  async function handleSave() {
    if (!canEdit) return;
    if (!validateForm()) {
      error = 'Please fix validation errors';
      return;
    }

    try {
      isSaving = true;
      error = null;

      const payload: CreateMachineRequest = {
        manufacturer: formData.manufacturer!.trim(),
        model: formData.model!.trim(),
        user_manual_link: formData.user_manual_link?.trim() || undefined,
        image_path: formData.image_path?.trim() || undefined
      };

      if (isNewMachine) {
        // Create new machine
        const response = await apiClient.createMachine(payload);
        
        if (response.data) {
          dispatch('created', response.data);
        } else {
          throw new Error('Failed to create machine');
        }
      } else if (machine) {
        // Update existing machine
        const response = await apiClient.updateMachine(machine.id, payload);
        
        if (response.data) {
          dispatch('updated', response.data);
          isEditing = false;
          formData = {};
        } else {
          throw new Error('Failed to update machine');
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : `Failed to ${isNewMachine ? 'create' : 'update'} machine`;
      console.error(`Failed to ${isNewMachine ? 'create' : 'update'} machine:`, err);
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete() {
    if (!machine || !canEdit) return;
    
    const confirmed = window.confirm('Delete this machine? This cannot be undone.');
    if (!confirmed) return;

    try {
      isSaving = true;
      error = null;

      await apiClient.deleteMachine(machine.id);
      dispatch('deleted', machine.id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete machine';
      console.error('Failed to delete machine:', err);
    } finally {
      isSaving = false;
    }
  }

  function handleImageUpload(event: CustomEvent<{ file: File; imageUrl: string; imagePath: string }>) {
    formData.image_path = event.detail.imagePath;
  }

  function handleImageDelete() {
    formData.image_path = '';
  }

  function handleImageError(event: CustomEvent<{ message: string }>) {
    error = `Image upload failed: ${event.detail.message}`;
  }

  function selectManufacturer(name: string) {
    formData.manufacturer = name;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleSave();
    }
  }

  function getUsageStatus() {
    if (mostUsedBy) {
      return { label: `Most used by ${mostUsedBy.display_name}`, variant: 'accent' as const };
    }
    if (usageCount > 0) {
      return { label: `${usageCount} brews`, variant: 'neutral' as const };
    }
    return null;
  }

  // Initialize form data when component mounts or props change
  $: if (isNewMachine || machine) {
    initializeFormData();
  }
</script>

<div class="machine-card" class:editing={isEditing} class:new-machine={isNewMachine} on:keydown={handleKeydown} role="region" tabindex="-1" style={style}>
  <div class="machine-card-body">
      <div class="machine-header">
        <div class="machine-header-top">
          <div class="machine-title">
          {#if isNewMachine}
            <h4>New Machine</h4>
            <span class="machine-info">Add a new espresso machine</span>
          {:else if machine}
            <h4>{machine.manufacturer} {machine.model}</h4>
            <div class="machine-meta">
              <span>{machine.manufacturer}</span>
              <span class="separator">/</span>
              <span>{machine.model}</span>
            </div>
          {/if}
          </div>
          {@const usageStatus = getUsageStatus()}
          {#if !isEditing && !isNewMachine && usageStatus}
            <Chip variant={usageStatus.variant} size="sm">{usageStatus.label}</Chip>
          {/if}
        </div>
        {#if machine?.image_path && !isEditing}
          <div class="card-media">
            <img 
              src={getTransformedImageUrl(machine.image_path, 'machine', imageSizes.card)} 
              alt="{machine.manufacturer} {machine.model}"
              loading="lazy"
              on:error={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>
        {/if}
        
        <div class="machine-actions">
          {#if canEdit && !isEditing && !isNewMachine}
            <IconButton 
              on:click={handleEdit} 
              ariaLabel="Edit machine" 
              title="Edit machine" 
              variant="accent" 
              size="sm"
            >
              <PencilSquare />
            </IconButton>
            <IconButton 
              on:click={handleDelete} 
              ariaLabel="Delete machine" 
              title="Delete machine" 
              variant="danger" 
              size="sm"
              disabled={isSaving}
            >
              <Trash />
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
                ariaLabel={isNewMachine ? "Create machine" : "Save changes"} 
                title={isNewMachine ? "Create machine" : "Save"} 
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

      {#if !isEditing && !isNewMachine && (usageCount > 0 || mostUsedBy)}
        <div class="usage-stats">
          <div class="equipment-chips">
            {#if usageCount > 0}
              <Chip variant="neutral" size="sm">{usageCount} brews</Chip>
            {/if}
            {#if mostUsedBy}
              <Chip variant="accent" size="sm">Most used by {mostUsedBy.display_name}</Chip>
            {/if}
          </div>
        </div>
      {/if}

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}
  
  <div class="machine-details">
    <div class="machine-detail">
      <span class="detail-label">Manufacturer</span>
      {#if isEditing}
        <div class="manufacturer-input-group">
          <input
            type="text"
            bind:value={formData.manufacturer}
            class="detail-input"
            class:error={validationErrors.manufacturer}
            placeholder="e.g., La Marzocco"
            disabled={isSaving}
          />
          {#if validationErrors.manufacturer}
            <span class="validation-error">{validationErrors.manufacturer}</span>
          {/if}
          <div class="manufacturer-suggestions">
            {#each commonManufacturers as name}
              <Chip variant="neutral" size="sm">
                <button
                  type="button"
                  class="manufacturer-suggestion-button"
                  on:click={() => selectManufacturer(name)}
                  disabled={isSaving}
                >
                  {name}
                </button>
              </Chip>
            {/each}
          </div>
        </div>
      {:else if machine?.manufacturer}
        <span class="detail-value">{machine.manufacturer}</span>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>
    
    <div class="machine-detail">
      <span class="detail-label">Model</span>
      {#if isEditing}
        <input
          type="text"
          bind:value={formData.model}
          class="detail-input"
          class:error={validationErrors.model}
          placeholder="e.g., Linea Mini"
          disabled={isSaving}
        />
        {#if validationErrors.model}
          <span class="validation-error">{validationErrors.model}</span>
        {/if}
      {:else if machine?.model}
        <span class="detail-value">{machine.model}</span>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>
    
    <div class="machine-detail">
      <span class="detail-label">User Manual</span>
      {#if isEditing}
        <input
          type="url"
          bind:value={formData.user_manual_link}
          class="detail-input"
          class:error={validationErrors.user_manual_link}
          placeholder="https://example.com/manual.pdf"
          disabled={isSaving}
        />
        {#if validationErrors.user_manual_link}
          <span class="validation-error">{validationErrors.user_manual_link}</span>
        {/if}
      {:else if machine?.user_manual_link}
        <a href={machine.user_manual_link} target="_blank" rel="noopener noreferrer" class="detail-link">
          View Manual
        </a>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>

    {#if isEditing}
      <div class="machine-detail image-detail">
        <span class="detail-label">Image</span>
        <ImageUpload
          currentImageUrl={formData.image_path}
          entityType="machine"
          entityId={machine?.id || ''}
          on:upload={handleImageUpload}
          on:delete={handleImageDelete}
          on:error={handleImageError}
          disabled={isSaving}
        />
      </div>
    {/if}
  </div>

    </div>
</div>

<style>
  .machine-card {
    background: var(--editable-card-bg, var(--bg-surface-paper));
    border: var(--editable-card-border-width, 1px) var(--editable-card-border-style, solid) var(--editable-card-border, var(--border-subtle));
    border-radius: var(--editable-card-radius, var(--radius-md));
    padding: var(--editable-card-padding, 1rem);
    transition: var(--editable-card-transition, border-color var(--motion-fast));
  }

  .machine-card.editing {
    border-color: var(--editable-card-edit-border, var(--accent-primary));
    box-shadow: var(--editable-card-edit-shadow, 0 0 0 2px rgba(176, 138, 90, 0.1));
  }

  .machine-card.new-machine {
    border-color: var(--editable-card-new-border, var(--accent-primary));
    border-style: var(--editable-card-new-border-style, dashed);
    background: var(--editable-card-new-bg, var(--bg-surface-paper-secondary));
    margin-bottom: var(--editable-card-new-margin, 1.5rem);
  }

  .machine-card.new-machine.editing {
    border-style: var(--editable-card-new-edit-border-style, solid);
    background: var(--editable-card-new-edit-bg, var(--bg-surface-paper));
    margin-bottom: var(--editable-card-new-edit-margin, 1.5rem);
  }

  .card-media {
    width: 100%;
    height: var(--editable-card-image-height, 150px);
    border-radius: var(--editable-card-radius, var(--radius-sm));
    border: 1px solid var(--editable-card-border, var(--border-subtle));
    overflow: hidden;
    background: rgba(123, 94, 58, 0.06);
    margin-top: 0.75rem;
  }

  .card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .machine-header {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: var(--editable-card-header-margin, 0.75rem);
  }

  .machine-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .machine-title {
    flex: 1;
    min-width: 0;
  }

  .machine-title h4 {
    margin: 0;
    color: var(--editable-card-title-color, var(--text-ink-primary));
    font-family: var(--editable-card-title-font, "IBM Plex Sans", system-ui, sans-serif);
    font-size: var(--editable-card-title-size, 1rem);
    font-weight: var(--editable-card-title-weight, 500);
    word-wrap: break-word;
  }

  .machine-info {
    color: var(--editable-card-info-color, var(--text-ink-secondary));
    font-family: var(--editable-card-info-font, "IBM Plex Sans", system-ui, sans-serif);
    font-size: var(--editable-card-info-size, 0.8rem);
    margin-top: 0.25rem;
    display: block;
  }

  .machine-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .machine-meta .separator {
    color: var(--text-ink-muted);
  }

  .machine-actions {
    display: flex;
    align-items: center;
    gap: var(--editable-card-actions-gap, 0.5rem);
    flex-shrink: 0;
  }

  .edit-actions {
    display: flex;
    gap: var(--editable-card-edit-actions-gap, 0.25rem);
  }

  .error-message {
    background: var(--editable-card-error-bg, rgba(122, 62, 47, 0.1));
    color: var(--editable-card-error-color, var(--semantic-error));
    border: 1px solid var(--editable-card-error-border, rgba(122, 62, 47, 0.3));
    border-radius: var(--editable-card-error-radius, var(--radius-sm));
    padding: var(--editable-card-error-padding, 0.5rem 0.75rem);
    margin-bottom: 0.75rem;
    font-family: var(--editable-card-error-font, "IBM Plex Sans", system-ui, sans-serif);
    font-size: var(--editable-card-error-size, 0.9rem);
  }

  .machine-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--editable-card-detail-min-col, 200px), 1fr));
    gap: var(--editable-card-grid-gap, 0.75rem);
  }

  .machine-detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .machine-detail.image-detail {
    grid-column: 1 / -1;
  }

  .detail-label {
    font-weight: var(--editable-card-label-weight, 500);
    color: var(--editable-card-label-color, var(--text-ink-secondary));
    font-family: var(--editable-card-label-font, "IBM Plex Sans", system-ui, sans-serif);
    font-size: var(--editable-card-label-size, 0.8rem);
  }

  .detail-value {
    color: var(--editable-card-value-color, var(--text-ink-primary));
    font-family: var(--editable-card-value-font, "Libre Baskerville", serif);
    font-size: var(--editable-card-value-size, 0.9rem);
  }

  .detail-empty {
    color: var(--editable-card-empty-color, var(--text-ink-muted));
    font-family: var(--editable-card-empty-font, "IBM Plex Sans", system-ui, sans-serif);
    font-style: var(--editable-card-empty-style, italic);
  }

  .detail-link {
    color: var(--editable-card-edit-border, var(--accent-primary));
    text-decoration: none;
    font-family: var(--editable-card-input-font, "IBM Plex Sans", system-ui, sans-serif);
    font-size: var(--editable-card-input-size, 0.9rem);
    transition: color var(--motion-fast);
  }

  .detail-link:hover {
    color: var(--accent-primary-dark);
    text-decoration: underline;
  }

  .detail-input {
    color: var(--editable-card-input-color, var(--text-ink-primary));
    font-size: var(--editable-card-input-size, 0.9rem);
    font-family: var(--editable-card-input-font, "IBM Plex Sans", system-ui, sans-serif);
    background: var(--editable-card-input-bg, var(--bg-surface-paper));
    border: var(--editable-card-input-border-width, 1px) solid var(--editable-card-input-border, var(--border-subtle));
    border-radius: var(--editable-card-input-radius, var(--radius-sm));
    padding: var(--editable-card-input-padding, 0.4rem 0.6rem);
    transition: border-color var(--motion-fast);
  }

  .detail-input:focus {
    outline: none;
    border-color: var(--editable-card-edit-border, var(--accent-primary));
    box-shadow: var(--editable-card-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.1));
  }

  .detail-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .detail-input.error {
    border-color: var(--semantic-error);
  }

  .manufacturer-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .manufacturer-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .manufacturer-suggestion-button {
    background: transparent;
    border: none;
    padding: 0;
    font-size: inherit;
    font-family: inherit;
    color: inherit;
    cursor: pointer;
    transition: all var(--motion-fast);
  }

  .manufacturer-suggestion-button:hover {
    opacity: 0.8;
  }

  .manufacturer-suggestion-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .validation-error {
    color: var(--semantic-error);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.8rem;
  }

  .machine-actions {
    justify-content: flex-end;
  }

  .usage-stats {
    margin-top: 0.5rem;
  }

  .equipment-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    .card-media {
      height: auto;
      max-height: var(--editable-card-image-height, 150px);
    }
  }
</style>
