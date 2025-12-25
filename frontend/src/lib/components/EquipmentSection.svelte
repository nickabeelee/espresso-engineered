<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import IconButton from '$lib/components/IconButton.svelte';
  import ImageUpload from '$lib/components/ImageUpload.svelte';
  import { ArrowDownTray, ArrowPath, PencilSquare, Trash, XMark } from '$lib/icons';
  import { getImageUrl } from '$lib/utils/image-utils';
  import { buildEquipmentUsageStats, formatMostUsedBy } from '$lib/utils/usage-stats';
  import type { Barista } from '@shared/types';

  export let equipmentType: 'machine' | 'grinder';
  export let showForm = true;

  type LinkField = 'user_manual_link' | 'setting_guide_chart_url';

  const config = {
    machine: {
      title: 'Machines',
      singular: 'Machine',
      description: 'The machines that shape your extraction.',
      linkField: 'user_manual_link' as LinkField,
      linkLabel: 'User Manual URL',
      linkPlaceholder: 'https://example.com/manual.pdf',
      linkHelper: 'Link to the official manual or care guide.'
    },
    grinder: {
      title: 'Grinders',
      singular: 'Grinder',
      description: 'The grinders that set the tone for every shot.',
      linkField: 'setting_guide_chart_url' as LinkField,
      linkLabel: 'Setting Guide URL',
      linkPlaceholder: 'https://example.com/setting-guide',
      linkHelper: 'Link to a setting guide or chart.'
    }
  };

  let selectedConfig = config[equipmentType];

  let items: (Machine | Grinder)[] = [];
  let loading = true;
  let error = '';
  let saving = false;
  let formError = '';
  let formNotice = '';
  let validationErrors: Record<string, string> = {};
  let editingId: string | null = null;
  let usageById: Record<string, number> = {};
  let mostUsedBy: Record<string, Barista | undefined> = {};
  let isAdmin = false;

  let manufacturer = '';
  let model = '';
  let linkValue = '';
  let image_path = '';

  onMount(() => {
    loadItems();
    loadUsageStats();
  });

  async function loadItems() {
    try {
      loading = true;
      error = '';
      const response = equipmentType === 'machine'
        ? await apiClient.getMachines()
        : await apiClient.getGrinders();
      items = response.data;
    } catch (err) {
      error = err instanceof Error ? err.message : `Failed to load ${selectedConfig.title.toLowerCase()}`;
    } finally {
      loading = false;
    }
  }

  async function loadUsageStats() {
    try {
      const [brewsResponse, baristasResponse] = await Promise.all([
        apiClient.getBrews(),
        apiClient.getBaristas()
      ]);

      const { usageCounts, topBaristaByEquipment } = buildEquipmentUsageStats(
        brewsResponse.data,
        baristasResponse.data
      );

      usageById = usageCounts;
      mostUsedBy = topBaristaByEquipment;
    } catch (err) {
      usageById = {};
      mostUsedBy = {};
    }
  }

  function resetForm({ preserveNotice = false }: { preserveNotice?: boolean } = {}) {
    manufacturer = '';
    model = '';
    linkValue = '';
    image_path = '';
    editingId = null;
    formError = '';
    if (!preserveNotice) {
      formNotice = '';
    }
    validationErrors = {};
  }

  function startEdit(item: Machine | Grinder) {
    editingId = item.id;
    manufacturer = item.manufacturer || '';
    model = item.model || '';
    linkValue = getLinkValue(item);
    image_path = item.image_path || '';
    formError = '';
    formNotice = '';
    validationErrors = {};
  }

  function getLinkValue(item: Machine | Grinder): string {
    if (equipmentType === 'machine') {
      return (item as Machine).user_manual_link || '';
    }
    return (item as Grinder).setting_guide_chart_url || '';
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

    if (!manufacturer.trim()) {
      validationErrors.manufacturer = 'Manufacturer is required';
    }

    if (!model.trim()) {
      validationErrors.model = 'Model is required';
    }

    if (linkValue && !isValidUrl(linkValue)) {
      validationErrors.link = 'Please enter a valid URL';
    }

    return Object.keys(validationErrors).length === 0;
  }

  const placeholders = {
    machine: {
      manufacturer: 'e.g., La Marzocco',
      model: 'e.g., Linea Mini'
    },
    grinder: {
      manufacturer: 'e.g., Mazzer',
      model: 'e.g., Robur'
    }
  };

  const commonManufacturers = {
    machine: [
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
    ],
    grinder: [
      'Weber Workshops',
      'Niche',
      'Lagom',
      'Mazzer',
      'Eureka',
      'Ceado',
      'Fellow',
      'Comandante',
      'Timemore',
      'Baratza',
      'DF64',
      'Option-O'
    ]
  };

  function selectManufacturer(name: string) {
    manufacturer = name;
  }

  function buildPayload() {
    const payload: Partial<CreateMachineRequest & CreateGrinderRequest> = {
      manufacturer: manufacturer.trim(),
      model: model.trim()
    };

    const trimmedLink = linkValue.trim();
    if (trimmedLink) {
      (payload as Record<string, string>)[selectedConfig.linkField] = trimmedLink;
    }

    return payload;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      formError = 'Please fix validation errors';
      return;
    }

    try {
      saving = true;
      formError = '';
      formNotice = '';

      const payload = buildPayload();

      if (editingId) {
        const response = equipmentType === 'machine'
          ? await apiClient.updateMachine(editingId, payload)
          : await apiClient.updateGrinder(editingId, payload);

        if (response?.data) {
          items = items.map((item) => item.id === editingId ? response.data as Machine | Grinder : item);
        }
        formNotice = `${selectedConfig.singular} updated.`;
      } else {
        const response = equipmentType === 'machine'
          ? await apiClient.createMachine(payload as CreateMachineRequest)
          : await apiClient.createGrinder(payload as CreateGrinderRequest);

        if (response?.data) {
          items = [response.data, ...items];
        }
        formNotice = `${selectedConfig.singular} added.`;
      }

      resetForm({ preserveNotice: true });
    } catch (err) {
      formError = err instanceof Error ? err.message : `Failed to save ${selectedConfig.singular.toLowerCase()}`;
    } finally {
      saving = false;
    }
  }

  async function handleDelete(item: Machine | Grinder) {
    const confirmed = window.confirm(`Delete this ${selectedConfig.singular.toLowerCase()}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      saving = true;
      formError = '';
      formNotice = '';

      if (equipmentType === 'machine') {
        await apiClient.deleteMachine(item.id);
      } else {
        await apiClient.deleteGrinder(item.id);
      }

      items = items.filter((entry) => entry.id !== item.id);
      if (editingId === item.id) {
        resetForm();
      }
      formNotice = `${selectedConfig.singular} removed.`;
    } catch (err) {
      formError = err instanceof Error ? err.message : `Failed to delete ${selectedConfig.singular.toLowerCase()}`;
    } finally {
      saving = false;
    }
  }

  function handleCancelEdit() {
    resetForm();
  }

  function handleImageUpload(event: CustomEvent<{ file: File; imageUrl: string }>) {
    image_path = event.detail.imageUrl;
    if (editingId) {
      items = items.map((item) =>
        item.id === editingId ? { ...item, image_path: event.detail.imageUrl } : item
      );
    }
  }

  function handleImageDelete() {
    image_path = '';
    if (editingId) {
      items = items.map((item) => item.id === editingId ? { ...item, image_path: '' } : item);
    }
  }

  function handleImageError(event: CustomEvent<{ message: string }>) {
    formError = event.detail.message;
  }

  function formatDisplayName(item: Machine | Grinder): string {
    const parts = [item.manufacturer, item.model].filter(Boolean);
    return parts.join(' ');
  }

  $: isAdmin = Boolean($barista?.is_admin);
  $: selectedConfig = config[equipmentType];
</script>

<section class="equipment-section">
  <div class="section-heading">
    <div>
      <h2>{selectedConfig.title}</h2>
      <p>{selectedConfig.description}</p>
    </div>
  </div>

  {#if showForm}
    <div class="form-section card" id={`${equipmentType}-form`}>
      <div class="form-header">
        <h3>{editingId ? `Edit ${selectedConfig.singular}` : `Add ${selectedConfig.singular}`}</h3>
        {#if editingId}
          <button type="button" class="btn-quiet" on:click={handleCancelEdit} disabled={saving}>
            Cancel edit
          </button>
        {/if}
      </div>

      {#if formError}
        <div class="notice error">{formError}</div>
      {/if}
      {#if formNotice}
        <div class="notice success">{formNotice}</div>
      {/if}

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-row">
        <div class="form-group">
          <label for={`${equipmentType}-manufacturer`}>Manufacturer *</label>
          <input
            id={`${equipmentType}-manufacturer`}
            type="text"
            bind:value={manufacturer}
            placeholder={placeholders[equipmentType].manufacturer}
            disabled={saving}
            required
          />
          {#if validationErrors.manufacturer}
            <span class="error-text">{validationErrors.manufacturer}</span>
          {/if}
          <div class="manufacturer-presets">
            <span class="presets-label">Common:</span>
            <div class="preset-buttons">
              {#each commonManufacturers[equipmentType] as brand}
                <button
                  type="button"
                  on:click={() => selectManufacturer(brand)}
                  class="preset-btn"
                  class:selected={manufacturer === brand}
                  disabled={saving}
                >
                  {brand}
                </button>
              {/each}
            </div>
          </div>
        </div>

          <div class="form-group">
            <label for={`${equipmentType}-model`}>Model *</label>
          <input
            id={`${equipmentType}-model`}
            type="text"
            bind:value={model}
            placeholder={placeholders[equipmentType].model}
            disabled={saving}
            required
          />
            {#if validationErrors.model}
              <span class="error-text">{validationErrors.model}</span>
            {/if}
          </div>
        </div>

        <div class="form-group">
          <label for={`${equipmentType}-link`}>{selectedConfig.linkLabel}</label>
          <input
            id={`${equipmentType}-link`}
            type="url"
            bind:value={linkValue}
            placeholder={selectedConfig.linkPlaceholder}
            disabled={saving}
          />
          {#if validationErrors.link}
            <span class="error-text">{validationErrors.link}</span>
          {/if}
          <small>{selectedConfig.linkHelper}</small>
        </div>

        <div class="form-group">
          <label>Image</label>
          {#if editingId}
            <ImageUpload
              entityType={equipmentType}
              entityId={editingId}
              currentImageUrl={getImageUrl(image_path, equipmentType)}
              disabled={saving}
              on:upload={handleImageUpload}
              on:delete={handleImageDelete}
              on:error={handleImageError}
            />
          {:else}
            <div class="image-hint">
              <p>Save this {selectedConfig.singular.toLowerCase()} to add an image.</p>
            </div>
          {/if}
        </div>

        <div class="form-actions">
          {#if editingId}
            <IconButton
              type="button"
              on:click={handleCancelEdit}
              ariaLabel="Cancel edit"
              title="Cancel"
              variant="neutral"
              disabled={saving}
            >
              <XMark />
            </IconButton>
          {/if}
          <IconButton
            type="submit"
            ariaLabel={editingId ? `Save ${selectedConfig.singular}` : `Add ${selectedConfig.singular}`}
            title={editingId ? 'Save' : 'Add'}
            variant="accent"
            disabled={saving}
          >
            <ArrowDownTray />
          </IconButton>
        </div>
      </form>
    </div>
  {/if}

  <div class="list-section card">
    <div class="list-header">
      <h3>{selectedConfig.title}</h3>
      <IconButton
        type="button"
        ariaLabel={`Refresh ${selectedConfig.title}`}
        title="Refresh"
        on:click={loadItems}
        disabled={loading}
      >
        <ArrowPath />
      </IconButton>
    </div>

    {#if error}
      <div class="notice error">{error}</div>
    {:else if loading}
      <div class="list-empty">Loading...</div>
    {:else if items.length === 0}
      <div class="list-empty">
        <p class="voice-line">Nothing here yet.</p>
        <p>Add the {selectedConfig.title.toLowerCase()} you rely on.</p>
      </div>
    {:else}
      <div class="equipment-list">
        {#each items as item (item.id)}
          <article class="equipment-item" class:is-editing={editingId === item.id}>
            <div class="item-main">
              <div class="item-header">
                <h4>{formatDisplayName(item)}</h4>
                <div class="item-actions">
                  <IconButton
                    on:click={() => startEdit(item)}
                    ariaLabel={`Edit ${selectedConfig.singular}`}
                    title="Edit"
                    variant="accent"
                    disabled={saving}
                  >
                    <PencilSquare />
                  </IconButton>
                  {#if isAdmin}
                    <IconButton
                      on:click={() => handleDelete(item)}
                      ariaLabel={`Delete ${selectedConfig.singular}`}
                      title="Delete"
                      variant="danger"
                      disabled={saving}
                    >
                      <Trash />
                    </IconButton>
                  {/if}
                </div>
              </div>
              <div class="item-meta">
                <span>{item.manufacturer}</span>
                <span class="separator">/</span>
                <span>{item.model}</span>
              </div>
              <div class="item-usage">
                <span>{usageById[item.id] ?? 0} brews</span>
                <span class="separator">/</span>
                <span>Most used by {formatMostUsedBy(item.id, usageById, mostUsedBy)}</span>
              </div>
              {#if getLinkValue(item)}
                <a href={getLinkValue(item)} target="_blank" rel="noopener noreferrer" class="item-link">
                  {equipmentType === 'machine' ? 'Manual' : 'Setting guide'}
                </a>
              {/if}
            </div>
            {#if item.image_path}
              <div class="item-image">
                <img
                  src={getImageUrl(item.image_path, equipmentType)}
                  alt={formatDisplayName(item)}
                  loading="lazy"
                  on:error={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .equipment-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section-heading h2 {
    font-size: 1.4rem;
    margin-bottom: 0.4rem;
  }

  .section-heading p {
    margin: 0;
    color: var(--text-ink-muted);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .form-header h3,
  .list-header h3 {
    margin: 0;
    font-size: 1.1rem;
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

  .manufacturer-presets {
    margin-top: 0.35rem;
  }

  .presets-label {
    font-size: 0.8rem;
    color: var(--text-ink-muted);
    margin-bottom: 0.35rem;
    display: block;
  }

  .preset-buttons {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .preset-btn {
    background: rgba(123, 94, 58, 0.12);
    color: var(--text-ink-secondary);
    border: 1px solid var(--border-subtle);
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease;
  }

  .preset-btn:hover:not(:disabled) {
    background: rgba(123, 94, 58, 0.2);
    border-color: var(--border-strong);
  }

  .preset-btn.selected {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    border-color: var(--accent-primary);
  }

  .preset-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-group small {
    color: var(--text-ink-muted);
    font-size: 0.85rem;
  }

  .error-text {
    color: var(--semantic-error);
    font-size: 0.85rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .image-hint {
    padding: 1rem;
    border-radius: var(--radius-md);
    border: 1px dashed var(--border-subtle);
    background: rgba(123, 94, 58, 0.08);
    text-align: center;
  }

  .image-hint p {
    margin: 0;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .list-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .equipment-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .equipment-item {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1rem;
    border-radius: var(--radius-md);
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
  }

  .equipment-item.is-editing {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 1px rgba(176, 138, 90, 0.3);
  }

  .item-main {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
  }

  .item-header h4 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-ink-primary);
  }

  .item-actions {
    display: inline-flex;
    gap: 0.5rem;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .item-usage {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-ink-secondary);
    font-size: 0.85rem;
  }

  .item-meta .separator,
  .item-usage .separator {
    color: var(--text-ink-muted);
  }

  .item-link {
    font-size: 0.9rem;
    color: var(--accent-primary);
    text-decoration: none;
  }

  .item-link:hover {
    text-decoration: underline;
  }

  .item-image {
    flex-shrink: 0;
    width: 120px;
    height: 90px;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid rgba(123, 94, 58, 0.2);
    background: rgba(123, 94, 58, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .item-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
  }

  .list-empty {
    text-align: center;
    color: var(--text-ink-muted);
    padding: 1rem 0;
  }

  @media (max-width: 768px) {
    .equipment-item {
      flex-direction: column;
    }

    .item-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .item-actions {
      align-self: flex-start;
    }

    .item-image {
      width: 100%;
      height: auto;
      max-height: 160px;
    }
  }
</style>
