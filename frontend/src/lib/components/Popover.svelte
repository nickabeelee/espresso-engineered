<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { popover } from "$lib/ui/components/popover";
  import { toStyleString } from "$lib/ui/style";

  export let open = false;
  export let align: "start" | "center" | "end" = "start";
  export let side: "bottom" | "top" = "bottom";
  export let closeOnOutside = true;
  export let closeOnEscape = true;
  export let offset: string | null = null;
  export let contentLabel = "Popover";

  const dispatch = createEventDispatcher<{ open: void; close: void }>();

  let popoverRoot: HTMLDivElement | null = null;

  const style = toStyleString({
    "--popover-bg": popover.panel.background,
    "--popover-border-color": popover.panel.borderColor,
    "--popover-border-width": popover.panel.borderWidth,
    "--popover-border-style": popover.panel.borderStyle,
    "--popover-radius": popover.panel.radius,
    "--popover-padding": popover.panel.padding,
    "--popover-shadow": popover.panel.shadow,
    "--popover-offset": offset ?? popover.offset,
    "--popover-width": popover.panel.width,
    "--popover-min-width": popover.panel.minWidth,
    "--popover-max-width": popover.panel.maxWidth,
  });

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

  function handleDocumentClick(event: MouseEvent) {
    if (!open || !closeOnOutside || !popoverRoot) return;
    const path = event.composedPath();
    if (!path.includes(popoverRoot)) {
      requestClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!open || !closeOnEscape) return;
    if (event.key === "Escape") {
      requestClose();
    }
  }

  onMount(() => {
    if (!browser) return;
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    if (!browser) return;
    document.removeEventListener("click", handleDocumentClick);
    document.removeEventListener("keydown", handleKeydown);
  });
</script>

<div
  class="popover-root"
  data-align={align}
  data-side={side}
  style={style}
  bind:this={popoverRoot}
>
  <slot name="trigger" {toggle} {open} />
  {#if open}
    <div class="popover-content" role="dialog" aria-label={contentLabel}>
      <slot name="content" {requestClose} />
    </div>
  {/if}
</div>

<style>
  .popover-root {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .popover-content {
    position: absolute;
    z-index: 1200;
    background: var(--popover-bg);
    border: var(--popover-border-width) var(--popover-border-style)
      var(--popover-border-color);
    border-radius: var(--popover-radius);
    padding: var(--popover-padding);
    box-shadow: var(--popover-shadow);
    width: var(--popover-width);
    min-width: var(--popover-min-width);
    max-width: var(--popover-max-width);
  }

  .popover-root[data-side="bottom"] .popover-content {
    top: calc(100% + var(--popover-offset));
  }

  .popover-root[data-side="top"] .popover-content {
    bottom: calc(100% + var(--popover-offset));
  }

  .popover-root[data-align="start"] .popover-content {
    left: 0;
  }

  .popover-root[data-align="center"] .popover-content {
    left: 50%;
    transform: translateX(-50%);
  }

  .popover-root[data-align="end"] .popover-content {
    right: 0;
  }
  @media (max-width: 768px) {
    .popover-content {
      width: min(92vw, var(--popover-width));
    }
  }
</style>
