<script lang="ts">
  import { barista } from '$lib/auth';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BrewList from '$lib/components/BrewList.svelte';
</script>

<svelte:head>
  <title>My Brews - Espresso Engineered</title>
  <meta name="description" content="View and manage your espresso brew records" />
</svelte:head>

<AuthGuard>
  <div class="brew-list-page">
    <div class="section-header">
      <div>
        <p class="voice-line">You came back.</p>
        <h1>Brews</h1>
        <p>Recent brews and returning drafts.</p>
      </div>
      <a href="/brews/new" class="btn-primary">New Brew</a>
    </div>
    <BrewList barista_id={$barista?.id} />
  </div>
</AuthGuard>

<style>
  .brew-list-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

</style>
