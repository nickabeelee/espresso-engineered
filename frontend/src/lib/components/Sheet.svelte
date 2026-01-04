<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import IconButton from '$lib/components/IconButton.svelte';
  import { XMark } from '$lib/icons';
  import { sheet } from '$lib/ui/components/sheet';
  import { toStyleString } from '$lib/ui/style';

  export let open = false;
  export let title: string | null = null;
  export let subtitle: string | null = null;
  export let closeLabel = 'Close';
  export let lockScroll = true;
  export let showHeader = true;
  export let stickyHeader = false;
  export let edgeFade = false;

  const dispatch = createEventDispatcher<{ close: void }>();

  let previousBodyOverflow = '';

  function requestClose() {
    dispatch('close');
  }

  function syncBodyScrollLock(locked: boolean) {
    if (!browser || !lockScroll) return;
    if (locked) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('sheet-open');
    } else {
      document.body.style.overflow = previousBodyOverflow || '';
      document.body.classList.remove('sheet-open');
    }
  }

  $: syncBodyScrollLock(Boolean(open));

  onDestroy(() => {
    syncBodyScrollLock(false);
  });

  const style = toStyleString({
    '--sheet-overlay-bg': sheet.overlay.background,
    '--sheet-panel-bg': sheet.panel.background,
    '--sheet-panel-radius': sheet.panel.radius,
    '--sheet-panel-padding': sheet.panel.padding,
    '--sheet-panel-padding-top': sheet.panel.paddingTop,
    '--sheet-panel-padding-x': sheet.panel.paddingX,
    '--sheet-panel-padding-bottom': sheet.panel.paddingBottom,
    '--sheet-panel-shadow': sheet.panel.shadow,
    '--sheet-panel-width': sheet.panel.width,
    '--sheet-panel-max-height': sheet.panel.maxHeight,
    '--sheet-panel-mobile-padding': sheet.panel.mobile.padding,
    '--sheet-panel-mobile-padding-top': sheet.panel.mobile.paddingTop,
    '--sheet-panel-mobile-padding-x': sheet.panel.mobile.paddingX,
    '--sheet-panel-mobile-padding-bottom': sheet.panel.mobile.paddingBottom,
    '--sheet-panel-mobile-max-height': sheet.panel.mobile.maxHeight,
    '--sheet-panel-desktop-offset': sheet.panel.desktop.offsetTop,
    '--sheet-panel-desktop-max-height': sheet.panel.desktop.maxHeight,
    '--sheet-header-gap': sheet.header.gap,
    '--sheet-title-color': sheet.title.color,
    '--sheet-title-size': sheet.title.size,
    '--sheet-subtitle-color': sheet.subtitle.color,
    '--sheet-subtitle-size': sheet.subtitle.size
  });
</script>

<div class="sheet" class:open={open} role="dialog" aria-modal="true" aria-hidden={!open} style={style}>
  <button class="sheet-backdrop" type="button" on:click={requestClose} aria-label={closeLabel}></button>
  {#if open}
    <div class="sheet-safe-area" aria-hidden="true"></div>
  {/if}
  <div class="sheet-panel" class:sticky-header={stickyHeader} class:edge-fade={edgeFade}>
    {#if showHeader}
      <div class="sheet-header" class:sticky={stickyHeader}>
        <div class="sheet-title">
          {#if title}
            <h3>{title}</h3>
          {/if}
          {#if subtitle}
            <p class="sheet-subtitle">{subtitle}</p>
          {/if}
        </div>
        <IconButton on:click={requestClose} ariaLabel={closeLabel} title={closeLabel} variant="neutral">
          <XMark size={18} />
        </IconButton>
      </div>
    {/if}
    <div class="sheet-content">
      <slot />
    </div>
    {#if edgeFade}
      <div class="sheet-edge-fade" aria-hidden="true"></div>
    {/if}
  </div>
</div>

<style>
  .sheet {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--motion-fast);
  }

  .sheet.open {
    opacity: 1;
    pointer-events: auto;
  }

  .sheet-backdrop {
    position: absolute;
    inset: 0;
    background: var(--sheet-overlay-bg, rgba(43, 33, 24, 0.55));
    border: none;
  }

  .sheet-safe-area {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: env(safe-area-inset-bottom, 0px);
    background: var(--sheet-panel-bg, var(--bg-surface-paper));
    z-index: 1;
    pointer-events: none;
  }

  .sheet-panel {
    position: relative;
    width: var(--sheet-panel-width, min(760px, 100%));
    max-height: var(--sheet-panel-max-height, 88vh);
    background: var(--sheet-panel-bg, var(--bg-surface-paper));
    border-radius: var(--sheet-panel-radius, var(--radius-lg)) var(--sheet-panel-radius, var(--radius-lg)) 0 0;
    --sheet-panel-safe-bottom: env(safe-area-inset-bottom, 0px);
    padding: var(--sheet-panel-padding, 1.5rem 1.5rem 2rem);
    padding-bottom: calc(var(--sheet-panel-padding-bottom, 2rem) + var(--sheet-panel-safe-bottom, 0px));
    box-shadow: var(--sheet-panel-shadow, var(--shadow-soft));
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
  }

  .sheet-panel.sticky-header {
    padding: 0;
  }

  .sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sheet-header-gap, 1rem);
  }

  .sheet-header.sticky {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--sheet-panel-bg, var(--bg-surface-paper));
    padding-bottom: 0.75rem;
    isolation: isolate;
  }

  .sheet-panel.sticky-header .sheet-header {
    padding: var(--sheet-panel-padding-top, 1.5rem) var(--sheet-panel-padding-x, 1.5rem) 0.75rem;
  }

  .sheet-title {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sheet-title h3 {
    margin: 0;
    color: var(--sheet-title-color, var(--text-ink-primary));
    font-size: var(--sheet-title-size, 1.2rem);
  }

  .sheet-subtitle {
    margin: 0;
    color: var(--sheet-subtitle-color, var(--text-ink-muted));
    font-size: var(--sheet-subtitle-size, 0.9rem);
  }

  .sheet-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .sheet-panel.sticky-header .sheet-content {
    padding: 0 var(--sheet-panel-padding-x, 1.5rem)
      calc(var(--sheet-panel-padding-bottom, 2rem) + var(--sheet-panel-safe-bottom, 0px));
  }

  .sheet-edge-fade {
    position: sticky;
    bottom: 0;
    height: calc(2.75rem + var(--sheet-panel-safe-bottom, 0px));
    margin-top: calc(-2.75rem - var(--sheet-panel-safe-bottom, 0px));
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0),
      var(--sheet-panel-bg, var(--bg-surface-paper)) 85%
    );
    pointer-events: none;
    z-index: 1;
  }

  .sheet-panel.edge-fade .sheet-edge-fade {
    backdrop-filter: blur(6px);
  }

  @media (max-width: 768px) {
    .sheet-panel {
      padding: var(--sheet-panel-mobile-padding, 1.25rem 1rem 1.5rem);
      max-height: var(--sheet-panel-mobile-max-height, 92vh);
      --sheet-panel-padding-top: var(--sheet-panel-mobile-padding-top, 1.25rem);
      --sheet-panel-padding-x: var(--sheet-panel-mobile-padding-x, 1rem);
      --sheet-panel-padding-bottom: var(--sheet-panel-mobile-padding-bottom, 1.5rem);
    }
  }

  @media (min-width: 769px) {
    .sheet {
      align-items: flex-start;
      padding-top: var(--sheet-panel-desktop-offset, 6vh);
    }

    .sheet-panel {
      border-radius: var(--sheet-panel-radius, var(--radius-lg));
      max-height: var(--sheet-panel-desktop-max-height, calc(100vh - 8vh));
    }
  }
</style>
