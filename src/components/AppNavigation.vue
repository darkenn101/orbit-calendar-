<template>
  <nav class="bg-white shadow-sm border-r border-gray-200 fixed left-0 top-0 h-full w-64 z-30">
    <div class="flex flex-col h-full">
      <!-- Logo -->
      <div class="flex items-center px-6 py-4 border-b border-gray-200">
        <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
          <span class="text-white font-bold">O</span>
        </div>
        <span class="text-xl font-semibold text-gray-900">Orbit</span>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 px-4 py-6 space-y-2">
        <RouterLink
          to="/"
          class="nav-link"
          :class="{ 'nav-link-active': $route.name === 'Dashboard' }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Dashboard
        </RouterLink>
        
        <RouterLink
          to="/calendar"
          class="nav-link"
          :class="{ 'nav-link-active': $route.name === 'Calendar' }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Calendar
        </RouterLink>
      </div>

      <!-- User Menu -->
      <div class="border-t border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-gray-600">
                {{ userInitial }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ authStore.user?.email }}
              </p>
            </div>
          </div>
          <button
            @click="logout"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            title="Sign out"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userInitial = computed(() => {
  return authStore.user?.email?.charAt(0).toUpperCase() || '?'
})

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-link {
  @apply flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors;
}

.nav-link-active {
  @apply bg-primary-50 text-primary-700 border-r-2 border-primary-500;
}
</style>