<template>
  <div>
    <IndexedDBWarning />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useNotificationsStore } from '~/stores/notifications'
import { useAuth } from '~/stores/auth'

const notificationsStore = useNotificationsStore()
const auth = useAuth()

// Only initialize on client-side
onMounted(() => {
  if (import.meta.client) {
    notificationsStore.init()
    auth.nuxtClientInit()
  }
})
</script>
