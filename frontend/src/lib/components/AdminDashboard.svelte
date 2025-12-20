<script lang="ts">
  import { onMount } from 'svelte';
  import { adminService } from '../admin-service.js';


  let dashboardData: {
    totalBrews: number;
    totalBaristas: number;
    recentBrews: Brew[];
    flaggedContent: any[];
  } | null = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      dashboardData = await adminService.getDashboard();
    } catch (err: any) {
      error = err.message || 'Failed to load dashboard data';
    } finally {
      loading = false;
    }
  });

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="p-6">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
    <p class="text-gray-600">Manage content and monitor system activity</p>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading dashboard...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="text-red-400">⚠️</div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    </div>
  {:else if dashboardData}
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="text-3xl">☕</div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Brews</p>
            <p class="text-2xl font-bold text-gray-900">{dashboardData.totalBrews.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="text-3xl">👥</div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Baristas</p>
            <p class="text-2xl font-bold text-gray-900">{dashboardData.totalBaristas.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="text-3xl">🚩</div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Flagged Content</p>
            <p class="text-2xl font-bold text-gray-900">{dashboardData.flaggedContent.length}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="text-3xl">📊</div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">System Status</p>
            <p class="text-sm font-bold text-green-600">Operational</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Recent Brews</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Barista
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brew Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each dashboardData.recentBrews as brew}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {brew.barista?.display_name || 'Unknown'}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {brew.name || `Brew ${brew.id.slice(0, 8)}`}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(brew.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if brew.rating}
                    <div class="flex items-center">
                      <span class="text-sm text-gray-900">{brew.rating}/5</span>
                      <div class="ml-2 flex">
                        {#each Array(5) as _, i}
                          <span class="text-yellow-400">
                            {i < brew.rating ? '★' : '☆'}
                          </span>
                        {/each}
                      </div>
                    </div>
                  {:else}
                    <span class="text-sm text-gray-400">Not rated</span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if brew.yield_g}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Complete
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
