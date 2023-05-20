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
        :close-on-click="false"
        :close-on-content-click="false"
        :close-delay="5000"
      >
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on">
            <v-badge dot color="accent">
              <v-icon>mdi-bell-outline</v-icon>
            </v-badge>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="(notification, i) in notifications"
            :key="i"
            class="notification-item"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ notification.title }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ notification.subtitle }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-btn text block @click.prevent="clearNotifications">
              <v-icon>mdi-notification-clear-all</v-icon>
            </v-btn>
          </v-list-item>
        </v-list>
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

<script>
import mobileDetector from '~/mixins/mobile-detector'
export default {
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
      menuOpen: false,
      notifications: [
        { title: 'Order taken', subtitle: 'Your sell order was taken, click here to proceed'},
        { title: 'Order taken', subtitle: 'Your buy order was taken, click here to proceed'}
      ]
    }
  },
  mounted() {
    if (!this.isMobile) {
      this.drawer = true
    }
  },
  methods: {
    clearNotifications() {
      this.notifications.forEach((_, index) => {
        setTimeout(() => {
          this.notifications.splice(index, 1);
        }, index * 200);  // Delay each removal by 200ms
      });
    }
  },
  watch: {
    notifications(newVal) {
      if (newVal.length === 0) {
        this.menuOpen = false;
      }
    }
  }
}
</script>
<style scoped>
.notification-item {
  transition: all 0.5s ease;
}

.notification-item.leave-active {
  opacity: 0;
  transform: translateX(100%);
}
</style>