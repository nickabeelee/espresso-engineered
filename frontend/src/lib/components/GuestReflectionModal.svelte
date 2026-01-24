<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { ClipboardDocument, XMark } from '$lib/icons';

  export let open = false;
  export let guestShareUrl: string | null = null;
  export let guestShareQrUrl: string | null = null;
  export let guestShareHelper: string | null = null;
  export let guestShareCopied = false;
  export let guestShareCopyError: string | null = null;

  const dispatch = createEventDispatcher<{
    close: void;
    copy: void;
  }>();

  function handleClose() {
    dispatch('close');
  }

  function handleCopy() {
    dispatch('copy');
  }
</script>

{#if open && guestShareUrl}
  <div class="guest-share-modal" role="dialog" aria-modal="true" aria-label="Guest reflection link">
    <button class="guest-share-backdrop" type="button" on:click={handleClose} aria-label="Close"></button>
    <div class="guest-share-panel">
      <div class="guest-share-header">
        <div>
          <h2>Guest Reflection Link</h2>
          <p class="guest-share-subtitle">Have your guest scan the QR code or copy the link to share it.</p>
          {#if guestShareHelper}
            <p class="guest-share-helper">{guestShareHelper}</p>
          {/if}
        </div>
        <IconButton on:click={handleClose} ariaLabel="Close" title="Close" variant="neutral">
          <XMark />
        </IconButton>
      </div>
      <div class="guest-share-body">
        {#if guestShareQrUrl}
          <div class="guest-share-qr">
            <img src={guestShareQrUrl} alt="Guest reflection QR code" />
          </div>
        {/if}
        <div class="guest-share-details">
          <div class="guest-share-actions">
            <button class="btn-primary btn-with-icon" type="button" on:click={handleCopy}>
              <ClipboardDocument size={18} />
              {guestShareCopied ? 'Link copied' : 'Copy link'}
            </button>
            {#if guestShareCopyError}
              <span class="guest-reflection-error">{guestShareCopyError}</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .guest-share-modal {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 40;
  }

  .guest-share-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(24, 17, 9, 0.5);
    border: none;
  }

  .guest-share-panel {
    position: relative;
    z-index: 1;
    width: min(640px, 90vw);
    background: var(--bg-surface-paper);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(123, 94, 58, 0.25);
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    box-shadow: 0 24px 60px rgba(20, 15, 10, 0.25);
  }

  .guest-share-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .guest-share-header h2 {
    margin: 0 0 0.35rem 0;
    color: var(--text-ink-primary);
  }

  .guest-share-subtitle {
    margin: 0;
    color: var(--text-ink-muted);
  }

  .guest-share-helper {
    margin: 0.5rem 0 0 0;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
  }

  .guest-share-body {
    display: grid;
    grid-template-columns: minmax(160px, 220px) 1fr;
    gap: 1.5rem;
    align-items: center;
  }

  .guest-share-qr {
    background: var(--bg-surface-paper-secondary);
    border-radius: var(--radius-md);
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(123, 94, 58, 0.2);
  }

  .guest-share-qr img {
    max-width: 100%;
    height: auto;
  }

  .guest-share-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .btn-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .guest-reflection-error {
    color: var(--semantic-error);
    font-size: 0.85rem;
  }

  @media (max-width: 640px) {
    .guest-share-panel {
      padding: 1.5rem;
    }

    .guest-share-body {
      grid-template-columns: 1fr;
    }
  }
</style>
