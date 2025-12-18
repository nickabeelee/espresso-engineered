<script lang="ts">
  // New brew creation page
  // This will be implemented in task 9 (Implement brew creation and editing workflows)
  
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import type { BrewDraft } from '@shared/types';
  
  let prefillFromLast = false;
  let loading = false;
  let error: string | null = null;

  onMount(() => {
    // Check if user wants to prefill from last brew
    const params = new URLSearchParams(window.location.search);
    prefillFromLast = params.get('prefill') === 'true';
  });

  async function handleSave(event: Event) {
    event.preventDefault();
    // Placeholder for save logic
    // Will be implemented in task 9
  }

  async function handleSaveDraft(event: Event) {
    event.preventDefault();
    // Placeholder for draft save logic
    // Will be implemented in task 9
  }
</script>

<svelte:head>
  <title>New Brew - Espresso Engineered</title>
  <meta name="description" content="Create a new espresso brew record" />
</svelte:head>

<AuthGuard>
  <div class="new-brew-page">
    <header>
      <h1>New Brew</h1>
      <a href="/brews" class="back-link">← Back to Brews</a>
    </header>

    {#if prefillFromLast}
      <div class="info-banner">
        Pre-filling from your last brew...
      </div>
    {/if}

    <form on:submit={handleSave}>
      <div class="form-placeholder">
        <p>Brew form will be implemented in task 8 (Implement core UI components)</p>
        <p>This page structure is ready for the BrewForm component.</p>
      </div>

      <div class="form-actions">
        <button type="button" on:click={handleSaveDraft} class="btn-secondary">
          Save as Draft
        </button>
        <button type="submit" class="btn-primary">
          Save Brew
        </button>
      </div>
    </form>

    {#if error}
      <div class="error">{error}</div>
    {/if}
  </div>
</AuthGuard>

<style>
  .new-brew-page {
    max-width: 800px;
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

  .back-link {
    color: #007bff;
    text-decoration: none;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .info-banner {
    background: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #004085;
  }

  form {
    background: white;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 2rem;
  }

  .form-placeholder {
    padding: 2rem;
    text-align: center;
    color: #666;
    background: #f8f9fa;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    font-size: 1rem;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #545b62;
  }

  .error {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 0.5rem;
    color: #721c24;
  }
</style>