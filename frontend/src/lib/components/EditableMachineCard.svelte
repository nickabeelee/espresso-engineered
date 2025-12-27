<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { adminService } from '$lib/admin-service';
  import { barista } from '$lib/auth';
  import IconButton from '$lib/components/IconButton.svelte';
  import ImageUpload from '$lib/components/ImageUpload.svelte';
  import { PencilSquare, CheckCircle, XMark, Plus } from '$lib/icons';
  import { getImageUrl } from '$lib/utils/image-utils';
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

  function handleImageUpload(event: CustomEvent<{ file: File; imageUrl: string }>) {
    formData.image_path = event.detail.imageUrl;
  }

  function handleImageDelete() {
    formData.image_path = '';
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

  // Initialize form data when component mounts or props change
  $: if (isNewMachine || machine) {
    initializeFormData();
  }
</script>

<div class="machine-card" class:editing={isEditing} class:new-machine={isNewMachine} on:keydown={handleKeydown} role="region" tabindex="-1">
  <div class="machine-header">
    <div class="machine-title">
      {#if isNewMachine}
        <h4>New Machine</h4>
        <span class="machine-info">Add a new espresso machine</span>
      {:else if machine}
        <h4>{machine.manufacturer} {machine.model}</h4>
        <div class="machine-info-row">
          <span class="machine-info">Global equipment</span>
          {#if usageCount > 0}
            <span class="usage-badge">{usageCount} brews</span>
          {/if}
        </div>
      {/if}
    </div>
    
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
              <button
                type="button"
                class="manufacturer-suggestion"
                on:click={() => selectManufacturer(name)}
                disabled={isSaving}
              >
                {name}
              </button>
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
          currentImagePath={formData.image_path}
          on:uploaded={handleImageUpload}
          on:deleted={handleImageDelete}
          disabled={isSaving}
        />
      </div>
    {:else if machine?.image_path}
      <div class="machine-detail image-detail">
        <span class="detail-label">Image</span>
        <img 
          src={getImageUrl(machine.image_path)} 
          alt="{machine.manufacturer} {machine.model}"
          class="machine-image"
        />
      </div>
    {/if}
  </div>

  {#if !isEditing && !isNewMachine && mostUsedBy}
    <div class="usage-stats">
      <span class="most-used-by">Most used by {mostUsedBy.display_name}</span>
    </div>
  {/if}

  {#if !isEditing && !isNewMachine && canEdit}
    <div class="machine-actions-section">
      <button
        type="button"
        class="delete-button"
        on:click={handleDelete}
        disabled={isSaving}
      >
        Delete Machine
      </button>
    </div>
  {/if}
</div>

<style>
  .machine-card {
    background: var(--bg-surface-paper);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem;
    transition: border-color var(--motion-fast);
  }

  .machine-card.editing {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.1);
  }

  .machine-card.new-machine {
    border-color: var(--accent-primary);
    border-style: dashed;
    background: var(--bg-surface-paper-secondary);
    margin-bottom: 1.5rem;
  }

  .machine-card.new-machine.editing {
    border-style: solid;
    background: var(--bg-surface-paper);
    margin-bottom: 1.5rem;
  }

  .machine-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .machine-title {
    flex: 1;
    min-width: 0;
  }

  .machine-title h4 {
    margin: 0;
    color: var(--text-ink-primary);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 500;
    word-wrap: break-word;
  }

  .machine-info {
    color: var(--text-ink-secondary);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: block;
  }

  .machine-info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .usage-badge {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  .machine-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .edit-actions {
    display: flex;
    gap: 0.25rem;
  }

  .error-message {
    background: rgba(122, 62, 47, 0.1);
    color: var(--semantic-error);
    border: 1px solid rgba(122, 62, 47, 0.3);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.75rem;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.9rem;
  }

  .machine-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
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
    font-weight: 500;
    color: var(--text-ink-secondary);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.8rem;
  }

  .detail-value {
    color: var(--text-ink-primary);
    font-family: "Libre Baskerville", serif;
    font-size: 0.9rem;
  }

  .detail-empty {
    color: var(--text-ink-muted);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-style: italic;
  }

  .detail-link {
    color: var(--accent-primary);
    text-decoration: none;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.9rem;
    transition: color var(--motion-fast);
  }

  .detail-link:hover {
    color: var(--accent-primary-dark);
    text-decoration: underline;
  }

  .detail-input {
    color: var(--text-ink-primary);
    font-size: 0.9rem;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    background: var(--bg-surface-paper);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.6rem;
    transition: border-color var(--motion-fast);
  }

  .detail-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.1);
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

  .manufacturer-suggestion {
    background: var(--bg-surface-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.5rem;
    font-size: 0.8rem;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    color: var(--text-ink-inverted);
    cursor: pointer;
    transition: all var(--motion-fast);
  }

  .manufacturer-suggestion:hover {
    background: var(--accent-primary);
    color: var(--text-ink-primary);
    border-color: var(--accent-primary);
  }

  .manufacturer-suggestion:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .validation-error {
    color: var(--semantic-error);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.8rem;
  }

  .machine-image {
    max-width: 200px;
    max-height: 150px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-subtle);
  }

  .usage-stats {
    padding: 0.75rem;
    background: var(--bg-surface-secondary);
    border-radius: var(--radius-sm);
    margin-top: 0.75rem;
  }

  .most-used-by {
    color: var(--text-ink-inverted-muted);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.8rem;
  }

  .machine-actions-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-subtle);
  }

  .delete-button {
    background: transparent;
    border: 1px solid var(--semantic-error);
    color: var(--semantic-error);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    cursor: pointer;
    transition: all var(--motion-fast);
  }

  .delete-button:hover {
    background: var(--semantic-error);
    color: var(--text-ink-inverted);
  }

  .delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>