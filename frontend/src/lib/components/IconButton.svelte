<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button as ShadcnButton } from '$lib/shadcn/button';
  import { iconButtonBase, iconButtonIcon, iconButtonVariants } from '$lib/ui/components/icon-button';
  import { toStyleString } from '$lib/ui/style';

  export let href: string | null = null;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'neutral' | 'accent' | 'success' | 'danger' = 'neutral';
  export let tone: 'light' | 'dark' = 'light';
  export let ariaLabel: string;
  export let title: string | undefined = undefined;
  export let disabled = false;

  const variantMap = {
    neutral: 'ee-base',
    accent: 'ee-base',
    success: 'ee-base',
    danger: 'ee-base'
  } as const;

  let restClass = '';
  let restStyle = '';
  let restProps: Record<string, unknown> = {};
  $: ({ class: restClass = '', style: restStyle = '', ...restProps } = $$restProps);

  $: variantTokens = tone === 'dark'
    ? iconButtonVariants.onDark[variant]
    : iconButtonVariants[variant];

  $: style = toStyleString({
    '--button-border': variantTokens.borderColor,
    '--button-ink': variantTokens.textColor,
    '--button-hover-bg': variantTokens.hover.background,
    '--button-hover-border': variantTokens.hover.borderColor,
    '--button-active-bg': variantTokens.active.background,
    '--icon-button-min-width': iconButtonBase.minWidth,
    '--icon-button-min-height': iconButtonBase.minHeight,
    '--icon-button-padding': iconButtonBase.padding,
    '--icon-button-gap': iconButtonBase.gap,
    '--icon-button-border-width': iconButtonBase.borderWidth,
    '--icon-button-border-style': iconButtonBase.borderStyle,
    '--icon-button-border-radius': iconButtonBase.borderRadius,
    '--icon-button-font-family': iconButtonBase.fontFamily,
    '--icon-button-font-size': iconButtonBase.fontSize,
    '--icon-button-line-height': iconButtonBase.lineHeight,
    '--icon-button-transition': iconButtonBase.transition,
    '--icon-button-icon-size': iconButtonIcon.size
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
  class={`button-base icon-button icon-button--${variant} ${tone === 'dark' ? 'icon-button--on-dark' : ''} ${restClass}`.trim()}
  {title}
  {disabled}
  variant={variantMap[variant]}
  size="ee-base"
  style={combinedStyle}
  on:click={handleClick}
>
  <slot />
</ShadcnButton>
