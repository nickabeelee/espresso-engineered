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
          This {type} name is automatically generated based on your selections. 
          No manual input required - the system creates descriptive names for you!
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
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 2px solid #dee2e6;
    border-left: 4px solid #007bff;
    border-radius: 0.5rem;
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
    border-color: transparent #007bff transparent transparent;
  }

  .auto-name-display.preview {
    background: linear-gradient(135deg, #e7f3ff 0%, #cce7ff 100%);
    border-color: #b3d9ff;
    border-left-color: #007bff;
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
    color: #6c757d;
    font-size: 0.85rem;
    font-weight: 500;
    position: relative;
    cursor: help;
    transition: color 0.2s;
  }

  .auto-indicator:hover {
    color: #007bff;
  }

  .auto-indicator svg {
    width: 14px;
    height: 14px;
  }

  .tooltip {
    position: absolute;
    top: 100%;
    left: 0;
    background: #333;
    color: white;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    max-width: 250px;
    white-space: normal;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
    border-bottom: 4px solid #333;
  }

  .preview-label {
    background: #007bff;
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .final-label {
    background: #28a745;
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
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
    color: #6c757d;
    font-style: italic;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e9ecef;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .name-text {
    font-weight: 600;
    color: #333;
    font-size: 1.1rem;
    word-break: break-word;
  }

  .name-placeholder {
    color: #6c757d;
    font-style: italic;
  }

  .help-text {
    margin-top: 0.5rem;
    color: #6c757d;
    font-size: 0.8rem;
    line-height: 1.3;
  }

  .auto-name-display.preview .name-text {
    color: #004085;
  }

  .auto-name-display.preview .auto-indicator {
    color: #004085;
  }
</style>