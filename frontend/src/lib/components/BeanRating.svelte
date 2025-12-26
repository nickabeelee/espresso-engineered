<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { barista } from '$lib/auth';
  import { enhancedApiClient } from '$lib/utils/enhanced-api-client';
  import { AppError } from '$lib/utils/error-handling';
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  
  export let beanId: string;
  export let currentRating: number | null = null;
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    ratingChanged: { rating: number | null };
  }>();

  let hoveredRating = 0;
  let isSubmitting = false;
  let error: AppError | null = null;

  $: canRate = !!$barista && !disabled;

  async function handleRatingClick(rating: number) {
    if (!canRate || isSubmitting) return;
    
    if (!$barista) {
      error = new AppError(
        'You must be logged in to rate beans.',
        { operation: 'rate', entityType: 'bean', retryable: false }
      );
      return;
    }
    
    isSubmitting = true;
    error = null;
    
    try {
      if (currentRating === rating) {
        // Remove rating if clicking the same star
        await enhancedApiClient.deleteBeanRating(beanId);
        currentRating = null;
      } else if (currentRating) {
        // Update existing rating
        await enhancedApiClient.updateBeanRating(beanId, { rating });
        currentRating = rating;
      } else {
        // Create new rating
        await enhancedApiClient.createBeanRating(beanId, { rating });
        currentRating = rating;
      }
      
      dispatch('ratingChanged', { rating: currentRating });
    } catch (err) {
      error = err instanceof AppError ? err : new AppError(
        'Failed to update rating',
        { operation: 'rate', entityType: 'bean', retryable: true },
        err as Error
      );
    } finally {
      isSubmitting = false;
    }
  }

  function handleRetryRating() {
    if (hoveredRating > 0) {
      handleRatingClick(hoveredRating);
    }
  }

  function handleDismissError() {
    error = null;
  }

  function handleMouseEnter(rating: number) {
    if (canRate && !isSubmitting) {
      hoveredRating = rating;
    }
  }

  function handleMouseLeave() {
    hoveredRating = 0;
  }

  function getStarClass(starNumber: number): string {
    const effectiveRating = hoveredRating || currentRating || 0;
    
    if (starNumber <= effectiveRating) {
      return 'filled';
    } else if (starNumber - 0.5 <= effectiveRating) {
      return 'half';
    } else {
      return 'empty';
    }
  }

  function isStarActive(starNumber: number): boolean {
    return hoveredRating >= starNumber || (hoveredRating === 0 && (currentRating || 0) >= starNumber);
  }
</script>

<div class="bean-rating" class:disabled>
  <div class="rating-stars" on:mouseleave={handleMouseLeave}>
    {#each [1, 2, 3, 4, 5] as star}
      <button
        type="button"
        class="star-button {getStarClass(star)}"
        class:active={isStarActive(star)}
        class:current={currentRating === star}
        disabled={!canRate || isSubmitting}
        on:click={() => handleRatingClick(star)}
        on:mouseenter={() => handleMouseEnter(star)}
        aria-label={currentRating === star ? `Remove ${star} star rating` : `Rate ${star} star${star > 1 ? 's' : ''}`}
      >
        ★
      </button>
    {/each}
  </div>
  
  <div class="rating-info">
    {#if currentRating}
      <span class="current-rating">
        {currentRating}/5 stars
        {#if canRate}
          <button 
            type="button" 
            class="remove-rating" 
            on:click={() => handleRatingClick(currentRating)}
            disabled={isSubmitting}
            aria-label="Remove rating"
          >
            Remove
          </button>
        {/if}
      </span>
    {:else}
      <span class="no-rating">
        {!canRate ? ($barista ? 'Rating disabled' : 'Login to rate') : 'Click to rate'}
      </span>
    {/if}
  </div>
  
  {#if error}
    <ErrorDisplay
      error={error}
      variant="inline"
      size="sm"
      context="rating"
      on:retry={handleRetryRating}
      on:dismiss={handleDismissError}
    />
  {/if}
  
  {#if isSubmitting}
    <div class="rating-loading">
      <LoadingIndicator variant="dots" size="sm" inline message="Updating rating..." />
    </div>
  {/if}
</div>

<style>
  .bean-rating {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .bean-rating.disabled {
    opacity: 0.7;
  }

  .bean-rating:has(.star-button:disabled) {
    opacity: 0.7;
  }

  .rating-stars {
    display: flex;
    gap: 0.25rem;
  }

  .star-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
    transition: all var(--motion-fast);
    color: var(--text-ink-muted);
    line-height: 1;
  }

  .star-button:not(:disabled):hover {
    background: rgba(176, 138, 90, 0.1);
    transform: scale(1.1);
  }

  .star-button:disabled {
    cursor: not-allowed;
  }

  .star-button.filled,
  .star-button.active {
    color: var(--accent-primary);
  }

  .star-button.current {
    color: var(--accent-primary);
    background: rgba(176, 138, 90, 0.15);
  }

  .star-button.half {
    background: linear-gradient(90deg, var(--accent-primary) 50%, var(--text-ink-muted) 50%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .rating-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
  }

  .current-rating {
    color: var(--text-ink-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .no-rating {
    color: var(--text-ink-muted);
  }

  .remove-rating {
    background: none;
    border: none;
    color: var(--text-ink-muted);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0;
  }

  .remove-rating:hover {
    color: var(--semantic-error);
  }

  .remove-rating:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .rating-error {
    color: var(--semantic-error);
    font-size: 0.8rem;
    padding: 0.5rem;
    background: rgba(156, 69, 69, 0.1);
    border: 1px solid rgba(156, 69, 69, 0.2);
    border-radius: var(--radius-sm);
  }

  .rating-loading {
    color: var(--text-ink-muted);
    font-size: 0.8rem;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .star-button {
      font-size: 1.3rem;
      padding: 0.2rem;
    }
    
    .rating-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  }
</style>