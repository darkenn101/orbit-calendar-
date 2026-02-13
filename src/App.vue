<template>
  <div id="app">
    <div v-if="authStore.loading" class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
    <template v-else>
      <AppNavigation v-if="authStore.user" />
      <main :class="{ 'ml-64': authStore.user }">
        <RouterView />
      </main>
      <NotificationBar />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppNavigation from '@/components/AppNavigation.vue'
import NotificationBar from '@/components/NotificationBar.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>