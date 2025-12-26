<script lang="ts">
  export let variant: 'neutral' | 'success' | 'warning' | 'error' | 'accent' = 'neutral';
  export let size: 'sm' | 'md' = 'md';
</script>

<span class="chip chip--{variant} chip--{size}">
  <slot />
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-weight: 600;
    border: 1px solid transparent;
    white-space: nowrap;
  }

  .chip--sm {
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
  }

  .chip--md {
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
  }

  /* Neutral variant */
  .chip--neutral {
    background: rgba(123, 94, 58, 0.12);
    color: var(--text-ink-secondary);
    border-color: rgba(123, 94, 58, 0.25);
  }

  /* Success variant (owned status) */
  .chip--success {
    background: rgba(85, 98, 74, 0.18);
    color: var(--semantic-success);
    border-color: rgba(85, 98, 74, 0.35);
  }

  /* Warning variant (previously owned status) */
  .chip--warning {
    background: rgba(138, 106, 62, 0.18);
    color: var(--semantic-warning);
    border-color: rgba(138, 106, 62, 0.35);
  }

  /* Error variant */
  .chip--error {
    background: rgba(122, 62, 47, 0.18);
    color: var(--semantic-error);
    border-color: rgba(122, 62, 47, 0.35);
  }

  /* Accent variant (most used by me) */
  .chip--accent {
    background: rgba(176, 138, 90, 0.18);
    color: var(--accent-primary);
    border-color: rgba(176, 138, 90, 0.35);
  }
</style>