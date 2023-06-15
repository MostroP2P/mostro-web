<template>
  <v-dialog v-model="showDialog" width="500">
    <v-progress-linear v-if="isProcessing" indeterminate/>
    <template v-slot:activator="{ on, attrs}">
      <v-btn v-on="on" v-bind="attrs" outlined class="mt-4">
        <KeyIcon class="mr-3"/>
        Login
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Login method</v-card-title>
      <v-tabs v-model="tab">
        <v-tab>Nsec</v-tab>
        <v-tab>Alby</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tab">
        <v-tab-item style="min-height: 5em">
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
              color="primary"
              :disabled="!validPassword || isProcessing"
              @click="onPassword"
            >
              Enter
            </v-btn>
          </v-row>
        </v-tab-item>
        <v-tab-item style="min-height: 5em">
          <v-row class="mx-4 my-5 d-flex justify-center">
            <v-btn
              color="primary"
              :disabled="!hasNIP07"
            >
              Request
            </v-btn>
          </v-row>
        </v-tab-item>
      </v-tabs-items>

    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import secretValidator from '~/mixins/secret-validator'
import crypto from '~/mixins/crypto'
import * as CryptoJS from 'crypto-js'
import { EncryptedPrivateKey } from '~/store/types'

// Minimum password length
const MIN_PASSWORD_LENGTH = 10

interface Data {
  MIN_PASSWORD_LENGTH: number,
  showDialog: boolean,
  tab: any,
  password: string,
  isProcessing: boolean
}

interface Methods {
  onPassword: Function
}

interface Computed {
  hasNIP07: Function,
  validPassword: boolean,
  encryptedPrivateKey: EncryptedPrivateKey
}

export default Vue.extend<Data, Methods, Computed>({
  data() {
    return {
      MIN_PASSWORD_LENGTH,
      showDialog: false,
      tab: null,
      password: '',
      isProcessing: false
    }
  },
  mixins: [secretValidator, crypto],
  methods: {
    async onPassword() {
      this.isProcessing = true
      try {
        const salt = Buffer.from(this.encryptedPrivateKey.salt, 'base64')
        const ciphertext = this.encryptedPrivateKey.ciphertext
        // @ts-ignore
        const key = await this.deriveKey(this.password, salt, ['encrypt', 'decrypt'])
        let rawKey = await window.crypto.subtle.exportKey('raw', key)
        let rawKeyBytes = Buffer.from(rawKey)
        let base64Key = rawKeyBytes.toString('base64')
        console.log('Decrypting with key: ', base64Key)
        const plaintext = CryptoJS.AES.decrypt(ciphertext, base64Key).toString()
        const nsec = Buffer.from(plaintext, 'hex').toString('utf8')
        this.$store.dispatch('auth/setKey', { nsec })
        this.showDialog = false
      } catch(err) {
        console.error('Error while generating encryption key. Err: ', err)
      } finally {
        this.isProcessing = false
      }
    }
  },
  computed: {
    hasNIP07() {
      // @ts-ignore
      return window && window.nostr
    },
    validPassword() {
      return this.password !== '' && this.password.length >= this.MIN_PASSWORD_LENGTH
    },
    ...mapState('auth', ['encryptedPrivateKey'])
  }
})
</script>