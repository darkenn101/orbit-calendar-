<template>
  <nav class="bg-elevated shadow-sm border-r border-line fixed left-0 top-0 h-full w-64 z-30">
    <div class="flex flex-col h-full">
      <!-- Logo -->
      <div class="flex items-center px-6 py-4 border-b border-line">
        <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
          <span class="text-white font-bold">O</span>
        </div>
        <span class="text-xl font-semibold text-ink">Orbit</span>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 px-4 py-6 space-y-2">
        <RouterLink
          to="/"
          class="nav-link"
          :class="{ 'nav-link-active': $route.name === 'Dashboard' }"
        >
          <Squares2X2Icon class="w-5 h-5" />
          Dashboard
        </RouterLink>

        <RouterLink
          to="/reminders"
          class="nav-link"
          :class="{ 'nav-link-active': $route.name === 'Reminders' }"
        >
          <BellIcon class="w-5 h-5" />
          Reminders
        </RouterLink>

        <RouterLink
          to="/notes"
          class="nav-link"
          :class="{ 'nav-link-active': $route.name === 'Notes' }"
        >
          <DocumentTextIcon class="w-5 h-5" />
          Notes
        </RouterLink>

        <RouterLink
          to="/calendar"
          class="nav-link"
          :class="{ 'nav-link-active': $route.name === 'Calendar' }"
        >
          <CalendarIcon class="w-5 h-5" />
          Calendar
        </RouterLink>
      </div>

      <!-- User Menu -->
      <div class="border-t border-line p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 min-w-0">
            <div class="w-8 h-8 bg-overlay rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-sm font-medium text-ink-muted">
                {{ userInitial }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink truncate">
                {{ authStore.user?.email }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <button
              @click="logout"
              class="text-ink-subtle hover:text-ink transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Squares2X2Icon, BellIcon, DocumentTextIcon, CalendarIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import ThemeToggle from '@/components/ThemeToggle.vue'

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
  @apply flex items-center space-x-3 px-3 py-2 text-sm font-medium text-ink-muted rounded-md hover:bg-overlay hover:text-ink transition-colors;
}

.nav-link-active {
  @apply bg-primary-50 text-primary-700 border-r-2 border-primary-500;
}

:global(.dark) .nav-link-active {
  @apply bg-primary-700/30 text-primary-50;
}
</style>
