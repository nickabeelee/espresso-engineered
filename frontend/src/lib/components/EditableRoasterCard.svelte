<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { adminService } from '$lib/admin-service';
  import { barista } from '$lib/auth';
  import { getRoasterPermissions, handlePermissionError } from '$lib/permissions';
  import IconButton from '$lib/components/IconButton.svelte';
  import { PencilSquare, CheckCircle, XMark, Trash } from '$lib/icons';
  import { editableCard, editableCardVariants } from '$lib/ui/components/editable-card';
  import { toStyleString } from '$lib/ui/style';
  import type { Roaster, CreateRoasterRequest } from '@shared/types';

  export let roaster: Roaster;

  const dispatch = createEventDispatcher<{
    updated: Roaster;
    deleted: string;
  }>();

  let isEditing = false;
  let isSaving = false;
  let error: string | null = null;
  let validationErrors: Record<string, string> = {};
  let formData: Partial<CreateRoasterRequest> = {};

  $: roasterPermissions = getRoasterPermissions($barista, roaster);
  $: canEdit = roasterPermissions.canEdit;
  $: canDelete = roasterPermissions.canDelete;
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
    '--editable-card-input-focus': editableCard.input.focusRing
  });

  function initializeFormData() {
    formData = {
      name: roaster?.name ?? '',
      website_url: roaster?.website_url ?? ''
    };
  }

  function handleEdit() {
    if (!canEdit) return;
    initializeFormData();
    isEditing = true;
    error = null;
    validationErrors = {};
  }

  function handleCancel() {
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

    if (!formData.name?.trim()) {
      validationErrors.name = 'Roaster name is required';
    }

    if (formData.website_url && !isValidUrl(formData.website_url)) {
      validationErrors.website_url = 'Please enter a valid URL';
    }

    return Object.keys(validationErrors).length === 0;
  }

  async function handleSave() {
    if (!canEdit || !roaster) return;
    if (!validateForm()) {
      error = 'Please fix validation errors';
      return;
    }

    try {
      isSaving = true;
      error = null;

      const payload: CreateRoasterRequest = {
        name: formData.name!.trim(),
        website_url: formData.website_url?.trim() || undefined
      };

      const response = await apiClient.updateRoaster(roaster.id, payload);
      if (response.data) {
        dispatch('updated', response.data);
        isEditing = false;
        formData = {};
      } else {
        throw new Error('Failed to update roaster');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update roaster';
      const permissionMessage = err instanceof Error
        ? handlePermissionError(err, 'edit', 'roaster')
        : null;
      error = permissionMessage || message;
      console.error('Failed to update roaster:', err);
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete() {
    if (!roaster || !canDelete || !isAdmin) return;

    const confirmed = window.confirm('Delete this roaster? This cannot be undone.');
    if (!confirmed) return;

    try {
      isSaving = true;
      error = null;

      await adminService.deleteRoaster(roaster.id);
      dispatch('deleted', roaster.id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete roaster';
      console.error('Failed to delete roaster:', err);
    } finally {
      isSaving = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleSave();
    }
  }

  $: if (roaster && !isEditing) {
    initializeFormData();
  }
</script>

<article
  class="roaster-card"
  class:editing={isEditing}
  on:keydown={handleKeydown}
  role="region"
  tabindex="-1"
  style={style}
>
  <div class="roaster-card-body">
    <div class="roaster-header">
      <div class="roaster-title">
        <h4>{roaster?.name}</h4>
        <span class="roaster-info">Roaster directory</span>
      </div>
    </div>

    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}

    <div class="roaster-details">
      <div class="roaster-detail">
        <span class="detail-label">Roaster name</span>
        {#if isEditing}
          <input
            type="text"
            bind:value={formData.name}
            class="detail-input"
            class:error={validationErrors.name}
            placeholder="e.g., April Coffee Roasters"
            disabled={isSaving}
          />
          {#if validationErrors.name}
            <span class="validation-error">{validationErrors.name}</span>
          {/if}
        {:else}
          <span class="detail-value">{roaster?.name}</span>
        {/if}
      </div>

      <div class="roaster-detail">
        <span class="detail-label">Website</span>
        {#if isEditing}
          <input
            type="url"
            bind:value={formData.website_url}
            class="detail-input"
            class:error={validationErrors.website_url}
            placeholder="https://roaster.com"
            disabled={isSaving}
          />
          {#if validationErrors.website_url}
            <span class="validation-error">{validationErrors.website_url}</span>
          {/if}
        {:else if roaster?.website_url}
          <a
            href={roaster.website_url}
            target="_blank"
            rel="noopener noreferrer"
            class="detail-link"
          >
            Visit site
          </a>
        {:else}
          <span class="detail-value detail-empty">Not specified</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="roaster-actions-row">
    <div class="roaster-actions">
      {#if canEdit && !isEditing}
        <IconButton
          on:click={handleEdit}
          ariaLabel="Edit roaster"
          title="Edit roaster"
          variant="accent"
          size="sm"
        >
          <PencilSquare />
        </IconButton>
        {#if canDelete}
          <IconButton
            on:click={handleDelete}
            ariaLabel="Delete roaster"
            title="Delete roaster"
            variant="danger"
            size="sm"
            disabled={isSaving}
          >
            <Trash />
          </IconButton>
        {/if}
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
            ariaLabel="Save roaster"
            title="Save"
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
</article>

<style>
  .roaster-card {
    background: var(--editable-card-bg, var(--bg-surface-paper));
    border: var(--editable-card-border-width, 1px) var(--editable-card-border-style, solid) var(--editable-card-border, var(--border-subtle));
    border-radius: var(--editable-card-radius, var(--radius-md));
    padding: var(--editable-card-padding, 1rem);
    transition: var(--editable-card-transition, border-color var(--motion-fast));
  }

  .roaster-card.editing {
    border-color: var(--editable-card-edit-border, var(--accent-primary));
    box-shadow: var(--editable-card-edit-shadow, 0 0 0 2px rgba(176, 138, 90, 0.1));
  }

  .roaster-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--editable-card-header-margin, 0.75rem);
  }

  .roaster-title h4 {
    font-family: var(--editable-card-title-font, var(--font-brand));
    font-size: var(--editable-card-title-size, 1.2rem);
    font-weight: var(--editable-card-title-weight, 600);
    color: var(--editable-card-title-color, var(--text-ink-primary));
    margin: 0;
  }

  .roaster-info {
    font-family: var(--editable-card-info-font, var(--font-ui));
    font-size: var(--editable-card-info-size, 0.85rem);
    color: var(--editable-card-info-color, var(--text-ink-muted));
  }

  .roaster-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--editable-card-detail-min-col, 200px), 1fr));
    gap: var(--editable-card-grid-gap, 1rem);
  }

  .roaster-detail {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .detail-label {
    font-family: var(--editable-card-label-font, var(--font-ui));
    font-size: var(--editable-card-label-size, 0.8rem);
    font-weight: var(--editable-card-label-weight, 600);
    color: var(--editable-card-label-color, var(--text-ink-muted));
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .detail-value {
    font-family: var(--editable-card-value-font, var(--font-body));
    font-size: var(--editable-card-value-size, 0.95rem);
    color: var(--editable-card-value-color, var(--text-ink-primary));
  }

  .detail-value.detail-empty {
    font-style: var(--editable-card-empty-style, italic);
    color: var(--editable-card-empty-color, var(--text-ink-muted));
  }

  .detail-input {
    font-family: var(--editable-card-input-font, var(--font-ui));
    font-size: var(--editable-card-input-size, 0.95rem);
    color: var(--editable-card-input-color, var(--text-ink-primary));
    background: var(--editable-card-input-bg, var(--bg-surface-paper));
    border: var(--editable-card-input-border-width, 1px) solid var(--editable-card-input-border, var(--border-subtle));
    border-radius: var(--editable-card-input-radius, var(--radius-sm));
    padding: var(--editable-card-input-padding, 0.5rem 0.6rem);
  }

  .detail-input:focus {
    outline: none;
    box-shadow: var(--editable-card-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.2));
  }

  .detail-input.error {
    border-color: var(--semantic-error);
  }

  .validation-error {
    color: var(--semantic-error);
    font-size: 0.8rem;
  }

  .detail-link {
    color: var(--accent-primary);
    text-decoration: none;
  }

  .detail-link:hover {
    text-decoration: underline;
  }

  .roaster-actions-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .roaster-actions {
    display: flex;
    gap: var(--editable-card-actions-gap, 0.5rem);
    align-items: center;
  }

  .edit-actions {
    display: flex;
    gap: var(--editable-card-edit-actions-gap, 0.4rem);
  }

  .error-message {
    background: var(--editable-card-error-bg, rgba(122, 62, 47, 0.12));
    border: 1px solid var(--editable-card-error-border, rgba(122, 62, 47, 0.25));
    color: var(--editable-card-error-color, var(--semantic-error));
    border-radius: var(--editable-card-error-radius, var(--radius-sm));
    padding: var(--editable-card-error-padding, 0.75rem);
    font-family: var(--editable-card-error-font, var(--font-ui));
    font-size: var(--editable-card-error-size, 0.9rem);
    margin-bottom: 1rem;
  }
</style>
