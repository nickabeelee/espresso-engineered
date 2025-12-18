<script lang="ts">
  // Brew list page - displays all brews for the current barista
  // This will be implemented in task 8 (Implement core UI components)
  
  import { onMount } from 'svelte';
  import AuthGuard from '$lib/components/AuthGuard.svelte';

  
  let brews = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    // Placeholder for brew loading logic
    // Will be implemented in task 8
    loading = false;
  });
</script>

<svelte:head>
  <title>My Brews - Espresso Engineered</title>
  <meta name="description" content="View and manage your espresso brew records" />
</svelte:head>

<AuthGuard>
  <div class="brew-list-page">
    <header>
      <h1>My Brews</h1>
      <a href="/brews/new" class="new-brew-btn">New Brew</a>
    </header>

    {#if loading}
      <div class="loading">Loading brews...</div>
    {:else if error}
      <div class="error">Error: {error}</div>
    {:else if brews.length === 0}
      <div class="empty-state">
        <p>No brews yet. <a href="/brews/new">Create your first brew</a>!</p>
      </div>
    {:else}
      <div class="brew-grid">
        {#each brews as brew (brew.id)}
          <div class="brew-card">
            <h3>{brew.name || 'Untitled Brew'}</h3>
            <p>Created: {new Date(brew.created_at).toLocaleDateString()}</p>
            <a href="/brews/{brew.id}">View Details</a>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</AuthGuard>

<style>
  .brew-list-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  h1 {
    color: #333;
    font-size: 2rem;
    margin: 0;
  }

  .new-brew-btn {
    background: #007bff;
    color: white;
    padding: 0.75rem 1.5rem;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 500;
  }

  .new-brew-btn:hover {
    background: #0056b3;
  }

  .loading, .error, .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .error {
    color: #dc3545;
  }

  .brew-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .brew-card {
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 1rem;
    background: white;
  }

  .brew-card h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .brew-card p {
    margin: 0 0 1rem 0;
    color: #666;
    font-size: 0.9rem;
  }

  .brew-card a {
    color: #007bff;
    text-decoration: none;
  }

  .brew-card a:hover {
    text-decoration: underline;
  }
</style>