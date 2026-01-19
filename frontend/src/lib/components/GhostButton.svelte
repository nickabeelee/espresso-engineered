<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button as ShadcnButton } from '$lib/shadcn/button';
  import { buttonBase, buttonDisabled, buttonFocusRing, buttonSizes, buttonVariants } from '$lib/ui/components/button';
  import { toStyleString } from '$lib/ui/style';

  export let href: string | null = null;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'neutral' | 'accent' | 'success' | 'danger' = 'neutral';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let ariaLabel: string | undefined = undefined;
  export let title: string | undefined = undefined;
  export let disabled = false;

  const variantMap = {
    neutral: 'ee-base',
    accent: 'ee-base',
    success: 'ee-base',
    danger: 'ee-base'
  } as const;

  const sizeMap = {
    sm: 'ee-base',
    md: 'ee-base',
    lg: 'ee-base'
  } as const;

  let restClass = '';
  let restStyle = '';
  let restProps: Record<string, unknown> = {};
  $: ({ class: restClass = '', style: restStyle = '', ...restProps } = $$restProps);

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

  $: combinedStyle = [style, restStyle].filter(Boolean).join(';');

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

<ShadcnButton
  {...restProps}
  href={href ?? undefined}
  {type}
  aria-label={ariaLabel}
  {title}
  class={`ghost-button ${restClass}`.trim()}
  {disabled}
  variant={variantMap[variant]}
  size={sizeMap[size]}
  style={combinedStyle}
  on:click={handleClick}
>
  <slot />
</ShadcnButton>

<style>
  :global(.ghost-button) {
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

  :global(.ghost-button:hover) {
    background: var(--button-hover-bg);
    border-color: var(--button-hover-border);
    color: var(--button-ink);
  }

  :global(.ghost-button:active) {
    background: var(--button-active-bg);
    color: var(--button-ink);
  }

  :global(.ghost-button:focus-visible) {
    outline: var(--ghost-button-focus-ring);
    outline-offset: var(--ghost-button-focus-offset);
  }

  :global(.ghost-button[aria-disabled="true"]),
  :global(.ghost-button:disabled) {
    cursor: not-allowed;
    opacity: var(--ghost-button-disabled-opacity);
  }
</style>
