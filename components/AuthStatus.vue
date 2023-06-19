<template>
  <v-list-item class="d-flex justify-center align-center flex-column mt-0 pt-2">
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
  </v-list-item>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import { EncryptedPrivateKey } from '~/store/types'
import RegistrationDialog from './RegistrationDialog.vue'
import { AuthMethod } from '~/store/auth'

interface Data {}

interface Computed {
  encryptedPrivateKey: EncryptedPrivateKey,
  hasEncryptedKey: boolean,
  authMethod: AuthMethod,
  isLoggedIn: boolean
}

interface Methods {
  onLogout: Function
}

export default Vue.extend<Data, Methods, Computed>({
  components: { RegistrationDialog },
  methods: {
    onLogout() {
      this.$store.dispatch('auth/logout')
    }
  },
  computed: {
    ...mapState('auth', ['encryptedPrivateKey', 'authMethod']),
    hasEncryptedKey(): boolean {
      return this.encryptedPrivateKey !== null && this.encryptedPrivateKey !== undefined
    },
    isLoggedIn(): boolean {
      return this.authMethod !== AuthMethod.NOT_SET
    }
  }
})
</script>