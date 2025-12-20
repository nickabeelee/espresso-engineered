<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authService, isAuthenticated, isLoading, authStatus, authError } from '$lib/auth';

  export let redirectTo = '/auth';
  export let requireAuth = true;

  let mounted = false;

  onMount(async () => {
    // Initialize auth service
    await authService.initialize();
    mounted = true;
  });

  // Reactive statement to handle redirects
  $: if (mounted && !$isLoading && $authStatus !== 'profile_missing' && $authStatus !== 'error') {
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

  async function handleRetry() {
    await authService.reloadProfile();
  }

  async function handleSignOut() {
    await authService.signOut();
    goto('/auth');
  }
</script>

{#if $isLoading}
  <div class="auth-guard-loading">
    <div class="loading-spinner"></div>
    <p>Checking authentication...</p>
  </div>
{:else if $authStatus === 'profile_missing'}
  <div class="auth-guard-loading">
    <p>We couldn't find your barista profile.</p>
    <div class="auth-guard-actions">
      <button on:click={handleRetry}>Retry</button>
      <button on:click={handleSignOut}>Sign out</button>
    </div>
  </div>
{:else if $authStatus === 'error'}
  <div class="auth-guard-loading">
    <p>{ $authError || 'Authentication failed. Please try again.' }</p>
    <div class="auth-guard-actions">
      <button on:click={handleRetry}>Retry</button>
      <button on:click={handleSignOut}>Sign out</button>
    </div>
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
    border: 4px solid rgba(214, 199, 174, 0.2);
    border-top: 4px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .auth-guard-loading p {
    color: var(--text-ink-muted);
    font-size: 1.1rem;
  }

  .auth-guard-actions {
    display: flex;
    gap: 0.75rem;
  }

  .auth-guard-actions button {
    background: transparent;
    color: var(--text-ink-secondary);
    border: 1px solid var(--border-strong);
    padding: 0.45rem 1rem;
    border-radius: 999px;
    cursor: pointer;
  }

  .auth-guard-actions button:first-child {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    border-color: var(--accent-primary);
  }
</style>
