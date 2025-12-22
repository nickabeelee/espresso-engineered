<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BrewForm from '$lib/components/BrewForm.svelte';
  import { apiClient } from '$lib/api-client';
  import { OfflineStorage, ConnectivityManager } from '$lib/offline-storage';
  import { syncService } from '$lib/sync-service';
  import { barista } from '$lib/auth';

  
  let prefillFromLast = false;
  let loading = false;
  let error = null;
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
    <div class="section-header">
      <div>
        <p class="voice-line">Take your time.</p>
        <h1>New Brew</h1>
        <p>Record the session as it unfolds.</p>
      </div>
      <a href="/brews" class="btn-secondary">Back</a>
    </div>

    {#if prefillFromLast}
      <div class="notice">Starting from your last brew.</div>
    {/if}

    {#if !isOnline}
      <div class="notice warning">
        <strong>Offline Mode:</strong> Your brew will be saved locally and synced when you're back online.
      </div>
    {/if}

    <BrewForm {prefillFromLast} on:save={handleSave} on:cancel={handleCancel} />

    {#if error}
      <div class="notice error">{error}</div>
    {/if}
  </div>
</AuthGuard>

<style>
  .new-brew-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
</style>
