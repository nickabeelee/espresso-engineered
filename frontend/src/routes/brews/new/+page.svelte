<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BrewForm from '$lib/components/BrewForm.svelte';
  import { apiClient } from '$lib/api-client';
  import { OfflineStorage, ConnectivityManager } from '$lib/offline-storage';
  import { syncService } from '$lib/sync-service';
  import { barista } from '$lib/auth';
  import type { CreateBrewRequest, BrewDraft } from '@shared/types';
  
  let prefillFromLast = false;
  let loading = false;
  let error: string | null = null;
  let isOnline = true;

  onMount(() => {
    // Check if user wants to prefill from last brew
    const params = new URLSearchParams(window.location.search);
    prefillFromLast = params.get('prefill') === 'true';

    // Set up connectivity monitoring
    isOnline = ConnectivityManager.isOnline();
    const cleanup = ConnectivityManager.addListener((online) => {
      isOnline = online;
      if (online) {
        // Try to sync any pending drafts when coming back online
        syncPendingDrafts();
      }
    });

    return cleanup;
  });

  async function syncPendingDrafts() {
    try {
      const result = await syncService.syncPendingDrafts();
      if (result.success && result.syncedCount && result.syncedCount > 0) {
        console.log(`Successfully synced ${result.syncedCount} drafts`);
      }
    } catch (err) {
      console.error('Failed to sync pending drafts:', err);
    }
  }

  async function handleSave(event: CustomEvent<CreateBrewRequest>) {
    const brewData = event.detail;
    loading = true;
    error = null;

    try {
      if (isOnline) {
        // Save directly to server
        const response = await apiClient.createBrew(brewData);
        if (response.data) {
          goto(`/brews/${response.data.id}`);
        } else {
          throw new Error('Failed to create brew');
        }
      } else {
        // Save as draft offline
        const currentBarista = $barista;
        if (!currentBarista) {
          throw new Error('No authenticated user');
        }

        const draft: BrewDraft = {
          ...brewData,
          barista_id: currentBarista.id,
          created_at: new Date().toISOString()
        };

        const draftId = await OfflineStorage.saveDraft(draft);
        goto(`/brews/drafts`);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save brew';
    } finally {
      loading = false;
    }
  }

  async function handleSaveDraft(event: CustomEvent<CreateBrewRequest>) {
    const brewData = event.detail;
    loading = true;
    error = null;

    try {
      const currentBarista = $barista;
      if (!currentBarista) {
        throw new Error('No authenticated user');
      }

      const draft: BrewDraft = {
        ...brewData,
        barista_id: currentBarista.id,
        created_at: new Date().toISOString()
      };

      if (isOnline) {
        // Try to save as draft on server first
        try {
          const response = await apiClient.createBrew(draft);
          if (response.data) {
            goto(`/brews/${response.data.id}`);
            return;
          }
        } catch (serverError) {
          // If server fails, fall back to offline storage
          console.warn('Server draft save failed, saving offline:', serverError);
        }
      }

      // Save offline
      const draftId = await OfflineStorage.saveDraft(draft);
      goto('/brews/drafts');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save draft';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/brews');
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

    {#if !isOnline}
      <div class="offline-banner">
        <strong>Offline Mode:</strong> Your brew will be saved locally and synced when you're back online.
      </div>
    {/if}

    <BrewForm 
      {prefillFromLast}
      on:save={handleSave}
      on:draft={handleSaveDraft}
      on:cancel={handleCancel}
    />

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

  .offline-banner {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #856404;
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