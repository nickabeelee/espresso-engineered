<script lang="ts">
  import { chipBase, chipSizes, chipVariants } from '$lib/ui/components/chip';
  import { toStyleString } from '$lib/ui/style';

  export let variant: 'neutral' | 'success' | 'warning' | 'error' | 'accent' = 'neutral';
  export let size: 'sm' | 'md' = 'md';

  $: sizeTokens = chipSizes[size];
  $: variantTokens = chipVariants[variant];
  $: style = toStyleString({
    '--chip-display': chipBase.display,
    '--chip-align': chipBase.alignItems,
    '--chip-radius': chipBase.borderRadius,
    '--chip-font-family': chipBase.fontFamily,
    '--chip-font-weight': chipBase.fontWeight,
    '--chip-font-size': chipBase.fontSize,
    '--chip-border-width': chipBase.borderWidth,
    '--chip-border-style': chipBase.borderStyle,
    '--chip-bg': variantTokens.background,
    '--chip-border-color': variantTokens.borderColor,
    '--chip-text-color': variantTokens.textColor,
    '--chip-padding': sizeTokens.padding
  });
</script>

<span class="chip chip--{variant} chip--{size}" style={style}>
  <slot />
</span>

<style>
  .chip {
    display: var(--chip-display);
    align-items: var(--chip-align);
    border-radius: var(--chip-radius);
    font-family: var(--chip-font-family);
    font-weight: var(--chip-font-weight);
    font-size: var(--chip-font-size);
    border: var(--chip-border-width) var(--chip-border-style) var(--chip-border-color);
    background: var(--chip-bg);
    color: var(--chip-text-color);
    padding: var(--chip-padding);
    white-space: nowrap;
  }
</style>
