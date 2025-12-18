<script lang="ts">
  import { onMount } from 'svelte';
  import { adminService } from '../admin-service.js';


  export let entityType: 'brews' | 'beans' | 'bags' | 'grinders' | 'machines' | 'roasters' | 'baristas';

  let entities: any[] = [];
  let loading = true;
  let error = '';
  let selectedEntity: any = null;
  let showEditModal = false;
  let showDeleteConfirm = false;
  let entityToDelete: any = null;

  const entityConfig = {
    brews: {
      title: 'Brews',
      icon: '☕',
      fields: ['name', 'barista_id', 'dose_mg', 'yield_mg', 'rating', 'created_at']
    },
    beans: {
      title: 'Beans',
      icon: '🫘',
      fields: ['name', 'roaster_id', 'roast_level', 'country_of_origin', 'created_at']
    },
    bags: {
      title: 'Bags',
      icon: '📦',
      fields: ['bean_id', 'owner_id', 'roast_date', 'weight_mg', 'price', 'created_at']
    },
    grinders: {
      title: 'Grinders',
      icon: '⚙️',
      fields: ['name', 'manufacturer', 'setting_guide_chart_url', 'created_at']
    },
    machines: {
      title: 'Machines',
      icon: '🔧',
      fields: ['name', 'manufacturer', 'user_manual_link', 'created_at']
    },
    roasters: {
      title: 'Roasters',
      icon: '🏭',
      fields: ['name', 'website_url', 'created_at']
    },
    baristas: {
      title: 'Baristas',
      icon: '👤',
      fields: ['display_name', 'first_name', 'last_name', 'created_at']
    }
  };

  onMount(async () => {
    await loadEntities();
  });

  async function loadEntities() {
    try {
      loading = true;
      switch (entityType) {
        case 'brews':
          entities = await adminService.getAllBrews();
          break;
        case 'beans':
          entities = await adminService.getAllBeans();
          break;
        case 'bags':
          entities = await adminService.getAllBags();
          break;
        case 'grinders':
          entities = await adminService.getAllGrinders();
          break;
        case 'machines':
          entities = await adminService.getAllMachines();
          break;
        case 'roasters':
          entities = await adminService.getAllRoasters();
          break;
        case 'baristas':
          entities = await adminService.getAllBaristas();
          break;
      }
    } catch (err: any) {
      error = err.message || `Failed to load ${entityType}`;
    } finally {
      loading = false;
    }
  }

  function openEditModal(entity: any) {
    selectedEntity = { ...entity };
    showEditModal = true;
  }

  function closeEditModal() {
    selectedEntity = null;
    showEditModal = false;
  }

  async function saveEntity() {
    if (!selectedEntity) return;

    try {
      switch (entityType) {
        case 'brews':
          await adminService.updateBrew(selectedEntity.id, selectedEntity);
          break;
        case 'beans':
          await adminService.updateBean(selectedEntity.id, selectedEntity);
          break;
        case 'bags':
          await adminService.updateBag(selectedEntity.id, selectedEntity);
          break;
        case 'grinders':
          await adminService.updateGrinder(selectedEntity.id, selectedEntity);
          break;
        case 'machines':
          await adminService.updateMachine(selectedEntity.id, selectedEntity);
          break;
        case 'roasters':
          await adminService.updateRoaster(selectedEntity.id, selectedEntity);
          break;
      }
      
      closeEditModal();
      await loadEntities();
    } catch (err: any) {
      error = err.message || 'Failed to save entity';
    }
  }

  function confirmDelete(entity: any) {
    entityToDelete = entity;
    showDeleteConfirm = true;
  }

  async function deleteEntity() {
    if (!entityToDelete) return;

    try {
      switch (entityType) {
        case 'brews':
          await adminService.deleteBrew(entityToDelete.id);
          break;
        case 'beans':
          await adminService.deleteBean(entityToDelete.id);
          break;
        case 'bags':
          await adminService.deleteBag(entityToDelete.id);
          break;
        case 'grinders':
          await adminService.deleteGrinder(entityToDelete.id);
          break;
        case 'machines':
          await adminService.deleteMachine(entityToDelete.id);
          break;
        case 'roasters':
          await adminService.deleteRoaster(entityToDelete.id);
          break;
      }
      
      showDeleteConfirm = false;
      entityToDelete = null;
      await loadEntities();
    } catch (err: any) {
      error = err.message || 'Failed to delete entity';
    }
  }

  function formatValue(value: any, field: string): string {
    if (value === null || value === undefined) return '-';
    
    if (field.includes('date') || field.includes('_at')) {
      return new Date(value).toLocaleDateString();
    }
    
    if (field.includes('_mg')) {
      return `${value}mg`;
    }
    
    if (field === 'price') {
      return `$${value}`;
    }
    
    return value.toString();
  }

  const config = entityConfig[entityType];
</script>

<div class="p-6">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 flex items-center">
        <span class="text-3xl mr-3">{config.icon}</span>
        Manage {config.title}
      </h1>
      <p class="text-gray-600 mt-1">View and manage all {config.title.toLowerCase()} in the system</p>
    </div>
    <button 
      on:click={loadEntities}
      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Refresh
    </button>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="text-red-400">⚠️</div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading {config.title.toLowerCase()}...</span>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">
          {entities.length} {config.title}
        </h2>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              {#each config.fields as field}
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.replace(/_/g, ' ')}
                </th>
              {/each}
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each entities as entity}
              <tr class="hover:bg-gray-50">
                {#each config.fields as field}
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatValue(entity[field], field)}
                  </td>
                {/each}
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {#if entityType !== 'baristas'}
                    <button 
                      on:click={() => openEditModal(entity)}
                      class="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button 
                      on:click={() => confirmDelete(entity)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  {:else}
                    <span class="text-gray-400">View only</span>
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

<!-- Edit Modal -->
{#if showEditModal && selectedEntity}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Edit {config.title.slice(0, -1)}
        </h3>
        
        <div class="space-y-4">
          {#each config.fields.filter(f => !f.includes('_at') && f !== 'id') as field}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <input
                type="text"
                bind:value={selectedEntity[field]}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          {/each}
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button
            on:click={closeEditModal}
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            on:click={saveEntity}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && entityToDelete}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Confirm Deletion</h3>
        <p class="text-sm text-gray-500 mb-6">
          Are you sure you want to delete this {config.title.slice(0, -1).toLowerCase()}? This action cannot be undone.
        </p>
        
        <div class="flex justify-center space-x-3">
          <button
            on:click={() => { showDeleteConfirm = false; entityToDelete = null; }}
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            on:click={deleteEntity}
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

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