<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useNotificationsStore } from '~/stores/notifications'

const notificationsStore = useNotificationsStore()

onMounted(() => {
  notificationsStore.init()
})
</script>
