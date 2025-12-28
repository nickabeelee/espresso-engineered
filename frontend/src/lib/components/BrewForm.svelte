<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import IconButton from '$lib/components/IconButton.svelte';
  import { CheckCircle, DocumentDuplicate, XMark } from '$lib/icons';
  import { buildBrewName } from '$lib/utils/brew-naming';

  import BeanSelector from './BeanSelector.svelte';
  import BagSelector from './BagSelector.svelte';
  import GrinderSelector from './GrinderSelector.svelte';
  import MachineSelector from './MachineSelector.svelte';

  export let brew: Brew | null = null;
  let name = '';
  let isNameAuto = true;
  let nameTouched = false;
  let lastGeneratedName = '';

  const dispatch = createEventDispatcher<{
    save: CreateBrewRequest;
    cancel: void;
  }>();

  // Form fields
  let machine_id = '';
  let grinder_id = '';
  let bag_id = '';
  let dose_g = 18;
  let yield_g: number | undefined = undefined;
  let brew_time_s: number | undefined = undefined;
  let grind_setting = '';
  let rating: number | undefined = undefined;
  let tasting_notes = '';
  let reflections = '';
  let prefillData: PrefillData | null = null;
  let prefillAvailable = false;
  let prefillLoading = false;
  let prefillApplied = false;

  let outputSection: HTMLDivElement | null = null;
  let doseInput: HTMLInputElement | null = null;
  let grindSettingInput: HTMLInputElement | null = null;
  let brewTimeInput: HTMLInputElement | null = null;
  let yieldInput: HTMLInputElement | null = null;
  let ratingInput: HTMLInputElement | null = null;
  let tastingNotesInput: HTMLTextAreaElement | null = null;
  let reflectionsInput: HTMLTextAreaElement | null = null;
  let machineSelector: MachineSelector | null = null;
  let grinderSelector: GrinderSelector | null = null;
  let bagSelector: BagSelector | null = null;

  // Auto name state
  let autoName = '';
  let autoNameTimestamp: Date | null = null;
  let lastBagIdForAuto = '';
  let selectedBeanName = '';
  let brewHistory: Brew[] = [];

  // Calculated fields
  let flow_rate_g_per_s: number | undefined = undefined;
  let ratio: number | undefined = undefined;

  // UI state
  let loading = false;
  let error: string | null = null;
  let validationErrors: Record<string, string> = {};

  onMount(async () => {
    if (brew) {
      // Editing existing brew
      loadBrewData(brew);
    } else {
      await checkPrefillAvailability();
    }
  });

  function normalizeNumber(value: number | null | undefined): number | undefined {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return undefined;
    }

    return value;
  }

  function loadBrewData(brewData: Brew) {
    name = brewData.name ?? '';
    isNameAuto = false;
    nameTouched = true;
    lastGeneratedName = '';
    machine_id = brewData.machine_id;
    grinder_id = brewData.grinder_id;
    bag_id = brewData.bag_id;
    dose_g = brewData.dose_g;
    yield_g = normalizeNumber(brewData.yield_g);
    brew_time_s = normalizeNumber(brewData.brew_time_s);
    grind_setting = brewData.grind_setting ?? '';
    rating = normalizeNumber(brewData.rating);
    tasting_notes = brewData.tasting_notes ?? '';
    reflections = brewData.reflections ?? '';
  }

  async function checkPrefillAvailability() {
    try {
      prefillLoading = true;
      const response = await apiClient.getPrefillData();
      
      if (response.data) {
        prefillData = response.data;
        prefillAvailable = true;
      }
    } catch (err) {
      prefillAvailable = false;
    } finally {
      prefillLoading = false;
    }
  }

  function applyPrefillData(prefill: PrefillData) {
    machine_id = prefill.machine_id;
    grinder_id = prefill.grinder_id;
    bag_id = prefill.bag_id;
    grind_setting = prefill.grind_setting || '';
    dose_g = prefill.dose_g;
    // Keep name auto-generated when duplicating from last brew.
    isNameAuto = true;
    nameTouched = false;
    name = '';
    lastGeneratedName = '';
    prefillApplied = true;
  }

  async function handleDuplicateFromLast() {
    try {
      prefillLoading = true;
      if (!prefillData) {
        const response = await apiClient.getPrefillData();
        prefillData = response.data ?? null;
      }
      if (prefillData) {
        applyPrefillData(prefillData);
        await tick();
        outputSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error('Failed to duplicate from last brew:', err);
    } finally {
      prefillLoading = false;
    }
  }

  function handleEnterAdvance(event: KeyboardEvent, next: (() => void) | null) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!next) return;
    void (async () => {
      await tick();
      next();
    })();
  }

  function focusNextFromMachine() {
    void (async () => {
      await tick();
      grinderSelector?.focusTrigger();
    })();
  }

  function focusNextFromGrinder() {
    void (async () => {
      await tick();
      bagSelector?.focusTrigger();
    })();
  }

  function focusNextFromBag() {
    void (async () => {
      await tick();
      doseInput?.focus();
    })();
  }

  function markNameTouched(_event?: Event) {
    nameTouched = true;
    isNameAuto = false;
  }

  function resetAutoName() {
    nameTouched = false;
    isNameAuto = true;
    if (!autoNameTimestamp) {
      autoNameTimestamp = new Date();
    }
    name = autoName || lastGeneratedName || '';
  }

  function calculateFields() {
    // Calculate flow rate: yield_g / brew_time_s
    if (yield_g && brew_time_s && brew_time_s > 0) {
      flow_rate_g_per_s = yield_g / brew_time_s;
    } else {
      flow_rate_g_per_s = undefined;
    }

    // Calculate ratio: yield_g / dose_g
    if (yield_g && dose_g && dose_g > 0) {
      ratio = yield_g / dose_g;
    } else {
      ratio = undefined;
    }
  }

  function validateForm(): boolean {
    validationErrors = {};

    if (!machine_id) {
      validationErrors.machine_id = 'Machine is required';
    }
    if (!grinder_id) {
      validationErrors.grinder_id = 'Grinder is required';
    }
    if (!bag_id) {
      validationErrors.bag_id = 'Bag is required';
    }
    if (!dose_g || dose_g <= 0) {
      validationErrors.dose_g = 'Dose must be greater than 0';
    }
    if (yield_g !== undefined && yield_g <= 0) {
      validationErrors.yield_g = 'Yield must be greater than 0';
    }
    if (brew_time_s !== undefined && brew_time_s <= 0) {
      validationErrors.brew_time_s = 'Brew time must be greater than 0';
    }
    if (rating !== undefined && (rating < 1 || rating > 10)) {
      validationErrors.rating = 'Rating must be between 1 and 10';
    }

    return Object.keys(validationErrors).length === 0;
  }

  function handleSave() {
    if (!validateForm()) {
      error = 'Please fix validation errors';
      return;
    }

    calculateFields();

    const brewData: CreateBrewRequest = {
      name: name.trim() || undefined,
      machine_id,
      grinder_id,
      bag_id,
      dose_g,
      yield_g: normalizeNumber(yield_g),
      brew_time_s: normalizeNumber(brew_time_s),
      grind_setting: grind_setting.trim() || undefined,
      rating: normalizeNumber(rating),
      tasting_notes: tasting_notes.trim() || undefined,
      reflections: reflections.trim() || undefined
    };

    dispatch('save', brewData);
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Reactive statement to recalculate when values change
  $: if (yield_g !== undefined || brew_time_s !== undefined || dose_g) {
    calculateFields();
  }

  function handleBagSelected(event: CustomEvent<{ bag: Bag | null; bean: Bean | null }>) {
    selectedBeanName = event.detail.bean?.name?.trim() || '';
  }

  function handleBrewsLoaded(event: CustomEvent<{ brews: Brew[] }>) {
    brewHistory = event.detail.brews || [];
  }

  // Reactive statement to update auto name when bag changes
  $: if (bag_id && bag_id !== lastBagIdForAuto) {
    lastBagIdForAuto = bag_id;
    autoNameTimestamp = new Date();
    selectedBeanName = '';
  }

  $: {
    const displayName = $barista?.display_name?.trim();
    const fallbackName = $barista?.first_name?.trim();
    const baristaName = displayName || fallbackName || 'Anonymous';

    if (bag_id && selectedBeanName && autoNameTimestamp) {
      autoName = buildBrewName({
        baristaDisplayName: baristaName,
        beanName: selectedBeanName,
        brewedAt: autoNameTimestamp,
        bagId: bag_id,
        existingBrews: brewHistory,
        excludeBrewId: brew?.id
      });

      lastGeneratedName = autoName;
      if (isNameAuto || (!nameTouched && !name)) {
        name = autoName;
        isNameAuto = true;
      }
    } else {
      autoName = '';
      if (isNameAuto) {
        name = '';
        lastGeneratedName = '';
      }
    }
  }

  $: if (!bag_id) {
    lastBagIdForAuto = '';
    autoNameTimestamp = null;
    selectedBeanName = '';
  }
</script>

<div class="brew-form">
  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  <form on:submit|preventDefault={handleSave}>
    {#if !brew && prefillAvailable && !prefillApplied}
      <div class="prefill-banner">
        <p class="voice-text">
          Carry the last brew forward.
        </p>
        <IconButton
          type="button"
          on:click={handleDuplicateFromLast}
          ariaLabel="Duplicate last brew"
          title="Duplicate last brew"
          variant="accent"
          disabled={prefillLoading}
        >
          <DocumentDuplicate />
        </IconButton>
      </div>
    {/if}

    <div class="form-section card">
      <div class="form-group name-group">
        <div class="label-row">
          <label for="name">Brew Name</label>
          {#if !brew}
            <span class={`auto-indicator ${isNameAuto ? 'auto' : 'custom'}`}>
              {isNameAuto ? 'Auto-generated' : 'Custom'}
            </span>
            {#if !isNameAuto}
              <button class="reset-auto" type="button" on:click={resetAutoName} disabled={loading}>
                Use auto name
              </button>
            {/if}
          {/if}
        </div>
        <input
          id="name"
          type="text"
          bind:value={name}
          on:input={markNameTouched}
          on:keydown={(event) => handleEnterAdvance(event, () => machineSelector?.focusTrigger())}
          enterkeyhint="next"
          placeholder={autoName || 'Auto brew name'}
          disabled={loading}
        />
        <small>
          {#if bag_id}
            {isNameAuto
              ? 'We will keep updating this name from your selections until you edit it.'
              : 'Name customized. We will keep your changes even if other fields change.'}
          {:else}
            Select a bag to generate an automatic name, or type your own.
          {/if}
        </small>
      </div>

    </div>

    <!-- Equipment Selection -->
    <div class="form-section card">
      <h3>Equipment</h3>
      
      <div class="form-group">
        <label for="machine">Machine *</label>
        <MachineSelector
          bind:value={machine_id}
          disabled={loading}
          bind:this={machineSelector}
          on:selected={focusNextFromMachine}
        />
        {#if validationErrors.machine_id}
          <span class="error-text">{validationErrors.machine_id}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="grinder">Grinder *</label>
        <GrinderSelector
          bind:value={grinder_id}
          disabled={loading}
          bind:this={grinderSelector}
          on:selected={focusNextFromGrinder}
        />
        {#if validationErrors.grinder_id}
          <span class="error-text">{validationErrors.grinder_id}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="bag">Coffee Bag *</label>
        <BagSelector
          bind:value={bag_id}
          disabled={loading}
          bind:this={bagSelector}
          on:bagSelected={handleBagSelected}
          on:brewsLoaded={handleBrewsLoaded}
          on:selected={focusNextFromBag}
        />
        {#if validationErrors.bag_id}
          <span class="error-text">{validationErrors.bag_id}</span>
        {/if}
      </div>
    </div>

    <!-- Input Parameters -->
    <div class="form-section card">
      <h3>Input Parameters</h3>
      
      <div class="form-row">
        <div class="form-group">
          <label for="dose">Dose (g) *</label>
          <input
            id="dose"
            type="number"
            inputmode="decimal"
            bind:value={dose_g}
            step="0.1"
            min="0"
            placeholder="e.g., 18"
            disabled={loading}
            required
            on:keydown={(event) => handleEnterAdvance(event, () => grindSettingInput?.focus())}
            enterkeyhint="next"
            bind:this={doseInput}
          />
          {#if validationErrors.dose_g}
            <span class="error-text">{validationErrors.dose_g}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="grind_setting">Grind Setting</label>
          <input
            id="grind_setting"
            type="text"
            inputmode="decimal"
            bind:value={grind_setting}
            placeholder="e.g., 2.5"
            disabled={loading}
            on:keydown={(event) => handleEnterAdvance(event, () => brewTimeInput?.focus())}
            enterkeyhint="next"
            bind:this={grindSettingInput}
          />
        </div>
      </div>
    </div>

    <!-- Output Measurements -->
    <div class="form-section card" bind:this={outputSection}>
      <h3>Output Measurements</h3>
      
      <div class="form-row">
        <div class="form-group">
          <label for="brew_time">Brew Time (s)</label>
          <input
            id="brew_time"
            type="number"
            inputmode="decimal"
            bind:value={brew_time_s}
            step="0.1"
            min="0.1"
            placeholder="e.g., 28"
            disabled={loading}
            on:keydown={(event) => handleEnterAdvance(event, () => yieldInput?.focus())}
            enterkeyhint="next"
            bind:this={brewTimeInput}
          />
          {#if validationErrors.brew_time_s}
            <span class="error-text">{validationErrors.brew_time_s}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="yield">Yield (g)</label>
          <input
            id="yield"
            type="number"
            inputmode="decimal"
            bind:value={yield_g}
            step="0.1"
            min="0.1"
            placeholder="e.g., 36"
            disabled={loading}
            on:keydown={(event) => handleEnterAdvance(event, () => ratingInput?.focus())}
            enterkeyhint="next"
            bind:this={yieldInput}
          />
          {#if validationErrors.yield_g}
            <span class="error-text">{validationErrors.yield_g}</span>
          {/if}
        </div>
      </div>

      <!-- Calculated Fields Display -->
      {#if ratio || flow_rate_g_per_s}
        <div class="calculated-fields">
          {#if ratio}
            <div class="calc-field">
              <span class="label">Ratio:</span>
              <span class="value">1:{ratio.toFixed(2)}</span>
            </div>
          {/if}
          {#if flow_rate_g_per_s}
            <div class="calc-field">
              <span class="label">Flow Rate:</span>
              <span class="value">{flow_rate_g_per_s.toFixed(1)} g/s</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Evaluation -->
    <div class="form-section card">
      <h3>Evaluation</h3>
      
      <div class="form-group">
        <label for="rating">Rating (1-10)</label>
        <input
          id="rating"
          type="number"
          inputmode="numeric"
          bind:value={rating}
          min="1"
          max="10"
          step="1"
          placeholder="e.g., 8"
          disabled={loading}
          on:keydown={(event) => handleEnterAdvance(event, () => tastingNotesInput?.focus())}
          enterkeyhint="next"
          bind:this={ratingInput}
        />
        {#if validationErrors.rating}
          <span class="error-text">{validationErrors.rating}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="tasting_notes">Tasting Notes</label>
        <textarea
          id="tasting_notes"
          bind:value={tasting_notes}
          rows="3"
          placeholder="e.g., notes of cacao and orange"
          disabled={loading}
          bind:this={tastingNotesInput}
        />
      </div>

      <div class="form-group">
        <label for="reflections">Reflections</label>
        <textarea
          id="reflections"
          bind:value={reflections}
          rows="3"
          placeholder="e.g., What worked? What would you change?"
          disabled={loading}
          bind:this={reflectionsInput}
        />
      </div>
    </div>

    <!-- Form Actions -->
    <div class="form-actions">
      <IconButton type="button" on:click={handleCancel} ariaLabel="Cancel brew" title="Cancel" variant="neutral" disabled={loading}>
        <XMark />
      </IconButton>
      <IconButton
        type="submit"
        ariaLabel={loading ? 'Saving brew' : (brew ? 'Save changes' : 'Save brew')}
        title={loading ? 'Saving...' : (brew ? 'Save changes' : 'Save brew')}
        variant="success"
        disabled={loading}
      >
        <CheckCircle />
      </IconButton>
    </div>
  </form>
</div>

<style>
  .brew-form {
    width: 100%;
  }

  .error-banner {
    background: rgba(122, 62, 47, 0.12);
    border: 1px solid rgba(122, 62, 47, 0.25);
    color: var(--semantic-error);
    padding: 1rem;
    border-radius: var(--radius-md);
    margin-bottom: 1.5rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-section h3 {
    margin: 0;
    color: var(--text-ink-secondary);
    font-size: 1.25rem;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 0.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 600;
    color: var(--text-ink-secondary);
    font-size: 0.95rem;
  }

  .form-group input,
  .form-group textarea {
    padding: 0.75rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    font-family: inherit;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .form-group input:disabled,
  .form-group textarea:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
  }

  .form-group small {
    color: var(--text-ink-muted);
    font-size: 0.85rem;
  }

  .voice-text {
    font-family: "Libre Baskerville", serif;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
    line-height: 1.7;
    margin: 0;
  }

  .prefill-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    background: var(--bg-surface-paper-secondary);
  }

  .label-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .auto-indicator {
    font-size: 0.85rem;
    border: 1px solid var(--border-subtle);
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-sm);
    background: var(--bg-surface-paper-secondary);
    color: var(--text-ink-secondary);
  }

  .auto-indicator.custom {
    border-color: rgba(122, 62, 47, 0.4);
    color: var(--accent-primary);
    background: rgba(122, 62, 47, 0.08);
  }

  .reset-auto {
    border: none;
    background: none;
    color: var(--accent-primary);
    cursor: pointer;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
  }

  .reset-auto:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .name-group input {
    font-weight: 600;
  }

  .error-text {
    color: var(--semantic-error);
    font-size: 0.85rem;
  }

  .calculated-fields {
    display: flex;
    gap: 2rem;
    padding: 1rem;
    background: var(--bg-surface-paper-secondary);
    border-radius: var(--radius-md);
    border: 1px solid rgba(123, 94, 58, 0.2);
  }

  .calc-field {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .calc-field .label {
    font-weight: 600;
    color: var(--text-ink-secondary);
  }

  .calc-field .value {
    color: var(--text-ink-primary);
    font-size: 1.1rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--border-subtle);
  }

</style>
