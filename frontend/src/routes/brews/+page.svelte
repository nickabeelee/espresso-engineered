<script lang="ts">
  import { barista } from '$lib/auth';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BrewList from '$lib/components/BrewList.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { Plus } from '$lib/icons';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';

  const breadcrumbLinkStyle = toStyleString({
    ...textStyles.helper,
    color: colorCss.text.ink.muted,
    '--breadcrumb-color': colorCss.text.ink.muted,
    '--breadcrumb-hover': colorCss.text.ink.secondary
  });
</script>

<svelte:head>
  <title>My Brews - Espresso Engineered</title>
  <meta name="description" content="View and manage your espresso brew records" />
</svelte:head>

<AuthGuard>
  <div class="brew-list-page">
    <nav class="breadcrumb">
      <a href="/" class="breadcrumb-link" style={breadcrumbLinkStyle}>← Home</a>
    </nav>
    <div class="section-header">
      <div>
        <p class="voice-line">You came back.</p>
        <h1>Brews</h1>
        <p>Recent brews and returning drafts.</p>
      </div>
      <IconButton href="/brews/new" ariaLabel="New brew" variant="accent">
        <Plus />
      </IconButton>
    </div>
    <BrewList />
  </div>
</AuthGuard>

<style>
  .brew-list-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .breadcrumb {
    margin-bottom: 0.5rem;
  }

  .breadcrumb-link {
    text-decoration: none;
    color: var(--breadcrumb-color, var(--text-ink-muted));
    transition: color 0.2s ease;
  }

  .breadcrumb-link:hover {
    color: var(--breadcrumb-hover, var(--text-ink-secondary));
  }
</style>
