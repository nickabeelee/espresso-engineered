<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';

  let status: 'idle' | 'verifying' | 'success' | 'error' = 'idle';
  let errorMessage: string | null = null;

  const getToken = () => $page.url.searchParams.get('token_hash')
    || $page.url.searchParams.get('token')
    || '';

  const getType = () => $page.url.searchParams.get('type') || 'signup';

  onMount(async () => {
    const token = getToken();
    const type = getType();

    if (!token) {
      status = 'error';
      errorMessage = 'Missing confirmation token. Please request a new account confirmation email.';
      return;
    }

    status = 'verifying';
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type
    });

    if (error) {
      status = 'error';
      errorMessage = error.message || 'Unable to confirm your account.';
      return;
    }

    status = 'success';
  });
</script>

<svelte:head>
  <title>Confirm Account - Espresso Engineered</title>
  <meta name="description" content="Confirm your Espresso Engineered account." />
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <div class="auth-header">
      <p class="voice-line">Welcome to the bar.</p>
      <h1>Confirm your account</h1>
      <p>Verify your email to finish setting up your Espresso Engineered profile.</p>
    </div>

    <div class="auth-card">
      {#if status === 'verifying'}
        <p class="auth-status">Confirming your email...</p>
      {:else if status === 'success'}
        <div class="notice success">
          Your account is confirmed. You can sign in and start logging brews.
        </div>
        <button class="btn-primary auth-submit" type="button" on:click={() => goto('/auth')}>
          Continue to sign in
        </button>
      {:else if status === 'error'}
        <div class="notice error">{errorMessage}</div>
        <button class="btn-primary auth-submit" type="button" on:click={() => goto('/auth')}>
          Back to sign in
        </button>
      {:else}
        <p class="auth-status">Preparing confirmation...</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .auth-page {
    display: flex;
    justify-content: center;
    padding: 2.5rem 1.5rem;
  }

  .auth-container {
    width: min(440px, 100%);
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .auth-header {
    text-align: left;
  }

  .auth-header h1 {
    font-size: 1.9rem;
    margin-bottom: 0.5rem;
  }

  .auth-header p {
    margin: 0;
    font-size: 0.95rem;
  }

  .auth-card {
    background: var(--surface-raised);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: var(--shadow-elevated);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .auth-status {
    margin: 0;
    color: var(--text-ink-secondary);
  }

  .auth-submit {
    width: 100%;
  }
</style>
