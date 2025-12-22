<script lang="ts">
  import { onMount } from 'svelte';
  import { authService, barista, isAuthenticated } from '$lib/auth';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BaristaProfile from '$lib/components/BaristaProfile.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { ArrowDownTray, XMark } from '$lib/icons';

  let passwordChangeMode = false;
  let currentPassword = '';
  let newPassword = '';
  let confirmNewPassword = '';
  let passwordLoading = false;
  let passwordError = null;
  let passwordSuccess = null;

  function startPasswordChange() {
    passwordChangeMode = true;
    currentPassword = '';
    newPassword = '';
    confirmNewPassword = '';
    passwordError = null;
    passwordSuccess = null;
  }

  function cancelPasswordChange() {
    passwordChangeMode = false;
    currentPassword = '';
    newPassword = '';
    confirmNewPassword = '';
    passwordError = null;
    passwordSuccess = null;
  }

  async function handlePasswordChange(event: Event) {
    event.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      passwordError = 'New passwords do not match';
      return;
    }

    if (newPassword.length < 6) {
      passwordError = 'Password must be at least 6 characters long';
      return;
    }

    passwordLoading = true;
    passwordError = null;
    passwordSuccess = null;

    try {
      // First verify current password by attempting to sign in
      const currentUser = authService.getCurrentUser();
      if (!currentUser?.email) {
        throw new Error('No current user found');
      }

      // Test current password
      await authService.signIn(currentUser.email, currentPassword);
      
      // Update to new password
      await authService.updatePassword(newPassword);
      
      passwordSuccess = 'Password updated successfully!';
      cancelPasswordChange();
    } catch (err) {
      passwordError = err instanceof Error ? err.message : 'Failed to update password';
    } finally {
      passwordLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Profile - Espresso Engineered</title>
  <meta name="description" content="Manage your barista profile and account settings" />
</svelte:head>

<AuthGuard>
  <div class="profile-page">
    <div class="page-header">
      <p class="voice-line">It is good to see you again.</p>
      <h1>Profile</h1>
      <p>Keep your record and security aligned.</p>
    </div>

    <div class="profile-sections">
      <!-- Barista Profile Section -->
      <section class="profile-section">
        <h2>Profile Information</h2>
        <BaristaProfile showEditForm={true} />
      </section>

      <!-- Password Change Section -->
      <section class="profile-section">
        <h2>Password & Security</h2>
        
        {#if !passwordChangeMode}
          <div class="password-section">
            <p>Keep your account secure with a strong password.</p>
            <button on:click={startPasswordChange} class="btn-primary change-password-btn">
              Change Password
            </button>
          </div>
        {:else}
          <form on:submit={handlePasswordChange} class="password-form">
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                bind:value={currentPassword}
                required
                disabled={passwordLoading}
                placeholder="e.g., current password"
              />
            </div>

            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                bind:value={newPassword}
                required
                disabled={passwordLoading}
                placeholder="e.g., new password"
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label for="confirmNewPassword">Confirm New Password</label>
              <input
                id="confirmNewPassword"
                type="password"
                bind:value={confirmNewPassword}
                required
                disabled={passwordLoading}
                placeholder="e.g., re-enter new password"
                minlength="6"
              />
            </div>

            {#if passwordError}
              <div class="notice error">{passwordError}</div>
            {/if}

            {#if passwordSuccess}
              <div class="notice success">{passwordSuccess}</div>
            {/if}

            <div class="form-actions">
              <IconButton
                type="submit"
                ariaLabel={passwordLoading ? 'Updating password' : 'Save password'}
                title={passwordLoading ? 'Updating...' : 'Save password'}
                variant="accent"
                disabled={passwordLoading}
              >
                <ArrowDownTray />
              </IconButton>
              <IconButton type="button" on:click={cancelPasswordChange} ariaLabel="Cancel password change" title="Cancel" variant="neutral" disabled={passwordLoading}>
                <XMark />
              </IconButton>
            </div>
          </form>
        {/if}
      </section>

      <!-- Account Information Section -->
      <section class="profile-section">
        <h2>Account Information</h2>
        {#if $barista}
          <div class="account-info">
            <div class="info-item">
              <label>Member Since</label>
              <span>{new Date($barista.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="info-item">
              <label>Account ID</label>
              <span class="account-id">{$barista.id}</span>
            </div>
          </div>
        {/if}
      </section>
    </div>
  </div>
</AuthGuard>

<style>
  .profile-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .page-header {
    text-align: left;
  }

  .page-header h1 {
    color: var(--text-ink-primary);
    font-size: 2.2rem;
    margin: 0 0 0.5rem 0;
  }

  .page-header p {
    color: var(--text-ink-muted);
    font-size: 1rem;
    margin: 0;
  }

  .profile-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .profile-section {
    background: var(--bg-surface-paper-secondary);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    border: 1px solid rgba(123, 94, 58, 0.2);
    box-shadow: var(--shadow-soft);
  }

  .profile-section h2 {
    color: var(--text-ink-primary);
    font-size: 1.5rem;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-subtle);
  }

  .password-section {
    text-align: center;
    padding: 2rem 0;
  }

  .password-section p {
    color: var(--text-ink-muted);
    margin-bottom: 1.5rem;
  }

  .change-password-btn {
    font-size: 1rem;
  }

  .password-form {
    max-width: 400px;
    margin: 0 auto;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .account-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(123, 94, 58, 0.2);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-item label {
    font-weight: 500;
    color: var(--text-ink-primary);
  }

  .info-item span {
    color: var(--text-ink-muted);
  }

  .account-id {
    font-family: "IBM Plex Mono", "Courier New", monospace;
    font-size: 0.9rem;
    background: var(--bg-surface-paper-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .page-header h1 {
      font-size: 1.9rem;
    }

    .profile-section {
      padding: 1rem;
    }

    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  }
</style>
