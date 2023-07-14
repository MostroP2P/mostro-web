<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useNotifications } from '~/stores/notifications'

const notificationsStore = useNotifications()

onMounted(() => {
  notificationsStore.init()
})
</script>
