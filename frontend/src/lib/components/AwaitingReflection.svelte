<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import BrewReflectionCard from '$lib/components/BrewReflectionCard.svelte';


  let draftBrews: Brew[] = [];
  let loading = true;
  let error: string | null = null;
  const emptyMessage = 'Quiet for now.';

  onMount(() => {
    loadDraftBrews();
  });

  async function loadDraftBrews() {
    try {
      loading = true;
      error = null;

      const response = await apiClient.getDraftBrews();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      draftBrews = response.data.filter((brew) => {
        if (typeof brew.rating === 'number') return false;
        if (!brew.created_at) return false;
        const brewedAt = new Date(brew.created_at);
        if (Number.isNaN(brewedAt.getTime())) return false;
        return brewedAt >= threeDaysAgo;
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load draft brews';
      console.error('Failed to load draft brews:', err);
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  function getBrewTitle(brew: Brew): string {
    if (brew.name) return brew.name;
    return `Brew ${formatDate(brew.created_at)}`;
  }

  function getMissingFields(brew: Brew): string[] {
    return typeof brew.rating === 'number' ? [] : ['Rating'];
  }

  function getCompletionPercentage(brew: Brew): number {
    return typeof brew.rating === 'number' ? 100 : 0;
  }

  async function handleRatingSubmit(event: CustomEvent<{ brewId: string; rating: number }>) {
    const { brewId, rating } = event.detail;

    try {
      const response = await apiClient.updateBrew(brewId, { rating });
      const index = draftBrews.findIndex((entry) => entry.id === brewId);
      if (index !== -1 && response.data) {
        draftBrews[index] = { ...draftBrews[index], ...response.data };
        draftBrews = draftBrews.filter(entry => typeof entry.rating !== 'number');
      }
    } catch (err) {
      console.error('Failed to update rating:', err);
    }
  }

  function handleRefresh() {
    loadDraftBrews();
  }
</script>

<div class="awaiting-reflection">
  <div class="section-header">
    <h2>Awaiting Reflection</h2>
    <p>Complete these brews by adding a rating</p>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <span>Loading incomplete brews...</span>
    </div>
  {:else if error}
    <div class="error-state">
      <p>Error: {error}</p>
      <button on:click={loadDraftBrews} class="btn-primary">
        Try Again
      </button>
    </div>
  {:else if draftBrews.length === 0}
    <div class="empty-state">
      <h3>{emptyMessage}</h3>
    </div>
  {:else}
    <div class="draft-list-shell">
      <div class="draft-list">
        {#each draftBrews as brew (brew.id)}
          <BrewReflectionCard
            {brew}
            on:ratingSubmit={handleRatingSubmit}
            on:refresh={handleRefresh}
          />
        {/each}
      </div>
    </div>

    <!-- Batch Actions -->
    {#if draftBrews.length > 1}
      <div class="batch-actions">
        <p class="batch-text">
          You have {draftBrews.length} brews awaiting a rating
        </p>
        <a href="/brews/drafts" class="btn-secondary">
          View All Awaiting Ratings
        </a>
      </div>
    {/if}
  {/if}
</div>

<style>
  .awaiting-reflection {
    width: 100%;
  }

  .section-header {
    margin-bottom: 1.5rem;
  }

  .section-header h2 {
    margin: 0 0 0.5rem 0;
    color: var(--text-ink-primary);
    font-size: 1.75rem;
  }

  .section-header p {
    margin: 0;
    color: var(--text-ink-muted);
    font-size: 1rem;
  }

  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(214, 199, 174, 0.2);
    border-top: 3px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-state p {
    color: var(--semantic-error);
    margin-bottom: 1rem;
  }

  .empty-state {
    color: var(--text-ink-muted);
  }

  .empty-state h3 {
    color: var(--text-ink-secondary);
    margin: 0;
  }

  .draft-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .draft-list-shell {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 1.5rem;
  }

  @media (max-width: 768px) {
    .draft-list-shell {
      padding: 1rem;
    }
  }
</style>
