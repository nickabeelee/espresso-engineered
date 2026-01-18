<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Chip from '$lib/components/Chip.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { CheckCircle, XMark } from '$lib/icons';
  import { editableField, formHelperText, formLabel, formSection } from '$lib/ui/components/form';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';

  export let brew: Brew;
  export let beanTastingNotes: string | null = null;
  export let reflectionLocked = false;
  export let lockMessage = 'Locked while guest completes reflection';

  const dispatch = createEventDispatcher<{
    save: Partial<UpdateBrewRequest>;
    cancel: void;
  }>();

  let rating: number | undefined = undefined;
  let tasting_notes = '';
  let reflections = '';
  let validationErrors: Record<string, string> = {};
  let currentBrewId = '';
  let missingRating = false;
  let missingTastingNotes = false;
  let missingReflections = false;
  let beanNotes: string[] = [];
  let genericNotes: string[] = [];

  const coffeeCompassNotes = [
    'Overwhelming',
    'Sour',
    'Salty',
    'Strong',
    'Thick',
    'Robust',
    'Plump',
    'Transparent',
    'Sweet',
    'Balanced',
    'Rich',
    'Luscious',
    'Fruity',
    'Creamy',
    'Nuanced',
    'Fluffy',
    'Slender',
    'Delicate',
    'Bitter',
    'Dry',
    'Empty',
    'Watery',
    'Powdery',
    'Thin',
    'Tasty',
    'Light',
    'Ripe',
    'Substantial',
    'Intense',
    'Generic',
    'Bland'
  ];

  const style = toStyleString({
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
    '--form-input-bg-missing': editableField.input.background,
    '--form-helper-color': formHelperText.textColor,
    '--form-helper-size': formHelperText.fontSize,
    '--form-error-color': editableField.error.textColor,
    '--form-error-size': editableField.error.fontSize,
    '--voice-font-family': textStyles.voice.fontFamily,
    '--voice-font-size': textStyles.voice.fontSize,
    '--voice-line-height': textStyles.voice.lineHeight,
    '--voice-letter-spacing': textStyles.voice.letterSpacing,
    '--voice-font-style': textStyles.voice.fontStyle,
    '--voice-color': colorCss.text.ink.muted
  });

  $: if (brew && brew.id !== currentBrewId) {
    currentBrewId = brew.id;
    rating = brew.rating ?? undefined;
    tasting_notes = brew.tasting_notes ?? '';
    reflections = brew.reflections ?? '';
    validationErrors = {};
  }

  function normalizeFlavor(value: string): string {
    return value.trim().toLowerCase();
  }

  function parseFlavorList(value: string | null): string[] {
    if (!value) return [];
    return value
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function getSuggestionList(notes: string[]): string[] {
    const allNotes = [...notes];
    const seen = new Set<string>();

    return allNotes.filter((note) => {
      const normalized = normalizeFlavor(note);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  function currentNotes(): string[] {
    return parseFlavorList(tasting_notes).map((note) => note.trim()).filter(Boolean);
  }

  function isNoteIncluded(note: string): boolean {
    const normalized = normalizeFlavor(note);
    return currentNotes().some((entry) => normalizeFlavor(entry) === normalized);
  }

  function addTastingNote(note: string) {
    if (!note) return;
    const existing = currentNotes();
    if (existing.some((entry) => normalizeFlavor(entry) === normalizeFlavor(note))) {
      return;
    }
    const updated = [...existing, note].join(', ');
    tasting_notes = updated;
  }

  function validateForm(): boolean {
    validationErrors = {};
    if (rating !== undefined && (rating < 1 || rating > 10)) {
      validationErrors.rating = 'Rating must be between 1 and 10';
    }
    return Object.keys(validationErrors).length === 0;
  }

  function handleSave() {
    if (!validateForm()) {
      return;
    }

    dispatch('save', {
      rating,
      tasting_notes: tasting_notes.trim() || undefined,
      reflections: reflections.trim() || undefined
    });
  }

  function handleCancel() {
    dispatch('cancel');
  }

  $: missingRating = !rating;
  $: missingTastingNotes = !tasting_notes.trim();
  $: missingReflections = !reflections.trim();
  $: beanNotes = getSuggestionList(parseFlavorList(beanTastingNotes));
  $: genericNotes = getSuggestionList(coffeeCompassNotes);
</script>

<div class="reflection-form" style={style}>
  <form on:submit|preventDefault={handleSave}>
    <div class="form-section">
      {#if reflectionLocked}
        <p class="voice-text lock-message">{lockMessage}</p>
      {/if}

      <div class="form-group" class:missing={missingRating}>
        <label for="reflection-rating">Rating (1-10)</label>
        <input
          id="reflection-rating"
          type="number"
          inputmode="numeric"
          bind:value={rating}
          min="1"
          max="10"
          step="1"
          placeholder="e.g., 8"
          disabled={reflectionLocked}
          title={reflectionLocked ? lockMessage : undefined}
        />
        {#if validationErrors.rating}
          <span class="error-text">{validationErrors.rating}</span>
        {:else if missingRating}
          <span class="voice-text">Still waiting for a rating.</span>
        {/if}
      </div>

      <div class="form-group" class:missing={missingTastingNotes}>
        <label for="reflection-tasting-notes">Tasting Notes</label>
        <textarea
          id="reflection-tasting-notes"
          bind:value={tasting_notes}
          rows="3"
          placeholder="e.g., notes of cacao and orange"
          disabled={reflectionLocked}
          title={reflectionLocked ? lockMessage : undefined}
        />
        {#if missingTastingNotes}
          <span class="voice-text">
            Capture a few flavors while they are fresh. Trouble deciding? Here are some options:
          </span>
        {:else}
          <span class="helper-text">Keep notes comma separated.</span>
        {/if}
        <div class="tasting-suggestions">
          {#if beanNotes.length}
            <div class="tasting-group">
              <span class="group-label">Bean tasting notes</span>
              <div class="chip-list">
                {#each beanNotes as note}
                  <button
                    class="chip-button"
                    type="button"
                    on:click={() => addTastingNote(note)}
                    aria-pressed={isNoteIncluded(note)}
                    disabled={reflectionLocked}
                    title={reflectionLocked ? lockMessage : undefined}
                  >
                    <Chip variant={isNoteIncluded(note) ? 'accent' : 'neutral'} size="sm">
                      {note}
                    </Chip>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
          <div class="tasting-group">
            <span class="group-label">Coffee compass helpers</span>
            <div class="chip-list">
                {#each genericNotes as note}
                  <button
                    class="chip-button"
                    type="button"
                    on:click={() => addTastingNote(note)}
                    aria-pressed={isNoteIncluded(note)}
                    disabled={reflectionLocked}
                    title={reflectionLocked ? lockMessage : undefined}
                  >
                  <Chip variant={isNoteIncluded(note) ? 'accent' : 'neutral'} size="sm">
                    {note}
                  </Chip>
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div class="form-group" class:missing={missingReflections}>
        <label for="reflection-notes">Reflections</label>
        <textarea
          id="reflection-notes"
          bind:value={reflections}
          rows="3"
          placeholder="e.g., What worked? What would you change?"
          disabled={reflectionLocked}
          title={reflectionLocked ? lockMessage : undefined}
        />
        {#if missingReflections}
          <span class="voice-text">Give yourself a reminder for next time.</span>
        {/if}
      </div>
    </div>

    <div class="form-actions">
      <IconButton
        type="button"
        on:click={handleCancel}
        ariaLabel="Cancel reflection"
        title="Cancel"
        variant="neutral"
      >
        <XMark />
      </IconButton>
      <IconButton
        type="submit"
        ariaLabel="Save reflection"
        title="Save reflection"
        variant="success"
        disabled={reflectionLocked}
      >
        <CheckCircle />
      </IconButton>
    </div>
  </form>
</div>

<style>
  .reflection-form {
    width: 100%;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-section h3 {
    margin: 0;
    color: var(--form-section-title-color, var(--text-ink-secondary));
    font-size: var(--form-section-title-size, 1.25rem);
    font-weight: var(--form-section-title-weight, 500);
    border-bottom: var(--form-section-title-border-width, 1px) solid var(--form-section-title-border, var(--border-subtle));
    padding-bottom: 0.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: var(--form-label-weight, 600);
    color: var(--form-label-color, var(--text-ink-secondary));
    font-size: var(--form-label-size, 0.95rem);
  }

  .form-group input,
  .form-group textarea {
    padding: var(--form-input-padding, 0.75rem);
    border: var(--form-input-border-width, 1px) solid var(--form-input-border, var(--border-subtle));
    border-radius: var(--form-input-radius, var(--radius-sm));
    font-size: var(--form-input-font-size, 1rem);
    font-family: inherit;
    background: var(--form-input-bg, var(--bg-surface-paper));
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: var(--form-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.2));
  }

  .form-group.missing input,
  .form-group.missing textarea {
    border-color: rgba(176, 138, 90, 0.65);
    background: var(--form-input-bg-missing, var(--bg-surface-paper-secondary));
  }

  .helper-text {
    color: var(--form-helper-color, var(--text-ink-muted));
    font-size: var(--form-helper-size, 0.85rem);
  }

  .voice-text {
    font-family: var(--voice-font-family, "Libre Baskerville", serif);
    font-size: var(--voice-font-size, 0.95rem);
    line-height: var(--voice-line-height, 1.7);
    letter-spacing: var(--voice-letter-spacing, 0.02em);
    font-style: var(--voice-font-style, normal);
    color: var(--voice-color, var(--text-ink-muted));
  }

  .lock-message {
    margin: 0;
  }

  .error-text {
    color: var(--form-error-color, var(--semantic-error));
    font-size: var(--form-error-size, 0.85rem);
  }

  .tasting-suggestions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .suggestions-label {
    margin: 0;
    color: var(--form-helper-color, var(--text-ink-muted));
    font-size: var(--form-helper-size, 0.85rem);
  }

  .tasting-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .group-label {
    color: var(--form-helper-color, var(--text-ink-muted));
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .chip-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .chip-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: 999px;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--border-subtle);
  }
</style>
