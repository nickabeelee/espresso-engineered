<script lang="ts">
  import { barista } from '$lib/auth';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import AwaitingReflection from '$lib/components/AwaitingReflection.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { Plus } from '$lib/icons';
</script>

<svelte:head>
  <title>Awaiting Reflection - Espresso Engineered</title>
  <meta name="description" content="Complete your incomplete brew records" />
</svelte:head>

<AuthGuard>
  <div class="drafts-page">
    <div class="section-header">
      <div>
        <p class="voice-line">It is good to see you again.</p>
        <h1>Awaiting Reflection</h1>
        <p>Finish the brews that asked for more time.</p>
      </div>
      <IconButton href="/brews/new" ariaLabel="New brew" variant="accent">
        <Plus />
      </IconButton>
    </div>
    <AwaitingReflection barista_id={$barista?.id} />
  </div>
</AuthGuard>

<style>
  .drafts-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
</style>
