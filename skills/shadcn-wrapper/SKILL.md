---
name: shadcn-wrapper
description: Refactor an existing Svelte component to wrap a shadcn primitive, or create a new component using shadcn behavior while enforcing espresso-engineered UI tokens and styling (no Tailwind leakage to callers).
---

# Shadcn Wrapper Skill

## Core rules (always follow)
- Public API remains stable: no breaking prop changes, no export renames, no call-site changes.
- Shadcn stays internal: callers import from `frontend/src/lib/components/*`, not `frontend/src/lib/shadcn/*`.
- No Tailwind leakage: do not expose shadcn classes or variants to callers.
- Styling must come from `frontend/src/lib/ui/components/*` tokens and `docs/ee-ui-execution-standard.md`.

## Workflow
1) Audit the current component API
   - List props, events, slots, and supported CSS custom properties.
   - Note `href`/`type`/`disabled` behavior, `aria-*`, and any click guards.

2) Choose the wrapper boundary
   - Wrapper file stays in `frontend/src/lib/components/<Component>.svelte`.
   - Shadcn primitive lives in `frontend/src/lib/shadcn/<component>/`.

3) Map variants/sizes internally
   - Create private maps from existing props to shadcn variants/sizes.
   - Use semantic variants from `docs/ee-ui-execution-standard.md` (section 7.2) as the source of truth.

4) Neutralize shadcn styling where needed
   - If shadcn classes conflict with app tokens (sizes, font weight, hover), add an internal no-op variant/size (e.g. `ee-base`) in the shadcn component and map to it in the wrapper.
   - Do not expose these internal variants to callers.

5) Reapply UI tokens and CSS vars on the wrapper
   - Use `frontend/src/lib/ui/components/*` for tokens (e.g. `button.ts`).
   - Generate CSS variables with `toStyleString` from `frontend/src/lib/ui/style`.
   - Combine `style` from `$$restProps` with token styles in the wrapper.
   - Keep the visual system authoritative; shadcn behavior only.

6) Preserve interaction behavior
   - Forward events exactly as before (e.g. `on:click`).
   - If the shadcn primitive does not dispatch events, add forwarding in `frontend/src/lib/shadcn/*`.
   - For disabled state, prevent default + stop propagation when needed (match existing pattern in `GhostButton.svelte` and `IconButton.svelte`).

7) Fix Svelte style scoping
   - Wrapper styles that target classes on the shadcn element must be `:global(...)` so they apply to the inner DOM node.
   - Keep class names on the shadcn element stable (`class={`ghost-button ${restClass}`.trim()}`) so global styles still match.

8) Verify invariants
   - UI unchanged, API unchanged, tests unchanged.
   - Run `npm run dev:frontend` and relevant tests if requested.

## Implementation notes (Svelte patterns)
- Use `$$restProps` to pass through unknown props.
- Keep `class` and `style` merging stable:
  - Read `class` and `style` from `$$restProps`.
  - Combine with wrapper CSS vars.
- Use `createEventDispatcher` when the original component dispatched events.
- Maintain `href` / `type` behavior:
  - If current API supports `href`, keep anchor semantics.
  - Ensure `aria-disabled`, `tabindex`, and `disabled` match existing behavior.
- If shadcn uses slots to render its element, apply `:global` to wrapper CSS selectors.

## Minimal wrapper skeleton (adapt to the component)
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Component as ShadcnComponent } from '$lib/shadcn/component';
  import { tokens } from '$lib/ui/components/component';
  import { toStyleString } from '$lib/ui/style';

  export let variant = 'neutral';
  export let size = 'md';
  export let disabled = false;

  const variantMap = { /* map to shadcn */ } as const;
  const sizeMap = { /* map to shadcn */ } as const;

  let restClass = '';
  let restStyle = '';
  let restProps: Record<string, unknown> = {};
  $: ({ class: restClass = '', style: restStyle = '', ...restProps } = $$restProps);

  $: style = toStyleString({ /* css vars from tokens */ });
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

<ShadcnComponent
  {...restProps}
  variant={variantMap[variant]}
  size={sizeMap[size]}
  {disabled}
  class={`ee-component ${restClass}`.trim()}
  style={combinedStyle}
  on:click={handleClick}
>
  <slot />
</ShadcnComponent>
```

## When to read additional docs
- Use `docs/ee-ui-execution-standard.md` for sentiment/variant semantics and typography rules.
- Use `frontend/src/lib/ui/components/*` for tokens (colors, sizes, typography, motion).
