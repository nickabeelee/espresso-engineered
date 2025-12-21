<script lang="ts">
  import { authService, barista } from '$lib/auth';

  export let showEditForm = false;
  export let compact = false;
  export let minimal = false;

  let editMode = false;
  let loading = false;
  let error = null;
  let success = null;

  // Form fields
  let firstName = '';
  let lastName = '';
  let displayName = '';

  $: if ($barista && !editMode) {
    // Update form fields when barista data changes
    firstName = $barista.first_name || '';
    lastName = $barista.last_name || '';
    displayName = $barista.display_name || '';
  }

  function startEdit() {
    if (!$barista) return;
    
    firstName = $barista.first_name || '';
    lastName = $barista.last_name || '';
    displayName = $barista.display_name || '';
    editMode = true;
    error = null;
    success = null;
  }

  function cancelEdit() {
    editMode = false;
    error = null;
    success = null;
  }

  async function saveProfile() {
    if (!$barista) return;

    loading = true;
    error = null;
    success = null;

    try {
      await authService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: displayName.trim()
      });

      success = 'Profile updated successfully!';
      editMode = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update profile';
    } finally {
      loading = false;
    }
  }

  function getDisplayName(barista: Barista): string {
    if (barista.display_name) return barista.display_name;
    if (barista.first_name && barista.last_name) {
      return `${barista.first_name} ${barista.last_name}`;
    }
    if (barista.first_name) return barista.first_name;
    return 'Anonymous Barista';
  }

  function getInitials(barista: Barista): string {
    const displayName = getDisplayName(barista);
    const words = displayName.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }
</script>

{#if $barista}
  <div class="barista-profile" class:compact class:minimal>
    {#if compact}
      <!-- Compact display for header/navigation -->
      <div class="profile-compact">
        <div class="profile-avatar">
          {getInitials($barista)}
        </div>
        {#if !minimal}
          <span class="profile-name">
            {getDisplayName($barista)}
          </span>
        {/if}
      </div>
    {:else}
      <!-- Full profile display -->
      <div class="profile-header">
        <div class="profile-avatar large">
          {getInitials($barista)}
        </div>
        <div class="profile-info">
          <h2>{getDisplayName($barista)}</h2>
          <p class="profile-meta">
            Member since {new Date($barista.created_at).toLocaleDateString()}
          </p>
        </div>
        {#if showEditForm}
          <button 
            on:click={startEdit} 
            class="edit-button"
            disabled={editMode}
          >
            Edit Profile
          </button>
        {/if}
      </div>

      {#if showEditForm && editMode}
        <form on:submit|preventDefault={saveProfile} class="edit-form">
          <h3>Edit Profile</h3>
          
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              bind:value={firstName}
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
              disabled={loading}
              placeholder="Your last name"
            />
          </div>

          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              bind:value={displayName}
              disabled={loading}
              placeholder="How you want to be shown to others"
            />
            <small>Leave empty to use your first and last name</small>
          </div>

          {#if error}
            <div class="error">{error}</div>
          {/if}

          {#if success}
            <div class="success">{success}</div>
          {/if}

          <div class="form-actions">
            <button type="submit" disabled={loading} class="save-button">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" on:click={cancelEdit} disabled={loading} class="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      {/if}
    {/if}
  </div>
{:else}
  <div class="profile-loading">
    <div class="loading-spinner"></div>
  </div>
{/if}

<style>
  .barista-profile {
    background: var(--bg-surface-paper-secondary);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    border: 1px solid rgba(123, 94, 58, 0.2);
    box-shadow: var(--shadow-soft);
  }

  .barista-profile.compact {
    background: none;
    box-shadow: none;
    padding: 0;
  }

  .barista-profile.compact.minimal .profile-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }

  .profile-compact {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .profile-avatar {
    width: 40px;
    height: 40px;
    background: radial-gradient(circle at top, rgba(176, 138, 90, 0.8), rgba(64, 43, 21, 0.9));
    color: var(--text-ink-inverted);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .profile-avatar.large {
    width: 60px;
    height: 60px;
    font-size: 1.2rem;
  }

  .profile-info h2 {
    margin: 0 0 0.25rem 0;
    color: var(--text-ink-primary);
    font-size: 1.5rem;
  }

  .profile-meta {
    margin: 0;
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .profile-name {
    color: var(--text-ink-primary);
    font-weight: 500;
  }

  .edit-button {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    border: 1px solid var(--accent-primary);
    padding: 0.45rem 1.1rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-left: auto;
  }

  .edit-button:hover:not(:disabled) {
    background: var(--accent-primary-dark);
  }

  .edit-button:disabled {
    background: rgba(123, 94, 58, 0.4);
    cursor: not-allowed;
  }

  .edit-form {
    border-top: 1px solid var(--border-subtle);
    padding-top: 1.5rem;
  }

  .edit-form h3 {
    margin: 0 0 1rem 0;
    color: var(--text-ink-primary);
    font-size: 1.25rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-ink-primary);
    font-weight: 500;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .form-group input:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
  }

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: var(--text-ink-muted);
    font-size: 0.85rem;
  }

  .error {
    background: rgba(122, 62, 47, 0.12);
    border: 1px solid rgba(122, 62, 47, 0.25);
    color: var(--semantic-error);
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .success {
    background: rgba(85, 98, 74, 0.18);
    border: 1px solid rgba(85, 98, 74, 0.3);
    color: var(--semantic-success);
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
  }

  .save-button {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    border: 1px solid var(--accent-primary);
    padding: 0.6rem 1.4rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 1rem;
  }

  .save-button:hover:not(:disabled) {
    background: var(--accent-primary-dark);
  }

  .save-button:disabled {
    background: rgba(123, 94, 58, 0.4);
    cursor: not-allowed;
  }

  .cancel-button {
    background: transparent;
    color: var(--text-ink-secondary);
    border: 1px solid var(--border-strong);
    padding: 0.6rem 1.4rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 1rem;
  }

  .cancel-button:hover:not(:disabled) {
    background: rgba(123, 94, 58, 0.12);
  }

  .cancel-button:disabled {
    cursor: not-allowed;
  }

  .profile-loading {
    display: flex;
    justify-content: center;
    padding: 2rem;
  }

  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(214, 199, 174, 0.2);
    border-top: 3px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
