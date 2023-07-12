<template>
  <v-app dark elevation="4" border="3">
    <v-navigation-drawer
      v-model="drawer"
      :clipped="clipped"
      fixed
      app
      color="secondary-darken-1"
    >
      <v-list>
        <auth-status/>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          router
          exact
        >
          <div class="d-flex">
            <v-icon class="mr-3">{{ item.icon }}</v-icon>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </div>
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
      <notifications/>
    </v-app-bar>
    <v-main>
      <v-container>
        <slot />
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
import { defineComponent } from 'vue'
import mobileDetector from '~/mixins/mobile-detector'
export default defineComponent( {
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
      title: 'Mostro'    }
  },
  mounted() {
    if (!this.isMobile) {
      this.drawer = true
    }
  }
})
</script>
