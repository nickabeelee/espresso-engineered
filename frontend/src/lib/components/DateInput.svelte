<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Calendar } from "$lib/icons";
  import { dateInput } from "$lib/ui/components/date-input";
  import { toStyleString } from "$lib/ui/style";

  export let value = "";
  export let id: string | undefined = undefined;
  export let name: string | undefined = undefined;
  export let label: string | null = null;
  export let helper: string | null = null;
  export let placeholder: string | undefined = undefined;
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let required = false;
  export let disabled = false;
  export let calendarButtonLabel = "Open calendar";
  export let actionLabel: string | null = null;

  const dispatch = createEventDispatcher<{
    change: { value: string };
    action: void;
  }>();

  let inputElement: HTMLInputElement | null = null;

  const style = toStyleString({
    "--date-input-gap": dateInput.container.gap,
    "--date-header-gap": dateInput.header.gap,
    "--date-label-font": dateInput.label.fontFamily,
    "--date-label-size": dateInput.label.fontSize,
    "--date-label-weight": dateInput.label.fontWeight,
    "--date-label-line": dateInput.label.lineHeight,
    "--date-label-color": dateInput.label.textColor,
    "--date-helper-font": dateInput.helper.fontFamily,
    "--date-helper-size": dateInput.helper.fontSize,
    "--date-helper-weight": dateInput.helper.fontWeight,
    "--date-helper-line": dateInput.helper.lineHeight,
    "--date-helper-color": dateInput.helper.textColor,
    "--date-field-gap": dateInput.field.gap,
    "--date-input-font": dateInput.input.fontFamily,
    "--date-input-size": dateInput.input.fontSize,
    "--date-input-line": dateInput.input.lineHeight,
    "--date-input-color": dateInput.input.textColor,
    "--date-input-bg": dateInput.input.background,
    "--date-input-border": dateInput.input.borderColor,
    "--date-input-border-width": dateInput.input.borderWidth,
    "--date-input-border-style": dateInput.input.borderStyle,
    "--date-input-radius": dateInput.input.borderRadius,
    "--date-input-padding": dateInput.input.padding,
    "--date-input-icon-padding": dateInput.input.iconPadding,
    "--date-input-transition": dateInput.input.transition,
    "--date-input-placeholder": dateInput.input.placeholderColor,
    "--date-input-focus": dateInput.input.focusRing,
    "--date-input-focus-border": dateInput.input.focusBorderColor,
    "--date-input-disabled-bg": dateInput.input.disabledBackground,
    "--date-input-disabled-color": dateInput.input.disabledTextColor,
    "--date-icon-color": dateInput.icon.color,
    "--date-icon-hover": dateInput.icon.hoverColor,
    "--date-icon-bg": dateInput.icon.background,
    "--date-icon-hover-bg": dateInput.icon.hoverBackground,
    "--date-icon-border": dateInput.icon.borderColor,
    "--date-icon-size": dateInput.icon.size,
    "--date-icon-radius": dateInput.icon.radius,
    "--date-icon-transition": dateInput.icon.transition,
    "--date-action-font": dateInput.action.fontFamily,
    "--date-action-size": dateInput.action.fontSize,
    "--date-action-weight": dateInput.action.fontWeight,
    "--date-action-line": dateInput.action.lineHeight,
    "--date-action-color": dateInput.action.textColor,
    "--date-action-bg": dateInput.action.background,
    "--date-action-border": dateInput.action.borderColor,
    "--date-action-border-width": dateInput.action.borderWidth,
    "--date-action-border-style": dateInput.action.borderStyle,
    "--date-action-radius": dateInput.action.borderRadius,
    "--date-action-padding": dateInput.action.padding,
    "--date-action-transition": dateInput.action.transition,
    "--date-action-hover-bg": dateInput.action.hoverBackground,
  });

  function handleOpenCalendar() {
    if (disabled) return;
    const picker = inputElement as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (picker?.showPicker) {
      picker.showPicker();
    }
    inputElement?.focus();
  }

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch("change", { value: target.value });
  }

  function handleActionClick() {
    dispatch("action");
  }
</script>

<div class="date-input" style={style}>
  {#if label || helper}
    <div class="date-header">
      {#if label}
        <label for={id}>{label}</label>
      {/if}
      {#if helper}
        <span class="date-helper">{helper}</span>
      {/if}
    </div>
  {/if}
  <div class="date-controls">
    <div class="date-field">
      <input
        bind:this={inputElement}
        id={id}
        name={name}
        type="date"
        bind:value
        {placeholder}
        {min}
        {max}
        {required}
        {disabled}
        on:change={handleChange}
      />
      <button
        type="button"
        class="date-icon-button"
        on:click={handleOpenCalendar}
        aria-label={calendarButtonLabel}
        disabled={disabled}
      >
        <Calendar size={16} />
      </button>
    </div>
    {#if actionLabel}
      <button
        type="button"
        class="date-action"
        on:click={handleActionClick}
        disabled={disabled}
      >
        {actionLabel}
      </button>
    {/if}
  </div>
</div>

<style>
  .date-input {
    display: flex;
    flex-direction: column;
    gap: var(--date-input-gap, 0.35rem);
  }

  .date-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--date-header-gap, 0.5rem);
  }

  .date-header label {
    font-family: var(--date-label-font, inherit);
    font-size: var(--date-label-size, 0.85rem);
    font-weight: var(--date-label-weight, 600);
    line-height: var(--date-label-line, 1.4);
    color: var(--date-label-color, var(--text-ink-secondary));
  }

  .date-helper {
    font-family: var(--date-helper-font, inherit);
    font-size: var(--date-helper-size, 0.75rem);
    font-weight: var(--date-helper-weight, 400);
    line-height: var(--date-helper-line, 1.4);
    color: var(--date-helper-color, var(--text-ink-muted));
  }

  .date-controls {
    display: flex;
    align-items: center;
    gap: var(--date-field-gap, 0.5rem);
  }

  .date-field {
    position: relative;
    flex: 1;
  }

  .date-field input {
    width: 100%;
    font-family: var(--date-input-font, inherit);
    font-size: var(--date-input-size, 1rem);
    line-height: var(--date-input-line, 1.5);
    color: var(--date-input-color, inherit);
    background: var(--date-input-bg, transparent);
    border: var(--date-input-border-width, 1px) var(--date-input-border-style, solid)
      var(--date-input-border, var(--border-subtle));
    border-radius: var(--date-input-radius, 6px);
    padding: var(--date-input-padding, 0.6rem 0.75rem);
    padding-right: var(--date-input-icon-padding, 2.5rem);
    transition: var(--date-input-transition, none);
  }

  .date-field input::placeholder {
    color: var(--date-input-placeholder, var(--text-ink-placeholder));
  }

  .date-field input:focus {
    outline: none;
    border-color: var(--date-input-focus-border, var(--accent-primary));
    box-shadow: var(--date-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.2));
  }

  .date-field input:disabled {
    background: var(--date-input-disabled-bg, var(--bg-surface-paper-secondary));
    color: var(--date-input-disabled-color, var(--text-ink-muted));
  }

  .date-field input::-webkit-calendar-picker-indicator {
    opacity: 0;
  }

  .date-icon-button {
    position: absolute;
    top: 50%;
    right: 0.4rem;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--date-icon-size, 1.1rem);
    height: var(--date-icon-size, 1.1rem);
    padding: 0.45rem;
    border-radius: var(--date-icon-radius, 6px);
    border: 1px solid var(--date-icon-border, transparent);
    background: var(--date-icon-bg, transparent);
    color: var(--date-icon-color, var(--text-ink-muted));
    cursor: pointer;
    transition: var(--date-icon-transition, none);
  }

  .date-icon-button:hover:not(:disabled) {
    background: var(--date-icon-hover-bg, rgba(0, 0, 0, 0.05));
    color: var(--date-icon-hover, var(--text-ink-primary));
  }

  .date-icon-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .date-action {
    border: var(--date-action-border-width, 1px) var(--date-action-border-style, solid)
      var(--date-action-border, var(--border-subtle));
    border-radius: var(--date-action-radius, 6px);
    padding: var(--date-action-padding, 0.45rem 0.75rem);
    background: var(--date-action-bg, transparent);
    color: var(--date-action-color, inherit);
    font-family: var(--date-action-font, inherit);
    font-size: var(--date-action-size, 0.85rem);
    font-weight: var(--date-action-weight, 600);
    line-height: var(--date-action-line, 1.4);
    cursor: pointer;
    transition: var(--date-action-transition, none);
    white-space: nowrap;
  }

  .date-action:hover:not(:disabled) {
    background: var(--date-action-hover-bg, rgba(0, 0, 0, 0.04));
  }

  .date-action:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .date-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .date-action {
      width: 100%;
    }
  }
</style>
