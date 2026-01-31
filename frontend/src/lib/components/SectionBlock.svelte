<script lang="ts">
  import { ChevronDown } from '$lib/icons';
  import { sectionBlock } from '$lib/ui/components/section';
  import { toStyleString } from '$lib/ui/style';

  export let title: string | null = null;
  export let collapsible = false;
  export let open = true;
  export let disabled = false;
  export let toggleLabel: string | null = null;
  export let voiceNote: string | null = null;

  const contentId = `section-${Math.random().toString(36).slice(2, 9)}`;

  $: resolvedToggleLabel = toggleLabel ?? (title ? `Toggle ${title}` : 'Toggle section');

  const style = toStyleString({
    '--section-gap': sectionBlock.container.gap,
    '--section-header-gap': sectionBlock.header.gap,
    '--section-title-color': sectionBlock.header.textColor,
    '--section-title-size': sectionBlock.header.fontSize,
    '--section-title-weight': sectionBlock.header.fontWeight,
    '--section-title-family': sectionBlock.header.fontFamily,
    '--section-title-line-height': sectionBlock.header.lineHeight,
    '--section-divider-color': sectionBlock.header.dividerColor,
    '--section-divider-height': sectionBlock.header.dividerHeight,
    '--section-icon-color': sectionBlock.header.iconColor,
    '--section-body-gap': sectionBlock.body.gap,
    '--section-voice-gap': sectionBlock.voice.gap,
    '--section-voice-color': sectionBlock.voice.textColor,
    '--section-voice-size': sectionBlock.voice.fontSize,
    '--section-voice-family': sectionBlock.voice.fontFamily,
    '--section-voice-weight': sectionBlock.voice.fontWeight,
    '--section-voice-line-height': sectionBlock.voice.lineHeight,
  });

  function handleToggle() {
    if (disabled) return;
    open = !open;
  }
</script>

<section
  class="section-block"
  style={style}
  data-open={collapsible ? open : true}
  data-collapsible={collapsible}
>
  <header class="section-header" data-collapsible={collapsible}>
    <div class="section-title-stack">
      <div class="section-title">
        {#if collapsible}
          <button
            class="section-toggle"
            type="button"
            aria-expanded={open}
            aria-controls={contentId}
            aria-label={resolvedToggleLabel}
            on:click={handleToggle}
            disabled={disabled}
          >
            <span class="section-icon" aria-hidden="true">
              <ChevronDown size={sectionBlock.header.iconSize} />
            </span>
            <span class="section-title-text">
              {#if $$slots.title}
                <slot name="title" />
              {:else if title}
                {title}
              {/if}
            </span>
          </button>
        {:else}
          <div class="section-title-text">
            {#if $$slots.title}
              <slot name="title" />
            {:else if title}
              {title}
            {/if}
          </div>
        {/if}
      </div>
      {#if (!collapsible || open) && (voiceNote || $$slots.voice)}
        <div class="section-voice">
          {#if $$slots.voice}
            <slot name="voice" />
          {:else if voiceNote}
            <p class="voice-text">{voiceNote}</p>
          {/if}
        </div>
      {/if}
    </div>
    {#if collapsible}
      <span class="section-divider" aria-hidden="true"></span>
    {/if}
    {#if $$slots.headerActions}
      <div class="section-header-actions">
        <slot name="headerActions" />
      </div>
    {/if}
  </header>
  {#if !collapsible || open}
    <div class="section-body" id={contentId}>
      <slot />
    </div>
  {/if}
</section>

<style>
  .section-block {
    display: flex;
    flex-direction: column;
    gap: var(--section-gap);
  }

  .section-header {
    display: grid;
    align-items: center;
    gap: var(--section-header-gap);
    margin-bottom: 0;
  }

  .section-header[data-collapsible="true"] {
    grid-template-columns: auto 1fr auto;
  }

  .section-header[data-collapsible="false"] {
    grid-template-columns: 1fr auto;
  }

  .section-title {
    color: var(--section-title-color);
    font-size: var(--section-title-size);
    font-weight: var(--section-title-weight);
    font-family: var(--section-title-family);
    line-height: var(--section-title-line-height);
    display: inline-flex;
    align-items: center;
  }

  .section-title-stack {
    display: flex;
    flex-direction: column;
    gap: var(--section-voice-gap);
  }

  .section-toggle {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    display: inline-flex;
    align-items: center;
    gap: var(--section-header-gap);
    padding: 0;
    cursor: pointer;
  }

  .section-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .section-icon {
    display: inline-flex;
    align-items: center;
    color: var(--section-icon-color);
    transition: transform 0.2s ease;
  }

  .section-title-text {
    display: inline-flex;
    align-items: center;
    gap: var(--section-header-gap);
  }

  .section-divider {
    height: var(--section-divider-height);
    width: 100%;
    background: var(--section-divider-color);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: var(--section-body-gap);
  }

  .section-voice {
    display: flex;
    flex-direction: column;
    color: var(--section-voice-color);
    font-size: var(--section-voice-size);
    font-family: var(--section-voice-family);
    font-weight: var(--section-voice-weight);
    line-height: var(--section-voice-line-height);
  }

  .section-voice :global(.voice-text) {
    margin: 0;
  }

  .section-header-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--section-header-gap);
  }

  .section-block[data-open="true"] .section-divider {
    opacity: 1;
  }

  .section-block[data-open="true"] .section-icon {
    transform: rotate(0deg);
  }

  .section-block[data-open="false"] .section-icon {
    transform: rotate(-90deg);
  }
</style>
