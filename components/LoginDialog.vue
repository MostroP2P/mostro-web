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
        <v-tab prepend-icon="mdi-key">Nsec</v-tab>
        <v-tab prepend-icon="mdi-puzzle">Extension</v-tab>
      </v-tabs>
      <v-window v-model="tab">
        <v-window-item style="min-height: 5em">
          <v-row class="mx-4 my-5">
            <v-text-field
              v-model="password"
              outlined
              label="Password"
              type="password"
              :disabled="isProcessing"
              @input="errorMessage = ''"
              :rules="[
                v => !!v || 'You need a password',
                v => validPassword || `Your password cannot be shorter than ${MIN_PASSWORD_LENGTH}`
              ]"
              :error-messages="errorMessage"
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

<script lang="ts" setup>
import CryptoJS from 'crypto-js'
import { AuthMethod, useAuth } from '@/stores/auth'
import type { LocalLoginPayload } from '@/stores/auth'
import { useCrypto } from '~/composables/useCrypto'
import { useNip07 } from '~/composables/useNip07'

// Minimum password length
const MIN_PASSWORD_LENGTH = 10

const authStore = useAuth()
const showDialog = ref<boolean>(false)
const tab = ref<number | null>(null)
const password = ref<string>('')
const isProcessing = ref<boolean>(false)
const errorMessage = ref<string>()

const onPassword = async () => {
  isProcessing.value = true
  if (!authStore.encryptedPrivateKey) {
    console.warn('No encrypted private key found in local storage')
    return
  }
  try {
    let encryptedPrivateKey = authStore.encryptedPrivateKey
    const salt = Buffer.from(encryptedPrivateKey.salt, 'base64')
    const ciphertext = encryptedPrivateKey.ciphertext
    const { deriveKey } = useCrypto()
    const key = await deriveKey(password.value, salt.toString('base64'), ['encrypt', 'decrypt'])
    let rawKey = await window.crypto.subtle.exportKey('raw', key)
    let rawKeyBytes = Buffer.from(rawKey)
    let base64Key = rawKeyBytes.toString('base64')
    const plaintext = CryptoJS.AES.decrypt(ciphertext, base64Key).toString()
    const privKey = Buffer.from(plaintext, 'hex').toString('utf8')
    if (!privKey) {
      throw Error('Invalid password')
    }
    const localLoginPayload: LocalLoginPayload = {
      privateKey: privKey,
      authMethod: AuthMethod.LOCAL
    }
    authStore.login(localLoginPayload)
    showDialog.value = false
  } catch(err) {
    console.warn('Login error: ', err)
    errorMessage.value = 'Invalid password'
  } finally {
    isProcessing.value = false
  }
}

const onNip07 = async () => {
  const { getPublicKey } = useNip07()
  const publicKey = await getPublicKey()
  if (!publicKey) {
    console.error('Found no public key')
    return
  }
  authStore.login({ authMethod: AuthMethod.NIP07, publicKey })
  showDialog.value = false
}

const onDelete = () => {
  authStore.delete()
  showDialog.value = false
}

const hasNIP07 = computed(() => {
  return window && window.nostr
})

const validPassword = computed(() => {
  return password.value !== '' && password.value.length >= MIN_PASSWORD_LENGTH
})
</script>