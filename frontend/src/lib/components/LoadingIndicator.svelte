<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let variant: 'spinner' | 'dots' | 'pulse' | 'skeleton' = 'spinner';
  export let message: string | null = null;
  export let progress: number | null = null; // 0-100
  export let inline = false;
  export let overlay = false;
  
  $: showProgress = progress !== null && progress >= 0 && progress <= 100;
</script>

<div 
  class="loading-indicator {variant} {size}"
  class:inline
  class:overlay
  role="status"
  aria-live="polite"
  aria-label={message || 'Loading'}
>
  {#if overlay}
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-animation-container">
          <div class="loading-animation">
            {#if variant === 'spinner'}
              <div class="spinner"></div>
            {:else if variant === 'dots'}
              <div class="dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
            {:else if variant === 'pulse'}
              <div class="pulse"></div>
            {/if}
          </div>
        </div>
        
        {#if message}
          <div class="loading-message-container">
            <div class="loading-message">{message}</div>
          </div>
        {/if}
        
        {#if showProgress}
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {progress}%"></div>
            </div>
            <div class="progress-text">{Math.round(progress)}%</div>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="loading-content">
      <div class="loading-animation-container">
        <div class="loading-animation">
          {#if variant === 'spinner'}
            <div class="spinner"></div>
          {:else if variant === 'dots'}
            <div class="dots">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          {:else if variant === 'pulse'}
            <div class="pulse"></div>
          {:else if variant === 'skeleton'}
            <div class="skeleton">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
            </div>
          {/if}
        </div>
      </div>
      
      {#if message}
        <div class="loading-message-container">
          <div class="loading-message">{message}</div>
        </div>
      {/if}
      
      {#if showProgress}
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: {progress}%"></div>
          </div>
          <div class="progress-text">{Math.round(progress)}%</div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .loading-indicator.inline {
    display: inline-flex;
  }
  
  .loading-indicator.overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
  }
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-surface-paper);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-soft);
    /* Ensure no transforms are inherited */
    transform: none;
  }
  
  .loading-indicator:not(.overlay) .loading-content {
    background: transparent;
    box-shadow: none;
    padding: 0;
  }
  
  .loading-animation-container {
    /* Isolate the animation container completely */
    contain: layout style paint;
    isolation: isolate;
    transform: none;
  }
  
  .loading-animation {
    display: flex;
    align-items: center;
    justify-content: center;
    /* Create a new stacking context to isolate transforms */
    position: relative;
    z-index: 0;
    /* Ensure this container doesn't rotate */
    transform: none;
  }
  
  .loading-message-container {
    /* Completely isolate the message from any animations */
    contain: layout style paint;
    isolation: isolate;
    transform: none !important;
    animation: none !important;
  }
  
  /* Spinner animation */
  .spinner {
    border: 2px solid rgba(176, 138, 90, 0.2);
    border-top: 2px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    /* Isolate the transform to prevent affecting siblings */
    will-change: transform;
    transform-origin: center;
    /* Ensure the spinner is contained */
    contain: layout style paint;
    /* Create isolation */
    isolation: isolate;
  }
  
  .loading-indicator.sm .spinner {
    width: 16px;
    height: 16px;
    border-width: 1.5px;
  }
  
  .loading-indicator.md .spinner {
    width: 24px;
    height: 24px;
  }
  
  .loading-indicator.lg .spinner {
    width: 32px;
    height: 32px;
    border-width: 3px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Dots animation */
  .dots {
    display: flex;
    gap: 0.25rem;
  }
  
  .dot {
    background: var(--accent-primary);
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite both;
  }
  
  .loading-indicator.sm .dot {
    width: 4px;
    height: 4px;
  }
  
  .loading-indicator.md .dot {
    width: 6px;
    height: 6px;
  }
  
  .loading-indicator.lg .dot {
    width: 8px;
    height: 8px;
  }
  
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  .dot:nth-child(3) { animation-delay: 0s; }
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
  
  /* Pulse animation */
  .pulse {
    background: var(--accent-primary);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  
  .loading-indicator.sm .pulse {
    width: 16px;
    height: 16px;
  }
  
  .loading-indicator.md .pulse {
    width: 24px;
    height: 24px;
  }
  
  .loading-indicator.lg .pulse {
    width: 32px;
    height: 32px;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
  
  /* Skeleton animation */
  .skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 200px;
  }
  
  .skeleton-line {
    height: 12px;
    background: linear-gradient(
      90deg,
      rgba(176, 138, 90, 0.1) 25%,
      rgba(176, 138, 90, 0.2) 50%,
      rgba(176, 138, 90, 0.1) 75%
    );
    background-size: 200% 100%;
    border-radius: var(--radius-sm);
    animation: shimmer 2s ease-in-out infinite;
  }
  
  .skeleton-line.short {
    width: 60%;
  }
  
  .loading-indicator.sm .skeleton {
    width: 150px;
  }
  
  .loading-indicator.sm .skeleton-line {
    height: 10px;
  }
  
  .loading-indicator.lg .skeleton {
    width: 250px;
  }
  
  .loading-indicator.lg .skeleton-line {
    height: 14px;
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  /* Loading message */
  .loading-message {
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
    text-align: center;
    max-width: 200px;
    /* Ensure the message never rotates */
    transform: none !important;
    animation: none !important;
  }
  
  .loading-indicator.sm .loading-message {
    font-size: 0.8rem;
  }
  
  .loading-indicator.lg .loading-message {
    font-size: 1rem;
  }
  
  /* Progress bar */
  .progress-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
    max-width: 200px;
  }
  
  .progress-bar {
    height: 4px;
    background: rgba(176, 138, 90, 0.2);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--accent-primary);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    font-size: 0.75rem;
    color: var(--text-ink-muted);
    text-align: center;
  }
  
  @media (max-width: 768px) {
    .loading-content {
      padding: 0.75rem;
    }
    
    .skeleton {
      width: 150px;
    }
    
    .progress-container {
      max-width: 150px;
    }
  }
</style>