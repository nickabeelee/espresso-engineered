<script lang="ts">
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BeanList from '$lib/components/BeanList.svelte';
</script>

<svelte:head>
  <title>Beans - Espresso Engineered</title>
  <meta name="description" content="Manage your coffee bean inventory and discover new beans from the community" />
</svelte:head>

<AuthGuard>
  <div class="beans-page">
    <div class="section-header">
      <div>
        <p class="voice-line">Discover what drives great coffee.</p>
        <h1>Beans</h1>
        <p>Your collection and the community's discoveries.</p>
      </div>
    </div>

    <div class="beans-content">
      <BeanList />
    </div>
  </div>
</AuthGuard>

<style>
  .beans-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .beans-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
</style>