<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher, tick } from "svelte";
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
  export let contentOverflow: "auto" | "visible" = "auto";

  const dispatch = createEventDispatcher<{ open: void; close: void }>();

  let popoverRoot: HTMLDivElement | null = null;
  let popoverContent: HTMLDivElement | null = null;
  let placementSide: "bottom" | "top" = side;
  let placementAlign: "start" | "center" | "end" = align;
  let contentStyle = "";
  let cleanupPositioning: (() => void) | null = null;

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

  async function updatePosition() {
    if (!browser || !open || !popoverRoot || !popoverContent) return;
    await tick();
    const rootRect = popoverRoot.getBoundingClientRect();
    const contentRect = popoverContent.getBoundingClientRect();
    const viewportPadding = 12;
    const rootFontSize =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const offsetValue = getComputedStyle(popoverRoot)
      .getPropertyValue("--popover-offset")
      .trim();
    const offsetPx = cssValueToPx(offsetValue, rootFontSize);
    let top =
      side === "top"
        ? -contentRect.height - offsetPx
        : rootRect.height + offsetPx;

    let left = 0;
    if (align === "center") {
      left = rootRect.width / 2 - contentRect.width / 2;
    } else if (align === "end") {
      left = rootRect.width - contentRect.width;
    }
    const desiredViewportLeft = rootRect.left + left;
    const minLeft = viewportPadding;
    const maxLeft = window.innerWidth - contentRect.width - viewportPadding;
    const clampedViewportLeft = Math.min(
      Math.max(desiredViewportLeft, minLeft),
      Math.max(minLeft, maxLeft)
    );
    left += clampedViewportLeft - desiredViewportLeft;

    placementSide = side;
    placementAlign = align;
    const anchorViewportTop =
      side === "top"
        ? rootRect.top - offsetPx - contentRect.height
        : rootRect.bottom + offsetPx;
    const maxHeight =
      side === "top"
        ? Math.max(0, rootRect.top - offsetPx - viewportPadding)
        : Math.max(0, window.innerHeight - viewportPadding - anchorViewportTop);
    contentStyle = toStyleString({
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      maxHeight: `${Math.max(maxHeight, 0)}px`,
    });
  }

  function startPositioning() {
    if (!browser) return null;
    const handle = () => {
      updatePosition();
    };
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    let observer: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      observer = new ResizeObserver(() => updatePosition());
      if (popoverRoot) observer.observe(popoverRoot);
      if (popoverContent) observer.observe(popoverContent);
    }
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
      observer?.disconnect();
    };
  }

  function requestOpen() {
    if (open) return;
    open = true;
    dispatch("open");
    updatePosition();
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
    cleanupPositioning?.();
  });

  $: if (browser) {
    if (open) {
      placementSide = side;
      placementAlign = align;
      if (!cleanupPositioning) {
        cleanupPositioning = startPositioning();
      }
      updatePosition();
    } else if (cleanupPositioning) {
      cleanupPositioning();
      cleanupPositioning = null;
      contentStyle = "";
      placementSide = side;
      placementAlign = align;
    }
  }
</script>

<div
  class="popover-root"
  data-align={placementAlign}
  data-side={placementSide}
  style={style}
  bind:this={popoverRoot}
>
  <slot name="trigger" {toggle} {open} />
  {#if open}
    <div
      class="popover-content"
      style={contentStyle}
      role="dialog"
      aria-label={contentLabel}
      bind:this={popoverContent}
    >
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
    overflow-y: var(--popover-content-overflow, auto);
    overflow-x: visible;
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
