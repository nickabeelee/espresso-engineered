<script lang="ts">
  import AdminGuard from '$lib/components/AdminGuard.svelte';
  import { page } from '$app/stores';

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/brews', label: 'Brews', icon: '☕' },
    { href: '/admin/baristas', label: 'Baristas', icon: '👤' },
    { href: '/admin/beans', label: 'Beans', icon: '🫘' },
    { href: '/admin/bags', label: 'Bags', icon: '📦' },
    { href: '/admin/grinders', label: 'Grinders', icon: '⚙️' },
    { href: '/admin/machines', label: 'Machines', icon: '🔧' },
    { href: '/admin/roasters', label: 'Roasters', icon: '🏭' }
  ];
</script>

<AdminGuard>
  <div class="min-h-screen bg-gray-100">
    <!-- Admin Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <a href="/" class="text-xl font-bold text-gray-900">
                Espresso Engineered
              </a>
              <span class="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                ADMIN
              </span>
            </div>
            
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              {#each navItems as item}
                <a
                  href={item.href}
                  class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors
                    {$page.url.pathname === item.href 
                      ? 'border-blue-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                >
                  <span class="mr-2">{item.icon}</span>
                  {item.label}
                </a>
              {/each}
            </div>
          </div>

          <div class="flex items-center">
            <a
              href="/"
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Exit Admin
            </a>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div class="sm:hidden">
        <div class="pt-2 pb-3 space-y-1">
          {#each navItems as item}
            <a
              href={item.href}
              class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors
                {$page.url.pathname === item.href
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300'}"
            >
              <span class="mr-2">{item.icon}</span>
              {item.label}
            </a>
          {/each}
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto">
      <slot />
    </main>
  </div>
</AdminGuard>