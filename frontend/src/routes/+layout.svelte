<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authService, barista, isAuthenticated, isLoading, authStatus, authError } from '$lib/auth';
  import BaristaProfile from '$lib/components/BaristaProfile.svelte';
  import SyncStatus from '$lib/components/SyncStatus.svelte';
  
  // Pages that don't require authentication
  const publicPages = ['/auth', '/'];
  
  $: isPublicPage = publicPages.includes($page.url.pathname);

  onMount(async () => {
    console.log('Layout: Initializing auth service...');
    await authService.initialize();
    console.log('Layout: Auth service initialized');
  });

  async function handleSignOut() {
    try {
      await authService.signOut();
      goto('/auth');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  async function handleRetryProfile() {
    await authService.reloadProfile();
  }
</script>

<div class="app-shell">
  {#if !isPublicPage && $isAuthenticated && $barista}
    <div class="app-chrome">
      <aside class="side-rail">
        <div class="rail-top">
          <a href="/brews" class="logo">Espresso Engineered</a>
          <nav class="rail-nav">
            <a
              href="/brews"
              class:active={
                $page.url.pathname === '/brews'
                || ($page.url.pathname.startsWith('/brews/') && !$page.url.pathname.startsWith('/brews/drafts'))
              }
            >
              Brews
            </a>
            <a
              href="/brews/drafts"
              class:active={$page.url.pathname === '/brews/drafts' || $page.url.pathname.startsWith('/brews/drafts/')}
            >
              Reflection
            </a>
            <a
              href="/profile"
              class:active={$page.url.pathname === '/profile'}
            >
              Profile
            </a>
          </nav>
        </div>

        <div class="rail-bottom">
          <SyncStatus />
          <BaristaProfile compact={true} />
          <button on:click={handleSignOut} class="btn-quiet">
            Sign Out
          </button>
        </div>
      </aside>

      <main class="page-main">
        {#if $authStatus === 'profile_missing'}
          <div class="page-frame">
            <div class="page-surface loading-screen">
              <p>We couldn't find your barista profile.</p>
              <div class="auth-actions">
                <button on:click={handleRetryProfile} class="btn-primary">Retry</button>
                <button on:click={handleSignOut} class="btn-secondary">Sign Out</button>
              </div>
            </div>
          </div>
        {:else if $authStatus === 'error'}
          <div class="page-frame">
            <div class="page-surface loading-screen">
              <p>{ $authError || 'Authentication failed. Please try again.' }</p>
              <div class="auth-actions">
                <button on:click={handleRetryProfile} class="btn-primary">Retry</button>
                <button on:click={handleSignOut} class="btn-secondary">Sign Out</button>
              </div>
            </div>
          </div>
        {:else if $isLoading}
          <div class="page-frame">
            <div class="page-surface loading-screen">
              <div class="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        {:else}
          <div class="page-frame">
            <div class="page-surface">
              <slot />
            </div>
          </div>
        {/if}
      </main>
    </div>
  {:else}
    <main>
      <div class="page-frame public-frame">
        <div class="page-surface">
          <slot />
        </div>
      </div>
    </main>
  {/if}
</div>

<style>
  .logo {
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--text-ink-inverted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
  }

  .logo:hover {
    color: var(--text-ink-inverted-muted);
  }

  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 40vh;
    gap: 1rem;
    text-align: center;
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

  .loading-screen p {
    color: var(--text-ink-secondary);
    font-size: 1rem;
  }

  .auth-actions {
    display: flex;
    gap: 0.75rem;
  }

  @media (max-width: 900px) {
    .logo {
      letter-spacing: 0.06em;
    }
  }
</style>
