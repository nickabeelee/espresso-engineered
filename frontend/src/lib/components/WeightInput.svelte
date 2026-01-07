<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { weightInput } from "$lib/ui/components/weight-input";
  import { toStyleString } from "$lib/ui/style";

  type WeightUnit = "g" | "oz" | "lb";

  export let valueGrams: number | null = null;
  export let disabled = false;
  export let id: string | undefined = undefined;
  export let label = "Weight";
  export let helper: string | null = null;

  const dispatch = createEventDispatcher<{
    change: { grams: number | null };
  }>();

  const unitLabels: Record<WeightUnit, string> = {
    g: "g",
    oz: "oz",
    lb: "lb",
  };

  const unitToGrams: Record<WeightUnit, number> = {
    g: 1,
    oz: 28.349523125,
    lb: 453.59237,
  };

  const formatPrecision: Record<WeightUnit, number> = {
    g: 0,
    oz: 1,
    lb: 2,
  };

  const stepForUnit: Record<WeightUnit, string> = {
    g: "1",
    oz: "0.1",
    lb: "0.01",
  };

  let unit: WeightUnit = "g";
  let displayValue: string = "";
  let isEditing = false;

  const style = toStyleString({
    "--weight-input-gap": weightInput.container.gap,
    "--weight-label-font": weightInput.label.fontFamily,
    "--weight-label-size": weightInput.label.fontSize,
    "--weight-label-weight": weightInput.label.fontWeight,
    "--weight-label-color": weightInput.label.textColor,
    "--weight-helper-font": weightInput.helper.fontFamily,
    "--weight-helper-size": weightInput.helper.fontSize,
    "--weight-helper-color": weightInput.helper.textColor,
    "--weight-control-gap": weightInput.controls.gap,
    "--weight-input-font": weightInput.input.fontFamily,
    "--weight-input-size": weightInput.input.fontSize,
    "--weight-input-line": weightInput.input.lineHeight,
    "--weight-input-color": weightInput.input.textColor,
    "--weight-input-bg": weightInput.input.background,
    "--weight-input-border": weightInput.input.borderColor,
    "--weight-input-border-width": weightInput.input.borderWidth,
    "--weight-input-border-style": weightInput.input.borderStyle,
    "--weight-input-radius": weightInput.input.borderRadius,
    "--weight-input-padding": weightInput.input.padding,
    "--weight-input-focus": weightInput.input.focusRing,
    "--weight-input-focus-border": weightInput.input.focusBorderColor,
    "--weight-input-transition": weightInput.input.transition,
    "--weight-input-disabled-bg": weightInput.input.disabledBackground,
    "--weight-input-disabled-color": weightInput.input.disabledTextColor,
    "--weight-select-min": weightInput.select.minWidth,
    "--weight-preset-bg": weightInput.preset.background,
    "--weight-preset-color": weightInput.preset.textColor,
    "--weight-preset-border": weightInput.preset.borderColor,
    "--weight-preset-hover-bg": weightInput.preset.hoverBackground,
    "--weight-preset-hover-border": weightInput.preset.hoverBorderColor,
    "--weight-preset-size": weightInput.preset.fontSize,
    "--weight-preset-weight": weightInput.preset.fontWeight,
    "--weight-preset-padding": weightInput.preset.padding,
    "--weight-preset-radius": weightInput.preset.borderRadius,
    "--weight-preset-gap": weightInput.preset.gap,
  });

  function resolveUnit(value: number | null): WeightUnit {
    if (value === null || value === undefined) return unit;
    if (value >= 453.59237) return "lb";
    if (value >= 28.349523125) return "oz";
    return "g";
  }

  function toDisplay(value: number | null, nextUnit: WeightUnit): string {
    if (value === null || value === undefined) return "";
    const converted = value / unitToGrams[nextUnit];
    const precision = formatPrecision[nextUnit];
    return converted.toFixed(precision);
  }

  function toGrams(value: string, selectedUnit: WeightUnit): number | null {
    if (!value) return null;
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return null;
    if (parsed < 0) return null;
    return Number((parsed * unitToGrams[selectedUnit]).toFixed(2));
  }

  function updateDisplayFromGrams(nextValue: number | null) {
    const nextUnit = resolveUnit(nextValue);
    unit = nextUnit;
    displayValue = toDisplay(nextValue, nextUnit);
  }

  function handleUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const nextUnit = target.value as WeightUnit;
    unit = nextUnit;
    displayValue = toDisplay(valueGrams, nextUnit);
    dispatch("change", { grams: toGrams(displayValue, nextUnit) });
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    displayValue = target.value;
    const grams = toGrams(displayValue, unit);
    dispatch("change", { grams });
  }

  function setPreset(grams: number) {
    const nextUnit = unit;
    const converted = grams / unitToGrams[nextUnit];
    const precision = formatPrecision[nextUnit];
    displayValue = converted.toFixed(precision);
    dispatch("change", { grams });
  }

  function handleFocus() {
    isEditing = true;
  }

  function handleBlur() {
    isEditing = false;
    displayValue = toDisplay(valueGrams, unit);
  }

  $: if (!isEditing) {
    displayValue = toDisplay(valueGrams, unit);
  }

  $: if (!isEditing) {
    const resolvedUnit = resolveUnit(valueGrams);
    if (resolvedUnit !== unit) {
      unit = resolvedUnit;
    }
  }

  onMount(() => {
    updateDisplayFromGrams(valueGrams);
  });
</script>

<div class="weight-input" style={style}>
  <div class="weight-header">
    <label for={id}>{label}</label>
    {#if helper}
      <span class="weight-helper">{helper}</span>
    {/if}
  </div>
  <div class="weight-controls">
    <input
      id={id}
      type="number"
      inputmode="decimal"
      class="weight-field"
      value={displayValue}
      min="0"
      step={stepForUnit[unit]}
      on:input={handleInput}
      on:focus={handleFocus}
      on:blur={handleBlur}
      disabled={disabled}
    />
    <select
      class="weight-field weight-select"
      value={unit}
      on:change={handleUnitChange}
      disabled={disabled}
    >
      {#each Object.keys(unitLabels) as key}
        <option value={key}>{unitLabels[key as WeightUnit]}</option>
      {/each}
    </select>
  </div>
  <div class="weight-presets" aria-hidden="true">
    <button
      type="button"
      class="preset-btn"
      on:click={() => setPreset(250)}
      disabled={disabled}
    >
      250 g
    </button>
    <button
      type="button"
      class="preset-btn"
      on:click={() => setPreset(340)}
      disabled={disabled}
    >
      12 oz
    </button>
    <button
      type="button"
      class="preset-btn"
      on:click={() => setPreset(500)}
      disabled={disabled}
    >
      500 g
    </button>
  </div>
</div>

<style>
  .weight-input {
    display: flex;
    flex-direction: column;
    gap: var(--weight-input-gap, 0.5rem);
  }

  .weight-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .weight-header label {
    font-family: var(--weight-label-font, inherit);
    font-size: var(--weight-label-size, 0.875rem);
    font-weight: var(--weight-label-weight, 600);
    color: var(--weight-label-color, var(--text-ink-secondary));
  }

  .weight-helper {
    font-family: var(--weight-helper-font, inherit);
    font-size: var(--weight-helper-size, 0.75rem);
    color: var(--weight-helper-color, var(--text-ink-muted));
  }

  .weight-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--weight-control-gap, 0.5rem);
    align-items: center;
  }

  .weight-field {
    font-family: var(--weight-input-font, inherit);
    font-size: var(--weight-input-size, 1rem);
    line-height: var(--weight-input-line, 1.5);
    color: var(--weight-input-color, var(--text-ink-primary));
    background: var(--weight-input-bg, var(--bg-surface-paper));
    border: var(--weight-input-border-width, 1px)
      var(--weight-input-border-style, solid)
      var(--weight-input-border, var(--border-subtle));
    border-radius: var(--weight-input-radius, var(--radius-sm));
    padding: var(--weight-input-padding, 0.55rem 0.7rem);
    transition: var(--weight-input-transition);
  }

  .weight-field:focus {
    outline: none;
    border-color: var(--weight-input-focus-border, var(--accent-primary));
    box-shadow: var(--weight-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.2));
  }

  .weight-field:disabled {
    background: var(--weight-input-disabled-bg, var(--bg-surface-paper-secondary));
    color: var(--weight-input-disabled-color, var(--text-ink-muted));
    cursor: not-allowed;
  }

  .weight-select {
    min-width: var(--weight-select-min, 5rem);
    text-transform: uppercase;
  }

  .weight-presets {
    display: flex;
    gap: var(--weight-preset-gap, 0.25rem);
    flex-wrap: wrap;
  }

  .preset-btn {
    background: var(--weight-preset-bg, rgba(123, 94, 58, 0.12));
    color: var(--weight-preset-color, var(--text-ink-secondary));
    border: 1px solid var(--weight-preset-border, var(--border-subtle));
    padding: var(--weight-preset-padding, 0.25rem 0.5rem);
    border-radius: var(--weight-preset-radius, var(--radius-sm));
    cursor: pointer;
    font-size: var(--weight-preset-size, 0.75rem);
    font-weight: var(--weight-preset-weight, 500);
  }

  .preset-btn:hover:not(:disabled) {
    background: var(--weight-preset-hover-bg, rgba(123, 94, 58, 0.2));
    border-color: var(--weight-preset-hover-border, var(--border-strong));
  }

  .preset-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    .weight-controls {
      grid-template-columns: 1fr;
    }

    .weight-select {
      width: 100%;
    }
  }
</style>
