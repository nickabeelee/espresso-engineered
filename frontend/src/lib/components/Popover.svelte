<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { popover } from "$lib/ui/components/popover";
  import { toStyleString } from "$lib/ui/style";
  import * as PopoverPrimitive from "$lib/shadcn/popover";

  export let open = false;
  export let align: "start" | "center" | "end" = "start";
  export let side: "bottom" | "top" = "bottom";
  export let closeOnOutside = true;
  export let closeOnEscape = true;
  export let offset: string | null = null;
  export let contentLabel = "Popover";
  export let contentOverflow: "auto" | "visible" = "auto";

  const dispatch = createEventDispatcher<{ open: void; close: void }>();

  let defaultAnchor: HTMLDivElement | null = null;
  let manualAnchor: HTMLElement | null = null;
  let triggerAnchor: HTMLElement | null = null;
  $: triggerAnchor = manualAnchor ?? defaultAnchor;

  function registerTriggerAnchor(node: HTMLElement) {
    manualAnchor = node;
    return {
      destroy() {
        if (manualAnchor === node) {
          manualAnchor = null;
        }
      },
    };
  }

  $: popoverStyle = toStyleString({
    "--popover-bg": popover.panel.background,
    "--popover-radius": popover.panel.radius,
    "--popover-content-overflow": contentOverflow,
  });

  function cssValueToPx(value: string, baseFontSize: number) {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    if (trimmed.endsWith("rem")) {
      return parseFloat(trimmed) * baseFontSize;
    }
    if (trimmed.endsWith("em")) {
      return parseFloat(trimmed) * baseFontSize;
    }
    if (trimmed.endsWith("px")) {
      return parseFloat(trimmed);
    }
    return parseFloat(trimmed) || 0;
  }

  function getBaseFontSize() {
    if (!browser) return 16;
    return (
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    );
  }

  $: sideOffset = cssValueToPx(offset ?? popover.offset, getBaseFontSize());

  function requestOpen() {
    if (open) return;
    open = true;
    dispatch("open");
  }

  function requestClose() {
    if (!open) return;
    open = false;
    dispatch("close");
  }

  function toggle() {
    if (open) {
      requestClose();
    } else {
      requestOpen();
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    dispatch(nextOpen ? "open" : "close");
  }
</script>

<PopoverPrimitive.Root bind:open onOpenChange={handleOpenChange}>
  <div class="popover-root" bind:this={defaultAnchor}>
    <slot
      name="trigger"
      {toggle}
      {open}
      triggerAnchorAction={registerTriggerAnchor}
    />
  </div>
  <PopoverPrimitive.Content
    align={align}
    side={side}
    sideOffset={sideOffset}
    customAnchor={triggerAnchor}
    role="dialog"
    aria-label={contentLabel}
    interactOutsideBehavior={closeOnOutside ? "close" : "ignore"}
    escapeKeydownBehavior={closeOnEscape ? "close" : "ignore"}
    class="popover-content"
    style={popoverStyle}
    variant="ee-base"
  >
    <slot name="content" {requestClose} />
  </PopoverPrimitive.Content>
</PopoverPrimitive.Root>

<style>
  .popover-root {
    display: inline-flex;
    align-items: center;
  }

  :global(.popover-content) {
    z-index: 1200;
    background: var(--popover-bg);
    border-radius: var(--popover-radius);
    color: var(--text-ink-primary);
    overflow-y: var(--popover-content-overflow, auto);
  }

  @media (max-width: 768px) {
    :global(.popover-content) {
      width: min(92vw, var(--popover-width));
    }
  }
</style>
