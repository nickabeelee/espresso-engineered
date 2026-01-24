<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: number | null = null;
  export let min = 1;
  export let max = 10;
  export let step = 1;
  export let disabled = false;
  export let ariaLabel = 'Rating slider';

  const dispatch = createEventDispatcher<{ input: number; change: number }>();
  let rangeInput: HTMLInputElement | null = null;

  $: neutralValue = Math.floor((min + max) / 2);
  $: isUnset = value === null || value === undefined || Number.isNaN(value);
  $: clampedValue = Math.min(Math.max(isUnset ? neutralValue : value, min), max);
  $: percentage = isUnset ? 0 : ((clampedValue - min) / (max - min)) * 100;
  $: ticks = Array.from({ length: max - min + 1 }, (_, index) => min + index);

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

  function snapToStep(rawValue: number): number {
    if (step <= 0) return rawValue;
    const clamped = Math.min(Math.max(rawValue, min), max);
    const stepped = Math.round((clamped - min) / step) * step + min;
    return Math.min(Math.max(stepped, min), max);
  }

  function handlePointerDown(event: PointerEvent) {
    if (disabled || event.pointerType === 'mouse') return;
    if (!rangeInput) return;
    rangeInput.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  }

  function handlePointerMove(event: PointerEvent) {
    if (disabled || event.pointerType === 'mouse') return;
    if (!rangeInput || !rangeInput.hasPointerCapture(event.pointerId)) return;
    updateFromPointer(event);
  }

  function handlePointerUp(event: PointerEvent) {
    if (disabled || event.pointerType === 'mouse') return;
    if (!rangeInput || !rangeInput.hasPointerCapture(event.pointerId)) return;
    rangeInput.releasePointerCapture(event.pointerId);
  }

  function updateFromPointer(event: PointerEvent) {
    if (!rangeInput) return;
    const rect = rangeInput.getBoundingClientRect();
    if (!rect.width) return;
    const offset = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const percent = offset / rect.width;
    const nextValue = snapToStep(min + percent * (max - min));
    rangeInput.value = String(nextValue);
    value = nextValue;
    dispatch('input', nextValue);
  }
</script>

<div class="rating-slider" class:unset={isUnset} style={`--slider-percentage: ${percentage}%; --slider-ticks: ${ticks.length};`}>
  <div class="slider-label" class:unset={isUnset}>
    <slot name="label" />
  </div>
  <div class="slider-track" aria-hidden="true">
    <div class="slider-dots">
      {#each ticks as tick}
        <span class="slider-dot" class:active={!isUnset && tick <= clampedValue}></span>
      {/each}
    </div>
  </div>
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={clampedValue}
    aria-label={ariaLabel}
    disabled={disabled}
    on:input={handleInput}
    on:change={handleChange}
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={handlePointerUp}
    bind:this={rangeInput}
  />
</div>

<style>
  .rating-slider {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    min-height: 32px;
    padding: 0 var(--slider-edge-padding, 10px);
  }

  .slider-label {
    position: absolute;
    left: var(--slider-percentage);
    top: 50%;
    transform: translate(-50%, calc(-100% - 0.65rem));
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-ink-primary);
    white-space: nowrap;
    pointer-events: none;
  }

  .slider-label.unset {
    color: var(--text-ink-muted);
    font-weight: 500;
  }

  .slider-track {
    position: absolute;
    inset: 50% 0 auto 0;
    transform: translateY(-50%);
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(
      to right,
      var(--accent-primary) 0%,
      var(--accent-primary) var(--slider-percentage),
      rgba(123, 94, 58, 0.2) var(--slider-percentage),
      rgba(123, 94, 58, 0.2) 100%
    );
  }

  .rating-slider.unset .slider-track {
    background: rgba(123, 94, 58, 0.2);
  }

  .slider-dots {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(var(--slider-ticks), minmax(0, 1fr));
    gap: 0;
    align-items: center;
    pointer-events: none;
  }

  .slider-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(123, 94, 58, 0.35);
    justify-self: center;
  }

  .slider-dot:first-child {
    justify-self: start;
  }

  .slider-dot:last-child {
    justify-self: end;
  }

  .slider-dot.active {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  input[type='range'] {
    position: relative;
    width: 100%;
    background: transparent;
    appearance: none;
    height: 28px;
    margin: 0;
    padding: 0;
    cursor: pointer;
    touch-action: pan-y;
  }

  input[type='range']:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  input[type='range']::-webkit-slider-runnable-track {
    height: 6px;
    background: transparent;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--bg-surface-paper);
    border: 2px solid var(--accent-primary);
    box-shadow: 0 4px 8px rgba(24, 17, 9, 0.18);
    margin-top: -7px;
  }

  .rating-slider.unset input[type='range']::-webkit-slider-thumb {
    border-color: rgba(123, 94, 58, 0.45);
    box-shadow: 0 2px 6px rgba(24, 17, 9, 0.12);
  }

  input[type='range']::-moz-range-track {
    height: 6px;
    background: transparent;
  }

  input[type='range']::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--bg-surface-paper);
    border: 2px solid var(--accent-primary);
    box-shadow: 0 4px 8px rgba(24, 17, 9, 0.18);
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
  }

  input[type='range']:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(176, 138, 90, 0.3);
  }

</style>
