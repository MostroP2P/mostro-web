<template>
  <div class="d-flex justify-center align-center flex-column mt-0 pt-2 mb-3">
    <v-avatar color="primary" size="x-large" style="border: 1.2px solid rgba(38, 82, 49, 0.3);" variant="elevated">
      <v-img :src="profilePic" v-if="hasProfilepic"/>
      <v-icon dark large v-else>
        mdi-account-circle
      </v-icon>
    </v-avatar>
    <div class="font-weight-light text-disabled text-subtitle-1" style="min-height: 28px">
      {{ userName ? userName : '' }}
    </div>
    <client-only>
      <div v-if="!isLoggedIn">
        <registration-dialog v-if="!hasEncryptedKey"/>
        <login-dialog v-if="hasEncryptedKey"/>
      </div>
      <div v-else class="mt-5 d-flex flex-column align-center justify-center">
        <v-btn outlined @click="onLogout" prepend-icon="mdi-logout-variant">Logout</v-btn>
      </div>
    </client-only>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useAuth } from '@/stores/auth'
import type { Nostr } from '~/plugins/01-nostr'

const profilePic = ref<string | undefined>(undefined)
const userName = ref<string | undefined>(undefined)

const hasProfilepic = computed<boolean>(() => profilePic.value !== undefined)

const authStore = useAuth()

watch(() => authStore.pubKey, (newPubkey: string | null) => {
  if (newPubkey) {
    const nuxt = useNuxtApp()
    const $nostr: Nostr = nuxt.$nostr as Nostr
    if ($nostr) {
      $nostr.fetchProfile({ pubkey: newPubkey }).then(profile => {
        if (profile) {
          const { name, image, username } = profile
          if (image) {
            profilePic.value = image
          }
          if (username) {
            userName.value = username
          }
          if (name) {
            userName.value = name
          }
        }
      })
    }
  } else {
    profilePic.value = undefined
    userName.value = undefined
  }
})

const onLogout = () => {
  authStore.logout()
}

const hasEncryptedKey = computed<boolean>(() => {
  return authStore.encryptedPrivateKey !== null
})

const isLoggedIn = computed<boolean>(() => {
  return authStore.isAuthenticated
})
</script>

