<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated, barista } from '$lib/auth';
  import VoiceGreeting from '$lib/components/VoiceGreeting.svelte';
  import BeanInventorySection from '$lib/components/BeanInventorySection.svelte';
  import { apiClient } from '$lib/api-client';

  // Redirect unauthenticated users to auth page
  $: if (!$isAuthenticated && $barista === null) {
    goto('/auth');
  }

  let lastBrewDate: Date | null = null;
  let hasRecentActivity = false;

  // Load user activity data when component mounts
  onMount(async () => {
    if ($barista) {
      try {
        // Try to get prefill data which indicates recent brewing activity
        const prefillResponse = await apiClient.getPrefillData();
        if (prefillResponse.data) {
          hasRecentActivity = true;
          // For now, we'll assume recent activity if prefill data exists
          // In a future enhancement, we could add a specific endpoint for last brew date
        }
      } catch (error) {
        // If no prefill data, user likely hasn't brewed recently
        hasRecentActivity = false;
      }
    }
  });
</script>

<svelte:head>
  <title>Home - Espresso Engineered</title>
  <meta name="description" content="Your brewing dashboard" />
</svelte:head>

{#if $isAuthenticated && $barista}
  <div class="home-dashboard">
    <!-- Voice Greeting Section -->
    <VoiceGreeting 
      barista={$barista} 
      {lastBrewDate} 
      {hasRecentActivity} 
    />

    <!-- Bean Inventory Section -->
    <BeanInventorySection />

    <!-- Week in Brewing Section -->
    <section class="week-brewing-section">
      <h2>This Week in Brewing</h2>
      <div class="section-placeholder">
        <p class="voice-text">Community brewing activity will appear here.</p>
      </div>
    </section>

    <!-- Bean Analysis Section -->
    <section class="bean-analysis-section">
      <h2>Bean Analysis</h2>
      <div class="section-placeholder">
        <p class="voice-text">Your brewing analytics will appear here.</p>
      </div>
    </section>
  </div>
{:else}
  <!-- Landing page for unauthenticated users -->
  <div class="home-page">
    <div class="hero">
      <p class="voice-line">Take a moment.</p>
      <h1>Espresso Engineered</h1>
      <p class="tagline">A quieter place to record the way you brew.</p>
      <p class="description">
        Capture espresso sessions with deliberate notes, revisit past ratios, and
        discover the patterns you return to most.
      </p>
      
      <div class="cta-buttons">
        <a href="/auth" class="btn-primary">Enter</a>
        <a href="/brews" class="btn-secondary">Browse Brews</a>
      </div>
    </div>

    <div class="features">
      <div class="feature card">
        <h3>Quiet logging</h3>
        <p>Pre-fill from your last brew and focus only on what changed.</p>
      </div>
      
      <div class="feature card">
        <h3>Offline first</h3>
        <p>Drafts hold steady when you're away and sync when you return.</p>
      </div>
      
      <div class="feature card">
        <h3>Shared patterns</h3>
        <p>See how your equipment shapes results, without turning it into noise.</p>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Dashboard styles */
  .home-dashboard {
    display: flex;
    flex-direction: column;
    gap: 3rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .bean-inventory-section,
  .week-brewing-section,
  .bean-analysis-section {
    margin-bottom: 2rem;
  }

  .bean-inventory-section h2,
  .week-brewing-section h2,
  .bean-analysis-section h2 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    color: var(--text-ink-primary);
  }

  .section-placeholder {
    padding: 2rem;
    border: 2px dashed var(--border-subtle);
    border-radius: var(--radius-md);
    text-align: center;
    background: var(--surface-secondary);
  }

  .voice-text {
    font-family: 'Libre Baskerville', serif;
    color: var(--text-ink-muted);
    margin: 0;
  }

  /* Landing page styles (for unauthenticated users) */
  .home-page {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .hero {
    text-align: left;
    max-width: 680px;
  }

  h1 {
    font-size: 2.6rem;
    margin-bottom: 0.75rem;
  }

  .tagline {
    font-size: 1.2rem;
    color: var(--text-ink-secondary);
    margin: 0 0 1rem 0;
  }

  .description {
    margin: 0 0 2rem 0;
  }

  .cta-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .feature h3 {
    font-size: 1.1rem;
    margin-bottom: 0.6rem;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2.1rem;
    }

    .cta-buttons {
      flex-direction: column;
      align-items: flex-start;
    }

    .home-dashboard {
      gap: 2rem;
    }
  }
</style>
