<template>
  <v-badge dot color="success" :model-value="!isMenuDisabled" offset-x="10" offset-y="8">
    <v-menu
      offset-y
      content-class="pa-0"
      v-model="menuOpen"
      :disabled="isMenuDisabled"
      open-on-hover
      :close-on-click="false"
      :close-on-content-click="false"
      :close-delay="menuCloseDelay"
    >
      <template v-slot:activator="{ props }">
        <v-btn icon="mdi-bell-outline" color="white" variant="plain" v-bind="props"></v-btn>
      </template>
      <v-list class="scrollable-menu" three-line>
        <transition-group name="list" tag="v-list">
          <v-list-item
            v-for="(notification) in notifications"
            :key="notification.eventId"
            class="my-1 notification-item"
            @click="() => handleNotificationClick(notification)"
            three-line
            prepend-icon="mdi-alert-circle"
          >
              <v-list-item-title>
                📣 {{ notification.title }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ notification.subtitle }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-caption text--disabled" style="max-width: 25em">
                Order: {{ notification.orderId }}
              </v-list-item-subtitle>
              <v-divider :key="`div-${notification.eventId}`"/>
          </v-list-item>
          <v-list-item :key="1000">
            <v-btn text block @click.prevent="clearNotifications">
              <v-icon>mdi-notification-clear-all</v-icon>
            </v-btn>
          </v-list-item>
        </transition-group>
      </v-list>

    </v-menu>
  </v-badge>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNotifications } from '@/stores/notifications'
import { Notification } from '~/stores/types'
import { useAuth } from '~/stores/auth'

const notificationStore = useNotifications()
const router = useRouter()
let menuOpen = ref(false)
const authStore = useAuth()

const notifications = computed(() => notificationStore.getActiveNotifications)
const menuCloseDelay = computed(() => notifications.value.length * 200 + 1e3)
const isMenuDisabled = computed(() => {
  if (authStore.isLocked) {
    return true
  }
  if (!notifications.value || notifications.value.length === 0) {
    return true
  }
  const notDismissedIndex = notifications.value.findIndex((notification: Notification) => {
    return notification.dismissed === false
  })
  return notDismissedIndex === -1
})

const clearNotifications = () => {
  notifications.value.forEach((notification: Notification, index: number) => {
    setTimeout(() => {
      notificationStore.dismiss(notification)
    }, index * 500);  // Delay each removal by 500ms
  })
}
const handleNotificationClick = (notification: Notification) => {
  notificationStore.dismiss(notification)
  router.push(`/my-trades/${notification.orderId}`)
  menuOpen.value = false
}
</script>

<style scoped>
.scrollable-menu {
  max-height: 80vh;
  overflow-y: auto;
}
.list-leave-active,
.list-leave-to {
  opacity: 0;
  transform: translateX(100px);
  transition: all 0.5s ease-out;
}

.list-leave {
  opacity: 1;
  transform: translateX(0);
}

</style>