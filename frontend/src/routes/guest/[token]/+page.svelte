<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Chip from '$lib/components/Chip.svelte';
  import { editableField, formHelperText, formLabel, formSection } from '$lib/ui/components/form';
  import { recordCard } from '$lib/ui/components/card';
  import { colorCss } from '$lib/ui/foundations/color';
  import { spacing } from '$lib/ui/foundations/spacing';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import type { GuestReflectionContext, GuestReflectionUpdateRequest } from '@shared/types';

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

  export let data: {
    guest?: GuestReflectionContext;
    guestError?: string;
  };

  let guest = data.guest;
  let guestError = data.guestError ?? null;
  let rating: number | undefined = guest?.brew.rating ?? undefined;
  let tastingNotes = guest?.brew.tasting_notes ?? '';
  let reflections = guest?.brew.reflections ?? '';
  let guestName = guest?.brew.guest_display_name ?? '';
  let autosaveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  let saveError: string | null = null;
  let submitLoading = false;
  let autosaveTimeout: number | null = null;
  let nowTimestamp = Date.now();
  let state: GuestReflectionContext['state'] | null = guest?.state ?? null;
  let editExpiresAt: string | null = guest?.edit_expires_at ?? null;
  let canEdit = false;
  let statusLabel: string | null = null;
  let statusVariant: 'neutral' | 'warning' | 'success' = 'neutral';
  let countdown: string | null = null;

  const style = toStyleString({
    '--page-gap': spacing['2xl'],
    '--page-max-width': '720px',
    '--page-title-size': textStyles.headingSecondary.fontSize,
    '--page-title-family': textStyles.headingSecondary.fontFamily,
    '--page-title-weight': textStyles.headingSecondary.fontWeight,
    '--page-title-color': colorCss.text.ink.primary,
    '--page-subtitle-size': textStyles.helper.fontSize,
    '--page-subtitle-family': textStyles.helper.fontFamily,
    '--page-subtitle-color': colorCss.text.ink.muted,
    '--form-section-title-color': formSection.title.textColor,
    '--form-section-title-size': formSection.title.fontSize,
    '--form-section-title-weight': formSection.title.fontWeight,
    '--form-section-title-border': formSection.title.borderColor,
    '--form-section-title-border-width': formSection.title.borderWidth,
    '--form-label-color': formLabel.textColor,
    '--form-label-size': formLabel.fontSize,
    '--form-label-weight': formLabel.fontWeight,
    '--form-input-padding': editableField.input.padding,
    '--form-input-font-size': editableField.input.fontSize,
    '--form-input-border': editableField.input.borderColor,
    '--form-input-border-width': editableField.input.borderWidth,
    '--form-input-radius': editableField.input.borderRadius,
    '--form-input-focus': editableField.input.focusRing,
    '--form-input-bg': editableField.input.background,
    '--form-helper-color': formHelperText.textColor,
    '--form-helper-size': formHelperText.fontSize,
    '--voice-font-family': textStyles.voice.fontFamily,
    '--voice-font-size': textStyles.voice.fontSize,
    '--voice-line-height': textStyles.voice.lineHeight,
    '--voice-letter-spacing': textStyles.voice.letterSpacing,
    '--voice-font-style': textStyles.voice.fontStyle,
    '--voice-color': colorCss.text.ink.muted,
    '--card-bg': recordCard.container.background,
    '--card-border': recordCard.container.borderColor,
    '--card-border-width': recordCard.container.borderWidth,
    '--card-border-style': recordCard.container.borderStyle,
    '--card-radius': recordCard.container.borderRadius,
    '--card-padding-y': recordCard.container.padding,
    '--card-padding-x': recordCard.container.padding
  });

  onMount(() => {
    const timer = window.setInterval(() => {
      nowTimestamp = Date.now();
    }, 1000);

    return () => {
      if (autosaveTimeout) {
        window.clearTimeout(autosaveTimeout);
      }
      window.clearInterval(timer);
    };
  });

  $: if (data.guest) {
    guest = data.guest;
  }

  $: state = guest?.state ?? null;
  $: editExpiresAt = guest?.edit_expires_at ?? null;
  $: canEdit = state === 'draft' || state === 'editing';
  $: statusLabel = state === 'draft'
    ? 'Guest draft'
    : state === 'editing'
      ? 'Guest editing'
      : state === 'locked'
        ? 'Finalized'
        : null;
  $: statusVariant = state === 'editing'
    ? 'warning'
    : state === 'locked'
      ? 'success'
      : 'neutral';
  $: countdown = state === 'editing' && editExpiresAt
    ? formatCountdown(editExpiresAt)
    : null;

  function formatCountdown(expiresAt: string): string {
    const diffMs = Math.max(0, new Date(expiresAt).getTime() - nowTimestamp);
    const totalSeconds = Math.ceil(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }

  function scheduleAutosave() {
    if (!canEdit) {
      return;
    }
    autosaveStatus = 'idle';
    saveError = null;
    if (autosaveTimeout) {
      window.clearTimeout(autosaveTimeout);
    }
    autosaveTimeout = window.setTimeout(() => {
      saveGuestReflection(false);
    }, 800);
  }

  async function saveGuestReflection(submit: boolean) {
    if (!guest) return;
    const token = $page.params.token;
    if (submit) {
      submitLoading = true;
    } else {
      autosaveStatus = 'saving';
    }
    saveError = null;

    const payload: GuestReflectionUpdateRequest = {
      rating,
      tasting_notes: tastingNotes,
      reflections,
      guest_display_name: guestName,
      submit
    };

    try {
      const response = await fetch(`${API_BASE_URL}/guest/brews/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.message || 'Unable to save reflection.');
      }

      const result = await response.json();
      guest = result.data as GuestReflectionContext;
      if (!submit) {
        autosaveStatus = 'saved';
      }
    } catch (error) {
      autosaveStatus = submit ? 'idle' : 'error';
      saveError = error instanceof Error ? error.message : 'Unable to save reflection.';
    } finally {
      submitLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Guest Reflection - Espresso Engineered</title>
  <meta name="description" content="Share your reflection on this espresso brew" />
</svelte:head>

<div class="guest-reflection" style={style}>
  {#if guestError}
    <div class="guest-state">{guestError}</div>
  {:else if guest}
    <header>
      <h1>{guest.brew.name || 'Espresso Reflection'}</h1>
      <p class="voice-line">You’re helping complete this brew’s reflection.</p>
      {#if statusLabel}
        <div class="status-row">
          <Chip variant={statusVariant} size="sm">{statusLabel}</Chip>
          {#if countdown}
            <span class="status-meta">Edit window ends in {countdown}</span>
          {:else if state === 'locked' && editExpiresAt}
            <span class="status-meta">
              Guest reflection finalized at {new Date(editExpiresAt).toLocaleTimeString()}
            </span>
          {/if}
        </div>
      {/if}
    </header>

    <section class="brew-summary">
      <h2>About this brew</h2>
      <div class="summary-grid">
        <div>
          <span class="summary-label">Bean</span>
          <div class="summary-value">{guest.brew.bag?.bean?.name ?? 'Unknown bean'}</div>
        </div>
        <div>
          <span class="summary-label">Roaster</span>
          <div class="summary-value">{guest.brew.bag?.bean?.roaster?.name ?? 'Unknown roaster'}</div>
        </div>
        <div>
          <span class="summary-label">Roast</span>
          <div class="summary-value">{guest.brew.bag?.bean?.roast_level ?? '—'}</div>
        </div>
      </div>
    </section>

    <section class="reflection-form">
      <h2>Your reflection</h2>
      {#if !canEdit}
        <p class="voice-text">Thanks! This reflection is now locked in.</p>
      {/if}
      <form on:submit|preventDefault={() => saveGuestReflection(true)}>
        <div class="form-group">
          <label for="guest-name">Your name (optional)</label>
          <input
            id="guest-name"
            type="text"
            placeholder="e.g., Alex"
            bind:value={guestName}
            disabled={!canEdit}
            on:input={scheduleAutosave}
          />
        </div>

        <div class="form-group">
          <label for="guest-rating">Rating (1-10)</label>
          <input
            id="guest-rating"
            type="number"
            min="1"
            max="10"
            step="1"
            placeholder="e.g., 8"
            bind:value={rating}
            disabled={!canEdit}
            on:input={scheduleAutosave}
          />
        </div>

        <div class="form-group">
          <label for="guest-tasting">Tasting notes</label>
          <textarea
            id="guest-tasting"
            rows="3"
            placeholder="e.g., notes of cacao and orange"
            bind:value={tastingNotes}
            disabled={!canEdit}
            on:input={scheduleAutosave}
          />
        </div>

        <div class="form-group">
          <label for="guest-reflection">Reflection</label>
          <textarea
            id="guest-reflection"
            rows="4"
            placeholder="e.g., What stood out? What would you tweak?"
            bind:value={reflections}
            disabled={!canEdit}
            on:input={scheduleAutosave}
          />
        </div>

        <div class="form-footer">
          {#if saveError}
            <span class="status-error">{saveError}</span>
          {:else if autosaveStatus === 'saving'}
            <span class="status-meta">Saving...</span>
          {:else if autosaveStatus === 'saved'}
            <span class="status-meta">Draft saved</span>
          {:else if autosaveStatus === 'error'}
            <span class="status-error">Could not save draft</span>
          {:else}
            <span class="status-meta">Drafts save automatically.</span>
          {/if}

          <button class="btn-primary" type="submit" disabled={!canEdit || submitLoading}>
            {submitLoading ? 'Submitting…' : 'Submit Reflection'}
          </button>
        </div>
      </form>
    </section>
  {:else}
    <div class="guest-state">Loading guest reflection…</div>
  {/if}
</div>

<style>
  .guest-reflection {
    display: flex;
    flex-direction: column;
    gap: var(--page-gap);
    max-width: var(--page-max-width);
    margin: 0 auto;
  }

  header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  h1 {
    font-size: var(--page-title-size);
    font-family: var(--page-title-family);
    font-weight: var(--page-title-weight);
    color: var(--page-title-color);
    margin: 0;
  }

  h2 {
    font-size: var(--form-section-title-size);
    font-weight: var(--form-section-title-weight);
    color: var(--form-section-title-color);
    margin: 0;
    padding-bottom: 0.5rem;
    border-bottom: var(--form-section-title-border-width) solid var(--form-section-title-border);
  }

  .voice-line {
    font-family: var(--voice-font-family, "Libre Baskerville", serif);
    font-size: var(--voice-font-size, 1rem);
    line-height: var(--voice-line-height, 1.6);
    letter-spacing: var(--voice-letter-spacing, 0.02em);
    font-style: var(--voice-font-style, normal);
    color: var(--voice-color, var(--text-ink-muted));
    margin: 0;
  }

  .voice-text {
    font-family: var(--voice-font-family, "Libre Baskerville", serif);
    font-size: var(--voice-font-size, 0.95rem);
    line-height: var(--voice-line-height, 1.7);
    letter-spacing: var(--voice-letter-spacing, 0.02em);
    font-style: var(--voice-font-style, normal);
    color: var(--voice-color, var(--text-ink-muted));
    margin: 0;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .status-meta {
    font-family: var(--page-subtitle-family);
    font-size: var(--page-subtitle-size);
    color: var(--page-subtitle-color);
  }

  .status-error {
    font-family: var(--page-subtitle-family);
    font-size: var(--page-subtitle-size);
    color: var(--semantic-error);
  }

  .brew-summary,
  .reflection-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: var(--card-padding-y);
    background: var(--card-bg);
    border: var(--card-border-width) var(--card-border-style) var(--card-border);
    border-radius: var(--card-radius);
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }

  .summary-label {
    display: block;
    font-size: var(--form-label-size);
    color: var(--form-label-color);
    font-weight: var(--form-label-weight);
  }

  .summary-value {
    font-size: 1rem;
    color: var(--page-title-color);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: var(--form-label-weight);
    color: var(--form-label-color);
    font-size: var(--form-label-size);
  }

  input,
  textarea {
    padding: var(--form-input-padding);
    border: var(--form-input-border-width) solid var(--form-input-border);
    border-radius: var(--form-input-radius);
    font-size: var(--form-input-font-size);
    font-family: inherit;
    background: var(--form-input-bg);
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: var(--form-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.2));
  }

  input:disabled,
  textarea:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
  }

  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .guest-state {
    text-align: center;
    color: var(--page-subtitle-color);
    font-family: var(--page-subtitle-family);
    font-size: var(--page-subtitle-size);
  }

  button:disabled:hover {
    background: inherit;
  }
</style>
