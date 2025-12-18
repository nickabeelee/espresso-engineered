<script lang="ts">
  import { onMount } from 'svelte';
  import { authService, barista, isAuthenticated } from '$lib/auth';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BaristaProfile from '$lib/components/BaristaProfile.svelte';

  let passwordChangeMode = false;
  let currentPassword = '';
  let newPassword = '';
  let confirmNewPassword = '';
  let passwordLoading = false;
  let passwordError: string | null = null;
  let passwordSuccess: string | null = null;

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
      <h1>My Profile</h1>
      <p>Manage your barista profile and account settings</p>
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
            <button on:click={startPasswordChange} class="change-password-btn">
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
                placeholder="Enter your current password"
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
                placeholder="Enter your new password"
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
                placeholder="Confirm your new password"
                minlength="6"
              />
            </div>

            {#if passwordError}
              <div class="error">{passwordError}</div>
            {/if}

            {#if passwordSuccess}
              <div class="success">{passwordSuccess}</div>
            {/if}

            <div class="form-actions">
              <button type="submit" disabled={passwordLoading} class="save-button">
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button type="button" on:click={cancelPasswordChange} disabled={passwordLoading} class="cancel-button">
                Cancel
              </button>
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
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .page-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .page-header h1 {
    color: #333;
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
  }

  .page-header p {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
  }

  .profile-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .profile-section {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .profile-section h2 {
    color: #333;
    font-size: 1.5rem;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e5e5;
  }

  .password-section {
    text-align: center;
    padding: 2rem 0;
  }

  .password-section p {
    color: #666;
    margin-bottom: 1.5rem;
  }

  .change-password-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
  }

  .change-password-btn:hover {
    background: #0056b3;
  }

  .password-form {
    max-width: 400px;
    margin: 0 auto;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .form-group input:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }

  .error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 0.75rem;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    padding: 0.75rem;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .save-button {
    background: #28a745;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
  }

  .save-button:hover:not(:disabled) {
    background: #218838;
  }

  .save-button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .cancel-button {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
  }

  .cancel-button:hover:not(:disabled) {
    background: #545b62;
  }

  .cancel-button:disabled {
    cursor: not-allowed;
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
    border-bottom: 1px solid #f0f0f0;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-item label {
    font-weight: 500;
    color: #333;
  }

  .info-item span {
    color: #666;
  }

  .account-id {
    font-family: monospace;
    font-size: 0.9rem;
    background: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .profile-page {
      padding: 1rem 0.5rem;
    }

    .page-header h1 {
      font-size: 2rem;
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