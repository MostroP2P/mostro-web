<template>
  <v-dialog v-model="showDialog" width="500">
    <v-progress-linear v-if="isProcessing" indeterminate/>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" outlined class="mt-4">
        <KeyIcon class="mr-3"/>
        Register
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Registration method</v-card-title>
      <v-tabs v-model="tab">
        <v-tab>Nsec</v-tab>
        <v-tab>NIP07</v-tab>
      </v-tabs>
      <v-window v-model="tab">
        <v-window-item style="min-height: 5em">
          <v-row class="mx-4 mt-5">
            <v-text-field
              v-model="nsec"
              outlined
              :rules="[
                (v) => rules.isNotEmpty(v),
                (v) => rules.isValidNsec(v) || rules.isValidHex(v) || 'Not a valid NSEC or HEX'
              ]"
              label="Enter your nsec or hex"
              :disabled="isProcessing"
              :type="nsecVisible ? 'text' : 'password'"
              :append-icon="nsecVisible ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="toggleNsecVisibility"
            >
            </v-text-field>
          </v-row>
          <v-row class="mx-4">
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
          <v-row class="mx-4">
            <v-text-field
              v-model="confirmation"
              outlined
              label="Password confirmation"
              type="password"
              :disabled="isProcessing"
              :rules="[
                v => !!v || 'You must confirm your password',
                v => v === password || 'Your confirmation must match the password'
              ]"
            >
            </v-text-field>
          </v-row>
          <v-row class="mx-4 mb-5">
            <v-btn
              color="primary"
              :disabled="!validSecret || !validPassword || !validConfirmation || isProcessing"
              @click="onPrivateKeyConfirmed"
            >
              Confirm
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
import * as CryptoJS from 'crypto-js'
import secretValidator from '~/mixins/secret-validator'
import crypto from '~/mixins/crypto'
import nip07 from '~/mixins/nip-07'
import { ENCRYPTED_PRIVATE_KEY } from '~/stores/types'
import { AuthMethod, useAuth } from '~/stores/auth'

// Minimum password length
const MIN_PASSWORD_LENGTH = 10

export default {
  data() {
    return {
      MIN_PASSWORD_LENGTH,
      showDialog: false,
      tab: null,
      nsec: '',
      nsecVisible: false,
      password: '',
      confirmation: '',
      worker: null,
      isProcessing: false
    }
  },
  setup() {
    const authStore = useAuth()
    return { authStore }
  },
  mixins: [secretValidator, crypto, nip07],
  methods: {
    toggleNsecVisibility() {
      this.nsecVisible = !this.nsecVisible
    },
    async onPrivateKeyConfirmed() {
      this.isProcessing = true
      try {
        // @ts-ignore
        const salt = this.generateSalt()
        // @ts-ignore
        const key = await this.deriveKey(this.password, salt, ['encrypt', 'decrypt'])
        let rawKey = await window.crypto.subtle.exportKey('raw', key)
        let rawKeyBytes = Buffer.from(rawKey)
        let base64Key = rawKeyBytes.toString('base64')
        const ciphertext = CryptoJS.AES.encrypt(this.nsec, base64Key).toString()
        localStorage.setItem(
          ENCRYPTED_PRIVATE_KEY,
          JSON.stringify({ ciphertext, salt: salt.toString('base64') })
        )
        this.authStore.setKey({ nsec: this.nsec })
        this.authStore.login({
          nsec: this.nsec,
          authMethod: AuthMethod.LOCAL
        })
      } catch(err) {
        console.error('Error while generating encryption key. Err: ', err)
      } finally {
        this.isProcessing = false
      }
    },
    async onNip07() {
      // @ts-ignore
      const publicKey = await this.getPublicKey()
      this.authStore.login({
        authMethod: AuthMethod.NIP07,
        publicKey: publicKey
      })
      this.showDialog = false
    }
  },
  computed: {
    hasNIP07() {
      // @ts-ignore
      return window && window.nostr
    },
    validSecret() {
      const v = this.nsec
      // @ts-ignore
      return this.rules.isNotEmpty(v) && this.rules.isValidNsec(v) || this.rules.isValidHex(v)
    },
    validPassword() {
      return this.password && this.password.length >= this.MIN_PASSWORD_LENGTH
    },
    validConfirmation() {
      return this.confirmation && this.confirmation === this.password
    }
  }
}
</script>