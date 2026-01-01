<script lang="ts">
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import AwaitingReflection from '$lib/components/AwaitingReflection.svelte';
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
  <title>Awaiting Reflection - Espresso Engineered</title>
  <meta name="description" content="Complete your incomplete brew records" />
</svelte:head>

<AuthGuard>
  <div class="drafts-page">
    <nav class="breadcrumb">
      <a href="/" class="breadcrumb-link" style={breadcrumbLinkStyle}>← Home</a>
    </nav>
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
    <AwaitingReflection />
  </div>
</AuthGuard>

<style>
  .drafts-page {
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
