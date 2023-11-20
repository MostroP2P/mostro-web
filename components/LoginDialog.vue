<template>
  <v-dialog v-model="showDialog" width="500">
    <v-progress-linear v-if="isProcessing" indeterminate/>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" outlined class="mt-4">
        <KeyIcon class="mr-3"/>
        Login
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Login method</v-card-title>
      <v-tabs v-model="tab">
        <v-tab>Nsec</v-tab>
        <v-tab>NIP07</v-tab>
      </v-tabs>
      <v-window v-model="tab">
        <v-window-item style="min-height: 5em">
          <v-row class="mx-4 mt-5">
            <v-text-field
              v-model="password"
              outlined
              label="Password"
              type="password"
              :disabled="isProcessing"
              :rules="[
                v => !!v || 'You need a password',
                v => validPassword || `Your password cannot be shorter than ${MIN_PASSWORD_LENGTH}`
              ]"
            >
            </v-text-field>
          </v-row>
          <v-row class="mx-4 mb-5">
            <v-btn
              color="error"
              prepend-icon="mdi-delete"
              :disabled="isProcessing"
              @click="onDelete"
            >
              Delete
            </v-btn>
            <v-spacer/>
            <v-btn
              color="primary"
              :disabled="!validPassword || isProcessing"
              @click="onPassword"
            >
              Enter
            </v-btn>
          </v-row>
        </v-window-item>
        <v-window-item style="min-height: 5em">
          <v-row class="mx-4 my-5 d-flex justify-center">
            <div class="body-2">
              If you have a browser extension that supports the NIP-07 standard, you can use it to login.
            </div>
          </v-row>
          <v-row class="mx-4 my-5 d-flex justify-center">
            <v-btn
              color="primary"
              :disabled="!hasNIP07"
              @click="onNip07"
            >
              Authorize
            </v-btn>
          </v-row>
        </v-window-item>
      </v-window>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import * as CryptoJS from 'crypto-js'
import secretValidator from '~/mixins/secret-validator'
import crypto from '~/mixins/crypto'
import nip07 from '~/mixins/nip-07'
import { AuthMethod, LocalLoginPayload, useAuth } from '@/stores/auth'
import { AUTH_LOCAL_STORAGE_DECRYPTED_KEY, AUTH_LOCAL_STORAGE_ENCRYPTED_KEY } from '@/stores/types'

// Minimum password length
const MIN_PASSWORD_LENGTH = 10

export default defineComponent({
  setup() {
    const authStore = useAuth()
    const encryptedPrivKey = useLocalStorage(AUTH_LOCAL_STORAGE_ENCRYPTED_KEY, '')
    const decryptedPrivKey = useLocalStorage(AUTH_LOCAL_STORAGE_DECRYPTED_KEY, '')
    return {
      authStore,
      encryptedPrivKey,
      decryptedPrivKey
    }
  },
  data() {
    return {
      MIN_PASSWORD_LENGTH,
      showDialog: false,
      tab: null,
      password: '',
      isProcessing: false
    }
  },
  mixins: [secretValidator, crypto, nip07],
  methods: {
    async onPassword() {
      this.isProcessing = true
      try {
        const encryptedPrivateKey = JSON.parse(this.encryptedPrivKey)
        if (encryptedPrivateKey) {
          const salt = Buffer.from(encryptedPrivateKey.salt, 'base64')
          const ciphertext = encryptedPrivateKey.ciphertext
          // @ts-ignore
          const key = await this.deriveKey(this.password, salt, ['encrypt', 'decrypt'])
          let rawKey = await window.crypto.subtle.exportKey('raw', key)
          let rawKeyBytes = Buffer.from(rawKey)
          let base64Key = rawKeyBytes.toString('base64')
          const plaintext = CryptoJS.AES.decrypt(ciphertext, base64Key).toString()
          // Store the decrypted key in local storage
          const nsec = Buffer.from(plaintext, 'hex').toString('utf8')
          this.decryptedPrivKey = nsec
          const localLoginPayload: LocalLoginPayload = {
            privateKey: nsec,
            authMethod: AuthMethod.LOCAL
          }
          this.authStore.login(localLoginPayload)
          this.showDialog = false
        } else {
          console.warn('The encrypted private key was not found')
        }
      } catch(err) {
        console.error('Error while generating encryption key. Err: ', err)
      } finally {
        this.isProcessing = false
      }
    },
    async onNip07() {
      // @ts-ignore
      const publicKey = await this.getPublicKey()
      this.authStore.login({ authMethod: AuthMethod.NIP07, publicKey })
      this.showDialog = false
    },
    onDelete() {
      this.decryptedPrivKey = ''
      this.encryptedPrivKey = ''
      this.authStore.logout()
      this.showDialog = false
    }
  },
  computed: {
    hasNIP07() {
      // @ts-ignore
      return window && window.nostr
    },
    validPassword() {
      return this.password !== '' && this.password.length >= this.MIN_PASSWORD_LENGTH
    }
  }
})
</script>