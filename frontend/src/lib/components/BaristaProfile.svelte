<script lang="ts">
  import { authService, barista } from '$lib/auth';
  import IconButton from '$lib/components/IconButton.svelte';
  import { CheckCircle, PencilSquare, XMark } from '$lib/icons';

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

</script>

{#if $barista}
  <div class="barista-profile" class:compact class:minimal>
    {#if compact}
      <!-- Compact display for header/navigation -->
      <div class="profile-compact">
        <span class="profile-name">
          {getDisplayName($barista)}
        </span>
      </div>
    {:else}
      <!-- Full profile display -->
      <div class="profile-header">
        <div class="profile-info">
          <h2>{getDisplayName($barista)}</h2>
          <p class="profile-meta">
            Member since {new Date($barista.created_at).toLocaleDateString()}
          </p>
        </div>
        {#if showEditForm}
          <div class="profile-actions">
            <IconButton on:click={startEdit} ariaLabel="Edit profile" variant="accent" disabled={editMode}>
              <PencilSquare />
            </IconButton>
          </div>
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
              placeholder="e.g., Ada"
            />
          </div>

          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              bind:value={lastName}
              disabled={loading}
              placeholder="e.g., Lovelace"
            />
          </div>

          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              bind:value={displayName}
              disabled={loading}
              placeholder="e.g., Ada L."
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
            <IconButton
              type="submit"
              ariaLabel={loading ? 'Saving profile' : 'Save profile'}
              title={loading ? 'Saving...' : 'Save changes'}
              variant="success"
              disabled={loading}
            >
              <CheckCircle />
            </IconButton>
            <IconButton type="button" on:click={cancelEdit} ariaLabel="Cancel profile edit" title="Cancel" variant="neutral" disabled={loading}>
              <XMark />
            </IconButton>
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
    border: none;
  }

  .profile-compact {
    display: flex;
    align-items: center;
  }

  .profile-header {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
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

  .barista-profile.compact .profile-name {
    color: var(--text-ink-inverted);
    letter-spacing: 0.02em;
    font-size: 0.9rem;
  }

  .profile-actions {
    margin-left: auto;
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
