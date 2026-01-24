<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: number | null = null;
  export let min = 1;
  export let max = 10;
  export let step = 1;
  export let disabled = false;
  export let ariaLabel = 'Rating slider';

  const dispatch = createEventDispatcher<{ input: number; change: number }>();

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
</script>

<div class="rating-slider" class:unset={isUnset} style={`--slider-percentage: ${percentage}%; --slider-ticks: ${ticks.length};`}>
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
  />
</div>

<style>
  .rating-slider {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    min-height: 32px;
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
    grid-template-columns: repeat(var(--slider-ticks), 1fr);
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
    cursor: pointer;
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
