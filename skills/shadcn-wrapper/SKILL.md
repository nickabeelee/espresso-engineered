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
- Default to the lightest wrapper possible; add mechanisms only when required for correctness.

## Workflow
0) Ensure shadcn primitive exists (from frontend/)
   - Run from `frontend/`: `npx shadcn-svelte@latest add <primitive>` if missing.
   - Use the shadcn MCP tool to confirm the primitive and command when needed.
1) Audit the current component API
   - List props, events, slots, and supported CSS custom properties.
   - Note `href`/`type`/`disabled` behavior, `aria-*`, and any click guards.

2) Choose the wrapper boundary
   - Wrapper file stays in `frontend/src/lib/components/<Component>.svelte`.
   - Shadcn primitive lives in `frontend/src/lib/shadcn/<component>/`.

3) Choose wrapper category (A/B/C below)
   - Start with Category A. Escalate only when required by existing API behavior.

4) Map variants/sizes internally (only if the API has variants/sizes)
   - Create private maps from existing props to shadcn variants/sizes.
   - Use semantic variants from `docs/ee-ui-execution-standard.md` (section 7.2) as the source of truth.

5) Neutralize shadcn styling where needed
   - If shadcn classes conflict with app tokens (sizes, font weight, hover), add an internal no-op variant/size (e.g. `ee-base`) in the shadcn component and map to it in the wrapper.
   - Do not expose these internal variants to callers.

6) Reapply UI tokens and CSS vars on the wrapper
   - Use `frontend/src/lib/ui/components/*` for tokens (e.g. `button.ts`).
   - Generate CSS variables with `toStyleString` from `frontend/src/lib/ui/style`.
   - Combine `style` from `$$restProps` with token styles in the wrapper (only if rest props are required).
   - Keep the visual system authoritative; shadcn behavior only.

7) Preserve interaction behavior
   - Forward events exactly as before (e.g. `on:click`).
   - If the shadcn primitive does not dispatch events, add forwarding in `frontend/src/lib/shadcn/*`.
   - For disabled state, prevent default + stop propagation when needed (match existing pattern in `GhostButton.svelte` and `IconButton.svelte`).

8) Fix Svelte style scoping
   - Wrapper styles that target classes on the shadcn element must be `:global(...)` so they apply to the inner DOM node.
   - Keep class names on the shadcn element stable (`class={`ghost-button ${restClass}`.trim()}`) so global styles still match.

9) Verify invariants
   - UI unchanged, API unchanged, tests unchanged.
   - Run `npm run dev:frontend` and relevant tests if requested.

## Wrapper categories (pick the lightest that preserves correctness)
### Category A — Pass-through wrapper (default)
**Purpose**
- Apply tokens.
- Preserve shadcn behavior.
- No API enrichment.

**Needs**
- Shadcn import.
- Token style.
- Slots.

**Does not need**
- Events.
- Variant maps.
- Rest props.
- Guards.

**Minimal example**
```svelte
<script lang="ts">
  import { Popover, PopoverContent } from '$lib/shadcn/popover';
  import { popover } from '$lib/ui/components/popover';
  import { toStyleString } from '$lib/ui/style';

  export let side: 'top' | 'bottom' = 'bottom';
  export let align: 'start' | 'center' | 'end' = 'center';

  $: style = toStyleString({
    '--popover-bg': popover.panel.background,
    '--popover-radius': popover.panel.radius,
  });
</script>

<Popover>
  <slot name="trigger" />
  <PopoverContent {side} {align} style={style}>
    <slot />
  </PopoverContent>
</Popover>
```

### Category B — Semantic wrapper (moderate complexity)
**Purpose**
- Narrow API.
- Encode domain meaning.
- Fixed options.

**Needs**
- Explicit props only.
- No rest props.
- No class merging.

**Minimal example**
```svelte
<script lang="ts">
  import { Badge } from '$lib/shadcn/badge';
  import { badge } from '$lib/ui/components/badge';
  import { toStyleString } from '$lib/ui/style';

  export let tone: 'success' | 'warning' | 'error';

  const toneMap = {
    success: badge.success,
    warning: badge.warning,
    error: badge.error,
  } as const;

  $: style = toStyleString({
    '--badge-bg': toneMap[tone].background,
    '--badge-fg': toneMap[tone].foreground,
  });
</script>

<Badge style={style}>
  <slot />
</Badge>
```

### Category C — Interactive system wrapper (rare)
**Purpose**
- Replace a legacy component.
- Preserve complex behavior.

**Needs**
- Dispatcher.
- Guards.
- Rest props.
- Careful mapping.

**Use only when required by existing behavior.**

## Required justification for extra mechanisms
If you introduce any of the following, include a brief comment explaining why it is necessary:
- `createEventDispatcher`
- `$$restProps`
- Unit conversion or token → CSS variable translation beyond direct mapping

## Implementation notes (Svelte patterns)
- Use `$$restProps` only when call sites pass arbitrary attributes.
- Keep `class` and `style` merging stable (only when using rest props):
  - Read `class` and `style` from `$$restProps`.
  - Combine with wrapper CSS vars.
- Use `createEventDispatcher` only when the original component dispatched events.
- Maintain `href` / `type` behavior:
  - If current API supports `href`, keep anchor semantics.
  - Ensure `aria-disabled`, `tabindex`, and `disabled` match existing behavior.
- If shadcn uses slots to render its element, apply `:global` to wrapper CSS selectors.

## When to read additional docs
- Use `docs/ee-ui-execution-standard.md` for sentiment/variant semantics and typography rules.
- Use `frontend/src/lib/ui/components/*` for tokens (colors, sizes, typography, motion).
