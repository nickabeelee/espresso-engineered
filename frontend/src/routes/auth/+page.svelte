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
  $: returnTo = $page.url.searchParams.get('returnTo') || '/brews';

  onMount(async () => {
    console.log('Auth page: Initializing auth service...');
    await authService.initialize();
    console.log('Auth page: Auth service initialized');
  });

  // Handle authentication state changes with subscription
  let authSubscription: (() => void) | null = null;
  
  onMount(() => {
    // Subscribe to auth state changes directly
    authSubscription = isAuthenticated.subscribe((authenticated) => {
      if (authenticated && !$isLoading) {
        console.log('User authenticated via subscription, redirecting to:', returnTo);
        goto(returnTo);
      }
    });
    
    return () => {
      if (authSubscription) {
        authSubscription();
      }
    };
  });

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
        success = 'Check your email for the confirmation link!';
      } else if (mode === 'forgot') {
        await authService.resetPassword(email);
        success = 'Password reset email sent! Check your inbox.';
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
        <h1>Espresso Engineered</h1>
        <p>Community-driven espresso brewing companion</p>
      </div>

      {#if $authStatus === 'profile_missing'}
        <div class="error">
          We couldn't find your barista profile. Try signing out and back in.
        </div>
      {:else if $authStatus === 'error' && $authError}
        <div class="error">
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
            placeholder="your@email.com"
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
              placeholder="Your password"
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
              placeholder="Confirm your password"
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
                placeholder="Your first name"
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
                placeholder="Your last name"
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
              placeholder="How you want to be shown to others"
            />
            <small>Leave empty to use your first and last name</small>
          </div>
        {/if}

        {#if error}
          <div class="error">{error}</div>
        {/if}

        {#if success}
          <div class="success">{success}</div>
        {/if}

        <button type="submit" disabled={loading} class="auth-submit">
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
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
  }

  .auth-container {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .auth-header h1 {
    color: #333;
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
  }

  .auth-header p {
    color: #666;
    margin: 0;
    font-size: 0.9rem;
  }

  .auth-form h2 {
    color: #333;
    font-size: 1.5rem;
    margin: 0 0 1.5rem 0;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  input:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }

  .error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.85rem;
  }

  .auth-submit {
    width: 100%;
    background: #007bff;
    color: white;
    padding: 0.75rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .auth-submit:hover:not(:disabled) {
    background: #0056b3;
  }

  .auth-submit:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .auth-toggle {
    text-align: center;
  }

  .auth-toggle p {
    color: #666;
    margin: 0;
    font-size: 0.9rem;
  }

  .link-button {
    background: none;
    border: none;
    color: #007bff;
    text-decoration: underline;
    cursor: pointer;
    font-size: inherit;
    padding: 0;
  }

  .link-button:hover {
    color: #0056b3;
  }
</style>
