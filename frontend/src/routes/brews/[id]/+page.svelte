<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BrewForm from '$lib/components/BrewForm.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import { PencilSquare, Trash, XMark } from '$lib/icons';
  import { getImageUrl } from '$lib/utils/image-utils';

  
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
        bagsResponse,
        beansResponse,
        roastersResponse,
        brewsResponse
      ] = await Promise.all([
        apiClient.getMachines(),
        apiClient.getGrinders(),
        apiClient.getBags(),
        apiClient.getBeans(),
        apiClient.getRoasters(),
        apiClient.getBrews()
      ]);

      machine = machinesResponse.data.find((item) => item.id === currentBrew.machine_id) || null;
      grinder = grindersResponse.data.find((item) => item.id === currentBrew.grinder_id) || null;
      bag = bagsResponse.data.find((item) => item.id === currentBrew.bag_id) || null;
      bean = bag ? beansResponse.data.find((item) => item.id === bag.bean_id) || null : null;
      roaster = bean ? roastersResponse.data.find((item) => item.id === bean.roaster_id) || null : null;
      usageById = brewsResponse.data.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.machine_id] = (acc[entry.machine_id] ?? 0) + 1;
        acc[entry.grinder_id] = (acc[entry.grinder_id] ?? 0) + 1;
        return acc;
      }, {});
    } catch (err) {
      machine = null;
      grinder = null;
      bag = null;
      bean = null;
      roaster = null;
      usageById = {};
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
</script>

<svelte:head>
  <title>{brew?.name || 'Brew'} - Espresso Engineered</title>
  <meta name="description" content="View and edit espresso brew details" />
</svelte:head>

<AuthGuard>
  <div class="brew-detail-page">
    <header>
      <div>
        <a href="/brews" class="back-link">Back to Brews</a>
        <h1>{brew?.name || 'Untitled Brew'}</h1>
      </div>
      
      {#if canEdit && brew}
        <div class="actions">
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
        </div>
      {/if}
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
                        <span class="equipment-chip">Most used by {$barista?.display_name ?? 'You'}</span>
                      </div>
                    {:else}
                      <p class="equipment-fallback">ID: {currentBrew.machine_id}</p>
                    {/if}
                  </div>
                  {#if machine?.image_path}
                    <div class="equipment-image">
                      <img
                        src={getImageUrl(machine.image_path, 'machine')}
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
                        <span class="equipment-chip">Most used by {$barista?.display_name ?? 'You'}</span>
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
                        src={getImageUrl(grinder.image_path, 'grinder')}
                        alt={formatEquipmentName(grinder)}
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
                        <p class="equipment-kicker">Coffee Bag</p>
                        <h4>{formatBagTitle(bag, bean)}</h4>
                      </div>
                    </div>
                    {#if bag}
                      <div class="equipment-meta">
                        <span>{roaster?.name || 'Unknown roaster'}</span>
                        {#if bean?.roast_level}
                          <span class="separator">/</span>
                          <span>{bean.roast_level}</span>
                        {/if}
                      </div>
                      <div class="equipment-tags">
                        {#if bag.roast_date}
                          <span class="equipment-tag">Roasted {new Date(bag.roast_date).toLocaleDateString()}</span>
                        {/if}
                        {#if bag.weight_g}
                          <span class="equipment-tag">{bag.weight_g.toFixed(0)}g remaining</span>
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
            <div class="detail-grid">
              <div class="detail-item">
                <label>Dose:</label>
                <span>{currentBrew.dose_g}g</span>
              </div>
              {#if currentBrew.grind_setting}
                <div class="detail-item">
                  <label>Grind Setting:</label>
                  <span>{currentBrew.grind_setting}</span>
                </div>
              {/if}
              <div class="detail-item">
                <label>Created:</label>
                <span>{new Date(currentBrew.created_at).toLocaleString()}</span>
              </div>
              <div class="detail-item">
                <label>Modified:</label>
                <span>{new Date(currentBrew.modified_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="detail-section card">
            <h3>Output Measurements</h3>
            <div class="detail-grid">
              {#if currentBrew.yield_g}
                <div class="detail-item">
                  <label>Yield:</label>
                  <span>{currentBrew.yield_g}g</span>
                </div>
              {/if}
              {#if currentBrew.brew_time_s}
                <div class="detail-item">
                  <label>Brew Time:</label>
                  <span>{currentBrew.brew_time_s.toFixed(1)}s</span>
                </div>
              {/if}
              {#if currentBrew.ratio}
                <div class="detail-item">
                  <label>Ratio:</label>
                  <span>1:{currentBrew.ratio.toFixed(2)}</span>
                </div>
              {/if}
              {#if currentBrew.flow_rate_g_per_s}
                <div class="detail-item">
                  <label>Flow Rate:</label>
                  <span>{currentBrew.flow_rate_g_per_s.toFixed(1)} g/s</span>
                </div>
              {/if}
            </div>
          </div>

          <div class="detail-section card">
            <h3>Reflections</h3>
            <div class="detail-grid">
              {#if currentBrew.rating}
                <div class="detail-item">
                  <label>Rating:</label>
                  <span>{currentBrew.rating}/10</span>
                </div>
              {/if}
            </div>
            {#if currentBrew.tasting_notes}
              <p>{currentBrew.tasting_notes}</p>
            {/if}
            {#if currentBrew.reflections}
              <p>{currentBrew.reflections}</p>
            {/if}
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

  .back-link {
    color: var(--accent-primary);
    text-decoration: none;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .back-link:hover {
    color: var(--accent-primary-dark);
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
    background: rgba(228, 214, 191, 0.6);
    border: 1px solid rgba(123, 94, 58, 0.2);
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
