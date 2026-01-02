<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BrewForm from '$lib/components/BrewForm.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import RoastLevel from '$lib/components/RoastLevel.svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import { PencilSquare, Trash, XMark } from '$lib/icons';
  import { getTransformedImageUrl } from '$lib/utils/image-utils';
  import { imageSizes } from '$lib/ui/components/image';
  import { buildEquipmentUsageStats, formatMostUsedBy } from '$lib/utils/usage-stats';
  import type { Barista } from '@shared/types';

  
  let brew = null;
  let loading = true;
  let error = null;
  let editing = false;
  let canEdit = false;
  let deleting = false;
  let equipmentLoading = false;

  let machine: Machine | null = null;
  let grinder: Grinder | null = null;
  let bag: Bag | null = null;
  let bean: Bean | null = null;
  let roaster: Roaster | null = null;
  let usageById: Record<string, number> = {};
  let mostUsedBy: Record<string, Barista | undefined> = {};

  $: brewId = $page.params.id;

  onMount(async () => {
    if (brewId) {
      await loadBrew(brewId);
    }
  });

  async function loadBrew(id: string) {
    loading = true;
    error = null;
    
    try {
      const response = await apiClient.getBrew(id);
      if (response.data) {
        brew = response.data;
        
        // Check if current user can edit this brew
        const currentBarista = $barista;
        canEdit = currentBarista?.id === brew.barista_id || Boolean(currentBarista?.is_admin);
        await loadEquipmentDetails(brew);
      } else {
        throw new Error('Brew not found');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load brew';
    } finally {
      loading = false;
    }
  }

  async function loadEquipmentDetails(currentBrew: Brew) {
    equipmentLoading = true;

    try {
      const [
        machinesResponse,
        grindersResponse,
        bagResponse,
        beansResponse,
        roastersResponse,
        brewsResponse,
        baristasResponse
      ] = await Promise.all([
        apiClient.getMachines(),
        apiClient.getGrinders(),
        apiClient.getBag(currentBrew.bag_id),
        apiClient.getBeans(),
        apiClient.getRoasters(),
        apiClient.getBrews(),
        apiClient.getBaristas()
      ]);

      machine = machinesResponse.data.find((item) => item.id === currentBrew.machine_id) || null;
      grinder = grindersResponse.data.find((item) => item.id === currentBrew.grinder_id) || null;
      bag = bagResponse.data || null;
      bean = bag ? beansResponse.data.find((item) => item.id === bag.bean_id) || null : null;
      roaster = bean ? roastersResponse.data.find((item) => item.id === bean.roaster_id) || null : null;
      const { usageCounts, topBaristaByEquipment } = buildEquipmentUsageStats(
        brewsResponse.data,
        baristasResponse.data
      );

      usageById = usageCounts;
      mostUsedBy = topBaristaByEquipment;
    } catch (err) {
      machine = null;
      grinder = null;
      bag = null;
      bean = null;
      roaster = null;
      usageById = {};
      mostUsedBy = {};
    } finally {
      equipmentLoading = false;
    }
  }

  function toggleEdit() {
    editing = !editing;
    error = null; // Clear any previous errors when toggling edit mode
  }

  async function handleSave(event: CustomEvent<CreateBrewRequest>) {
    if (!brew) return;
    
    const brewData = event.detail;
    loading = true;
    error = null;

    try {
      const response = await apiClient.updateBrew(brew.id, brewData);
      if (response.data) {
        brew = response.data;
        await loadEquipmentDetails(brew);
        editing = false;
      } else {
        throw new Error('Failed to update brew');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save changes';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    editing = false;
    error = null;
  }

  async function handleDelete() {
    if (!brew || deleting) return;
    
    const confirmMessage = `Are you sure you want to delete "${brew.name || 'this brew'}"? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }
    
    deleting = true;
    error = null;
    
    try {
      await apiClient.deleteBrew(brew.id);
      goto('/brews');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete brew';
      deleting = false;
    }
  }

  // Helper function to format calculated fields
  function formatCalculatedFields(brew: Brew) {
    const fields = [];
    
    if (brew.ratio) {
      fields.push(`Ratio: 1:${brew.ratio.toFixed(2)}`);
    }
    
    if (brew.flow_rate_g_per_s) {
      fields.push(`Flow Rate: ${brew.flow_rate_g_per_s.toFixed(1)} g/s`);
    }
    
    return fields;
  }

  function formatEquipmentName(item: Machine | Grinder): string {
    const parts = [item.manufacturer, item.model].filter(Boolean);
    return parts.join(' ');
  }

  function formatBagTitle(bag: Bag | null, bean: Bean | null): string {
    if (bag?.name && bag.name.trim()) {
      return bag.name;
    }
    if (bean?.name) {
      return bean.name;
    }
    return 'Unknown Bag';
  }

  function handleClose() {
    goto('/');
  }

  function handleBagCardClick() {
    if (!bean) return;
    goto(`/beans/${bean.id}`);
  }

  function handleBagCardKeydown(event: KeyboardEvent) {
    if (!bean) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goto(`/beans/${bean.id}`);
    }
  }
</script>

<svelte:head>
  <title>{brew?.name || 'Brew'} - Espresso Engineered</title>
  <meta name="description" content="View and edit espresso brew details" />
</svelte:head>

<AuthGuard>
  <div class="brew-detail-page">
    <header>
      <div>
        <h1>{brew?.name || 'Untitled Brew'}</h1>
      </div>
      
      <div class="actions">
        {#if !editing}
          <IconButton on:click={handleClose} ariaLabel="Back to brews" title="Close" variant="neutral" disabled={loading}>
            <XMark />
          </IconButton>
        {/if}
        {#if canEdit && brew}
          {#if editing}
            <IconButton on:click={toggleEdit} ariaLabel="Cancel editing" title="Cancel" variant="neutral" disabled={loading}>
              <XMark />
            </IconButton>
          {:else}
            <IconButton on:click={toggleEdit} ariaLabel="Edit brew" variant="accent" disabled={loading}>
              <PencilSquare />
            </IconButton>
          {/if}
          <IconButton
            on:click={handleDelete}
            ariaLabel={deleting ? 'Deleting brew' : 'Delete brew'}
            title={deleting ? 'Deleting...' : 'Delete'}
            variant="danger"
            disabled={loading || deleting}
          >
            <Trash />
          </IconButton>
        {/if}
      </div>
    </header>

  {#if loading}
    <div class="loading">Loading brew...</div>
  {:else if error}
    <div class="error">Error: {error}</div>
  {:else if brew}
    <!-- TypeScript workaround: create local variable with proper type -->
    {@const currentBrew = brew}
    <div class="brew-content">
      {#if editing}
        <BrewForm {brew} on:save={handleSave} on:cancel={handleCancel} />
      {:else}
        <div class="brew-details">
          <div class="detail-section card">
            <h3>Equipment</h3>
            {#if equipmentLoading}
              <div class="loading equipment-loading">Loading equipment details...</div>
            {:else}
              <div class="equipment-grid">
                <article class="equipment-card">
                  <div class="equipment-card-main">
                    <div class="equipment-card-header">
                      <div>
                        <p class="equipment-kicker">Machine</p>
                        <h4>{machine ? formatEquipmentName(machine) : 'Unknown Machine'}</h4>
                      </div>
                      {#if machine?.user_manual_link}
                        <a
                          class="equipment-link"
                          href={machine.user_manual_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Manual
                        </a>
                      {/if}
                    </div>
                    {#if machine}
                      <div class="equipment-meta">
                        <span>{machine.manufacturer}</span>
                        <span class="separator">/</span>
                        <span>{machine.model}</span>
                      </div>
                      <div class="equipment-chips">
                        <span class="equipment-chip">{usageById[machine.id] ?? 0} brews</span>
                        <span class="equipment-chip">
                          Most used by {formatMostUsedBy(machine.id, usageById, mostUsedBy)}
                        </span>
                      </div>
                    {:else}
                      <p class="equipment-fallback">ID: {currentBrew.machine_id}</p>
                    {/if}
                  </div>
                  {#if machine?.image_path}
                    <div class="equipment-image">
                      <img
                        src={getTransformedImageUrl(machine.image_path, 'machine', imageSizes.card)}
                        alt={formatEquipmentName(machine)}
                        loading="lazy"
                        on:error={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  {/if}
                </article>

                <article class="equipment-card">
                  <div class="equipment-card-main">
                    <div class="equipment-card-header">
                      <div>
                        <p class="equipment-kicker">Grinder</p>
                        <h4>{grinder ? formatEquipmentName(grinder) : 'Unknown Grinder'}</h4>
                      </div>
                      {#if grinder?.setting_guide_chart_url}
                        <a
                          class="equipment-link"
                          href={grinder.setting_guide_chart_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Setting guide
                        </a>
                      {/if}
                    </div>
                    {#if grinder}
                      <div class="equipment-meta">
                        <span>{grinder.manufacturer}</span>
                        <span class="separator">/</span>
                        <span>{grinder.model}</span>
                      </div>
                      <div class="equipment-chips">
                        <span class="equipment-chip">{usageById[grinder.id] ?? 0} brews</span>
                        <span class="equipment-chip">
                          Most used by {formatMostUsedBy(grinder.id, usageById, mostUsedBy)}
                        </span>
                      </div>
                    {:else}
                      <p class="equipment-fallback">ID: {currentBrew.grinder_id}</p>
                    {/if}
                    {#if currentBrew.grind_setting}
                      <p class="equipment-subnote">Grind setting: {currentBrew.grind_setting}</p>
                    {/if}
                  </div>
                  {#if grinder?.image_path}
                    <div class="equipment-image">
                      <img
                        src={getTransformedImageUrl(grinder.image_path, 'grinder', imageSizes.card)}
                        alt={formatEquipmentName(grinder)}
                        loading="lazy"
                        on:error={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  {/if}
                </article>

                <article
                  class="equipment-card bag-card"
                  class:bag-card--clickable={Boolean(bean)}
                  role={bean ? 'link' : undefined}
                  tabindex={bean ? 0 : -1}
                  aria-label={bean ? `View ${formatBagTitle(bag, bean)}` : undefined}
                  on:click={handleBagCardClick}
                  on:keydown={handleBagCardKeydown}
                >
                  <div class="equipment-card-main">
                    <div class="equipment-card-header">
                      <div>
                        <p class="equipment-kicker">Coffee Bag</p>
                        <h4>{formatBagTitle(bag, bean)}</h4>
                      </div>
                    </div>
                    {#if bag}
                      <div class="equipment-meta">
                        <span>{roaster?.name || 'Unknown roaster'}</span>
                        {#if bean?.roast_level}
                          <span class="separator">/</span>
                          <RoastLevel value={bean.roast_level} size="small" />
                        {/if}
                      </div>
                      <div class="equipment-tags">
                        {#if bag.roast_date}
                          <span class="equipment-tag">Roasted {new Date(bag.roast_date).toLocaleDateString()}</span>
                        {/if}
                        {#if bag.purchase_location}
                          <span class="equipment-tag">From {bag.purchase_location}</span>
                        {/if}
                      </div>
                    {:else}
                      <p class="equipment-fallback">ID: {currentBrew.bag_id}</p>
                    {/if}
                  </div>
                </article>
              </div>
            {/if}
          </div>

          <div class="detail-section card">
            <h3>Input Parameters</h3>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">Dose</span>
                <div class="metric-value">{currentBrew.dose_g}g</div>
              </div>
              <div class="metric-card">
                <span class="metric-label">Grind Setting</span>
                {#if currentBrew.grind_setting}
                  <div class="metric-value">{currentBrew.grind_setting}</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
            </div>
          </div>

          <div class="detail-section card">
            <h3>Output Measurements</h3>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">Yield</span>
                {#if currentBrew.yield_g}
                  <div class="metric-value">{currentBrew.yield_g}g</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="metric-card">
                <span class="metric-label">Brew Time</span>
                {#if currentBrew.brew_time_s}
                  <div class="metric-value">{currentBrew.brew_time_s.toFixed(1)}s</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="metric-card">
                <span class="metric-label">Ratio</span>
                {#if currentBrew.ratio}
                  <div class="metric-value">1:{currentBrew.ratio.toFixed(2)}</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="metric-card">
                <span class="metric-label">Flow Rate</span>
                {#if currentBrew.flow_rate_g_per_s}
                  <div class="metric-value">{currentBrew.flow_rate_g_per_s.toFixed(1)} g/s</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
            </div>
          </div>

          <div class="detail-section card">
            <h3>Reflections</h3>
            <div class="reflection-grid">
              <div class="reflection-field reflection-field--rating">
                <span class="reflection-label">Rating</span>
                {#if currentBrew.rating}
                  <div class="reflection-rating">
                    <span class="rating-value">{currentBrew.rating}</span>
                    <span class="rating-denominator">/10</span>
                  </div>
                {:else}
                  <div class="reflection-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="reflection-field reflection-field--wide">
                <span class="reflection-label">Tasting Notes</span>
                {#if currentBrew.tasting_notes}
                  <div class="reflection-body">{currentBrew.tasting_notes}</div>
                {:else}
                  <div class="reflection-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="reflection-field reflection-field--wide">
                <span class="reflection-label">Reflections</span>
                {#if currentBrew.reflections}
                  <div class="reflection-body">{currentBrew.reflections}</div>
                {:else}
                  <div class="reflection-empty">Not recorded yet</div>
                {/if}
              </div>
            </div>
          </div>

          {#if !currentBrew.yield_g || !currentBrew.rating}
            <div class="incomplete-notice">
              <p>This brew is incomplete. {#if canEdit}<button on:click={toggleEdit} class="link-button">Complete it now</button>.{/if}</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <div class="not-found">Brew not found</div>
  {/if}
  </div>
</AuthGuard>

<style>
  .brew-detail-page {
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

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .link-button {
    background: none;
    border: none;
    color: var(--accent-primary);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
  }

  button:disabled:hover {
    background: inherit;
  }

  .loading, .error, .not-found {
    text-align: center;
    padding: 2rem;
    color: var(--text-ink-muted);
  }

  .error {
    color: var(--semantic-error);
  }

  .brew-details {
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

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 0.85rem 1rem;
  }

  .metric-card--wide {
    grid-column: span 2;
  }

  .metric-label {
    font-weight: 600;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .metric-value {
    color: var(--text-ink-primary);
    font-size: 1.05rem;
  }

  .metric-empty {
    color: var(--text-ink-muted);
    font-size: 0.95rem;
  }

  .reflection-grid {
    display: grid;
    gap: 1.25rem;
  }

  .reflection-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .reflection-field--rating {
    justify-self: start;
    width: min(220px, 100%);
  }

  .reflection-label {
    font-weight: 600;
    color: var(--text-ink-muted);
    font-size: 0.95rem;
  }

  .reflection-rating {
    display: inline-flex;
    align-items: baseline;
    gap: 0.2rem;
    font-size: 1.6rem;
    color: var(--text-ink-primary);
  }

  .rating-denominator {
    font-size: 0.95rem;
    color: var(--text-ink-secondary);
  }

  .reflection-body {
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 0.85rem 1rem;
    color: var(--text-ink-secondary);
    line-height: 1.65;
    white-space: pre-wrap;
  }

  .reflection-empty {
    background: var(--bg-surface-paper);
    border: 1px dashed rgba(123, 94, 58, 0.35);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    color: var(--text-ink-muted);
    font-size: 0.95rem;
  }


  .equipment-loading {
    text-align: left;
    padding: 0.75rem 0;
  }

  .equipment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .equipment-card {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1rem;
    border-radius: var(--radius-md);
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
  }

  .bag-card--clickable {
    cursor: pointer;
    transition: box-shadow var(--motion-fast), border-color var(--motion-fast);
  }

  .bag-card--clickable:hover {
    box-shadow: var(--shadow-soft);
    border-color: var(--accent-primary);
  }

  .bag-card--clickable:focus-visible {
    outline: 2px solid rgba(176, 138, 90, 0.4);
    outline-offset: 2px;
  }

  .equipment-card-main {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
  }

  .equipment-card-header {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .equipment-card-header h4 {
    margin: 0.2rem 0 0 0;
    font-size: 1.05rem;
    color: var(--text-ink-primary);
  }

  .equipment-kicker {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-ink-muted);
  }

  .equipment-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .equipment-meta .separator {
    color: var(--text-ink-muted);
  }

  .equipment-link {
    font-size: 0.85rem;
    color: var(--accent-primary);
    text-decoration: none;
    margin-top: 0.35rem;
  }

  .equipment-link:hover {
    text-decoration: underline;
  }

  .equipment-subnote {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-ink-secondary);
  }

  .equipment-fallback {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-ink-muted);
    word-break: break-all;
  }

  .equipment-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.25rem;
  }

  .equipment-tag,
  .equipment-chip {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
    background: rgba(123, 94, 58, 0.15);
    color: var(--text-ink-secondary);
  }

  .equipment-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.25rem;
  }

  .equipment-image {
    flex-shrink: 0;
    width: 110px;
    height: 82px;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid rgba(123, 94, 58, 0.2);
    background: rgba(123, 94, 58, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .equipment-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-item label {
    font-weight: 600;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .detail-item span {
    color: var(--text-ink-primary);
  }

  .detail-section p {
    color: var(--text-ink-secondary);
    line-height: 1.6;
    margin: 0;
  }

  .incomplete-notice {
    background: rgba(138, 106, 62, 0.15);
    border: 1px solid rgba(138, 106, 62, 0.25);
    border-radius: var(--radius-md);
    padding: 1rem;
    margin-top: 2rem;
    color: var(--semantic-warning);
  }

  .incomplete-notice p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .metric-card--wide {
      grid-column: span 1;
    }

    .equipment-card {
      flex-direction: column;
    }

    .equipment-card-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .equipment-image {
      width: 100%;
      height: auto;
      max-height: 160px;
    }
  }
</style>
