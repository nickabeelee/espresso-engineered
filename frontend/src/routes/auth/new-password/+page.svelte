<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';
  import { authService } from '$lib/auth';

  let status: 'idle' | 'verifying' | 'ready' | 'success' | 'error' = 'idle';
  let errorMessage: string | null = null;
  let loading = false;
  let newPassword = '';
  let confirmPassword = '';
  let redirecting = false;

  const getToken = () => $page.url.searchParams.get('token_hash')
    || $page.url.searchParams.get('token')
    || '';

  const getType = () => $page.url.searchParams.get('type') || 'recovery';

  onMount(async () => {
    const token = getToken();
    const type = getType();

    status = 'verifying';

    const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      status = 'error';
      errorMessage = sessionError.message || 'Unable to read recovery session.';
      return;
    }

    if (existingSession) {
      status = 'ready';
      return;
    }

    if (!token) {
      status = 'error';
      errorMessage = 'Missing recovery token. Please request a new reset email.';
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type
    });

    if (error) {
      status = 'error';
      errorMessage = error.message || 'Unable to verify reset link.';
      return;
    }

    status = 'ready';
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    errorMessage = null;

    if (newPassword !== confirmPassword) {
      errorMessage = 'Passwords do not match.';
      return;
    }

    if (newPassword.length < 6) {
      errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    loading = true;

    try {
      await authService.updatePassword(newPassword);
      status = 'success';
      redirecting = true;
      await goto('/');
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to update password.';
    } finally {
      loading = false;
    }
  }

</script>

<svelte:head>
  <title>Reset Password - Espresso Engineered</title>
  <meta name="description" content="Create a new password for your Espresso Engineered account." />
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <div class="auth-header">
      <p class="voice-line">Fresh start, same ritual.</p>
      <h1>Set a new password</h1>
      <p>Choose a new password to regain access to your Espresso Engineered account.</p>
    </div>

    <div class="auth-card">
      {#if status === 'verifying'}
        <p class="auth-status">Checking your reset link...</p>
      {:else if status === 'success'}
        <div class="notice success">
          Password updated successfully.
          {#if redirecting}
            Taking you back to your dashboard.
          {:else}
            Continue to your workspace.
          {/if}
        </div>
        <button class="btn-primary auth-submit" type="button" on:click={() => goto('/')}>
          Continue to Espresso Engineered
        </button>
      {:else if status === 'error'}
        <div class="notice error">{errorMessage}</div>
        <button class="btn-primary auth-submit" type="button" on:click={() => goto('/auth')}>
          Back to sign in
        </button>
      {:else}
        <form class="auth-form" on:submit={handleSubmit}>
          <h2>Choose a new password</h2>

          <div class="form-group">
            <label for="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              bind:value={newPassword}
              required
              minlength="6"
              disabled={loading}
              placeholder="e.g., new password"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              required
              minlength="6"
              disabled={loading}
              placeholder="e.g., re-enter password"
            />
          </div>

          {#if errorMessage}
            <div class="notice error">{errorMessage}</div>
          {/if}

          <button class="btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
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

  .auth-form h2 {
    font-size: 1.1rem;
    margin: 0 0 1.25rem 0;
    color: var(--text-ink-secondary);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-ink-secondary);
    font-weight: 500;
  }

  input {
    width: 100%;
  }

  .auth-submit {
    width: 100%;
    margin-top: 0.5rem;
  }
</style>
