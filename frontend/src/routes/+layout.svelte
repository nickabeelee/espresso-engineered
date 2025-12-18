<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  
  // Basic layout component - will be expanded in later tasks
  onMount(() => {
    // Initialize auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle auth state changes
      console.log('Auth state changed:', event, session?.user?.id);
    });

    return () => subscription.unsubscribe();
  });
</script>

<main>
  <slot />
</main>

<style>
  main {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }
</style>