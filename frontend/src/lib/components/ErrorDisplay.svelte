<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ArrowPath, XMark, ExclamationTriangle, InformationCircle } from '$lib/icons';
  import IconButton from './IconButton.svelte';
  import { AppError, ErrorType, categorizeError, isRetryableError } from '$lib/utils/error-handling';
  import { alertBase, alertSizes, alertVariants } from '$lib/ui/components/alert';
  import { toStyleString } from '$lib/ui/style';
  
  export let error: Error | AppError | string | null = null;
  export let variant: 'inline' | 'banner' | 'modal' | 'toast' = 'inline';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showRetry = true;
  export let showDismiss = true;
  export let retryLabel = 'Try Again';
  export let dismissLabel = 'Dismiss';
  export let title: string | null = null;
  export let context: string | null = null;
  
  const dispatch = createEventDispatcher<{
    retry: void;
    dismiss: void;
  }>();

  const style = toStyleString({
    '--alert-radius': alertBase.borderRadius,
    '--alert-border-width': alertBase.borderWidth,
    '--alert-font-family': alertBase.fontFamily,
    '--alert-error-bg': alertVariants.error.background,
    '--alert-error-border': alertVariants.error.borderColor,
    '--alert-error-color': alertVariants.error.textColor,
    '--alert-warning-bg': alertVariants.warning.background,
    '--alert-warning-border': alertVariants.warning.borderColor,
    '--alert-warning-color': alertVariants.warning.textColor,
    '--alert-neutral-bg': alertVariants.neutral.background,
    '--alert-neutral-border': alertVariants.neutral.borderColor,
    '--alert-neutral-color': alertVariants.neutral.textColor,
    '--alert-pad-sm': alertSizes.sm.padding,
    '--alert-pad-md': alertSizes.md.padding,
    '--alert-pad-lg': alertSizes.lg.padding,
    '--alert-font-sm': alertSizes.sm.fontSize,
    '--alert-font-md': alertSizes.md.fontSize,
    '--alert-font-lg': alertSizes.lg.fontSize
  });
  
  $: errorObj = typeof error === 'string' 
    ? new Error(error) 
    : error instanceof AppError 
      ? error 
      : error;
  
  $: errorType = errorObj ? categorizeError(errorObj) : null;
  $: canRetry = errorObj ? isRetryableError(errorObj) : false;
  $: shouldShowRetry = showRetry && canRetry;
  
  function getErrorIcon(type: ErrorType | null) {
    switch (type) {
      case ErrorType.NETWORK:
      case ErrorType.SERVER:
      case ErrorType.RATE_LIMIT:
        return ExclamationTriangle;
      case ErrorType.VALIDATION:
      case ErrorType.PERMISSION:
      case ErrorType.NOT_FOUND:
      case ErrorType.CONFLICT:
        return InformationCircle;
      default:
        return ExclamationTriangle;
    }
  }
  
  function getErrorTitle(type: ErrorType | null): string {
    if (title) return title;
    
    switch (type) {
      case ErrorType.NETWORK:
        return 'Connection Error';
      case ErrorType.VALIDATION:
        return 'Invalid Input';
      case ErrorType.PERMISSION:
        return 'Access Denied';
      case ErrorType.NOT_FOUND:
        return 'Not Found';
      case ErrorType.CONFLICT:
        return 'Conflict';
      case ErrorType.RATE_LIMIT:
        return 'Rate Limited';
      case ErrorType.SERVER:
        return 'Server Error';
      default:
        return 'Error';
    }
  }
  
  function getErrorMessage(): string {
    if (!errorObj) return '';
    
    if (errorObj instanceof AppError) {
      return errorObj.getUserMessage();
    }
    
    return errorObj.message || 'An unexpected error occurred';
  }
  
  function handleRetry() {
    dispatch('retry');
  }
  
  function handleDismiss() {
    dispatch('dismiss');
  }
</script>

{#if errorObj}
    <div 
    class="error-display {variant} {size}"
    class:retryable={canRetry}
    role="alert"
    aria-live="polite"
    style={style}
  >
    <div class="error-content">
      <div class="error-icon">
        <svelte:component this={getErrorIcon(errorType)} size={variant === 'banner' ? 20 : 18} />
      </div>
      
      <div class="error-text">
        <div class="error-title">
          {getErrorTitle(errorType)}
          {#if context}
            <span class="error-context">({context})</span>
          {/if}
        </div>
        <div class="error-message">
          {getErrorMessage()}
        </div>
      </div>
      
      <div class="error-actions">
        {#if shouldShowRetry}
          <IconButton
            type="button"
            variant="neutral"
            size="sm"
            ariaLabel={retryLabel}
            title={retryLabel}
            on:click={handleRetry}
          >
            <ArrowPath />
          </IconButton>
        {/if}
        
        {#if showDismiss}
          <IconButton
            type="button"
            variant="neutral"
            size="sm"
            ariaLabel={dismissLabel}
            title={dismissLabel}
            on:click={handleDismiss}
          >
            <XMark />
          </IconButton>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .error-display {
    border-radius: var(--alert-radius, var(--radius-md));
    border: var(--alert-border-width, 1px) solid;
    background: var(--alert-error-bg, rgba(122, 62, 47, 0.12));
    border-color: var(--alert-error-border, var(--semantic-error));
    color: var(--alert-error-color, var(--semantic-error));
    font-family: var(--alert-font-family, inherit);
  }
  
  .error-display.inline {
    padding: var(--alert-pad-md, 0.75rem);
    margin: 0.5rem 0;
  }
  
  .error-display.banner {
    padding: var(--alert-pad-lg, 1rem 1.5rem);
    margin: 1rem 0;
    border-radius: var(--radius-lg);
  }
  
  .error-display.modal {
    padding: var(--alert-pad-lg, 1.5rem);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
  }
  
  .error-display.toast {
    padding: var(--alert-pad-md, 0.75rem 1rem);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-soft);
    max-width: 400px;
  }
  
  .error-display.sm {
    font-size: var(--alert-font-sm, 0.85rem);
  }
  
  .error-display.md {
    font-size: var(--alert-font-md, 0.9rem);
  }
  
  .error-display.lg {
    font-size: var(--alert-font-lg, 1rem);
  }
  
  .error-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .error-icon {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
  
  .error-text {
    flex: 1;
    min-width: 0;
  }
  
  .error-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .error-context {
    font-weight: normal;
    opacity: 0.8;
    font-size: 0.9em;
  }
  
  .error-message {
    line-height: 1.4;
    opacity: 0.9;
  }
  
  .error-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }
  
  /* Network/retryable error styling */
  .error-display.retryable {
    background: rgba(255, 193, 7, 0.1);
    border-color: rgba(255, 193, 7, 0.3);
    color: rgb(133, 100, 4);
  }
  
  /* Validation error styling */
  .error-display:has(.error-title:contains("Invalid Input")) {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: rgb(153, 27, 27);
  }
  
  /* Permission error styling */
  .error-display:has(.error-title:contains("Access Denied")) {
    background: rgba(245, 101, 101, 0.1);
    border-color: rgba(245, 101, 101, 0.3);
    color: rgb(153, 27, 27);
  }
  
  /* Server error styling */
  .error-display:has(.error-title:contains("Server Error")) {
    background: rgba(156, 69, 69, 0.1);
    border-color: rgba(156, 69, 69, 0.3);
    color: var(--semantic-error);
  }
  
  @media (max-width: 768px) {
    .error-display.banner,
    .error-display.modal {
      padding: 1rem;
    }
    
    .error-content {
      gap: 0.5rem;
    }
    
    .error-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
    
    .error-actions {
      margin-top: 0.5rem;
      align-self: stretch;
      justify-content: flex-end;
    }
  }
</style>
