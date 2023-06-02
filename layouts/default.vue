<template>
  <v-app dark>
    <v-navigation-drawer
      v-model="drawer"
      :clipped="clipped"
      fixed
      app
      color="secondary"
    >
      <v-list>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar
      fixed
      app
      dark
      color="primary"
      class="px-2"
    >
      <v-app-bar-nav-icon v-if="isMobile" @click.stop="drawer = !drawer" />
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-spacer />
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
        <transition-group name="list" tag="v-list">
          <v-list-item
            v-for="(notification) in notifications"
            :key="notification.orderId"
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
      </v-menu>
    </v-app-bar>
    <v-main>
      <v-container>
        <Nuxt />
      </v-container>
    </v-main>
    <v-footer
      :absolute="false"
      app
    >
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import mobileDetector from '~/mixins/mobile-detector'
import { Notification } from '~/store/types'
export default Vue.extend( {
  name: 'DefaultLayout',
  mixins: [mobileDetector],
  data () {
    return {
      clipped: false,
      drawer: false,
      fixed: false,
      items: [
        {
          icon: 'mdi-view-list',
          title: 'Market',
          to: '/'
        },
        {
          icon: 'mdi-book',
          title: 'My Trades',
          to: '/my-trades'
        },
        {
          icon: 'mdi-email',
          title: 'Messages',
          to: '/messages'
        },
        {
          icon: 'mdi-information',
          title: 'About',
          to: '/about'
        }
      ],
      right: true,
      title: 'Mostro',
      menuOpen: false
    }
  },
  mounted() {
    if (!this.isMobile) {
      this.drawer = true
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
      console.log('handleNotification.notification: ', notification)
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
.list-leave-active {
  position: absolute;
  transition: all 0.5s ease-out;
}
.list-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>