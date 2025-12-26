<script lang="ts">
  import { ExclamationTriangle, CheckCircle, InformationCircle } from '$lib/icons';
  import type { ValidationError } from '$lib/utils/error-handling';
  
  export let errors: ValidationError[] = [];
  export let field: string | null = null;
  export let showSuccess = false;
  export let successMessage = 'Valid';
  export let variant: 'inline' | 'tooltip' | 'list' = 'inline';
  export let size: 'sm' | 'md' = 'sm';
  
  $: fieldErrors = field 
    ? errors.filter(error => error.field === field || error.field === 'general')
    : errors;
  
  $: hasErrors = fieldErrors.length > 0;
  $: isValid = !hasErrors && showSuccess;
</script>

{#if hasErrors || isValid}
  <div 
    class="validation-feedback {variant} {size}"
    class:has-errors={hasErrors}
    class:is-valid={isValid}
    role="alert"
    aria-live="polite"
  >
    {#if variant === 'list' && fieldErrors.length > 1}
      <ul class="error-list">
        {#each fieldErrors as error}
          <li class="error-item">
            <span class="error-icon">
              <ExclamationTriangle size={14} />
            </span>
            <span class="error-text">{error.message}</span>
          </li>
        {/each}
      </ul>
    {:else if hasErrors}
      <div class="feedback-item error">
        <span class="feedback-icon">
          <ExclamationTriangle size={size === 'sm' ? 14 : 16} />
        </span>
        <span class="feedback-text">
          {fieldErrors[0].message}
          {#if fieldErrors.length > 1}
            <span class="additional-errors">
              (+{fieldErrors.length - 1} more)
            </span>
          {/if}
        </span>
      </div>
    {:else if isValid}
      <div class="feedback-item success">
        <span class="feedback-icon">
          <CheckCircle size={size === 'sm' ? 14 : 16} />
        </span>
        <span class="feedback-text">{successMessage}</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .validation-feedback {
    margin-top: 0.25rem;
  }
  
  .validation-feedback.inline {
    display: block;
  }
  
  .validation-feedback.tooltip {
    position: absolute;
    z-index: 10;
    background: var(--bg-surface-paper);
    border: 1px solid;
    border-radius: var(--radius-sm);
    padding: 0.5rem;
    box-shadow: var(--shadow-soft);
    max-width: 250px;
  }
  
  .validation-feedback.list {
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--radius-sm);
    padding: 0.75rem;
  }
  
  .validation-feedback.sm {
    font-size: 0.8rem;
  }
  
  .validation-feedback.md {
    font-size: 0.85rem;
  }
  
  .feedback-item {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
  }
  
  .feedback-item.error {
    color: var(--semantic-error);
  }
  
  .feedback-item.success {
    color: var(--semantic-success, #059669);
  }
  
  .feedback-icon {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
  
  .feedback-text {
    flex: 1;
    line-height: 1.3;
  }
  
  .additional-errors {
    opacity: 0.7;
    font-size: 0.9em;
  }
  
  .error-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .error-item {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    color: var(--semantic-error);
  }
  
  .error-icon {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
  
  .error-text {
    flex: 1;
    line-height: 1.3;
  }
  
  /* Tooltip positioning */
  .validation-feedback.tooltip.has-errors {
    border-color: var(--semantic-error);
    background: rgba(239, 68, 68, 0.05);
  }
  
  .validation-feedback.tooltip.is-valid {
    border-color: var(--semantic-success, #059669);
    background: rgba(5, 150, 105, 0.05);
  }
  
  /* Animation for feedback appearance */
  .validation-feedback {
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    .validation-feedback.tooltip {
      position: relative;
      max-width: none;
      margin-top: 0.5rem;
    }
  }
</style>