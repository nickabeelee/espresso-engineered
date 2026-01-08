<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import IconButton from "$lib/components/IconButton.svelte";
  import { ChevronLeft, ChevronRight } from "$lib/icons";

  export let selected: Date | null = null;
  export let month: Date = new Date();
  export let min: Date | null = null;
  export let max: Date | null = null;

  const dispatch = createEventDispatcher<{
    select: { date: Date };
    monthChange: { month: Date };
  }>();

  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  });

  const weekdayBase = new Date(2024, 0, 7);
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekdayBase);
    date.setDate(weekdayBase.getDate() + index);
    return weekdayFormatter.format(date);
  });

  function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function startOfCalendar(date: Date) {
    const start = startOfMonth(date);
    const weekday = start.getDay();
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() - weekday);
  }

  function getCalendarDays(date: Date) {
    const start = startOfCalendar(date);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }

  function isSameDay(left: Date, right: Date) {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  function isSameMonth(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
  }

  function isDisabled(date: Date) {
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  }

  function formatDateLabel(date: Date) {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function setMonth(nextMonth: Date) {
    const normalized = startOfMonth(nextMonth);
    month = normalized;
    dispatch("monthChange", { month: normalized });
  }

  function handlePreviousMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  function handleSelect(day: Date) {
    if (isDisabled(day)) return;
    dispatch("select", { date: day });
  }

  $: calendarDays = getCalendarDays(month);
  $: monthLabel = monthFormatter.format(month);
</script>

<div class="calendar">
  <div class="calendar-header">
    <IconButton
      variant="neutral"
      ariaLabel="Previous month"
      title="Previous month"
      class="calendar-nav"
      on:click={handlePreviousMonth}
    >
      <ChevronLeft />
    </IconButton>
    <div class="calendar-title">{monthLabel}</div>
    <IconButton
      variant="neutral"
      ariaLabel="Next month"
      title="Next month"
      class="calendar-nav"
      on:click={handleNextMonth}
    >
      <ChevronRight />
    </IconButton>
  </div>

  <div class="calendar-weekdays" role="row">
    {#each weekdays as day}
      <div class="calendar-weekday" role="columnheader">{day}</div>
    {/each}
  </div>

  <div class="calendar-grid" role="grid">
    {#each calendarDays as day (day.toDateString())}
      <button
        type="button"
        class="calendar-day"
        class:calendar-day--outside={!isSameMonth(day, month)}
        class:calendar-day--selected={selected && isSameDay(day, selected)}
        class:calendar-day--today={isSameDay(day, new Date())}
        disabled={isDisabled(day)}
        aria-label={formatDateLabel(day)}
        aria-pressed={selected && isSameDay(day, selected) ? "true" : "false"}
        on:click={() => handleSelect(day)}
      >
        {day.getDate()}
      </button>
    {/each}
  </div>
</div>

<style>
  .calendar {
    background: var(--date-calendar-bg, var(--bg-surface-paper));
    border: 1px solid var(--date-calendar-border, var(--border-subtle));
    border-radius: var(--date-calendar-radius, 10px);
    box-shadow: var(--date-calendar-shadow, var(--shadow-soft));
    padding: var(--date-calendar-padding, 0.85rem);
    width: max-content;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--date-calendar-header-gap, 0.4rem);
    margin-bottom: var(--date-calendar-header-margin, 0.5rem);
  }

  .calendar-nav {
    --icon-button-min-width: var(--date-calendar-nav-size, 32px) !important;
    --icon-button-min-height: var(--date-calendar-nav-size, 32px) !important;
    --icon-button-padding: var(--date-calendar-nav-padding, 0.2rem) !important;
    --icon-button-border-radius: var(--date-calendar-nav-radius, 8px) !important;
  }

  .calendar-title {
    font-size: var(--date-calendar-title-size, 0.9rem);
    font-weight: var(--date-calendar-title-weight, 600);
    color: var(--date-calendar-title-color, var(--text-ink-primary));
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(2rem, 1fr));
    gap: var(--date-calendar-grid-gap, 0.25rem);
    margin-bottom: var(--date-calendar-weekday-margin, 0.35rem);
  }

  .calendar-weekday {
    text-align: center;
    font-size: var(--date-calendar-weekday-size, 0.7rem);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--date-calendar-weekday-color, var(--text-ink-muted));
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(2rem, 1fr));
    gap: var(--date-calendar-grid-gap, 0.25rem);
  }

  .calendar-day {
    width: var(--date-calendar-day-size, 2.2rem);
    height: var(--date-calendar-day-size, 2.2rem);
    border-radius: var(--date-calendar-day-radius, 8px);
    border: 1px solid transparent;
    background: transparent;
    color: var(--date-calendar-day-color, var(--text-ink-primary));
    font-size: var(--date-calendar-day-size-font, 0.85rem);
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
  }

  .calendar-day:hover:not(:disabled) {
    background: var(--date-calendar-day-hover, var(--bg-surface-paper-secondary));
  }

  .calendar-day:disabled {
    color: var(--date-calendar-day-disabled, var(--text-ink-placeholder));
    cursor: not-allowed;
    opacity: 0.65;
  }

  .calendar-day--outside {
    color: var(--date-calendar-day-outside, var(--text-ink-placeholder));
  }

  .calendar-day--today:not(.calendar-day--selected) {
    border-color: var(--date-calendar-day-today-border, var(--accent-primary-dark));
  }

  .calendar-day--selected {
    background: var(--date-calendar-day-selected-bg, var(--accent-primary));
    color: var(--date-calendar-day-selected-color, var(--text-ink-inverted));
  }
</style>
