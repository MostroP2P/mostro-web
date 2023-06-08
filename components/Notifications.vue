<template>
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
    <template v-slot:activator="{ on }">
      <v-btn icon v-on="on">
        <v-badge dot color="accent" :value="!isMenuDisabled">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>
    <div class="scrollable-menu">
      <transition-group name="list" tag="v-list">
        <v-list-item
          v-for="(notification) in notifications"
          :key="notification.eventId"
          class="notification-item"
          @click="() => handleNotificationClick(notification)"
          three-line
        >
          <v-list-item-content>
            <v-list-item-title>
              📣 {{ notification.title }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ notification.subtitle }}
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-caption text--disabled" style="max-width: 25em">
              Order: {{ notification.orderId }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :key="1000">
          <v-btn text block @click.prevent="clearNotifications">
            <v-icon>mdi-notification-clear-all</v-icon>
          </v-btn>
        </v-list-item>
      </transition-group>
    </div>

  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { Notification } from '~/store/types'

export default Vue.extend({
  data() {
    return {
      menuOpen: false
    }
  },
  methods: {
    clearNotifications() {
      this.notifications.forEach((notification: Notification, index: number) => {
        setTimeout(() => {
          this.$store.dispatch('notifications/dismiss', notification)
        }, index * 200);  // Delay each removal by 200ms
      });
    },
    handleNotificationClick(notification: Notification) {
      this.$store.dispatch('notifications/dismiss', notification)
      this.$router.push(`/my-trades/${notification.orderId}`)
    }
  },
  computed: {
    ...mapGetters({
      notifications: 'notifications/getActiveNotifications'
    }),
    menuCloseDelay() {
      return this.notifications ? this.notifications.length * 200 + 1e3 : 0
    },
    isMenuDisabled() {
      if (!this.notifications || this.notifications.length === 0) {
        return true
      }
      return false
    }
  },
  watch: {
    notifications(newVal) {
      if (newVal.length === 0) {
        this.menuOpen = false;
      }
    }
  }
})
</script>
<style scoped>
.scrollable-menu {
  max-height: 80vh;
  overflow-y: auto;
}
</style>