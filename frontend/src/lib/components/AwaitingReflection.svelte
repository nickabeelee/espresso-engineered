<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';


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
      draftBrews = response.data;
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
    const missing: string[] = [];
    if (!brew.rating) missing.push('Rating');
    if (!brew.tasting_notes) missing.push('Tasting Notes');
    if (!brew.reflections) missing.push('Reflections');
    return missing;
  }

  function getCompletionPercentage(brew: Brew): number {
    const totalFields = 3; // rating, tasting_notes, reflections
    const completedFields = [
      brew.rating,
      brew.tasting_notes,
      brew.reflections
    ].filter(field => field !== undefined && field !== null && field !== '').length;
    
    return Math.round((completedFields / totalFields) * 100);
  }

  async function quickComplete(brew: Brew, field: string, value: any) {
    try {
      const updateData = { [field]: value };
      await apiClient.updateBrew(brew.id, updateData);
      
      // Update local state
      const index = draftBrews.findIndex(b => b.id === brew.id);
      if (index !== -1) {
        draftBrews[index] = { ...draftBrews[index], ...updateData };
        draftBrews = draftBrews; // Trigger reactivity
      }
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      // Could show a toast notification here
    }
  }

  function handleQuickRating(brew: Brew, rating: number) {
    quickComplete(brew, 'rating', rating);
  }
</script>

<div class="awaiting-reflection">
  <div class="section-header">
    <h2>Awaiting Reflection</h2>
    <p>Complete these brews by adding missing details</p>
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
          <div class="draft-card">
            <div class="draft-header">
              <div class="brew-info">
                <h3 class="brew-title">{getBrewTitle(brew)}</h3>
                <span class="brew-date">
                  {formatDate(brew.created_at)} at {formatTime(brew.created_at)}
                </span>
              </div>
              
              <div class="completion-badge">
                <div class="completion-circle" style="--percentage: {getCompletionPercentage(brew)}%">
                  <span class="completion-text">{getCompletionPercentage(brew)}%</span>
                </div>
              </div>
            </div>

            <div class="brew-summary">
              <div class="summary-item">
                <span class="label">Dose:</span>
                <span class="value">{brew.dose_g.toFixed(1)}g</span>
              </div>
              
              {#if brew.grind_setting}
                <div class="summary-item">
                  <span class="label">Grind:</span>
                  <span class="value">{brew.grind_setting}</span>
                </div>
              {/if}

              {#if brew.yield_g}
                <div class="summary-item">
                  <span class="label">Yield:</span>
                  <span class="value">{brew.yield_g.toFixed(1)}g</span>
                </div>
              {/if}

              {#if brew.brew_time_s}
                <div class="summary-item">
                  <span class="label">Time:</span>
                  <span class="value">{brew.brew_time_s.toFixed(1)}s</span>
                </div>
              {/if}
            </div>

            <div class="missing-fields">
              <h4>Missing:</h4>
              <div class="missing-list">
                {#each getMissingFields(brew) as field}
                  <span class="missing-tag">{field}</span>
                {/each}
              </div>
            </div>

            <!-- Quick Rating -->
            {#if !brew.rating}
              <div class="quick-actions">
                <span class="quick-label">Quick Rating:</span>
                <div class="rating-buttons">
                  {#each [6, 7, 8, 9, 10] as rating}
                    <button 
                      class="rating-btn"
                      on:click={() => handleQuickRating(brew, rating)}
                    >
                      {rating}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <div class="draft-actions">
              <a href="/brews/{brew.id}?reflect=true" class="btn-primary">
                Complete Brew
              </a>
              <a href="/brews/{brew.id}" class="btn-secondary">
                View Details
              </a>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Batch Actions -->
    {#if draftBrews.length > 1}
      <div class="batch-actions">
        <p class="batch-text">
          You have {draftBrews.length} incomplete brews
        </p>
        <a href="/brews/drafts" class="btn-secondary">
          View All Drafts
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

  .draft-card {
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    transition: border-color var(--motion-fast);
  }

  .draft-card:hover {
    border-color: var(--accent-primary);
  }

  .draft-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .brew-info {
    flex: 1;
  }

  .brew-title {
    margin: 0 0 0.25rem 0;
    color: var(--text-ink-primary);
    font-size: 1.25rem;
  }

  .brew-date {
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .completion-badge {
    margin-left: 1rem;
  }

  .completion-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: conic-gradient(
      var(--accent-primary) 0deg,
      var(--accent-primary) calc(var(--percentage) * 3.6deg),
      rgba(123, 94, 58, 0.2) calc(var(--percentage) * 3.6deg),
      rgba(123, 94, 58, 0.2) 360deg
    );
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .completion-circle::before {
    content: '';
    width: 45px;
    height: 45px;
    background: var(--bg-surface-paper);
    border-radius: 50%;
    position: absolute;
  }

  .completion-text {
    position: relative;
    z-index: 1;
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--text-ink-primary);
  }

  .brew-summary {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .summary-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .summary-item .label {
    font-weight: 500;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
  }

  .summary-item .value {
    color: var(--text-ink-primary);
    font-weight: 600;
  }

  .missing-fields {
    margin-bottom: 0.75rem;
  }

  .missing-fields h4 {
    margin: 0 0 0.5rem 0;
    color: var(--semantic-error);
    font-size: 0.95rem;
  }

  .missing-list {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .missing-tag {
    background: rgba(122, 62, 47, 0.12);
    color: var(--semantic-error);
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .quick-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background: rgba(123, 94, 58, 0.08);
    border-radius: var(--radius-md);
  }

  .quick-label {
    font-weight: 500;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
  }

  .rating-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .rating-btn {
    width: 35px;
    height: 35px;
    border: 1px solid var(--accent-primary);
    background: transparent;
    color: var(--accent-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .rating-btn:hover {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
  }

  .draft-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .batch-actions {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    text-align: center;
  }

  .batch-text {
    margin: 0 0 1rem 0;
    color: var(--text-ink-secondary);
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .draft-header {
      flex-direction: column;
      gap: 1rem;
    }

    .completion-badge {
      margin-left: 0;
      align-self: flex-end;
    }

    .brew-summary {
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-actions {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .draft-actions {
      flex-direction: column;
    }
  }
</style>
