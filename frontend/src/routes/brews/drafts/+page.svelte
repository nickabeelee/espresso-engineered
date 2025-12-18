<script lang="ts">
  import { onMount } from 'svelte';
  import AuthGuard from '$lib/components/AuthGuard.svelte';

  
  let drafts = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    // Placeholder for draft loading logic
    // Will be implemented in task 8 (Implement core UI components)
    loading = false;
  });

  function isDraft(brew: Brew): boolean {
    return !brew.yield_mg || !brew.rating;
  }

  function getMissingFields(brew: Brew): string[] {
    const missing: string[] = [];
    if (!brew.yield_mg) missing.push('yield');
    if (!brew.brew_time_ms) missing.push('brew time');
    if (!brew.rating) missing.push('rating');
    return missing;
  }
</script>

<svelte:head>
  <title>Awaiting Reflection - Espresso Engineered</title>
  <meta name="description" content="Complete your incomplete brew records" />
</svelte:head>

<AuthGuard>
  <div class="drafts-page">
    <header>
      <h1>Awaiting Reflection</h1>
      <p>Complete your brew records by adding missing measurements and reflections</p>
    </header>

    {#if loading}
      <div class="loading">Loading drafts...</div>
    {:else if error}
      <div class="error">Error: {error}</div>
    {:else if drafts.length === 0}
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <h2>All caught up!</h2>
        <p>You don't have any incomplete brews. All your brew records are complete.</p>
        <a href="/brews/new" class="new-brew-btn">Create New Brew</a>
      </div>
    {:else}
      <div class="drafts-grid">
        {#each drafts as draft (draft.id)}
          <div class="draft-card">
            <div class="draft-header">
              <h3>{draft.name || 'Untitled Brew'}</h3>
              <span class="draft-badge">Incomplete</span>
            </div>
            
            <div class="draft-info">
              <p class="created-date">
                Created: {new Date(draft.created_at).toLocaleDateString()}
              </p>
              <p class="missing-fields">
                Missing: {getMissingFields(draft).join(', ')}
              </p>
            </div>

            <div class="draft-preview">
              <div class="preview-item">
                <label>Dose:</label>
                <span>{draft.dose_mg}mg</span>
              </div>
              {#if draft.grind_setting}
                <div class="preview-item">
                  <label>Grind:</label>
                  <span>{draft.grind_setting}</span>
                </div>
              {/if}
              {#if draft.yield_mg}
                <div class="preview-item">
                  <label>Yield:</label>
                  <span>{draft.yield_mg}mg</span>
                </div>
              {/if}
            </div>

            <div class="draft-actions">
              <a href="/brews/{draft.id}" class="complete-btn">
                Complete Brew
              </a>
            </div>
          </div>
        {/each}
      </div>

      <div class="bulk-actions">
        <p class="bulk-info">
          {drafts.length} incomplete brew{drafts.length === 1 ? '' : 's'} awaiting reflection
        </p>
      </div>
    {/if}
  </div>
</AuthGuard>

<style>
  .drafts-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    text-align: center;
    margin-bottom: 2rem;
  }

  header h1 {
    color: #333;
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
  }

  header p {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
  }

  .loading, .error {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .error {
    color: #dc3545;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-state h2 {
    color: #333;
    font-size: 1.75rem;
    margin: 0 0 1rem 0;
  }

  .empty-state p {
    color: #666;
    font-size: 1.1rem;
    margin: 0 0 2rem 0;
  }

  .new-brew-btn {
    background: #007bff;
    color: white;
    padding: 0.75rem 1.5rem;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 500;
    display: inline-block;
  }

  .new-brew-btn:hover {
    background: #0056b3;
  }

  .drafts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .draft-card {
    background: white;
    border: 1px solid #e5e5e5;
    border-left: 4px solid #ffc107;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .draft-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .draft-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .draft-header h3 {
    color: #333;
    font-size: 1.25rem;
    margin: 0;
    flex: 1;
  }

  .draft-badge {
    background: #ffc107;
    color: #856404;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .draft-info {
    margin-bottom: 1rem;
  }

  .created-date {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 0.25rem 0;
  }

  .missing-fields {
    color: #dc3545;
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0;
  }

  .draft-preview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
  }

  .preview-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .preview-item label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
  }

  .preview-item span {
    color: #333;
    font-weight: 500;
  }

  .draft-actions {
    display: flex;
    justify-content: flex-end;
  }

  .complete-btn {
    background: #28a745;
    color: white;
    padding: 0.5rem 1rem;
    text-decoration: none;
    border-radius: 0.25rem;
    font-weight: 500;
    font-size: 0.9rem;
    transition: background-color 0.2s ease;
  }

  .complete-btn:hover {
    background: #218838;
  }

  .bulk-actions {
    text-align: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
  }

  .bulk-info {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .drafts-page {
      padding: 1rem 0.5rem;
    }

    header h1 {
      font-size: 2rem;
    }

    .drafts-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .draft-card {
      padding: 1rem;
    }

    .draft-preview {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>