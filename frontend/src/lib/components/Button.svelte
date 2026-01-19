<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button as ShadcnButton } from '$lib/shadcn/button';
  import { buttonBase, buttonDisabled, buttonFocusRing, buttonSizes, buttonVariants } from '$lib/ui/components/button';
  import { toStyleString } from '$lib/ui/style';

  export let href: string | null = null;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'neutral' | 'accent' | 'success' | 'danger' | 'quiet' = 'neutral';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let ariaLabel: string | undefined = undefined;
  export let title: string | undefined = undefined;
  export let disabled = false;

  const variantMap = {
    neutral: 'outline',
    accent: 'default',
    success: 'secondary',
    danger: 'destructive',
    quiet: 'ghost'
  } as const;

  const sizeMap = {
    sm: 'sm',
    md: 'default',
    lg: 'lg'
  } as const;

  let restClass = '';
  let restStyle = '';
  let restProps: Record<string, unknown> = {};
  $: ({ class: restClass = '', style: restStyle = '', ...restProps } = $$restProps);

  $: variantTokens = variant === 'quiet' ? buttonVariants.quietOnDark : buttonVariants[variant];
  $: sizeTokens = buttonSizes[size];

  $: style = toStyleString({
    '--button-bg': 'transparent',
    '--button-border': variantTokens.borderColor,
    '--button-ink': variantTokens.textColor,
    '--button-hover-bg': variantTokens.hover.background,
    '--button-hover-border': variantTokens.hover.borderColor,
    '--button-active-bg': variantTokens.active.background,
    '--button-min-height': sizeTokens.minHeight,
    '--button-padding': sizeTokens.padding,
    '--button-font-size': sizeTokens.fontSize,
    '--button-border-radius': buttonBase.borderRadius,
    '--button-font-family': buttonBase.fontFamily,
    '--button-line-height': buttonBase.lineHeight,
    '--button-transition': buttonBase.transition,
    '--button-focus-ring': `${buttonFocusRing.width} solid ${buttonFocusRing.color}`,
    '--button-focus-offset': buttonFocusRing.offset,
    '--button-disabled-opacity': buttonDisabled.opacity,
    '--button-gap': buttonBase.gap,
    '--button-border-width': buttonBase.borderWidth,
    '--button-border-style': buttonBase.borderStyle
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
  {disabled}
  variant={variantMap[variant]}
  size={sizeMap[size]}
  class={`ee-button ${restClass}`.trim()}
  style={combinedStyle}
  on:click={handleClick}
>
  <slot />
</ShadcnButton>

<style>
  .ee-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--button-gap);
    min-height: var(--button-min-height);
    padding: var(--button-padding);
    border-radius: var(--button-border-radius);
    border: var(--button-border-width) var(--button-border-style) var(--button-border);
    background: var(--button-bg);
    color: var(--button-ink);
    cursor: pointer;
    text-decoration: none;
    font-family: var(--button-font-family);
    font-size: var(--button-font-size);
    line-height: var(--button-line-height);
    transition: var(--button-transition);
  }

  .ee-button:hover {
    background: var(--button-hover-bg);
    border-color: var(--button-hover-border);
    color: var(--button-ink);
  }

  .ee-button:active {
    background: var(--button-active-bg);
    color: var(--button-ink);
  }

  .ee-button:focus-visible {
    outline: var(--button-focus-ring);
    outline-offset: var(--button-focus-offset);
  }

  .ee-button[aria-disabled="true"],
  .ee-button:disabled {
    cursor: not-allowed;
    opacity: var(--button-disabled-opacity);
  }
</style>
