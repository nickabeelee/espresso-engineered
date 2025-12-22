<script lang="ts">
  import { createEventDispatcher } from 'svelte';

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
  on:click={handleClick}
>
  <slot />
</svelte:element>
