<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import Chip from '$lib/components/Chip.svelte';
  import GhostButton from '$lib/components/GhostButton.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import GuestReflectionModal from '$lib/components/GuestReflectionModal.svelte';
  import RatingSlider from '$lib/components/RatingSlider.svelte';
  import { apiClient } from '$lib/api-client';
  import { CheckCircle, LockClosed, QrCode, StarMini } from '$lib/icons';
  import { recordCard } from '$lib/ui/components/card';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';

  export let brew: Brew;

  const dispatch = createEventDispatcher<{
    ratingSubmit: { brewId: string; rating: number };
    refresh: void;
  }>();

  let ratingValue: number | null = null;
  let initialRating: number | null = null;
  let ratingTouched = false;
  let guestShareOpen = false;
  let guestShareUrl: string | null = null;
  let guestShareQrUrl: string | null = null;
  let guestShareHelper: string | null = null;
  let guestShareCopied = false;
  let guestShareCopyError: string | null = null;
  let guestShareError: string | null = null;
  let guestRequestLoading = false;
  let guestEditWindowMinutes: number | null = null;
  let currentBrewId = '';

  const style = toStyleString({
    '--record-card-bg': recordCard.container.background,
    '--record-card-border': recordCard.container.borderColor,
    '--record-card-border-width': recordCard.container.borderWidth,
    '--record-card-border-style': recordCard.container.borderStyle,
    '--record-card-radius': recordCard.container.borderRadius,
    '--record-card-padding': recordCard.container.padding,
    '--record-card-hover-shadow': recordCard.container.hover.shadow,
    '--record-card-hover-border': recordCard.container.hover.borderColor,
    '--record-card-focus-width': recordCard.container.focusRing.width,
    '--record-card-focus-color': recordCard.container.focusRing.color,
    '--record-card-focus-offset': recordCard.container.focusRing.offset,
    '--voice-font-family': textStyles.voice.fontFamily,
    '--voice-font-size': textStyles.voice.fontSize,
    '--voice-line-height': textStyles.voice.lineHeight,
    '--voice-letter-spacing': textStyles.voice.letterSpacing,
    '--voice-color': colorCss.text.ink.muted
  });

  $: if (brew && brew.id !== currentBrewId) {
    currentBrewId = brew.id;
    initialRating = brew.rating ?? null;
    ratingValue = initialRating;
    ratingTouched = false;
  }

  $: if (brew && brew.rating !== initialRating && brew.id === currentBrewId) {
    const nextRating = brew.rating ?? null;
    initialRating = nextRating;
    ratingValue = nextRating;
    ratingTouched = false;
  }

  $: guestReflectionActive = Boolean(
    brew.guest_token_hash &&
      brew.guest_edit_expires_at &&
      new Date(brew.guest_edit_expires_at).getTime() > Date.now()
  );

  $: showSubmit = ratingTouched && ratingValue !== initialRating && ratingValue !== null && !guestReflectionActive;

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getBrewTitle(entry: Brew): string {
    if (entry.name) return entry.name;
    return `Brew ${formatDate(entry.created_at)}`;
  }

  function handleRatingInput(event: CustomEvent<number>) {
    ratingValue = event.detail;
    ratingTouched = true;
  }

  function handleCardClick() {
    goto(`/brews/${brew.id}?reflect=true`);
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goto(`/brews/${brew.id}?reflect=true`);
    }
  }

  function handleSubmit(event: Event) {
    event.stopPropagation();
    if (ratingValue === null) return;
    dispatch('ratingSubmit', { brewId: brew.id, rating: ratingValue });
  }

  function getGuestStorageKey(id: string) {
    return `guestReflectionToken:${id}`;
  }

  function getGuestWindowStorageKey(id: string) {
    return `guestReflectionWindowMinutes:${id}`;
  }

  function syncGuestTokenFromStorage(id: string) {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(getGuestStorageKey(id));
    if (stored) {
      guestShareUrl = `${window.location.origin}/guest/${stored}`;
    } else {
      guestShareUrl = null;
    }
    const storedWindow = window.localStorage.getItem(getGuestWindowStorageKey(id));
    if (storedWindow) {
      const parsed = Number.parseInt(storedWindow, 10);
      guestEditWindowMinutes = Number.isFinite(parsed) ? parsed : null;
    } else {
      guestEditWindowMinutes = null;
    }
  }

  function getGuestHelper(): string | null {
    if (guestReflectionActive && brew.guest_edit_expires_at) {
      return `Link expires at ${new Date(brew.guest_edit_expires_at).toLocaleTimeString()}.`;
    }
    if (guestEditWindowMinutes) {
      return `This link expires about ${guestEditWindowMinutes} minutes after it’s created.`;
    }
    return guestShareUrl ? 'This link expires after a limited window.' : null;
  }

  async function handleRequestGuestReflection(event: Event) {
    event.stopPropagation();
    if (guestRequestLoading) return;
    guestRequestLoading = true;
    guestShareCopyError = null;
    guestShareError = null;

    try {
      const response = await apiClient.requestGuestReflectionToken(brew.id);
      const token = response.data?.token;
      const windowMinutes = response.data?.edit_window_minutes;
      if (!token) {
        throw new Error('Guest reflection link could not be created');
      }
      guestShareUrl = `${window.location.origin}/guest/${token}`;
      guestShareHelper = windowMinutes
        ? `This link expires about ${windowMinutes} minutes after it’s created.`
        : 'This link expires after a limited window.';
      guestShareQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(guestShareUrl)}`;
      guestShareOpen = true;
      window.localStorage.setItem(getGuestStorageKey(brew.id), token);
      if (windowMinutes) {
        window.localStorage.setItem(getGuestWindowStorageKey(brew.id), windowMinutes.toString());
        guestEditWindowMinutes = windowMinutes;
      }
      dispatch('refresh');
    } catch (error) {
      guestShareError = error instanceof Error ? error.message : 'Failed to create guest reflection link.';
    } finally {
      guestRequestLoading = false;
    }
  }

  function handleCloseGuestShare() {
    guestShareOpen = false;
  }

  async function copyGuestShareLink() {
    if (!guestShareUrl) return;
    guestShareCopied = false;
    guestShareCopyError = null;

    try {
      await navigator.clipboard.writeText(guestShareUrl);
      guestShareCopied = true;
      window.setTimeout(() => {
        guestShareCopied = false;
      }, 2000);
    } catch (error) {
      guestShareCopyError = 'Copy failed. Select and copy the link.';
    }
  }

  function handleGuestReflectionButton(event: Event) {
    if (guestReflectionActive) {
      event.stopPropagation();
      guestShareCopyError = null;
      guestShareError = null;
      syncGuestTokenFromStorage(brew.id);
      if (!guestShareUrl) {
        guestShareError = 'Guest link is only available on the device where it was created.';
        return;
      }
      guestShareHelper = getGuestHelper();
      guestShareQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(guestShareUrl)}`;
      guestShareOpen = true;
      return;
    }
    handleRequestGuestReflection(event);
  }
</script>

<article
  class="brew-reflection-card"
  style={style}
  role="link"
  tabindex="0"
  aria-label={`Open reflection for ${getBrewTitle(brew)}`}
  on:click={handleCardClick}
  on:keydown={handleCardKeydown}
>
  <div class="card-copy">
    <header class="card-header">
      <div class="card-title">
        <h3>{getBrewTitle(brew)}</h3>
        <span>{formatDate(brew.created_at)} · {formatTime(brew.created_at)}</span>
      </div>
      {#if guestReflectionActive}
        <Chip variant="warning" size="sm">
          <span class="lock-chip">
            <LockClosed size={14} />
            Guest reflection
          </span>
        </Chip>
      {/if}
    </header>
    {#if guestReflectionActive}
      <p class="voice-text guest-status">Awaiting guest reflection.</p>
    {/if}
  </div>

  {#if !guestReflectionActive}
    <div class="rating-block interactive" on:click|stopPropagation>
      <RatingSlider
        value={ratingValue}
        min={1}
        max={10}
        step={1}
        on:input={handleRatingInput}
        ariaLabel="Set brew rating"
      >
        <span slot="label">
          {ratingValue ?? 'Not rated'}
          <StarMini size={16} />
        </span>
      </RatingSlider>
    </div>
  {/if}

  <footer class="card-footer interactive" on:click|stopPropagation>
    <GhostButton
      class="guest-reflection-button"
      type="button"
      variant="neutral"
      size="sm"
      on:click={handleGuestReflectionButton}
      ariaLabel={guestReflectionActive ? 'View guest reflection link' : 'Request guest reflection'}
      title={guestReflectionActive ? 'View guest reflection link' : 'Request guest reflection'}
      disabled={guestRequestLoading}
    >
      <QrCode size={16} />
      Guest reflection
    </GhostButton>
    {#if showSubmit}
      <IconButton
        type="button"
        variant="success"
        ariaLabel="Submit rating"
        title="Submit rating"
        on:click={handleSubmit}
      >
        <CheckCircle />
      </IconButton>
    {/if}
  </footer>
  {#if guestShareError}
    <p class="guest-error">{guestShareError}</p>
  {/if}
</article>

<GuestReflectionModal
  open={guestShareOpen}
  {guestShareUrl}
  {guestShareQrUrl}
  {guestShareHelper}
  {guestShareCopied}
  {guestShareCopyError}
  on:close={handleCloseGuestShare}
  on:copy={copyGuestShareLink}
/>

<style>
  .brew-reflection-card {
    background: var(--record-card-bg, var(--bg-surface-paper));
    border: var(--record-card-border-width, 1px) var(--record-card-border-style, solid) var(--record-card-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-card-radius, var(--radius-md));
    padding: var(--record-card-padding, 1.5rem);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    cursor: pointer;
    transition: border-color var(--motion-fast), box-shadow var(--motion-fast);
    position: relative;
    overflow: hidden;
  }

  .brew-reflection-card:hover {
    border-color: var(--record-card-hover-border, var(--accent-primary));
    box-shadow: var(--record-card-hover-shadow, none);
  }

  .brew-reflection-card:focus-visible {
    outline: var(--record-card-focus-width, 2px) solid var(--record-card-focus-color, rgba(176, 138, 90, 0.4));
    outline-offset: var(--record-card-focus-offset, 2px);
  }

  .card-copy {
    position: relative;
    z-index: 2;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .card-title {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .card-title h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--text-ink-primary);
  }

  .card-title span {
    font-size: 0.9rem;
    color: var(--text-ink-muted);
  }

  .lock-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .voice-text {
    margin: 0;
    font-family: var(--voice-font-family, 'Libre Baskerville', serif);
    font-size: var(--voice-font-size, 1rem);
    line-height: var(--voice-line-height, 1.5);
    letter-spacing: var(--voice-letter-spacing, 0.01em);
    color: var(--voice-color, var(--text-ink-muted));
  }

  .rating-block {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .card-footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
  }

  .card-footer :global(.guest-reflection-button) {
    justify-content: flex-start;
    width: 100%;
  }

  .interactive {
    position: relative;
    z-index: 2;
  }

  .guest-error {
    margin: 0;
    color: var(--semantic-error);
    font-size: 0.85rem;
  }

  @media (max-width: 600px) {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .card-footer {
      grid-template-columns: minmax(0, 1fr) auto;
    }
  }
</style>
