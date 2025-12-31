<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authService, isAuthenticated, isLoading, authStatus, authError } from '$lib/auth';

  
  let mode = 'login';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let firstName = '';
  let lastName = '';
  let displayName = '';
  let loading = false;
  let error = null;
  let success = null;

  // Get return URL from query params
  $: returnTo = $page.url.searchParams.get('returnTo') || '/';

  onMount(async () => {
    console.log('Auth page: Initializing auth service...');
    await authService.initialize();
    console.log('Auth page: Auth service initialized');
  });

  // Redirect when fully authenticated
  $: if ($authStatus === 'authenticated') {
    console.log('User authenticated, redirecting to:', returnTo);
    goto(returnTo);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    loading = true;
    error = null;
    success = null;

    try {
      if (mode === 'login') {
        await authService.signIn(email, password);
        console.log('Sign in successful, auth state will trigger redirect...');
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const trimmedDisplay = displayName.trim();
        const emailName = email.split('@')[0];

        // Supabase trigger that creates barista rows expects non-null names
        const metadata = {
          first_name: trimmedFirst,
          last_name: trimmedLast,
          display_name: trimmedDisplay || (trimmedFirst && trimmedLast
            ? `${trimmedFirst} ${trimmedLast}`
            : trimmedFirst || trimmedLast || emailName)
        };

        await authService.signUp(email, password, metadata);
        success = 'Check your email for the confirmation link.';
      } else if (mode === 'forgot') {
        await authService.resetPassword(email);
        success = 'Password reset email sent. Check your inbox.';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Authentication failed';
    } finally {
      loading = false;
    }
  }

  function setMode(newMode) {
    mode = newMode;
    error = null;
    success = null;
    // Clear form fields when switching modes
    if (newMode === 'login') {
      confirmPassword = '';
      firstName = '';
      lastName = '';
      displayName = '';
    }
  }
</script>

<svelte:head>
  <title>{mode === 'login' ? 'Login' : 'Sign Up'} - Espresso Engineered</title>
  <meta name="description" content="Sign in to your Espresso Engineered account" />
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <div class="auth-header">
      <p class="voice-line">There is time for this.</p>
      <h1>Espresso Engineered</h1>
      <p>Sign in to continue your record.</p>
    </div>

      {#if $authStatus === 'profile_missing'}
        <div class="notice error">
          We couldn't find your barista profile. Try signing out and back in.
        </div>
      {:else if $authStatus === 'error' && $authError}
        <div class="notice error">
          {$authError}
        </div>
      {/if}

      <form on:submit={handleSubmit} class="auth-form">
        <h2>
          {#if mode === 'login'}
            Sign In
          {:else if mode === 'signup'}
            Create Account
          {:else}
            Reset Password
          {/if}
        </h2>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            disabled={loading}
            placeholder="e.g., name@domain.com"
          />
        </div>

        {#if mode !== 'forgot'}
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              bind:value={password}
              required
              disabled={loading}
              placeholder="e.g., your password"
              minlength="6"
            />
          </div>
        {/if}

        {#if mode === 'signup'}
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              required
              disabled={loading}
              placeholder="e.g., re-enter password"
              minlength="6"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                bind:value={firstName}
                required
                disabled={loading}
                placeholder="e.g., Ada"
              />
            </div>
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                bind:value={lastName}
                required
                disabled={loading}
                placeholder="e.g., Lovelace"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="displayName">Display Name (Optional)</label>
            <input
              id="displayName"
              type="text"
              bind:value={displayName}
              disabled={loading}
              placeholder="e.g., Ada L."
            />
            <small>Leave empty to use your first and last name</small>
          </div>
        {/if}

        {#if error}
          <div class="notice error">{error}</div>
        {/if}

        {#if success}
          <div class="notice success">{success}</div>
        {/if}

        <button type="submit" disabled={loading} class="btn-primary auth-submit">
          {#if loading}
            {#if mode === 'login'}
              Signing In...
            {:else if mode === 'signup'}
              Creating Account...
            {:else}
              Sending Reset Email...
            {/if}
          {:else}
            {#if mode === 'login'}
              Sign In
            {:else if mode === 'signup'}
              Create Account
            {:else}
              Send Reset Email
            {/if}
          {/if}
        </button>

        <div class="auth-toggle">
          {#if mode === 'login'}
            <p>
              Don't have an account? 
              <button type="button" on:click={() => setMode('signup')} class="link-button">Sign up</button>
            </p>
            <p>
              <button type="button" on:click={() => setMode('forgot')} class="link-button">Forgot password?</button>
            </p>
          {:else if mode === 'signup'}
            <p>
              Already have an account? 
              <button type="button" on:click={() => setMode('login')} class="link-button">Sign in</button>
            </p>
          {:else}
            <p>
              Remember your password? 
              <button type="button" on:click={() => setMode('login')} class="link-button">Sign in</button>
            </p>
          {/if}
        </div>
      </form>
    </div>
  </div>

<style>
  .auth-page {
    display: flex;
    justify-content: center;
    padding: 2.5rem 1.5rem;
  }

  .auth-container {
    width: min(420px, 100%);
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

  .auth-form h2 {
    font-size: 1.2rem;
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

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group small {
    display: block;
    margin-top: 0.35rem;
    color: var(--text-ink-muted);
    font-size: 0.8rem;
  }

  .auth-submit {
    width: 100%;
    margin: 0.5rem 0 1rem;
  }

  .auth-toggle {
    text-align: center;
  }

  .auth-toggle p {
    color: var(--text-ink-muted);
    margin: 0;
    font-size: 0.9rem;
  }

  .link-button {
    background: none;
    border: none;
    color: var(--accent-primary);
    cursor: pointer;
    font-size: inherit;
    padding: 0;
  }

  .link-button:hover {
    color: var(--accent-primary-dark);
  }

  @media (max-width: 600px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>
