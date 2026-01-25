<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { gsap } from '$lib/ui/animations';

  export let value: number | null = null;
  export let min = 1;
  export let max = 10;
  export let step = 1;
  export let disabled = false;
  export let ariaLabel = 'Rating slider';

  const dispatch = createEventDispatcher<{ input: number; change: number }>();
  let rangeInput: HTMLInputElement | null = null;
  let sliderRoot: HTMLDivElement | null = null;
  let animatePercent: ((value: number) => void) | null = null;
  let animatePercentText: ((value: number) => void) | null = null;

  $: safeMin = Math.min(min, max);
  $: safeMax = Math.max(min, max);
  $: range = safeMax - safeMin;
  $: normalizedStep = step > 0 ? step : 1;
  $: neutralValue = Math.floor((safeMin + safeMax) / 2);
  $: isUnset = value === null || value === undefined || Number.isNaN(value);
  $: clampedValue = Math.min(Math.max(isUnset ? neutralValue : value, safeMin), safeMax);
  $: snappedValue = snapToStep(clampedValue);
  $: percentage = range === 0 ? 0 : ((snappedValue - safeMin) / range) * 100;
  $: tickCount = Math.floor(range / normalizedStep) + 1;
  $: ticks = Array.from({ length: tickCount }, (_, index) => {
    const tickValue = Math.min(safeMin + index * normalizedStep, safeMax);
    return { value: tickValue };
  });

  $: if (sliderRoot && !animatePercent) {
    animatePercent = gsap.quickTo(sliderRoot, '--slider-percent', {
      duration: 0.18,
      ease: 'power2.out'
    });
    animatePercentText = gsap.quickTo(sliderRoot, '--slider-percentage', {
      duration: 0.18,
      ease: 'power2.out',
      unit: '%'
    });
  }

  $: if (animatePercent && animatePercentText) {
    animatePercent(percentage);
    animatePercentText(percentage);
  }

  onDestroy(() => {
    if (!sliderRoot) return;
    gsap.killTweensOf(sliderRoot);
  });

  function snapToStep(rawValue: number): number {
    const clamped = Math.min(Math.max(rawValue, safeMin), safeMax);
    const stepped = Math.round((clamped - safeMin) / normalizedStep) * normalizedStep + safeMin;
    return Math.min(Math.max(stepped, safeMin), safeMax);
  }

  function handleInput(event: Event) {
    const nextValue = Number((event.currentTarget as HTMLInputElement).value);
    value = nextValue;
    dispatch('input', nextValue);
  }

  function handleChange(event: Event) {
    const nextValue = Number((event.currentTarget as HTMLInputElement).value);
    value = nextValue;
    dispatch('change', nextValue);
  }

  function updateFromPointer(clientX: number) {
    if (!rangeInput) return;
    const rect = rangeInput.getBoundingClientRect();
    if (!rect.width) return;
    const offset = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const percent = offset / rect.width;
    const nextValue = snapToStep(safeMin + percent * range);
    rangeInput.value = String(nextValue);
    value = nextValue;
    dispatch('input', nextValue);
  }

  function handlePointerDown(event: PointerEvent) {
    if (disabled || !rangeInput) return;
    if (event.pointerType === 'mouse') return;
    rangeInput.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX);
    rangeInput.focus();
  }

  function handlePointerMove(event: PointerEvent) {
    if (disabled || !rangeInput) return;
    if (!rangeInput.hasPointerCapture(event.pointerId)) return;
    updateFromPointer(event.clientX);
  }

  function handlePointerUp(event: PointerEvent) {
    if (!rangeInput) return;
    if (!rangeInput.hasPointerCapture(event.pointerId)) return;
    rangeInput.releasePointerCapture(event.pointerId);
  }
</script>

<div
  class="rating-slider"
  class:unset={isUnset}
  style={`--slider-percent: ${percentage}; --slider-percentage: ${percentage}%; --slider-ticks: ${ticks.length};`}
  data-disabled={disabled ? 'true' : undefined}
  bind:this={sliderRoot}
>
  <div class="slider-label" class:unset={isUnset}>
    <slot name="label" />
  </div>
  <div
    class="slider-shell"
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={handlePointerUp}
  >
    <div class="slider-rail" aria-hidden="true">
      <div class="slider-track"></div>
      <div class="slider-dots">
        {#each ticks as tick}
          <span class="slider-dot" class:active={!isUnset && tick.value <= snappedValue}></span>
        {/each}
      </div>
    </div>
    <input
      type="range"
      min={safeMin}
      max={safeMax}
      step={normalizedStep}
      value={snappedValue}
      aria-label={ariaLabel}
      aria-valuetext={isUnset ? 'Not rated yet' : String(snappedValue)}
      disabled={disabled}
      on:input={handleInput}
      on:change={handleChange}
      bind:this={rangeInput}
    />
  </div>
</div>

<style>
  .rating-slider {
    position: relative;
    width: 100%;
    padding: 0 1rem;
    --track-height: 6px;
    --thumb-size: 22px;
    --edge-padding: calc(var(--thumb-size) / 2);
    --tick-padding: var(--edge-padding);
    --label-offset: 1.85rem;
    display: block;
    padding-top: var(--label-offset);
    min-height: calc(var(--thumb-size) + var(--label-offset));
    gap: 0.35rem;
  }

  @media (max-width: 640px) {
    .rating-slider {
      --track-height: 8px;
      --thumb-size: 26px;
    }
  }

  .slider-label {
    position: absolute;
    left: calc(var(--edge-padding) + (100% - (2 * var(--edge-padding))) * (var(--slider-percent) / 100));
    top: 0;
    transform: translate(-50%, -20%);
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-ink-primary);
    white-space: nowrap;
    pointer-events: none;
    background: var(--bg-surface-paper);
    border: 1px solid rgba(123, 94, 58, 0.25);
    border-radius: 999px;
    padding: 0.25rem 0.55rem;
    box-shadow: 0 6px 12px rgba(24, 17, 9, 0.12);
    transition: color 160ms ease, border-color 160ms ease, background 160ms ease;
  }


  .slider-label.unset {
    color: var(--text-ink-muted);
    font-weight: 500;
  }

  .slider-shell {
    position: relative;
    height: var(--thumb-size);
  }

  .slider-rail {
    position: absolute;
    inset: 0;
    height: var(--thumb-size);
    display: flex;
    align-items: center;
    padding: 0 var(--tick-padding);
  }

  .slider-track {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: var(--track-height);
    border-radius: 999px;
    background: linear-gradient(
      to right,
      var(--accent-primary) 0%,
      var(--accent-primary) var(--slider-percentage),
      rgba(123, 94, 58, 0.2) var(--slider-percentage),
      rgba(123, 94, 58, 0.2) 100%
    );
    transition: background 160ms ease;
  }

  .rating-slider.unset .slider-track {
    background: rgba(123, 94, 58, 0.2);
  }

  .slider-dots {
    position: absolute;
    left: var(--tick-padding);
    right: var(--tick-padding);
    top: 50%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    overflow: visible;
  }

  .slider-dot {
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(123, 94, 58, 0.35);
    transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
  }

  .slider-dot.active {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    transform: translateY(-50%) scale(1.05);
  }

  input[type='range'] {
    position: relative;
    width: 100%;
    background: transparent;
    appearance: none;
    border: 0;
    box-shadow: none;
    height: var(--thumb-size);
    margin: 0;
    padding: 0;
    cursor: pointer;
    touch-action: pan-y;
    z-index: 2;
  }

  input[type='range']:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  input[type='range']::-webkit-slider-runnable-track {
    height: var(--track-height);
    background: transparent;
    border: 0;
    box-shadow: none;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--thumb-size);
    height: var(--thumb-size);
    border-radius: 50%;
    background: var(--bg-surface-paper);
    border: 2px solid var(--accent-primary);
    box-shadow: 0 4px 8px rgba(24, 17, 9, 0.18);
    margin-top: calc((var(--track-height) - var(--thumb-size)) / 2);
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  }

  .rating-slider.unset input[type='range']::-webkit-slider-thumb {
    border-color: rgba(123, 94, 58, 0.45);
    box-shadow: 0 2px 6px rgba(24, 17, 9, 0.12);
  }

  input[type='range']::-moz-range-track {
    height: var(--track-height);
    background: transparent;
    border: 0;
    box-shadow: none;
  }

  input[type='range']::-moz-range-thumb {
    width: var(--thumb-size);
    height: var(--thumb-size);
    border-radius: 50%;
    background: var(--bg-surface-paper);
    border: 2px solid var(--accent-primary);
    box-shadow: 0 4px 8px rgba(24, 17, 9, 0.18);
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  }

  .rating-slider.unset input[type='range']::-moz-range-thumb {
    border-color: rgba(123, 94, 58, 0.45);
    box-shadow: 0 2px 6px rgba(24, 17, 9, 0.12);
  }

  input[type='range']:focus-visible {
    outline: none;
  }

  input[type='range']:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(176, 138, 90, 0.3);
    transform: scale(1.05);
  }

  input[type='range']:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(176, 138, 90, 0.3);
    transform: scale(1.05);
  }

  input[type='range']:active::-webkit-slider-thumb {
    transform: scale(1.02);
  }

  input[type='range']:active::-moz-range-thumb {
    transform: scale(1.02);
  }

  .rating-slider[data-disabled='true'] {
    opacity: 0.7;
  }

  .slider-shell input[type='range'] {
    position: absolute;
    inset: 0;
  }

</style>
