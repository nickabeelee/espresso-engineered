<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '../auth.js';
  import { apiClient } from '../api-client.js';

  let isAdmin = false;
  let isLoading = true;
  let error = '';

  onMount(async () => {
    try {
      // Check if user is authenticated
      if (!$authStore.user) {
        goto('/auth');
        return;
      }

      // Try to access admin dashboard to verify admin status
      await apiClient.get('/api/admin/dashboard');
      isAdmin = true;
    } catch (err: any) {
      if (err.status === 403) {
        error = 'Admin access required. You do not have permission to access this area.';
      } else if (err.status === 401) {
        goto('/auth');
        return;
      } else {
        error = 'Unable to verify admin status. Please try again.';
      }
    } finally {
      isLoading = false;
    }
  });
</script>

{#if isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Verifying admin access...</p>
    </div>
  </div>
{:else if error}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center max-w-md mx-auto p-6">
      <div class="text-red-500 text-6xl mb-4">🚫</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p class="text-gray-600 mb-6">{error}</p>
      <button 
        on:click={() => goto('/')}
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Return to Home
      </button>
    </div>
  </div>
{:else if isAdmin}
  <slot />
{/if}

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>