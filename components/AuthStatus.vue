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

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useAuth, AuthMethod, AUTH_LOCAL_STORAGE_KEY } from '@/stores/auth'

export default defineComponent({
  setup() {
    const authStore = useAuth()
    const encryptedPrivKey = useLocalStorage(AUTH_LOCAL_STORAGE_KEY, '')
    return {
      authStore,
      encryptedPrivKey
    }
  },
  methods: {
    onLogout() {
      this.authStore.logout()
    }
  },
  computed: {
    ...mapState(useAuth, ['authMethod']),
    hasEncryptedKey(): boolean {
      return this.encryptedPrivKey !== ''
    },
    isLoggedIn(): boolean {
      return this.authMethod !== AuthMethod.NOT_SET
    }
  }
})
</script>