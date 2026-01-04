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
    } else {
      document.body.style.overflow = previousBodyOverflow || '';
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
    '--sheet-panel-shadow': sheet.panel.shadow,
    '--sheet-panel-width': sheet.panel.width,
    '--sheet-panel-max-height': sheet.panel.maxHeight,
    '--sheet-panel-mobile-padding': sheet.panel.mobile.padding,
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
  <div class="sheet-panel">
    {#if showHeader}
      <div class="sheet-header">
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
  </div>
</div>

<style>
  .sheet {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
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

  .sheet-panel {
    position: relative;
    width: var(--sheet-panel-width, min(760px, 100%));
    max-height: var(--sheet-panel-max-height, 88vh);
    background: var(--sheet-panel-bg, var(--bg-surface-paper));
    border-radius: var(--sheet-panel-radius, var(--radius-lg)) var(--sheet-panel-radius, var(--radius-lg)) 0 0;
    padding: var(--sheet-panel-padding, 1.5rem 1.5rem 2rem);
    box-shadow: var(--sheet-panel-shadow, var(--shadow-soft));
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
  }

  .sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sheet-header-gap, 1rem);
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

  @media (max-width: 768px) {
    .sheet-panel {
      padding: var(--sheet-panel-mobile-padding, 1.25rem 1rem 1.5rem);
      max-height: var(--sheet-panel-mobile-max-height, 92vh);
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
