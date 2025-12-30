<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { iconButtonBase, iconButtonIcon, iconButtonVariants } from '$lib/ui/components/icon-button';
  import { toStyleString } from '$lib/ui/style';

  export let href: string | null = null;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'neutral' | 'accent' | 'success' | 'danger' = 'neutral';
  export let tone: 'light' | 'dark' = 'light';
  export let ariaLabel: string;
  export let title: string | undefined = undefined;
  export let disabled = false;

  const element = href ? 'a' : 'button';

  let restClass = '';
  let restProps: Record<string, unknown> = {};
  $: ({ class: restClass = '', ...restProps } = $$restProps);

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
  class={`button-base icon-button icon-button--${variant} ${restClass}`.trim()}
  class:icon-button--on-dark={tone === 'dark'}
  {title}
  disabled={element === 'button' ? disabled : undefined}
  style={style}
  on:click={handleClick}
>
  <slot />
</svelte:element>
