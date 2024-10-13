<template>
  <v-app dark elevation="4" border="3">
    <v-navigation-drawer
      v-model="drawer"
      :clipped="false"
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
          :disabled="item.disabled()"
          :prepend-icon="item.icon"
        >
          <div class="d-flex">
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </div>
        </v-list-item>
      </v-list>
      <template v-slot:append>
        <div class="d-flex justify-center">
          <div class="text-subtitle-1 text-disabled mr-2">
            Relay Health
          </div>
          <v-icon class="text-disabled d-flex justify-center">
            mdi-signal
          </v-icon>
        </div>
        <div class="d-flex justify-center relay-status">
          <v-tooltip
            v-for="relay in relaysStore.relays"
            location="top"
            :text="relay.url"
            open-on-click
          >
            <template v-slot:activator="{ props }">
              <div
                v-bind="props"
                :key="relay.url"
                class="relay-dot"
                :style="{ backgroundColor: relay.status }">
              </div>
            </template>
          </v-tooltip>
        </div>
        <div class="text-caption text-disabled d-flex justify-center">
          Version: {{ version }}
        </div>
        <v-tooltip :text="originalText" location="top">
          <template v-slot:activator="{ props }">
            <div v-bind="props" class="text-caption text-disabled d-flex justify-center">
              {{ commitHash }}
            </div>
          </template>
        </v-tooltip>
      </template>
    </v-navigation-drawer>
    <v-app-bar
      fixed
      app
      dark
      color="primary"
      class="px-2"
    >
      <template v-slot:prepend>
        <v-app-bar-nav-icon v-if="mobile" @click.stop="drawer = !drawer" color="white"/>
      </template>
      <v-app-bar-title>
        Mostro
        <v-chip
          color="warning"
          size="x-small"
          class="ml-2"
        >
          Beta
        </v-chip>
      </v-app-bar-title>
      <v-spacer />
      <client-only>
        <notifications/>
      </client-only>
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
<script setup>
import { ref, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useAuth } from '@/stores/auth'
import { useRelays } from '@/stores/relays'
import { GIT_COMMIT } from '~/constants/version'
import useEllipsis from '~/composables/useEllipsis'
import pkg from '~/package.json'

const { ellipsizedText, originalText } = useEllipsis(GIT_COMMIT, 10)
const commitHash = ellipsizedText.value
const version = ref(pkg.version)

const relaysStore = useRelays()
const authStore = useAuth()
const drawer = ref(true)
const items = ref([
  {
    icon: 'mdi-view-list',
    title: 'Market',
    to: '/',
    disabled: () => false
  },
  {
    icon: 'mdi-book',
    title: 'My Trades',
    to: '/my-trades',
    disabled: () => !authStore.isAuthenticated
  },
  {
    icon: 'mdi-email',
    title: 'Messages',
    to: '/messages',
    disabled: () => !authStore.isAuthenticated
  },
  {
    icon: 'mdi-cog',
    title: 'Settings',
    to: '/settings',
    disabled: () => !authStore.isAuthenticated
  },
  {
    icon: 'mdi-information',
    title: 'About',
    to: '/about',
    disabled: () => false
  }
])

const { mobile } = useDisplay()

onMounted(() => {
  if (mobile.value) {
    drawer.value = false
  }
})
</script>

<style scoped>
.relay-status {
  margin: 10px;
  border-radius: 5px;
  background: #bbf3be;
}
.relay-dot {
  width: 10px;
  height: 10px;
  border: 0.5px solid #000;
  border-radius: 50%;
  margin: 5px;
}
</style>
