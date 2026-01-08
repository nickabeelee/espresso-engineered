<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { Calendar as CalendarIcon } from "$lib/icons";
  import Calendar from "$lib/components/Calendar.svelte";
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

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  let inputElement: HTMLInputElement | null = null;
  let fieldElement: HTMLDivElement | null = null;
  let isCalendarOpen = false;
  let selectedDate: Date | null = null;
  let activeMonth = new Date();
  let displayValue = "";
  let lastCommittedValue = value;
  let listenersActive = false;
  let calendarId: string | undefined = undefined;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  $: calendarId = id ? `${id}-calendar` : undefined;
  $: minDate = min ? parseIsoDate(min) : null;
  $: maxDate = max ? parseIsoDate(max) : null;

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
    "--date-calendar-bg": dateInput.calendar.background,
    "--date-calendar-border": dateInput.calendar.borderColor,
    "--date-calendar-shadow": dateInput.calendar.shadow,
    "--date-calendar-radius": dateInput.calendar.radius,
    "--date-calendar-padding": dateInput.calendar.padding,
    "--date-calendar-header-gap": dateInput.calendar.headerGap,
    "--date-calendar-header-margin": dateInput.calendar.headerMargin,
    "--date-calendar-title-size": dateInput.calendar.titleSize,
    "--date-calendar-title-weight": dateInput.calendar.titleWeight,
    "--date-calendar-title-color": dateInput.calendar.titleColor,
    "--date-calendar-weekday-size": dateInput.calendar.weekdaySize,
    "--date-calendar-weekday-color": dateInput.calendar.weekdayColor,
    "--date-calendar-weekday-margin": dateInput.calendar.weekdayMargin,
    "--date-calendar-grid-gap": dateInput.calendar.gridGap,
    "--date-calendar-nav-size": dateInput.calendar.navSize,
    "--date-calendar-nav-padding": dateInput.calendar.navPadding,
    "--date-calendar-nav-radius": dateInput.calendar.navRadius,
    "--date-calendar-day-size": dateInput.calendar.daySize,
    "--date-calendar-day-radius": dateInput.calendar.dayRadius,
    "--date-calendar-day-size-font": dateInput.calendar.dayFontSize,
    "--date-calendar-day-color": dateInput.calendar.dayColor,
    "--date-calendar-day-outside": dateInput.calendar.dayOutsideColor,
    "--date-calendar-day-disabled": dateInput.calendar.dayDisabledColor,
    "--date-calendar-day-hover": dateInput.calendar.dayHoverBackground,
    "--date-calendar-day-selected-bg": dateInput.calendar.daySelectedBackground,
    "--date-calendar-day-selected-color": dateInput.calendar.daySelectedColor,
    "--date-calendar-day-today-border": dateInput.calendar.dayTodayBorder,
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

  function formatDisplayDate(date: Date) {
    return dateFormatter.format(date);
  }

  function formatIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseIsoDate(value: string) {
    if (!value) return null;
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return null;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  function parseInputDate(value: string) {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return parseIsoDate(value);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  function syncFromValue(nextValue: string) {
    lastCommittedValue = nextValue;
    if (!nextValue) {
      selectedDate = null;
      displayValue = "";
      return;
    }
    const parsed = parseIsoDate(nextValue) ?? parseInputDate(nextValue);
    if (!parsed) {
      selectedDate = null;
      displayValue = nextValue;
      return;
    }
    selectedDate = parsed;
    activeMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    displayValue = formatDisplayDate(parsed);
  }

  function setSelectedDate(date: Date, formatInput = true) {
    selectedDate = date;
    activeMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const iso = formatIsoDate(date);
    lastCommittedValue = iso;
    value = iso;
    dispatch("change", { value: iso });
    if (formatInput) {
      displayValue = formatDisplayDate(date);
    }
  }

  function openCalendar() {
    if (disabled) return;
    isCalendarOpen = true;
  }

  function closeCalendar() {
    isCalendarOpen = false;
  }

  function toggleCalendar() {
    if (disabled) return;
    isCalendarOpen = !isCalendarOpen;
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    displayValue = target.value;
    if (!displayValue) {
      lastCommittedValue = "";
      value = "";
      selectedDate = null;
      dispatch("change", { value: "" });
      return;
    }
    const parsed = parseInputDate(displayValue);
    if (parsed) {
      setSelectedDate(parsed, false);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openCalendar();
    }
    if (event.key === "Escape" && isCalendarOpen) {
      event.preventDefault();
      closeCalendar();
      inputElement?.focus();
    }
  }

  function handleCalendarSelect(event: CustomEvent<{ date: Date }>) {
    setSelectedDate(event.detail.date, true);
    closeCalendar();
    inputElement?.focus();
  }

  function handleCalendarMonthChange(event: CustomEvent<{ month: Date }>) {
    activeMonth = event.detail.month;
  }

  function handleActionClick() {
    dispatch("action");
  }

  function handleDocumentPointerDown(event: MouseEvent) {
    if (!fieldElement) return;
    if (!fieldElement.contains(event.target as Node)) {
      closeCalendar();
    }
  }

  function handleDocumentKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeCalendar();
      inputElement?.focus();
    }
  }

  function addListeners() {
    if (listenersActive) return;
    document.addEventListener("mousedown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);
    listenersActive = true;
  }

  function removeListeners() {
    if (!listenersActive) return;
    document.removeEventListener("mousedown", handleDocumentPointerDown);
    document.removeEventListener("keydown", handleDocumentKeyDown);
    listenersActive = false;
  }

  $: if (value !== lastCommittedValue) {
    syncFromValue(value);
  }

  $: if (isCalendarOpen) {
    addListeners();
  } else {
    removeListeners();
  }

  onDestroy(() => {
    removeListeners();
  });
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
    <div class="date-field" bind:this={fieldElement}>
      <input
        bind:this={inputElement}
        id={id}
        name={name}
        type="text"
        value={displayValue}
        {placeholder}
        {required}
        {disabled}
        on:input={handleInput}
        on:focus={openCalendar}
        on:click={openCalendar}
        on:keydown={handleInputKeyDown}
      />
      <button
        type="button"
        class="date-icon-button"
        on:click={toggleCalendar}
        aria-label={calendarButtonLabel}
        aria-expanded={isCalendarOpen}
        aria-controls={calendarId}
        disabled={disabled}
      >
        <CalendarIcon size={18} />
      </button>
      {#if isCalendarOpen}
        <div class="date-popover" role="dialog" id={calendarId}>
          <Calendar
            selected={selectedDate}
            month={activeMonth}
            min={minDate}
            max={maxDate}
            on:select={handleCalendarSelect}
            on:monthChange={handleCalendarMonthChange}
          />
        </div>
      {/if}
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

  .date-icon-button {
    position: absolute;
    top: 50%;
    right: 0.4rem;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: calc(var(--date-icon-size, 1.1rem) + 0.9rem);
    height: calc(var(--date-icon-size, 1.1rem) + 0.9rem);
    padding: 0;
    border-radius: var(--date-icon-radius, 6px);
    border: 1px solid var(--date-icon-border, transparent);
    background: var(--date-icon-bg, transparent);
    color: var(--date-icon-color, var(--text-ink-muted)) !important;
    cursor: pointer;
    transition: var(--date-icon-transition, none);
    z-index: 2;
  }

  .date-icon-button svg {
    stroke: currentColor;
    width: var(--date-icon-size, 1.1rem);
    height: var(--date-icon-size, 1.1rem);
  }

  .date-icon-button:hover:not(:disabled) {
    background: var(--date-icon-hover-bg, rgba(0, 0, 0, 0.05));
    color: var(--date-icon-hover, var(--text-ink-primary));
  }

  .date-icon-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .date-popover {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    z-index: 20;
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
