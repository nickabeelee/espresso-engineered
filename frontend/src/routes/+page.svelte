<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
</script>

<svelte:head>
  <title>Espresso Engineered</title>
  <meta name="description" content="Community-driven espresso brewing companion" />
</svelte:head>

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

<style>
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
  }
</style>
