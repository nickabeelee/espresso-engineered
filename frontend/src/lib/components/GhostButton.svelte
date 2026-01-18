<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { buttonBase, buttonDisabled, buttonFocusRing, buttonSizes, buttonVariants } from '$lib/ui/components/button';
  import { toStyleString } from '$lib/ui/style';

  export let href: string | null = null;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'neutral' | 'accent' | 'success' | 'danger' = 'neutral';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let ariaLabel: string | undefined = undefined;
  export let title: string | undefined = undefined;
  export let disabled = false;

  const element = href ? 'a' : 'button';

  let restClass = '';
  let restProps: Record<string, unknown> = {};
  $: ({ class: restClass = '', ...restProps } = $$restProps);

  $: variantTokens = buttonVariants[variant];
  $: sizeTokens = buttonSizes[size];

  $: style = toStyleString({
    '--button-bg': 'transparent',
    '--button-border': 'transparent',
    '--button-hover-border': 'transparent',
    '--button-ink': variantTokens.textColor,
    '--button-hover-bg': variantTokens.hover.background,
    '--button-active-bg': variantTokens.active.background,
    '--ghost-button-min-height': sizeTokens.minHeight,
    '--ghost-button-padding': sizeTokens.padding,
    '--ghost-button-font-size': sizeTokens.fontSize,
    '--ghost-button-border-radius': buttonBase.borderRadius,
    '--ghost-button-font-family': buttonBase.fontFamily,
    '--ghost-button-line-height': buttonBase.lineHeight,
    '--ghost-button-transition': buttonBase.transition,
    '--ghost-button-focus-ring': `${buttonFocusRing.width} solid ${buttonFocusRing.color}`,
    '--ghost-button-focus-offset': buttonFocusRing.offset,
    '--ghost-button-disabled-opacity': buttonDisabled.opacity,
    '--ghost-button-gap': buttonBase.gap
  });

  const dispatch = createEventDispatcher<{ click: MouseEvent }>();

  function handleClick(event: MouseEvent) {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    dispatch('click', event);
  }
</script>

<svelte:element
  this={element}
  {...restProps}
  href={href ?? undefined}
  type={element === 'button' ? type : undefined}
  aria-label={ariaLabel}
  aria-disabled={disabled ? 'true' : undefined}
  tabindex={disabled && element === 'a' ? -1 : undefined}
  class={`ghost-button ${restClass}`.trim()}
  {title}
  disabled={element === 'button' ? disabled : undefined}
  style={style}
  on:click={handleClick}
>
  <slot />
</svelte:element>

<style>
  .ghost-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ghost-button-gap);
    min-height: var(--ghost-button-min-height);
    padding: var(--ghost-button-padding);
    border-radius: var(--ghost-button-border-radius);
    border: 1px solid var(--button-border);
    background: var(--button-bg);
    color: var(--button-ink);
    cursor: pointer;
    text-decoration: none;
    font-family: var(--ghost-button-font-family);
    font-size: var(--ghost-button-font-size);
    line-height: var(--ghost-button-line-height);
    transition: var(--ghost-button-transition);
  }

  .ghost-button:hover {
    background: var(--button-hover-bg);
    border-color: var(--button-hover-border);
    color: var(--button-ink);
  }

  .ghost-button:active {
    background: var(--button-active-bg);
    color: var(--button-ink);
  }

  .ghost-button:focus-visible {
    outline: var(--ghost-button-focus-ring);
    outline-offset: var(--ghost-button-focus-offset);
  }

  .ghost-button[aria-disabled="true"],
  .ghost-button:disabled {
    cursor: not-allowed;
    opacity: var(--ghost-button-disabled-opacity);
  }
</style>
