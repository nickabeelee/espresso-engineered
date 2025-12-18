<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authService, barista, isAuthenticated, isLoading } from '$lib/auth';
  import BaristaProfile from '$lib/components/BaristaProfile.svelte';
  
  // Pages that don't require authentication
  const publicPages = ['/auth', '/'];
  
  $: isPublicPage = publicPages.includes($page.url.pathname);

  onMount(async () => {
    await authService.initialize();
  });

  async function handleSignOut() {
    try {
      await authService.signOut();
      goto('/auth');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }
</script>

{#if !isPublicPage && $isAuthenticated && $barista}
  <!-- Navigation header for authenticated users -->
  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <a href="/brews" class="logo">Espresso Engineered</a>
        <nav class="main-nav">
          <a href="/brews" class:active={$page.url.pathname.startsWith('/brews')}>
            My Brews
          </a>
          <a href="/brews/drafts" class:active={$page.url.pathname === '/brews/drafts'}>
            Awaiting Reflection
          </a>
          <a href="/profile" class:active={$page.url.pathname === '/profile'}>
            Profile
          </a>
        </nav>
      </div>
      
      <div class="header-right">
        <BaristaProfile compact={true} />
        <button on:click={handleSignOut} class="sign-out-btn">
          Sign Out
        </button>
      </div>
    </div>
  </header>
{/if}

<main class:with-header={!isPublicPage && $isAuthenticated && $barista}>
  {#if $isLoading}
    <div class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  {:else}
    <slot />
  {/if}
</main>

<style>
  .app-header {
    background: white;
    border-bottom: 1px solid #e5e5e5;
    padding: 0 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .logo {
    font-size: 1.25rem;
    font-weight: 700;
    color: #333;
    text-decoration: none;
  }

  .logo:hover {
    color: #007bff;
  }

  .main-nav {
    display: flex;
    gap: 1.5rem;
  }

  .main-nav a {
    color: #666;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 0;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .main-nav a:hover {
    color: #333;
  }

  .main-nav a.active {
    color: #007bff;
    border-bottom-color: #007bff;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }



  .sign-out-btn {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .sign-out-btn:hover {
    background: #545b62;
  }

  main {
    min-height: 100vh;
  }

  main.with-header {
    min-height: calc(100vh - 60px);
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  main:not(.with-header) {
    padding: 0;
  }

  .loading-screen {
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

  .loading-screen p {
    color: #666;
    font-size: 1.1rem;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .header-content {
      padding: 0 0.5rem;
    }
    
    .header-left {
      gap: 1rem;
    }
    
    .main-nav {
      gap: 1rem;
    }
    
    .main-nav a {
      font-size: 0.9rem;
    }
    

  }
</style>