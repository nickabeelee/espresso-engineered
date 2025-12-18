<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authService, isAuthenticated, isLoading } from '$lib/auth';

  export let redirectTo = '/auth';
  export let requireAuth = true;

  let mounted = false;

  onMount(async () => {
    // Initialize auth service
    await authService.initialize();
    mounted = true;
  });

  // Reactive statement to handle redirects
  $: if (mounted && !$isLoading) {
    if (requireAuth && !$isAuthenticated) {
      // Store the current path to redirect back after login
      const returnPath = $page.url.pathname + $page.url.search;
      const redirectUrl = `${redirectTo}?returnTo=${encodeURIComponent(returnPath)}`;
      goto(redirectUrl);
    } else if (!requireAuth && $isAuthenticated) {
      // User is authenticated but on a public page (like auth page)
      goto('/brews');
    }
  }
</script>

{#if $isLoading}
  <div class="auth-guard-loading">
    <div class="loading-spinner"></div>
    <p>Checking authentication...</p>
  </div>
{:else if requireAuth && !$isAuthenticated}
  <!-- Will redirect, show loading state -->
  <div class="auth-guard-loading">
    <div class="loading-spinner"></div>
    <p>Redirecting to login...</p>
  </div>
{:else if !requireAuth && $isAuthenticated}
  <!-- Will redirect, show loading state -->
  <div class="auth-guard-loading">
    <div class="loading-spinner"></div>
    <p>Redirecting...</p>
  </div>
{:else}
  <!-- Auth state is correct, show content -->
  <slot />
{/if}

<style>
  .auth-guard-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .auth-guard-loading p {
    color: #666;
    font-size: 1.1rem;
  }
</style>