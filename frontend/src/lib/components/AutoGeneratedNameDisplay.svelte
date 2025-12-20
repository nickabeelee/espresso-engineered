<script lang="ts">
  export let name: string;
  export let type: 'bag' | 'brew';
  export let isPreview: boolean = false;
  export let loading: boolean = false;
  
  let showTooltip = false;
</script>

<div class="auto-name-display" class:preview={isPreview}>
  <div class="name-header">
    <span 
      class="auto-indicator"
      on:mouseenter={() => showTooltip = true}
      on:mouseleave={() => showTooltip = false}
      role="button"
      tabindex="0"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12l2 2 4-4"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
      Auto-generated
      {#if showTooltip}
        <div class="tooltip">
          This {type} name is generated from your selections.
          Manual input is not required.
        </div>
      {/if}
    </span>
    {#if isPreview}
      <span class="preview-label">Preview</span>
    {:else}
      <span class="final-label">Final</span>
    {/if}
  </div>
  
  <div class="name-content">
    {#if loading}
      <div class="name-loading">
        <div class="loading-spinner"></div>
        <span>Generating name...</span>
      </div>
    {:else if name}
      <div class="name-text" title={name}>
        {name}
      </div>
    {:else}
      <div class="name-placeholder">
        Name will be generated automatically
      </div>
    {/if}
  </div>
  
  {#if !isPreview}
    <div class="help-text">
      This {type} name was automatically generated based on your selections
    </div>
  {/if}
</div>

<style>
  .auto-name-display {
    background: linear-gradient(135deg, var(--bg-surface-paper-secondary) 0%, rgba(123, 94, 58, 0.12) 100%);
    border: 2px solid rgba(123, 94, 58, 0.2);
    border-left: 4px solid var(--accent-primary);
    border-radius: var(--radius-md);
    padding: 1rem;
    margin: 0.5rem 0;
    position: relative;
  }

  .auto-name-display::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 20px 20px 0;
    border-color: transparent var(--accent-primary) transparent transparent;
  }

  .auto-name-display.preview {
    background: linear-gradient(135deg, var(--bg-surface-paper-secondary) 0%, rgba(176, 138, 90, 0.18) 100%);
    border-color: rgba(123, 94, 58, 0.2);
    border-left-color: var(--accent-primary);
  }

  .name-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .auto-indicator {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: rgba(123, 94, 58, 0.6);
    font-size: 0.85rem;
    font-weight: 500;
    position: relative;
    cursor: help;
    transition: color 0.2s;
  }

  .auto-indicator:hover {
    color: var(--accent-primary);
  }

  .auto-indicator svg {
    width: 14px;
    height: 14px;
  }

  .tooltip {
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--text-ink-primary);
    color: var(--text-ink-inverted);
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    white-space: nowrap;
    max-width: 250px;
    white-space: normal;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(43, 33, 24, 0.2);
    margin-top: 0.25rem;
  }

  .tooltip::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 10px;
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 4px solid var(--text-ink-primary);
  }

  .preview-label {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .final-label {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .name-content {
    min-height: 1.5rem;
    display: flex;
    align-items: center;
  }

  .name-loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(123, 94, 58, 0.6);
    font-style: italic;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(123, 94, 58, 0.12);
    border-top: 2px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .name-text {
    font-weight: 600;
    color: var(--text-ink-primary);
    font-size: 1.1rem;
    word-break: break-word;
  }

  .name-placeholder {
    color: rgba(123, 94, 58, 0.6);
    font-style: italic;
  }

  .help-text {
    margin-top: 0.5rem;
    color: rgba(123, 94, 58, 0.6);
    font-size: 0.8rem;
    line-height: 1.3;
  }

  .auto-name-display.preview .name-text {
    color: var(--text-ink-secondary);
  }

  .auto-name-display.preview .auto-indicator {
    color: var(--text-ink-secondary);
  }
</style>
