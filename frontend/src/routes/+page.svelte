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
    <h1>Espresso Engineered</h1>
    <p class="tagline">Community-driven espresso brewing companion</p>
    <p class="description">
      Record your espresso brews, learn from shared data, and discover 
      practical grind and recipe suggestions based on real-world usage.
    </p>
    
    <div class="cta-buttons">
      <a href="/auth" class="btn-primary">Get Started</a>
      <a href="/brews" class="btn-secondary">View Brews</a>
    </div>
  </div>

  <div class="features">
    <div class="feature">
      <h3>Quick Brew Logging</h3>
      <p>Minimize required input during the brewing moment with smart pre-filling from your previous brews.</p>
    </div>
    
    <div class="feature">
      <h3>Offline Capable</h3>
      <p>Create draft brews offline and sync them automatically when you're back online.</p>
    </div>
    
    <div class="feature">
      <h3>Community Driven</h3>
      <p>Learn from shared brew data and contribute to communal equipment and recipe suggestions.</p>
    </div>
  </div>
</div>

<style>
  .home-page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .hero {
    text-align: center;
    margin-bottom: 4rem;
  }

  h1 {
    color: #333;
    font-size: 3rem;
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .tagline {
    color: #666;
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .description {
    color: #555;
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto 2rem auto;
  }

  .cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-primary, .btn-secondary {
    padding: 0.75rem 2rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background: #0056b3;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: transparent;
    color: #007bff;
    border: 2px solid #007bff;
  }

  .btn-secondary:hover {
    background: #007bff;
    color: white;
    transform: translateY(-1px);
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 4rem;
  }

  .feature {
    text-align: center;
    padding: 2rem;
    border-radius: 0.5rem;
    background: #f8f9fa;
  }

  .feature h3 {
    color: #333;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .feature p {
    color: #666;
    line-height: 1.6;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .home-page {
      padding: 1rem;
    }
    
    h1 {
      font-size: 2.5rem;
    }
    
    .tagline {
      font-size: 1.1rem;
    }
    
    .description {
      font-size: 1rem;
    }
    
    .cta-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .btn-primary, .btn-secondary {
      width: 200px;
    }
    
    .features {
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-top: 3rem;
    }
    
    .feature {
      padding: 1.5rem;
    }
  }
</style>