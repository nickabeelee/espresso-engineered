<script lang="ts">
  import { authService, barista } from '$lib/auth';

  export let showEditForm = false;
  export let compact = false;

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
  <div class="barista-profile" class:compact>
    {#if compact}
      <!-- Compact display for header/navigation -->
      <div class="profile-compact">
        <div class="profile-avatar">
          {getInitials($barista)}
        </div>
        <span class="profile-name">
          {getDisplayName($barista)}
        </span>
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
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .barista-profile.compact {
    background: none;
    box-shadow: none;
    padding: 0;
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
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
    color: #333;
    font-size: 1.5rem;
  }

  .profile-meta {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .profile-name {
    color: #333;
    font-weight: 500;
  }

  .edit-button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.9rem;
    margin-left: auto;
  }

  .edit-button:hover:not(:disabled) {
    background: #0056b3;
  }

  .edit-button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .edit-form {
    border-top: 1px solid #e5e5e5;
    padding-top: 1.5rem;
  }

  .edit-form h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.25rem;
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

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.85rem;
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

  .profile-loading {
    display: flex;
    justify-content: center;
    padding: 2rem;
  }

  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>