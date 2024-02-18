<template>
  <div class="d-flex justify-center align-center flex-column mt-0 pt-2 mb-3">
    <v-avatar color="primary">
      <v-icon dark large>
        mdi-account-circle
      </v-icon>
    </v-avatar>
    <client-only>
      <div v-if="!isLoggedIn">
        <registration-dialog v-if="!hasEncryptedKey"/>
        <login-dialog v-if="hasEncryptedKey"/>
      </div>
      <div v-else class="mt-5 d-flex flex-column align-center justify-center">
        <v-btn outlined @click="onLogout">Logout</v-btn>
      </div>
    </client-only>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAuth } from '@/stores/auth'

const authStore = useAuth()

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

