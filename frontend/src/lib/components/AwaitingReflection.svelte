<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';


  export let barista_id: string;

  let draftBrews: Brew[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(() => {
    loadDraftBrews();
  });

  async function loadDraftBrews() {
    try {
      loading = true;
      error = null;

      const response = await apiClient.getDraftBrews();
      draftBrews = response.data.filter(brew => 
        brew.barista_id === barista_id && (!brew.yield_mg || !brew.rating)
      );
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
    if (!brew.yield_mg) missing.push('Yield');
    if (!brew.brew_time_ms) missing.push('Brew Time');
    if (!brew.rating) missing.push('Rating');
    if (!brew.tasting_notes) missing.push('Tasting Notes');
    if (!brew.reflections) missing.push('Reflections');
    return missing;
  }

  function getCompletionPercentage(brew: Brew): number {
    const totalFields = 5; // yield, brew_time, rating, tasting_notes, reflections
    const completedFields = [
      brew.yield_mg,
      brew.brew_time_ms,
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
      <button on:click={loadDraftBrews} class="btn-retry">
        Try Again
      </button>
    </div>
  {:else if draftBrews.length === 0}
    <div class="empty-state">
      <div class="empty-icon">✅</div>
      <h3>All caught up!</h3>
      <p>You have no incomplete brews. Great job keeping your records up to date!</p>
    </div>
  {:else}
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
              <span class="value">{(brew.dose_mg / 1000).toFixed(1)}g</span>
            </div>
            
            {#if brew.grind_setting}
              <div class="summary-item">
                <span class="label">Grind:</span>
                <span class="value">{brew.grind_setting}</span>
              </div>
            {/if}

            {#if brew.yield_mg}
              <div class="summary-item">
                <span class="label">Yield:</span>
                <span class="value">{(brew.yield_mg / 1000).toFixed(1)}g</span>
              </div>
            {/if}

            {#if brew.brew_time_ms}
              <div class="summary-item">
                <span class="label">Time:</span>
                <span class="value">{(brew.brew_time_ms / 1000).toFixed(1)}s</span>
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
            <a href="/brews/{brew.id}?edit=true" class="btn-complete">
              Complete Brew
            </a>
            <a href="/brews/{brew.id}" class="btn-view">
              View Details
            </a>
          </div>
        </div>
      {/each}
    </div>

    <!-- Batch Actions -->
    {#if draftBrews.length > 1}
      <div class="batch-actions">
        <p class="batch-text">
          You have {draftBrews.length} incomplete brews
        </p>
        <a href="/brews/drafts" class="btn-view-all">
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
    margin-bottom: 2rem;
  }

  .section-header h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.75rem;
  }

  .section-header p {
    margin: 0;
    color: #666;
    font-size: 1rem;
  }

  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 0.5rem;
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
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-state p {
    color: #dc3545;
    margin-bottom: 1rem;
  }

  .btn-retry {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-retry:hover {
    background: #0056b3;
  }

  .empty-state {
    color: #666;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    color: #333;
    margin-bottom: 0.5rem;
  }

  .draft-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .draft-card {
    background: white;
    border: 1px solid #e5e5e5;
    border-left: 4px solid #ffc107;
    border-radius: 0.5rem;
    padding: 1.5rem;
    transition: box-shadow 0.2s;
  }

  .draft-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .draft-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .brew-info {
    flex: 1;
  }

  .brew-title {
    margin: 0 0 0.25rem 0;
    color: #333;
    font-size: 1.25rem;
  }

  .brew-date {
    color: #666;
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
      #ffc107 0deg,
      #ffc107 calc(var(--percentage) * 3.6deg),
      #e5e5e5 calc(var(--percentage) * 3.6deg),
      #e5e5e5 360deg
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
    background: white;
    border-radius: 50%;
    position: absolute;
  }

  .completion-text {
    position: relative;
    z-index: 1;
    font-weight: 600;
    font-size: 0.8rem;
    color: #333;
  }

  .brew-summary {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .summary-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .summary-item .label {
    font-weight: 500;
    color: #555;
    font-size: 0.9rem;
  }

  .summary-item .value {
    color: #333;
    font-weight: 600;
  }

  .missing-fields {
    margin-bottom: 1rem;
  }

  .missing-fields h4 {
    margin: 0 0 0.5rem 0;
    color: #dc3545;
    font-size: 0.95rem;
  }

  .missing-list {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .missing-tag {
    background: #f8d7da;
    color: #721c24;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .quick-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
  }

  .quick-label {
    font-weight: 500;
    color: #555;
    font-size: 0.9rem;
  }

  .rating-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .rating-btn {
    width: 35px;
    height: 35px;
    border: 1px solid #007bff;
    background: white;
    color: #007bff;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .rating-btn:hover {
    background: #007bff;
    color: white;
  }

  .draft-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .btn-complete,
  .btn-view {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
  }

  .btn-complete {
    background: #28a745;
    color: white;
  }

  .btn-complete:hover {
    background: #218838;
  }

  .btn-view {
    background: #6c757d;
    color: white;
  }

  .btn-view:hover {
    background: #545b62;
  }

  .batch-actions {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 0.5rem;
    text-align: center;
  }

  .batch-text {
    margin: 0 0 1rem 0;
    color: #004085;
    font-weight: 500;
  }

  .btn-view-all {
    background: #007bff;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
    display: inline-block;
  }

  .btn-view-all:hover {
    background: #0056b3;
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