<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import BeanSelector from '$lib/components/BeanSelector.svelte';
  import DateInput from '$lib/components/DateInput.svelte';
  import WeightInput from '$lib/components/WeightInput.svelte';
  import { CheckCircle, XMark } from '$lib/icons';
  import { inlineCreator } from '$lib/ui/components/inline-creator';
  import { toStyleString } from '$lib/ui/style';
  import type { InventoryStatus } from '../../../../shared/types';

  const dispatch = createEventDispatcher<{
    created: Bag;
    cancel: void;
  }>();

  // Form fields
  let bean_id = '';
  let roast_date = '';
  let weight_g: number | undefined = undefined;
  let price: number | undefined = undefined;
  let purchase_location = '';
  let inventory_status: InventoryStatus | undefined = undefined;


  // UI state
  let loading = false;
  let error: string | null = null;
  let validationErrors: Record<string, string> = {};

  const style = toStyleString({
    '--inline-bg': inlineCreator.container.background,
    '--inline-border': inlineCreator.container.borderColor,
    '--inline-border-width': inlineCreator.container.borderWidth,
    '--inline-radius': inlineCreator.container.radius,
    '--inline-padding': inlineCreator.container.padding,
    '--inline-margin': inlineCreator.container.margin,
    '--inline-title-color': inlineCreator.header.titleColor,
    '--inline-title-size': inlineCreator.header.titleSize,
    '--inline-title-margin': inlineCreator.header.marginBottom,
    '--inline-close-color': inlineCreator.closeButton.color,
    '--inline-close-hover': inlineCreator.closeButton.hoverColor,
    '--inline-error-bg': inlineCreator.errorBanner.background,
    '--inline-error-border': inlineCreator.errorBanner.borderColor,
    '--inline-error-color': inlineCreator.errorBanner.textColor,
    '--inline-error-radius': inlineCreator.errorBanner.radius,
    '--inline-error-padding': inlineCreator.errorBanner.padding,
    '--inline-error-size': inlineCreator.errorBanner.fontSize,
    '--inline-form-gap': inlineCreator.form.gap,
    '--inline-row-gap': inlineCreator.form.rowGap,
    '--inline-label-color': inlineCreator.label.color,
    '--inline-label-size': inlineCreator.label.fontSize,
    '--inline-label-weight': inlineCreator.label.fontWeight,
    '--inline-input-padding': inlineCreator.input.padding,
    '--inline-input-border': inlineCreator.input.borderColor,
    '--inline-input-bg': inlineCreator.input.background,
    '--inline-input-radius': inlineCreator.input.radius,
    '--inline-input-size': inlineCreator.input.fontSize,
    '--inline-input-focus': inlineCreator.input.focusRing,
    '--inline-input-disabled-bg': inlineCreator.input.disabledBackground,
    '--inline-actions-gap': inlineCreator.actions.gap
  });

  function validateForm(): boolean {
    validationErrors = {};

    if (!bean_id) {
      validationErrors.bean_id = 'Bean is required';
    }
    if (weight_g !== undefined && weight_g < 0) {
      validationErrors.weight_g = 'Weight cannot be negative';
    }
    if (price !== undefined && price < 0) {
      validationErrors.price = 'Price cannot be negative';
    }

    return Object.keys(validationErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      error = 'Please fix validation errors';
      return;
    }

    try {
      loading = true;
      error = null;

      const bagData: CreateBagRequest = {
        bean_id,
        roast_date: roast_date || undefined,
        weight_g: weight_g ?? undefined,
        price,
        purchase_location: purchase_location.trim() || undefined,
        inventory_status
      };

      const response = await apiClient.createBag(bagData);
      
      if (response.data) {
        dispatch('created', response.data);
      } else {
        throw new Error('Failed to create bag');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create bag';
      console.error('Failed to create bag:', err);
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Set default roast date to today
  function setTodayAsRoastDate() {
    const today = new Date();
    roast_date = today.toISOString().split('T')[0];
  }

  // Auto naming handled in the brew form; bag creation does not preview a name.
</script>

<div class="inline-bag-creator" style={style}>
  <div class="creator-header">
    <h4>Create New Bag</h4>
    <IconButton
      type="button"
      on:click={handleCancel}
      ariaLabel="Cancel bag"
      title="Cancel"
      variant="neutral"
      disabled={loading}
    >
      <XMark />
    </IconButton>
  </div>

  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

    <form on:submit|preventDefault={handleSubmit} class="creator-form">
      <!-- Name Preview -->
      <div class="form-group">
        <label>Bean *</label>
        <div class="bean-input-group">
          <BeanSelector bind:value={bean_id} disabled={loading} />
        </div>
        {#if validationErrors.bean_id}
          <span class="error-text">{validationErrors.bean_id}</span>
        {/if}
      </div>

      <div class="form-row">
        <div class="form-group">
          <DateInput
            id="roast-date"
            label="Roast Date"
            bind:value={roast_date}
            disabled={loading}
            actionLabel="Today"
            on:action={setTodayAsRoastDate}
          />
        </div>

        <div class="form-group">
          <WeightInput
            id="weight"
            label="Weight"
            valueGrams={weight_g ?? null}
            disabled={loading}
            on:change={(event) => (weight_g = event.detail.grams ?? undefined)}
          />
          {#if validationErrors.weight_g}
            <span class="error-text">{validationErrors.weight_g}</span>
          {/if}
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="price">Price ($)</label>
          <input
            id="price"
            type="number"
            inputmode="decimal"
            bind:value={price}
            step="0.01"
            min="0"
            placeholder="e.g., 15.99"
            disabled={loading}
          />
          {#if validationErrors.price}
            <span class="error-text">{validationErrors.price}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="purchase-location">Purchase Location</label>
          <input
            id="purchase-location"
            type="text"
            bind:value={purchase_location}
            placeholder="e.g., Local Coffee Shop"
            disabled={loading}
          />
        </div>
      </div>

      <div class="form-group">
        <label for="inventory-status">Inventory Status</label>
        <select
          id="inventory-status"
          bind:value={inventory_status}
          disabled={loading}
        >
          <option value="">Select status...</option>
          <option value="unopened">📦 Unopened</option>
          <option value="plenty">✅ Plenty</option>
          <option value="getting_low">⚠️ Getting Low</option>
          <option value="empty">❌ Empty</option>
        </select>
      </div>

      <div class="form-actions">
        <IconButton type="button" on:click={handleCancel} ariaLabel="Cancel bag" title="Cancel" variant="neutral" disabled={loading}>
          <XMark />
        </IconButton>
        <IconButton
          type="submit"
          ariaLabel={loading ? 'Creating bag' : 'Create bag'}
          title="Create Bag"
          variant="success"
          disabled={loading}
        >
          <CheckCircle />
        </IconButton>
      </div>
    </form>
</div>

<style>
  .inline-bag-creator {
    background: var(--inline-bg, var(--bg-surface-paper-secondary));
    border: var(--inline-border-width, 2px) solid var(--inline-border, var(--accent-primary));
    border-radius: var(--inline-radius, var(--radius-md));
    padding: var(--inline-padding, 1.5rem);
    margin: var(--inline-margin, 0.5rem 0);
  }

  .creator-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--inline-title-margin, 1rem);
  }

  .creator-header h4 {
    margin: 0;
    color: var(--inline-title-color, var(--accent-primary));
    font-size: var(--inline-title-size, 1.1rem);
  }


  .error-banner {
    background: var(--inline-error-bg, rgba(122, 62, 47, 0.12));
    border: 1px solid var(--inline-error-border, rgba(122, 62, 47, 0.25));
    color: var(--inline-error-color, var(--semantic-error));
    padding: var(--inline-error-padding, 0.75rem);
    border-radius: var(--inline-error-radius, var(--radius-sm));
    margin-bottom: 1rem;
    font-size: var(--inline-error-size, 0.9rem);
  }


  .creator-form {
    display: flex;
    flex-direction: column;
    gap: var(--inline-form-gap, 1rem);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--inline-row-gap, 1rem);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: var(--inline-label-weight, 600);
    color: var(--inline-label-color, var(--text-ink-primary));
    font-size: var(--inline-label-size, 0.9rem);
  }

  .form-group input,
  .form-group select {
    padding: var(--inline-input-padding, 0.5rem);
    border: 1px solid var(--inline-input-border, var(--border-subtle));
    border-radius: var(--inline-input-radius, var(--radius-sm));
    font-size: var(--inline-input-size, 0.9rem);
    background: var(--inline-input-bg, var(--bg-surface-paper));
    font-family: inherit;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: var(--inline-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.2));
  }

  .form-group input:disabled,
  .form-group select:disabled {
    background: var(--inline-input-disabled-bg, var(--bg-surface-paper-secondary));
    cursor: not-allowed;
  }

  .bean-input-group {
    display: flex;
    gap: 0.5rem;
  }

  .bean-input-group :global(.bean-selector) {
    flex: 1;
    min-width: 0;
  }

  .error-text {
    color: var(--semantic-error);
    font-size: 0.8rem;
  }

  .form-actions {
    display: flex;
    gap: var(--inline-actions-gap, 0.75rem);
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    .bean-input-group {
      flex-direction: column;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
